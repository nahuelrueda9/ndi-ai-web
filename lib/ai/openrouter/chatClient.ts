export type LlamadaHerramientaOpenRouter = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type MensajeOpenRouter = {
  role: string;
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: LlamadaHerramientaOpenRouter[];
};

type GenerarRespuestaParams = {
  apiKey: string;
  mensajes: MensajeOpenRouter[];
  herramientas?: readonly unknown[];
  permitirHerramientas?: boolean;
};

export type RespuestaOpenRouter = {
  mensaje: MensajeOpenRouter;
  datosCompletos: unknown;
};

export class OpenRouterError extends Error {
  status: number;
  detalles: unknown;

  constructor(
    mensaje: string,
    status: number,
    detalles: unknown
  ) {
    super(mensaje);

    this.name = "OpenRouterError";
    this.status = status;
    this.detalles = detalles;
  }
}

export async function generarRespuestaOpenRouter({
  apiKey,
  mensajes,
  herramientas = [],
  permitirHerramientas = true,
}: GenerarRespuestaParams): Promise<RespuestaOpenRouter> {
  const body: Record<string, unknown> = {
    model: "openrouter/free",
    messages: mensajes,
    temperature: 0.3,
    max_tokens: 500,
  };

  if (herramientas.length > 0) {
    body.tools = herramientas;

    body.tool_choice = permitirHerramientas
      ? "auto"
      : "none";

    body.parallel_tool_calls = false;
  }

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

      body: JSON.stringify(body),
    }
  );

  const data: unknown = await response.json();

  if (!response.ok) {
    const datosError =
      data && typeof data === "object"
        ? (data as {
            error?: {
              message?: string;
            };
          })
        : {};

    const mensajeError =
      typeof datosError.error?.message === "string"
        ? datosError.error.message
        : "No se pudo generar la respuesta del agente.";

    throw new OpenRouterError(
      mensajeError,
      response.status,
      data
    );
  }

  const datosRespuesta =
    data && typeof data === "object"
      ? (data as {
          choices?: Array<{
            message?: MensajeOpenRouter;
          }>;
        })
      : {};

  const mensaje =
    datosRespuesta.choices?.[0]?.message;

  if (!mensaje) {
    throw new OpenRouterError(
      "OpenRouter no devolvió un mensaje válido.",
      502,
      data
    );
  }

  return {
    mensaje,
    datosCompletos: data,
  };
}