"use client";

import {
  Bell,
  CheckCheck,
  CircleAlert,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

import { db } from "@/lib/firebase";

type TipoNotificacion =
  | "mensaje"
  | "humano"
  | "lead"
  | "plan"
  | "sistema";

type Notificacion = {
  id: string;
  tipo?: TipoNotificacion;
  titulo?: string;
  descripcion?: string;
  leida?: boolean;
  chatId?: string;
  visitanteId?: string;
  url?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export default function NotificacionesPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      setCargando(false);
      return;
    }

    const notificacionesQuery = query(
      collection(
        db,
        "companies",
        empresaId,
        "notifications"
      ),
      orderBy("createdAt", "desc")
    );

    const cancelar = onSnapshot(
      notificacionesQuery,
      (snapshot) => {
        const datos = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...(documento.data() as Omit<Notificacion, "id">),
        }));

        setNotificaciones(datos);
        setError("");
        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar notificaciones:",
          firebaseError
        );

        setError("No se pudieron cargar las notificaciones.");
        setCargando(false);
      }
    );

    return () => cancelar();
  }, [empresaId]);

  const noLeidas = useMemo(
    () =>
      notificaciones.filter(
        (notificacion) => !notificacion.leida
      ).length,
    [notificaciones]
  );

  async function marcarComoLeida(
    notificacion: Notificacion
  ) {
    if (!empresaId || notificacion.leida) {
      abrirNotificacion(notificacion);
      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "notifications",
          notificacion.id
        ),
        {
          leida: true,
          leidaAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      abrirNotificacion(notificacion);
    } catch (firebaseError) {
      console.error(
        "Error al marcar notificación:",
        firebaseError
      );

      setError("No se pudo actualizar la notificación.");
    }
  }

  async function marcarTodasComoLeidas() {
    if (!empresaId || noLeidas === 0 || procesando) {
      return;
    }

    setProcesando(true);
    setError("");

    try {
      const batch = writeBatch(db);

      notificaciones
        .filter((notificacion) => !notificacion.leida)
        .forEach((notificacion) => {
          const referencia = doc(
            db,
            "companies",
            empresaId,
            "notifications",
            notificacion.id
          );

          batch.update(referencia, {
            leida: true,
            leidaAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

      await batch.commit();
    } catch (firebaseError) {
      console.error(
        "Error al marcar todas como leídas:",
        firebaseError
      );

      setError(
        "No se pudieron marcar todas las notificaciones."
      );
    } finally {
      setProcesando(false);
    }
  }

  function abrirNotificacion(
    notificacion: Notificacion
  ) {
    if (notificacion.url) {
      router.push(notificacion.url);
      return;
    }

    if (notificacion.chatId && empresaId) {
      router.push(
        `/empresas/${empresaId}/conversaciones/${notificacion.chatId}`
      );
    }
  }

  if (cargando) {
    return (
      <main className="mx-auto max-w-7xl p-3 text-white sm:p-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center sm:rounded-2xl sm:p-10">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500 sm:h-8 sm:w-8" />

          <p className="mt-2 text-xs text-zinc-400 sm:mt-4 sm:text-sm">
            Cargando notificaciones...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-3 text-white sm:p-6">
      <div className="flex items-center justify-between gap-2 sm:gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Bell className="h-4 w-4 text-blue-400 sm:h-6 sm:w-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold sm:text-3xl">
              Notificaciones
            </h1>

            <p className="mt-0.5 text-[10px] text-zinc-400 sm:mt-1 sm:text-base">
              Actividad reciente de tu empresa.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={marcarTodasComoLeidas}
          disabled={noLeidas === 0 || procesando}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-2 text-[9px] font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
        >
          <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

          {procesando
            ? "Actualizando..."
            : "Marcar todas como leídas"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4 sm:grid-cols-3">
        <ResumenCard
          titulo="Total"
          valor={notificaciones.length}
        />

        <ResumenCard
          titulo="Sin leer"
          valor={noLeidas}
        />

        <ResumenCard
          titulo="Leídas"
          valor={notificaciones.length - noLeidas}
        />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 sm:mt-6 sm:rounded-2xl sm:p-4 sm:text-sm">
          {error}
        </div>
      )}

      <div className="mt-3 space-y-2 sm:mt-8 sm:space-y-4">
        {notificaciones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center sm:rounded-2xl sm:p-12">
            <Bell className="mx-auto h-7 w-7 text-zinc-700 sm:h-10 sm:w-10" />

            <h2 className="mt-2 text-sm font-semibold sm:mt-4 sm:text-lg">
              Todavía no hay notificaciones
            </h2>

            <p className="mx-auto mt-1 max-w-md text-[10px] leading-4 text-zinc-500 sm:mt-2 sm:text-sm sm:leading-6">
              Los nuevos mensajes, solicitudes de atención
              humana y eventos importantes aparecerán acá.
            </p>
          </div>
        ) : (
          notificaciones.map((item) => {
            const Icono = obtenerIcono(item.tipo);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => marcarComoLeida(item)}
                className={[
                  "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition sm:gap-4 sm:rounded-2xl sm:p-5",
                  item.leida
                    ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/70"
                    : "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15",
                ].join(" ")}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 sm:h-11 sm:w-11 sm:rounded-xl">
                  <Icono className="h-4 w-4 text-blue-400 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <h2 className="truncate text-[11px] font-semibold text-white sm:text-base">
                        {item.titulo || "Notificación"}
                      </h2>

                      {!item.leida && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 sm:h-2 sm:w-2" />
                      )}
                    </div>

                    <span className="shrink-0 text-[9px] text-zinc-500 sm:text-xs">
                      {formatearFecha(item.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[10px] leading-4 text-zinc-400 sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-6">
                    {item.descripcion ||
                      "Sin descripción disponible."}
                  </p>

                  {(item.url || item.chatId) && (
                    <p className="mt-1.5 text-[9px] font-medium text-blue-400 sm:mt-3 sm:text-xs">
                      Abrir detalle →
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </main>
  );
}

function ResumenCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 sm:rounded-2xl sm:p-5">
      <p className="text-[9px] text-zinc-500 sm:text-sm">
        {titulo}
      </p>

      <p className="mt-0.5 text-xl font-bold text-white sm:mt-2 sm:text-3xl">
        {valor}
      </p>
    </div>
  );
}

function obtenerIcono(tipo?: TipoNotificacion) {
  if (tipo === "mensaje") {
    return MessageCircle;
  }

  if (tipo === "humano") {
    return UserRound;
  }

  if (tipo === "lead") {
    return Sparkles;
  }

  if (tipo === "plan") {
    return CircleAlert;
  }

  return Bell;
}

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}