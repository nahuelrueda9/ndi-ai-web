"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
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

import {
  auth,
  db,
} from "@/lib/firebase";
import {
  empresaTieneSuscripcionActiva,
  obtenerLimitesPlan,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

type EmpresaFacturacion = {
  userId?: string;
  nombre?: string;
  name?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  conversationsThisMonth?: number;
  conversationsUsageMonth?: string;
  aiResponsesThisMonth?: number;
  aiResponsesUsageMonth?: string;
  mercadopagoPaymentId?: string;
  mercadopagoPaymentStatus?: string;
  mercadopagoPaymentAmount?: number;
  mercadopagoPaymentCurrency?: string;
  mercadopagoPaymentApprovedAt?: unknown;
  subscriptionStartedAt?: unknown;
  subscriptionInitialPrice?: number;
  subscriptionPriceLockedAt?: unknown;
  subscriptionMonthlyPrice?: number;
};

function obtenerMesActualArgentina() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio =
    partes.find(
      (parte) =>
        parte.type === "year",
    )?.value ?? "";

  const mes =
    partes.find(
      (parte) =>
        parte.type === "month",
    )?.value ?? "";

  return `${anio}-${mes}`;
}

function convertirFecha(
  valor: unknown,
): Date | null {
  if (!valor) {
    return null;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (
      valor as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      return (
        valor as {
          toDate: () => Date;
        }
      ).toDate();
    } catch {
      return null;
    }
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha =
      new Date(valor);

    if (
      !Number.isNaN(
        fecha.getTime(),
      )
    ) {
      return fecha;
    }
  }

  return null;
}

function formatearPrecio(
  valor: number,
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    },
  ).format(valor);
}

