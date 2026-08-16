"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  habitacion: {
    id: string;
    nombre: string;
    descripcion?: string;
    precio?: number;
    imagenUrl?: string;
    imagenes?: string[];
  };
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  puedeReservar?: boolean;
};

function obtenerImagenes(
  habitacion: Props["habitacion"],
) {
  const imagenes = Array.isArray(
    habitacion.imagenes,
  )
    ? habitacion.imagenes
        .filter(
          (url): url is string =>
            typeof url === "string" &&
            url.trim().length > 0,
        )
        .map((url) => url.trim())
        .slice(0, 3)
    : [];

  if (
    imagenes.length === 0 &&
    habitacion.imagenUrl?.trim()
  ) {
    imagenes.push(
      habitacion.imagenUrl.trim(),
    );
  }

  return imagenes;
}

export default function AlojamientoDetalle({
  habitacion,
  colorPrincipal,
  tema = "oscuro",
  puedeReservar = false,
}: Props) {
  const [abierto, setAbierto] =
    useState(false);
  const [
    imagenActiva,
    setImagenActiva,
  ] = useState(0);
  const [montado, setMontado] =
    useState(false);

  const claro = tema === "claro";

  const imagenes = useMemo(
    () =>
      obtenerImagenes(
        habitacion,
      ),
    [habitacion],
  );

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function cerrarEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    }

    window.addEventListener(
      "keydown",
      cerrarEscape,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        cerrarEscape,
      );
    };
  }, [abierto]);

  function anterior() {
    if (imagenes.length <= 1) {
      return;
    }

    setImagenActiva((actual) =>
      actual === 0
        ? imagenes.length - 1
        : actual - 1,
    );
  }

  function siguiente() {
    if (imagenes.length <= 1) {
      return;
    }

    setImagenActiva((actual) =>
      actual === imagenes.length - 1
        ? 0
        : actual + 1,
    );
  }

  const modal =
    abierto ? (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6">
        <button
          type="button"
          aria-label="Cerrar detalle de habitación"
          className="absolute inset-0"
          onClick={() =>
            setAbierto(false)
          }
        />

        <div
          className={`relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-[90vh] sm:rounded-3xl ${
            claro
              ? "border-slate-200 bg-white text-slate-950"
              : "border-zinc-800 bg-zinc-950 text-white"
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
              claro
                ? "border-slate-200"
                : "border-zinc-800"
            }`}
          >
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  color:
                    colorPrincipal,
                }}
              >
                Habitación
              </p>

              <p className="truncate text-sm font-bold sm:text-base">
                {habitacion.nombre}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setAbierto(false)
              }
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                claro
                  ? "border-slate-200 bg-white hover:bg-slate-100"
                  : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
              }`}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              <div
                className={`border-b lg:border-b-0 lg:border-r ${
                  claro
                    ? "border-slate-200 bg-slate-50"
                    : "border-zinc-800 bg-black"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10] lg:min-h-[480px] lg:aspect-auto">
                  {imagenes.length > 0 ? (
                    <img
                      src={
                        imagenes[
                          imagenActiva
                        ]
                      }
                      alt={`${habitacion.nombre} - foto ${imagenActiva + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center px-6 text-center text-sm ${
                        claro
                          ? "text-slate-400"
                          : "text-zinc-600"
                      }`}
                    >
                      Esta habitación todavía no tiene imágenes.
                    </div>
                  )}

                  {imagenes.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={anterior}
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/75"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={siguiente}
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/75"
                        aria-label="Foto siguiente"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>

                      <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {imagenActiva + 1}/{imagenes.length}
                      </span>
                    </>
                  )}
                </div>

                {imagenes.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 p-3 sm:p-4">
                    {imagenes.map(
                      (
                        url,
                        indice,
                      ) => (
                        <button
                          key={`${url}-${indice}`}
                          type="button"
                          onClick={() =>
                            setImagenActiva(
                              indice,
                            )
                          }
                          className={`aspect-[4/3] overflow-hidden rounded-xl border-2 transition ${
                            imagenActiva ===
                            indice
                              ? "opacity-100"
                              : "opacity-60 hover:opacity-100"
                          }`}
                          style={{
                            borderColor:
                              imagenActiva ===
                              indice
                                ? colorPrincipal
                                : "transparent",
                          }}
                        >
                          <img
                            src={url}
                            alt={`${habitacion.nombre} miniatura ${indice + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col p-4 sm:p-6 lg:p-7">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {habitacion.nombre}
                  </h2>

                  {Boolean(
                    habitacion.precio,
                  ) && (
                    <p
                      className="mt-3 text-2xl font-black sm:text-3xl"
                      style={{
                        color:
                          colorPrincipal,
                      }}
                    >
                      $
                      {Number(
                        habitacion.precio,
                      ).toLocaleString(
                        "es-AR",
                      )}
                      <span
                        className={`ml-1 text-sm font-medium ${
                          claro
                            ? "text-slate-500"
                            : "text-zinc-400"
                        }`}
                      >
                        / noche
                      </span>
                    </p>
                  )}

                  {habitacion.descripcion && (
                    <div className="mt-5">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          claro
                            ? "text-slate-400"
                            : "text-zinc-500"
                        }`}
                      >
                        Descripción
                      </p>

                      <p
                        className={`mt-2 whitespace-pre-line text-sm leading-6 sm:text-base sm:leading-7 ${
                          claro
                            ? "text-slate-600"
                            : "text-zinc-300"
                        }`}
                      >
                        {
                          habitacion.descripcion
                        }
                      </p>
                    </div>
                  )}
                </div>

                {puedeReservar && (
                  <div className="mt-7 lg:mt-auto lg:pt-8">
                    <a
                      href="#reservar"
                      onClick={() =>
                        setAbierto(false)
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                      style={{
                        backgroundColor:
                          colorPrincipal,
                      }}
                    >
                      <Clock3 className="h-4 w-4" />
                      Reservar habitación
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setImagenActiva(0);
          setAbierto(true);
        }}
        className={`inline-flex flex-1 items-center justify-center rounded-lg border px-2 py-2 text-xs font-semibold transition hover:-translate-y-0.5 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${
          claro
            ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900"
        }`}
        style={{
          borderColor:
            `${colorPrincipal}55`,
        }}
      >
        Ver habitación
      </button>

      {montado &&
        modal &&
        createPortal(
          modal,
          document.body,
        )}
    </>
  );
}