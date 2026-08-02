import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";

type WhatsAppConfig = {
  empresaId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  verifyToken?: string;
};

export async function GET(request: NextRequest) {
  try {
    const empresaId = request.nextUrl.searchParams
      .get("empresaId")
      ?.trim();

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId requerido." },
        { status: 400 }
      );
    }

    const documento = await adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("integrations")
      .doc("whatsapp")
      .get();

    if (!documento.exists) {
      return NextResponse.json({
        config: null,
      });
    }

    const data = documento.data();

    return NextResponse.json({
      config: {
        phoneNumberId: data?.phoneNumberId ?? "",
        businessAccountId: data?.businessAccountId ?? "",
        verifyToken: data?.verifyToken ?? "",
        estado: data?.estado ?? "configurado",
      },
    });
  } catch (error) {
    console.error("Error cargando WhatsApp:", error);

    return NextResponse.json(
      {
        error: "No se pudo cargar la configuración.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WhatsAppConfig;

    const empresaId = body.empresaId?.trim();
    const phoneNumberId = body.phoneNumberId?.trim();
    const businessAccountId = body.businessAccountId?.trim();
    const accessToken = body.accessToken?.trim();
    const verifyToken = body.verifyToken?.trim();

    if (
      !empresaId ||
      !phoneNumberId ||
      !businessAccountId ||
      !accessToken ||
      !verifyToken
    ) {
      return NextResponse.json(
        {
          error: "Completá todos los campos.",
        },
        {
          status: 400,
        }
      );
    }

    await adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("integrations")
      .doc("whatsapp")
      .set(
        {
          phoneNumberId,
          businessAccountId,
          accessToken,
          verifyToken,
          estado: "configurado",
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

    return NextResponse.json({
      success: true,
      message: "Configuración guardada correctamente.",
    });
  } catch (error) {
    console.error("Error guardando WhatsApp:", error);

    return NextResponse.json(
      {
        error: "No se pudo guardar la configuración.",
      },
      {
        status: 500,
      }
    );
  }
}