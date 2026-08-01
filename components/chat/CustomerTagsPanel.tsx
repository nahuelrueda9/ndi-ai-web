"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { registrarActividad } from "@/lib/chat/activityService";
import { db } from "@/lib/firebase";

type CustomerTagsPanelProps = {
  empresaId: string;
  chatId: string;
  tags?: string[];
};

const ETIQUETAS_DISPONIBLES = [
  "Nuevo",
  "Interesado",
  "Presupuesto",
  "Seguimiento",
  "Cliente",
  "Urgente",
  "Perdido",
];

export default function CustomerTagsPanel({
  empresaId,
  chatId,
  tags = [],
}: CustomerTagsPanelProps) {
  const [etiquetas, setEtiquetas] = useState<string[]>(tags);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");

  useEffect(() => {
    setEtiquetas(tags);
  }, [tags]);

  async function guardarEtiquetas(
    nuevasEtiquetas: string[]
  ): Promise<boolean> {
    if (guardando || !empresaId || !chatId) {
      return false;
    }

    setGuardando(true);
    setError("");
    setMensajeAccion("");

    try {
      const conversacionReferencia = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId
      );

      await updateDoc(conversacionReferencia, {
        tags: nuevasEtiquetas,
        updatedAt: serverTimestamp(),
      });

      setEtiquetas(nuevasEtiquetas);

      return true;
    } catch (firebaseError) {
      console.error(
        "Error al guardar las etiquetas:",
        firebaseError
      );

      setError("No se pudieron guardar las etiquetas.");

      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function agregarEtiqueta(etiqueta: string) {
    if (
      guardando ||
      etiquetas.includes(etiqueta)
    ) {
      return;
    }

    const nuevasEtiquetas = [...etiquetas, etiqueta];

    const guardadoCorrectamente =
      await guardarEtiquetas(nuevasEtiquetas);

    if (!guardadoCorrectamente) {
      return;
    }

    try {
      await registrarActividad({
        empresaId,
        chatId,
        tipo: "tag",
        titulo: "Etiqueta agregada",
        descripcion: `Se agregó la etiqueta "${etiqueta}".`,
        icono: "🏷️",
      });

      setMensajeAccion(
        `Etiqueta "${etiqueta}" agregada.`
      );
    } catch (firebaseError) {
      console.error(
        "La etiqueta se guardó, pero no se pudo registrar la actividad:",
        firebaseError
      );

      setMensajeAccion(
        `Etiqueta "${etiqueta}" agregada.`
      );
    }
  }

  async function eliminarEtiqueta(etiqueta: string) {
    if (guardando) {
      return;
    }

    const nuevasEtiquetas = etiquetas.filter(
      (item) => item !== etiqueta
    );

    const guardadoCorrectamente =
      await guardarEtiquetas(nuevasEtiquetas);

    if (!guardadoCorrectamente) {
      return;
    }

    try {
      await registrarActividad({
        empresaId,
        chatId,
        tipo: "tag",
        titulo: "Etiqueta eliminada",
        descripcion: `Se eliminó la etiqueta "${etiqueta}".`,
        icono: "❌",
      });

      setMensajeAccion(
        `Etiqueta "${etiqueta}" eliminada.`
      );
    } catch (firebaseError) {
      console.error(
        "La etiqueta se eliminó, pero no se pudo registrar la actividad:",
        firebaseError
      );

      setMensajeAccion(
        `Etiqueta "${etiqueta}" eliminada.`
      );
    }
  }

  const etiquetasRestantes = ETIQUETAS_DISPONIBLES.filter(
    (etiqueta) => !etiquetas.includes(etiqueta)
  );

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Etiquetas
            </h3>

            <p className="mt-0.5 text-xs text-zinc-500">
              Clasificá esta conversación
            </p>
          </div>

          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">
            {etiquetas.length}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {etiquetas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center">
            <p className="text-sm font-medium text-zinc-400">
              No hay etiquetas
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Agregá una para clasificar al cliente.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {etiquetas.map((etiqueta) => (
              <span
                key={etiqueta}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  obtenerClaseEtiqueta(etiqueta),
                ].join(" ")}
              >
                {etiqueta}

                <button
                  type="button"
                  onClick={() =>
                    void eliminarEtiqueta(etiqueta)
                  }
                  disabled={guardando}
                  className="rounded-full px-1 text-current transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Eliminar etiqueta ${etiqueta}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {etiquetasRestantes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Agregar etiqueta
            </p>

            <div className="flex flex-wrap gap-2">
              {etiquetasRestantes.map((etiqueta) => (
                <button
                  key={etiqueta}
                  type="button"
                  onClick={() =>
                    void agregarEtiqueta(etiqueta)
                  }
                  disabled={guardando}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + {etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        {guardando && (
          <p className="text-xs text-zinc-500">
            Guardando etiquetas...
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-300">
              {error}
            </p>
          </div>
        )}

        {mensajeAccion && !error && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-emerald-300">
              {mensajeAccion}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function obtenerClaseEtiqueta(etiqueta: string) {
  switch (etiqueta) {
    case "Nuevo":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

    case "Interesado":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";

    case "Presupuesto":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";

    case "Seguimiento":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";

    case "Cliente":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

    case "Urgente":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "Perdido":
      return "border-zinc-600 bg-zinc-800 text-zinc-300";

    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}