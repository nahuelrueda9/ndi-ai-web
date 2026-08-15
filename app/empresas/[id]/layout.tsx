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
        <section className="flex min-h-[70vh] items-center justify-center px-5 py-10">
          <Card className="w-full max-w-sm p-6 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

            <p className="font-semibold text-slate-950 dark:text-white">
              Validando tu acceso...
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
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
        <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
          <Card className="p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
              No se pudo abrir este negocio
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-zinc-400">
              {error ||
                "No tenés acceso a esta empresa."}
            </p>

            <Button
              type="button"
              className="mt-6"
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
        <section className="mx-auto flex min-h-[72vh] w-full max-w-4xl items-center justify-center px-5 py-10 sm:px-8">
          <Card className="w-full overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 p-7 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <LockKeyhole className="h-6 w-6" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                {nombrePlan}
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {sinPlan
                  ? "Primero activá un plan"
                  : `${reglaRuta.nombre} no está incluido en tu plan`}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                {sinPlan
                  ? "La empresa ya fue creada, pero sus funciones todavía están bloqueadas. Elegí Página Simple, Página Completa o Business IA para comenzar a utilizar NDI AI."
                  : `Tu plan actual es ${nombrePlan}. Para usar ${reglaRuta.nombre}, necesitás un plan que incluya esta función.`}
              </p>
            </div>

            <div className="flex flex-col gap-3 p-7 sm:flex-row">
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
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
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