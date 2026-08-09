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

type InstagramMessage = {
  mid?: string;
  text?: string;
  is_echo?: boolean;
  attachments?: unknown[];
};

type InstagramMessagingEvent = {
  sender?: {
    id?: string;
  };
  recipient?: {
    id?: string;
  };
  timestamp?: number;
  message?: InstagramMessage;
};

type InstagramEntry = {
  id?: string;
  time?: number;
  messaging?: InstagramMessagingEvent[];
};

type InstagramWebhookBody = {
  object?: string;
  entry?: InstagramEntry[];
};

type RolMensaje = "user" | "assistant";

type MensajeHistorial = {
  role: RolMensaje;
  content: string;
};

type GeminiResponse = {
  respuesta?: string;
  error?: string;
};

type RespuestaEnvioInstagram = {
  recipient_id?: string;
  message_id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function obtenerVerifyToken() {
  return (
    process.env.INSTAGRAM_VERIFY_TOKEN?.trim() ||
    ""
  );
}

function obtenerAppSecret() {
  return (
    process.env.INSTAGRAM_APP_SECRET?.trim() ||
    process.env.META_APP_SECRET?.trim() ||
    ""
  );
}

function verificarFirmaMeta({
  cuerpoCrudo,
  firmaRecibida,
  appSecret,
}: {
  cuerpoCrudo: string;
  firmaRecibida: string | null;
  appSecret: string;
}) {
  if (
    !firmaRecibida ||
    !firmaRecibida.startsWith("sha256=")
  ) {
    return false;
  }

  const firmaHex = firmaRecibida
    .slice("sha256=".length)
    .trim()
    .toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(firmaHex)) {
    return false;
  }

  const firmaEsperadaHex = createHmac(
    "sha256",
    appSecret
  )
    .update(Buffer.from(cuerpoCrudo, "utf8"))
    .digest("hex");

  const firmaBuffer = Buffer.from(
    firmaHex,
    "hex"
  );

  const firmaEsperadaBuffer = Buffer.from(
    firmaEsperadaHex,
    "hex"
  );

  if (
    firmaBuffer.length !==
    firmaEsperadaBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firmaBuffer,
    firmaEsperadaBuffer
  );
}

async function buscarEmpresaPorInstagram(
  instagramAccountId: string
) {
  const snapshot = await adminDb
    .collectionGroup("integrations")
    .where(
      "instagramAccountId",
      "==",
      instagramAccountId
    )
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const integracionDocumento =
    snapshot.docs[0];

  const empresaReferencia =
    integracionDocumento.ref.parent.parent;

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
  evento: InstagramMessagingEvent
) {
  const texto =
    evento.message?.text?.trim() || "";

  return texto.slice(0, 4096);
}

