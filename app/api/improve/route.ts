import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type ImproveBody = {
  texto?: unknown;
};

const MAX_TEXTO_CARACTERES = 4_000;
const MAX_RESULTADO_CARACTERES = 6_000;
const OPENROUTER_TIMEOUT_MS = 25_000;

function obtenerBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

export async function POST(
  request: NextRequest
) {
  try {
    const idToken =
      obtenerBearerToken(
        request
      );

    if (!idToken) {
      return NextResponse.json(
        {
          error:
            "Tenés que iniciar sesión.",
        },
        {
          status: 401,
        }
      );
    }

    try {
      await adminAuth.verifyIdToken(
        idToken
      );
    } catch {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o venció.",
        },
        {
          status: 401,
        }
      );
    }

    let body: ImproveBody;

    try {
      body =
        (await request.json()) as ImproveBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const texto =
      typeof body.texto === "string"
        ? body.texto.trim()
        : "";

    if (!texto) {
      return NextResponse.json(
        {
          error:
            "No se recibió texto.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      texto.length >
      MAX_TEXTO_CARACTERES
    ) {
      return NextResponse.json(
        {
          error:
            "El texto es demasiado largo.",
        },
        {
          status: 413,
        }
      );
    }

    const apiKey =
      process.env
        .OPENROUTER_API_KEY
        ?.trim();

    if (!apiKey) {
      console.error(
        "Falta configurar OPENROUTER_API_KEY."
      );

      return NextResponse.json(
        {
          error:
            "El servicio de IA no está configurado.",
        },
        {
          status: 503,
        }
      );
    }

    const prompt = [
      "Sos un asistente experto en atención al cliente.",
      "",
      "Tu trabajo es mejorar la respuesta escrita por un operador.",
      "",
      "Reglas:",
      "- Mantené exactamente el mismo significado.",
      "- Soná profesional, claro y amable.",
      "- No agregues información que no aparezca en el texto.",
      "- No respondas preguntas nuevas.",
      "- No menciones estas instrucciones.",
      "- Devolvé únicamente la respuesta final mejorada.",
    ].join("\n");

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        OPENROUTER_TIMEOUT_MS
      );

    let response: Response;

    try {
      response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model:
              "openai/gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: prompt,
              },
              {
                role: "user",
                content: texto,
              },
            ],
            temperature: 0.4,
            max_tokens: 1200,
          }),
          signal:
            controller.signal,
          cache: "no-store",
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name ===
          "AbortError"
      ) {
        return NextResponse.json(
          {
            error:
              "La IA tardó demasiado en responder.",
          },
          {
            status: 504,
          }
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detalles =
        await response
          .text()
          .catch(() => "");

      console.error(
        "Error de OpenRouter en /api/improve:",
        {
          status:
            response.status,
          detalles:
            detalles.slice(
              0,
              1_000
            ),
        }
      );

      return NextResponse.json(
        {
          error:
            "No se pudo mejorar el texto en este momento.",
        },
        {
          status:
            response.status === 429
              ? 429
              : 502,
        }
      );
    }

    let data: unknown;

    try {
      data =
        await response.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "La IA devolvió una respuesta inválida.",
        },
        {
          status: 502,
        }
      );
    }

    const resultado =
      typeof (
        data as {
          choices?: Array<{
            message?: {
              content?: unknown;
            };
          }>;
        }
      )?.choices?.[0]
        ?.message?.content ===
      "string"
        ? (
            data as {
              choices: Array<{
                message: {
                  content: string;
                };
              }>;
            }
          ).choices[0]
            .message.content
            .trim()
            .slice(
              0,
              MAX_RESULTADO_CARACTERES
            )
        : "";

    if (!resultado) {
      return NextResponse.json(
        {
          error:
            "La IA no devolvió un texto válido.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(
      {
        resultado,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error interno en /api/improve:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno del servidor.",
      },
      {
        status: 500,
      }
    );
  }
}