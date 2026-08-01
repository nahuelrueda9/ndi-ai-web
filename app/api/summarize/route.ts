import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { historial = [] } = await req.json();

    if (!historial.length) {
      return NextResponse.json(
        {
          error: "No hay conversación para resumir.",
        },
        {
          status: 400,
        }
      );
    }

    const conversacion = historial
      .map(
        (m: any) =>
          `${m.role === "assistant" ? "IA" : "Cliente"}: ${m.content}`
      )
      .join("\n");

    const prompt = `
Sos un asistente para operadores de un CRM.

Analizá la conversación y devolvé un resumen breve.

Debe incluir:

• Qué necesita el cliente.
• Qué problemas tiene.
• Qué datos importantes mencionó.
• En qué estado quedó la conversación.
• Qué debería hacer el operador.

No uses markdown.
No inventes información.
Máximo 200 palabras.
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
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: conversacion,
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