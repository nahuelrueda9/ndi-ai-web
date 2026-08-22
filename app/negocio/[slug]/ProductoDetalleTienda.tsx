"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Mail,
  Minus,
  Plus,
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

type VarianteProducto = {
  talle: string;
  color: string;
  stock: number;
};

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  imagenes?: string[];
  talles?: string[];
  colores?: string[];
  variantes?: VarianteProducto[];
  stockGeneral?: number;
  stockTotal?: number;
};

type Props = {
  producto: Producto;
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  mostrarWhatsApp?: boolean;
  whatsappUrl?: string;
  mostrarContacto?: boolean;
  pedidosHabilitados?: boolean;
  onAgregarAlCarrito?: (seleccion: { cantidad: number; talle: string; color: string; stock: number }) => void;
};

function precioARS(valor?: number) {
  const numero = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return `$${numero.toLocaleString("es-AR")}`;
}

function obtenerImagenes(producto: Producto) {
  const imagenes = Array.isArray(producto.imagenes)
    ? producto.imagenes
        .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
        .map((url) => url.trim())
        .slice(0, 3)
    : [];

  if (imagenes.length === 0 && producto.imagenUrl?.trim()) {
    imagenes.push(producto.imagenUrl.trim());
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
  pedidosHabilitados = false,
  onAgregarAlCarrito,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [talleSeleccionado, setTalleSeleccionado] = useState("");
  const [colorSeleccionado, setColorSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [montado, setMontado] = useState(false);

  const claro = tema === "claro";
  const imagenes = useMemo(() => obtenerImagenes(producto), [producto]);

  const talles = useMemo(
    () =>
      Array.isArray(producto.talles)
        ? producto.talles.filter((talle): talle is string => typeof talle === "string" && talle.trim().length > 0).map((t) => t.trim()).slice(0, 20)
        : [],
    [producto.talles]
  );

  const colores = useMemo(
    () =>
      Array.isArray(producto.colores)
        ? producto.colores.filter((color): color is string => typeof color === "string" && color.trim().length > 0).map((c) => c.trim()).slice(0, 20)
        : [],
    [producto.colores]
  );

  const variantes = producto.variantes || [];

  const stockDisponible = useMemo(() => {
    const requiereTalle = talles.length > 0;
    const requiereColor = colores.length > 0;

    if (!requiereTalle && !requiereColor) {
      return producto.stockGeneral ?? producto.stockTotal ?? 0;
    }

    if (requiereTalle && requiereColor) {
      if (talleSeleccionado && colorSeleccionado) {
        return variantes.find((v) => v.talle === talleSeleccionado && v.color === colorSeleccionado)?.stock || 0;
      }
      return producto.stockTotal || 0; 
    }

    if (requiereTalle && talleSeleccionado) {
      return variantes.find((v) => v.talle === talleSeleccionado)?.stock || 0;
    }

    if (requiereColor && colorSeleccionado) {
      return variantes.find((v) => v.color === colorSeleccionado)?.stock || 0;
    }

    return producto.stockTotal || 0;
  }, [producto, talles.length, colores.length, talleSeleccionado, colorSeleccionado, variantes]);

  const isTalleAgotado = (t: string) => {
    if (variantes.length === 0) return false;
    if (!colorSeleccionado) {
      return !variantes.some((v) => v.talle === t && v.stock > 0);
    }
    return !variantes.some((v) => v.talle === t && v.color === colorSeleccionado && v.stock > 0);
  };

  const isColorAgotado = (c: string) => {
    if (variantes.length === 0) return false;
    if (!talleSeleccionado) {
      return !variantes.some((v) => v.color === c && v.stock > 0);
    }
    return !variantes.some((v) => v.talle === talleSeleccionado && v.color === c && v.stock > 0);
  };

  useEffect(() => {
    setCantidad(1);
  }, [talleSeleccionado, colorSeleccionado]);

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

  const requiereTalle = talles.length > 0;
  const requiereColor = colores.length > 0;
  const faltaSeleccion = (requiereTalle && !talleSeleccionado) || (requiereColor && !colorSeleccionado);
  const sinStock = !faltaSeleccion && stockDisponible <= 0;

  const detalleVariantes = [
    talleSeleccionado ? `Talle: ${talleSeleccionado}` : "",
    colorSeleccionado ? `Color: ${colorSeleccionado}` : "",
  ].filter(Boolean).join(" · ");

  const mensajeBase = `Hola, me interesa "${producto.nombre}"`;
  const mensajePrecio = producto.precio ? ` (${precioARS(producto.precio)})` : "";
  const mensajeVariantes = detalleVariantes ? ` · ${detalleVariantes}` : "";
  const mensajeCompleto = `${mensajeBase}${mensajePrecio}${mensajeVariantes}. ¿Tienen disponibilidad?`;

  const enlaceWhatsApp = mostrarWhatsApp && whatsappUrl ? `${whatsappUrl}?text=${encodeURIComponent(mensajeCompleto)}` : "";

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
            <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-slate-400" : "text-zinc-500"}`}>
              Producto
            </p>
            <p className="truncate text-sm font-bold sm:text-base">{producto.nombre}</p>
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
                    alt={`${producto.nombre} - foto ${imagenActiva + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`flex h-full items-center justify-center px-6 text-center text-sm ${claro ? "text-slate-400" : "text-zinc-600"}`}>
                    Este producto todavía no tiene imágenes.
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

              {imagenes.length > 1 && (
                <div className="grid grid-cols-3 gap-2 p-3 sm:p-4">
                  {imagenes.map((url, indice) => (
                    <button
                      key={`${url}-${indice}`}
                      type="button"
                      onClick={() => setImagenActiva(indice)}
                      className={`aspect-[4/3] overflow-hidden rounded-xl border-2 transition ${
                        imagenActiva === indice ? "opacity-100" : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ borderColor: imagenActiva === indice ? colorPrincipal : "transparent" }}
                    >
                      <img src={url} alt={`${producto.nombre} miniatura ${indice + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col p-4 sm:p-6 lg:p-7">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{producto.nombre}</h2>

                {Boolean(producto.precio) && (
                  <p className="mt-3 text-2xl font-black sm:text-3xl" style={{ color: colorPrincipal }}>
                    {precioARS(producto.precio)}
                  </p>
                )}

                {producto.descripcion ? (
                  <div className="mt-5">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                      Descripción
                    </p>
                    <p className={`mt-2 whitespace-pre-line text-sm leading-6 sm:text-base sm:leading-7 ${claro ? "text-slate-600" : "text-zinc-300"}`}>
                      {producto.descripcion}
                    </p>
                  </div>
                ) : (
                  <p className={`mt-5 text-sm ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                    Consultá disponibilidad con el negocio.
                  </p>
                )}

                {talles.length > 0 && (
                  <div className="mt-5 border-t pt-5 border-slate-200 dark:border-zinc-800">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                      Talles
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {talles.map((talle) => {
                        const agotado = isTalleAgotado(talle);
                        return (
                          <button
                            key={talle}
                            type="button"
                            disabled={agotado}
                            onClick={() => setTalleSeleccionado(talleSeleccionado === talle ? "" : talle)}
                            className={`min-w-10 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                              agotado
                                ? "opacity-30 cursor-not-allowed line-through border-dashed"
                                : talleSeleccionado === talle
                                  ? "text-white"
                                  : claro
                                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                            }`}
                            style={talleSeleccionado === talle && !agotado ? { backgroundColor: colorPrincipal, borderColor: colorPrincipal } : undefined}
                          >
                            {talle}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {colores.length > 0 && (
                  <div className={`mt-5 ${talles.length === 0 ? "border-t pt-5 border-slate-200 dark:border-zinc-800" : ""}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                      Colores
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {colores.map((color) => {
                        const agotado = isColorAgotado(color);
                        return (
                          <button
                            key={color}
                            type="button"
                            disabled={agotado}
                            onClick={() => setColorSeleccionado(colorSeleccionado === color ? "" : color)}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                              agotado
                                ? "opacity-30 cursor-not-allowed line-through border-dashed"
                                : colorSeleccionado === color
                                  ? "text-white"
                                  : claro
                                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                            }`}
                            style={colorSeleccionado === color && !agotado ? { backgroundColor: colorPrincipal, borderColor: colorPrincipal } : undefined}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(!faltaSeleccion && !sinStock && pedidosHabilitados) && (
                  <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${claro ? "text-slate-500" : "text-zinc-400"}`}>
                        Cantidad
                      </p>
                      <p className={`mt-0.5 text-[10px] ${claro ? "text-slate-400" : "text-zinc-500"}`}>
                        {stockDisponible} disponibles
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                          claro ? "border-slate-300 bg-white hover:bg-slate-100" : "border-zinc-700 bg-zinc-950 hover:bg-zinc-800"
                        }`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{cantidad}</span>
                      <button
                        type="button"
                        disabled={cantidad >= stockDisponible}
                        onClick={() => setCantidad((c) => Math.min(stockDisponible, c + 1))}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                          claro ? "border-slate-300 bg-white hover:bg-slate-100" : "border-zinc-700 bg-zinc-950 hover:bg-zinc-800"
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 lg:mt-auto lg:pt-8">
                {pedidosHabilitados ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (faltaSeleccion || sinStock) {
                        e.preventDefault();
                        return;
                      }
                      onAgregarAlCarrito?.({
                        cantidad,
                        talle: talleSeleccionado,
                        color: colorSeleccionado,
                        stock: stockDisponible,
                      });
                      setAbierto(false);
                    }}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition ${
                      faltaSeleccion || sinStock
                        ? "bg-slate-300 dark:bg-zinc-800 cursor-not-allowed opacity-50"
                        : "hover:brightness-110"
                    }`}
                    style={faltaSeleccion || sinStock ? undefined : { backgroundColor: colorPrincipal }}
                  >
                    {faltaSeleccion ? "Seleccioná opciones" : sinStock ? "Agotado" : "Agregar al carrito"}
                  </button>
                ) : enlaceWhatsApp ? (
                  <a
                    href={faltaSeleccion || sinStock ? "#" : enlaceWhatsApp}
                    target={faltaSeleccion || sinStock ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    data-analytics-event="whatsapp_click"
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition ${
                      faltaSeleccion || sinStock
                        ? "bg-slate-300 dark:bg-zinc-800 cursor-not-allowed opacity-50"
                        : "bg-emerald-600 hover:bg-emerald-500"
                    }`}
                    onClick={(e) => {
                      if (faltaSeleccion || sinStock) e.preventDefault();
                    }}
                  >
                    {faltaSeleccion ? "Seleccioná opciones" : sinStock ? "Agotado" : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Consultar por WhatsApp
                      </>
                    )}
                  </a>
                ) : mostrarContacto ? (
                  <a
                    href="#contacto"
                    onClick={(e) => {
                      if (faltaSeleccion || sinStock) {
                        e.preventDefault();
                      } else {
                        setAbierto(false);
                      }
                    }}
                    className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-white transition ${
                      faltaSeleccion || sinStock ? "cursor-not-allowed opacity-50" : ""
                    }`}
                    style={faltaSeleccion || sinStock ? { backgroundColor: "gray" } : { backgroundColor: colorPrincipal }}
                  >
                    {faltaSeleccion ? "Seleccioná opciones" : sinStock ? "Agotado" : "Consultar producto"}
                  </a>
                ) : null}

                <p className={`mt-3 text-center text-[10px] leading-4 sm:text-[11px] sm:leading-5 ${claro ? "text-slate-400" : "text-zinc-600"}`}>
                  {faltaSeleccion 
                    ? "Elegí el talle y/o color para verificar stock."
                    : sinStock 
                      ? "Esta combinación no tiene unidades disponibles por el momento."
                      : pedidosHabilitados 
                        ? "Sumalo a tu carrito para enviarlo con tu pedido."
                        : "Las compras se coordinan directamente con el negocio."}
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
          setCantidad(1);
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

      {montado && modal && createPortal(modal, document.body)}
    </>
  );
}