function formatearFecha(
  fecha: Date | null,
) {
  if (!fecha) {
    return "Sin fecha registrada";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      timeZone:
        "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(fecha);
}

function textoEstado(
  estado?: string,
) {
  switch (estado) {
    case "active":
      return "Activo";
    case "approved":
      return "Activo";
    case "authorized":
      return "Activo";
    case "pending":
      return "Pendiente";
    case "paused":
      return "Pausado";
    case "cancelled":
    case "canceled":
      return "Cancelado";
    case "expired":
      return "Vencido";
    default:
      return estado
        ? estado
        : "Sin plan activo";
  }
}

const BENEFICIOS: Record<
  PlanId,
  string[]
> = {
  free: [
    "Página pública profesional",
    "Servicios y precios",
    "Turnos y reservas online",
    "Horarios y ubicación",
    "WhatsApp directo",
    "Redes sociales",
    "Formulario de contacto",
    "Estadísticas básicas",
  ],

  pro: [
    "Todo lo de Página Simple",
    "Productos y catálogo",
    "Cobros online (Mercado Pago / CVU)",
    "Código QR para compartir",
    "Solicitud de presupuestos",
    "Más secciones",
    "Estadísticas avanzadas",
  ],

  business: [
    "Todo lo de Página Completa",
    "Asistente IA web",
    "Base de conocimiento",
    "Consultas guardadas",
    "Respuestas con datos del negocio",
    "Atención humana",
    "Sin marca NDI AI",
  ],
};

export default function FacturacionPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa,
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const [
    empresa,
    setEmpresa,
  ] = useState<
    EmpresaFacturacion | null
  >(null);

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          if (!empresaId) {
            setError(
              "No se encontró la empresa.",
            );
            setCargando(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          setAccesoVerificado(false);
          setEmpresa(null);
          setError("");
          setCargando(true);

          try {
            const empresaReferencia =
              doc(
                db,
                "companies",
                empresaIdSeguro,
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia,
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe.",
              );
              setCargando(false);
              return;
            }

            const datosEmpresa =
              empresaSnapshot.data() as EmpresaFacturacion;

            if (
              datosEmpresa.userId !==
              currentUser.uid
            ) {
              router.replace(
                `/empresas/${empresaIdSeguro}/dashboard`,
              );
              return;
            }

            setEmpresa(
              datosEmpresa,
            );

            setAccesoVerificado(
              true,
            );
          } catch (firebaseError) {
            console.error(
              "Error al verificar el acceso a facturación:",
              firebaseError,
            );

            router.replace(
              "/empresas",
            );
          }
        },
      );

    return () =>
      cancelarAuth();
  }, [
    empresaId,
    router,
  ]);

  useEffect(() => {
    if (
      !empresaId ||
      !accesoVerificado
    ) {
      return;
    }

    const empresaReferencia =
      doc(
        db,
        "companies",
        empresaId,
      );

    const cancelar =
      onSnapshot(
        empresaReferencia,
        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setError(
              "La empresa no existe.",
            );
            setCargando(false);
            return;
          }

          setEmpresa(
            snapshot.data() as EmpresaFacturacion,
          );

          setError("");
          setCargando(false);
        },
        (firebaseError) => {
          console.error(
            "Error al cargar facturación:",
            firebaseError,
          );

          setError(
            firebaseError.code ===
              "permission-denied"
              ? "No tenés permisos para ver la facturación."
              : "No se pudo cargar la información de facturación.",
          );

          setCargando(false);
        },
      );

    return () =>
      cancelar();
  }, [
    accesoVerificado,
    empresaId,
  ]);

  if (cargando) {
    return (
      <main className="mx-auto max-w-[1500px] px-3 py-3 text-slate-950 dark:text-white sm:px-6 sm:py-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl sm:p-10">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
            Verificando acceso y cargando facturación...
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !empresaId
  ) {
    return (
      <main className="mx-auto max-w-[1500px] px-3 py-3 text-slate-950 dark:text-white sm:px-6 sm:py-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:rounded-2xl sm:p-6">
          {error ||
            "No se pudo cargar la empresa."}
        </div>
      </main>
    );
  }

  if (
    !accesoVerificado ||
    !empresa
  ) {
    return null;
  }

  const plan =
    obtenerPlanEfectivo(
      empresa,
    );

  const suscripcionActiva =
    empresaTieneSuscripcionActiva(
      empresa,
    );

  const tuvoSuscripcion =
    Boolean(
      empresa.subscriptionStartedAt ||
      empresa.subscriptionPriceLockedAt ||
      empresa.subscriptionInitialPrice ||
      empresa.subscriptionMonthlyPrice ||
      empresa.mercadopagoPaymentId ||
      empresa.subscriptionEndsAt,
    );

  const nombrePlan =
    obtenerNombrePlan(plan);

  const precioPlan =
    obtenerPrecioPlan(plan);

  const limitePlan =
    obtenerLimitesPlan(plan);

  const fechaVencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt,
    );

  const mensualContratado =
    plan === "business" &&
    typeof empresa.subscriptionMonthlyPrice === "number" &&
    empresa.subscriptionMonthlyPrice > 0
      ? empresa.subscriptionMonthlyPrice
      : precioPlan.mensual;

  const estado =
    suscripcionActiva
      ? "Activo"
      : tuvoSuscripcion
        ? empresa.subscriptionStatus === "pending"
          ? "Pendiente"
          : "Vencido / sin renovar"
        : textoEstado(
            empresa.subscriptionStatus,
          );

  const nombrePlanVisible =
    suscripcionActiva ||
    tuvoSuscripcion
      ? nombrePlan
      : "Sin plan activo";

  const mensualidadVisible =
    suscripcionActiva ||
    tuvoSuscripcion
      ? `${formatearPrecio(
          mensualContratado,
        )}/mes`
      : "—";

  const fechaUltimoPago =
    convertirFecha(
      empresa.mercadopagoPaymentApprovedAt,
    );

  const estadoUltimoPago =
    empresa.mercadopagoPaymentStatus
      ? textoEstado(
          empresa.mercadopagoPaymentStatus,
        )
      : "Sin estado";

  const montoUltimoPago =
    typeof empresa.mercadopagoPaymentAmount ===
      "number" &&
    Number.isFinite(
      empresa.mercadopagoPaymentAmount,
    )
      ? formatearPrecio(
          empresa.mercadopagoPaymentAmount,
        )
      : "Sin monto registrado";

  const monedaUltimoPago =
    empresa.mercadopagoPaymentCurrency ||
    "ARS";

  const mesActual =
    obtenerMesActualArgentina();

  const consultasUsadas =
    empresa.conversationsUsageMonth ===
    mesActual
      ? Math.max(
          0,
          empresa.conversationsThisMonth ||
            0,
        )
      : 0;

  const respuestasIAUsadas =
    empresa.aiResponsesUsageMonth ===
    mesActual
      ? Math.max(
          0,
          empresa.aiResponsesThisMonth ||
            0,
        )
      : 0;

  const porcentajeConsultas =
    limitePlan.conversaciones >
    0
      ? Math.min(
          100,
          Math.round(
            (consultasUsadas /
              limitePlan.conversaciones) *
              100,
          ),
        )
      : 0;

  const porcentajeIA =
    limitePlan.respuestasIA > 0
      ? Math.min(
          100,
          Math.round(
            (respuestasIAUsadas /
              limitePlan.respuestasIA) *
              100,
          ),
        )
      : 0;

  return (
    <main className="mx-auto max-w-[1500px] px-3 py-3 text-slate-950 dark:text-white sm:px-6 sm:py-4">
      <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 sm:text-xs">
        {empresa.nombre ||
          empresa.name ||
          "Empresa"}
      </p>

      <div className="mt-0.5 flex items-end justify-between gap-2 sm:mt-1 sm:flex-wrap sm:gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
            Facturación
          </h1>

          <p className="mt-0.5 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-1 sm:max-w-2xl sm:text-xs sm:leading-normal">
            Revisá tu plan, mantenimiento mensual y pagos de NDI AI.
          </p>
        </div>

        <Link
          href={`/empresas/${empresaId}/planes`}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-500 sm:px-4 sm:text-xs"
        >
          Ver planes
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card
          titulo="Plan actual"
          valor={nombrePlanVisible}
          descripcion={
            suscripcionActiva
              ? plan === "business"
                ? "Business IA · precio contratado"
                : "Plan activo de tu negocio"
              : tuvoSuscripcion
                ? "Último plan contratado"
                : "Elegí un plan para activar tu negocio"
          }
        />

        <Card
          titulo="Mantenimiento"
          valor={mensualidadVisible}
          descripcion={
            suscripcionActiva
              ? "Servicio mensual de NDI AI"
              : tuvoSuscripcion
                ? "Valor mensual para renovar este plan"
                : "Todavía no hay una mensualidad contratada"
          }
        />

        <Card
          titulo="Estado"
          valor={estado}
          descripcion="Estado de la suscripción"
          estado={
            suscripcionActiva
          }
        />

        <Card
          titulo={
            suscripcionActiva
              ? "Próximo vencimiento"
              : tuvoSuscripcion
                ? "Último vencimiento"
                : "Vencimiento"
          }
          valor={
            fechaVencimiento
              ? formatearFecha(
                  fechaVencimiento,
                )
              : "Sin fecha"
          }
          descripcion={
            suscripcionActiva
              ? "Fecha hasta la que tu plan está activo"
              : fechaVencimiento
                ? "La suscripción necesita renovación"
                : "Todavía no hay un vencimiento registrado"
          }
          compacto
        />
      </div>

      {tuvoSuscripcion || suscripcionActiva ? (
      <section className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:mt-4 sm:rounded-2xl">
        <div className="border-b border-slate-200 p-3 dark:border-zinc-800 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:flex-wrap sm:gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base font-bold text-slate-950 dark:text-white sm:text-xl">
                  {nombrePlan}
                </h2>

                {plan ===
                  "business" && (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 sm:px-2.5 sm:text-[10px]">
                    Precio lanzamiento
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-1 sm:text-xs sm:leading-normal">
                {suscripcionActiva
                  ? "Tu plan actual dentro de NDI AI."
                  : "Último plan contratado. Podés renovarlo desde Planes."}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[9px] text-slate-500 dark:text-zinc-500 sm:text-xs">
                Precio de alta
              </p>

              <p className="mt-0.5 text-base font-bold text-slate-950 dark:text-white sm:text-xl">
                {formatearPrecio(
                  typeof empresa.subscriptionInitialPrice === "number" &&
                  empresa.subscriptionInitialPrice > 0
                    ? empresa.subscriptionInitialPrice
                    : precioPlan.inicial,
                )}
              </p>

              <p className="mt-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400 sm:text-xs">
                +{" "}
                {formatearPrecio(
                  mensualContratado,
                )}
                /mes
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500 sm:text-[10px] sm:tracking-[0.14em]">
              Incluido en tu plan
            </h3>

            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
              {BENEFICIOS[
                plan
              ].map(
                (beneficio) => (
                  <div
                    key={
                      beneficio
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-950 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 sm:h-5 sm:w-5 sm:text-[11px]">
                      ✓
                    </span>

                    <p className="text-[9px] font-medium leading-3.5 text-slate-700 dark:text-zinc-300 sm:text-xs sm:leading-normal">
                      {
                        beneficio
                      }
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-xl sm:p-3.5">
            <p className="text-[10px] font-semibold text-slate-950 dark:text-white sm:text-xs">
              Cómo funciona el cobro
            </p>

            <div className="mt-1.5 space-y-1.5 text-[9px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:space-y-2 sm:text-xs sm:leading-5">
              <p>
                <strong className="text-slate-900 dark:text-zinc-200">
                  Alta:
                </strong>{" "}
                corresponde a la configuración y puesta en marcha de tu página.
              </p>

              <p>
                <strong className="text-slate-900 dark:text-zinc-200">
                  Mensualidad:
                </strong>{" "}
                mantiene tu página, panel y funciones del plan funcionando.
              </p>

              {plan ===
                "business" && (
                <p className="rounded-md border border-violet-200 bg-violet-50 p-2 text-[9px] leading-3.5 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 sm:rounded-lg sm:p-2.5 sm:text-[11px] sm:leading-4">
                  <strong>
                    Precio lanzamiento:
                  </strong>{" "}
                  conservás el valor mensual contratado mientras mantengas activa tu suscripción.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      ) : (
        <section className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:mt-4 sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-bold text-slate-950 dark:text-white sm:text-xl">
            Todavía no tenés un plan activo
          </h2>

          <p className="mx-auto mt-1.5 max-w-2xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-xs sm:leading-5">
            Elegí Página Simple, Página Completa o Business IA para activar las funciones de tu negocio.
          </p>

          <Link
            href={`/empresas/${empresaId}/planes`}
            className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-500 sm:mt-4 sm:px-4 sm:text-xs"
          >
            Elegir plan
          </Link>
        </section>
      )}

      {suscripcionActiva &&
      plan ===
      "business" ? (
        <section className="mt-3 sm:mt-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
              Uso del asistente IA
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-500 sm:text-xs">
              Consumo del mes actual incluido en Business IA.
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3 lg:grid-cols-2">
            <UsoCard
              titulo="Consultas al asistente"
              usadas={
                consultasUsadas
              }
              limite={
                limitePlan.conversaciones
              }
              porcentaje={
                porcentajeConsultas
              }
            />

            <UsoCard
              titulo="Respuestas de IA"
              usadas={
                respuestasIAUsadas
              }
              limite={
                limitePlan.respuestasIA
              }
              porcentaje={
                porcentajeIA
              }
            />
          </div>
        </section>
      ) : (
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:mt-4 sm:rounded-xl sm:p-4">
          <div className="flex items-center justify-between gap-3 sm:flex-wrap sm:gap-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
                Asistente IA
              </h2>

              <p className="mt-1 max-w-2xl text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm sm:leading-normal">
                {plan === "business" && tuvoSuscripcion && !suscripcionActiva
                  ? "Tu Business IA no está activo. Renovalo para volver a usar el asistente y su consumo mensual."
                  : "El asistente inteligente y su consumo mensual forman parte de Business IA."}
              </p>
            </div>

            <Link
              href={`/empresas/${empresaId}/planes`}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
            >
              {plan === "business" && tuvoSuscripcion
                ? "Renovar Business IA"
                : "Comparar planes"}
            </Link>
          </div>
        </section>
      )}

      <section className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:mt-4 sm:rounded-xl sm:p-4">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
          Último pago
        </h2>

        {empresa.mercadopagoPaymentId ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-lg sm:p-3">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px]">
                Estado
              </p>

              <p
                className={`mt-0.5 text-[11px] font-semibold sm:mt-1 sm:text-sm ${
                  empresa.mercadopagoPaymentStatus ===
                    "approved"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-900 dark:text-zinc-200"
                }`}
              >
                {estadoUltimoPago}
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-lg sm:p-3">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px]">
                Importe
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-slate-900 dark:text-zinc-200 sm:mt-1 sm:text-sm">
                {montoUltimoPago}{" "}
                <span className="text-xs font-normal text-slate-500 dark:text-zinc-500">
                  {monedaUltimoPago}
                </span>
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-lg sm:p-3">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px]">
                Aprobado
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-slate-900 dark:text-zinc-200 sm:mt-1 sm:text-sm">
                {fechaUltimoPago
                  ? formatearFecha(
                      fechaUltimoPago,
                    )
                  : "Sin fecha registrada"}
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-lg sm:p-3">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px]">
                ID Mercado Pago
              </p>

              <p className="mt-0.5 break-all text-[9px] font-medium text-slate-900 dark:text-zinc-200 sm:mt-1 sm:text-xs">
                {empresa.mercadopagoPaymentId}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-lg border border-dashed border-slate-300 p-4 text-center dark:border-zinc-700 sm:mt-3 sm:p-5">
            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-base">
              Todavía no hay pagos registrados.
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm">
              Cuando haya un pago asociado a esta empresa va a aparecer acá.
            </p>
          </div>
        )}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-4">
        <Link
          href={`/empresas/${empresaId}/planes`}
          className="rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-500 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
        >
          {suscripcionActiva
            ? "Ver planes"
            : tuvoSuscripcion
              ? "Renovar plan"
              : "Elegir plan"}
        </Link>

        <Link
          href={`/empresas/${empresaId}/dashboard`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-6 sm:py-3 sm:text-base"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

function Card({
  titulo,
  valor,
  descripcion,
  estado = false,
  compacto = false,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  estado?: boolean;
  compacto?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl sm:p-3.5">
      <p className="text-[9px] leading-3 text-slate-600 dark:text-zinc-400 sm:text-sm sm:leading-normal">
        {titulo}
      </p>

      <h2
        className={`mt-1 font-bold ${
          compacto
            ? "text-sm sm:text-lg"
            : "text-base sm:text-xl"
        } ${
          estado
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-950 dark:text-white"
        }`}
      >
        {valor}
      </h2>

      <p className="mt-1 line-clamp-2 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-xs sm:leading-normal">
        {descripcion}
      </p>
    </div>
  );
}

function UsoCard({
  titulo,
  usadas,
  limite,
  porcentaje,
}: {
  titulo: string;
  usadas: number;
  limite: number;
  porcentaje: number;
}) {
  const restantes =
    Math.max(
      0,
      limite - usadas,
    );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl sm:p-3.5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div>
          <h3 className="text-[11px] font-semibold leading-4 text-slate-950 dark:text-white sm:text-base sm:leading-normal">
            {titulo}
          </h3>

          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-500 sm:text-xs">
            {restantes.toLocaleString(
              "es-AR",
            )}{" "}
            disponibles este mes
          </p>
        </div>

        <span className="shrink-0 text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
          {usadas.toLocaleString(
            "es-AR",
          )}{" "}
          /{" "}
          {limite.toLocaleString(
            "es-AR",
          )}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800 sm:mt-3 sm:h-2">
        <div
          className={
            porcentaje >= 100
              ? "h-full rounded-full bg-red-500"
              : porcentaje >= 80
                ? "h-full rounded-full bg-amber-500"
                : "h-full rounded-full bg-blue-500"
          }
          style={{
            width: `${porcentaje}%`,
          }}
        />
      </div>
    </div>
  );
}