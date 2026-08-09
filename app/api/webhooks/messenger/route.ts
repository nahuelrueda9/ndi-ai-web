import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

function obtenerVerifyToken() {
  return (
    process.env
      .MESSENGER_VERIFY_TOKEN
      ?.trim() ||
    ""
  );
}

function obtenerAppSecret() {
  return (
    process.env
      .MESSENGER_APP_SECRET
      ?.trim() ||
    process.env
      .META_APP_SECRET
      ?.trim() ||
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
    !firmaRecibida.startsWith(
      "sha256="
    )
  ) {
    return false;
  }

  const firmaHex =
    firmaRecibida
      .slice("sha256=".length)
      .trim()
      .toLowerCase();

  if (
    !/^[a-f0-9]{64}$/.test(
      firmaHex
    )
  ) {
    return false;
  }

  const firmaEsperadaHex =
    createHmac(
      "sha256",
      appSecret
    )
      .update(
        Buffer.from(
          cuerpoCrudo,
          "utf8"
        )
      )
      .digest("hex");

  const firmaBuffer =
    Buffer.from(
      firmaHex,
      "hex"
    );

  const firmaEsperadaBuffer =
    Buffer.from(
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

export async function GET(
  request: NextRequest
) {
  const verifyToken =
    obtenerVerifyToken();

  if (!verifyToken) {
    console.error(
      "Falta configurar MESSENGER_VERIFY_TOKEN."
    );

    return NextResponse.json(
      {
        error:
          "La verificación del webhook de Messenger no está configurada.",
      },
      {
        status: 500,
      }
    );
  }

  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get(
      "hub.mode"
    );

  const token =
    searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    searchParams.get(
      "hub.challenge"
    );

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
          "Content-Type":
            "text/plain",
        },
      }
    );
  }

  return NextResponse.json(
    {
      error:
        "Verificación fallida.",
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
        "Falta configurar MESSENGER_APP_SECRET o META_APP_SECRET."
      );

      return NextResponse.json(
        {
          error:
            "La seguridad del webhook de Messenger no está configurada.",
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
        "Webhook de Messenger rechazado por firma inválida."
      );

      return NextResponse.json(
        {
          error:
            "Firma inválida.",
        },
        {
          status: 401,
        }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(
        cuerpoCrudo
      );
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

    console.log(
      "📨 Webhook de Messenger recibido:",
      JSON.stringify(body)
    );

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Error procesando webhook de Messenger:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}