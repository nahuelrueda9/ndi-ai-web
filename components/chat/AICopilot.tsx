"use client";

import {
  Copy,
  FileText,
  Languages,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

type MensajeCopilot = {
  role: "user" | "assistant";
  content: string;
  enviadoPor?: "cliente" | "ia" | "humano";
};

type MemoriaCliente = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
};

type AICopilotProps = {
  respuestaActual: string;
  historial: MensajeCopilot[];
  memoria?: MemoriaCliente;
  empresa?: string;
  onInsertar: (texto: string) => void;
};

export default function AICopilot({
  respuestaActual,
  historial,
  memoria,
  empresa,
  onInsertar,
}: AICopilotProps) {
  const [cargando, setCargando] = useState<
    "sugerir" | "mejorar" | "traducir" | "resumir" | null
  >(null);

  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function solicitar(
    endpoint: string,
    body: Record<string, unknown>,
    accion: "sugerir" | "mejorar" | "traducir" | "resumir"
  ) {
    try {
      setCargando(accion);
      setError("");
      setCopiado(false);

      const respuestaApi = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseText = await respuestaApi.text();

let data: any;

try {
  data = JSON.parse(responseText);
} catch {
  console.error("Respuesta HTML de /api/gemini:", responseText);

  throw new Error(
    `La API /api/gemini devolvió HTML. Estado ${respuestaApi.status}`
  );
}

      if (!respuestaApi.ok) {
        throw new Error(
          data?.error || "No se pudo completar la acción."
        );
      }

      if (accion === "sugerir") {
        const nuevasSugerencias = Array.isArray(data?.suggestions)
          ? data.suggestions.filter(
              (item: unknown): item is string =>
                typeof item === "string" && item.trim().length > 0
            )
          : [];

        if (nuevasSugerencias.length === 0) {
          throw new Error(
            "La IA no generó sugerencias en este momento."
          );
        }

        setSugerencias(nuevasSugerencias);
        setResultado("");
        return;
      }

      const textoResultado =
        typeof data?.resultado === "string"
          ? data.resultado.trim()
          : "";

      if (!textoResultado) {
        throw new Error(
          "La IA no devolvió ningún resultado."
        );
      }

      setResultado(textoResultado);
      setSugerencias([]);
    } catch (errorDesconocido) {
      console.error("Error en AI Copilot:", errorDesconocido);

      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setCargando(null);
    }
  }

  function generarSugerencias() {
    if (historial.length === 0) {
      setError("No hay mensajes para analizar.");
      return;
    }

    solicitar(
      "/api/suggestions",
      {
        mensaje: historial.at(-1)?.content || "",
        historial: historial.map((mensaje) => ({
          role: mensaje.role,
          content: mensaje.content,
        })),
        empresa: empresa || "",
        memoria: memoria || {},
      },
      "sugerir"
    );
  }

  function mejorarRespuesta() {
    if (!respuestaActual.trim()) {
      setError(
        "Primero escribí una respuesta para poder mejorarla."
      );
      return;
    }

    solicitar(
      "/api/improve",
      {
        texto: respuestaActual,
      },
      "mejorar"
    );
  }

  function traducirRespuesta() {
    if (!respuestaActual.trim()) {
      setError(
        "Primero escribí una respuesta para poder traducirla."
      );
      return;
    }

    solicitar(
      "/api/translate",
      {
        texto: respuestaActual,
        idioma: "inglés",
      },
      "traducir"
    );
  }

  function resumirConversacion() {
    if (historial.length === 0) {
      setError("No hay mensajes para resumir.");
      return;
    }

    solicitar(
      "/api/summarize",
      {
        historial: historial.map((mensaje) => ({
          role: mensaje.role,
          content: mensaje.content,
        })),
      },
      "resumir"
    );
  }

  async function copiarTexto(texto: string) {
    if (!texto.trim()) return;

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 1800);
    } catch (errorCopiar) {
      console.error("No se pudo copiar:", errorCopiar);
      setError("No se pudo copiar el texto.");
    }
  }

  const estaCargando = cargando !== null;

  return (
    <aside className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles size={17} className="text-blue-400" />

          <h3 className="text-sm font-semibold text-white">
            AI Copilot
          </h3>
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Generá, mejorá y analizá respuestas con inteligencia
          artificial.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={estaCargando}
          onClick={generarSugerencias}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando === "sugerir" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}

          Sugerir
        </button>

        <button
          type="button"
          disabled={estaCargando}
          onClick={mejorarRespuesta}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando === "mejorar" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}

          Mejorar
        </button>

        <button
          type="button"
          disabled={estaCargando}
          onClick={traducirRespuesta}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando === "traducir" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Languages size={15} />
          )}

          Traducir
        </button>

        <button
          type="button"
          disabled={estaCargando}
          onClick={resumirConversacion}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando === "resumir" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FileText size={15} />
          )}

          Resumir
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-xs leading-5 text-red-300">
            {error}
          </p>
        </div>
      )}

      {sugerencias.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Respuestas sugeridas
          </p>

          {sugerencias.map((sugerencia, indice) => (
            <button
              key={`${sugerencia}-${indice}`}
              type="button"
              onClick={() => onInsertar(sugerencia)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left text-xs leading-5 text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-800"
            >
              {sugerencia}
            </button>
          ))}
        </div>
      )}

      {resultado && (
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <p className="whitespace-pre-wrap break-words text-xs leading-5 text-zinc-200">
            {resultado}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onInsertar(resultado)}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              Usar texto
            </button>

            <button
              type="button"
              onClick={() => copiarTexto(resultado)}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              <Copy size={14} />
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {!resultado && sugerencias.length === 0 && (
        <button
          type="button"
          onClick={() => copiarTexto(respuestaActual)}
          disabled={!respuestaActual.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={14} />
          {copiado ? "Copiado" : "Copiar respuesta"}
        </button>
      )}
    </aside>
  );
}