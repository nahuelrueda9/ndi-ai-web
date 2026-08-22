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
import {
  createPortal,
} from "react-dom";

type Habitacion = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  imagenes?: string[];
};

type Props = {
  habitacion: Habitacion;
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  puedeReservar?: boolean;
};

function precioARS(valor?: number) {
  const numero = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return `$${numero.toLocaleString("es-AR")}`;
}

function obtenerImagenes(habitacion: Habitacion) {
  const imagenes = Array.isArray(habitacion.imagenes)
    ? habitacion.imagenes
        .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
        .map((url) => url.trim())
        .slice(0, 3)
    : [];

  if (imagenes.length === 0 && habitacion.imagenUrl?.trim()) {
    imagenes.push(habitacion.imagenUrl.trim());
  }

  return imagenes;
}

export default function AlojamientoDetalle({
  habitacion,
  colorPrincipal,
  tema = "oscuro",
  puedeReservar = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [montado, setMontado] = useState(false);

  // Detección dinámica del tema claro u oscuro del documento
  const [esClaro, setEsClaro] = useState(tema === "claro");

  useEffect(() => {
    const root = document.documentElement;
    const actualizarTema = () => {
      setEsClaro(!root.classList.contains("dark") && (tema === "claro" || !root.classList.contains("dark")));
    };
    actualizarTema();
    
    const observer = new MutationObserver(actualizarTema);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [tema]);

  const claro = esClaro;
  const imagenes = useMemo(() => obtenerImagenes(habitacion), [habitacion]);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!abierto) return;

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAbierto(false);
    }

    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  function anterior() {
    if (imagenes.length <= 1) return;
    setImagenActiva((actual) => (actual === 0 ? imagenes.length - 1 : actual - 1));
  }

  function siguiente() {
    if (imagenes.length <= 1) return;
    setImagenActiva((actual) => (actual === imagenes.length - 1 ? 0 : actual + 1));
  }

  const modal = abierto ? (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0"
        onClick={() => setAbierto(false)}
      />

      <div
        className={`relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-[88vh] sm:rounded-3xl ${
          claro ? "border-slate-200 bg-white text-slate-950" : "border-zinc-800 bg-zinc-950 text-white"
        }`}
      >
        <div className={`flex items-center justify-between border-b px-4 py-3 sm:px-5 ${claro ? "border-slate-200" : "border-zinc-800"}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: colorPrincipal }}>
              Habitación
            </p>
            <p className="truncate text-sm font-bold sm:text-base">{habitacion.nombre}</p>
          </div>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              claro ? "border-slate-200 bg-white hover:bg-slate-100" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
            }`}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className={`border-b lg:border-b-0 lg:border-r ${claro ? "border-slate-200 bg-slate-50" : "border-zinc-800 bg-black"}`}>
              <div className="relative aspect-square overflow-hidden sm:aspect-[4/3] lg:min-h-[520px] lg:aspect-auto">
                {imagenes.length > 0 ? (
                  <img
                    src={imagenes[imagenActiva]}
                    alt={`${habitacion.nombre} - foto ${imagenActiva + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`flex h-full items-center justify-center px-6 text-center text-sm ${claro ? "text-slate-400" : "text-zinc-600"}`}>
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
                  </>
                )}

                {imagenes.length > 1 && (
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    {imagenActiva + 1}/{imagenes.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col p-4 sm:p-6 lg:p-7">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{habitacion.nombre}</h2>

                {Boolean(habitacion.precio) && (
                  <p className="mt-3 text-2xl font-black sm:text-3xl" style={{ color: colorPrincipal }}>
                    {precioARS(habitacion.precio)} <span className="text-xs font-medium opacity-70">/ noche</span>
                  </p>
                )}

                {habitacion.descripcion ? (
                  <div className="mt-5">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                      Descripción
                    </p>
                    <p className={`mt-2 whitespace-pre-line text-sm leading-6 sm:text-base sm:leading-7 ${claro ? "text-slate-600" : "text-zinc-300"}`}>
                      {habitacion.descripcion}
                    </p>
                  </div>
                ) : (
                  <p className={`mt-5 text-sm ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                    Consultá disponibilidad con el alojamiento.
                  </p>
                )}
              </div>

              <div className="mt-7 lg:mt-auto lg:pt-8">
                {puedeReservar ? (
                  <a
                    href="#reservar"
                    onClick={() => setAbierto(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                    style={{ backgroundColor: colorPrincipal }}
                  >
                    <Clock3 className="h-4 w-4" />
                    Reservar habitación
                  </a>
                ) : null}
              </div>
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
        className="inline-flex flex-1 items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
        style={{ backgroundColor: colorPrincipal }}
      >
        Ver habitación
      </button>

      {montado && modal && createPortal(modal, document.body)}
    </>
  );
}