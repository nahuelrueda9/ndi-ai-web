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

  /**
   * Campo preparado para guardar el valor mensual
   * contratado por cada cliente.
   *
   * Cuando adaptemos el checkout, Business podrá conservar
   * su precio de lanzamiento aunque el precio público suba.
   */
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
        : "Activo";
  }
}

const BENEFICIOS: Record<
  PlanId,
  string[]
> = {
  free: [
    "Página pública profesional",
    "Servicios y precios",
    "Horarios y ubicación",
    "WhatsApp directo",
    "Redes sociales",
    "Formulario de contacto",
    "Estadísticas básicas",
  ],

  pro: [
    "Todo lo de Página Simple",
    "Productos y catálogo",
    "Código QR",
    "Solicitud de presupuestos",
    "Agenda y reservas online",
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
      <main className="mx-auto max-w-7xl p-6 text-slate-950 dark:text-white">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
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
      <main className="mx-auto max-w-7xl p-6 text-slate-950 dark:text-white">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
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
    typeof empresa.subscriptionMonthlyPrice ===
      "number" &&
    empresa.subscriptionMonthlyPrice >
      0
      ? empresa.subscriptionMonthlyPrice
      : precioPlan.mensual;

  const estado =
    textoEstado(
      empresa.subscriptionStatus,
    );

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
    <main className="mx-auto max-w-7xl p-6 text-slate-950 dark:text-white">
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {empresa.nombre ||
          empresa.name ||
          "Empresa"}
      </p>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
            Facturación
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600 dark:text-zinc-400">
            Revisá tu plan, mantenimiento mensual y pagos de NDI AI.
          </p>
        </div>

        <Link
          href={`/empresas/${empresaId}/planes`}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Ver planes
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          titulo="Plan actual"
          valor={nombrePlan}
          descripcion={
            plan === "business"
              ? "Business IA · precio lanzamiento"
              : "Plan activo de tu negocio"
          }
        />

        <Card
          titulo="Mantenimiento"
          valor={`${formatearPrecio(
            mensualContratado,
          )}/mes`}
          descripcion="Servicio mensual de NDI AI"
        />

        <Card
          titulo="Estado"
          valor={estado}
          descripcion="Estado de la suscripción"
          estado={
            estado === "Activo"
          }
        />

        <Card
          titulo="Próximo vencimiento"
          valor={
            fechaVencimiento
              ? formatearFecha(
                  fechaVencimiento,
                )
              : "Sin fecha"
          }
          descripcion={
            fechaVencimiento
              ? "Fecha registrada de renovación"
              : "Todavía no hay un vencimiento registrado"
          }
          compacto
        />
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-slate-200 p-6 dark:border-zinc-800">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                  {nombrePlan}
                </h2>

                {plan ===
                  "business" && (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                    Precio lanzamiento
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                Tu plan actual dentro de NDI AI.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm text-slate-500 dark:text-zinc-500">
                Precio de alta
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                {formatearPrecio(
                  precioPlan.inicial,
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                +{" "}
                {formatearPrecio(
                  mensualContratado,
                )}
                /mes
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-500">
              Incluido en tu plan
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {BENEFICIOS[
                plan
              ].map(
                (beneficio) => (
                  <div
                    key={
                      beneficio
                    }
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      ✓
                    </span>

                    <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                      {
                        beneficio
                      }
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Cómo funciona el cobro
            </p>

            <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-zinc-400">
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
                <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                  <strong>
                    Precio lanzamiento:
                  </strong>{" "}
                  los primeros clientes de Business IA pueden conservar el valor mensual contratado mientras mantengan activa su suscripción.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {plan ===
      "business" ? (
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Uso del asistente IA
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
              Consumo del mes actual incluido en Business IA.
            </p>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
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
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                Asistente IA
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-zinc-500">
                El asistente inteligente y su consumo mensual forman parte de Business IA.
              </p>
            </div>

            <Link
              href={`/empresas/${empresaId}/planes`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Comparar planes
            </Link>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
          Último pago
        </h2>

        {empresa
          .mercadopagoPaymentId ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-slate-500 dark:text-zinc-500">
              ID de Mercado Pago
            </p>

            <p className="mt-2 break-all font-medium">
              {
                empresa
                  .mercadopagoPaymentId
              }
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-zinc-700">
            <p className="font-medium text-slate-700 dark:text-zinc-300">
              Todavía no hay pagos registrados.
            </p>

            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
              Cuando haya un pago asociado a esta empresa va a aparecer acá.
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/empresas/${empresaId}/planes`}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Ver o cambiar plan
        </Link>

        <Link
          href={`/empresas/${empresaId}/dashboard`}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-slate-600 dark:text-zinc-400">
        {titulo}
      </p>

      <h2
        className={`mt-2 font-bold ${
          compacto
            ? "text-xl"
            : "text-2xl"
        } ${
          estado
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-950 dark:text-white"
        }`}
      >
        {valor}
      </h2>

      <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950 dark:text-white">
            {titulo}
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
            {restantes.toLocaleString(
              "es-AR",
            )}{" "}
            disponibles este mes
          </p>
        </div>

        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
          {usadas.toLocaleString(
            "es-AR",
          )}{" "}
          /{" "}
          {limite.toLocaleString(
            "es-AR",
          )}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
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