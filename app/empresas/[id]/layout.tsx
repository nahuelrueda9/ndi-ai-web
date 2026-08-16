"use client";

import type { ReactNode } from "react";
import {
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  usePathname,
  useRouter,
} from "next/navigation";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import {
  empresaTieneFuncion,
  empresaTieneSuscripcionActiva,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  type PlanFeature,
} from "@/lib/plans/planAccess";
import { auth, db } from "@/lib/firebase";

type EmpresaLayoutProps = {
  children: ReactNode;
};

type EmpresaAcceso = {
  nombre?: string;
  userId?: string;
  plan?: "free" | "pro" | "business";
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  subscriptionMonthlyPrice?: number;
};

type ReglaRuta = {
  funcion?: PlanFeature;
  nombre: string;
};

const RUTAS_SIEMPRE_PERMITIDAS = new Set([
  "planes",
  "facturacion",
  "ayuda",
]);

const REGLAS_RUTA: Record<
  string,
  ReglaRuta
> = {
  dashboard: {
    nombre: "Inicio",
  },
  catalogo: {
    funcion: "pagina_publica",
    nombre: "Servicios y productos",
  },
  agenda: {
    funcion: "turnos",
    nombre: "Agenda",
  },
  presupuestos: {
    funcion: "presupuestos",
    nombre: "Presupuestos",
  },
  pedidos: {
    funcion: "productos",
    nombre: "Pedidos",
  },
  conversaciones: {
    funcion: "asistente_ia",
    nombre: "Consultas",
  },
  consultas: {
    funcion: "asistente_ia",
    nombre: "Consultas",
  },
  estadisticas: {
    funcion: "estadisticas_basicas",
    nombre: "Estadísticas",
  },
  conocimiento: {
    funcion: "asistente_ia",
    nombre: "Base de conocimiento",
  },
  configuracion: {
    funcion: "asistente_ia",
    nombre: "Asistente IA",
  },
  probar: {
    funcion: "asistente_ia",
    nombre: "Asistente IA",
  },
  widget: {
    funcion: "asistente_ia",
    nombre: "Widget web",
  },
  notificaciones: {
    nombre: "Notificaciones",
  },
  integraciones: {
    nombre: "Integraciones",
  },
  proximamente: {
    nombre: "Próximamente",
  },
};

function obtenerSegmentoEmpresa(
  pathname: string,
  empresaId: string,
) {
  const prefijo =
    `/empresas/${empresaId}`;

  if (!pathname.startsWith(prefijo)) {
    return "";
  }

  const resto = pathname
    .slice(prefijo.length)
    .replace(/^\/+/, "");

  return resto.split("/")[0] || "";
}

