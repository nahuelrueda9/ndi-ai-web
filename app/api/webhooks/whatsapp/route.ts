import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type RolMensaje = "user" | "assistant";

type MensajeHistorial = {
  role: RolMensaje;
  content: string;
};

type WhatsAppMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;

  text?: {
    body?: string;
  };

  button?: {
    text?: string;
  };

  interactive?: {
    button_reply?: {
      title?: string;
    };

    list_reply?: {
      title?: string;
    };
  };
};

type WhatsAppValue = {
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };

  contacts?: Array<{
    profile?: {
      name?: string;
    };

    wa_id?: string;
  }>;

  messages?: WhatsAppMessage[];
};

type WhatsAppWebhookBody = {
  object?: string;

  entry?: Array<{
    id?: string;

    changes?: Array<{
      field?: string;
      value?: WhatsAppValue;
    }>;
  }>;
};

type GeminiResponse = {
  respuesta?: string;
  error?: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new NextResponse("Forbidden", {
    status: 403,
  });
}

export async function POST(request: NextRequest) {
  console.log("🔥 WEBHOOK DE WHATSAPP RECIBIDO");

  try {
    const body = (await request.json()) as WhatsAppWebhookBody;

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") {
          continue;
        }

        const value = change.value;
        const phoneNumberId =
          value?.metadata?.phone_number_id?.trim();

        if (!phoneNumberId) {
          console.warn(
            "Webhook de WhatsApp sin phone_number_id."
          );
          continue;
        }

        /*
         * Buscamos qué empresa utiliza este número de WhatsApp.
         */
        const integracionesSnapshot = await adminDb
          .collectionGroup("integrations")
          .where("phoneNumberId", "==", phoneNumberId)
          .limit(1)
          .get();

        if (integracionesSnapshot.empty) {
          console.warn(
            `No se encontró una empresa para el Phone Number ID ${phoneNumberId}.`
          );
          continue;
        }

        const integracionDocumento =
          integracionesSnapshot.docs[0];

        const integracionData =
          integracionDocumento.data();

        const accessToken =
          typeof integracionData.accessToken === "string"
            ? integracionData.accessToken.trim()
            : "";

        const empresaReferencia =
          integracionDocumento.ref.parent.parent;

        if (!empresaReferencia) {
          console.warn(
            "No se pudo obtener la empresa asociada a WhatsApp."
          );
          continue;
        }

        const empresaId = empresaReferencia.id;

        /*
         * Obtenemos los datos de la empresa para que la IA
         * conserve su personalidad e instrucciones.
         */
        const empresaSnapshot =
          await empresaReferencia.get();

        if (!empresaSnapshot.exists) {
          console.warn(
            `La empresa ${empresaId} no existe.`
          );
          continue;
        }

        const empresa = empresaSnapshot.data() ?? {};

        for (const mensaje of value?.messages ?? []) {
          const messageId = mensaje.id?.trim();
          const numeroCliente = mensaje.from?.trim();

          if (!messageId || !numeroCliente) {
            continue;
          }

          const contenido =
            obtenerContenidoMensaje(mensaje);

          if (!contenido) {
            console.log(
              `Mensaje de WhatsApp no compatible: ${mensaje.type}`
            );
            continue;
          }

          const contacto = value?.contacts?.find(
            (item) => item.wa_id === numeroCliente
          );

          const nombreContacto =
            contacto?.profile?.name?.trim() ||
            `WhatsApp ${numeroCliente}`;

          const conversacionId =
            `whatsapp_${numeroCliente}`;

          const conversacionReferencia = adminDb
            .collection("companies")
            .doc(empresaId)
            .collection("conversations")
            .doc(conversacionId);

          const mensajeReferencia =
            conversacionReferencia
              .collection("messages")
              .doc(messageId);

          /*
           * Guardamos el mensaje de forma idempotente.
           * Si Meta vuelve a enviar el mismo webhook,
           * no generamos otra respuesta de IA.
           */
          const mensajeFueCreado =
            await adminDb.runTransaction(
              async (transaction) => {
                const mensajeExistente =
                  await transaction.get(
                    mensajeReferencia
                  );

                if (mensajeExistente.exists) {
                  return false;
                }

                const conversacionSnapshot =
                  await transaction.get(
                    conversacionReferencia
                  );

                const conversacionExistia =
                  conversacionSnapshot.exists;

                transaction.set(
                  conversacionReferencia,
                  {
                    empresaId,
                    canal: "whatsapp",
                    visitanteId: numeroCliente,
                    nombreContacto,
                    telefono: numeroCliente,

                    whatsappPhoneNumberId:
                      phoneNumberId,

                    whatsappDisplayNumber:
                      value?.metadata
                        ?.display_phone_number ?? "",

                    estado: "abierta",
                    atendidoPor:
                      conversacionSnapshot.data()
                        ?.atendidoPor ?? "ia",

                    humanoActivo:
                      conversacionSnapshot.data()
                        ?.humanoActivo === true,

                    ultimoMensaje: contenido,
                    ultimoRol: "user",

                    cantidadMensajes:
                      FieldValue.increment(1),

                    updatedAt:
                      FieldValue.serverTimestamp(),

                    ...(!conversacionExistia
                      ? {
                          createdAt:
                            FieldValue.serverTimestamp(),
                        }
                      : {}),
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
                    canal: "whatsapp",
                    whatsappMessageId: messageId,
                    createdAt:
                      FieldValue.serverTimestamp(),
                  }
                );

                return true;
              }
            );

          if (!mensajeFueCreado) {
            console.log(
              `Mensaje duplicado ignorado: ${messageId}`
            );
            continue;
          }

          console.log(
            `Mensaje de WhatsApp guardado para la empresa ${empresaId}.`
          );

          /*
           * Si una persona tomó el control del chat,
           * guardamos el mensaje pero la IA no responde.
           */
          const estadoConversacion =
            await conversacionReferencia.get();

          const datosConversacion =
            estadoConversacion.data();

          const humanoActivo =
            datosConversacion?.humanoActivo === true ||
            datosConversacion?.atendidoPor === "humano";

          if (humanoActivo) {
            console.log(
              `La conversación ${conversacionId} está siendo atendida por una persona.`
            );
            continue;
          }

          if (!accessToken) {
            console.error(
              `La empresa ${empresaId} no tiene Access Token de WhatsApp.`
            );
            continue;
          }

          /*
           * Cargamos el historial anterior.
           * Excluimos el mensaje actual porque /api/gemini
           * ya lo recibe por separado como "mensaje".
           */
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
              `No se pudo generar respuesta para ${conversacionId}:`,
              errorIA
            );
            continue;
          }

          /*
           * Volvemos a revisar el estado antes de enviar.
           * Una persona podría haber tomado el chat mientras
           * la IA estaba generando su respuesta.
           */
          const estadoAntesDeEnviar =
            await conversacionReferencia.get();

          const datosAntesDeEnviar =
            estadoAntesDeEnviar.data();

          const humanoTomoControl =
            datosAntesDeEnviar?.humanoActivo === true ||
            datosAntesDeEnviar?.atendidoPor === "humano";

          if (humanoTomoControl) {
            console.log(
              `La respuesta automática se canceló porque una persona tomó ${conversacionId}.`
            );
            continue;
          }

          const respuestaReferencia =
            conversacionReferencia
              .collection("messages")
              .doc(`ai_${messageId}`);

          /*
           * Guardamos primero la respuesta con un ID determinista,
           * para no duplicarla ante posibles reintentos.
           */
          const respuestaFueCreada =
            await adminDb.runTransaction(
              async (transaction) => {
                const respuestaExistente =
                  await transaction.get(
                    respuestaReferencia
                  );

                if (respuestaExistente.exists) {
                  return false;
                }

                transaction.set(
                  respuestaReferencia,
                  {
                    role: "assistant",
                    content: respuestaIA,
                    enviadoPor: "ia",
                    canal: "whatsapp",
                    respuestaA: messageId,
                    estadoEnvio: "pendiente",
                    createdAt:
                      FieldValue.serverTimestamp(),
                  }
                );

                transaction.set(
                  conversacionReferencia,
                  {
                    ultimoMensaje: respuestaIA,
                    ultimoRol: "assistant",
                    cantidadMensajes:
                      FieldValue.increment(1),
                    atendidoPor: "ia",
                    humanoActivo: false,
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
              `La respuesta para ${messageId} ya existía.`
            );
            continue;
          }

          try {
            const whatsappMessageId =
              await enviarMensajeWhatsApp({
                phoneNumberId,
                numeroCliente,
                accessToken,
                texto: respuestaIA,
              });

            await respuestaReferencia.set(
              {
                estadoEnvio: "enviado",
                whatsappMessageId,
                enviadoAt:
                  FieldValue.serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            console.log(
              `✅ La IA respondió por WhatsApp a ${numeroCliente}.`
            );
          } catch (errorEnvio) {
            console.error(
              `No se pudo enviar la respuesta por WhatsApp a ${numeroCliente}:`,
              errorEnvio
            );

            await respuestaReferencia.set(
              {
                estadoEnvio: "error",
                errorEnvio:
                  errorEnvio instanceof Error
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
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Error procesando el webhook de WhatsApp:",
      error
    );

    /*
     * Respondemos 200 para evitar que Meta repita
     * indefinidamente un evento que no procesamos.
     */
    return NextResponse.json({
      received: true,
      processed: false,
    });
  }
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
  const urlGemini = new URL(
    "/api/gemini",
    request.nextUrl.origin
  );

  const respuesta = await fetch(urlGemini, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mensaje,
      historial,
      empresa,
      empresaId,
      chatId: conversacionId,
    }),
    cache: "no-store",
  });

  const responseText = await respuesta.text();

  let data: GeminiResponse;

  try {
    data = JSON.parse(responseText) as GeminiResponse;
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

async function enviarMensajeWhatsApp({
  
  phoneNumberId,
  numeroCliente,
  accessToken,
  texto,
}: {
  phoneNumberId: string;
  numeroCliente: string;
  accessToken: string;
  texto: string;
}) {
  
  const version =
    process.env.WHATSAPP_API_VERSION || "v26.0";

const numeroDestino = normalizarNumeroWhatsApp(numeroCliente);

console.log("NÚMERO RECIBIDO:", numeroCliente);
console.log("NÚMERO ENVIADO A META:", numeroDestino);

const response = await fetch(
  `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: numeroDestino,
      type: "text",
      text: {
        preview_url: false,
        body: texto.slice(0, 4096),
      },
    }),
  }
);

  const responseText = await response.text();

   console.log("META RESPONDIÓ:");
   console.log("STATUS META:", response.status);
   console.log("BODY META:", responseText);


  let data: {
    messages?: Array<{
      id?: string;
    }>;
    error?: {
      message?: string;
      code?: number;
    };
  };

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Meta devolvió una respuesta inválida. Estado ${response.status}.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        `Meta respondió con estado ${response.status}.`
    );
  }

  const whatsappMessageId =
    data.messages?.[0]?.id;

  if (!whatsappMessageId) {
    throw new Error(
      "Meta no devolvió el ID del mensaje enviado."
    );
  }

  return whatsappMessageId;
}

function normalizarNumeroWhatsApp(numero: string) {
  const limpio = numero.replace(/\D/g, "");

  // Argentina:
  // Meta puede devolver 549XXXXXXXXXX,
  // pero el destinatario de prueba queda registrado como 54XXXXXXXXXX.
  if (limpio.startsWith("549")) {
    return `54${limpio.slice(3)}`;
  }

  return limpio;
}

function obtenerContenidoMensaje(
  mensaje: WhatsAppMessage
): string {
  if (mensaje.type === "text") {
    return mensaje.text?.body?.trim() ?? "";
  }

  if (mensaje.type === "button") {
    return mensaje.button?.text?.trim() ?? "";
  }

  if (mensaje.type === "interactive") {
    return (
      mensaje.interactive?.button_reply?.title?.trim() ||
      mensaje.interactive?.list_reply?.title?.trim() ||
      ""
    );
  }

  return "";
}