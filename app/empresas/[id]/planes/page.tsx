"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

type PlanId = "free" | "pro" | "business";

type Empresa = {
  nombre?: string;
  name?: string;
  userId?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
};

type MiembroEmpresa = {
  estado?: "activo" | "inactivo";
};

type Plan = {
  id: PlanId;
  nombre: string;
  precio: string;
  descripcion: string;
  destacado?: boolean;
  funciones: string[];
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
    return (
      valor as {
        toDate: () => Date;
      }
    ).toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha = new Date(valor);

    if (!Number.isNaN(fecha.getTime())) {
      return fecha;
    }
  }

  return null;
}

const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Free",
    precio: "$0",
    descripcion: "Para emprendedores que quieren automatizar la atención por WhatsApp.",
    funciones: [
      "1 empresa",
      "50 conversaciones por mes",
      "250 respuestas de IA por mes",
      "WhatsApp con respuestas de IA",
      "Base de conocimiento",
      "Panel de conversaciones",
      "Estadísticas básicas",
      "Firma NDI AI en la primera respuesta automática",
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$14.999 / mes",
    descripcion: "Para negocios que necesitan automatizar su atención.",
    destacado: true,
    funciones: [
      "Todo lo incluido en Free",
      "1.000 conversaciones por mes",
      "5.000 respuestas de IA por mes",
      "Widget web",
      "Automatizaciones",
      "Agenda y turnos",
      "Equipo y operadores",
      "Instagram y Facebook cuando estén disponibles",
      "Estadísticas avanzadas",
      "Atención humana",
      "Sin publicidad ni firma de NDI AI",
    ],
  },
  {
    id: "business",
    nombre: "Empresa",
    precio: "A medida",
    descripcion: "Para equipos con mayor volumen y necesidades especiales.",
    funciones: [
      "Todo lo incluido en Pro",
      "Conversaciones personalizadas",
      "Múltiples agentes",
      "Soporte prioritario",
      "Configuración asistida",
      "Integraciones personalizadas",
      "Facturación para empresas",
    ],
  },
];

