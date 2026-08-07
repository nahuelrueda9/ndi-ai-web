"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";

import { db } from "@/lib/firebase";

type PlanId = "free" | "pro" | "business";

type EmpresaPlan = {
  plan?: PlanId;
  conversationsThisMonth?: number;
  subscriptionStatus?: string;
};

const LIMITES: Record<PlanId, number> = {
  free: 50,
  pro: 1000,
  business: 10000,
};

export default function PlanUsageCard() {
  const params = useParams();
  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [datos, setDatos] = useState<EmpresaPlan | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      setCargando(false);
      return;
    }

    const cancelar = onSnapshot(
      doc(db, "companies", empresaId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("La empresa no existe.");
          setCargando(false);
          return;
        }

        setDatos(snapshot.data() as EmpresaPlan);
        setError("");
        setCargando(false);
      },
      (firebaseError) => {
        console.error("Error cargando el plan:", firebaseError);
        setError("No se pudo cargar el consumo del plan.");
        setCargando(false);
      }
    );

    return () => cancelar();
  }, [empresaId]);

  const plan: PlanId =
    datos?.plan === "pro" || datos?.plan === "business"
      ? datos.plan
      : "free";

  const limite = LIMITES[plan];
  const usadas = Math.max(0, datos?.conversationsThisMonth || 0);
  const restantes = Math.max(0, limite - usadas);

  const porcentaje = useMemo(() => {
    if (limite <= 0) return 0;
    return Math.min(100, Math.round((usadas / limite) * 100));
  }, [usadas, limite]);

  if (cargando) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="mt-4 h-8 w-20 animate-pulse rounded bg-zinc-800" />
        <div className="mt-6 h-3 w-full animate-pulse rounded-full bg-zinc-800" />
      </section>
    );
  }

  if (error || !empresaId) {
    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
        <p className="text-sm text-red-300">
          {error || "No se pudo cargar el plan."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Plan actual
          </p>

          <h2 className="mt-2 text-2xl font-bold capitalize text-white">
            {plan}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Estado:{" "}
            <span className="text-emerald-400">
              {datos?.subscriptionStatus || "active"}
            </span>
          </p>
        </div>

        <Link
          href={`/empresas/${empresaId}/planes`}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Mejorar plan
        </Link>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-zinc-400">
            Conversaciones del mes
          </span>

          <span className="font-medium text-white">
            {usadas.toLocaleString("es-AR")} /{" "}
            {limite.toLocaleString("es-AR")}
          </span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={[
              "h-full rounded-full transition-all",
              porcentaje >= 100
                ? "bg-red-500"
                : porcentaje >= 80
                  ? "bg-amber-500"
                  : "bg-blue-500",
            ].join(" ")}
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-zinc-500">
            {restantes > 0
              ? `Te quedan ${restantes.toLocaleString("es-AR")} conversaciones.`
              : "Alcanzaste el límite mensual."}
          </span>

          <span className="font-medium text-zinc-400">
            {porcentaje}% utilizado
          </span>
        </div>
      </div>

      {restantes === 0 && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-300">
            Alcanzaste el límite de tu plan.
          </p>

          <Link
            href={`/empresas/${empresaId}/planes`}
            className="mt-2 inline-flex text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Actualizar a un plan superior →
          </Link>
        </div>
      )}
    </section>
  );
}