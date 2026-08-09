import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebaseAdmin";

import {
  crearNotificacion,
} from "@/lib/notifications/notificationService";

export const runtime = "nodejs";

type MessengerMessage = {
  mid?: string;
  text?: string;
  is_echo?: boolean;
  attachments?: unknown[];
};

type MessengerMessagingEvent = {
  sender?: {
    id?: string;
  };
  recipient?: {
    id?: string;
  };
  timestamp?: number;
  message?: MessengerMessage;
};

type MessengerEntry = {
  id?: string;
  time?: number;
  messaging?: MessengerMessagingEvent[];
};

type MessengerWebhookBody = {
  object?: string;
  entry?: MessengerEntry[];
};

type RolMensaje =
  | "user"
  | "assistant";

type MensajeHistorial = {
  role: RolMensaje;
  content: string;
};

type GeminiResponse = {
  respuesta?: string;
  error?: string;
};

type RespuestaEnvioMessenger = {
  recipient_id?: string;
  message_id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type SecretoCandidato = {
  nombre: string;
  valor: string;
};

function limpiarValor(
  valor?: string
) {
  if (!valor) {
    return "";
  }

  let limpio =
    valor.trim();

  if (
    (
      limpio.startsWith('"') &&
      limpio.endsWith('"')
    ) ||
    (
      limpio.startsWith("'") &&
      limpio.endsWith("'")
    )
  ) {
    limpio =
      limpio
        .slice(1, -1)
        .trim();
  }

  return limpio;
}

function obtenerVerifyToken() {
  return limpiarValor(
    process.env
      .MESSENGER_VERIFY_TOKEN
  );
}

function obtenerSecretosCandidatos():
  SecretoCandidato[] {
  const candidatos:
    SecretoCandidato[] = [
      {
        nombre:
          "META_APP_SECRET",
        valor: limpiarValor(
          process.env
            .META_APP_SECRET
        ),
      },
      {
        nombre:
          "MESSENGER_APP_SECRET",
        valor: limpiarValor(
          process.env
            .MESSENGER_APP_SECRET
        ),
      },
    ];

  const vistos =
    new Set<string>();

  return candidatos.filter(
    (candidato) => {
      if (!candidato.valor) {
        return false;
      }

      if (
        vistos.has(
          candidato.valor
        )
      ) {
        return false;
      }

      vistos.add(
        candidato.valor
      );

      return true;
    }
  );
}

function verificarFirmaConSecreto({
  cuerpoCrudo,
  firmaRecibida,
  appSecret,
}: {
  cuerpoCrudo: Buffer;
  firmaRecibida: string;
  appSecret: string;
}) {
  const firmaNormalizada =
    firmaRecibida
      .trim()
      .toLowerCase();

  if (
    !firmaNormalizada
      .startsWith("sha256=")
  ) {
    return false;
  }

  const firmaHex =
    firmaNormalizada.slice(
      "sha256=".length
    );

  if (
    !/^[a-f0-9]{64}$/.test(
      firmaHex
    )
  ) {
    return false;
  }

  const firmaEsperada =
    createHmac(
      "sha256",
      appSecret
    )
      .update(cuerpoCrudo)
      .digest();

  const firmaRecibidaBuffer =
    Buffer.from(
      firmaHex,
      "hex"
    );

  if (
    firmaEsperada.length !==
    firmaRecibidaBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firmaEsperada,
    firmaRecibidaBuffer
  );
}

function verificarFirmaMeta({
  cuerpoCrudo,
  firmaRecibida,
}: {
  cuerpoCrudo: Buffer;
  firmaRecibida: string | null;
}) {
  if (!firmaRecibida) {
    return {
      valida: false,
      secretoUsado: null as
        | string
        | null,
    };
  }

  const secretos =
    obtenerSecretosCandidatos();

  for (
    const secreto of secretos
  ) {
    if (
      verificarFirmaConSecreto({
        cuerpoCrudo,
        firmaRecibida,
        appSecret:
          secreto.valor,
      })
    ) {
      return {
        valida: true,
        secretoUsado:
          secreto.nombre,
      };
    }
  }

  return {
    valida: false,
    secretoUsado: null as
      | string
      | null,
  };
}

async function buscarEmpresaPorMessenger(
  pageId: string
) {
  const snapshot =
    await adminDb
      .collectionGroup(
        "integrations"
      )
      .where(
        "pageId",
        "==",
        pageId
      )
      .limit(10)
      .get();

  if (snapshot.empty) {
    return null;
  }

  const integracionDocumento =
    snapshot.docs.find(
      (documento) =>
        documento.id ===
        "messenger"
    ) ??
    snapshot.docs[0];

  const empresaReferencia =
    integracionDocumento
      .ref
      .parent
      .parent;

  if (!empresaReferencia) {
    return null;
  }

  return {
    empresaReferencia,
    integracionDocumento,
    integracion:
      integracionDocumento.data(),
  };
}

function obtenerTextoMensaje(
  evento:
    MessengerMessagingEvent
) {
  const texto =
    evento.message?.text
      ?.trim() ||
    "";

  return texto.slice(
    0,
    4096
  );
}

async function obtenerHistorialConversacion(
  conversacionReferencia:
    FirebaseFirestore.DocumentReference,
  mensajeActualId: string
): Promise<MensajeHistorial[]> {
  const mensajesSnapshot =
    await conversacionReferencia
      .collection("messages")
      .orderBy(
        "createdAt",
        "desc"
      )
      .limit(21)
      .get();

  return mensajesSnapshot.docs
    .filter(
      (documento) =>
        documento.id !==
        mensajeActualId
    )
    .map((documento) => {
      const data =
        documento.data();

      return {
        role:
          data.role ===
          "assistant"
            ? "assistant"
            : "user",
        content:
          typeof data.content ===
          "string"
            ? data.content.trim()
            : "",
      } as MensajeHistorial;
    })
    .filter(
      (mensaje) =>
        mensaje.content.length >
        0
    )
    .reverse()
    .slice(-20);
}

async function generarRespuestaConIA({
  request,
  mensaje,
  historial,
  empresa,
  empresaId,
  conversacionId,
}: {
  request: NextRequest;
  mensaje: string;
  historial:
    MensajeHistorial[];
  empresa:
    FirebaseFirestore.DocumentData;
  empresaId: string;
  conversacionId: string;
}) {
  const secretoInterno =
    process.env
      .INTERNAL_API_SECRET
      ?.trim();

  if (!secretoInterno) {
    throw new Error(
      "Falta configurar INTERNAL_API_SECRET."
    );
  }

  const urlGemini =
    new URL(
      "/api/gemini",
      request.nextUrl.origin
    );

  const respuesta =
    await fetch(
      urlGemini,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          "x-ndi-internal-secret":
            secretoInterno,
        },
        body: JSON.stringify({
          mensaje,
          historial,
          empresa,
          empresaId,
          chatId:
            conversacionId,
        }),
        cache: "no-store",
      }
    );

  const responseText =
    await respuesta.text();

  let data:
    GeminiResponse;

  try {
    data =
      JSON.parse(
        responseText
      ) as GeminiResponse;
  } catch {
    throw new Error(
      `La API de IA devolvió una respuesta inválida. Estado ${respuesta.status}.`
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      data.error ||
        `La IA respondió con estado ${respuesta.status}.`
    );
  }

  const texto =
    typeof data.respuesta ===
    "string"
      ? data.respuesta.trim()
      : "";

  if (!texto) {
    throw new Error(
      "La IA devolvió una respuesta vacía."
    );
  }

  return texto;
}

