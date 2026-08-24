"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { MessageCircle } from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase";
import {
  empresaTieneSuscripcionActiva,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

// Configuración de contacto
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
      "Para negocios que quieren tener toda su información ordenada en una página profesional y facilitar el contacto con sus clientes.",
    etiqueta: "Para empezar",
    funciones: [
      "Página pública profesional",
      "Logo, portada, colores e identidad visual",
      "Información completa del negocio",
      "Servicios, productos o carta básica según tu negocio",
      "Nombre, descripción, precio y 1 imagen por ítem",
      "Consultas o pedidos por WhatsApp",
      "Horarios de atención",
      "Ubicación y mapa",
      "Redes sociales",
      "Botón directo a WhatsApp",
      "Teléfono, correo y formulario de contacto",
      "Galería de imágenes",
      "Diseño adaptable a celular",
      "Estadísticas básicas",
    ],
  },
  {
    id: "pro",
    nombre: "Página Completa",
    descripcion:
      "Para negocios que además necesitan catálogo, productos, presupuestos, turnos, reservas o pedidos según su actividad.",
    destacado: true,
    etiqueta: "Recomendado",
    funciones: [
      "Todo lo incluido en Página Simple",
      "Productos, catálogo o carta",
      "Hasta 3 imágenes por producto o servicio",
      "Detalle completo de productos",
      "Código QR para compartir",
      "Solicitud de presupuestos",
      "Agenda propia de NDI AI",
      "Turnos y reservas online",
      "Reservas de alojamiento para hoteles y hostales",
      "Reservas de mesa para restaurantes",
      "Pedidos online para restaurantes",
      "Estadísticas avanzadas",
    ],
  },
  {
    id: "business",
    nombre: "Business IA",
    descripcion:
      "La versión más completa, con todas las herramientas de gestión más un asistente inteligente entrenado con la información real del negocio.",
    lanzamiento: true,
    etiqueta: "Precio lanzamiento",
    funciones: [
      "Todo lo incluido en Página Completa",
      "Asistente IA dentro de la página",
      "Asistente configurable para cada negocio",
      "Base de conocimiento del negocio",
      "Respuestas basadas en información real",
      "Conversaciones guardadas en el panel",
      "Captura y seguimiento de potenciales clientes",
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
      <section className="mx-auto w-full max-w-[1500px] px-3 py-3 sm:px-6 sm:py-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl sm:p-10">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
            Cargando planes...
          </p>
        </div>
      </section>
    );
  }

  if (!accesoVerificado || !empresa) {
    if (error) {
      return (
        <section className="mx-auto w-full max-w-[1500px] px-3 py-3 sm:px-6 sm:py-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
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

  function solicitarPorWhatsApp(nombrePlan: string, accion: "contratar" | "renovar" = "contratar") {
    let mensaje = "";
    if (accion === "renovar") {
      mensaje = `¡Hola! Quiero renovar el plan *${nombrePlan}* para mi empresa *${nombreNegocio}*. ¿Me pasás los datos para pagar el servicio?`;
    } else {
      mensaje = `¡Hola! Quiero activar el plan *${nombrePlan}* para mi empresa *${nombreNegocio}*. ¿Me pasás los datos para pagar el servicio?`;
    }

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] px-3 py-3 sm:px-6 sm:py-4">
      <header className="mb-3 sm:mb-4">
        <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
          Planes
        </p>

        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-1 sm:text-2xl">
          Elegí tu versión de NDI AI
        </h1>

        <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-1 sm:text-xs sm:leading-5">
          Todos los planes incluyen la configuración inicial de tu página y el mantenimiento mensual del servicio.
        </p>

        {!suscripcionActiva && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 sm:mt-3 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs sm:leading-normal">
            Esta empresa todavía no tiene un plan activo. Al solicitar tu plan por WhatsApp te enviamos los datos de pago y activamos tu cuenta al instante.
          </div>
        )}
      </header>

      <div className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = suscripcionActiva && plan.id === planActual;
          const esUltimoPlan = !suscripcionActiva && tuvoSuscripcion && plan.id === planActual;
          const precios = obtenerPrecioPlan(plan.id);

          return (
            <article
              key={plan.id}
              className={[
                "relative flex flex-col rounded-xl border bg-white p-3 text-slate-950 shadow-sm transition-colors dark:bg-zinc-900 dark:text-white sm:rounded-2xl sm:p-4",
                plan.destacado
                  ? "border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-950/20"
                  : plan.lanzamiento
                  ? "border-violet-400 shadow-lg shadow-violet-500/10 dark:border-violet-500/60 dark:shadow-violet-950/20"
                  : "border-slate-200 dark:border-zinc-800",
              ].join(" ")}
            >
              {plan.etiqueta && (
                <span
                  className={[
                    "absolute -top-2 left-3 rounded-full px-2 py-0.5 text-[8px] font-semibold text-white sm:-top-2.5 sm:left-4 sm:px-2.5 sm:text-[10px]",
                    plan.lanzamiento
                      ? "bg-violet-600"
                      : plan.destacado
                      ? "bg-blue-600"
                      : "bg-slate-700 dark:bg-zinc-700",
                  ].join(" ")}
                >
                  {plan.etiqueta}
                </span>
              )}

              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-950 dark:text-white sm:text-xl">
                    {plan.nombre}
                  </h2>

                  <p className="mt-0.5 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-1 sm:text-xs sm:leading-5">
                    {plan.descripcion}
                  </p>
                </div>

                {esActual && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:px-2 sm:text-[10px]">
                    Plan actual
                  </span>
                )}
              </div>

              <div className="mt-2.5 sm:mt-4">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-zinc-500 sm:text-[10px] sm:tracking-[0.12em]">
                  Puesta en marcha
                </p>

                <p className="mt-0.5 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                  {formatearPrecio(precios.inicial)}
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 sm:mt-1 sm:text-xs">
                  + {formatearPrecio(precios.mensual)}/mes
                </p>

                {plan.lanzamiento && (
                  <p className="mt-1.5 rounded-md border border-violet-200 bg-violet-50 p-1.5 text-[9px] leading-3.5 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 sm:mt-2 sm:rounded-lg sm:p-2 sm:text-[10px] sm:leading-4">
                    Conservás el precio mensual de lanzamiento mientras mantengas activa tu suscripción.
                  </p>
                )}
              </div>

              <div className="mt-2.5 grid flex-1 grid-cols-2 gap-x-2 gap-y-1 sm:mt-4 sm:block sm:space-y-1.5">
                {plan.funciones.map((funcion) => (
                  <div
                    key={funcion}
                    className="flex items-start gap-1 text-[9px] leading-3.5 text-slate-700 dark:text-zinc-300 sm:gap-2 sm:text-[11px] sm:leading-4"
                  >
                    <span className="text-emerald-500">✓</span>
                    <span>{funcion}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={esActual}
                onClick={() => solicitarPorWhatsApp(plan.nombre, esUltimoPlan ? "renovar" : "contratar")}
                className={[
                  "mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg px-3 py-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:px-4 sm:py-2.5 sm:text-xs",
                  esActual
                    ? "border border-slate-300 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    : plan.destacado
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : plan.lanzamiento
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {!esActual && <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {esActual
                  ? "Plan actual"
                  : esUltimoPlan
                  ? `Renovar por WhatsApp (${formatearPrecio(precioRenovacion)})`
                  : "Solicitar por WhatsApp"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl sm:p-3.5">
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-950 dark:text-white sm:text-base">
                Tu suscripción
              </p>

              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600 dark:text-zinc-400 sm:mt-2 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-1.5 sm:text-xs">
                <p>
                  Plan:{" "}
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {suscripcionActiva || tuvoSuscripcion
                      ? obtenerNombrePlan(planActual)
                      : nombrePlanActual}
                  </span>
                </p>

                <p>
                  Mensualidad:{" "}
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {suscripcionActiva || tuvoSuscripcion
                      ? `${formatearPrecio(precioRenovacion)}/mes`
                      : "—"}
                  </span>
                </p>

                <p>
                  Estado:{" "}
                  <span
                    className={
                      suscripcionActiva
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-amber-600 dark:text-amber-400"
                    }
                  >
                    {suscripcionActiva
                      ? estado
                      : tuvoSuscripcion
                      ? "Vencido / sin renovar"
                      : "Sin plan activo"}
                  </span>
                </p>

                {vencimiento && (
                  <p>
                    {suscripcionActiva
                      ? "Próximo vencimiento"
                      : "Último vencimiento"}
                    :{" "}
                    <span className="font-semibold text-slate-950 dark:text-white">
                      {formatearFecha(vencimiento)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {(suscripcionActiva || tuvoSuscripcion) && (
              <div className="shrink-0 sm:text-right">
                <button
                  type="button"
                  onClick={() => solicitarPorWhatsApp(obtenerNombrePlan(planActual), "renovar")}
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-500 sm:w-auto sm:px-4 sm:py-2.5 sm:text-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Renovar por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/empresas/${empresaId}/facturacion`)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs"
        >
          Volver a facturación
        </button>
      </div>
    </section>
  );
}