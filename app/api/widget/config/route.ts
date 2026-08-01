import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId requerido" },
        { status: 400 }
      );
    }

    const empresaRef = doc(db, "companies", empresaId);
    const empresaSnap = await getDoc(empresaRef);

    if (!empresaSnap.exists()) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    const data = empresaSnap.data();

    return NextResponse.json({
      id: empresaSnap.id,
      nombre: data.nombre || "",
      logo: data.logo || "",
      color: data.color || "#2563eb",
      saludo:
        data.saludo ||
        "¡Hola! ¿En qué podemos ayudarte?",
      posicion: data.posicion || "right",
      avatar: data.avatar || "",
      horario: data.horario || null,
      online:
        data.online === undefined ? true : data.online,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Error interno",
      },
      {
        status: 500,
      }
    );
  }
}