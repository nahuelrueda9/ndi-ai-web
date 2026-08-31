import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";

export async function POST(req: Request) {
  try {
    const { empresaId, titulo, mensaje, urlDestino } = await req.json();

    if (!empresaId || !titulo || !mensaje) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const empresaDoc = await adminDb.collection("companies").doc(empresaId).get();
    if (!empresaDoc.exists) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const tokens: string[] = empresaDoc.data()?.fcmTokens || [];

    if (tokens.length === 0) {
      return NextResponse.json({ message: "No hay dispositivos suscritos" });
    }

    const messaging = getMessaging();

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: titulo,
        body: mensaje,
      },
      data: {
        url: urlDestino || `/empresas/${empresaId}/pedidos`,
      },
    });

    return NextResponse.json({ success: true, count: response.successCount });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error enviando push:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}