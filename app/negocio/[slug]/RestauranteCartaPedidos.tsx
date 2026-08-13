"use client";

import {
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  imagenes?: string[];
  categoria?: string;
};

type Props = {
  slug: string;
  productos: Producto[];
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  pedidosHabilitados: boolean;
  whatsappUrl?: string;
  mostrarWhatsApp?: boolean;
};

type ItemCarrito = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
};

type PedidoResponse = {
  ok?: boolean;
  pedidoId?: string;
  numero?: string;
  total?: number;
  error?: string;
};

const CATEGORIAS = [
  {
    id: "entrada",
    titulo: "Entradas",
  },
  {
    id: "principal",
    titulo: "Platos principales",
  },
  {
    id: "bebida",
    titulo: "Bebidas",
  },
  {
    id: "postre",
    titulo: "Postres",
  },
] as const;

function categoriaNormalizada(
  valor?: string,
) {
  const categoria =
    valor
      ?.trim()
      .toLowerCase() ||
    "principal";

  if (
    categoria === "entrada" ||
    categoria === "entradas"
  ) {
    return "entrada";
  }

  if (
    categoria === "bebida" ||
    categoria === "bebidas"
  ) {
    return "bebida";
  }

  if (
    categoria === "postre" ||
    categoria === "postres"
  ) {
    return "postre";
  }

  return "principal";
}

function formatoPrecio(
  valor: number,
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    },
  ).format(valor);
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
            (url): url is string =>
              typeof url === "string" &&
              url.trim().length > 0,
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

