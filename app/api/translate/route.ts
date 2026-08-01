import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const {
      texto,
      idioma = "español",
    } = await req.json();

    if (!texto?.trim()) {
      return NextResponse.json(
        {
          error: "No se recibió texto.",
        },
        {
          status: 400,
        }
      );
    }

    const prompt = `
Sos un traductor profesional.

Traducí el siguiente texto al ${idioma}.

Reglas:

- No agregues explicaciones.
- No uses comillas.
- No inventes información.
- Conservá el sentido original.
- Devolvé únicamente la traducción.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1-mini",
          temperature: 0.2,
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
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: await response.text(),
        },
        {
          status: 500,
        }
      );
    }

    const data = await response.json();

    const resultado =
      data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      resultado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}