export default function PlanesPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [usuario, setUsuario] = useState<User | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesandoPlan, setProcesandoPlan] =
    useState<PlanId | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  useEffect(() => {
    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (usuarioActual) => {
          if (!usuarioActual) {
            router.replace("/login");
            return;
          }

          if (!empresaId) {
            setError(
              "No se encontró la empresa."
            );
            setCargando(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          setUsuario(null);
          setEmpresa(null);
          setAccesoVerificado(false);
          setError("");
          setCargando(true);

          try {
            const empresaSnapshot =
              await getDoc(
                doc(
                  db,
                  "companies",
                  empresaIdSeguro
                )
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe."
              );
              return;
            }

            const datos =
              empresaSnapshot.data() as Empresa;

            if (
              datos.userId !==
              usuarioActual.uid
            ) {
              const miembroSnapshot =
                await getDoc(
                  doc(
                    db,
                    "companies",
                    empresaIdSeguro,
                    "members",
                    usuarioActual.uid
                  )
                );

              if (
                miembroSnapshot.exists()
              ) {
                const miembro =
                  miembroSnapshot.data() as MiembroEmpresa;

                if (
                  miembro.estado ===
                  "activo"
                ) {
                  router.replace(
                    `/empresas/${empresaIdSeguro}/conversaciones`
                  );
                  return;
                }
              }

              router.replace(
                "/empresas"
              );
              return;
            }

            setUsuario(
              usuarioActual
            );
            setEmpresa(datos);
            setAccesoVerificado(true);
          } catch (firebaseError) {
            console.error(
              "Error cargando los planes:",
              firebaseError
            );

            setError(
              "No se pudo cargar la información del plan."
            );
          } finally {
            setCargando(false);
          }
        }
      );

    return () => cancelarAuth();
  }, [empresaId, router]);

  const planGuardado: PlanId =
    empresa?.plan === "pro" ||
    empresa?.plan === "business"
      ? empresa.plan
      : "free";

  const fechaVencimiento =
    convertirFecha(
      empresa?.subscriptionEndsAt
    );

  const planActual: PlanId =
    planGuardado === "business"
      ? "business"
      : planGuardado === "pro" &&
          fechaVencimiento &&
          fechaVencimiento.getTime() >
            Date.now()
        ? "pro"
        : "free";

  async function seleccionarPlan(planId: PlanId) {
    setError("");
    setMensaje("");

    if (
      !empresaId ||
      !usuario ||
      !accesoVerificado
    ) {
      setError(
        "No se encontró la empresa o el usuario."
      );
      return;
    }

    if (planId === planActual) {
      setMensaje("Este es tu plan actual.");
      return;
    }

    if (planId === "free") {
      setMensaje(
        "El cambio al plan Free se habilitará desde la gestión de suscripción."
      );
      return;
    }

    if (planId === "business") {
      setMensaje(
        "El plan Empresa se cotiza de forma personalizada. Por ahora no se cobra automáticamente."
      );
      return;
    }

    setProcesandoPlan(planId);

    try {
      const idToken =
        await usuario.getIdToken(true);

      const response = await fetch(
        "/api/payments/mercadopago/create-preference",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            empresaId,
            plan: planId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Todavía no está configurado Mercado Pago."
        );
      }

      const checkoutUrl =
        data?.checkoutUrl ||
        data?.initPoint ||
        data?.sandboxInitPoint;

      if (!checkoutUrl) {
        throw new Error(
          "Mercado Pago no devolvió el enlace de pago."
        );
      }

      window.location.href = checkoutUrl;
    } catch (requestError) {
      console.error(
        "Error creando la preferencia:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo iniciar el pago."
      );
    } finally {
      setProcesandoPlan(null);
    }
  }

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
            Cargando planes...
          </p>
        </div>
      </section>
    );
  }

  if (
    !accesoVerificado ||
    !empresa
  ) {
    if (error) {
      return (
        <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Suscripción
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Planes de NDI AI
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
          Elegí el plan que mejor se adapte al volumen de atención de{" "}
          {empresa?.nombre || empresa?.name || "tu empresa"}.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {mensaje}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = plan.id === planActual;
          const procesando = procesandoPlan === plan.id;

          return (
            <article
              key={plan.id}
              className={[
                "relative flex flex-col rounded-3xl border bg-white p-6 text-slate-950 shadow-sm transition-colors dark:bg-zinc-900 dark:text-white",
                plan.destacado
                  ? "border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-950/20"
                  : "border-slate-200 dark:border-zinc-800",
              ].join(" ")}
            >
              {plan.destacado && (
                <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Recomendado
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                    {plan.nombre}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                    {plan.descripcion}
                  </p>
                </div>

                {esActual && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    Plan actual
                  </span>
                )}
              </div>

              <p className="mt-7 text-3xl font-bold text-slate-950 dark:text-white">
                {plan.precio}
              </p>

              <div className="mt-7 flex-1 space-y-3">
                {plan.funciones.map((funcion) => (
                  <div
                    key={funcion}
                    className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300"
                  >
                    <span className="mt-0.5 text-emerald-400">
                      ✓
                    </span>
                    <span>{funcion}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={procesando || esActual}
                onClick={() => seleccionarPlan(plan.id)}
                className={[
                  "mt-8 w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                  plan.destacado
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {procesando
                  ? "Preparando pago..."
                  : esActual
                    ? "Plan actual"
                    : plan.id === "business"
                      ? "Consultar plan"
                      : "Elegir plan"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium text-slate-950 dark:text-white">
          Estado de la suscripción
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Plan:{" "}
          <span className="font-medium capitalize text-slate-950 dark:text-white">
            {planActual}
          </span>
          {" · "}
          Estado:{" "}
          <span className="font-medium text-emerald-400">
            {empresa?.subscriptionStatus || "active"}
          </span>
        </p>
      </div>
    </section>
  );
}