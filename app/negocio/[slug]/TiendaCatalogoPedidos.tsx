"use client";

import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X, Clock3, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import ProductoDetalleTienda from "./ProductoDetalleTienda";

type VarianteProducto = {
  talle: string;
  color: string;
  stock: number;
};

type Producto = {
  id: string;
  tipo: "servicio" | "producto";
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracionMinutos?: number;
  imagenUrl?: string;
  imagenes?: string[];
  talles?: string[];
  colores?: string[];
  variantes?: VarianteProducto[];
  stockGeneral?: number;
  stockTotal?: number;
  activo?: boolean;
};

type ItemCarritoTienda = {
  idUnico: string;
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  talle?: string;
  color?: string;
  stockMaximo: number;
};

type Props = {
  slug: string;
  productos: Producto[];
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  pedidosHabilitados: boolean;
  whatsappUrl?: string;
  mostrarWhatsApp?: boolean;
  mostrarContacto?: boolean;
};

function formatoPrecio(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function obtenerImagenes(producto: Producto) {
  const imagenes = Array.isArray(producto.imagenes)
    ? producto.imagenes.filter((url): url is string => typeof url === "string" && url.trim().length > 0).map((url) => url.trim()).slice(0, 3)
    : [];
  if (imagenes.length === 0 && producto.imagenUrl?.trim()) {
    imagenes.push(producto.imagenUrl.trim());
  }
  return imagenes;
}

export default function TiendaCatalogoPedidos({
  slug,
  productos,
  colorPrincipal,
  tema = "oscuro",
  pedidosHabilitados,
  whatsappUrl = "",
  mostrarWhatsApp = false,
  mostrarContacto = false,
}: Props) {
  const [carrito, setCarrito] = useState<ItemCarritoTienda[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  
  const claro = tema === "claro";
  const claseSecundario = "text-slate-500 dark:text-zinc-400";

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(`ndi-carrito-tienda:${slug}`);
      if (!guardado) return;
      const parsed = JSON.parse(guardado) as unknown;
      if (Array.isArray(parsed)) {
        setCarrito(
          parsed.filter((item): item is ItemCarritoTienda => Boolean(item && typeof item === "object" && "idUnico" in item && "nombre" in item && "precio" in item && "cantidad" in item)).slice(0, 50)
        );
      }
    } catch {
      // Ignorar si el carrito está roto
    }
  }, [slug]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`ndi-carrito-tienda:${slug}`, JSON.stringify(carrito));
    } catch {
      // localStorage no obligatorio
    }
  }, [carrito, slug]);

  const cantidadTotal = carrito.reduce((total, item) => total + item.cantidad, 0);
  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

  function agregarAlCarrito(producto: Producto, seleccion: { cantidad: number; talle: string; color: string; stock: number }) {
    if (!pedidosHabilitados) return;
    const idUnico = `${producto.id}-${seleccion.talle || 'ST'}-${seleccion.color || 'SC'}`;
    const precio = typeof producto.precio === "number" ? Math.max(0, producto.precio) : 0;
    const imagen = obtenerImagenes(producto)[0];

    setCarrito((actual) => {
      const existe = actual.find((item) => item.idUnico === idUnico);
      if (existe) {
        return actual.map((item) =>
          item.idUnico === idUnico ? { ...item, cantidad: Math.min(seleccion.stock, item.cantidad + seleccion.cantidad) } : item
        );
      }
      return [
        ...actual,
        {
          idUnico,
          productoId: producto.id,
          nombre: producto.nombre,
          precio,
          cantidad: seleccion.cantidad,
          imagen,
          talle: seleccion.talle,
          color: seleccion.color,
          stockMaximo: seleccion.stock,
        },
      ];
    });
    setCarritoAbierto(true);
  }

  function cambiarCantidad(idUnico: string, cambio: number) {
    setCarrito((actual) =>
      actual
        .map((item) => (item.idUnico === idUnico ? { ...item, cantidad: item.cantidad + cambio } : item))
        .filter((item) => item.cantidad > 0)
        .map((item) => ({ ...item, cantidad: Math.min(item.stockMaximo, item.cantidad) }))
    );
  }

  function quitar(idUnico: string) {
    setCarrito((actual) => actual.filter((item) => item.idUnico !== idUnico));
  }

  function enviarPedidoWhatsApp() {
    if (!nombreCliente.trim()) {
      setError("Por favor, ingresá tu nombre para identificarte.");
      return;
    }
    
    let texto = `¡Hola! Quiero hacer un pedido:\n\n`;
    carrito.forEach((item) => {
      texto += `• ${item.cantidad}x ${item.nombre}`;
      const vars = [item.talle && `Talle ${item.talle}`, item.color && `Color ${item.color}`].filter(Boolean).join(" · ");
      if (vars) texto += ` (${vars})`;
      texto += ` -> ${formatoPrecio(item.precio * item.cantidad)}\n`;
    });
    texto += `\n*Total: ${formatoPrecio(total)}*\n`;
    texto += `\nNombre: ${nombreCliente.trim()}`;
    if (notas.trim()) texto += `\nNotas: ${notas.trim()}`;

    const url = `${whatsappUrl}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    
    // Vaciar el carrito luego de enviar
    setCarrito([]);
    setCarritoAbierto(false);
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:mt-5 lg:grid-cols-3 lg:gap-4">
        {productos.map((producto) => {
          const imagenesItem = obtenerImagenes(producto);
          return (
            <article key={producto.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/90">
              {imagenesItem.length > 0 && (
                <div className="relative aspect-[4/5] overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 sm:aspect-[5/6] lg:aspect-[4/5]">
                  <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {imagenesItem.map((url, indice) => (
                      <img key={`${url}-${indice}`} src={url} alt={`${producto.nombre} - foto ${indice + 1}`} loading="lazy" className="h-full w-full shrink-0 snap-center object-cover" />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.25] sm:text-base sm:leading-5">
                  {producto.nombre}
                </h3>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800 sm:mt-4 sm:gap-3 sm:pt-4">
                  <div>
                    {Boolean(producto.precio) && (
                      <>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-xs">Precio</p>
                        <p className="mt-0.5 text-sm font-bold sm:mt-1 sm:text-lg" style={{ color: colorPrincipal }}>
                          {formatoPrecio(producto.precio || 0)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                  <ProductoDetalleTienda
                    producto={producto}
                    colorPrincipal={colorPrincipal}
                    tema={tema}
                    mostrarWhatsApp={mostrarWhatsApp}
                    whatsappUrl={whatsappUrl}
                    mostrarContacto={mostrarContacto}
                    pedidosHabilitados={pedidosHabilitados}
                    onAgregarAlCarrito={(seleccion) => agregarAlCarrito(producto, seleccion)}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {pedidosHabilitados && cantidadTotal > 0 && (
        <button
          type="button"
          onClick={() => { setCarritoAbierto(true); setError(""); }}
          className="fixed bottom-20 left-4 z-[70] inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:brightness-110 sm:bottom-6 sm:left-6"
          style={{ backgroundColor: colorPrincipal }}
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-slate-950">
              {cantidadTotal}
            </span>
          </span>
          <span>Ver pedido</span>
          <span className="opacity-80">{formatoPrecio(total)}</span>
        </button>
      )}

      {carritoAbierto && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
          <button type="button" aria-label="Cerrar" className="absolute inset-0" onClick={() => { setCarritoAbierto(false); setError(""); }} />

          <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
              <div>
                <p className="text-lg font-bold">Tu pedido</p>
                <p className={`mt-0.5 text-xs ${claseSecundario}`}>Completá tus datos para enviar por WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={() => { setCarritoAbierto(false); setError(""); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div key={item.idUnico} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex gap-3">
                      {item.imagen && (
                        <img src={item.imagen} alt={item.nombre} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold">{item.nombre}</p>
                            {(item.talle || item.color) && (
                              <p className={`mt-0.5 text-[10px] uppercase font-semibold ${claseSecundario}`}>
                                {[item.talle && `Talle ${item.talle}`, item.color && `Color ${item.color}`].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            <p className={`mt-1 text-xs ${claseSecundario}`}>{formatoPrecio(item.precio)}</p>
                          </div>
                          <button type="button" onClick={() => quitar(item.idUnico)} className="p-1.5 text-red-500 hover:text-red-600 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                            <button type="button" onClick={() => cambiarCantidad(item.idUnico, -1)} className="flex h-8 w-8 items-center justify-center hover:opacity-70">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-xs font-bold">{item.cantidad}</span>
                            <button type="button" disabled={item.cantidad >= item.stockMaximo} onClick={() => cambiarCantidad(item.idUnico, 1)} className="flex h-8 w-8 items-center justify-center hover:opacity-70 disabled:opacity-30">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-bold">{formatoPrecio(item.precio * item.cantidad)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {carrito.length > 0 && (
                <div className="mt-6 space-y-4 border-t border-slate-200 pt-6 dark:border-zinc-800">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Nombre</label>
                    <input
                      value={nombreCliente}
                      onChange={(event) => setNombreCliente(event.target.value)}
                      maxLength={120}
                      placeholder="Tu nombre y apellido"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Nota <span className={claseSecundario}>(opcional)</span></label>
                    <textarea
                      value={notas}
                      onChange={(event) => setNotas(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Ej.: ¿Tienen envíos a domicilio?"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                    />
                  </div>
                </div>
              )}

              {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
            </div>

            <div className="border-t border-slate-200 p-5 dark:border-zinc-800">
              <div className="mb-4 flex items-center justify-between">
                <span className={`text-sm ${claseSecundario}`}>Total del pedido</span>
                <strong className="text-xl">{formatoPrecio(total)}</strong>
              </div>

              <button
                type="button"
                disabled={carrito.length === 0}
                onClick={enviarPedidoWhatsApp}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colorPrincipal }}
              >
                <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}