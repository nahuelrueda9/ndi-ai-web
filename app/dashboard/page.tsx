"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";

type Empresa = {
  id: string;
  nombre: string;
  rubro?: string;
  userId: string;
};

type Conversacion = {
  id: string;
  empresaId: string;
  empresaNombre: string;
  visitanteId?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  ultimoMensaje?: string;
  ultimoRol?: "user" | "assistant";
  cantidadMensajes?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type ActividadDia = {
  clave: string;
  etiqueta: string;
  cantidad: number;
};

function obtenerInicioDelDia(fecha: Date) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setHours(0, 0, 0, 0);

  return nuevaFecha;
}

function obtenerClaveFecha(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerEtiquetaDia(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
  })
    .format(fecha)
    .replace(".", "")
    .slice(0, 3);
}

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}

export default function DashboardPage() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const conversacionesPorEmpresaRef = useRef<
    Map<string, Conversacion[]>
  >(new Map());

  const suscripcionesConversacionesRef = useRef<
    Map<string, Unsubscribe>
  >(new Map());

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(auth, (usuarioActual) => {
      if (!usuarioActual) {
        window.location.href = "/login";
        return;
      }

      setUsuario(usuarioActual);
    });

    return () => cancelarAuth();
  }, []);

  useEffect(() => {
    if (!usuario) return;

    setCargando(true);
    setError("");

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", usuario.uid),
      orderBy("createdAt", "desc")
    );

    const cancelarEmpresas = onSnapshot(
      empresasQuery,
      (snapshot) => {
        const empresasActualizadas: Empresa[] = snapshot.docs.map(
          (documento) => {
            const datos = documento.data();

            return {
              id: documento.id,
              nombre: datos.nombre || "Empresa sin nombre",
              rubro: datos.rubro || "",
              userId: datos.userId,
            };
          }
        );

        setEmpresas(empresasActualizadas);

        const idsActuales = new Set(
          empresasActualizadas.map((empresa) => empresa.id)
        );

        suscripcionesConversacionesRef.current.forEach(
          (cancelarSuscripcion, empresaId) => {
            if (!idsActuales.has(empresaId)) {
              cancelarSuscripcion();

              suscripcionesConversacionesRef.current.delete(
                empresaId
              );

              conversacionesPorEmpresaRef.current.delete(
                empresaId
              );
            }
          }
        );

        if (empresasActualizadas.length === 0) {
          setConversaciones([]);
          setCargando(false);
          return;
        }

        empresasActualizadas.forEach((empresa) => {
          if (
            suscripcionesConversacionesRef.current.has(
              empresa.id
            )
          ) {
            return;
          }

          const conversacionesQuery = query(
            collection(
              db,
              "companies",
              empresa.id,
              "conversations"
            ),
            orderBy("updatedAt", "desc")
          );

          const cancelarConversaciones = onSnapshot(
            conversacionesQuery,
            (conversacionesSnapshot) => {
              const conversacionesEmpresa: Conversacion[] =
                conversacionesSnapshot.docs.map((documento) => {
                  const datos = documento.data();

                  return {
                    id: documento.id,
                    empresaId: empresa.id,
                    empresaNombre: empresa.nombre,
                    visitanteId: datos.visitanteId,
                    estado: datos.estado || "abierta",
                    atendidoPor: datos.atendidoPor || "ia",
                    humanoActivo: datos.humanoActivo === true,
                    ultimoMensaje: datos.ultimoMensaje || "",
                    ultimoRol: datos.ultimoRol,
                    cantidadMensajes:
                      typeof datos.cantidadMensajes === "number"
                        ? datos.cantidadMensajes
                        : 0,
                    createdAt: datos.createdAt,
                    updatedAt: datos.updatedAt,
                  };
                });

              conversacionesPorEmpresaRef.current.set(
                empresa.id,
                conversacionesEmpresa
              );

              const todasLasConversaciones = Array.from(
                conversacionesPorEmpresaRef.current.values()
              )
                .flat()
                .sort((a, b) => {
                  const fechaA =
                    a.updatedAt?.toMillis() ||
                    a.createdAt?.toMillis() ||
                    0;

                  const fechaB =
                    b.updatedAt?.toMillis() ||
                    b.createdAt?.toMillis() ||
                    0;

                  return fechaB - fechaA;
                });

              setConversaciones(todasLasConversaciones);
              setCargando(false);
            },
            (firebaseError) => {
              console.error(
                `Error al cargar conversaciones de ${empresa.nombre}:`,
                firebaseError
              );

              setError(
                "No se pudieron cargar algunas estadísticas."
              );

              setCargando(false);
            }
          );

          suscripcionesConversacionesRef.current.set(
            empresa.id,
            cancelarConversaciones
          );
        });

        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar empresas del dashboard:",
          firebaseError
        );

        setError(
          "No se pudieron cargar las empresas. Puede faltar un índice en Firestore."
        );

        setCargando(false);
      }
    );

    return () => {
      cancelarEmpresas();

      suscripcionesConversacionesRef.current.forEach(
        (cancelarSuscripcion) => {
          cancelarSuscripcion();
        }
      );

      suscripcionesConversacionesRef.current.clear();
      conversacionesPorEmpresaRef.current.clear();
    };
  }, [usuario]);

  const estadisticas = useMemo(() => {
    const conversacionesAbiertas = conversaciones.filter(
      (conversacion) => conversacion.estado !== "cerrada"
    ).length;

    const conversacionesCerradas = conversaciones.filter(
      (conversacion) => conversacion.estado === "cerrada"
    ).length;

    const atendidasPorHumano = conversaciones.filter(
      (conversacion) =>
        conversacion.atendidoPor === "humano" ||
        conversacion.humanoActivo === true
    ).length;

    const atendidasPorIA = conversaciones.filter(
      (conversacion) =>
        conversacion.atendidoPor !== "humano" &&
        conversacion.humanoActivo !== true
    ).length;

    const mensajesTotales = conversaciones.reduce(
      (total, conversacion) =>
        total + (conversacion.cantidadMensajes || 0),
      0
    );

    return {
      conversacionesTotales: conversaciones.length,
      conversacionesAbiertas,
      conversacionesCerradas,
      atendidasPorHumano,
      atendidasPorIA,
      mensajesTotales,
    };
  }, [conversaciones]);

  const actividadUltimosSieteDias = useMemo<ActividadDia[]>(() => {
    const dias: ActividadDia[] = [];

    for (let indice = 6; indice >= 0; indice -= 1) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - indice);

      const inicioDia = obtenerInicioDelDia(fecha);
      const clave = obtenerClaveFecha(inicioDia);

      const cantidad = conversaciones.filter((conversacion) => {
        const fechaConversacion =
          conversacion.createdAt?.toDate() ||
          conversacion.updatedAt?.toDate();

        if (!fechaConversacion) return false;

        return (
          obtenerClaveFecha(fechaConversacion) === clave
        );
      }).length;

      dias.push({
        clave,
        etiqueta: obtenerEtiquetaDia(fecha),
        cantidad,
      });
    }

    return dias;
  }, [conversaciones]);

  const actividadMaxima = Math.max(
    ...actividadUltimosSieteDias.map(
      (actividad) => actividad.cantidad
    ),
    1
  );

  const conversacionesRecientes = conversaciones.slice(0, 6);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-7 text-center shadow-2xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

          <p className="mt-4 font-medium">
            Cargando estadísticas...
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Estamos analizando la actividad de tus empresas.
          </p>
        </div>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Resumen general
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Revisá la actividad de tus empresas, conversaciones y
              asistentes desde un solo lugar.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              {usuario?.displayName
                ? usuario.displayName.charAt(0).toUpperCase()
                : "N"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {usuario?.displayName || "Administrador"}
              </p>

              <p className="max-w-56 truncate text-xs text-zinc-500">
                {usuario?.email}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            titulo="Empresas"
            valor={empresas.length}
            descripcion="Empresas registradas en tu cuenta"
          />

          <StatCard
            titulo="Conversaciones"
            valor={estadisticas.conversacionesTotales}
            descripcion="Total de chats iniciados"
          />

          <StatCard
            titulo="Conversaciones abiertas"
            valor={estadisticas.conversacionesAbiertas}
            descripcion={`${estadisticas.conversacionesCerradas} conversaciones cerradas`}
          />

          <StatCard
            titulo="Atendidas por IA"
            valor={estadisticas.atendidasPorIA}
            descripcion="Conversaciones gestionadas por el asistente"
          />

          <StatCard
            titulo="Atendidas por humanos"
            valor={estadisticas.atendidasPorHumano}
            descripcion="Conversaciones con intervención humana"
          />

          <StatCard
            titulo="Mensajes"
            valor={estadisticas.mensajesTotales}
            descripcion="Mensajes registrados en las conversaciones"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div>
              <p className="text-sm font-medium text-white">
                Actividad de los últimos 7 días
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Conversaciones nuevas iniciadas cada día.
              </p>
            </div>

            <div className="mt-8 flex h-56 items-end gap-3">
              {actividadUltimosSieteDias.map((actividad) => {
                const altura =
                  actividad.cantidad === 0
                    ? 4
                    : Math.max(
                        (actividad.cantidad / actividadMaxima) *
                          100,
                        12
                      );

                return (
                  <div
                    key={actividad.clave}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <p className="mb-2 text-xs font-medium text-zinc-400">
                      {actividad.cantidad}
                    </p>

                    <div className="flex h-full w-full items-end rounded-xl bg-zinc-950/70 p-1">
                      <div
                        className="w-full rounded-lg bg-blue-500 transition-all"
                        style={{ height: `${altura}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs capitalize text-zinc-500">
                      {actividad.etiqueta}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Estado de atención
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Distribución de las conversaciones.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <EstadoBarra
                titulo="Atendidas por IA"
                valor={estadisticas.atendidasPorIA}
                total={estadisticas.conversacionesTotales}
              />

              <EstadoBarra
                titulo="Atendidas por humanos"
                valor={estadisticas.atendidasPorHumano}
                total={estadisticas.conversacionesTotales}
              />

              <EstadoBarra
                titulo="Conversaciones abiertas"
                valor={estadisticas.conversacionesAbiertas}
                total={estadisticas.conversacionesTotales}
              />

              <EstadoBarra
                titulo="Conversaciones cerradas"
                valor={estadisticas.conversacionesCerradas}
                total={estadisticas.conversacionesTotales}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-white">
                Conversaciones recientes
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Últimos chats registrados en todas tus empresas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/empresas";
              }}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              Ver empresas
            </button>
          </div>

          {conversacionesRecientes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
                💬
              </div>

              <h3 className="mt-4 font-medium text-white">
                Todavía no hay conversaciones
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Las conversaciones aparecerán cuando alguien utilice
                uno de tus widgets.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {conversacionesRecientes.map((conversacion) => {
                const estaAtendidaPorHumano =
                  conversacion.atendidoPor === "humano" ||
                  conversacion.humanoActivo === true;

                return (
                  <button
                    key={`${conversacion.empresaId}-${conversacion.id}`}
                    type="button"
                    onClick={() => {
                      window.location.href = `/empresas/${conversacion.empresaId}/conversaciones`;
                    }}
                    className="flex w-full flex-col gap-4 px-6 py-5 text-left transition hover:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">
                          {conversacion.empresaNombre}
                        </p>

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[11px] font-medium",
                            estaAtendidaPorHumano
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400",
                          ].join(" ")}
                        >
                          {estaAtendidaPorHumano
                            ? "Atención humana"
                            : "Atención IA"}
                        </span>

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[11px] font-medium",
                            conversacion.estado === "cerrada"
                              ? "bg-zinc-700 text-zinc-300"
                              : "bg-amber-500/10 text-amber-400",
                          ].join(" ")}
                        >
                          {conversacion.estado === "cerrada"
                            ? "Cerrada"
                            : "Abierta"}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm text-zinc-400">
                        {conversacion.ultimoMensaje ||
                          "Conversación sin mensajes"}
                      </p>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <p className="text-sm text-zinc-400">
                        {conversacion.cantidadMensajes || 0} mensajes
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {formatearFecha(
                          conversacion.updatedAt ||
                            conversacion.createdAt
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

function EstadoBarra({
  titulo,
  valor,
  total,
}: {
  titulo: string;
  valor: number;
  total: number;
}) {
  const porcentaje =
    total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{titulo}</p>

        <p className="text-sm font-medium text-white">
          {valor}{" "}
          <span className="text-xs font-normal text-zinc-500">
            ({porcentaje}%)
          </span>
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}