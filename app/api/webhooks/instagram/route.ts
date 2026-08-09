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