export type MemoriaCliente = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;

  intereses?: string;
  ultimoTema?: string;
  presupuesto?: string;
};

type RespuestaOpenRouter = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const CAMPOS_VALIDOS: Array<keyof MemoriaCliente> = [
  "nombre",
  "empresa",
  "email",
  "telefono",
  "ciudad",
  "intereses",
  "ultimoTema",
  "presupuesto",
];

function limpiarTextoJson(texto: string) {
  return texto
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function limpiarMemoria(datos: unknown): MemoriaCliente {
  if (!datos || typeof datos !== "object") {
    return {};
  }

  const objeto = datos as Record<string, unknown>;
  const memoria: MemoriaCliente = {};

  for (const campo of CAMPOS_VALIDOS) {
    const valor = objeto[campo];

    if (typeof valor !== "string") continue;

    const valorLimpio = valor.trim();

    if (!valorLimpio) continue;

    memoria[campo] = valorLimpio;
  }

  return memoria;
}

export async function extraerMemoriaConIA(
  mensaje: string,
  memoriaActual: MemoriaCliente = {}
): Promise<MemoriaCliente> {
  const mensajeLimpio = mensaje.trim();

  if (!mensajeLimpio) {
    return memoriaActual;
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return memoriaActual;
    }

    const prompt = `
Sos un extractor de memoria para un CRM.

No respondas al usuario.

Analizá únicamente el último mensaje.

Extraé únicamente información explícita.

Respondé exclusivamente un JSON válido.

{
  "nombre":"",
  "empresa":"",
  "email":"",
  "telefono":"",
  "ciudad":"",
  "intereses":"",
  "ultimoTema":"",
  "presupuesto":""
}

Qué guardar:

- nombre del cliente
- empresa
- email
- teléfono
- ciudad
- intereses (qué quiere comprar o consultar)
- último tema de conversación
- presupuesto mencionado

Reglas:

- No inventes.
- No deduzcas.
- No completes datos faltantes.
- Si no hay información nueva devolvé {}.
- Si corrige un dato devolvé el dato corregido.
- Nunca respondas texto fuera del JSON.

Memoria actual:
${JSON.stringify(memoriaActual)}

Mensaje:
${mensajeLimpio}
`.trim();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-OpenRouter-Title": "NDI AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
          temperature: 0,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Error al extraer memoria:",
        response.status,
        await response.text()
      );

      return memoriaActual;
    }

    const data = (await response.json()) as RespuestaOpenRouter;

    const texto = data.choices?.[0]?.message?.content;

    if (typeof texto !== "string" || !texto.trim()) {
      return memoriaActual;
    }

    const datosExtraidos = limpiarMemoria(
      JSON.parse(limpiarTextoJson(texto))
    );

    return {
      ...memoriaActual,
      ...datosExtraidos,
    };
  } catch (error) {
    console.error("Error procesando memoria:", error);
    return memoriaActual;
  }
}