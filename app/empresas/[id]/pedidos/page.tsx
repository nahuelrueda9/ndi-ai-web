"use client";

import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Loader2,
  PackageCheck,
  Phone,
  ShoppingBag,
  Utensils,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  auth,
  db,
} from "@/lib/firebase";
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";

type EstadoPedido =
  | "nuevo"
  | "aceptado"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

type ItemPedido = {
  productoId?: string;
  nombre?: string;
  precioUnitario?: number;
  cantidad?: number;
  subtotal?: number;
};

type Pedido = {
  id: string;
  numero?: string;
  nombreCliente?: string;
  telefono?: string;
  notas?: string;
  items?: ItemPedido[];
  cantidadItems?: number;
  total?: number;
  estado?: EstadoPedido;
  tipoEntrega?: "retiro";
  createdAt?: {
    toDate?: () => Date;
  };
};

type Empresa = {
  userId?: string;
  rubro?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  paginaPublica?: {
    mostrarPedidosOnline?: boolean;
  };
};

type MiembroEmpresa = {
  rol?: "administrador" | "supervisor" | "operador";
  estado?: "activo" | "inactivo";
};

type Filtro =
  | "todos"
  | "nuevos"
  | "curso"
  | "listos"
  | "finalizados";

function esRestaurante(
  rubro?: string,
) {
  const normalizado =
    rubro
      ?.trim()
      .toLowerCase() ||
    "";

  return (
    normalizado ===
      "restaurante" ||
    normalizado ===
      "restaurant"
  );
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

function fechaPedido(
  pedido: Pedido,
) {
  const fecha =
    pedido.createdAt
      ?.toDate?.();

  if (!fecha) {
    return "Recién recibido";
  }

  return fecha.toLocaleString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

const ETIQUETA: Record<
  EstadoPedido,
  string
> = {
  nuevo: "Nuevo",
  aceptado: "Aceptado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function PedidosPage() {
  const params =
    useParams();
  const router =
    useRouter();

  const parametroEmpresa =
    params.id ??
    params.empresaId;

  const empresaId =
    Array.isArray(
      parametroEmpresa,
    )
      ? parametroEmpresa[0]
      : (parametroEmpresa as
          | string
          | undefined);

  const [
    usuarioUid,
    setUsuarioUid,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    cargandoAccion,
    setCargandoAccion,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    empresa,
    setEmpresa,
  ] = useState<Empresa | null>(
    null,
  );

  const [
    accesoPedidos,
    setAccesoPedidos,
  ] = useState<boolean | null>(
    null,
  );

  const [
    pedidos,
    setPedidos,
  ] = useState<Pedido[]>(
    [],
  );

  const [
    filtro,
    setFiltro,
  ] = useState<Filtro>(
    "todos",
  );

  const idsIniciales =
    useRef<Set<string> | null>(
      null,
    );

  useEffect(() => {
    const cancelarAuth =
      onAuthStateChanged(
        auth,
        (
          usuario,
        ) => {
          if (!usuario) {
            setUsuarioUid("");
            setAccesoPedidos(null);
            router.replace(
              "/login",
            );
            return;
          }

          setAccesoPedidos(null);
          setUsuarioUid(
            usuario.uid,
          );
        },
      );

    return () =>
      cancelarAuth();
  }, [router]);

  useEffect(() => {
    if (
      !empresaId ||
      !usuarioUid
    ) {
      return;
    }

    const empresaIdSeguro =
      empresaId;
    const usuarioUidSeguro =
      usuarioUid;

    let cancelarPedidos:
      | (() => void)
      | null = null;

    let activo = true;

    async function cargarEmpresa() {
      setCargando(true);
      setError("");

      try {
        const empresaSnap =
          await getDoc(
            doc(
              db,
              "companies",
              empresaIdSeguro,
            ),
          );

        if (
          !empresaSnap.exists()
        ) {
          if (activo) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(
              "/empresas",
            );
          }
          return;
        }

        const datos =
          empresaSnap.data() as Empresa;

        let tieneAccesoEmpresa =
          datos.userId ===
          usuarioUidSeguro;

        if (!tieneAccesoEmpresa) {
          const miembroSnap =
            await getDoc(
              doc(
                db,
                "companies",
                empresaIdSeguro,
                "members",
                usuarioUidSeguro,
              ),
            );

          if (!activo) {
            return;
          }

          if (!miembroSnap.exists()) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(
              "/empresas",
            );
            return;
          }

          const miembro =
            miembroSnap.data() as MiembroEmpresa;

          tieneAccesoEmpresa =
            miembro.estado === "activo" &&
            Boolean(miembro.rol);

          if (!tieneAccesoEmpresa) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(
              "/empresas",
            );
            return;
          }
        }

        if (
          !esRestaurante(
            datos.rubro,
          )
        ) {
          if (activo) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(
              `/empresas/${empresaIdSeguro}/dashboard`,
            );
          }
          return;
        }

        const puedeUsarPedidos =
          empresaTieneFuncion(
            datos,
            "productos",
          );

        if (!puedeUsarPedidos) {
          if (activo) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(
              `/empresas/${empresaIdSeguro}/dashboard`,
            );
          }
          return;
        }

        if (activo) {
          setEmpresa(datos);
          setAccesoPedidos(true);
        }

        cancelarPedidos =
          onSnapshot(
            collection(
              db,
              "companies",
              empresaIdSeguro,
              "orders",
            ),
            (
              snapshot,
            ) => {
              const nuevos =
                snapshot.docs
                  .map(
                    (documento) => ({
                      id:
                        documento.id,
                      ...(documento.data() as Omit<
                        Pedido,
                        "id"
                      >),
                    }),
                  )
                  .sort(
                    (a, b) => {
                      const fechaA =
                        a.createdAt
                          ?.toDate?.()
                          ?.getTime() ||
                        0;

                      const fechaB =
                        b.createdAt
                          ?.toDate?.()
                          ?.getTime() ||
                        0;

                      return (
                        fechaB -
                        fechaA
                      );
                    },
                  );

              const idsNuevos =
                new Set(
                  nuevos.map(
                    (pedido) =>
                      pedido.id,
                  ),
                );

              if (
                idsIniciales.current
              ) {
                const hayNuevo =
                  nuevos.some(
                    (pedido) =>
                      pedido.estado ===
                        "nuevo" &&
                      !idsIniciales.current!.has(
                        pedido.id,
                      ),
                  );

                if (
                  hayNuevo
                ) {
                  try {
                    const AudioContextClass =
                      window.AudioContext ||
                      (
                        window as typeof window & {
                          webkitAudioContext?: typeof AudioContext;
                        }
                      )
                        .webkitAudioContext;

                    if (
                      AudioContextClass
                    ) {
                      const context =
                        new AudioContextClass();

                      const oscillator =
                        context.createOscillator();

                      const gain =
                        context.createGain();

                      oscillator.frequency.value =
                        880;

                      gain.gain.value =
                        0.08;

                      oscillator.connect(
                        gain,
                      );

                      gain.connect(
                        context.destination,
                      );

                      oscillator.start();

                      oscillator.stop(
                        context.currentTime +
                          0.16,
                      );
                    }
                  } catch {
                    // Sonido no obligatorio.
                  }
                }
              }

              idsIniciales.current =
                idsNuevos;

              setPedidos(
                nuevos,
              );
              setCargando(
                false,
              );
            },
            (
              snapshotError,
            ) => {
              console.error(
                "Error cargando pedidos:",
                snapshotError,
              );

              setError(
                "No se pudieron cargar los pedidos.",
              );
              setCargando(
                false,
              );
            },
          );
      } catch (
        cargarError
      ) {
        console.error(
          "Error cargando restaurante:",
          cargarError,
        );

        if (activo) {
          setError(
            "No se pudo abrir Pedidos.",
          );
          setCargando(
            false,
          );
        }
      }
    }

    void cargarEmpresa();

    return () => {
      activo = false;
      cancelarPedidos?.();
    };
  }, [
    empresaId,
    router,
    usuarioUid,
  ]);

  const pedidosFiltrados =
    useMemo(
      () =>
        pedidos.filter(
          (pedido) => {
            const estado =
              pedido.estado ||
              "nuevo";

            if (
              filtro ===
              "nuevos"
            ) {
              return (
                estado ===
                "nuevo"
              );
            }

            if (
              filtro ===
              "curso"
            ) {
              return (
                estado ===
                  "aceptado" ||
                estado ===
                  "preparando"
              );
            }

            if (
              filtro ===
              "listos"
            ) {
              return (
                estado ===
                "listo"
              );
            }

            if (
              filtro ===
              "finalizados"
            ) {
              return (
                estado ===
                  "entregado" ||
                estado ===
                  "cancelado"
              );
            }

            return true;
          },
        ),
      [
        filtro,
        pedidos,
      ],
    );

  const contadores =
    useMemo(
      () => ({
        nuevos:
          pedidos.filter(
            (pedido) =>
              (pedido.estado ||
                "nuevo") ===
              "nuevo",
          ).length,
        curso:
          pedidos.filter(
            (pedido) =>
              pedido.estado ===
                "aceptado" ||
              pedido.estado ===
                "preparando",
          ).length,
        listos:
          pedidos.filter(
            (pedido) =>
              pedido.estado ===
              "listo",
          ).length,
      }),
      [pedidos],
    );

  async function cambiarEstado(
    pedidoId: string,
    estado: EstadoPedido,
  ) {
    if (
      accesoPedidos !== true ||
      !empresaId ||
      cargandoAccion
    ) {
      return;
    }

    setCargandoAccion(
      pedidoId,
    );
    setError("");

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "orders",
          pedidoId,
        ),
        {
          estado,
          updatedAt:
            serverTimestamp(),
        },
      );
    } catch (
      actualizarError
    ) {
      console.error(
        "Error actualizando pedido:",
        actualizarError,
      );

      setError(
        "No se pudo actualizar el pedido.",
      );
    } finally {
      setCargandoAccion(
        "",
      );
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (accesoPedidos !== true) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-500">
            Restaurante
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Pedidos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            Los pedidos de la página pública aparecen acá en tiempo real para que caja los tome y actualice su estado.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Contador
            titulo="Nuevos"
            valor={
              contadores.nuevos
            }
          />
          <Contador
            titulo="En curso"
            valor={
              contadores.curso
            }
          />
          <Contador
            titulo="Listos"
            valor={
              contadores.listos
            }
          />
        </div>
      </div>

      {empresa?.paginaPublica
        ?.mostrarPedidosOnline !==
        true && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-300">
          Los pedidos online están desactivados en Mi página. Los pedidos anteriores siguen visibles.
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            [
              "todos",
              "Todos",
            ],
            [
              "nuevos",
              "Nuevos",
            ],
            [
              "curso",
              "En curso",
            ],
            [
              "listos",
              "Listos",
            ],
            [
              "finalizados",
              "Finalizados",
            ],
          ] as [
            Filtro,
            string,
          ][]
        ).map(
          ([
            id,
            label,
          ]) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setFiltro(id)
              }
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filtro === id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {pedidosFiltrados.length ===
      0 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <ShoppingBag className="mx-auto h-8 w-8 text-slate-400 dark:text-zinc-600" />
          <h2 className="mt-4 text-lg font-bold">
            No hay pedidos en esta vista
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
            Cuando llegue un pedido nuevo va a aparecer automáticamente.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {pedidosFiltrados.map(
            (pedido) => (
              <PedidoCard
                key={
                  pedido.id
                }
                pedido={
                  pedido
                }
                procesando={
                  cargandoAccion ===
                  pedido.id
                }
                onEstado={
                  cambiarEstado
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function Contador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="min-w-24 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xl font-bold">
        {valor}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-zinc-500">
        {titulo}
      </p>
    </div>
  );
}

function PedidoCard({
  pedido,
  procesando,
  onEstado,
}: {
  pedido: Pedido;
  procesando: boolean;
  onEstado: (
    id: string,
    estado: EstadoPedido,
  ) => Promise<void>;
}) {
  const estado =
    pedido.estado ||
    "nuevo";

  const items =
    Array.isArray(
      pedido.items,
    )
      ? pedido.items
      : [];

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white dark:bg-zinc-900 ${
        estado === "nuevo"
          ? "border-blue-400/60 ring-1 ring-blue-500/20 dark:border-blue-500/40"
          : "border-slate-200 dark:border-zinc-800"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">
                #
                {pedido.numero ||
                  pedido.id
                    .slice(
                      0,
                      6,
                    )
                    .toUpperCase()}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${claseEstado(
                  estado,
                )}`}
              >
                {
                  ETIQUETA[
                    estado
                  ]
                }
              </span>
            </div>

            <p className="mt-2 text-base font-bold">
              {pedido.nombreCliente ||
                "Cliente"}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
              <Clock3 className="h-3.5 w-3.5" />
              {fechaPedido(
                pedido,
              )}
              <span>
                · Retiro
              </span>
            </p>
          </div>

          <p className="text-xl font-black">
            {formatoPrecio(
              Number(
                pedido.total ||
                  0,
              ),
            )}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {items.map(
            (
              item,
              indice,
            ) => (
              <div
                key={`${item.productoId || indice}`}
                className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-zinc-950"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    <span className="mr-2 text-blue-500">
                      {item.cantidad ||
                        1}
                      x
                    </span>
                    {item.nombre ||
                      "Producto"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-600">
                    {formatoPrecio(
                      Number(
                        item.precioUnitario ||
                          0,
                      ),
                    )}{" "}
                    c/u
                  </p>
                </div>

                <p className="shrink-0 text-sm font-bold">
                  {formatoPrecio(
                    Number(
                      item.subtotal ||
                        0,
                    ),
                  )}
                </p>
              </div>
            ),
          )}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-zinc-800">
          {pedido.telefono && (
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
              <Phone className="h-4 w-4" />
              {
                pedido.telefono
              }
            </p>
          )}

          {pedido.notas && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                Nota
              </p>
              <p className="mt-1 text-sm leading-5">
                {pedido.notas}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {estado ===
            "nuevo" && (
            <>
              <Accion
                icono={
                  <CheckCircle2 className="h-4 w-4" />
                }
                texto="Aceptar"
                disabled={
                  procesando
                }
                principal
                onClick={() =>
                  void onEstado(
                    pedido.id,
                    "aceptado",
                  )
                }
              />

              <Accion
                icono={
                  <XCircle className="h-4 w-4" />
                }
                texto="Rechazar"
                disabled={
                  procesando
                }
                peligro
                onClick={() =>
                  void onEstado(
                    pedido.id,
                    "cancelado",
                  )
                }
              />
            </>
          )}

          {estado ===
            "aceptado" && (
            <>
              <Accion
                icono={
                  <ChefHat className="h-4 w-4" />
                }
                texto="Preparando"
                disabled={
                  procesando
                }
                principal
                onClick={() =>
                  void onEstado(
                    pedido.id,
                    "preparando",
                  )
                }
              />

              <Accion
                icono={
                  <XCircle className="h-4 w-4" />
                }
                texto="Cancelar"
                disabled={
                  procesando
                }
                peligro
                onClick={() =>
                  void onEstado(
                    pedido.id,
                    "cancelado",
                  )
                }
              />
            </>
          )}

          {estado ===
            "preparando" && (
            <Accion
              icono={
                <PackageCheck className="h-4 w-4" />
              }
              texto="Marcar listo"
              disabled={
                procesando
              }
              principal
              onClick={() =>
                void onEstado(
                  pedido.id,
                  "listo",
                )
              }
            />
          )}

          {estado ===
            "listo" && (
            <Accion
              icono={
                <Utensils className="h-4 w-4" />
              }
              texto="Entregado"
              disabled={
                procesando
              }
              principal
              onClick={() =>
                void onEstado(
                  pedido.id,
                  "entregado",
                )
              }
            />
          )}
        </div>
      </div>
    </article>
  );
}

function Accion({
  icono,
  texto,
  disabled,
  onClick,
  principal = false,
  peligro = false,
}: {
  icono: ReactNode;
  texto: string;
  disabled: boolean;
  onClick: () => void;
  principal?: boolean;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
        principal
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : peligro
            ? "border border-red-500/30 text-red-500 hover:bg-red-500/10"
            : "border border-slate-200 dark:border-zinc-700"
      }`}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icono
      )}
      {texto}
    </button>
  );
}

function claseEstado(
  estado: EstadoPedido,
) {
  if (
    estado === "nuevo"
  ) {
    return "bg-blue-500/10 text-blue-500";
  }

  if (
    estado === "aceptado"
  ) {
    return "bg-violet-500/10 text-violet-500";
  }

  if (
    estado ===
    "preparando"
  ) {
    return "bg-amber-500/10 text-amber-500";
  }

  if (
    estado === "listo"
  ) {
    return "bg-emerald-500/10 text-emerald-500";
  }

  if (
    estado ===
    "entregado"
  ) {
    return "bg-slate-500/10 text-slate-500";
  }

  return "bg-red-500/10 text-red-500";
}