async function obtenerHistorialConversacion(
  conversacionReferencia: FirebaseFirestore.DocumentReference,
  mensajeActualId: string
): Promise<MensajeHistorial[]> {
  const mensajesSnapshot =
    await conversacionReferencia
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(21)
      .get();

  return mensajesSnapshot.docs
    .filter(
      (documento) =>
        documento.id !== mensajeActualId
    )
    .map((documento) => {
      const data = documento.data();

      return {
        role:
          data.role === "assistant"
            ? "assistant"
            : "user",
        content:
          typeof data.content === "string"
            ? data.content.trim()
            : "",
      } as MensajeHistorial;
    })
    .filter(
      (mensaje) =>
        mensaje.content.length > 0
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
  historial: MensajeHistorial[];
  empresa: FirebaseFirestore.DocumentData;
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

  const urlGemini = new URL(
    "/api/gemini",
    request.nextUrl.origin
  );

  const respuesta = await fetch(
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
        chatId: conversacionId,
      }),
      cache: "no-store",
    }
  );

  const responseText =
    await respuesta.text();

  let data: GeminiResponse;

  try {
    data = JSON.parse(
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
    typeof data.respuesta === "string"
      ? data.respuesta.trim()
      : "";

  if (!texto) {
    throw new Error(
      "La IA devolvió una respuesta vacía."
    );
  }

  return texto;
}

async function enviarMensajeInstagram({
  instagramAccountId,
  instagramSenderId,
  accessToken,
  texto,
}: {
  instagramAccountId: string;
  instagramSenderId: string;
  accessToken: string;
  texto: string;
}) {
  const version =
    process.env
      .INSTAGRAM_API_VERSION
      ?.trim() ||
    "v26.0";

  const response = await fetch(
    `https://graph.instagram.com/${version}/${encodeURIComponent(
      instagramAccountId
    )}/messages`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        recipient: {
          id: instagramSenderId,
        },
        message: {
          text: texto.slice(
            0,
            1000
          ),
        },
      }),
      cache: "no-store",
    }
  );

  const responseText =
    await response.text();

  let data:
    RespuestaEnvioInstagram;

  try {
    data = JSON.parse(
      responseText
    ) as RespuestaEnvioInstagram;
  } catch {
    throw new Error(
      `Instagram devolvió una respuesta inválida. Estado ${response.status}.`
    );
  }

  if (
    !response.ok ||
    data.error
  ) {
    throw new Error(
      data.error?.message ||
        `Instagram respondió con estado ${response.status}.`
    );
  }

  const messageId =
    data.message_id?.trim();

  if (!messageId) {
    throw new Error(
      "Instagram no devolvió el ID del mensaje enviado."
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
      "Falta configurar INSTAGRAM_VERIFY_TOKEN."
    );

    return NextResponse.json(
      {
        error:
          "La verificación del webhook no está configurada.",
      },
      {
        status: 500,
      }
    );
  }

  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get("hub.verify_token");

  const challenge =
    searchParams.get("hub.challenge");

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
          "Content-Type": "text/plain",
        },
      }
    );
  }

  return NextResponse.json(
    {
      error: "Verificación fallida.",
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
    const appSecret =
      obtenerAppSecret();

    if (!appSecret) {
      console.error(
        "Falta configurar INSTAGRAM_APP_SECRET o META_APP_SECRET."
      );

      return NextResponse.json(
        {
          error:
            "La seguridad del webhook no está configurada.",
        },
        {
          status: 500,
        }
      );
    }

    const cuerpoCrudo =
      await request.text();

    const firmaValida =
      verificarFirmaMeta({
        cuerpoCrudo,
        firmaRecibida:
          request.headers.get(
            "x-hub-signature-256"
          ),
        appSecret,
      });

    if (!firmaValida) {
      console.warn(
        "Webhook de Instagram rechazado por firma inválida."
      );

      return NextResponse.json(
        {
          error: "Firma inválida.",
        },
        {
          status: 401,
        }
      );
    }

    let body: InstagramWebhookBody;

    try {
      body = JSON.parse(
        cuerpoCrudo
      ) as InstagramWebhookBody;
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
      typeof body !== "object"
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

    if (body.object !== "instagram") {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    for (const entry of body.entry ?? []) {
      for (
        const evento of
        entry.messaging ?? []
      ) {
        if (
          evento.message?.is_echo === true
        ) {
          continue;
        }

        const instagramAccountId =
          entry.id?.trim() ||
          evento.recipient?.id?.trim() ||
          "";

        const instagramSenderId =
          evento.sender?.id?.trim() ||
          "";

        const messageId =
          evento.message?.mid?.trim() ||
          "";

        if (
          !instagramAccountId ||
          !instagramSenderId ||
          !messageId
        ) {
          continue;
        }

        const contenido =
          obtenerTextoMensaje(evento);

        if (!contenido) {
          console.log(
            `Mensaje de Instagram ${messageId} sin texto. Por ahora se ignoran adjuntos.`
          );
          continue;
        }

        const conexion =
          await buscarEmpresaPorInstagram(
            instagramAccountId
          );

        if (!conexion) {
          console.warn(
            `No se encontró una empresa conectada a la cuenta de Instagram ${instagramAccountId}.`
          );
          continue;
        }

        const {
          empresaReferencia,
        } = conexion;

        const empresaId =
          empresaReferencia.id;

        const conversacionId =
          `instagram_${instagramSenderId}`;

        const conversacionReferencia =
          empresaReferencia
            .collection("conversations")
            .doc(conversacionId);

        const mensajeReferencia =
          conversacionReferencia
            .collection("messages")
            .doc(messageId);

        const resultado =
          await adminDb.runTransaction(
            async (transaction) => {
              const [
                mensajeExistente,
                conversacionSnapshot,
              ] = await Promise.all([
                transaction.get(
                  mensajeReferencia
                ),
                transaction.get(
                  conversacionReferencia
                ),
              ]);

              if (
                mensajeExistente.exists
              ) {
                return {
                  creado: false,
                };
              }

              const conversacionExistia =
                conversacionSnapshot.exists;

              const datosPrevios =
                conversacionSnapshot.data() ??
                {};

              const nombreContacto =
                typeof datosPrevios
                  .nombreContacto === "string" &&
                datosPrevios
                  .nombreContacto
                  .trim()
                  ? datosPrevios
                      .nombreContacto
                      .trim()
                  : `Instagram ${instagramSenderId}`;

              transaction.set(
                conversacionReferencia,
                {
                  empresaId,
                  canal: "instagram",
                  visitanteId:
                    instagramSenderId,
                  instagramScopedUserId:
                    instagramSenderId,
                  instagramAccountId,
                  nombreContacto,
                  estado:
                    datosPrevios.estado ===
                    "cerrada"
                      ? "abierta"
                      : datosPrevios.estado ||
                        "abierta",
                  atendidoPor:
                    datosPrevios.atendidoPor ??
                    "ia",
                  humanoActivo:
                    datosPrevios
                      .humanoActivo === true,
                  ultimoMensaje:
                    contenido,
                  ultimoRol: "user",
                  cantidadMensajes:
                    FieldValue.increment(1),
                  updatedAt:
                    FieldValue.serverTimestamp(),
                  ...(
                    !conversacionExistia
                      ? {
                          createdAt:
                            FieldValue.serverTimestamp(),
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
                  content: contenido,
                  enviadoPor: "cliente",
                  canal: "instagram",
                  instagramMessageId:
                    messageId,
                  instagramScopedUserId:
                    instagramSenderId,
                  createdAt:
                    FieldValue.serverTimestamp(),
                }
              );

              return {
                creado: true,
              };
            }
          );

        if (!resultado.creado) {
          console.log(
            `Mensaje duplicado de Instagram ignorado: ${messageId}`
          );
          continue;
        }

        console.log(
          `📩 Mensaje de Instagram guardado para la empresa ${empresaId}.`
        );

        await crearNotificacion({
          empresaId,
          tipo: "mensaje",
          titulo:
            "Nuevo mensaje de Instagram",
          descripcion:
            `Instagram ${instagramSenderId}: ${contenido}`,
          chatId: conversacionId,
          visitanteId:
            instagramSenderId,
          url:
            `/empresas/${empresaId}/conversaciones/${conversacionId}`,
          metadata: {
            canal: "instagram",
            instagramMessageId:
              messageId,
            instagramAccountId,
          },
        });

        /*
         * Si una persona tomó el control del chat,
         * guardamos el DM pero la IA no responde.
         */
        const estadoConversacion =
          await conversacionReferencia.get();

        const datosConversacion =
          estadoConversacion.data() ?? {};

        const humanoActivo =
          datosConversacion
            .humanoActivo === true ||
          datosConversacion
            .atendidoPor === "humano";

        if (humanoActivo) {
          console.log(
            `La conversación ${conversacionId} está siendo atendida por una persona.`
          );

          continue;
        }

        const integracion =
          conexion.integracion ?? {};

        const accessToken =
          typeof integracion
            .accessToken === "string"
            ? integracion
                .accessToken
                .trim()
            : "";

        if (!accessToken) {
          console.error(
            `La empresa ${empresaId} no tiene Access Token de Instagram.`
          );

          continue;
        }

        const empresaSnapshot =
          await empresaReferencia.get();

        if (!empresaSnapshot.exists) {
          console.error(
            `La empresa ${empresaId} ya no existe.`
          );

          continue;
        }

        const empresa =
          empresaSnapshot.data() ?? {};

        const historial =
          await obtenerHistorialConversacion(
            conversacionReferencia,
            messageId
          );

        let respuestaIA: string;

        try {
          respuestaIA =
            await generarRespuestaConIA({
              request,
              mensaje: contenido,
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
         * Revisión final por si una persona tomó el
         * chat mientras la IA estaba generando.
         */
        const estadoAntesDeEnviar =
          await conversacionReferencia.get();

        const datosAntesDeEnviar =
          estadoAntesDeEnviar.data() ??
          {};

        const humanoTomoControl =
          datosAntesDeEnviar
            .humanoActivo === true ||
          datosAntesDeEnviar
            .atendidoPor === "humano";

        if (humanoTomoControl) {
          console.log(
            `La respuesta automática de Instagram se canceló porque una persona tomó ${conversacionId}.`
          );

          continue;
        }

        const respuestaReferencia =
          conversacionReferencia
            .collection("messages")
            .doc(`ai_${messageId}`);

        const respuestaFueCreada =
          await adminDb.runTransaction(
            async (transaction) => {
              const respuestaExistente =
                await transaction.get(
                  respuestaReferencia
                );

              if (
                respuestaExistente.exists
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
                    "instagram",
                  respuestaA:
                    messageId,
                  estadoEnvio:
                    "pendiente",
                  createdAt:
                    FieldValue.serverTimestamp(),
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
                    FieldValue.increment(
                      1
                    ),
                  atendidoPor:
                    "ia",
                  humanoActivo:
                    false,
                  updatedAt:
                    FieldValue.serverTimestamp(),
                },
                {
                  merge: true,
                }
              );

              return true;
            }
          );

        if (!respuestaFueCreada) {
          console.log(
            `La respuesta de Instagram para ${messageId} ya existía.`
          );

          continue;
        }

        try {
          const instagramMessageId =
            await enviarMensajeInstagram({
              instagramAccountId,
              instagramSenderId,
              accessToken,
              texto:
                respuestaIA,
            });

          await respuestaReferencia.set(
            {
              estadoEnvio:
                "enviado",
              instagramMessageId,
              enviadoAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          console.log(
            `✅ La IA respondió por Instagram a ${instagramSenderId}.`
          );
        } catch (errorEnvio) {
          console.error(
            `No se pudo enviar la respuesta por Instagram a ${instagramSenderId}:`,
            errorEnvio
          );

          await respuestaReferencia.set(
            {
              estadoEnvio:
                "error",
              errorEnvio:
                errorEnvio instanceof
                Error
                  ? errorEnvio.message
                  : "Error desconocido",
              updatedAt:
                FieldValue.serverTimestamp(),
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
      "Error procesando webhook de Instagram:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}