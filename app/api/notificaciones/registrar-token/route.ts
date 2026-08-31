import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { empresaId, token } = await req.json();

    if (!empresaId || !token) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Se guarda con privilegios de administrador sin chocar con reglas de cliente
    await adminDb.collection("companies").doc(empresaId).update({
      fcmTokens: FieldValue.arrayUnion(token),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error guardando fcmToken:", error);
    return NextResponse.json({ error: "Error al registrar dispositivo" }, { status: 500 });
  }
}