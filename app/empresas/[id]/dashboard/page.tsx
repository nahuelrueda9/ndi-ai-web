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
import {
  empresaTieneFuncion,
  empresaTieneSuscripcionActiva,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";
import Card from "@/components/Ui/Card";
import MetricCard from "../components/MetricCard";
import QuickAccessCard from "../components/QuickAccessCard";

type EmpresaData = {
  nombre?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  subscriptionMonthlyPrice?: number;
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

function formatearPrecio(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
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

    const empresaIdSeguro = empresaId;
    let activo = true;

    async function cargarDashboard() {
      try {
        setLoading(true);
        setError("");

        const empresaSnapshot = await getDoc(
          doc(
            db,
            "companies",
            empresaIdSeguro,
          ),
        );

        if (!activo) {
          return;
        }

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          setLoading(false);
          return;
        }

        const datosEmpresa =
          empresaSnapshot.data() as EmpresaData;

        setEmpresa(datosEmpresa);

        const puedeUsarTurnos =
          empresaTieneFuncion(
            datosEmpresa,
            "turnos",
          );

        const puedeUsarAsistente =
          empresaTieneFuncion(
            datosEmpresa,
            "asistente_ia",
          );

        // Consultas seguras individuales
        const tareas = [
          getDocs(
            collection(
              db,
              "companies",
              empresaIdSeguro,
              "catalog",
            ),
          ).catch(() => null),
          getDocs(
            collection(
              db,
              "companies",
              empresaIdSeguro,
              "analyticsEvents",
            ),
          ).catch(() => null),
          puedeUsarTurnos
            ? getDocs(
                collection(
                  db,
                  "companies",
                  empresaIdSeguro,
                  "appointments",
                ),
              ).catch(() => null)
            : Promise.resolve(null),
          puedeUsarAsistente
            ? getDocs(
                query(
                  collection(
                    db,
                    "companies",
                    empresaIdSeguro,
                    "conversations",
                  ),
                  orderBy("updatedAt", "desc"),
                  limit(5),
                ),
              ).catch(() => null)
            : Promise.resolve(null),
        ];

        const [
          catalogoSnapshot,
          analyticsSnapshot,
          turnosSnapshot,
          conversacionesSnapshot,
        ] = await Promise.all(tareas);

        if (!activo) {
          return;
        }

        if (catalogoSnapshot) {
          setCatalogo(
            catalogoSnapshot.docs.map((documento) => ({
              id: documento.id,
              ...(documento.data() as Omit<CatalogoItem, "id">),
            })),
          );
        }

        if (analyticsSnapshot) {
          setEventosPagina(
            analyticsSnapshot.docs.map(
              (documento) => documento.data() as EventoPagina,
            ),
          );
        }

        if (turnosSnapshot) {
          setTurnos(
            turnosSnapshot.docs.map((documento) => ({
              id: documento.id,
              ...(documento.data() as Omit<Turno, "id">),
            })),
          );
        }

        if (conversacionesSnapshot) {
          setConversaciones(
            conversacionesSnapshot.docs.map((documento) => ({
              id: documento.id,
              ...(documento.data() as Omit<Conversacion, "id">),
            })),
          );
        }
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

  const planEfectivo =
    obtenerPlanEfectivo(
      empresa ?? {},
    );

  const suscripcionActiva =
    empresa
      ? empresaTieneSuscripcionActiva(
          empresa,
        )
      : false;

  const puedeUsarProductos =
    empresa
      ? empresaTieneFuncion(
          empresa,
          "productos",
        )
      : false;

  const puedeUsarTurnos =
    empresa
      ? empresaTieneFuncion(
          empresa,
          "turnos",
        )
      : false;

  const puedeUsarAsistenteIA =
    empresa
      ? empresaTieneFuncion(
          empresa,
          "asistente_ia",
        )
      : false;

  const nombrePlan =
    suscripcionActiva
      ? obtenerNombrePlan(
          planEfectivo,
        )
      : "Sin plan activo";

  const precioPlan =
    obtenerPrecioPlan(
      planEfectivo,
    );

  const mensualidad =
    typeof empresa?.subscriptionMonthlyPrice ===
      "number" &&
    empresa.subscriptionMonthlyPrice > 0
      ? empresa.subscriptionMonthlyPrice
      : precioPlan.mensual;

  const fechaVencimiento =
    convertirFecha(
      empresa?.subscriptionEndsAt,
    );

  const paginaPublicada =
    empresa?.paginaPublica?.publicada === true;

  const paginaDisponible =
    suscripcionActiva &&
    paginaPublicada;

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
    if (!slug || !paginaDisponible) {
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
    <section className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-8">
      <div className="flex flex-col justify-between gap-3 sm:gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
            Tu negocio
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">
            Inicio
          </h1>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-base sm:leading-normal">
            Controlá tu página inteligente, los contactos,
            las reservas y la actividad de tu negocio desde un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}`,
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Editar mi página
          </button>

          <button
            type="button"
            disabled={!paginaDisponible || !slug}
            onClick={abrirPaginaPublica}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
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
        <Card className="p-6 text-center sm:p-10">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Cargando resumen del negocio...
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
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

          <div className="grid gap-3 sm:gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <Card className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-3 dark:border-zinc-800 sm:p-6 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex min-w-0 items-start gap-2.5 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Globe2 className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                        {nombrePagina}
                      </h2>

                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs",
                          paginaDisponible
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                        ].join(" ")}
                      >
                        {paginaDisponible
                          ? "Publicada"
                          : suscripcionActiva
                            ? "Sin publicar"
                            : "Sin plan activo"}
                      </span>
                    </div>

                    <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:max-w-none sm:text-sm">
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
                  className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Configurar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-3 sm:gap-4 sm:p-6">
                <EstadoPagina
                  titulo="Página pública"
                  texto={
                    paginaDisponible
                      ? "Visible para tus clientes"
                      : suscripcionActiva
                        ? "Falta publicarla"
                        : "Necesitás un plan activo"
                  }
                  listo={paginaDisponible}
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

            <Card className="p-4 sm:p-6">
              <div className="flex items-start gap-2.5 sm:gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 sm:h-11 sm:w-11 sm:rounded-2xl">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[11px] font-medium text-violet-700 dark:text-violet-300 sm:text-sm">
                    Próximo paso
                  </p>

                  <h2 className="mt-0.5 text-sm font-semibold leading-5 text-slate-950 dark:text-white sm:mt-1 sm:text-lg">
                    Prepará tu negocio para recibir clientes
                  </h2>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:block sm:space-y-3">
                {[
                  {
                    titulo: "1. Publicá tu página",
                    texto: "Logo, portada, datos y secciones del negocio.",
                    ruta: "",
                  },
                  {
                    titulo: puedeUsarProductos
                      ? "2. Cargá servicios y productos"
                      : "2. Cargá tus servicios",
                    texto: puedeUsarProductos
                      ? "Mostrá qué ofrecés, precios e imágenes."
                      : "Mostrá tus servicios, precios e imágenes.",
                    ruta: "catalogo",
                  },
                  ...(puedeUsarTurnos
                    ? [
                        {
                          titulo: "3. Configurá la agenda",
                          texto: "Definí días y horarios disponibles.",
                          ruta: "agenda",
                        },
                      ]
                    : []),
                  ...(puedeUsarAsistenteIA
                    ? [
                        {
                          titulo: puedeUsarTurnos
                            ? "4. Probá el asistente web"
                            : "3. Probá el asistente web",
                          texto: "Verificá cómo responde la IA a tus clientes.",
                          ruta: "probar",
                        },
                      ]
                    : []),
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
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5 sm:rounded-xl sm:p-3"
                  >
                    <p className="text-[11px] font-semibold leading-4 text-slate-900 dark:text-white sm:text-sm sm:leading-normal">
                      {paso.titulo}
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs sm:leading-5">
                      {paso.texto}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-950 dark:text-white sm:mb-4 sm:text-lg">
              Accesos rápidos
            </h2>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-2 xl:grid-cols-5">
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

          <div className="grid gap-3 sm:gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800 sm:gap-4 sm:px-6 sm:py-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                    Próximos turnos
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm">
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
                  className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 sm:text-sm"
                >
                  Ver agenda →
                </button>
              </div>

              {!puedeUsarTurnos ? (
                <div className="p-6 text-center sm:p-10">
                  <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-zinc-700 sm:h-9 sm:w-9" />

                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                    Agenda no disponible
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm">
                    Activá tu suscripción para gestionar reservas y turnos.
                  </p>
                </div>
              ) : proximosTurnos.length === 0 ? (
                <div className="p-6 text-center sm:p-10">
                  <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-zinc-700 sm:h-9 sm:w-9" />

                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                    No hay turnos próximos
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-500 sm:text-sm">
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
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/40 sm:gap-4 sm:px-6 sm:py-4"
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
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800 sm:gap-4 sm:px-6 sm:py-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                    Consultas recientes
                  </h2>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-500 sm:text-sm">
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
                  className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 sm:text-sm"
                >
                  Ver todas →
                </button>
              </div>

              {!puedeUsarAsistenteIA ? (
                <div className="p-6 text-center sm:p-10">
                  <MessageSquare className="mx-auto h-7 w-7 text-slate-300 dark:text-zinc-700 sm:h-9 sm:w-9" />

                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                    Consultas con IA disponibles en Business IA
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-500 sm:text-sm">
                    Con Business IA vas a poder ver acá la actividad del asistente y las consultas de tus clientes.
                  </p>
                </div>
              ) : conversaciones.length === 0 ? (
                <div className="p-6 text-center sm:p-10">
                  <MessageSquare className="mx-auto h-7 w-7 text-slate-300 dark:text-zinc-700 sm:h-9 sm:w-9" />

                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                    Todavía no hay consultas
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-500 sm:text-sm">
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
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/40 sm:gap-4 sm:px-6 sm:py-4"
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

          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />

                <div>
                  <h2 className="font-semibold text-slate-950 dark:text-white">
                    Plan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                    Estado actual de tu suscripción NDI AI.
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3 sm:text-sm">
                    <p className="text-slate-500 dark:text-zinc-500">
                      Plan actual:{" "}
                      <span className="font-semibold text-slate-950 dark:text-white">
                        {nombrePlan}
                      </span>
                    </p>

                    <p className="text-slate-500 dark:text-zinc-500">
                      Estado:{" "}
                      <span
                        className={
                          suscripcionActiva
                            ? "font-semibold text-emerald-600 dark:text-emerald-400"
                            : "font-semibold text-amber-600 dark:text-amber-400"
                        }
                      >
                        {suscripcionActiva
                          ? "Activo"
                          : "Sin plan activo"}
                      </span>
                    </p>

                    {suscripcionActiva && (
                      <p className="text-slate-500 dark:text-zinc-500">
                        Mensualidad:{" "}
                        <span className="font-semibold text-slate-950 dark:text-white">
                          {formatearPrecio(mensualidad)}/mes
                        </span>
                      </p>
                    )}

                    {fechaVencimiento && (
                      <p className="text-slate-500 dark:text-zinc-500">
                        Vence:{" "}
                        <span className="font-semibold text-slate-950 dark:text-white">
                          {new Intl.DateTimeFormat("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }).format(fechaVencimiento)}
                        </span>
                      </p>
                    )}
                  </div>

                  {puedeUsarAsistenteIA && (
                    <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-4 sm:text-xs sm:leading-5">
                      El consumo detallado del asistente IA se consulta desde Facturación.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/facturacion`,
                  )
                }
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
              >
                {suscripcionActiva
                  ? "Ver facturación"
                  : "Elegir plan"}
              </button>
            </div>
          </Card>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950/40 sm:rounded-2xl sm:p-4">
      <div className="flex items-center gap-2">
        <div
          className={[
            "h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5",
            listo
              ? "bg-emerald-500"
              : "bg-amber-500",
          ].join(" ")}
        />

        <p className="truncate text-[10px] font-semibold text-slate-900 dark:text-white sm:text-sm">
          {titulo}
        </p>
      </div>

      <p className="mt-1 line-clamp-2 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-xs sm:leading-5">
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