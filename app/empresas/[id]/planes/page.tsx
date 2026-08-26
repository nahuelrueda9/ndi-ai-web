"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { Check, MessageCircle, ShieldCheck, Zap } from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneSuscripcionActiva,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

const WHATSAPP_NUMERO = "5493886575664";

type Empresa = {
  nombre?: string;
  name?: string;
  userId?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  subscriptionMonthlyPrice?: number;
};

type MiembroEmpresa = {
  estado?: "activo" | "inactivo";
};

type Plan = {
  id: PlanId;
  nombre: string;
  descripcion: string;
  destacado?: boolean;
  lanzamiento?: boolean;
  etiqueta?: string;
  funciones: string[];
};

const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Página Simple",
    descripcion:
      "Para negocios que quieren tener toda su información ordenada en una página profesional y recibir turnos o reservas online.",
    etiqueta: "Para empezar",
    funciones: [
      "Página pública profesional",
      "Logo, portada, colores e identidad visual",
      "Información completa del negocio",
      "Agenda propia de NDI AI y turnos online",
      "Reservas de estadías o mesas",
      "Consultas o pedidos por WhatsApp",
      "Horarios de atención y mapa",
      "Galería de imágenes y redes",
      "Estadísticas básicas",
    ],
  },
  {
    id: "pro",
    nombre: "Página Completa",
    descripcion:
      "Para negocios que además necesitan catálogo de productos, presupuestos, carta digital y cobros online integrados.",
    destacado: true,
    etiqueta: "Recomendado",
    funciones: [
      "Todo lo incluido en Página Simple",
      "Productos, catálogo o carta",
      "Hasta 3 imágenes por producto o servicio",
      "Cobros online (Mercado Pago, CVU / Alias)",
      "Código QR para compartir",
      "Solicitud de presupuestos",
      "Pedidos online organizados",
      "Estadísticas avanzadas",
    ],
  },
  {
    id: "business",
    nombre: "Business IA",
    descripcion:
      "La versión más completa, con todas las herramientas de gestión más un asistente inteligente entrenado con tu información real.",
    lanzamiento: true,
    etiqueta: "Precio lanzamiento",
    funciones: [
      "Todo lo incluido en Página Completa",
      "Asistente IA dentro de la página",
      "Asistente configurable para cada negocio",
      "Base de conocimiento del negocio",
      "Respuestas basadas en datos reales 24/7",
      "Historial de conversaciones en el panel",
      "Captura y seguimiento de clientes",
      "Widget de IA para otras páginas web",
      "Atención humana cuando sea necesaria",
      "Sin marca comercial de NDI AI",
    ],
  },
];

function formatearPrecio(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function convertirFecha(valor: unknown): Date | null {
  if (!valor) return null;

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      return (valor as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }

  if (valor instanceof Date) return valor;

  if (typeof valor === "string" || typeof valor === "number") {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) return fecha;
  }

  return null;
}

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function obtenerTextoEstado(estado?: string) {
  switch (estado) {
    case "active":
    case "approved":
    case "authorized":
      return "Activo";
    case "pending":
      return "Pendiente de pago";
    case "paused":
      return "Pausado";
    case "expired":
      return "Vencido";
    case "cancelled":
    case "canceled":
      return "Cancelado";
    default:
      return "Sin plan activo";
  }
}

