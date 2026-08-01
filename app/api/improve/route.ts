import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { texto } = await req.json();

    if (!texto || !texto.trim()) {
      return NextResponse.json(
        { error: "No se recibió texto." },
        { status: 400 }
      );
    }

    const prompt = `
Sos un asistente experto en atención al cliente.

Tu trabajo es mejorar la respuesta del operador.

Reglas:

- Mantener el mismo significado.
- Sonar profesional.
- Ser amable.
- No agregar información inventada.
- No responder preguntas nuevas.
- Devolver únicamente la respuesta final.
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
          temperature: 0.5,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();

      return NextResponse.json(
        {
          error,
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