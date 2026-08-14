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
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

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

  if (
    valor instanceof Date
  ) {
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

function formatearFecha(
  fecha: Date | null,
) {
  if (!fecha) {
    return "";
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

function obtenerTextoEstado(
  estado?: string,
) {
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
  const params =
    useParams();

  const router =
    useRouter();

  const parametroEmpresa =
    params.id ??
    params.empresaId;

  const empresaId =
    Array.isArray(
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
    Empresa | null
  >(null);

  const [
    usuario,
    setUsuario,
  ] = useState<User | null>(
    null,
  );

  const [
    procesandoPlan,
    setProcesandoPlan,
  ] = useState<PlanId | null>(
    null,
  );

  const [
    procesandoRenovacion,
    setProcesandoRenovacion,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  useEffect(() => {
    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (
          usuarioActual,
        ) => {
          if (
            !usuarioActual
          ) {
            router.replace(
              "/login",
            );
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

          setEmpresa(null);
          setAccesoVerificado(
            false,
          );
          setError("");
          setMensaje("");
          setCargando(true);

          try {
            const empresaSnapshot =
              await getDoc(
                doc(
                  db,
                  "companies",
                  empresaIdSeguro,
                ),
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe.",
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
                    usuarioActual.uid,
                  ),
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
                    `/empresas/${empresaIdSeguro}/dashboard`,
                  );
                  return;
                }
              }

              router.replace(
                "/empresas",
              );
              return;
            }

            setUsuario(
              usuarioActual,
            );

            setEmpresa(datos);
            setAccesoVerificado(
              true,
            );
          } catch (
            firebaseError
          ) {
            console.error(
              "Error cargando los planes:",
              firebaseError,
            );

            setError(
              "No se pudo cargar la información del plan.",
            );
          } finally {
            setCargando(false);
          }
        },
      );

    return () =>
      cancelarAuth();
  }, [
    empresaId,
    router,
  ]);

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6">
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
        <section className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        </section>
      );
    }

    return null;
  }

  const planActual =
    obtenerPlanEfectivo(
      empresa,
    );

  const suscripcionActiva =
    empresaTieneSuscripcionActiva(
      empresa,
    );

  const nombrePlanActual =
    suscripcionActiva
      ? obtenerNombrePlan(
          planActual,
        )
      : "Sin plan activo";

  const precioPlanActual =
    obtenerPrecioPlan(
      planActual,
    );

  const precioMensualActual =
    suscripcionActiva
      ? typeof empresa.subscriptionMonthlyPrice ===
            "number" &&
          empresa.subscriptionMonthlyPrice >
            0
        ? empresa.subscriptionMonthlyPrice
        : precioPlanActual.mensual
      : 0;

  const estado =
    suscripcionActiva
      ? obtenerTextoEstado(
          empresa.subscriptionStatus,
        )
      : empresa.subscriptionStatus
        ? obtenerTextoEstado(
            empresa.subscriptionStatus,
          )
        : "Sin plan activo";

  const vencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt,
    );

  const tuvoSuscripcion =
    Boolean(
      empresa.subscriptionStatus ||
      empresa.subscriptionEndsAt ||
      empresa.subscriptionMonthlyPrice,
    );

  const precioRenovacion =
    typeof empresa.subscriptionMonthlyPrice ===
      "number" &&
    empresa.subscriptionMonthlyPrice >
      0
      ? empresa.subscriptionMonthlyPrice
      : precioPlanActual.mensual;

  async function abrirCheckout(
    planId: PlanId,
    tipoPago: "alta" | "renovacion",
  ) {
    if (
      !empresaId ||
      !usuario ||
      !accesoVerificado
    ) {
      throw new Error(
        "No se encontró la empresa o el usuario.",
      );
    }

    const idToken =
      await usuario.getIdToken(
        true,
      );

    const response =
      await fetch(
        "/api/payments/mercadopago/create-preference",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`,
          },

          body:
            JSON.stringify({
              empresaId,
              plan:
                planId,
              tipoPago,
            }),
        },
      );

    const data =
      (await response.json()) as {
        error?: string;
        checkoutUrl?: string;
        initPoint?: string;
        sandboxInitPoint?: string;
      };

    if (!response.ok) {
      throw new Error(
        data.error ||
          "No se pudo iniciar el pago con Mercado Pago.",
      );
    }

    const checkoutUrl =
      data.checkoutUrl ||
      data.initPoint ||
      data.sandboxInitPoint;

    if (!checkoutUrl) {
      throw new Error(
        "Mercado Pago no devolvió el enlace de pago.",
      );
    }

    window.location.href =
      checkoutUrl;
  }

  async function seleccionarPlan(
    planId: PlanId,
  ) {
    setError("");
    setMensaje("");

    if (
      suscripcionActiva
    ) {
      if (
        planId ===
          planActual
      ) {
        setMensaje(
          "Este es tu plan actual.",
        );
      } else {
        setMensaje(
          "El cambio de plan todavía no está habilitado mientras tu suscripción está activa.",
        );
      }

      return;
    }

    const esRenovacion =
      (suscripcionActiva ||
        tuvoSuscripcion) &&
      planId ===
        planActual;

    setProcesandoPlan(
      planId,
    );

    try {
      await abrirCheckout(
        planId,
        esRenovacion
          ? "renovacion"
          : "alta",
      );
    } catch (
      paymentError
    ) {
      console.error(
        "Error al iniciar el pago:",
        paymentError,
      );

      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "No se pudo iniciar el pago.",
      );
    } finally {
      setProcesandoPlan(
        null,
      );
    }
  }

  async function renovarPlan() {
    setError("");
    setMensaje("");

    if (
      !suscripcionActiva &&
      !tuvoSuscripcion
    ) {
      setError(
        "Esta empresa todavía no tiene una suscripción para renovar.",
      );
      return;
    }

    setProcesandoRenovacion(
      true,
    );

    try {
      await abrirCheckout(
        planActual,
        "renovacion",
      );
    } catch (
      paymentError
    ) {
      console.error(
        "Error al iniciar la renovación:",
        paymentError,
      );

      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "No se pudo iniciar la renovación.",
      );
    } finally {
      setProcesandoRenovacion(
        false,
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6">
      <header className="mb-4">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Planes
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          Elegí tu versión de NDI AI
        </h1>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 dark:text-zinc-400">
          Todos los planes son pagos e incluyen la puesta en marcha de tu página más un mantenimiento mensual para mantener el servicio funcionando.
        </p>

        {!suscripcionActiva && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            Esta empresa todavía no tiene un plan activo. Al elegir uno vas a pagar la puesta en marcha + el primer mes mediante Mercado Pago.
          </div>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          {mensaje}
        </div>
      )}

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {PLANES.map(
          (plan) => {
            const esActual =
              suscripcionActiva &&
              plan.id ===
                planActual;

            const esUltimoPlan =
              !suscripcionActiva &&
              tuvoSuscripcion &&
              plan.id ===
                planActual;

            const precios =
              obtenerPrecioPlan(
                plan.id,
              );

            return (
              <article
                key={
                  plan.id
                }
                className={[
                  "relative flex flex-col rounded-2xl border bg-white p-4 text-slate-950 shadow-sm transition-colors dark:bg-zinc-900 dark:text-white",
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
                      "absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white",
                      plan.lanzamiento
                        ? "bg-violet-600"
                        : plan.destacado
                          ? "bg-blue-600"
                          : "bg-slate-700 dark:bg-zinc-700",
                    ].join(
                      " ",
                    )}
                  >
                    {
                      plan.etiqueta
                    }
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                      {
                        plan.nombre
                      }
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-zinc-400">
                      {
                        plan.descripcion
                      }
                    </p>
                  </div>

                  {esActual && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Plan actual
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                    Puesta en marcha
                  </p>

                  <p className="mt-0.5 text-2xl font-bold text-slate-950 dark:text-white">
                    {formatearPrecio(
                      precios.inicial,
                    )}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    +{" "}
                    {formatearPrecio(
                      precios.mensual,
                    )}
                    /mes
                  </p>

                  {plan.lanzamiento && (
                    <p className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-2 text-[10px] leading-4 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                      Conservás el precio mensual de lanzamiento mientras mantengas activa tu suscripción.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex-1 space-y-1.5">
                  {plan.funciones.map(
                    (
                      funcion,
                    ) => (
                      <div
                        key={
                          funcion
                        }
                        className="flex items-start gap-2 text-[11px] leading-4 text-slate-700 dark:text-zinc-300"
                      >
                        <span className="text-emerald-500">
                          ✓
                        </span>

                        <span>
                          {
                            funcion
                          }
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    esActual ||
                    procesandoPlan !==
                      null ||
                    procesandoRenovacion
                  }
                  onClick={() =>
                    seleccionarPlan(
                      plan.id,
                    )
                  }
                  className={[
                    "mt-4 w-full rounded-lg px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                    plan.destacado
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : plan.lanzamiento
                        ? "bg-violet-600 text-white hover:bg-violet-500"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800",
                  ].join(
                    " ",
                  )}
                >
                  {esActual
                    ? "Plan actual"
                    : procesandoPlan ===
                        plan.id
                      ? esUltimoPlan
                        ? "Abriendo renovación..."
                        : "Abriendo Mercado Pago..."
                      : esUltimoPlan
                        ? `Renovar por ${formatearPrecio(
                            precioRenovacion,
                          )}`
                        : "Elegir plan"}
                </button>
              </article>
            );
          },
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-slate-950 dark:text-white">
                Tu suscripción
              </p>

              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                <p>
                  Plan:{" "}
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {suscripcionActiva ||
                    tuvoSuscripcion
                      ? obtenerNombrePlan(
                          planActual,
                        )
                      : nombrePlanActual}
                  </span>
                </p>

                <p>
                  Mensualidad:{" "}
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {suscripcionActiva ||
                    tuvoSuscripcion
                      ? `${formatearPrecio(
                          precioRenovacion,
                        )}/mes`
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
                      {formatearFecha(
                        vencimiento,
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {(suscripcionActiva ||
              tuvoSuscripcion) && (
              <div className="shrink-0 sm:text-right">
                <button
                  type="button"
                  disabled={
                    procesandoRenovacion ||
                    procesandoPlan !==
                      null
                  }
                  onClick={
                    renovarPlan
                  }
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {procesandoRenovacion
                    ? "Abriendo Mercado Pago..."
                    : `Renovar por ${formatearPrecio(
                        precioRenovacion,
                      )}`}
                </button>

                {suscripcionActiva && (
                  <p className="mt-1 max-w-xs text-[10px] leading-4 text-slate-500 dark:text-zinc-500">
                    Si renovás antes del vencimiento, se suman 30 días sin perder los días que ya tenés pagos.
                  </p>
                )}
              </div>
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
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Volver a facturación
        </button>
      </div>
    </section>
  );
}