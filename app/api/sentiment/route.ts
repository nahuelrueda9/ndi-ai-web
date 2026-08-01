import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { historial = [] } = await req.json();

    const conversacion = historial
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
Analizá esta conversación.

Respondé SOLO un JSON.

Formato:

{
  "sentimiento":"positivo|neutral|negativo",
  "urgencia":"baja|media|alta",
  "compra":0,
  "vip":true,
  "riesgo":"bajo|medio|alto",
  "resumen":"...",
  "recomendacion":"..."
}

No agregues texto fuera del JSON.
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
              content: conversacion,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: await response.text() },
        { status: 500 }
      );
    }

    const data = await response.json();

    const texto = data.choices[0].message.content;

    return NextResponse.json(JSON.parse(texto));
  } catch (e) {
    console.error(e);

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