"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
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

type PlanId =
  | "free"
  | "pro"
  | "business";

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
};

function obtenerMesActualArgentina() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio =
    partes.find((parte) => parte.type === "year")?.value ?? "";

  const mes =
    partes.find((parte) => parte.type === "month")?.value ?? "";

  return `${anio}-${mes}`;
}

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

const LIMITES: Record<
  PlanId,
  number
> = {
  free: 50,
  pro: 1000,
  business: 10000,
};

const LIMITES_RESPUESTAS_IA: Record<
  PlanId,
  number
> = {
  free: 250,
  pro: 5000,
  business: 20000,
};

const NOMBRES: Record<
  PlanId,
  string
> = {
  free: "Free",
  pro: "Pro",
  business: "Empresa",
};

export default function FacturacionPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa
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

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

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
              "No se encontró la empresa."
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
                empresaIdSeguro
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe."
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
                `/empresas/${empresaIdSeguro}/conversaciones`
              );
              return;
            }

            setEmpresa(datosEmpresa);
            setAccesoVerificado(true);
          } catch (firebaseError) {
            console.error(
              "Error al verificar el acceso a facturación:",
              firebaseError
            );

            router.replace("/empresas");
          }
        }
      );

    return () => cancelarAuth();
  }, [empresaId, router]);

  useEffect(() => {
    if (
      !empresaId ||
      !accesoVerificado
    ) {
      return;
    }

    const empresaReferencia = doc(
      db,
      "companies",
      empresaId
    );

    const cancelar = onSnapshot(
      empresaReferencia,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError(
            "La empresa no existe."
          );
          setCargando(false);
          return;
        }

        setEmpresa(
          snapshot.data() as EmpresaFacturacion
        );

        setError("");
        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar facturación:",
          firebaseError
        );

        setError(
          firebaseError.code ===
            "permission-denied"
            ? "No tenés permisos para ver la facturación."
            : "No se pudo cargar la información de facturación."
        );

        setCargando(false);
      }
    );

    return () => cancelar();
  }, [
    accesoVerificado,
    empresaId,
  ]);

  const planGuardado: PlanId =
    empresa?.plan === "pro" ||
    empresa?.plan === "business"
      ? empresa.plan
      : "free";

  const fechaVencimiento =
    convertirFecha(
      empresa?.subscriptionEndsAt
    );

  const plan: PlanId =
    planGuardado === "business"
      ? "business"
      : planGuardado === "pro" &&
          fechaVencimiento !== null &&
          fechaVencimiento.getTime() >
            Date.now()
        ? "pro"
        : "free";

  const limite =
    LIMITES[plan];

  const mesActual =
    obtenerMesActualArgentina();

  const usadas =
    empresa?.conversationsUsageMonth ===
    mesActual
      ? Math.max(
          0,
          empresa?.conversationsThisMonth || 0
        )
      : 0;

  const restantes = Math.max(
    0,
    limite - usadas
  );

  const limiteRespuestasIA =
    LIMITES_RESPUESTAS_IA[plan];

  const respuestasIAUsadas =
    empresa?.aiResponsesUsageMonth ===
    mesActual
      ? Math.max(
          0,
          empresa?.aiResponsesThisMonth || 0
        )
      : 0;

  const respuestasIARestantes =
    Math.max(
      0,
      limiteRespuestasIA -
        respuestasIAUsadas
    );

  const porcentajeIA = useMemo(() => {
    if (limiteRespuestasIA <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (
          respuestasIAUsadas /
          limiteRespuestasIA
        ) * 100
      )
    );
  }, [
    limiteRespuestasIA,
    respuestasIAUsadas,
  ]);

  const porcentaje = useMemo(() => {
    if (limite <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (usadas / limite) * 100
      )
    );
  }, [limite, usadas]);

  const estado =
    planGuardado === "pro" &&
    plan === "free"
      ? "expired"
      : plan === "free"
        ? "free"
        : empresa?.subscriptionStatus ||
          "active";

  if (cargando) {
    return (
      <main className="mx-auto max-w-7xl p-6 text-slate-950 dark:text-white">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
            Verificando acceso y
            cargando facturación...
          </p>
        </div>
      </main>
    );
  }

  if (error || !empresaId) {
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

  return (
    <main className="mx-auto max-w-7xl p-6 text-slate-950 dark:text-white">
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {empresa.nombre ||
          empresa.name ||
          "Empresa"}
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
        Facturación
      </h1>

      <p className="mt-2 text-slate-600 dark:text-zinc-400">
        Administrá tu suscripción y
        revisá el consumo mensual.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card
          titulo="Plan actual"
          valor={NOMBRES[plan]}
          descripcion={
            plan === "free"
              ? "Sin próximo cobro"
              : plan === "pro"
                ? "$14.999 por 30 días"
                : "Plan personalizado"
          }
        />

        <Card
          titulo="Estado"
          valor={
            estado === "active"
              ? "Activo"
              : estado
          }
          descripcion="Suscripción de NDI AI"
          estado
        />

        <Card
          titulo="Conversaciones"
          valor={`${usadas.toLocaleString(
            "es-AR"
          )} / ${limite.toLocaleString(
            "es-AR"
          )}`}
          descripcion={`${restantes.toLocaleString(
            "es-AR"
          )} disponibles`}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Uso del plan
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
              {restantes > 0
                ? `Te quedan ${restantes.toLocaleString(
                    "es-AR"
                  )} conversaciones.`
                : "Alcanzaste el límite mensual."}
            </p>
          </div>

          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
            {porcentaje}% utilizado
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

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Respuestas de IA
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
              {respuestasIARestantes > 0
                ? `Te quedan ${respuestasIARestantes.toLocaleString(
                    "es-AR"
                  )} respuestas IA este mes.`
                : "Alcanzaste el límite mensual de respuestas IA."}
            </p>
          </div>

          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
            {respuestasIAUsadas.toLocaleString(
              "es-AR"
            )} /{" "}
            {limiteRespuestasIA.toLocaleString(
              "es-AR"
            )}
          </span>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
          <div
            className={
              porcentajeIA >= 100
                ? "h-full rounded-full bg-red-500"
                : porcentajeIA >= 80
                  ? "h-full rounded-full bg-amber-500"
                  : "h-full rounded-full bg-violet-500"
            }
            style={{
              width: `${porcentajeIA}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-zinc-700 dark:text-zinc-500">
            Todavía no hay pagos
            registrados.
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/empresas/${empresaId}/planes`}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Cambiar plan
        </Link>

        <Link
          href={`/empresas/${empresaId}/dashboard`}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Volver al dashboard
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
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  estado?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-slate-600 dark:text-zinc-400">
        {titulo}
      </p>

      <h2
        className={`mt-2 text-2xl font-bold text-slate-950 dark:text-white ${
          estado
            ? "text-emerald-600 dark:text-emerald-400"
            : ""
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