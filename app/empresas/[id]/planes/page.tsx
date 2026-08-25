"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { Check, MessageCircle, Sparkles, Zap, ShieldCheck } from "lucide-react";

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
    etiqueta: "30 Días Gratis",
    funciones: [
      "Página pública profesional",
      "Logo, portada, colores e identidad visual",
      "Información completa del negocio",
      "Agenda propia de NDI AI y turnos online",
      "Reservas de estadías o mesas",
      "Consultas y pedidos por WhatsApp",
      "Horarios de atención y mapa",
      "Galería de imágenes y redes",
      "Estadísticas básicas de visitas",
    ],
  },
  {
    id: "pro",
    nombre: "Página Completa",
    descripcion:
      "Para negocios que además necesitan catálogo de productos, carta digital, presupuestos y cobros online integrados.",
    destacado: true,
    etiqueta: "Recomendado · 30 Días Gratis",
    funciones: [
      "Todo lo incluido en Página Simple",
      "Catálogo de productos o carta digital",
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
    etiqueta: "Lanzamiento · 30 Días Gratis",
    funciones: [
      "Todo lo incluido en Página Completa",
      "Asistente IA dentro de tu página",
      "Entrenamiento con la info de tu negocio",
      "Respuestas basadas en datos reales 24/7",
      "Historial de conversaciones en el panel",
      "Captura y seguimiento de clientes",
      "Widget de IA para otras webs",
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
      return "Pendiente";
    case "paused":
      return "Pausado";
    case "expired":
      return "Vencido";
    case "cancelled":
    case "canceled":
      return "Cancelado";
    default:
      return "Activo";
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
  const [procesandoPlan, setProcesandoPlan] = useState<string | null>(null);
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
      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
            Cargando opciones de planes...
          </p>
        </div>
      </section>
    );
  }

  if (!accesoVerificado || !empresa) {
    if (error) {
      return (
        <section className="mx-auto w-full max-w-5xl px-4 py-8">
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

  async function activarPruebaGratis(planId: PlanId) {
    if (!empresaId) return;
    try {
      setProcesandoPlan(planId);
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

      const precios = obtenerPrecioPlan(planId);

      await updateDoc(doc(db, "companies", empresaId), {
        plan: planId,
        subscriptionStatus: "active",
        subscriptionEndsAt: Timestamp.fromDate(fechaVencimiento),
        subscriptionMonthlyPrice: precios.mensual,
      });

      router.push(`/empresas/${empresaId}/dashboard`);
    } catch (err) {
      console.error("Error al activar prueba:", err);
      alert("Hubo un problema al activar tu mes de prueba. Por favor contactanos por WhatsApp.");
    } finally {
      setProcesandoPlan(null);
    }
  }

  function solicitarPorWhatsApp(nombrePlan: string, modo: "armado" | "renovar" = "armado") {
    let mensaje = "";
    if (modo === "renovar") {
      mensaje = `¡Hola! Quiero renovar mi suscripción del plan *${nombrePlan}* para mi negocio *${nombreNegocio}*.`;
    } else {
      mensaje = `¡Hola! Quiero activar mi mes gratis y que ustedes me configuren el plan *${nombrePlan}* para *${nombreNegocio}*.`;
    }

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      {/* HEADER */}
      <header className="mb-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
          Planes y Suscripción
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Elegí la versión para tu negocio
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
          Disfrutá de <strong>30 días de prueba sin cargo</strong> en cualquiera de los planes. Podés configurarlo vos mismo o enviarnos tu información para que lo dejemos listo.
        </p>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-950 dark:text-blue-200">
                ¿Querés que carguemos los datos por vos?
              </p>
              <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
                Pasános tu logo, fotos y lista de precios por WhatsApp y te armamos la web gratis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => solicitarPorWhatsApp(nombrePlanActual !== "Sin plan activo" ? nombrePlanActual : "Página Simple", "armado")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-4 w-4" />
            Pedir armado asistido
          </button>
        </div>
      </header>

      {/* TARJETAS DE PLANES */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = suscripcionActiva && plan.id === planActual;
          const precios = obtenerPrecioPlan(plan.id);
          const cargandoEste = procesandoPlan === plan.id;

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
                      Activo
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
                  {plan.descripcion}
                </p>

                {/* PRECIOS */}
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                      1er Mes Gratis
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Luego {formatearPrecio(precios.mensual)}/mes
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-500">
                    Puesta en marcha y mantenimiento incluidos
                  </p>
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

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-8 space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={esActual || Boolean(procesandoPlan)}
                  onClick={() => activarPruebaGratis(plan.id)}
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
                  {cargandoEste ? "Activando..." : esActual ? "Plan en uso" : "Activar 30 días gratis"}
                </button>

                <button
                  type="button"
                  onClick={() => solicitarPorWhatsApp(plan.nombre, "armado")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Quiero que me lo armen
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ESTADO DE SUSCRIPCIÓN Y RETORNO */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  Estado de tu cuenta
                </h3>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
                <p>
                  Plan actual:{" "}
                  <strong className="text-slate-950 dark:text-white">
                    {suscripcionActiva || tuvoSuscripcion
                      ? obtenerNombrePlan(planActual)
                      : nombrePlanActual}
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
                      : "Prueba pendiente"}
                  </strong>
                </p>

                {vencimiento && (
                  <p>
                    Vence el:{" "}
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
                onClick={() => solicitarPorWhatsApp(obtenerNombrePlan(planActual), "renovar")}
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