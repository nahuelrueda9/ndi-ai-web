import * as dns from "node:dns/promises";
import * as http from "node:http";
import * as https from "node:https";
import {
  isIP,
} from "node:net";

import * as cheerio from "cheerio";
import {
  FieldValue,
} from "firebase-admin/firestore";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type ImportarSitioBody = {
  empresaId?: string;
  url?: string;
};

type ResultadoDescarga = {
  html: string;
  urlFinal: string;
  contentType: string;
};

const MAX_URL_LENGTH = 2_000;
const MAX_RESPONSE_BYTES =
  2 * 1024 * 1024;
const MAX_CONTENT_CHARACTERS =
  100_000;
const CHUNK_SIZE = 1_500;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 12_000;

function obtenerBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

function esIdFirestoreValido(
  valor: string
) {
  return (
    valor.length > 0 &&
    valor.length <= 200 &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

function esIpv4Publica(
  direccion: string
) {
  const partes = direccion
    .split(".")
    .map(Number);

  if (
    partes.length !== 4 ||
    partes.some(
      (numero) =>
        !Number.isInteger(numero) ||
        numero < 0 ||
        numero > 255
    )
  ) {
    return false;
  }

  const [a, b, c] = partes;

  if (a === 0 || a === 10) {
    return false;
  }

  if (
    a === 100 &&
    b >= 64 &&
    b <= 127
  ) {
    return false;
  }

  if (a === 127) {
    return false;
  }

  if (
    a === 169 &&
    b === 254
  ) {
    return false;
  }

  if (
    a === 172 &&
    b >= 16 &&
    b <= 31
  ) {
    return false;
  }

  if (
    a === 192 &&
    b === 0 &&
    c === 0
  ) {
    return false;
  }

  if (
    a === 192 &&
    b === 0 &&
    c === 2
  ) {
    return false;
  }

  if (
    a === 192 &&
    b === 168
  ) {
    return false;
  }

  if (
    a === 198 &&
    (b === 18 || b === 19)
  ) {
    return false;
  }

  if (
    a === 198 &&
    b === 51 &&
    c === 100
  ) {
    return false;
  }

  if (
    a === 203 &&
    b === 0 &&
    c === 113
  ) {
    return false;
  }

  if (a >= 224) {
    return false;
  }

  return true;
}

function esIpv6Publica(
  direccion: string
) {
  const valor = direccion
    .toLowerCase()
    .split("%")[0];

  if (
    valor === "::" ||
    valor === "::1"
  ) {
    return false;
  }

  if (
    valor.startsWith("fc") ||
    valor.startsWith("fd")
  ) {
    return false;
  }

  if (
    /^fe[89ab]/.test(valor)
  ) {
    return false;
  }

  if (valor.startsWith("ff")) {
    return false;
  }

  if (
    valor.startsWith(
      "2001:db8"
    )
  ) {
    return false;
  }

  const ipv4Mapeada =
    valor.match(
      /::ffff:(\d+\.\d+\.\d+\.\d+)$/
    );

  if (ipv4Mapeada) {
    return esIpv4Publica(
      ipv4Mapeada[1]
    );
  }

  return true;
}

function esDireccionPublica(
  direccion: string
) {
  const version =
    isIP(direccion);

  if (version === 4) {
    return esIpv4Publica(
      direccion
    );
  }

  if (version === 6) {
    return esIpv6Publica(
      direccion
    );
  }

  return false;
}

function validarUrlInicial(
  valor: string
) {
  if (
    !valor ||
    valor.length >
      MAX_URL_LENGTH
  ) {
    throw new Error(
      "La URL no es válida."
    );
  }

  let url: URL;

  try {
    url = new URL(valor);
  } catch {
    throw new Error(
      "La URL no es válida."
    );
  }

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    throw new Error(
      "Solo se permiten URLs HTTP o HTTPS."
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "La URL no puede incluir usuario ni contraseña."
    );
  }

  if (url.port) {
    throw new Error(
      "No se permiten puertos personalizados."
    );
  }

  const hostname =
    url.hostname
      .toLowerCase()
      .replace(/\.$/, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(
      ".localhost"
    ) ||
    hostname.endsWith(
      ".local"
    ) ||
    hostname.endsWith(
      ".internal"
    )
  ) {
    throw new Error(
      "No se permiten direcciones internas."
    );
  }

  url.hash = "";

  return url;
}

async function resolverDestinoPublico(
  url: URL
) {
  const hostname =
    url.hostname
      .toLowerCase()
      .replace(/\.$/, "");

  if (isIP(hostname)) {
    if (
      !esDireccionPublica(
        hostname
      )
    ) {
      throw new Error(
        "No se permiten direcciones internas o reservadas."
      );
    }

    return {
      address: hostname,
      family:
        isIP(hostname) as 4 | 6,
    };
  }

  const resultados =
    await dns.lookup(
      hostname,
      {
        all: true,
        verbatim: true,
      }
    );

  if (
    resultados.length === 0
  ) {
    throw new Error(
      "No se pudo resolver el dominio."
    );
  }

  if (
    resultados.some(
      (resultado) =>
        !esDireccionPublica(
          resultado.address
        )
    )
  ) {
    throw new Error(
      "El dominio apunta a una dirección interna o reservada."
    );
  }

  return resultados[0];
}

async function descargarUrlSegura(
  valorUrl: string,
  redirecciones = 0
): Promise<ResultadoDescarga> {
  if (
    redirecciones >
    MAX_REDIRECTS
  ) {
    throw new Error(
      "El sitio realizó demasiadas redirecciones."
    );
  }

  const url =
    validarUrlInicial(
      valorUrl
    );

  const destino =
    await resolverDestinoPublico(
      url
    );

  const lookupFijado:
    NonNullable<
      http.RequestOptions["lookup"]
    > = (
      _hostname,
      _opciones,
      callback
    ) => {
      callback(
        null,
        destino.address,
        destino.family
      );
    };

  return await new Promise(
    (
      resolve,
      reject
    ) => {
      const opcionesBase:
        http.RequestOptions = {
          protocol:
            url.protocol,
          hostname:
            url.hostname,
          port:
            url.protocol ===
            "https:"
              ? 443
              : 80,
          path:
            `${url.pathname}${url.search}`,
          method: "GET",
          lookup:
            lookupFijado,
          headers: {
            Host: url.host,
            "User-Agent":
              "NDI-AI-Knowledge-Importer/1.0",
            Accept:
              "text/html,application/xhtml+xml,text/plain;q=0.9",
            "Accept-Encoding":
              "identity",
          },
        };

      const manejarRespuesta = (
        response:
          http.IncomingMessage
      ) => {
            const status =
              response.statusCode ||
              0;

            if (
              [301, 302, 303, 307, 308]
                .includes(status)
            ) {
              const location =
                response.headers
                  .location;

              response.resume();

              if (!location) {
                reject(
                  new Error(
                    "La redirección no tiene destino."
                  )
                );
                return;
              }

              const siguienteUrl =
                new URL(
                  location,
                  url
                ).toString();

              resolve(
                descargarUrlSegura(
                  siguienteUrl,
                  redirecciones + 1
                )
              );
              return;
            }

            if (
              status < 200 ||
              status >= 300
            ) {
              response.resume();

              reject(
                new Error(
                  `El sitio respondió con estado ${status}.`
                )
              );
              return;
            }

            const contentType =
              String(
                response.headers[
                  "content-type"
                ] || ""
              )
                .toLowerCase()
                .split(";")[0]
                .trim();

            const permitido =
              contentType ===
                "text/html" ||
              contentType ===
                "text/plain" ||
              contentType ===
                "application/xhtml+xml";

            if (!permitido) {
              response.resume();

              reject(
                new Error(
                  "La URL no devuelve una página HTML o texto."
                )
              );
              return;
            }

            const contentLength =
              Number(
                response.headers[
                  "content-length"
                ] || 0
              );

            if (
              Number.isFinite(
                contentLength
              ) &&
              contentLength >
                MAX_RESPONSE_BYTES
            ) {
              response.resume();

              reject(
                new Error(
                  "La página es demasiado grande."
                )
              );
              return;
            }

            const partes:
              Buffer[] = [];

            let totalBytes = 0;

            response.on(
              "data",
              (
                parte:
                  Buffer | string
              ) => {
                const buffer =
                  Buffer.isBuffer(
                    parte
                  )
                    ? parte
                    : Buffer.from(
                        parte
                      );

                totalBytes +=
                  buffer.length;

                if (
                  totalBytes >
                  MAX_RESPONSE_BYTES
                ) {
                  request.destroy(
                    new Error(
                      "La página es demasiado grande."
                    )
                  );
                  return;
                }

                partes.push(
                  buffer
                );
              }
            );

            response.on(
              "end",
              () => {
                resolve({
                  html:
                    Buffer.concat(
                      partes
                    ).toString(
                      "utf8"
                    ),
                  urlFinal:
                    url.toString(),
                  contentType,
                });
              }
            );

            response.on(
              "error",
              reject
            );
          };

      const request =
        url.protocol === "https:"
          ? https.request(
              {
                ...opcionesBase,
                servername:
                  url.hostname,
              },
              manejarRespuesta
            )
          : http.request(
              opcionesBase,
              manejarRespuesta
            );

      request.setTimeout(
        REQUEST_TIMEOUT_MS,
        () => {
          request.destroy(
            new Error(
              "El sitio tardó demasiado en responder."
            )
          );
        }
      );

      request.on(
        "error",
        reject
      );

      request.end();
    }
  );
}

async function verificarPermiso({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}) {
  const empresaReferencia =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnapshot =
    await empresaReferencia.get();

  if (!empresaSnapshot.exists) {
    return {
      permitido: false,
      status: 404,
      error:
        "La empresa no existe.",
    };
  }

  const empresa =
    empresaSnapshot.data();

  if (empresa?.userId === uid) {
    return {
      permitido: true,
      status: 200,
      error: "",
    };
  }

  const miembroSnapshot =
    await empresaReferencia
      .collection("members")
      .doc(uid)
      .get();

  const miembro =
    miembroSnapshot.data();

  const permitido =
    miembroSnapshot.exists &&
    miembro?.estado === "activo" &&
    (
      miembro?.rol ===
        "administrador" ||
      miembro?.rol ===
        "supervisor"
    );

  return {
    permitido,
    status: permitido ? 200 : 403,
    error: permitido
      ? ""
      : "No tenés permisos para importar conocimiento.",
  };
}

function extraerContenido(
  html: string,
  contentType: string
) {
  if (
    contentType ===
    "text/plain"
  ) {
    return {
      titulo: "Sitio web",
      contenido: html
        .replace(/\s+/g, " ")
        .trim(),
    };
  }

  const $ =
    cheerio.load(html);

  $(
    [
      "script",
      "style",
      "noscript",
      "header",
      "footer",
      "nav",
      "iframe",
      "object",
      "embed",
      "form",
      "button",
      "input",
      "svg",
    ].join(",")
  ).remove();

  const titulo =
    $("title")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

  const contenido =
    $("main")
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    $("article")
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

  return {
    titulo,
    contenido,
  };
}

function dividirContenido(
  contenido: string
) {
  const partes:
    string[] = [];

  let restante =
    contenido.slice(
      0,
      MAX_CONTENT_CHARACTERS
    );

  while (restante.length > 0) {
    if (
      restante.length <=
      CHUNK_SIZE
    ) {
      partes.push(
        restante.trim()
      );
      break;
    }

    const fragmento =
      restante.slice(
        0,
        CHUNK_SIZE
      );

    const ultimoEspacio =
      fragmento.lastIndexOf(
        " "
      );

    const corte =
      ultimoEspacio >=
      CHUNK_SIZE * 0.6
        ? ultimoEspacio
        : CHUNK_SIZE;

    partes.push(
      restante
        .slice(0, corte)
        .trim()
    );

    restante =
      restante
        .slice(corte)
        .trim();
  }

  return partes.filter(
    Boolean
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const idToken =
      obtenerBearerToken(
        request
      );

    if (!idToken) {
      return NextResponse.json(
        {
          error:
            "Tenés que iniciar sesión.",
        },
        {
          status: 401,
        }
      );
    }

    let usuario;

    try {
      usuario =
        await adminAuth.verifyIdToken(
          idToken
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o venció.",
        },
        {
          status: 401,
        }
      );
    }

    let body:
      ImportarSitioBody;

    try {
      body =
        (await request.json()) as ImportarSitioBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaId =
      body.empresaId?.trim() ||
      "";

    const urlSolicitada =
      body.url?.trim() || "";

    if (
      !esIdFirestoreValido(
        empresaId
      ) ||
      !urlSolicitada
    ) {
      return NextResponse.json(
        {
          error:
            "empresaId y url son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const permiso =
      await verificarPermiso({
        empresaId,
        uid: usuario.uid,
      });

    if (!permiso.permitido) {
      return NextResponse.json(
        {
          error:
            permiso.error,
        },
        {
          status:
            permiso.status,
        }
      );
    }

    const pagina =
      await descargarUrlSegura(
        urlSolicitada
      );

    const extraido =
      extraerContenido(
        pagina.html,
        pagina.contentType
      );

    const contenido =
      extraido.contenido
        .slice(
          0,
          MAX_CONTENT_CHARACTERS
        )
        .trim();

    if (
      contenido.length < 50
    ) {
      return NextResponse.json(
        {
          error:
            "No se encontró contenido suficiente.",
        },
        {
          status: 400,
        }
      );
    }

    const titulo =
      extraido.titulo ||
      new URL(
        pagina.urlFinal
      ).hostname;

    const partes =
      dividirContenido(
        contenido
      );

    if (
      partes.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo dividir el contenido.",
        },
        {
          status: 400,
        }
      );
    }

    const conocimientoColeccion =
      adminDb
        .collection("companies")
        .doc(empresaId)
        .collection("knowledge");

    const importId =
      conocimientoColeccion
        .doc().id;

    const batch =
      adminDb.batch();

    partes.forEach(
      (texto, index) => {
        const referencia =
          conocimientoColeccion
            .doc();

        batch.set(
          referencia,
          {
            tipo: "website",
            type: "website",
            titulo,
            title: titulo,
            contenido: texto,
            content: texto,
            sourceUrl:
              pagina.urlFinal,
            originalUrl:
              urlSolicitada,
            importId,
            chunkIndex: index,
            totalChunks:
              partes.length,
            createdBy:
              usuario.uid,
            createdAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );
      }
    );

    await batch.commit();

    return NextResponse.json({
      success: true,
      chunks:
        partes.length,
      importId,
      title: titulo,
      sourceUrl:
        pagina.urlFinal,
    });
  } catch (error) {
    console.error(
      "Error importando sitio web:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo importar el sitio.",
      },
      {
        status: 400,
      }
    );
  }
}