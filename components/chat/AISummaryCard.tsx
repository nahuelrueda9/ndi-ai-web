"use client";

import { AlertTriangle, Brain, Crown, Gauge, Smile } from "lucide-react";
import { useEffect, useState } from "react";

type Mensaje = {
  role: "user" | "assistant";
  content: string;
};

type AnalisisIA = {
  sentimiento: "positivo" | "neutral" | "negativo";
  urgencia: "baja" | "media" | "alta";
  compra: number;
  vip: boolean;
  riesgo: "bajo" | "medio" | "alto";
  resumen: string;
  recomendacion: string;
};

type Props = {
  historial: Mensaje[];
};

export default function AISummaryCard({ historial }: Props) {
  const [analisis, setAnalisis] = useState<AnalisisIA | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (historial.length === 0) {
      setAnalisis(null);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setCargando(true);
        setError("");

        const response = await fetch("/api/sentiment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            historial: historial.map((mensaje) => ({
              role: mensaje.role,
              content: mensaje.content,
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo analizar el chat.");
        }

        setAnalisis(data);
      } catch (errorDesconocido) {
        console.error(errorDesconocido);

        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Error al analizar la conversación."
        );
      } finally {
        setCargando(false);
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [historial]);

  if (historial.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center gap-2">
        <Brain size={17} className="text-violet-400" />

        <h3 className="text-sm font-semibold text-white">
          Análisis IA
        </h3>
      </div>

      {cargando && (
        <p className="mt-3 text-xs text-zinc-500">
          Analizando conversación...
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}

      {analisis && !cargando && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Info
              icono={<Smile size={15} />}
              titulo="Sentimiento"
              valor={capitalizar(analisis.sentimiento)}
            />

            <Info
              icono={<AlertTriangle size={15} />}
              titulo="Urgencia"
              valor={capitalizar(analisis.urgencia)}
            />

            <Info
              icono={<Gauge size={15} />}
              titulo="Compra"
              valor={`${normalizarCompra(analisis.compra)}%`}
            />

            <Info
              icono={<Crown size={15} />}
              titulo="VIP"
              valor={analisis.vip ? "Sí" : "No"}
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Resumen
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-300">
              {analisis.resumen}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Recomendación
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-300">
              {analisis.recomendacion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  icono,
  titulo,
  valor,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center gap-2 text-zinc-500">
        {icono}

        <span className="text-[11px]">
          {titulo}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-white">
        {valor}
      </p>
    </div>
  );
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizarCompra(valor: number) {
  if (!Number.isFinite(valor)) return 0;

  return Math.min(100, Math.max(0, Math.round(valor)));
}