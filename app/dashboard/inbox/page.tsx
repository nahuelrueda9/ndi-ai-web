"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";
import ConversationChatPanel from "@/components/chat/ConversationChatPanel";

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

type Filtro = "todas" | "abiertas" | "ia" | "humano";

export default function InboxPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);

  const [conversacionSeleccionada, setConversacionSeleccionada] =
    useState<Conversacion | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const conversacionesPorEmpresaRef = useRef<
    Map<string, Conversacion[]>
  >(new Map());

  const suscripcionesRef = useRef<Map<string, Unsubscribe>>(
    new Map()
  );

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(
      auth,
      (usuarioActual) => {
        if (!usuarioActual) {
          router.replace("/login");
          return;
        }

        setUsuario(usuarioActual);
      }
    );

    return () => cancelarAuth();
  }, [router]);

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
        const empresasActualizadas: Empresa[] =
          snapshot.docs.map((documento) => {
            const datos = documento.data();

            return {
              id: documento.id,
              nombre: datos.nombre || "Empresa sin nombre",
              rubro: datos.rubro || "",
              userId: datos.userId || "",
            };
          });

        setEmpresas(empresasActualizadas);

        const idsEmpresasActuales = new Set(
          empresasActualizadas.map((empresa) => empresa.id)
        );

        suscripcionesRef.current.forEach(
          (cancelarSuscripcion, empresaId) => {
            if (!idsEmpresasActuales.has(empresaId)) {
              cancelarSuscripcion();
              suscripcionesRef.current.delete(empresaId);
              conversacionesPorEmpresaRef.current.delete(
                empresaId
              );
            }
          }
        );

        if (empresasActualizadas.length === 0) {
          setConversaciones([]);
          setConversacionSeleccionada(null);
          setCargando(false);
          return;
        }

        empresasActualizadas.forEach((empresa) => {
          if (suscripcionesRef.current.has(empresa.id)) {
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
              const listaEmpresa: Conversacion[] =
                conversacionesSnapshot.docs.map(
                  (documento) => {
                    const datos = documento.data();

                    return {
                      id: documento.id,
                      empresaId: empresa.id,
                      empresaNombre: empresa.nombre,
                      visitanteId: datos.visitanteId || "",
                      estado: datos.estado || "abierta",
                      atendidoPor:
                        datos.atendidoPor || "ia",
                      humanoActivo:
                        datos.humanoActivo === true,
                      ultimoMensaje:
                        datos.ultimoMensaje || "",
                      ultimoRol: datos.ultimoRol,
                      cantidadMensajes:
                        typeof datos.cantidadMensajes ===
                        "number"
                          ? datos.cantidadMensajes
                          : 0,
                      createdAt: datos.createdAt,
                      updatedAt: datos.updatedAt,
                    };
                  }
                );

              conversacionesPorEmpresaRef.current.set(
                empresa.id,
                listaEmpresa
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

              setConversacionSeleccionada(
                (seleccionActual) => {
                  if (seleccionActual) {
                    const conversacionActualizada =
                      todasLasConversaciones.find(
                        (conversacion) =>
                          conversacion.id ===
                            seleccionActual.id &&
                          conversacion.empresaId ===
                            seleccionActual.empresaId
                      );

                    if (conversacionActualizada) {
                      return conversacionActualizada;
                    }
                  }

                  return todasLasConversaciones[0] || null;
                }
              );

              setCargando(false);
            },
            (firebaseError) => {
              console.error(
                `Error al cargar conversaciones de ${empresa.nombre}:`,
                firebaseError
              );

              setError(
                "No se pudieron cargar algunas conversaciones."
              );

              setCargando(false);
            }
          );

          suscripcionesRef.current.set(
            empresa.id,
            cancelarConversaciones
          );
        });

        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar las empresas del Inbox:",
          firebaseError
        );

        setError(
          firebaseError.code === "permission-denied"
            ? "No tenés permisos para acceder al Inbox."
            : "No se pudieron cargar las empresas. Puede faltar un índice en Firestore."
        );

        setCargando(false);
      }
    );

    return () => {
      cancelarEmpresas();

      suscripcionesRef.current.forEach(
        (cancelarSuscripcion) => {
          cancelarSuscripcion();
        }
      );

      suscripcionesRef.current.clear();
      conversacionesPorEmpresaRef.current.clear();
    };
  }, [usuario]);

  const conversacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return conversaciones.filter((conversacion) => {
      const nombreVisitante = obtenerNombreVisitante(
        conversacion.visitanteId
      ).toLowerCase();

      const coincideBusqueda =
        !texto ||
        conversacion.empresaNombre
          .toLowerCase()
          .includes(texto) ||
        nombreVisitante.includes(texto) ||
        conversacion.visitanteId
          ?.toLowerCase()
          .includes(texto) ||
        conversacion.ultimoMensaje
          ?.toLowerCase()
          .includes(texto) ||
        conversacion.id.toLowerCase().includes(texto);

      if (!coincideBusqueda) return false;

      if (filtro === "abiertas") {
        return conversacion.estado !== "cerrada";
      }

      if (filtro === "humano") {
        return (
          conversacion.atendidoPor === "humano" ||
          conversacion.humanoActivo === true
        );
      }

      if (filtro === "ia") {
        return (
          conversacion.atendidoPor !== "humano" &&
          conversacion.humanoActivo !== true
        );
      }

      return true;
    });
  }, [busqueda, conversaciones, filtro]);

  const estadisticas = useMemo(() => {
    const abiertas = conversaciones.filter(
      (conversacion) =>
        conversacion.estado !== "cerrada"
    ).length;

    const humanas = conversaciones.filter(
      (conversacion) =>
        conversacion.atendidoPor === "humano" ||
        conversacion.humanoActivo === true
    ).length;

    const ia = conversaciones.filter(
      (conversacion) =>
        conversacion.atendidoPor !== "humano" &&
        conversacion.humanoActivo !== true
    ).length;

    return {
      total: conversaciones.length,
      abiertas,
      humanas,
      ia,
    };
  }, [conversaciones]);

  const abrirConversacionCompleta = (
    conversacion: Conversacion
  ) => {
    router.push(
      `/empresas/${conversacion.empresaId}/conversaciones/${conversacion.id}`
    );
  };

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <Card className="w-full max-w-sm p-7 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

          <p className="mt-4 font-medium">
            Cargando Inbox...
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Estamos reuniendo las conversaciones de todas tus
            empresas.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Centro de atención
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Inbox
              </h1>

              <Badge variant="info">
                {estadisticas.total} conversaciones
              </Badge>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Administrá desde un solo lugar las consultas
              recibidas en todas tus empresas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ResumenMini
              label="Total"
              valor={estadisticas.total}
            />

            <ResumenMini
              label="Abiertas"
              valor={estadisticas.abiertas}
            />

            <ResumenMini
              label="IA"
              valor={estadisticas.ia}
            />

            <ResumenMini
              label="Humanas"
              valor={estadisticas.humanas}
            />
          </div>
        </header>

        {error && (
          <Card className="mb-5 border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </Card>
        )}

        <Card className="mb-5 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex-1">
              <Input
                id="buscarInbox"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Buscar por empresa, visitante, mensaje o ID..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={
                  filtro === "todas"
                    ? "primary"
                    : "ghost"
                }
                onClick={() => setFiltro("todas")}
              >
                Todas
              </Button>

              <Button
                size="sm"
                variant={
                  filtro === "abiertas"
                    ? "primary"
                    : "ghost"
                }
                onClick={() => setFiltro("abiertas")}
              >
                Abiertas
              </Button>

              <Button
                size="sm"
                variant={
                  filtro === "ia"
                    ? "primary"
                    : "ghost"
                }
                onClick={() => setFiltro("ia")}
              >
                IA
              </Button>

              <Button
                size="sm"
                variant={
                  filtro === "humano"
                    ? "primary"
                    : "ghost"
                }
                onClick={() => setFiltro("humano")}
              >
                Humanas
              </Button>
            </div>
          </div>
        </Card>

        {empresas.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
              🏢
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Primero tenés que crear una empresa
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              El Inbox mostrará las conversaciones de todas las
              empresas registradas en tu cuenta.
            </p>

            <Button
              className="mt-6"
              onClick={() => router.push("/empresas")}
            >
              Ir a Empresas
            </Button>
          </Card>
        ) : conversaciones.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
              💬
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Todavía no hay conversaciones
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Cuando un visitante escriba desde alguno de tus
              widgets, la conversación aparecerá acá
              automáticamente.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="grid min-h-[650px] lg:grid-cols-[390px_minmax(0,1fr)]">
              <aside className="border-b border-zinc-800 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                  <div>
                    <p className="font-medium text-white">
                      Conversaciones
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {conversacionesFiltradas.length} resultados
                    </p>
                  </div>

                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-500/10 px-2 text-xs font-semibold text-blue-400">
                    {estadisticas.abiertas}
                  </span>
                </div>

                <div className="max-h-[650px] overflow-y-auto">
                  {conversacionesFiltradas.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="font-medium text-white">
                        No encontramos resultados
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        Probá con otra búsqueda o cambiá el
                        filtro.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {conversacionesFiltradas.map(
                        (conversacion) => {
                          const nombreVisitante =
                            obtenerNombreVisitante(
                              conversacion.visitanteId
                            );

                          const seleccionada =
                            conversacionSeleccionada?.id ===
                              conversacion.id &&
                            conversacionSeleccionada
                              ?.empresaId ===
                              conversacion.empresaId;

                          const esHumana =
                            conversacion.atendidoPor ===
                              "humano" ||
                            conversacion.humanoActivo === true;

                          return (
                            <button
                              key={`${conversacion.empresaId}-${conversacion.id}`}
                              type="button"
                              onClick={() =>
                                setConversacionSeleccionada(
                                  conversacion
                                )
                              }
                              className={[
                                "w-full px-5 py-4 text-left transition",
                                seleccionada
                                  ? "bg-blue-500/10"
                                  : "hover:bg-zinc-800/50",
                              ].join(" ")}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                  <Avatar
                                    name={nombreVisitante}
                                    size="sm"
                                  />

                                  <span
                                    className={[
                                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900",
                                      conversacion.estado ===
                                      "cerrada"
                                        ? "bg-zinc-600"
                                        : "bg-emerald-500",
                                    ].join(" ")}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="truncate text-sm font-medium text-white">
                                      {nombreVisitante}
                                    </p>

                                    <span className="shrink-0 text-[11px] text-zinc-600">
                                      {formatearHoraCorta(
                                        conversacion.updatedAt ||
                                          conversacion.createdAt
                                      )}
                                    </span>
                                  </div>

                                  <p className="mt-1 truncate text-xs font-medium text-blue-400">
                                    {
                                      conversacion.empresaNombre
                                    }
                                  </p>

                                  <p className="mt-2 truncate text-sm text-zinc-400">
                                    {conversacion.ultimoMensaje ||
                                      "Conversación sin mensajes"}
                                  </p>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                      className={[
                                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                        esHumana
                                          ? "bg-emerald-500/10 text-emerald-400"
                                          : "bg-blue-500/10 text-blue-400",
                                      ].join(" ")}
                                    >
                                      {esHumana
                                        ? "Humano"
                                        : "IA"}
                                    </span>

                                    <span
                                      className={[
                                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                        conversacion.estado ===
                                        "cerrada"
                                          ? "bg-zinc-700 text-zinc-300"
                                          : "bg-amber-500/10 text-amber-400",
                                      ].join(" ")}
                                    >
                                      {conversacion.estado ===
                                      "cerrada"
                                        ? "Cerrada"
                                        : "Abierta"}
                                    </span>

                                    <span className="text-[10px] text-zinc-600">
                                      {conversacion.cantidadMensajes ||
                                        0}{" "}
                                      mensajes
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </aside>

              <main className="min-w-0">
                {conversacionSeleccionada ? (
                  <ConversationChatPanel
                    empresaId={conversacionSeleccionada.empresaId}
                    chatId={conversacionSeleccionada.id}
                    empresaNombre={
                      conversacionSeleccionada.empresaNombre
                    }
                    onAbrirConversacion={() =>
                      abrirConversacionCompleta(
                        conversacionSeleccionada
                      )
                    }
                  />
                ) : (
                  <div className="flex min-h-[650px] items-center justify-center px-6 text-center">
                    <div>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                        💬
                      </div>

                      <h2 className="mt-5 text-xl font-semibold text-white">
                        Seleccioná una conversación
                      </h2>

                      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                        Elegí una conversación de la lista para
                        ver su información.
                      </p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </Card>
        )}
      </section>
    </DashboardLayout>
  );
}

function ResumenMini({
  label,
  valor,
}: {
  label: string;
  valor: number;
}) {
  return (
    <div className="min-w-24 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>

      <p className="mt-1 text-lg font-semibold text-white">
        {valor}
      </p>
    </div>
  );
}

function obtenerNombreVisitante(visitanteId?: string) {
  if (!visitanteId) return "Visitante anónimo";

  const parteVisible = visitanteId
    .replace("visitante-", "")
    .slice(0, 8);

  return `Visitante ${parteVisible}`;
}

function formatearHoraCorta(timestamp?: Timestamp) {
  if (!timestamp) return "";

  const fecha = timestamp.toDate();
  const hoy = new Date();

  const mismoDia =
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear();

  if (mismoDia) {
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(fecha);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(fecha);
}