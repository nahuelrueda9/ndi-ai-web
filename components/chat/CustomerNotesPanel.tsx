"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import { registrarActividad } from "@/lib/chat/activityService";

type NotaInterna = {
  id: string;
  contenido: string;
  autor?: string;
  createdAt?: Timestamp;
};

type CustomerNotesPanelProps = {
  empresaId: string;
  chatId: string;
};

export default function CustomerNotesPanel({
  empresaId,
  chatId,
}: CustomerNotesPanelProps) {
  const [notas, setNotas] = useState<NotaInterna[]>([]);
  const [contenido, setContenido] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [notaEliminando, setNotaEliminando] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");

  useEffect(() => {
    setNotas([]);
    setContenido("");
    setError("");
    setMensajeAccion("");
    setCargando(true);

    if (!empresaId || !chatId) {
      setError("No se encontró la conversación.");
      setCargando(false);
      return;
    }

    const notasReferencia = collection(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId,
      "notes"
    );

    const notasQuery = query(
      notasReferencia,
      orderBy("createdAt", "desc")
    );

    const cancelarSuscripcion = onSnapshot(
      notasQuery,
      (snapshot) => {
        const lista: NotaInterna[] = snapshot.docs.map(
          (documento) => {
            const datos = documento.data();

            return {
              id: documento.id,
              contenido: datos.contenido || "",
              autor: datos.autor || "Operador",
              createdAt: datos.createdAt,
            };
          }
        );

        setNotas(lista);
        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar las notas internas:",
          firebaseError
        );

        setError("No se pudieron cargar las notas internas.");
        setCargando(false);
      }
    );

    return () => {
      cancelarSuscripcion();
    };
  }, [chatId, empresaId]);

  async function agregarNota() {
    const contenidoLimpio = contenido.trim();

    if (!contenidoLimpio || guardando) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensajeAccion("");

    try {
      const notasReferencia = collection(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId,
        "notes"
      );

      await addDoc(notasReferencia, {
        contenido: contenidoLimpio,
        autor: "Operador",
        createdAt: serverTimestamp(),
      });

      await registrarActividad({
        empresaId,
        chatId,
        tipo: "nota",
        titulo: "Nota agregada",
        descripcion: contenidoLimpio,
        icono: "📝",
      });

      setContenido("");
      setMensajeAccion("Nota interna agregada.");
    } catch (firebaseError) {
      console.error(
        "Error al guardar la nota interna:",
        firebaseError
      );

      setError("No se pudo guardar la nota interna.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarNota(notaId: string) {
    if (notaEliminando) {
      return;
    }

    const nota = notas.find((item) => item.id === notaId);

    const confirmar = window.confirm(
      "¿Seguro que querés eliminar esta nota?"
    );

    if (!confirmar) {
      return;
    }

    setNotaEliminando(notaId);
    setError("");
    setMensajeAccion("");

    try {
      const notaReferencia = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId,
        "notes",
        notaId
      );

      await deleteDoc(notaReferencia);

      await registrarActividad({
        empresaId,
        chatId,
        tipo: "nota",
        titulo: "Nota eliminada",
        descripcion: nota?.contenido
          ? `Se eliminó la nota: ${nota.contenido}`
          : "Se eliminó una nota interna.",
        icono: "🗑️",
      });

      setMensajeAccion("Nota eliminada.");
    } catch (firebaseError) {
      console.error(
        "Error al eliminar la nota interna:",
        firebaseError
      );

      setError("No se pudo eliminar la nota.");
    } finally {
      setNotaEliminando(null);
    }
  }

  function manejarTeclado(
    evento: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      evento.key === "Enter" &&
      !evento.shiftKey &&
      !evento.nativeEvent.isComposing
    ) {
      evento.preventDefault();
      void agregarNota();
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Notas internas
            </h3>

            <p className="mt-0.5 text-xs text-zinc-500">
              Solo son visibles para los operadores
            </p>
          </div>

          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">
            {notas.length}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <textarea
            value={contenido}
            onChange={(evento) => {
              setContenido(evento.target.value);
              setError("");
              setMensajeAccion("");
            }}
            onKeyDown={manejarTeclado}
            disabled={guardando}
            maxLength={1000}
            rows={3}
            placeholder="Ejemplo: llamar el lunes, pidió presupuesto..."
            className="min-h-[90px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-zinc-600">
              Enter para guardar · Shift + Enter para otra línea
            </span>

            <span className="text-[11px] text-zinc-600">
              {contenido.length}/1000
            </span>
          </div>

          <button
            type="button"
            onClick={() => void agregarNota()}
            disabled={!contenido.trim() || guardando}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {guardando ? "Guardando..." : "Agregar nota"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {mensajeAccion && !error && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-emerald-300">
              {mensajeAccion}
            </p>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
            </div>
          ) : notas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
              <p className="text-sm font-medium text-zinc-400">
                Todavía no hay notas
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Agregá información útil para el seguimiento del
                cliente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notas.map((nota) => (
                <article
                  key={nota.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
                    {nota.contenido}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-500">
                        {nota.autor || "Operador"}
                      </p>

                      <p className="mt-0.5 text-[11px] text-zinc-600">
                        {formatearFecha(nota.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void eliminarNota(nota.id)
                      }
                      disabled={notaEliminando === nota.id}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {notaEliminando === nota.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) {
    return "Guardando fecha...";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}