async function enviarMensajeMessenger({
  pageId,
  messengerSenderId,
  accessToken,
  texto,
}: {
  pageId: string;
  messengerSenderId: string;
  accessToken: string;
  texto: string;
}) {
  const version =
    process.env
      .MESSENGER_API_VERSION
      ?.trim() ||
    "v26.0";

  const response =
    await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(
        pageId
      )}/messages`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            recipient: {
              id:
                messengerSenderId,
            },
            message: {
              text:
                texto.slice(
                  0,
                  2000
                ),
            },
          }),
        cache: "no-store",
      }
    );

  const responseText =
    await response.text();

  let data:
    RespuestaEnvioMessenger;

  try {
    data =
      JSON.parse(
        responseText
      ) as RespuestaEnvioMessenger;
  } catch {
    throw new Error(
      `Messenger devolvió una respuesta inválida. Estado ${response.status}.`
    );
  }

  if (
    !response.ok ||
    data.error
  ) {
    throw new Error(
      data.error?.message ||
        `Messenger respondió con estado ${response.status}.`
    );
  }

  const messageId =
    data.message_id
      ?.trim();

  if (!messageId) {
    throw new Error(
      "Messenger no devolvió el ID del mensaje enviado."
    );
  }

  return messageId;
}

export async function GET(
  request: NextRequest
) {
  const verifyToken =
    obtenerVerifyToken();

  if (!verifyToken) {
    console.error(
      "Falta configurar MESSENGER_VERIFY_TOKEN."
    );

    return NextResponse.json(
      {
        error:
          "La verificación del webhook de Messenger no está configurada.",
      },
      {
        status: 500,
      }
    );
  }

  const searchParams =
    request.nextUrl
      .searchParams;

  const mode =
    searchParams.get(
      "hub.mode"
    );

  const token =
    searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    searchParams.get(
      "hub.challenge"
    );

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    challenge
  ) {
    return new NextResponse(
      challenge,
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/plain",
        },
      }
    );
  }

  return NextResponse.json(
    {
      error:
        "Verificación fallida.",
    },
    {
      status: 403,
    }
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const secretos =
      obtenerSecretosCandidatos();

    if (
      secretos.length === 0
    ) {
      console.error(
        "Falta configurar META_APP_SECRET o MESSENGER_APP_SECRET."
      );

      return NextResponse.json(
        {
          error:
            "La seguridad del webhook de Messenger no está configurada.",
        },
        {
          status: 500,
        }
      );
    }

    const arrayBuffer =
      await request.arrayBuffer();

    const cuerpoCrudo =
      Buffer.from(
        arrayBuffer
      );

    const firmaResultado =
      verificarFirmaMeta({
        cuerpoCrudo,
        firmaRecibida:
          request.headers.get(
            "x-hub-signature-256"
          ),
      });

    if (
      !firmaResultado.valida
    ) {
      console.warn(
        "Webhook de Messenger rechazado por firma inválida."
      );

      return NextResponse.json(
        {
          error:
            "Firma inválida.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "✅ Webhook de Messenger validado.",
      {
        secretoUsado:
          firmaResultado
            .secretoUsado,
        bodyBytes:
          cuerpoCrudo.length,
      }
    );

    let body:
      MessengerWebhookBody;

    try {
      body =
        JSON.parse(
          cuerpoCrudo.toString(
            "utf8"
          )
        ) as
          MessengerWebhookBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "El cuerpo del webhook no es JSON válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !==
        "object"
    ) {
      return NextResponse.json(
        {
          error:
            "El evento recibido no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.object !== "page"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    for (
      const entry of
      body.entry ?? []
    ) {
      for (
        const evento of
        entry.messaging ?? []
      ) {
        if (
          evento.message
            ?.is_echo === true
        ) {
          continue;
        }

        const pageId =
          entry.id?.trim() ||
          evento.recipient
            ?.id?.trim() ||
          "";

        const messengerSenderId =
          evento.sender
            ?.id?.trim() ||
          "";

        const messageId =
          evento.message
            ?.mid?.trim() ||
          "";

        if (
          !pageId ||
          !messengerSenderId ||
          !messageId
        ) {
          continue;
        }

        if (
          messengerSenderId ===
          pageId
        ) {
          continue;
        }

        const contenido =
          obtenerTextoMensaje(
            evento
          );

        if (!contenido) {
          console.log(
            `Mensaje de Messenger ${messageId} sin texto. Por ahora se ignoran adjuntos.`
          );

          continue;
        }

        const conexion =
          await buscarEmpresaPorMessenger(
            pageId
          );

        if (!conexion) {
          console.warn(
            `No se encontró una empresa conectada a la página de Facebook ${pageId}.`
          );

          continue;
        }

        const {
          empresaReferencia,
        } = conexion;

        const empresaId =
          empresaReferencia.id;

        const conversacionId =
          `messenger_${messengerSenderId}`;

        const conversacionReferencia =
          empresaReferencia
            .collection(
              "conversations"
            )
            .doc(
              conversacionId
            );

        const mensajeReferencia =
          conversacionReferencia
            .collection(
              "messages"
            )
            .doc(messageId);

        const resultado =
          await adminDb
            .runTransaction(
              async (
                transaction
              ) => {
                const [
                  mensajeExistente,
                  conversacionSnapshot,
                ] =
                  await Promise.all([
                    transaction.get(
                      mensajeReferencia
                    ),
                    transaction.get(
                      conversacionReferencia
                    ),
                  ]);

                if (
                  mensajeExistente
                    .exists
                ) {
                  return {
                    creado:
                      false,
                  };
                }

                const conversacionExistia =
                  conversacionSnapshot
                    .exists;

                const datosPrevios =
                  conversacionSnapshot
                    .data() ??
                  {};

                const nombreContacto =
                  typeof datosPrevios
                    .nombreContacto ===
                    "string" &&
                  datosPrevios
                    .nombreContacto
                    .trim()
                    ? datosPrevios
                        .nombreContacto
                        .trim()
                    : `Messenger ${messengerSenderId}`;

                transaction.set(
                  conversacionReferencia,
                  {
                    empresaId,
                    canal:
                      "messenger",
                    visitanteId:
                      messengerSenderId,
                    messengerScopedUserId:
                      messengerSenderId,
                    messengerPageId:
                      pageId,
                    pageId,
                    nombreContacto,
                    estado:
                      datosPrevios
                        .estado ===
                      "cerrada"
                        ? "abierta"
                        : datosPrevios
                            .estado ||
                          "abierta",
                    atendidoPor:
                      datosPrevios
                        .atendidoPor ??
                      "ia",
                    humanoActivo:
                      datosPrevios
                        .humanoActivo ===
                      true,
                    ultimoMensaje:
                      contenido,
                    ultimoRol:
                      "user",
                    cantidadMensajes:
                      FieldValue
                        .increment(
                          1
                        ),
                    updatedAt:
                      FieldValue
                        .serverTimestamp(),
                    ...(
                      !conversacionExistia
                        ? {
                            createdAt:
                              FieldValue
                                .serverTimestamp(),
                          }
                        : {}
                    ),
                  },
                  {
                    merge: true,
                  }
                );

                transaction.set(
                  mensajeReferencia,
                  {
                    role: "user",
                    content:
                      contenido,
                    enviadoPor:
                      "cliente",
                    canal:
                      "messenger",
                    messengerMessageId:
                      messageId,
                    messengerScopedUserId:
                      messengerSenderId,
                    pageId,
                    createdAt:
                      FieldValue
                        .serverTimestamp(),
                  }
                );

                return {
                  creado: true,
                };
              }
            );

        if (
          !resultado.creado
        ) {
          console.log(
            `Mensaje duplicado de Messenger ignorado: ${messageId}`
          );

          continue;
        }

        console.log(
          `📩 Mensaje de Messenger guardado para la empresa ${empresaId}.`
        );

        await crearNotificacion({
          empresaId,
          tipo: "mensaje",
          titulo:
            "Nuevo mensaje de Messenger",
          descripcion:
            `Messenger ${messengerSenderId}: ${contenido}`,
          chatId:
            conversacionId,
          visitanteId:
            messengerSenderId,
          url:
            `/empresas/${empresaId}/conversaciones/${conversacionId}`,
          metadata: {
            canal:
              "messenger",
            messengerMessageId:
              messageId,
            pageId,
          },
        });

        /*
         * Si una persona tomó
         * el control del chat,
         * guardamos el mensaje
         * pero la IA no responde.
         */
        const estadoConversacion =
          await conversacionReferencia
            .get();

        const datosConversacion =
          estadoConversacion
            .data() ??
          {};

        const humanoActivo =
          datosConversacion
            .humanoActivo ===
            true ||
          datosConversacion
            .atendidoPor ===
            "humano";

        if (humanoActivo) {
          console.log(
            `La conversación ${conversacionId} está siendo atendida por una persona.`
          );

          continue;
        }

        const integracion =
          conexion.integracion ??
          {};

        const accessToken =
          typeof integracion
            .accessToken ===
          "string"
            ? integracion
                .accessToken
                .trim()
            : "";

        if (!accessToken) {
          console.error(
            `La empresa ${empresaId} no tiene Page Access Token de Messenger.`
          );

          continue;
        }

        const empresaSnapshot =
          await empresaReferencia
            .get();

        if (
          !empresaSnapshot
            .exists
        ) {
          console.error(
            `La empresa ${empresaId} ya no existe.`
          );

          continue;
        }

        const empresa =
          empresaSnapshot
            .data() ??
          {};

        const historial =
          await obtenerHistorialConversacion(
            conversacionReferencia,
            messageId
          );

        let respuestaIA:
          string;

        try {
          respuestaIA =
            await generarRespuestaConIA({
              request,
              mensaje:
                contenido,
              historial,
              empresa,
              empresaId,
              conversacionId,
            });
        } catch (errorIA) {
          console.error(
            `No se pudo generar respuesta de IA para ${conversacionId}:`,
            errorIA
          );

          continue;
        }

        /*
         * Revisión final por
         * si una persona tomó
         * el chat mientras la
         * IA estaba generando.
         */
        const estadoAntesDeEnviar =
          await conversacionReferencia
            .get();

        const datosAntesDeEnviar =
          estadoAntesDeEnviar
            .data() ??
          {};

        const humanoTomoControl =
          datosAntesDeEnviar
            .humanoActivo ===
            true ||
          datosAntesDeEnviar
            .atendidoPor ===
            "humano";

        if (
          humanoTomoControl
        ) {
          console.log(
            `La respuesta automática de Messenger se canceló porque una persona tomó ${conversacionId}.`
          );

          continue;
        }

        const respuestaReferencia =
          conversacionReferencia
            .collection(
              "messages"
            )
            .doc(
              `ai_${messageId}`
            );

        const respuestaFueCreada =
          await adminDb
            .runTransaction(
              async (
                transaction
              ) => {
                const respuestaExistente =
                  await transaction
                    .get(
                      respuestaReferencia
                    );

                if (
                  respuestaExistente
                    .exists
                ) {
                  return false;
                }

                transaction.set(
                  respuestaReferencia,
                  {
                    role:
                      "assistant",
                    content:
                      respuestaIA,
                    enviadoPor:
                      "ia",
                    canal:
                      "messenger",
                    respuestaA:
                      messageId,
                    estadoEnvio:
                      "pendiente",
                    createdAt:
                      FieldValue
                        .serverTimestamp(),
                  }
                );

                transaction.set(
                  conversacionReferencia,
                  {
                    ultimoMensaje:
                      respuestaIA,
                    ultimoRol:
                      "assistant",
                    cantidadMensajes:
                      FieldValue
                        .increment(
                          1
                        ),
                    atendidoPor:
                      "ia",
                    humanoActivo:
                      false,
                    updatedAt:
                      FieldValue
                        .serverTimestamp(),
                  },
                  {
                    merge: true,
                  }
                );

                return true;
              }
            );

        if (
          !respuestaFueCreada
        ) {
          console.log(
            `La respuesta de Messenger para ${messageId} ya existía.`
          );

          continue;
        }

        try {
          const messengerMessageId =
            await enviarMensajeMessenger({
              pageId,
              messengerSenderId,
              accessToken,
              texto:
                respuestaIA,
            });

          await respuestaReferencia
            .set(
              {
                estadoEnvio:
                  "enviado",
                messengerMessageId,
                enviadoAt:
                  FieldValue
                    .serverTimestamp(),
              },
              {
                merge: true,
              }
            );

          console.log(
            `✅ La IA respondió por Messenger a ${messengerSenderId}.`
          );
        } catch (
          errorEnvio
        ) {
          console.error(
            `No se pudo enviar la respuesta por Messenger a ${messengerSenderId}:`,
            errorEnvio
          );

          await respuestaReferencia
            .set(
              {
                estadoEnvio:
                  "error",
                errorEnvio:
                  errorEnvio instanceof
                  Error
                    ? errorEnvio
                        .message
                    : "Error desconocido",
                updatedAt:
                  FieldValue
                    .serverTimestamp(),
              },
              {
                merge: true,
              }
            );
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Error procesando webhook de Messenger:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}