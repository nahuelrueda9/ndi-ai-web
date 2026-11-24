import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

import { adminDb } from "@/lib/firebaseAdmin";
import { crearNotificacion } from "@/lib/notifications/notificationService";

export const runtime = "nodejs";

const accessToken =
  process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
  accessToken: accessToken!,
});

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || searchParams.get("type");
    const id = searchParams.get("id") || searchParams.get("data.id");

    if (topic === "payment" && id) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id });

      if (paymentData.status === "approved") {
        const meta = (paymentData.metadata || {}) as Record<string, unknown>;

        const empresaId =
          typeof meta.empresa_id === "string" ? meta.empresa_id.trim() : "";
        const nombreCliente =
          typeof meta.nombre_cliente === "string" && meta.nombre_cliente.trim()
            ? meta.nombre_cliente.trim()
            : "Cliente";
        const telefono =
          typeof meta.telefono === "string" ? meta.telefono.trim() : "";
        const email =
          typeof meta.email === "string" ? meta.email.trim() : "";
        const servicio =
          typeof meta.servicio === "string" ? meta.servicio.trim() : "";
        const servicioId =
          typeof meta.servicio_id === "string" ? meta.servicio_id.trim() : "";
        const fecha =
          typeof meta.fecha === "string" ? meta.fecha.trim() : "";
        const hora =
          typeof meta.hora === "string" ? meta.hora.trim() : "";
        const notas =
          typeof meta.notas === "string" ? meta.notas.trim() : "";
        const duracionMinutos =
          Math.min(1440, Math.max(5, Number(meta.duracion_minutos) || 30));

        if (!empresaId || !servicio || !fecha || !hora) {
          console.error("Webhook MercadoPago sin metadata completa:", {
            paymentId: paymentData.id,
            meta,
          });
          return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        const empresaRef = adminDb.collection("companies").doc(empresaId);
        const turnoId = `mp_${paymentData.id}`;
        const turnoRef = empresaRef.collection("appointments").doc(turnoId);
        const analyticsRef = empresaRef.collection("analyticsEvents").doc(turnoId);

        let yaExistiaTurno = false;

        await adminDb.runTransaction(async (transaction) => {
          const turnoSnap = await transaction.get(turnoRef);
          if (turnoSnap.exists) {
            yaExistiaTurno = true;
            return;
          }

          transaction.set(turnoRef, {
            nombreCliente,
            telefono,
            email,
            servicio,
            servicioId,
            fecha,
            hora,
            duracionMinutos,
            estado: "confirmado",
            notas,
            origen: "web",
            mpPaymentId: String(paymentData.id),
            montoPagado: Number(paymentData.transaction_amount) || 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          transaction.set(
            analyticsRef,
            {
              tipo: "appointment_created",
              visitanteId: `reserva-${turnoId}`,
              origen: "pagina_publica",
              turnoId,
              servicioId,
              mpPaymentId: String(paymentData.id),
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        });

        if (!yaExistiaTurno) {
          try {
            await crearNotificacion({
              empresaId,
              tipo: "sistema",
              titulo: "Nuevo turno confirmado",
              descripcion: `${nombreCliente} pagó y reservó ${servicio} para el ${fecha} a las ${hora}.`,
              url: `/empresas/${empresaId}/agenda`,
              metadata: {
                origen: "pagina_publica",
                turnoId,
                servicioId,
                fecha,
                hora,
                email,
                telefono,
                mpPaymentId: String(paymentData.id),
              },
            });
          } catch (notificationError) {
            console.error(
              "No se pudo crear la notificación del turno aprobado:",
              notificationError
            );
          }

          try {
            const empresaSnap = await empresaRef.get();
            const fcmTokens: string[] = Array.isArray(empresaSnap.data()?.fcmTokens)
              ? empresaSnap.data()!.fcmTokens
              : [];

            if (fcmTokens.length > 0) {
              const messaging = getMessaging();
              await messaging.sendEachForMulticast({
                tokens: fcmTokens,
                notification: {
                  title: "📅 ¡Nuevo turno pagado y confirmado!",
                  body: `${nombreCliente} reservó ${servicio} para el ${fecha} a las ${hora}.`,
                },
                data: {
                  url: `/empresas/${empresaId}/agenda`,
                },
              });
            }
          } catch (pushError) {
            console.error("Error enviando push de turno aprobado:", pushError);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Error en Webhook MercadoPago:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}