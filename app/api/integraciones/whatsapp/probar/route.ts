import { NextResponse } from "next/server";

type Body = {
  phoneNumberId?: string;
  accessToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const phoneNumberId = body.phoneNumberId?.trim();
    const accessToken = body.accessToken?.trim();

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        {
          error:
            "Completá Phone Number ID y Access Token.",
        },
        {
          status: 400,
        }
      );
    }

    const respuesta = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Meta rechazó la conexión.",
        },
        {
          status: respuesta.status,
        }
      );
    }

    return NextResponse.json({
      conectado: true,
      numero:
        data.display_phone_number || "",
      nombreVerificado:
        data.verified_name || "",
      calidad:
        data.quality_rating || "",
    });
  } catch (error) {
    console.error(
      "Error probando WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo probar la conexión.",
      },
      {
        status: 500,
      }
    );
  }
}