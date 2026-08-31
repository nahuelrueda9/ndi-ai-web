"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Loader2,
  PackageCheck,
  Phone,
  ShoppingBag,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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
  talle?: string;
  color?: string;
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
  tipoEntrega?: "retiro" | "envio";
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

function admitePedidos(rubro?: string) {
  const normalizado = rubro?.trim().toLowerCase() || "";
  const rubrosValidos = [
    "restaurante", "restaurant", "cafe", "café", "bar", "pizzeria", "pizzería",
    "comida", "tienda", "ropa", "indumentaria", "calzado", "bazar", "kiosco",
    "almacen", "almacén", "supermercado", "accesorios", "joyeria", "joyería",
    "electronica", "electrónica"
  ];
  return rubrosValidos.some((r) => normalizado.includes(r)) || true;
}

function formatoPrecio(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function fechaPedido(pedido: Pedido) {
  const fecha = pedido.createdAt?.toDate?.();
  if (!fecha) {
    return "Recién recibido";
  }

  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ETIQUETA: Record<EstadoPedido, string> = {
  nuevo: "Nuevo",
  aceptado: "Aceptado",
  preparando: "En preparación",
  listo: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function PedidosPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;
  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const { permission, loading: cargandoPush, suscribirNotificaciones } = usePushNotifications(empresaId);

  const [usuarioUid, setUsuarioUid] = useState("");
  const [cargando, setCargando] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState("");
  const [error, setError] = useState("");
  const [accesoPedidos, setAccesoPedidos] = useState<boolean | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const idsIniciales = useRef<Set<string> | null>(null);

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(auth, (usuario) => {
      if (!usuario) {
        setUsuarioUid("");
        setAccesoPedidos(null);
        router.replace("/login");
        return;
      }

      setAccesoPedidos(null);
      setUsuarioUid(usuario.uid);
    });

    return () => cancelarAuth();
  }, [router]);

  useEffect(() => {
    if (!empresaId || !usuarioUid) {
      return;
    }

    const empresaIdSeguro = empresaId;
    const usuarioUidSeguro = usuarioUid;

    let cancelarPedidos: (() => void) | null = null;
    let activo = true;

    async function cargarEmpresa() {
      setCargando(true);
      setError("");

      try {
        const empresaSnap = await getDoc(
          doc(db, "companies", empresaIdSeguro),
        );

        if (!empresaSnap.exists()) {
          if (activo) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace("/empresas");
          }
          return;
        }

        const datos = empresaSnap.data() as Empresa;

        let tieneAccesoEmpresa = datos.userId === usuarioUidSeguro;

        if (!tieneAccesoEmpresa) {
          const miembroSnap = await getDoc(
            doc(db, "companies", empresaIdSeguro, "members", usuarioUidSeguro),
          );

          if (!activo) return;

          if (!miembroSnap.exists()) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace("/empresas");
            return;
          }

          const miembro = miembroSnap.data() as MiembroEmpresa;
          tieneAccesoEmpresa = miembro.estado === "activo" && Boolean(miembro.rol);

          if (!tieneAccesoEmpresa) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace("/empresas");
            return;
          }
        }

        if (!admitePedidos(datos.rubro)) {
          if (activo) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(`/empresas/${empresaIdSeguro}/dashboard`);
          }
          return;
        }

        const puedeUsarPedidos = empresaTieneFuncion(datos, "productos");

        if (!puedeUsarPedidos) {
          if (activo) {
            setAccesoPedidos(false);
            setCargando(false);
            router.replace(`/empresas/${empresaIdSeguro}/dashboard`);
          }
          return;
        }

        if (activo) {
          setAccesoPedidos(true);
        }

        cancelarPedidos = onSnapshot(
          collection(db, "companies", empresaIdSeguro, "orders"),
          (snapshot) => {
            const nuevos = snapshot.docs
              .map((documento) => ({
                id: documento.id,
                ...(documento.data() as Omit<Pedido, "id">),
              }))
              .sort((a, b) => {
                const fechaA = a.createdAt?.toDate?.()?.getTime() || 0;
                const fechaB = b.createdAt?.toDate?.()?.getTime() || 0;
                return fechaB - fechaA;
              });

            const idsNuevos = new Set(nuevos.map((pedido) => pedido.id));

            if (idsIniciales.current) {
              const hayNuevo = nuevos.some(
                (pedido) =>
                  pedido.estado === "nuevo" &&
                  !idsIniciales.current!.has(pedido.id),
              );

              if (hayNuevo) {
                try {
                  const AudioContextClass =
                    window.AudioContext ||
                    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

                  if (AudioContextClass) {
                    const context = new AudioContextClass();
                    const oscillator = context.createOscillator();
                    const gain = context.createGain();

                    oscillator.frequency.value = 880;
                    gain.gain.value = 0.08;

                    oscillator.connect(gain);
                    gain.connect(context.destination);

                    oscillator.start();
                    oscillator.stop(context.currentTime + 0.16);
                  }
                } catch {
                  // Sonido opcional
                }
              }
            }

            idsIniciales.current = idsNuevos;
            setPedidos(nuevos);
            setCargando(false);
          },
          (snapshotError) => {
            console.error("Error cargando pedidos:", snapshotError);
            setError("No se pudieron cargar los pedidos.");
            setCargando(false);
          },
        );
      } catch (cargarError) {
        console.error("Error cargando datos de pedidos:", cargarError);
        if (activo) {
          setError("No se pudo abrir Pedidos.");
          setCargando(false);
        }
      }
    }

    void cargarEmpresa();

    return () => {
      activo = false;
      cancelarPedidos?.();
    };
  }, [empresaId, router, usuarioUid]);

  const pedidosFiltrados = useMemo(
    () =>
      pedidos.filter((pedido) => {
        const estado = pedido.estado || "nuevo";

        if (filtro === "nuevos") return estado === "nuevo";
        if (filtro === "curso") return estado === "aceptado" || estado === "preparando";
        if (filtro === "listos") return estado === "listo";
        if (filtro === "finalizados") return estado === "entregado" || estado === "cancelado";

        return true;
      }),
    [filtro, pedidos],
  );

  const contadores = useMemo(
    () => ({
      nuevos: pedidos.filter((pedido) => (pedido.estado || "nuevo") === "nuevo").length,
      curso: pedidos.filter(
        (pedido) => pedido.estado === "aceptado" || pedido.estado === "preparando",
      ).length,
      listos: pedidos.filter((pedido) => pedido.estado === "listo").length,
    }),
    [pedidos],
  );

  async function cambiarEstado(pedidoId: string, estado: EstadoPedido) {
    if (accesoPedidos !== true || !empresaId || cargandoAccion) {
      return;
    }

    setCargandoAccion(pedidoId);
    setError("");

    try {
      await updateDoc(
        doc(db, "companies", empresaId, "orders", pedidoId),
        {
          estado,
          updatedAt: serverTimestamp(),
        },
      );
    } catch (actualizarError) {
      console.error("Error actualizando pedido:", actualizarError);
      setError("No se pudo actualizar el pedido.");
    } finally {
      setCargandoAccion("");
    }
  }

  async function eliminarPedido(pedidoId: string) {
    if (accesoPedidos !== true || !empresaId || cargandoAccion) {
      return;
    }

    const confirmar = window.confirm("¿Seguro que querés eliminar este pedido del registro?");
    if (!confirmar) return;

    setCargandoAccion(pedidoId);
    setError("");

    try {
      await deleteDoc(doc(db, "companies", empresaId, "orders", pedidoId));
    } catch (err) {
      console.error("Error al eliminar pedido:", err);
      setError("No se pudo eliminar el pedido.");
    } finally {
      setCargandoAccion("");
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
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      {/* BANNER DE AVISO DE NOTIFICACIONES PUSH */}
      {permission !== "granted" && (
        <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 text-blue-950 dark:text-blue-100 sm:mb-6 sm:flex-row sm:items-center sm:rounded-2xl sm:p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white sm:rounded-xl">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold sm:text-sm">
                ¿Querés que te suene el celular con cada pedido?
              </p>
              <p className="text-[10px] text-slate-600 dark:text-zinc-400 sm:text-xs">
                Activá las alertas push para no perderte ninguna venta aunque tengas la app cerrada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={suscribirNotificaciones}
            disabled={cargandoPush}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-2"
          >
            {cargandoPush ? "Activando..." : "Activar en este celular"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold text-blue-500 sm:text-sm">
            Gestión comercial
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:mt-1 sm:text-3xl">
            Pedidos y Ventas
          </h1>
          <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-500 dark:text-zinc-400 sm:mt-2 sm:max-w-2xl sm:text-sm sm:leading-6">
            Los pedidos de tu catálogo aparecen acá en tiempo real para gestionar su preparación y entrega.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <Contador titulo="Nuevos" valor={contadores.nuevos} />
          <Contador titulo="En curso" valor={contadores.curso} />
          <Contador titulo="Listos" valor={contadores.listos} />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500 sm:mt-6 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
          {error}
        </div>
      )}

      <div className="mt-3 grid grid-cols-5 gap-1 sm:mt-7 sm:flex sm:gap-2 sm:overflow-x-auto sm:pb-1">
        {(
          [
            ["todos", "Todos"],
            ["nuevos", "Nuevos"],
            ["curso", "En curso"],
            ["listos", "Listos"],
            ["finalizados", "Finalizados"],
          ] as [Filtro, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFiltro(id)}
            className={`min-w-0 shrink-0 rounded-lg px-1 py-1.5 text-[8px] font-semibold transition sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs ${
              filtro === id
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900 sm:mt-6 sm:rounded-3xl sm:p-10">
          <ShoppingBag className="mx-auto h-6 w-6 text-slate-400 dark:text-zinc-600 sm:h-8 sm:w-8" />
          <h2 className="mt-2 text-base font-bold sm:mt-4 sm:text-lg">
            No hay pedidos en esta vista
          </h2>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm">
            Cuando llegue un pedido nuevo va a aparecer automáticamente en tiempo real.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2.5 sm:mt-6 sm:gap-4 xl:grid-cols-2">
          {pedidosFiltrados.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              procesando={cargandoAccion === pedido.id}
              onEstado={cambiarEstado}
              onEliminar={eliminarPedido}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Contador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900 sm:min-w-24 sm:rounded-2xl sm:px-3 sm:py-3">
      <p className="text-lg font-bold sm:text-xl">{valor}</p>
      <p className="mt-0.5 text-[8px] uppercase tracking-wide text-slate-400 dark:text-zinc-500 sm:text-[10px]">
        {titulo}
      </p>
    </div>
  );
}

function PedidoCard({
  pedido,
  procesando,
  onEstado,
  onEliminar,
}: {
  pedido: Pedido;
  procesando: boolean;
  onEstado: (id: string, estado: EstadoPedido) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}) {
  const estado = pedido.estado || "nuevo";
  const items = Array.isArray(pedido.items) ? pedido.items : [];

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white dark:bg-zinc-900 sm:rounded-3xl ${
        estado === "nuevo"
          ? "border-blue-400/60 ring-1 ring-blue-500/20 dark:border-blue-500/40"
          : "border-slate-200 dark:border-zinc-800"
      }`}
    >
      <div className="p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-base font-black sm:text-xl">
                #{pedido.numero || pedido.id.slice(0, 6).toUpperCase()}
              </h2>

              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide sm:px-2.5 sm:py-1 sm:text-[10px] ${claseEstado(
                  estado,
                )}`}
              >
                {ETIQUETA[estado]}
              </span>
            </div>

            <p className="mt-1 text-[11px] font-bold sm:mt-2 sm:text-base">
              {pedido.nombreCliente || "Cliente"}
            </p>

            <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:gap-1.5 sm:text-xs">
              <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {fechaPedido(pedido)}
              <span>· {pedido.tipoEntrega === "envio" ? "Envío" : "Retiro"}</span>
            </p>
          </div>

          <p className="text-base font-black sm:text-xl">
            {formatoPrecio(Number(pedido.total || 0))}
          </p>
        </div>

        <div className="mt-3 space-y-1.5 sm:mt-5 sm:space-y-2">
          {items.map((item, indice) => (
            <div
              key={`${item.productoId || indice}`}
              className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-zinc-950 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold sm:text-sm">
                  <span className="mr-1 text-blue-500 sm:mr-2">
                    {item.cantidad || 1}x
                  </span>
                  {item.nombre || "Producto"}
                  {(item.talle || item.color) && (
                    <span className="ml-1 text-[9px] text-slate-500 dark:text-zinc-400">
                      ({[item.talle && `Talle ${item.talle}`, item.color && `Color ${item.color}`].filter(Boolean).join(" · ")})
                    </span>
                  )}
                </p>

                <p className="mt-0.5 text-[8px] text-slate-400 dark:text-zinc-600 sm:text-[11px]">
                  {formatoPrecio(Number(item.precioUnitario || 0))} c/u
                </p>
              </div>

              <p className="shrink-0 text-[10px] font-bold sm:text-sm">
                {formatoPrecio(Number(item.subtotal || 0))}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-200 pt-2.5 dark:border-zinc-800 sm:mt-5 sm:pt-4">
          {pedido.telefono && (
            <p className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-zinc-400 sm:gap-2 sm:text-sm">
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {pedido.telefono}
            </p>
          )}

          {pedido.notas && (
            <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-2 sm:mt-3 sm:rounded-xl sm:px-3 sm:py-2.5">
              <p className="text-[8px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300 sm:text-[10px]">
                Nota
              </p>
              <p className="mt-0.5 line-clamp-3 text-[10px] leading-4 sm:mt-1 sm:line-clamp-none sm:text-sm sm:leading-5">
                {pedido.notas}
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
          {estado === "nuevo" && (
            <>
              <Accion
                icono={<CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                texto="Aceptar"
                disabled={procesando}
                principal
                onClick={() => void onEstado(pedido.id, "aceptado")}
              />
              <Accion
                icono={<XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                texto="Rechazar"
                disabled={procesando}
                peligro
                onClick={() => void onEstado(pedido.id, "cancelado")}
              />
            </>
          )}

          {estado === "aceptado" && (
            <>
              <Accion
                icono={<PackageCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                texto="En preparación"
                disabled={procesando}
                principal
                onClick={() => void onEstado(pedido.id, "preparando")}
              />
              <Accion
                icono={<XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                texto="Cancelar"
                disabled={procesando}
                peligro
                onClick={() => void onEstado(pedido.id, "cancelado")}
              />
            </>
          )}

          {estado === "preparando" && (
            <Accion
              icono={<PackageCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              texto="Marcar listo"
              disabled={procesando}
              principal
              onClick={() => void onEstado(pedido.id, "listo")}
            />
          )}

          {estado === "listo" && (
            <Accion
              icono={<Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              texto="Entregado"
              disabled={procesando}
              principal
              onClick={() => void onEstado(pedido.id, "entregado")}
            />
          )}

          {(estado === "entregado" || estado === "cancelado") && (
            <Accion
              icono={<Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              texto="Eliminar pedido"
              disabled={procesando}
              peligro
              onClick={() => void onEliminar(pedido.id)}
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold transition disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs ${
        principal
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : peligro
            ? "border border-red-500/30 text-red-500 hover:bg-red-500/10"
            : "border border-slate-200 dark:border-zinc-700"
      }`}
    >
      {disabled ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
      ) : (
        icono
      )}
      {texto}
    </button>
  );
}

function claseEstado(estado: EstadoPedido) {
  if (estado === "nuevo") return "bg-blue-500/10 text-blue-500";
  if (estado === "aceptado") return "bg-violet-500/10 text-violet-500";
  if (estado === "preparando") return "bg-amber-500/10 text-amber-500";
  if (estado === "listo") return "bg-emerald-500/10 text-emerald-500";
  if (estado === "entregado") return "bg-slate-500/10 text-slate-500";
  return "bg-red-500/10 text-red-500";
}