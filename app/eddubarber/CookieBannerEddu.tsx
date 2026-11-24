"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "ndi_cookies_eddu_barber_aceptadas";

export default function CookieBannerEddu() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (!guardado) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function guardarPreferencia(estado: "aceptadas" | "esenciales") {
    try {
      window.localStorage.setItem(STORAGE_KEY, estado);
    } catch {
      // Si el navegador bloquea localStorage, igual cerramos el banner en la sesión actual
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 text-zinc-100 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-[#ED192D]">
          <Cookie className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-white">
            Cookies y privacidad
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Usamos cookies necesarias para el funcionamiento del sitio y métricas anónimas de uso.
            Podés consultar más detalles en nuestros{" "}
            <Link
              href="/eddubarber/terminos"
              className="font-medium text-zinc-200 underline transition hover:text-[#ED192D]"
            >
              Términos y Condiciones
            </Link>
            .
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => guardarPreferencia("esenciales")}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-white active:scale-95"
            >
              Solo esenciales
            </button>
            <button
              type="button"
              onClick={() => guardarPreferencia("aceptadas")}
              className="rounded-xl bg-[#ED192D] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
            >
              Aceptar cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}