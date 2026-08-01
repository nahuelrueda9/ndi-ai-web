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
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

interface Empresa {
  id: string;
  nombre: string;
  rubro?: string;
  createdAt?: Timestamp;
}

interface Conversacion {
  id: string;
  empresaId: string;
  titulo?: string;
  visitanteId?: string;
  estado?: string;
  atendidoPor?: string;
  humanoActivo?: boolean;
  ultimoMensaje?: string;
  cantidadMensajes?: number;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [error, setError] = useState("");

  const conversacionesPorEmpresaRef = useRef<Record<string, Conversacion[]>>(
    {}
  );
  const unsubscribesRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError("");

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const combinarConversaciones = () => {
      const todas = Object.values(conversacionesPorEmpresaRef.current).flat();

      todas.sort((a, b) => {
        const fechaA =
          a.updatedAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const fechaB =
          b.updatedAt?.toMillis() || b.createdAt?.toMillis() || 0;

        return fechaB - fechaA;
      });

      setConversaciones(todas);
    };

    const unsubscribeEmpresas = onSnapshot(
      empresasQuery,
      (snapshot) => {
        const datos = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...(documento.data() as Omit<Empresa, "id">),
        }));

        setEmpresas(datos);

        const idsActuales = new Set(datos.map((empresa) => empresa.id));

        Object.entries(unsubscribesRef.current).forEach(
          ([empresaId, unsubscribe]) => {
            if (!idsActuales.has(empresaId)) {
              unsubscribe();
              delete unsubscribesRef.current[empresaId];
              delete conversacionesPorEmpresaRef.current[empresaId];
            }
          }
        );

        datos.forEach((empresa) => {
          if (unsubscribesRef.current[empresa.id]) return;

          const conversacionesQuery = query(
            collection(db, "companies", empresa.id, "conversations"),
            orderBy("updatedAt", "desc")
          );

          unsubscribesRef.current[empresa.id] = onSnapshot(
            conversacionesQuery,
            (conversacionesSnapshot) => {
              conversacionesPorEmpresaRef.current[empresa.id] =
                conversacionesSnapshot.docs.map((documento) => ({
                  id: documento.id,
                  empresaId: empresa.id,
                  ...(documento.data() as Omit<
                    Conversacion,
                    "id" | "empresaId"
                  >),
                }));

              combinarConversaciones();
            },
            (firebaseError) => {
              console.error(
                `Error al cargar conversaciones de ${empresa.nombre}:`,
                firebaseError
              );

              setError(
                "No se pudieron cargar algunas conversaciones. Revisá las reglas o los índices de Firestore."
              );
            }
          );
        });

        if (datos.length === 0) {
          conversacionesPorEmpresaRef.current = {};
          setConversaciones([]);
        }

        setLoading(false);
      },
      (firebaseError) => {
        console.error("Error al cargar empresas:", firebaseError);
        setError(
          "No se pudieron cargar los datos del dashboard. Revisá las reglas o los índices de Firestore."
        );
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEmpresas();

      Object.values(unsubscribesRef.current).forEach((unsubscribe) =>
        unsubscribe()
      );

      unsubscribesRef.current = {};
      conversacionesPorEmpresaRef.current = {};
    };
  }, [user]);

  const conversacionesDeHoy = useMemo(() => {
    const ahora = new Date();

    return conversaciones.filter((conversacion) => {
      const fecha = conversacion.createdAt?.toDate();

      return (
        fecha &&
        fecha.getDate() === ahora.getDate() &&
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      );
    }).length;
  }, [conversaciones]);

  const conversacionesConHumano = useMemo(
    () =>
      conversaciones.filter(
        (conversacion) =>
          conversacion.humanoActivo || Boolean(conversacion.atendidoPor)
      ).length,
    [conversaciones]
  );

  const conversacionesAbiertas = useMemo(
    () =>
      conversaciones.filter((conversacion) => {
        const estado = conversacion.estado?.toLowerCase();
        return estado !== "cerrada" && estado !== "cerrado";
      }).length,
    [conversaciones]
  );

  const mensajesTotales = useMemo(
    () =>
      conversaciones.reduce(
        (total, conversacion) =>
          total + (conversacion.cantidadMensajes || 0),
        0
      ),
    [conversaciones]
  );

  const empresasRecientes = empresas.slice(0, 4);
  const conversacionesRecientes = conversaciones.slice(0, 6);

  const obtenerNombreEmpresa = (empresaId: string) =>
    empresas.find((empresa) => empresa.id === empresaId)?.nombre ||
    "Empresa desconocida";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium">Cargando dashboard...</p>
          <p className="mt-1 text-sm text-zinc-500">
            Estamos preparando el resumen de tu cuenta.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Panel principal
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Bienvenido a NDI AI
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Revisá el estado de tus empresas y conversaciones en tiempo real.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Card className="flex items-center gap-3 px-4 py-3">
              <Avatar
                name={user?.displayName || user?.email || "Usuario"}
                src={user?.photoURL || undefined}
                size="sm"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user?.displayName || "Administrador"}
                </p>
                <p className="max-w-52 truncate text-xs text-zinc-500">
                  {user?.email}
                </p>
              </div>
            </Card>

            <Button
              onClick={() => {
                window.location.href = "/empresas";
              }}
            >
              Administrar empresas
            </Button>
          </div>
        </header>

        {error && (
          <Card className="mb-6 border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400">{error}</p>
          </Card>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            titulo="Conversaciones"
            valor={conversaciones.length}
            descripcion="Total acumulado"
            etiqueta="Total"
            variante="purple"
          />
          <MetricCard
            titulo="Conversaciones hoy"
            valor={conversacionesDeHoy}
            descripcion="Iniciadas durante el día"
            etiqueta="Hoy"
            variante="success"
          />
          <MetricCard
            titulo="Atención humana"
            valor={conversacionesConHumano}
            descripcion="Tomadas por un operador"
            etiqueta="Humano"
            variante="info"
          />
          <MetricCard
            titulo="Conversaciones abiertas"
            valor={conversacionesAbiertas}
            descripcion="Pendientes o en curso"
            etiqueta="Abiertas"
            variante="success"
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            titulo="Empresas"
            valor={empresas.length}
            descripcion="Empresas registradas"
            etiqueta="Activas"
            variante="info"
          />
          <MetricCard
            titulo="Agentes IA"
            valor={empresas.length}
            descripcion="Un agente por empresa"
            etiqueta="Online"
            variante="success"
          />
          <MetricCard
            titulo="Mensajes"
            valor={mensajesTotales}
            descripcion="Mensajes registrados"
            etiqueta="Total"
            variante="purple"
          />
          <MetricCard
            titulo="Respondidas por IA"
            valor={Math.max(
              conversaciones.length - conversacionesConHumano,
              0
            )}
            descripcion="Sin intervención humana"
            etiqueta="IA"
            variante="info"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Conversaciones recientes
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Actividad actualizada en tiempo real.
                </p>
              </div>

              <Badge variant="info">
                {conversaciones.length} en total
              </Badge>
            </div>

            {conversacionesRecientes.length === 0 ? (
              <EmptyBlock
                title="Todavía no hay conversaciones"
                description="Las conversaciones del widget aparecerán en esta sección."
              />
            ) : (
              <div className="divide-y divide-zinc-800">
                {conversacionesRecientes.map((conversacion) => (
                  <button
                    key={`${conversacion.empresaId}-${conversacion.id}`}
                    type="button"
                    onClick={() => {
                      window.location.href = `/empresas/${conversacion.empresaId}/conversaciones/${conversacion.id}`;
                    }}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-zinc-800/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {conversacion.titulo ||
                          conversacion.ultimoMensaje ||
                          "Nueva conversación"}
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {obtenerNombreEmpresa(conversacion.empresaId)}
                        {conversacion.visitanteId
                          ? ` · ${conversacion.visitanteId}`
                          : ""}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <Badge
                        variant={
                          conversacion.humanoActivo ? "success" : "info"
                        }
                      >
                        {conversacion.humanoActivo ? "Humano" : "IA"}
                      </Badge>

                      <p className="mt-2 text-xs text-zinc-600">
                        {formatDate(
                          conversacion.updatedAt ||
                            conversacion.createdAt
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Empresas recientes
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Acceso rápido a tus agentes.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    window.location.href = "/empresas";
                  }}
                >
                  Ver todas
                </Button>
              </div>

              {empresasRecientes.length === 0 ? (
                <EmptyBlock
                  title="No hay empresas"
                  description="Creá tu primera empresa para comenzar."
                />
              ) : (
                <div className="divide-y divide-zinc-800">
                  {empresasRecientes.map((empresa) => (
                    <button
                      key={empresa.id}
                      type="button"
onClick={() => {
  window.location.href =
    `/empresas/${empresa.id}/dashboard`;
}}
                      className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-zinc-800/40"
                    >
                      <Avatar name={empresa.nombre} size="sm" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {empresa.nombre}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {empresa.rubro || "Sin rubro"}
                        </p>
                      </div>

                      <Badge variant="success">Activa</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Estado del sistema
                </h2>
                <Badge variant="success">Operativo</Badge>
              </div>

              <div className="mt-5 space-y-4">
                <StatusRow label="Aplicación web" status="Activa" />
                <StatusRow label="Firebase" status="Conectado" />
                <StatusRow label="Agentes IA" status="Disponibles" />
                <StatusRow label="Tiempo real" status="Activo" />
              </div>
            </Card>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

type BadgeVariant = "info" | "purple" | "success";

function MetricCard({
  titulo,
  valor,
  descripcion,
  etiqueta,
  variante,
}: {
  titulo: string;
  valor: number;
  descripcion: string;
  etiqueta: string;
  variante: BadgeVariant;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-zinc-400">{titulo}</p>
        <Badge variant={variante}>{etiqueta}</Badge>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-white">
        {valor}
      </p>

      <p className="mt-2 text-sm text-zinc-500">{descripcion}</p>
    </Card>
  );
}

function EmptyBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-300">{label}</span>
      <Badge variant="success">{status}</Badge>
    </div>
  );
}

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}