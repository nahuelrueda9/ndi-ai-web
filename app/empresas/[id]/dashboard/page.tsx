"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import {
  CalendarDays,
  ExternalLink,
  Globe2,
  MessageSquare,
  Package,
  Sparkles,
} from "lucide-react";

import { db } from "@/lib/firebase";
import Card from "@/components/Ui/Card";
import MetricCard from "../components/MetricCard";
import QuickAccessCard from "../components/QuickAccessCard";
import PlanUsageCard from "@/components/dashboard/PlanUsageCard";

type PlanId = "free" | "pro" | "business";

type EmpresaData = {
  nombre?: string;
  plan?: PlanId;
  subscriptionEndsAt?: unknown;
  paginaPublica?: {
    slug?: string;
    publicada?: boolean;
    titulo?: string;
  };
};

type CatalogoItem = {
  id: string;
  tipo?: "servicio" | "producto";
  nombre?: string;
  activo?: boolean;
};

type EstadoTurno =
  | "pendiente"
  | "confirmado"
  | "completado"
  | "cancelado"
  | "no_asistio";

type Turno = {
  id: string;
  nombreCliente?: string;
  servicio?: string;
  fecha?: string;
  hora?: string;
  estado?: EstadoTurno;
  createdAt?: Timestamp;
};

type EventoPagina = {
  tipo?:
    | "page_view"
    | "whatsapp_click"
    | "lead_submit"
    | "appointment_created";
  visitanteId?: string;
  createdAt?: Timestamp;
};

type Conversacion = {
  id: string;
  visitanteId?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  ultimoMensaje?: string;
  email?: string;
  telefono?: string;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
};

function convertirFecha(valor: unknown) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate?: unknown }).toDate === "function"
  ) {
    return (valor as { toDate: () => Date }).toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime())
      ? null
      : fecha;
  }

  return null;
}

