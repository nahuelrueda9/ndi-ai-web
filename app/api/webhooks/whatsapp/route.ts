import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

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
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) {
          console.warn(
            "Webhook de WhatsApp sin phone_number_id."
          );
          continue;
        }

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

        const empresaReferencia =
          integracionDocumento.ref.parent.parent;

        if (!empresaReferencia) {
          console.warn(
            "No se pudo obtener la empresa asociada a WhatsApp."
          );
          continue;
        }

        const empresaId = empresaReferencia.id;

        for (const mensaje of value?.messages ?? []) {
          const messageId = mensaje.id;
          const numeroCliente = mensaje.from;

          if (!messageId || !numeroCliente) {
            continue;
          }

          const contenido = obtenerContenidoMensaje(mensaje);

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

          const conversacionId = `whatsapp_${numeroCliente}`;

          const conversacionReferencia = adminDb
            .collection("companies")
            .doc(empresaId)
            .collection("conversations")
            .doc(conversacionId);

          const mensajeReferencia = conversacionReferencia
            .collection("messages")
            .doc(messageId);

          await adminDb.runTransaction(
            async (transaction) => {
              const mensajeExistente =
                await transaction.get(mensajeReferencia);

              if (mensajeExistente.exists) {
                return;
              }

              transaction.set(
                conversacionReferencia,
                {
                  empresaId,
                  canal: "whatsapp",
                  visitanteId: numeroCliente,
                  nombreContacto,
                  telefono: numeroCliente,
                  whatsappPhoneNumberId: phoneNumberId,
                  whatsappDisplayNumber:
                    value?.metadata?.display_phone_number ??
                    "",
                  estado: "abierta",
                  atendidoPor: "ia",
                  humanoActivo: false,
                  ultimoMensaje: contenido,
                  ultimoRol: "user",
                  cantidadMensajes: FieldValue.increment(1),
                  updatedAt: FieldValue.serverTimestamp(),
                  createdAt: FieldValue.serverTimestamp(),
                },
                {
                  merge: true,
                }
              );

              transaction.set(mensajeReferencia, {
                role: "user",
                content: contenido,
                enviadoPor: "cliente",
                canal: "whatsapp",
                whatsappMessageId: messageId,
                createdAt: FieldValue.serverTimestamp(),
              });
            }
          );

          console.log(
            `Mensaje de WhatsApp guardado para la empresa ${empresaId}.`
          );
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
     * Respondemos 200 para evitar que Meta reintente
     * indefinidamente un evento que no pudimos procesar.
     */
    return NextResponse.json({
      received: true,
      processed: false,
    });
  }
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