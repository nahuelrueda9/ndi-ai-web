"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type EstadoTarea = "pendiente" | "en_progreso" | "completada";

type Tarea = {
  id: string;
  chatId: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad?: "baja" | "media" | "alta";
  createdAt?: Timestamp;
};

const EMPRESA_ID = "ZKe3UxYTjPDIHmS5SAwT";

export default function TasksPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tareasQuery = query(
      collection(db, "companies", EMPRESA_ID, "tasks"),
      orderBy("createdAt", "desc")
    );

    const cancelar = onSnapshot(
      tareasQuery,
      (snapshot) => {
        const tareasActualizadas = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })) as Tarea[];

        setTareas(tareasActualizadas);
        setCargando(false);
      },
      (error) => {
        console.error("Error al cargar tareas:", error);
        setCargando(false);
      }
    );

    return () => cancelar();
  }, []);

  const columnas = useMemo(
    () => ({
      pendiente: tareas.filter(
        (tarea) => tarea.estado === "pendiente"
      ),
      en_progreso: tareas.filter(
        (tarea) => tarea.estado === "en_progreso"
      ),
      completada: tareas.filter(
        (tarea) => tarea.estado === "completada"
      ),
    }),
    [tareas]
  );

  async function cambiarEstado(
    tareaId: string,
    estado: EstadoTarea
  ) {
    await updateDoc(
      doc(db, "companies", EMPRESA_ID, "tasks", tareaId),
      {
        estado,
        updatedAt: new Date(),
      }
    );
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        Cargando tareas...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Tareas</h1>

          <p className="mt-1 text-sm text-zinc-400">
            Seguimiento automático de oportunidades y clientes.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Columna
            titulo="Pendientes"
            tareas={columnas.pendiente}
            estado="pendiente"
            cambiarEstado={cambiarEstado}
          />

          <Columna
            titulo="En progreso"
            tareas={columnas.en_progreso}
            estado="en_progreso"
            cambiarEstado={cambiarEstado}
          />

          <Columna
            titulo="Completadas"
            tareas={columnas.completada}
            estado="completada"
            cambiarEstado={cambiarEstado}
          />
        </div>
      </div>
    </main>
  );
}

type ColumnaProps = {
  titulo: string;
  tareas: Tarea[];
  estado: EstadoTarea;
  cambiarEstado: (
    tareaId: string,
    estado: EstadoTarea
  ) => Promise<void>;
};

function Columna({
  titulo,
  tareas,
  estado,
  cambiarEstado,
}: ColumnaProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium">{titulo}</h2>

        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
          {tareas.length}
        </span>
      </div>

      <div className="space-y-3">
        {tareas.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-center text-sm text-zinc-500">
            No hay tareas.
          </div>
        )}

        {tareas.map((tarea) => (
          <article
            key={tarea.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-zinc-100">
                {tarea.titulo}
              </h3>

              <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] uppercase text-zinc-400">
                {tarea.prioridad ?? "media"}
              </span>
            </div>

            {tarea.descripcion && (
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {tarea.descripcion}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {estado !== "pendiente" && (
                <button
                  type="button"
                  onClick={() =>
                    cambiarEstado(tarea.id, "pendiente")
                  }
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Pendiente
                </button>
              )}

              {estado !== "en_progreso" && (
                <button
                  type="button"
                  onClick={() =>
                    cambiarEstado(tarea.id, "en_progreso")
                  }
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 hover:bg-blue-500/20"
                >
                  En progreso
                </button>
              )}

              {estado !== "completada" && (
                <button
                  type="button"
                  onClick={() =>
                    cambiarEstado(tarea.id, "completada")
                  }
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/20"
                >
                  Completar
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.href = `/dashboard/conversations/${tarea.chatId}`;
                }}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300 hover:bg-indigo-500/20"
              >
                Abrir conversación
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}