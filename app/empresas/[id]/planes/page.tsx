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

const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Free",
    precio: "$0",
    descripcion: "Para probar NDI AI y configurar tu primera empresa.",
    funciones: [
      "1 empresa",
      "50 conversaciones por mes",
      "Widget web",
      "Base de conocimiento",
      "Panel de conversaciones",
      "Estadísticas básicas",
      "Publicidad y marca de NDI AI en el widget",
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$35.000 / mes",
    descripcion: "Para negocios que necesitan automatizar su atención.",
    destacado: true,
    funciones: [
      "Todo lo incluido en Free",
      "1.000 conversaciones por mes",
      "WhatsApp Business",
      "Instagram y Facebook",
      "Estadísticas avanzadas",
      "Atención humana",
      "Sin publicidad ni marca de NDI AI",
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

  const planActual = empresa?.plan || "free";

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
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="mt-4 text-sm text-zinc-400">
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
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
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
        <p className="text-sm font-medium text-blue-400">
          Suscripción
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Planes de NDI AI
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Elegí el plan que mejor se adapte al volumen de atención de{" "}
          {empresa?.nombre || empresa?.name || "tu empresa"}.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
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
                "relative flex flex-col rounded-3xl border bg-zinc-900 p-6",
                plan.destacado
                  ? "border-blue-500 shadow-xl shadow-blue-950/20"
                  : "border-zinc-800",
              ].join(" ")}
            >
              {plan.destacado && (
                <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Recomendado
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {plan.nombre}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {plan.descripcion}
                  </p>
                </div>

                {esActual && (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Plan actual
                  </span>
                )}
              </div>

              <p className="mt-7 text-3xl font-bold text-white">
                {plan.precio}
              </p>

              <div className="mt-7 flex-1 space-y-3">
                {plan.funciones.map((funcion) => (
                  <div
                    key={funcion}
                    className="flex items-start gap-3 text-sm text-zinc-300"
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
                    : "border border-zinc-700 text-zinc-200 hover:bg-zinc-800",
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

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="font-medium text-white">
          Estado de la suscripción
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Plan:{" "}
          <span className="font-medium capitalize text-white">
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