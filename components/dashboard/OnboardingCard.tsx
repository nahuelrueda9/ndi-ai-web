"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  X,
  Image as ImageIcon,
  Package,
  Share2,
} from "lucide-react";

export default function OnboardingCard({ empresaId }: { empresaId: string }) {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const cerrado = localStorage.getItem(`onboarding_cerrado_${empresaId}`);
    if (!cerrado) {
      setMostrar(true);
    }
  }, [empresaId]);

  const cerrarGuia = () => {
    localStorage.setItem(`onboarding_cerrado_${empresaId}`, "true");
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-white p-5 shadow-sm transition-colors dark:border-blue-500/20 dark:bg-gradient-to-br dark:from-blue-600/10 dark:via-zinc-900 dark:to-zinc-950 sm:p-6">
      <button
        type="button"
        onClick={cerrarGuia}
        className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        title="Ocultar guía"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Sparkles className="h-5 w-5" />
        <p className="text-xs font-bold uppercase tracking-wider">
          ¡Bienvenido a NDI AI!
        </p>
      </div>

      <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
        3 pasos para dejar tu página lista para vender:
      </h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {/* Paso 1: Identidad */}
        <Link
          href={`/empresas/${empresaId}/informacion`}
          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-500/40 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-blue-500/50 dark:hover:bg-zinc-900"
        >
          <div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <ImageIcon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
              1. Identidad
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
              Subí tu logo, portada y datos de contacto.
            </p>
          </div>
          <span className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            Completar <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        {/* Paso 2: Catálogo / Servicios */}
        <Link
          href={`/empresas/${empresaId}/servicios`}
          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-emerald-500/40 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-blue-500/50 dark:hover:bg-zinc-900"
        >
          <div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Package className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
              2. Catálogo / Servicios
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
              Cargá tus primeros productos o servicios y precios.
            </p>
          </div>
          <span className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Cargar <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        {/* Paso 3: Publicar y compartir */}
        <Link
          href={`/empresas/${empresaId}/mi-pagina`}
          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-violet-500/40 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-blue-500/50 dark:hover:bg-zinc-900"
        >
          <div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <Share2 className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
              3. Publicar y compartir
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
              Copiá el enlace para ponerlo en tu biografía de redes.
            </p>
          </div>
          <span className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
            Ver enlace <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>
    </div>
  );
}