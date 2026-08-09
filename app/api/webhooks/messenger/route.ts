import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

function limpiarValor(
  valor?: string
) {
  if (!valor) return "";

  let limpio = valor.trim();

  if (
    (limpio.startsWith('"') &&
      limpio.endsWith('"')) ||
    (limpio.startsWith("'") &&
      limpio.endsWith("'"))
  ) {
    limpio = limpio.slice(1, -1).trim();
  }

  return limpio;
}

function obtenerVerifyToken() {
  return limpiarValor(
    process.env
      .MESSENGER_VERIFY_TOKEN
  );
}

type SecretoCandidato = {
  nombre: string;
  valor: string;
};

function obtenerSecretosCandidatos():
  SecretoCandidato[] {
  const candidatos: SecretoCandidato[] =
    [
      {
        nombre:
          "MESSENGER_APP_SECRET",
        valor: limpiarValor(
          process.env
            .MESSENGER_APP_SECRET
        ),
      },
      {
        nombre:
          "META_APP_SECRET",
        valor: limpiarValor(
          process.env
            .META_APP_SECRET
        ),
      },
      {
        nombre:
          "INSTAGRAM_APP_SECRET",
        valor: limpiarValor(
          process.env
            .INSTAGRAM_APP_SECRET
        ),
      },
    ];

  const vistos =
    new Set<string>();

  return candidatos.filter(
    (candidato) => {
      if (!candidato.valor) {
        return false;
      }

      if (
        vistos.has(
          candidato.valor
        )
      ) {
        return false;
      }

      vistos.add(
        candidato.valor
      );

      return true;
    }
  );
}

function verificarFirmaConSecreto({
  cuerpoCrudo,
  firmaRecibida,
  appSecret,
}: {
  cuerpoCrudo: Buffer;
  firmaRecibida: string;
  appSecret: string;
}) {
  const firmaNormalizada =
    firmaRecibida
      .trim()
      .toLowerCase();

  if (
    !firmaNormalizada.startsWith(
      "sha256="
    )
  ) {
    return false;
  }

  const firmaHex =
    firmaNormalizada.slice(
      "sha256=".length
    );

  if (
    !/^[a-f0-9]{64}$/.test(
      firmaHex
    )
  ) {
    return false;
  }

  const firmaEsperada =
    createHmac(
      "sha256",
      appSecret
    )
      .update(cuerpoCrudo)
      .digest();

  const firmaRecibidaBuffer =
    Buffer.from(
      firmaHex,
      "hex"
    );

  if (
    firmaEsperada.length !==
    firmaRecibidaBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firmaEsperada,
    firmaRecibidaBuffer
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
    const arrayBuffer =
      await request.arrayBuffer();

    const cuerpoCrudo =
      Buffer.from(arrayBuffer);

    const firmaRecibida =
      request.headers.get(
        "x-hub-signature-256"
      );

    const secretos =
      obtenerSecretosCandidatos();

    if (
      secretos.length === 0
    ) {
      console.error(
        "No hay ningún App Secret configurado para validar Messenger."
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

    if (!firmaRecibida) {
      console.warn(
        "Webhook de Messenger sin X-Hub-Signature-256.",
        {
          bodyBytes:
            cuerpoCrudo.length,
          secretosDisponibles:
            secretos.map(
              (item) =>
                item.nombre
            ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Falta la firma de Meta.",
        },
        {
          status: 401,
        }
      );
    }

    let secretoCoincidente:
      string | null = null;

    for (
      const secreto of secretos
    ) {
      const coincide =
        verificarFirmaConSecreto({
          cuerpoCrudo,
          firmaRecibida,
          appSecret:
            secreto.valor,
        });

      if (coincide) {
        secretoCoincidente =
          secreto.nombre;
        break;
      }
    }

    if (!secretoCoincidente) {
      console.warn(
        "Webhook de Messenger rechazado por firma inválida.",
        {
          firmaPresente: true,
          firmaEmpiezaConSha256:
            firmaRecibida
              .toLowerCase()
              .startsWith(
                "sha256="
              ),
          firmaLongitud:
            firmaRecibida.length,
          bodyBytes:
            cuerpoCrudo.length,
          secretosDisponibles:
            secretos.map(
              (item) =>
                item.nombre
            ),
        }
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
        cuerpoCrudo.toString(
          "utf8"
        )
      );
    } catch {
      console.warn(
        "Webhook de Messenger con JSON inválido."
      );

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
      "✅ Webhook de Messenger validado.",
      {
        secretoUsado:
          secretoCoincidente,
        bodyBytes:
          cuerpoCrudo.length,
      }
    );

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