export default function RestauranteCartaPedidos({
  slug,
  productos,
  colorPrincipal,
  tema = "oscuro",
  pedidosHabilitados,
  whatsappUrl = "",
  mostrarWhatsApp = false,
}: Props) {
  const esClaro =
    tema === "claro";

  const [
    carrito,
    setCarrito,
  ] = useState<ItemCarrito[]>(
    [],
  );

  const [
    carritoAbierto,
    setCarritoAbierto,
  ] = useState(false);

  const [
    checkoutAbierto,
    setCheckoutAbierto,
  ] = useState(false);

  const [
    nombreCliente,
    setNombreCliente,
  ] = useState("");

  const [
    telefono,
    setTelefono,
  ] = useState("");

  const [
    notas,
    setNotas,
  ] = useState("");

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    exito,
    setExito,
  ] = useState<{
    numero: string;
    total: number;
  } | null>(null);

  useEffect(() => {
    try {
      const guardado =
        window.localStorage.getItem(
          `ndi-carrito:${slug}`,
        );

      if (!guardado) {
        return;
      }

      const parsed =
        JSON.parse(guardado) as unknown;

      if (
        Array.isArray(parsed)
      ) {
        setCarrito(
          parsed
            .filter(
              (
                item,
              ): item is ItemCarrito =>
                Boolean(
                  item &&
                    typeof item ===
                      "object" &&
                    "id" in item &&
                    "nombre" in item &&
                    "precio" in item &&
                    "cantidad" in item,
                ),
            )
            .slice(0, 50),
        );
      }
    } catch {
      // Si el carrito guardado está roto,
      // arrancamos limpio.
    }
  }, [slug]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        `ndi-carrito:${slug}`,
        JSON.stringify(
          carrito,
        ),
      );
    } catch {
      // localStorage no es obligatorio.
    }
  }, [
    carrito,
    slug,
  ]);

  const categorias =
    useMemo(
      () =>
        CATEGORIAS
          .map(
            (categoria) => ({
              ...categoria,
              items:
                productos.filter(
                  (producto) =>
                    categoriaNormalizada(
                      producto.categoria,
                    ) ===
                    categoria.id,
                ),
            }),
          )
          .filter(
            (categoria) =>
              categoria.items
                .length > 0,
          ),
      [productos],
    );

  const cantidadTotal =
    carrito.reduce(
      (total, item) =>
        total +
        item.cantidad,
      0,
    );

  const total =
    carrito.reduce(
      (suma, item) =>
        suma +
        item.precio *
          item.cantidad,
      0,
    );

  function agregar(
    producto: Producto,
  ) {
    if (
      !pedidosHabilitados
    ) {
      return;
    }

    const precio =
      typeof producto.precio ===
        "number" &&
      Number.isFinite(
        producto.precio,
      )
        ? Math.max(
            0,
            producto.precio,
          )
        : 0;

    const imagen =
      obtenerImagenes(
        producto,
      )[0];

    setCarrito(
      (actual) => {
        const existe =
          actual.find(
            (item) =>
              item.id ===
              producto.id,
          );

        if (existe) {
          return actual.map(
            (item) =>
              item.id ===
              producto.id
                ? {
                    ...item,
                    cantidad:
                      Math.min(
                        20,
                        item.cantidad +
                          1,
                      ),
                  }
                : item,
          );
        }

        return [
          ...actual,
          {
            id:
              producto.id,
            nombre:
              producto.nombre,
            precio,
            cantidad: 1,
            imagen,
          },
        ];
      },
    );
  }

  function cambiarCantidad(
    id: string,
    cambio: number,
  ) {
    setCarrito(
      (actual) =>
        actual
          .map((item) =>
            item.id === id
              ? {
                  ...item,
                  cantidad:
                    item.cantidad +
                    cambio,
                }
              : item,
          )
          .filter(
            (item) =>
              item.cantidad >
              0,
          )
          .map((item) => ({
            ...item,
            cantidad:
              Math.min(
                20,
                item.cantidad,
              ),
          })),
    );
  }

  function quitar(
    id: string,
  ) {
    setCarrito(
      (actual) =>
        actual.filter(
          (item) =>
            item.id !== id,
        ),
    );
  }

  async function enviarPedido() {
    if (
      enviando ||
      carrito.length === 0
    ) {
      return;
    }

    setError("");
    setExito(null);

    if (!nombreCliente.trim()) {
      setError(
        "Ingresá tu nombre.",
      );
      return;
    }

    if (!telefono.trim()) {
      setError(
        "Ingresá un teléfono de contacto.",
      );
      return;
    }

    setEnviando(true);

    try {
      const respuesta =
        await fetch(
          "/api/public/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                slug,
                nombreCliente,
                telefono,
                notas,
                items:
                  carrito.map(
                    (item) => ({
                      id: item.id,
                      cantidad:
                        item.cantidad,
                    }),
                  ),
              }),
          },
        );

      const resultado =
        (await respuesta.json()) as PedidoResponse;

      if (!respuesta.ok) {
        setError(
          resultado.error ||
            "No se pudo enviar el pedido.",
        );
        return;
      }

      setExito({
        numero:
          resultado.numero ||
          resultado.pedidoId
            ?.slice(0, 6)
            .toUpperCase() ||
          "NUEVO",
        total:
          typeof resultado.total ===
            "number"
            ? resultado.total
            : total,
      });

      setCarrito([]);
      setNombreCliente("");
      setTelefono("");
      setNotas("");
      setCheckoutAbierto(
        false,
      );
    } catch (
      pedidoError
    ) {
      console.error(
        "Error enviando pedido:",
        pedidoError,
      );

      setError(
        "No se pudo conectar con el restaurante.",
      );
    } finally {
      setEnviando(false);
    }
  }

  const claseCard =
    esClaro
      ? "border-slate-200 bg-white shadow-sm"
      : "border-zinc-800 bg-zinc-900";

  const claseSecundario =
    esClaro
      ? "text-slate-500"
      : "text-zinc-400";

  return (
    <>
      <div className="mt-10 space-y-12">
        {categorias.map(
          (categoria) => (
            <div
              key={
                categoria.id
              }
            >
              <div className="mb-5 flex items-end justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {
                    categoria.titulo
                  }
                </h3>

                <span
                  className={`text-xs ${
                    esClaro
                      ? "text-slate-400"
                      : "text-zinc-600"
                  }`}
                >
                  {
                    categoria.items
                      .length
                  }{" "}
                  {categoria.items
                    .length === 1
                    ? "opción"
                    : "opciones"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {categoria.items.map(
                  (producto) => {
                    const imagenes =
                      obtenerImagenes(
                        producto,
                      );

                    const itemCarrito =
                      carrito.find(
                        (item) =>
                          item.id ===
                          producto.id,
                      );

                    return (
                      <article
                        key={
                          producto.id
                        }
                        className={`group overflow-hidden rounded-2xl border ${claseCard}`}
                      >
                        {imagenes.length >
                          0 && (
                          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9]">
                            <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {imagenes.map(
                                (
                                  url,
                                  indice,
                                ) => (
                                  <img
                                    key={`${url}-${indice}`}
                                    src={
                                      url
                                    }
                                    alt={`${producto.nombre} - foto ${indice + 1}`}
                                    loading="lazy"
                                    className="h-full w-full shrink-0 snap-center object-cover"
                                  />
                                ),
                              )}
                            </div>

                            {imagenes.length >
                              1 && (
                              <span className="absolute bottom-2 right-2 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                                {
                                  imagenes.length
                                }{" "}
                                fotos
                              </span>
                            )}
                          </div>
                        )}

                        <div className="p-3 sm:p-5">
                          <h4 className="text-sm font-bold leading-snug sm:text-base">
                            {
                              producto.nombre
                            }
                          </h4>

                          {producto.descripcion && (
                            <p
                              className={`mt-1.5 line-clamp-3 text-[11px] leading-5 sm:text-sm sm:leading-6 ${claseSecundario}`}
                            >
                              {
                                producto.descripcion
                              }
                            </p>
                          )}

                          <div className="mt-3 flex items-end justify-between gap-2">
                            <p className="text-sm font-bold sm:text-lg">
                              {formatoPrecio(
                                Math.max(
                                  0,
                                  Number(
                                    producto.precio ||
                                      0,
                                  ),
                                ),
                              )}
                            </p>
                          </div>

                          {pedidosHabilitados ? (
                            itemCarrito ? (
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <div
                                  className={`inline-flex items-center rounded-xl border ${
                                    esClaro
                                      ? "border-slate-200"
                                      : "border-zinc-700"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      cambiarCantidad(
                                        producto.id,
                                        -1,
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center"
                                    aria-label="Quitar una unidad"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>

                                  <span className="min-w-7 text-center text-xs font-bold">
                                    {
                                      itemCarrito.cantidad
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      cambiarCantidad(
                                        producto.id,
                                        1,
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center"
                                    aria-label="Agregar una unidad"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <span
                                  className="text-[10px] font-semibold sm:text-xs"
                                  style={{
                                    color:
                                      colorPrincipal,
                                  }}
                                >
                                  En el pedido
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  agregar(
                                    producto,
                                  )
                                }
                                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm"
                                style={{
                                  backgroundColor:
                                    colorPrincipal,
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Agregar
                              </button>
                            )
                          ) : (
                            mostrarWhatsApp &&
                            whatsappUrl && (
                              <a
                                href={`${whatsappUrl}?text=${encodeURIComponent(
                                  `Hola, quiero consultar por "${producto.nombre}" de la carta.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex text-xs font-semibold transition hover:opacity-75"
                                style={{
                                  color:
                                    colorPrincipal,
                                }}
                              >
                                Consultar por WhatsApp
                              </a>
                            )
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {pedidosHabilitados &&
        cantidadTotal > 0 && (
          <button
            type="button"
            onClick={() => {
              setCarritoAbierto(
                true,
              );
              setExito(null);
              setError("");
            }}
            className="fixed bottom-20 left-4 z-[70] inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:brightness-110 sm:bottom-6 sm:left-6"
            style={{
              backgroundColor:
                colorPrincipal,
            }}
          >
            <span className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-slate-950">
                {cantidadTotal}
              </span>
            </span>

            <span>
              Ver pedido
            </span>

            <span className="opacity-80">
              {formatoPrecio(
                total,
              )}
            </span>
          </button>
        )}

      {(carritoAbierto ||
        exito) && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0"
            onClick={() => {
              setCarritoAbierto(
                false,
              );
              setExito(null);
              setError("");
            }}
          />

          <div
            className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l shadow-2xl ${
              esClaro
                ? "border-slate-200 bg-white text-slate-950"
                : "border-zinc-800 bg-zinc-950 text-white"
            }`}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                esClaro
                  ? "border-slate-200"
                  : "border-zinc-800"
              }`}
            >
              <div>
                <p className="text-lg font-bold">
                  {exito
                    ? "Pedido enviado"
                    : checkoutAbierto
                      ? "Confirmar pedido"
                      : "Tu pedido"}
                </p>

                {!exito && (
                  <p
                    className={`mt-0.5 text-xs ${claseSecundario}`}
                  >
                    Retiro en el local
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCarritoAbierto(
                    false,
                  );
                  setExito(null);
                  setError("");
                  setCheckoutAbierto(
                    false,
                  );
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  esClaro
                    ? "border-slate-200 hover:bg-slate-100"
                    : "border-zinc-800 hover:bg-zinc-900"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {exito ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      `${colorPrincipal}18`,
                    color:
                      colorPrincipal,
                  }}
                >
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-2xl font-bold">
                  ¡Pedido recibido!
                </h3>

                <p
                  className={`mt-2 text-sm leading-6 ${claseSecundario}`}
                >
                  Tu pedido es{" "}
                  <strong>
                    #{exito.numero}
                  </strong>
                  . Quedó pendiente hasta que el restaurante lo acepte.
                </p>

                <p className="mt-4 text-xl font-bold">
                  {formatoPrecio(
                    exito.total,
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setExito(null);
                    setCarritoAbierto(
                      false,
                    );
                    setCheckoutAbierto(
                      false,
                    );
                  }}
                  className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white"
                  style={{
                    backgroundColor:
                      colorPrincipal,
                  }}
                >
                  Listo
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {!checkoutAbierto ? (
                    <div className="space-y-3">
                      {carrito.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className={`rounded-2xl border p-3 ${
                              esClaro
                                ? "border-slate-200 bg-slate-50"
                                : "border-zinc-800 bg-zinc-900"
                            }`}
                          >
                            <div className="flex gap-3">
                              {item.imagen && (
                                <img
                                  src={
                                    item.imagen
                                  }
                                  alt={
                                    item.nombre
                                  }
                                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                                />
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-bold">
                                      {
                                        item.nombre
                                      }
                                    </p>

                                    <p
                                      className={`mt-1 text-xs ${claseSecundario}`}
                                    >
                                      {formatoPrecio(
                                        item.precio,
                                      )}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      quitar(
                                        item.id,
                                      )
                                    }
                                    className="p-1.5 text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                  <div
                                    className={`inline-flex items-center rounded-xl border ${
                                      esClaro
                                        ? "border-slate-200 bg-white"
                                        : "border-zinc-700 bg-zinc-950"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        cambiarCantidad(
                                          item.id,
                                          -1,
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>

                                    <span className="min-w-7 text-center text-xs font-bold">
                                      {
                                        item.cantidad
                                      }
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        cambiarCantidad(
                                          item.id,
                                          1,
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <p className="text-sm font-bold">
                                    {formatoPrecio(
                                      item.precio *
                                        item.cantidad,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`rounded-2xl border p-4 ${
                          esClaro
                            ? "border-blue-200 bg-blue-50"
                            : "border-blue-500/20 bg-blue-500/10"
                        }`}
                      >
                        <p className="text-sm font-bold">
                          Retiro en el local
                        </p>
                        <p
                          className={`mt-1 text-xs leading-5 ${claseSecundario}`}
                        >
                          En esta primera versión no hay delivery ni pago online. El restaurante acepta el pedido y coordina el retiro.
                        </p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium">
                          Nombre
                        </label>
                        <input
                          value={
                            nombreCliente
                          }
                          onChange={(
                            event,
                          ) =>
                            setNombreCliente(
                              event.target.value,
                            )
                          }
                          maxLength={
                            120
                          }
                          placeholder="Tu nombre"
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                            esClaro
                              ? "border-slate-300 bg-white"
                              : "border-zinc-700 bg-zinc-900"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium">
                          Teléfono
                        </label>
                        <input
                          value={
                            telefono
                          }
                          onChange={(
                            event,
                          ) =>
                            setTelefono(
                              event.target.value,
                            )
                          }
                          type="tel"
                          maxLength={60}
                          placeholder="+54..."
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                            esClaro
                              ? "border-slate-300 bg-white"
                              : "border-zinc-700 bg-zinc-900"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium">
                          Nota{" "}
                          <span
                            className={
                              claseSecundario
                            }
                          >
                            (opcional)
                          </span>
                        </label>
                        <textarea
                          value={
                            notas
                          }
                          onChange={(
                            event,
                          ) =>
                            setNotas(
                              event.target.value,
                            )
                          }
                          maxLength={
                            1000
                          }
                          rows={4}
                          placeholder="Ej.: sin cebolla, retirar después de las 21..."
                          className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${
                            esClaro
                              ? "border-slate-300 bg-white"
                              : "border-zinc-700 bg-zinc-900"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-500">
                      {error}
                    </div>
                  )}
                </div>

                <div
                  className={`border-t p-5 ${
                    esClaro
                      ? "border-slate-200"
                      : "border-zinc-800"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`text-sm ${claseSecundario}`}
                    >
                      Total
                    </span>
                    <strong className="text-xl">
                      {formatoPrecio(
                        total,
                      )}
                    </strong>
                  </div>

                  {!checkoutAbierto ? (
                    <button
                      type="button"
                      disabled={
                        carrito.length ===
                        0
                      }
                      onClick={() => {
                        setCheckoutAbierto(
                          true,
                        );
                        setError("");
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      style={{
                        backgroundColor:
                          colorPrincipal,
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Continuar pedido
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutAbierto(
                            false,
                          );
                          setError("");
                        }}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                          esClaro
                            ? "border-slate-300"
                            : "border-zinc-700"
                        }`}
                      >
                        Volver
                      </button>

                      <button
                        type="button"
                        disabled={
                          enviando
                        }
                        onClick={() =>
                          void enviarPedido()
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        style={{
                          backgroundColor:
                            colorPrincipal,
                        }}
                      >
                        {enviando ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar pedido"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}