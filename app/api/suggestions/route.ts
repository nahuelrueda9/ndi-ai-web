import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const {
      mensaje,
      historial = [],
      empresa,
      memoria,
    } = await req.json();

    const historialTexto = historial
      .slice(-10)
      .map(
        (m: any) =>
          `${m.role === "assistant" ? "Asistente" : "Cliente"}: ${m.content}`
      )
      .join("\n");

    const prompt = `
Sos un asistente que ayuda a operadores humanos.

Empresa:
${empresa || "Sin información"}

Memoria del cliente:
${memoria || "Sin memoria"}

Historial:
${historialTexto}

Último mensaje:
${mensaje}

Generá EXACTAMENTE 3 respuestas.

Las respuestas deben:

- ser cortas
- sonar naturales
- listas para enviar
- no usar emojis
- no explicar nada

Respondé únicamente en formato JSON:

{
  "suggestions": [
    "respuesta 1",
    "respuesta 2",
    "respuesta 3"
  ]
}
`;

    const respuesta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
      }),
    });

    const data = await respuesta.json();

    const texto = data.choices?.[0]?.message?.content ?? "";

    try {
      const json = JSON.parse(texto);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({
        suggestions: [],
      });
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      suggestions: [],
    });
  }
}