function fechaISOHoy() {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DashboardEmpresaPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [empresa, setEmpresa] =
    useState<EmpresaData | null>(null);

  const [catalogo, setCatalogo] =
    useState<CatalogoItem[]>([]);

  const [turnos, setTurnos] =
    useState<Turno[]>([]);

  const [eventosPagina, setEventosPagina] =
    useState<EventoPagina[]>([]);

  const [conversaciones, setConversaciones] =
    useState<Conversacion[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró el ID de la empresa.");
      setLoading(false);
      return;
    }

    let activo = true;

    async function cargarDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          empresaSnapshot,
          catalogoSnapshot,
          turnosSnapshot,
          analyticsSnapshot,
          conversacionesSnapshot,
        ] = await Promise.all([
          getDoc(
            doc(
              db,
              "companies",
              empresaId!,
            ),
          ),
          getDocs(
            collection(
              db,
              "companies",
              empresaId!,
              "catalog",
            ),
          ),
          getDocs(
            collection(
              db,
              "companies",
              empresaId!,
              "appointments",
            ),
          ),
          getDocs(
            collection(
              db,
              "companies",
              empresaId!,
              "analyticsEvents",
            ),
          ),
          getDocs(
            query(
              collection(
                db,
                "companies",
                empresaId!,
                "conversations",
              ),
              orderBy("updatedAt", "desc"),
              limit(5),
            ),
          ),
        ]);

        if (!activo) {
          return;
        }

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          setLoading(false);
          return;
        }

        setEmpresa(
          empresaSnapshot.data() as EmpresaData,
        );

        setCatalogo(
          catalogoSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...(documento.data() as Omit<
                CatalogoItem,
                "id"
              >),
            }),
          ),
        );

        setTurnos(
          turnosSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...(documento.data() as Omit<
                Turno,
                "id"
              >),
            }),
          ),
        );

        setEventosPagina(
          analyticsSnapshot.docs.map(
            (documento) =>
              documento.data() as EventoPagina,
          ),
        );

        setConversaciones(
          conversacionesSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...(documento.data() as Omit<
                Conversacion,
                "id"
              >),
            }),
          ),
        );
      } catch (firebaseError) {
        console.error(
          "Error al cargar el inicio:",
          firebaseError,
        );

        if (activo) {
          setError(
            "No se pudo cargar el resumen del negocio.",
          );
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    void cargarDashboard();

    return () => {
      activo = false;
    };
  }, [empresaId]);

  const planGuardado: PlanId =
    empresa?.plan === "pro" ||
    empresa?.plan === "business"
      ? empresa.plan
      : "free";

  const fechaVencimiento =
    convertirFecha(
      empresa?.subscriptionEndsAt,
    );

  const planEfectivo: PlanId =
    planGuardado === "business"
      ? "business"
      : planGuardado === "pro" &&
          fechaVencimiento &&
          fechaVencimiento.getTime() > Date.now()
        ? "pro"
        : "free";

  const mostrarPublicidad =
    planEfectivo === "free";

  const paginaPublicada =
    empresa?.paginaPublica?.publicada === true;

  const slug =
    empresa?.paginaPublica?.slug?.trim() || "";

  const nombrePagina =
    empresa?.paginaPublica?.titulo?.trim() ||
    empresa?.nombre?.trim() ||
    "Tu negocio";

  const metricas = useMemo(() => {
    const visitas = eventosPagina.filter(
      (evento) => evento.tipo === "page_view",
    ).length;

    const contactos = eventosPagina.filter(
      (evento) => evento.tipo === "lead_submit",
    ).length;

    const reservasOnline = eventosPagina.filter(
      (evento) =>
        evento.tipo === "appointment_created",
    ).length;

    const catalogoActivo = catalogo.filter(
      (item) => item.activo !== false,
    ).length;

    return {
      visitas,
      contactos,
      reservasOnline,
      catalogoActivo,
    };
  }, [catalogo, eventosPagina]);

  const proximosTurnos = useMemo(() => {
    const hoy = fechaISOHoy();

    return turnos
      .filter((turno) => {
        if (!turno.fecha || turno.fecha < hoy) {
          return false;
        }

        return (
          turno.estado !== "cancelado" &&
          turno.estado !== "no_asistio" &&
          turno.estado !== "completado"
        );
      })
      .sort((a, b) => {
        const fechaA =
          `${a.fecha ?? ""} ${a.hora ?? ""}`;
        const fechaB =
          `${b.fecha ?? ""} ${b.hora ?? ""}`;

        return fechaA.localeCompare(fechaB);
      })
      .slice(0, 5);
  }, [turnos]);

  function abrirPaginaPublica() {
    if (!slug || !paginaPublicada) {
      return;
    }

    window.open(
      `/negocio/${encodeURIComponent(slug)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (!empresaId) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-8">
        <Card className="border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-300">
            No se encontró la empresa.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Tu negocio
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Inicio
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600 dark:text-zinc-400">
            Controlá tu página inteligente, los contactos,
            las reservas y la actividad de tu negocio desde un solo lugar.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}`,
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Editar mi página
          </button>

          <button
            type="button"
            disabled={!paginaPublicada || !slug}
            onClick={abrirPaginaPublica}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4" />
            Ver página pública
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </Card>
      )}

      {loading ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Cargando resumen del negocio...
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              titulo="Visitas"
              valor={metricas.visitas}
              descripcion="A tu página pública"
            />

            <MetricCard
              titulo="Contactos"
              valor={metricas.contactos}
              descripcion="Formularios enviados"
            />

            <MetricCard
              titulo="Reservas online"
              valor={metricas.reservasOnline}
              descripcion="Generadas desde la página"
            />

            <MetricCard
              titulo="Catálogo activo"
              valor={metricas.catalogoActivo}
              descripcion="Servicios y productos visibles"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <Card className="overflow-hidden">
              <div className="flex flex-col justify-between gap-5 border-b border-slate-200 p-6 dark:border-zinc-800 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    <Globe2 className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                        {nombrePagina}
                      </h2>

                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          paginaPublicada
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                        ].join(" ")}
                      >
                        {paginaPublicada
                          ? "Publicada"
                          : "Sin publicar"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                      {slug
                        ? `/negocio/${slug}`
                        : "Todavía no definiste la dirección de tu página."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}`,
                    )
                  }
                  className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Configurar
                </button>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-3">
                <EstadoPagina
                  titulo="Página pública"
                  texto={
                    paginaPublicada
                      ? "Visible para tus clientes"
                      : "Falta publicarla"
                  }
                  listo={paginaPublicada}
                />

                <EstadoPagina
                  titulo="Catálogo"
                  texto={
                    metricas.catalogoActivo > 0
                      ? `${metricas.catalogoActivo} elementos activos`
                      : "Todavía está vacío"
                  }
                  listo={metricas.catalogoActivo > 0}
                />

                <EstadoPagina
                  titulo="Reservas"
                  texto={
                    proximosTurnos.length > 0
                      ? `${proximosTurnos.length} próximos turnos`
                      : "Sin turnos próximos"
                  }
                  listo={proximosTurnos.length > 0}
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    Próximo paso
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                    Prepará tu negocio para recibir clientes
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  {
                    titulo: "1. Publicá tu página",
                    texto: "Logo, portada, datos y secciones del negocio.",
                    ruta: "",
                  },
                  {
                    titulo: "2. Cargá servicios y productos",
                    texto: "Mostrá qué ofrecés, precios e imágenes.",
                    ruta: "catalogo",
                  },
                  {
                    titulo: "3. Configurá la agenda",
                    texto: "Definí días y horarios disponibles.",
                    ruta: "agenda",
                  },
                  {
                    titulo: "4. Probá el asistente web",
                    texto: "Verificá cómo responde la IA a tus clientes.",
                    ruta: "probar",
                  },
                ].map((paso) => (
                  <button
                    key={paso.titulo}
                    type="button"
                    onClick={() =>
                      router.push(
                        paso.ruta
                          ? `/empresas/${empresaId}/${paso.ruta}`
                          : `/empresas/${empresaId}`,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {paso.titulo}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-500">
                      {paso.texto}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
              Accesos rápidos
            </h2>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <QuickAccessCard
                titulo="🌐 Mi página"
                descripcion="Editar la página pública del negocio."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}`,
                  )
                }
              />

              <QuickAccessCard
                titulo="📦 Servicios y productos"
                descripcion="Gestionar el catálogo que ven tus clientes."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/catalogo`,
                  )
                }
              />

              <QuickAccessCard
                titulo="📅 Agenda"
                descripcion="Administrar reservas, horarios y turnos."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/agenda`,
                  )
                }
              />

              <QuickAccessCard
                titulo="📊 Estadísticas"
                descripcion="Revisar visitas, contactos y conversiones."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/estadisticas`,
                  )
                }
              />

              <QuickAccessCard
                titulo="🤖 Asistente web"
                descripcion="Probar las respuestas de la IA."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/probar`,
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Próximos turnos
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                    Las próximas reservas del negocio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/agenda`,
                    )
                  }
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Ver agenda →
                </button>
              </div>

              {proximosTurnos.length === 0 ? (
                <div className="p-10 text-center">
                  <CalendarDays className="mx-auto h-9 w-9 text-slate-300 dark:text-zinc-700" />

                  <p className="mt-4 font-medium text-slate-950 dark:text-white">
                    No hay turnos próximos
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                    Las nuevas reservas aparecerán acá.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-zinc-800">
                  {proximosTurnos.map((turno) => (
                    <button
                      key={turno.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/empresas/${empresaId}/agenda`,
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {turno.nombreCliente ||
                            "Cliente"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-zinc-500">
                          {turno.servicio ||
                            "Turno sin servicio"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-zinc-200">
                          {formatearFechaTurno(
                            turno.fecha,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                          {turno.hora || "Sin hora"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Consultas recientes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                    Actividad reciente del asistente y tus clientes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/conversaciones`,
                    )
                  }
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Ver todas →
                </button>
              </div>

              {conversaciones.length === 0 ? (
                <div className="p-10 text-center">
                  <MessageSquare className="mx-auto h-9 w-9 text-slate-300 dark:text-zinc-700" />

                  <p className="mt-4 font-medium text-slate-950 dark:text-white">
                    Todavía no hay consultas
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                    Cuando alguien use el asistente web,
                    aparecerá acá.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-zinc-800">
                  {conversaciones.map(
                    (conversacion) => (
                      <button
                        key={conversacion.id}
                        type="button"
                        onClick={() =>
                          router.push(
                            `/empresas/${empresaId}/conversaciones/${conversacion.id}`,
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {obtenerNombreVisitante(
                              conversacion,
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-zinc-500">
                            {conversacion.ultimoMensaje ||
                              "Sin mensajes"}
                          </p>
                        </div>

                        <span
                          className={[
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                            conversacion.estado ===
                            "cerrada"
                              ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
                          ].join(" ")}
                        >
                          {conversacion.estado ===
                          "cerrada"
                            ? "Cerrada"
                            : "Abierta"}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />

              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">
                  Plan y uso
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                  Consumo actual de tu cuenta NDI AI.
                </p>
              </div>
            </div>

            <PlanUsageCard />
          </Card>

          {mostrarPublicidad && (
            <Card className="overflow-hidden border-blue-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 dark:border-blue-500/20 dark:from-blue-500/10 dark:via-zinc-900 dark:to-violet-500/10">
              <div className="flex flex-col justify-between gap-5 p-6 md:flex-row md:items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
                    Publicidad
                  </p>

                  <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    Usás NDI AI Free
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                    El plan gratuito puede mostrar promociones de NDI AI
                    o patrocinadores directos. Pasate a Pro para usar
                    el panel sin publicidad.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/planes`,
                    )
                  }
                  className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Pasar a Pro sin publicidad
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </section>
  );
}

function EstadoPagina({
  titulo,
  texto,
  listo,
}: {
  titulo: string;
  texto: string;
  listo: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center gap-2">
        <div
          className={[
            "h-2.5 w-2.5 rounded-full",
            listo
              ? "bg-emerald-500"
              : "bg-amber-500",
          ].join(" ")}
        />

        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {titulo}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-zinc-500">
        {texto}
      </p>
    </div>
  );
}

function obtenerNombreVisitante(
  conversacion: Conversacion,
) {
  if (conversacion.email) {
    return conversacion.email;
  }

  if (conversacion.telefono) {
    return conversacion.telefono;
  }

  if (conversacion.visitanteId) {
    const parteVisible =
      conversacion.visitanteId
        .replace("visitante-", "")
        .slice(0, 8);

    return `Visitante ${parteVisible}`;
  }

  return "Visitante anónimo";
}

function formatearFechaTurno(
  fecha?: string,
) {
  if (!fecha) {
    return "Sin fecha";
  }

  const [year, month, day] =
    fecha.split("-").map(Number);

  if (!year || !month || !day) {
    return fecha;
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(
    new Date(
      year,
      month - 1,
      day,
    ),
  );
}