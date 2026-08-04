"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function FacturacionPage() {
  const params = useParams();
  const empresaId = String(params.id ?? params.empresaId ?? "");

  return (
    <main className="mx-auto max-w-7xl p-6 text-white">
      <h1 className="text-3xl font-bold">Facturación</h1>
      <p className="mt-2 text-zinc-400">
        Administrá tu suscripción de NDI AI.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Plan actual</p>
          <h2 className="mt-2 text-2xl font-bold">Free</h2>
          <p className="mt-4 text-sm text-zinc-500">
            Próximo cobro: —
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Estado</p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-400">
            Activo
          </h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Conversaciones</p>
          <h2 className="mt-2 text-2xl font-bold">0 / 100</h2>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold">
          Historial de pagos
        </h2>

        <div className="mt-6 rounded-xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
          Todavía no hay pagos registrados.
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/empresas/${empresaId}/planes`}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold"
        >
          Cambiar plan
        </Link>

        <button
          className="rounded-xl border border-red-500 px-6 py-3 text-red-400"
        >
          Cancelar suscripción
        </button>
      </div>
    </main>
  );
}