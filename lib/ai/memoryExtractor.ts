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

function extraerObjetoJson(texto: string): unknown | null {
  const textoLimpio = limpiarTextoJson(texto);

  /*
   * Primero intentamos interpretar toda la respuesta como JSON.
   */
  try {
    return JSON.parse(textoLimpio);
  } catch {
    // Continuamos buscando un objeto JSON dentro del texto.
  }

  /*
   * Si el modelo agregó texto antes o después,
   * buscamos desde la primera llave hasta la última.
   */
  const inicio = textoLimpio.indexOf("{");
  const final = textoLimpio.lastIndexOf("}");

  if (inicio === -1 || final === -1 || final <= inicio) {
    return null;
  }

  const posibleJson = textoLimpio.slice(inicio, final + 1);

  try {
    return JSON.parse(posibleJson);
  } catch {
    return null;
  }
}

function limpiarMemoria(datos: unknown): MemoriaCliente {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return {};
  }

  const objeto = datos as Record<string, unknown>;
  const memoria: MemoriaCliente = {};

  for (const campo of CAMPOS_VALIDOS) {
    const valor = objeto[campo];

    if (typeof valor !== "string") {
      continue;
    }

    const valorLimpio = valor.trim();

    if (!valorLimpio) {
      continue;
    }

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

    const instrucciones = `
Sos un extractor de memoria para un CRM.

Tu única tarea es extraer información explícita del último mensaje.

Reglas obligatorias:

- Respondé solamente un objeto JSON válido.
- No agregues explicaciones.
- No uses bloques de código.
- No inventes ni deduzcas información.
- No completes datos faltantes.
- Si no existe información nueva, respondé {}.
- Si el usuario corrige un dato, devolvé el dato corregido.

Campos permitidos:

{
  "nombre": "",
  "empresa": "",
  "email": "",
  "telefono": "",
  "ciudad": "",
  "intereses": "",
  "ultimoTema": "",
  "presupuesto": ""
}
`.trim();

    const contenidoUsuario = `
Memoria actual:
${JSON.stringify(memoriaActual)}

Último mensaje:
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
            process.env.NEXT_PUBLIC_APP_URL ||
            "http://localhost:3000",
          "X-OpenRouter-Title": "NDI AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: instrucciones,
            },
            {
              role: "user",
              content: contenidoUsuario,
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

    const data =
      (await response.json()) as RespuestaOpenRouter;

    const texto =
      data.choices?.[0]?.message?.content;

    if (typeof texto !== "string" || !texto.trim()) {
      return memoriaActual;
    }

    const objetoExtraido = extraerObjetoJson(texto);

    /*
     * Si el modelo responde algo que no es JSON,
     * no detenemos el chat ni generamos un error.
     */
    if (!objetoExtraido) {
      console.warn(
        "El extractor de memoria devolvió texto no válido. Se conserva la memoria anterior."
      );

      return memoriaActual;
    }

    const datosExtraidos =
      limpiarMemoria(objetoExtraido);

    return {
      ...memoriaActual,
      ...datosExtraidos,
    };
  } catch (error) {
    console.error(
      "No se pudo actualizar la memoria del cliente:",
      error
    );

    return memoriaActual;
  }
}