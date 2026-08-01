import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const empresaId =
      request.nextUrl.searchParams.get("empresaId");

    const modo =
      request.nextUrl.searchParams.get("hub.mode");

    const tokenRecibido =
      request.nextUrl.searchParams.get(
        "hub.verify_token"
      );

    const challenge =
      request.nextUrl.searchParams.get(
        "hub.challenge"
      );

    if (
      !empresaId ||
      modo !== "subscribe" ||
      !tokenRecibido ||
      !challenge
    ) {
      return new NextResponse(
        "Solicitud de verificación inválida.",
        {
          status: 400,
        }
      );
    }

    const integracionSnapshot = await adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("integrations")
      .doc("whatsapp")
      .get();

    if (!integracionSnapshot.exists) {
      return new NextResponse(
        "La integración no existe.",
        {
          status: 404,
        }
      );
    }

    const configuracion =
      integracionSnapshot.data();

    const verifyTokenGuardado =
      typeof configuracion?.verifyToken === "string"
        ? configuracion.verifyToken.trim()
        : "";

    if (
      !verifyTokenGuardado ||
      tokenRecibido !== verifyTokenGuardado
    ) {
      return new NextResponse(
        "Token de verificación incorrecto.",
        {
          status: 403,
        }
      );
    }

    return new NextResponse(challenge, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "Error verificando webhook de WhatsApp:",
      error
    );

    return new NextResponse(
      "Error interno del servidor.",
      {
        status: 500,
      }
    );
  }
}