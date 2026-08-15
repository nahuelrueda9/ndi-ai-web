"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
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

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  imagenes?: string[];
  talles?: string[];
  colores?: string[];
};

type Props = {
  producto: Producto;
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  mostrarWhatsApp?: boolean;
  whatsappUrl?: string;
  mostrarContacto?: boolean;
};

function precioARS(
  valor?: number,
) {
  const numero =
    typeof valor === "number" &&
    Number.isFinite(valor)
      ? valor
      : 0;

  return `$${numero.toLocaleString(
    "es-AR",
  )}`;
}

function obtenerImagenes(
  producto: Producto,
) {
  const imagenes =
    Array.isArray(
      producto.imagenes,
    )
      ? producto.imagenes
          .filter(
            (
              url,
            ): url is string =>
              typeof url ===
                "string" &&
              url.trim().length >
                0,
          )
          .map((url) =>
            url.trim(),
          )
          .slice(0, 3)
      : [];

  if (
    imagenes.length === 0 &&
    producto.imagenUrl?.trim()
  ) {
    imagenes.push(
      producto.imagenUrl.trim(),
    );
  }

  return imagenes;
}

export default function ProductoDetalleTienda({
  producto,
  colorPrincipal,
  tema = "oscuro",
  mostrarWhatsApp = false,
  whatsappUrl = "",
  mostrarContacto = false,
}: Props) {
  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    imagenActiva,
    setImagenActiva,
  ] = useState(0);

  const [
    talleSeleccionado,
    setTalleSeleccionado,
  ] = useState("");

  const [
    colorSeleccionado,
    setColorSeleccionado,
  ] = useState("");

  const [
    montado,
    setMontado,
  ] = useState(false);

  const claro =
    tema === "claro";

  const imagenes =
    useMemo(
      () =>
        obtenerImagenes(
          producto,
        ),
      [producto],
    );

  const talles =
    useMemo(
      () =>
        Array.isArray(
          producto.talles,
        )
          ? producto.talles
              .filter(
                (talle): talle is string =>
                  typeof talle === "string" &&
                  talle.trim().length > 0,
              )
              .map((talle) =>
                talle.trim(),
              )
              .slice(0, 20)
          : [],
      [producto.talles],
    );

  const colores =
    useMemo(
      () =>
        Array.isArray(
          producto.colores,
        )
          ? producto.colores
              .filter(
                (color): color is string =>
                  typeof color === "string" &&
                  color.trim().length > 0,
              )
              .map((color) =>
                color.trim(),
              )
              .slice(0, 20)
          : [],
      [producto.colores],
    );

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const previo =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function cerrarConEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape"
      ) {
        setAbierto(false);
      }
    }

    window.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    return () => {
      document.body.style.overflow =
        previo;

      window.removeEventListener(
        "keydown",
        cerrarConEscape,
      );
    };
  }, [abierto]);

  const detalleVariantes = [
    talleSeleccionado
      ? `Talle: ${talleSeleccionado}`
      : "",
    colorSeleccionado
      ? `Color: ${colorSeleccionado}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const mensaje =
    `Hola, me interesa "${producto.nombre}"${producto.precio ? ` (${precioARS(producto.precio)})` : ""}${detalleVariantes ? ` · ${detalleVariantes}` : ""}. ¿Está disponible?`;

  const enlaceWhatsApp =
    mostrarWhatsApp &&
    whatsappUrl
      ? `${whatsappUrl}?text=${encodeURIComponent(
          mensaje,
        )}`
      : "";

  function anterior() {
    if (
      imagenes.length <= 1
    ) {
      return;
    }

    setImagenActiva(
      (actual) =>
        actual === 0
          ? imagenes.length - 1
          : actual - 1,
    );
  }

  function siguiente() {
    if (
      imagenes.length <= 1
    ) {
      return;
    }

    setImagenActiva(
      (actual) =>
        actual ===
        imagenes.length - 1
          ? 0
          : actual + 1,
    );
  }

  const modal =
    abierto ? (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6">
        <button
          type="button"
          aria-label="Cerrar detalle"
          className="absolute inset-0"
          onClick={() =>
            setAbierto(false)
          }
        />

        <div
          className={`relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-[88vh] sm:rounded-3xl ${
            claro
              ? "border-slate-200 bg-white text-slate-950"
              : "border-zinc-800 bg-zinc-950 text-white"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 sm:px-5 ${
              claro
                ? "border-slate-200"
                : "border-zinc-800"
            }`}
          >
            <div className="min-w-0">
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  claro
                    ? "text-slate-400"
                    : "text-zinc-500"
                }`}
              >
                Producto
              </p>

              <p className="truncate text-sm font-bold sm:text-base">
                {producto.nombre}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setAbierto(false)
              }
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
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
                <div className="relative aspect-square overflow-hidden sm:aspect-[4/3] lg:min-h-[520px] lg:aspect-auto">
                  {imagenes.length >
                  0 ? (
                    <img
                      src={
                        imagenes[
                          imagenActiva
                        ]
                      }
                      alt={`${producto.nombre} - foto ${imagenActiva + 1}`}
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
                      Este producto todavía no tiene imágenes.
                    </div>
                  )}

                  {imagenes.length >
                    1 && (
                    <>
                      <button
                        type="button"
                        onClick={
                          anterior
                        }
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/75"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={
                          siguiente
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/75"
                        aria-label="Foto siguiente"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {imagenes.length >
                    1 && (
                    <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                      {imagenActiva + 1}/{imagenes.length}
                    </span>
                  )}
                </div>

                {imagenes.length >
                  1 && (
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
                            alt={`${producto.nombre} miniatura ${indice + 1}`}
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
                    {producto.nombre}
                  </h2>

                  {Boolean(
                    producto.precio,
                  ) && (
                    <p
                      className="mt-3 text-2xl font-black sm:text-3xl"
                      style={{
                        color:
                          colorPrincipal,
                      }}
                    >
                      {precioARS(
                        producto.precio,
                      )}
                    </p>
                  )}

                  {producto.descripcion ? (
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
                          producto.descripcion
                        }
                      </p>
                    </div>
                  ) : (
                    <p
                      className={`mt-5 text-sm ${
                        claro
                          ? "text-slate-400"
                          : "text-zinc-500"
                      }`}
                    >
                      Consultá disponibilidad con el negocio.
                    </p>
                  )}

                  {talles.length > 0 && (
                    <div className="mt-5">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          claro
                            ? "text-slate-400"
                            : "text-zinc-500"
                        }`}
                      >
                        Talles
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {talles.map(
                          (talle) => (
                            <button
                              key={talle}
                              type="button"
                              onClick={() =>
                                setTalleSeleccionado(
                                  talleSeleccionado === talle
                                    ? ""
                                    : talle,
                                )
                              }
                              className={`min-w-10 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                                talleSeleccionado === talle
                                  ? "text-white"
                                  : claro
                                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                              }`}
                              style={
                                talleSeleccionado === talle
                                  ? {
                                      backgroundColor:
                                        colorPrincipal,
                                      borderColor:
                                        colorPrincipal,
                                    }
                                  : undefined
                              }
                            >
                              {talle}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {colores.length > 0 && (
                    <div className="mt-5">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          claro
                            ? "text-slate-400"
                            : "text-zinc-500"
                        }`}
                      >
                        Colores
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {colores.map(
                          (color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() =>
                                setColorSeleccionado(
                                  colorSeleccionado === color
                                    ? ""
                                    : color,
                                )
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                                colorSeleccionado === color
                                  ? "text-white"
                                  : claro
                                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                              }`}
                              style={
                                colorSeleccionado === color
                                  ? {
                                      backgroundColor:
                                        colorPrincipal,
                                      borderColor:
                                        colorPrincipal,
                                    }
                                  : undefined
                              }
                            >
                              {color}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-7 lg:mt-auto lg:pt-8">
                  {enlaceWhatsApp ? (
                    <a
                      href={
                        enlaceWhatsApp
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      data-analytics-event="whatsapp_click"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Pedir por WhatsApp
                    </a>
                  ) : mostrarContacto ? (
                    <a
                      href="#contacto"
                      onClick={() =>
                        setAbierto(false)
                      }
                      className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
                      style={{
                        backgroundColor:
                          colorPrincipal,
                      }}
                    >
                      Consultar producto
                    </a>
                  ) : null}

                  <p
                    className={`mt-3 text-center text-[11px] leading-5 ${
                      claro
                        ? "text-slate-400"
                        : "text-zinc-600"
                    }`}
                  >
                    Consultá stock y disponibilidad antes de coordinar la compra.
                  </p>
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
          setTalleSeleccionado("");
          setColorSeleccionado("");
          setAbierto(true);
        }}
        className={`inline-flex flex-1 items-center justify-center rounded-lg border px-2 py-2 text-xs font-semibold transition sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${
          claro
            ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900"
        }`}
      >
        Ver producto
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