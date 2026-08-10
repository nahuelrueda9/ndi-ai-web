"use client";

import {
  Check,
  Copy,
  QrCode,
  Share2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Props = {
  nombre: string;
};

export default function CompartirPagina({
  nombre,
}: Props) {
  const [url, setUrl] =
    useState("");
  const [abierto, setAbierto] =
    useState(false);
  const [copiado, setCopiado] =
    useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const qrUrl = useMemo(() => {
    if (!url) {
      return "";
    }

    return (
      "https://api.qrserver.com/v1/create-qr-code/" +
      `?size=280x280&margin=12&data=${encodeURIComponent(url)}`
    );
  }, [url]);

  async function copiarEnlace() {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        url,
      );

      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 1800);
    } catch {
      window.prompt(
        "Copiá este enlace:",
        url,
      );
    }
  }

  async function compartir() {
    if (!url) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: nombre,
          text: `Mirá la página de ${nombre}`,
          url,
        });

        return;
      } catch {
        return;
      }
    }

    await copiarEnlace();
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={compartir}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </button>

        <button
          type="button"
          onClick={() =>
            setAbierto(true)
          }
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <QrCode className="h-4 w-4" />
          Ver QR
        </button>
      </div>

      {abierto && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() =>
            setAbierto(false)
          }
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Compartir negocio
                </p>

                <h3 className="mt-1 text-xl font-bold text-white">
                  Código QR
                </h3>

                <p className="mt-1 text-sm text-zinc-400">
                  Escanealo para abrir la
                  página de {nombre}.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAbierto(false)
                }
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-white p-4">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`Código QR de ${nombre}`}
                  className="mx-auto aspect-square w-full max-w-[280px]"
                />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-xl bg-zinc-200" />
              )}
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="truncate text-xs text-zinc-400">
                {url || "Cargando enlace..."}
              </p>
            </div>

            <button
              type="button"
              onClick={copiarEnlace}
              disabled={!url}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4" />
                  Enlace copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar enlace
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}