export default function EmpresaLayout({
  children,
}: EmpresaLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
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

  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [empresa, setEmpresa] =
    useState<EmpresaAcceso | null>(
      null,
    );

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [, setRelojSuscripcion] =
    useState(0);

  /*
   * El paso del tiempo no modifica Firestore por sí solo.
   * Este reloj fuerza una reevaluación periódica de
   * subscriptionEndsAt para bloquear el panel al vencer.
   */
  useEffect(() => {
    const intervalo =
      window.setInterval(
        () => {
          setRelojSuscripcion(
            (valor) =>
              valor + 1,
          );
        },
        30_000,
      );

    return () =>
      window.clearInterval(
        intervalo,
      );
  }, []);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (usuarioActual) => {
          if (!usuarioActual) {
            router.replace("/login");
            return;
          }

          setUsuario(usuarioActual);
        },
      );

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!usuario || !empresaId) {
      return;
    }

    const empresaIdSeguro =
      empresaId;

    setCargando(true);
    setError("");

    const empresaRef =
      doc(
        db,
        "companies",
        empresaIdSeguro,
      );

    /*
     * Escuchamos cambios en tiempo real para que una
     * activación o renovación procesada por el webhook
     * desbloquee el panel sin recargar manualmente.
     */
    const unsubscribeEmpresa =
      onSnapshot(
        empresaRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setEmpresa(null);
            setError(
              "La empresa no existe o ya fue eliminada.",
            );
            setCargando(false);
            return;
          }

          setEmpresa(
            snapshot.data() as EmpresaAcceso,
          );
          setError("");
          setCargando(false);
        },
        (firebaseError) => {
          console.error(
            "Error al validar acceso al negocio:",
            firebaseError,
          );

          setEmpresa(null);
          setError(
            firebaseError.code ===
              "permission-denied"
              ? "No tenés acceso a esta empresa."
              : "No se pudo validar el acceso a esta empresa.",
          );
          setCargando(false);
        },
      );

    return () =>
      unsubscribeEmpresa();
  }, [empresaId, usuario]);

  const segmento =
    useMemo(
      () =>
        empresaId
          ? obtenerSegmentoEmpresa(
              pathname,
              empresaId,
            )
          : "",
      [empresaId, pathname],
    );

  const esRutaSiemprePermitida =
    RUTAS_SIEMPRE_PERMITIDAS.has(
      segmento,
    );

  const suscripcionActiva =
    empresa
      ? empresaTieneSuscripcionActiva(
          empresa,
        )
      : false;

  const planEfectivo =
    empresa
      ? obtenerPlanEfectivo(
          empresa,
        )
      : "free";

  const nombrePlan =
    suscripcionActiva
      ? obtenerNombrePlan(
          planEfectivo,
        )
      : "Sin plan activo";

  const reglaRuta =
    segmento === ""
      ? {
          funcion:
            "pagina_publica" as PlanFeature,
          nombre: "Mi página",
        }
      : REGLAS_RUTA[segmento] ?? {
          nombre: "Esta sección",
        };

  const funcionPermitida =
    !reglaRuta.funcion ||
    (empresa
      ? empresaTieneFuncion(
          empresa,
          reglaRuta.funcion,
        )
      : false);

  const puedeVerContenido =
    esRutaSiemprePermitida ||
    (
      suscripcionActiva &&
      funcionPermitida
    );

  const esPropietario =
    Boolean(
      usuario &&
        empresa?.userId ===
          usuario.uid,
    );

  if (cargando) {
    return (
      <DashboardLayout>
        <section className="flex min-h-[55vh] items-center justify-center px-3 py-5 sm:min-h-[70vh] sm:px-5 sm:py-10">
          <Card className="w-full max-w-xs p-4 text-center sm:max-w-sm sm:p-6">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500 sm:mb-4 sm:h-8 sm:w-8" />

            <p className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
              Validando tu acceso...
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
              Estamos revisando el plan de este negocio.
            </p>
          </Card>
        </section>
      </DashboardLayout>
    );
  }

  if (error || !empresa) {
    return (
      <DashboardLayout>
        <section className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-8 sm:py-10">
          <Card className="p-4 text-center sm:p-7">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 sm:h-12 sm:w-12 sm:rounded-2xl">
              <ShieldCheck className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>

            <h1 className="mt-3 text-base font-bold text-slate-950 dark:text-white sm:mt-5 sm:text-xl">
              No se pudo abrir este negocio
            </h1>

            <p className="mx-auto mt-1 max-w-lg text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
              {error ||
                "No tenés acceso a esta empresa."}
            </p>

            <Button
              type="button"
              className="mt-3 sm:mt-6"
              onClick={() =>
                router.push("/empresas")
              }
            >
              Volver a empresas
            </Button>
          </Card>
        </section>
      </DashboardLayout>
    );
  }

  if (!puedeVerContenido) {
    const sinPlan =
      !suscripcionActiva;

    return (
      <DashboardLayout>
        <section className="mx-auto flex min-h-[58vh] w-full max-w-4xl items-center justify-center px-3 py-5 sm:min-h-[72vh] sm:px-8 sm:py-10">
          <Card className="w-full overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:h-12 sm:w-12 sm:rounded-2xl">
                <LockKeyhole className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>

              <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400 sm:mt-5 sm:text-xs sm:tracking-[0.16em]">
                {nombrePlan}
              </p>

              <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-2xl">
                {sinPlan
                  ? "Primero activá un plan"
                  : `${reglaRuta.nombre} no está incluido en tu plan`}
              </h1>

              <p className="mt-1.5 max-w-2xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
                {sinPlan
                  ? "La empresa ya fue creada, pero sus funciones todavía están bloqueadas. Elegí Página Simple, Página Completa o Business IA para comenzar a utilizar NDI AI."
                  : `Tu plan actual es ${nombrePlan}. Para usar ${reglaRuta.nombre}, necesitás un plan que incluya esta función.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 sm:flex sm:gap-3 sm:p-7">
              {esPropietario ? (
                <Button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/planes`,
                    )
                  }
                >
                  {sinPlan
                    ? "Elegir plan"
                    : "Ver planes"}
                </Button>
              ) : (
                <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 sm:col-span-1 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm sm:leading-normal">
                  El propietario del negocio debe activar o cambiar el plan.
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/ayuda`,
                  )
                }
              >
                Ir a Ayuda
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  router.push("/empresas")
                }
              >
                Volver a empresas
              </Button>
            </div>
          </Card>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}