export default function PlanesPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;
  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accesoVerificado, setAccesoVerificado] = useState(false);

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(auth, async (usuarioActual) => {
      if (!usuarioActual) {
        router.replace("/login");
        return;
      }

      if (!empresaId) {
        setError("No se encontró la empresa.");
        setCargando(false);
        return;
      }

      setEmpresa(null);
      setAccesoVerificado(false);
      setError("");
      setCargando(true);

      try {
        const empresaSnapshot = await getDoc(
          doc(db, "companies", empresaId)
        );

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          return;
        }

        const datos = empresaSnapshot.data() as Empresa;

        if (datos.userId !== usuarioActual.uid) {
          const miembroSnapshot = await getDoc(
            doc(db, "companies", empresaId, "members", usuarioActual.uid)
          );

          if (miembroSnapshot.exists()) {
            const miembro = miembroSnapshot.data() as MiembroEmpresa;
            if (miembro.estado === "activo") {
              router.replace(`/empresas/${empresaId}/dashboard`);
              return;
            }
          }

          router.replace("/empresas");
          return;
        }

        setUsuario(usuarioActual);
        setEmpresa(datos);
        setAccesoVerificado(true);
      } catch (firebaseError) {
        console.error("Error cargando los planes:", firebaseError);
        setError("No se pudo cargar la información del plan.");
      } finally {
        setCargando(false);
      }
    });

    return () => cancelarAuth();
  }, [empresaId, router]);

  useEffect(() => {
    if (!empresaId || !accesoVerificado) return;

    const cancelarEmpresa = onSnapshot(
      doc(db, "companies", empresaId),
      (snapshot) => {
        if (!snapshot.exists()) return;
        setEmpresa(snapshot.data() as Empresa);
      },
      (snapshotError) => {
        console.error("Error actualizando la empresa:", snapshotError);
      }
    );

    return () => cancelarEmpresa();
  }, [accesoVerificado, empresaId]);

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
            Cargando planes...
          </p>
        </div>
      </section>
    );
  }

  if (!accesoVerificado || !empresa) {
    if (error) {
      return (
        <section className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        </section>
      );
    }
    return null;
  }

  const planActual = obtenerPlanEfectivo(empresa);
  const suscripcionActiva = empresaTieneSuscripcionActiva(empresa);
  const nombrePlanActual = suscripcionActiva
    ? obtenerNombrePlan(planActual)
    : "Sin plan activo";

  const precioPlanActual = obtenerPrecioPlan(planActual);
  const estado = suscripcionActiva
    ? obtenerTextoEstado(empresa.subscriptionStatus)
    : empresa.subscriptionStatus
    ? obtenerTextoEstado(empresa.subscriptionStatus)
    : "Sin plan activo";

  const vencimiento = convertirFecha(empresa.subscriptionEndsAt);
  const tuvoSuscripcion = Boolean(
    empresa.subscriptionStatus ||
      empresa.subscriptionEndsAt ||
      empresa.subscriptionMonthlyPrice
  );

  const precioRenovacion =
    typeof empresa.subscriptionMonthlyPrice === "number" &&
    empresa.subscriptionMonthlyPrice > 0
      ? empresa.subscriptionMonthlyPrice
      : precioPlanActual.mensual;

  const nombreNegocio = empresa.nombre || empresa.name || "Mi Negocio";

  function solicitarPorWhatsApp(nombrePlan: string, modo: "autogestion" | "asistido" | "renovar", precioInicial: number) {
    let mensaje = "";
    if (modo === "renovar") {
      mensaje = `¡Hola! Quiero renovar la mensualidad del plan *${nombrePlan}* para mi negocio *${nombreNegocio}*.`;
    } else if (modo === "asistido") {
      mensaje = `¡Hola! Quiero contratar el plan *${nombrePlan}* (${formatearPrecio(precioInicial)}) y que me ayuden a armar la página de mi negocio *${nombreNegocio}*. ¿Me pasás los datos para pagar?`;
    } else {
      mensaje = `¡Hola! Quiero contratar el plan *${nombrePlan}* (${formatearPrecio(precioInicial)}) para mi negocio *${nombreNegocio}* y cargar los datos por mi cuenta. ¿Me pasás los datos para pagar?`;
    }

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* HEADER */}
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
          Planes y Suscripción
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Elegí tu versión de NDI AI
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          Elegí la versión que mejor se adapte a tu negocio. Todos los planes incluyen la puesta en marcha y el mantenimiento mensual del servicio.
        </p>
      </header>

      {/* TARJETAS DE PLANES */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = suscripcionActiva && plan.id === planActual;
          const precios = obtenerPrecioPlan(plan.id);

          return (
            <article
              key={plan.id}
              className={[
                "relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition-all dark:bg-zinc-900 sm:p-7",
                plan.destacado
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xl shadow-blue-500/10 dark:shadow-blue-950/30"
                  : plan.lanzamiento
                  ? "border-violet-500 ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10 dark:shadow-violet-950/30"
                  : "border-slate-200 dark:border-zinc-800",
              ].join(" ")}
            >
              {plan.etiqueta && (
                <span
                  className={[
                    "absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-sm",
                    plan.lanzamiento
                      ? "bg-violet-600"
                      : plan.destacado
                      ? "bg-blue-600"
                      : "bg-slate-800 dark:bg-zinc-700",
                  ].join(" ")}
                >
                  {plan.etiqueta}
                </span>
              )}

              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-extrabold text-slate-950 dark:text-white sm:text-2xl">
                    {plan.nombre}
                  </h2>
                  {esActual && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Plan actual
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
                  {plan.descripcion}
                </p>

                {/* PRECIOS */}
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 sm:text-xs">
                    Puesta en marcha
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                    {formatearPrecio(precios.inicial)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 sm:text-sm">
                    + {formatearPrecio(precios.mensual)}/mes
                  </p>

                  {plan.lanzamiento && (
                    <p className="mt-2 text-[11px] leading-relaxed text-violet-700 dark:text-violet-300">
                      Conservás el precio mensual de lanzamiento mientras mantengas activa tu suscripción.
                    </p>
                  )}
                </div>

                {/* FUNCIONES */}
                <div className="mt-6 space-y-2.5">
                  {plan.funciones.map((funcion) => (
                    <div
                      key={funcion}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300 sm:text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{funcion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTONES DIRECTOS A WHATSAPP */}
              <div className="mt-8 space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={esActual}
                  onClick={() => solicitarPorWhatsApp(plan.nombre, "autogestion", precios.inicial)}
                  className={[
                    "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
                    esActual
                      ? "border border-slate-300 bg-slate-100 text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      : plan.destacado
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
                      : plan.lanzamiento
                      ? "bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-600/20"
                      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200",
                  ].join(" ")}
                >
                  <Zap className="h-4 w-4" />
                  {esActual ? "Plan en uso" : "Configurar por mi cuenta"}
                </button>

                <button
                  type="button"
                  onClick={() => solicitarPorWhatsApp(plan.nombre, "asistido", precios.inicial)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Pedir armado asistido
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ESTADO DE CUENTA Y RETORNO */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  Tu suscripción
                </h3>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
                <p>
                  Plan:{" "}
                  <strong className="text-slate-950 dark:text-white">
                    {suscripcionActiva || tuvoSuscripcion
                      ? obtenerNombrePlan(planActual)
                      : nombrePlanActual}
                  </strong>
                </p>

                <p>
                  Mensualidad:{" "}
                  <strong className="text-slate-950 dark:text-white">
                    {suscripcionActiva || tuvoSuscripcion
                      ? `${formatearPrecio(precioRenovacion)}/mes`
                      : "—"}
                  </strong>
                </p>

                <p>
                  Estado:{" "}
                  <strong
                    className={
                      suscripcionActiva
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }
                  >
                    {suscripcionActiva
                      ? estado
                      : tuvoSuscripcion
                      ? "Vencido / sin renovar"
                      : "Sin plan activo"}
                  </strong>
                </p>

                {vencimiento && (
                  <p>
                    Vencimiento:{" "}
                    <strong className="text-slate-950 dark:text-white">
                      {formatearFecha(vencimiento)}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            {(suscripcionActiva || tuvoSuscripcion) && (
              <button
                type="button"
                onClick={() => solicitarPorWhatsApp(obtenerNombrePlan(planActual), "renovar", precioPlanActual.inicial)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500 shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Renovar por WhatsApp
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/empresas/${empresaId}/facturacion`)}
          className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Volver a facturación
        </button>
      </div>
    </section>
  );
}