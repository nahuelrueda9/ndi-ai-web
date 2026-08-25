"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lock, Sparkles, TrendingUp, Bot, ShoppingBag } from "lucide-react";

import { db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  type PlanId,
} from "@/lib/plans/planAccess";
import Button from "@/components/Ui/Button";
import Badge from "@/components/Ui/Badge";

type ChatData = {
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type MensajeData = {
  role?: "user" | "assistant";
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: Timestamp;
};

type EventoPaginaData = {
  tipo?:
    | "page_view"
    | "whatsapp_click"
    | "lead_submit"
    | "appointment_created";
  visitanteId?: string;
  createdAt?: Timestamp;
};

type OrderData = {
  total?: number;
  createdAt?: Timestamp;
};

type EmpresaData = {
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
};

type ActividadDia = {
  dia: string;
  fechaClave: string;
  visitas: number;
  contactos: number;
  reservas: number;
  pedidos: number;
};

type EmbudoPagina = {
  etapa: string;
  cantidad: number;
};

type EstadisticasCalculadas = {
  visitasPagina: number;
  visitantesPagina: number;
  contactosPagina: number;
  reservasPagina: number;
  clicsWhatsApp: number;
  tasaContactoPagina: number;
  tasaReservaPagina: number;

  pedidosTotales: number;
  ingresosTotales: number;

  totalConsultas: number;
  consultasSemana: number;
  abiertas: number;
  cerradas: number;
  atendidasIA: number;
  atendidasHumano: number;
  tiempoRespuestaPromedio: number | null;

  actividadPagina: ActividadDia[];
  embudoPagina: EmbudoPagina[];
};

const ESTADISTICAS_INICIALES: EstadisticasCalculadas = {
  visitasPagina: 0,
  visitantesPagina: 0,
  contactosPagina: 0,
  reservasPagina: 0,
  clicsWhatsApp: 0,
  tasaContactoPagina: 0,
  tasaReservaPagina: 0,

  pedidosTotales: 0,
  ingresosTotales: 0,

  totalConsultas: 0,
  consultasSemana: 0,
  abiertas: 0,
  cerradas: 0,
  atendidasIA: 0,
  atendidasHumano: 0,
  tiempoRespuestaPromedio: null,

  actividadPagina: [],
  embudoPagina: [],
};

function formatoPrecio(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function obtenerInicioDelDia(fecha: Date) {
  const resultado = new Date(fecha);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function claveFecha(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearDia(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
  })
    .format(fecha)
    .replace(".", "");
}

function obtenerTiempoPrimeraRespuesta(
  mensajes: MensajeData[],
): number | null {
  const ordenados = mensajes
    .filter((mensaje) => mensaje.createdAt)
    .sort(
      (a, b) =>
        (a.createdAt?.toMillis() ?? 0) -
        (b.createdAt?.toMillis() ?? 0),
    );

  const indicePrimerCliente = ordenados.findIndex(
    (mensaje) =>
      mensaje.role === "user" ||
      mensaje.enviadoPor === "cliente",
  );

  if (indicePrimerCliente === -1) {
    return null;
  }

  const primerCliente = ordenados[indicePrimerCliente];

  const primeraRespuesta = ordenados
    .slice(indicePrimerCliente + 1)
    .find(
      (mensaje) =>
        mensaje.role === "assistant" ||
        mensaje.enviadoPor === "ia" ||
        mensaje.enviadoPor === "humano",
    );

  if (
    !primerCliente.createdAt ||
    !primeraRespuesta?.createdAt
  ) {
    return null;
  }

  const diferencia =
    primeraRespuesta.createdAt.toMillis() -
    primerCliente.createdAt.toMillis();

  if (diferencia < 0) {
    return null;
  }

  return diferencia / 60000;
}

function formatearTiempoRespuesta(
  minutos: number | null,
) {
  if (minutos === null) {
    return "Sin datos";
  }

  if (minutos < 1) {
    return "< 1 min";
  }

  if (minutos < 60) {
    return `${Math.round(minutos)} min`;
  }

  const horas = minutos / 60;

  if (horas < 24) {
    return `${horas.toFixed(1)} h`;
  }

  return `${(horas / 24).toFixed(1)} días`;
}

export default function EstadisticasPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [cargando, setCargando] = useState(true);

  const [puedeVerBasicas, setPuedeVerBasicas] = useState(true);
  const [puedeVerAvanzadas, setPuedeVerAvanzadas] = useState(false);
  const [puedeVerIA, setPuedeVerIA] = useState(false);
  const [puedeVerProductos, setPuedeVerProductos] = useState(false);
  const [nombrePlan, setNombrePlan] = useState("Página Simple");

  const [estadisticas, setEstadisticas] =
    useState<EstadisticasCalculadas>(
      ESTADISTICAS_INICIALES,
    );

  useEffect(() => {
    if (!empresaId) {
      setCargando(false);
      return;
    }

    let activo = true;

    async function cargarEstadisticas() {
      try {
        setCargando(true);

        const empresaSnapshot = await getDoc(
          doc(db, "companies", empresaId!),
        );

        if (empresaSnapshot.exists()) {
          const empresa = empresaSnapshot.data() as EmpresaData;
          if (activo) {
            setPuedeVerBasicas(empresaTieneFuncion(empresa, "estadisticas_basicas"));
            setPuedeVerAvanzadas(empresaTieneFuncion(empresa, "estadisticas_avanzadas"));
            setPuedeVerIA(empresaTieneFuncion(empresa, "asistente_ia"));
            setPuedeVerProductos(empresaTieneFuncion(empresa, "productos"));
            setNombrePlan(obtenerNombrePlan(obtenerPlanEfectivo(empresa)));
          }
        }

        let eventosPagina: EventoPaginaData[] = [];
        try {
          const eventosSnapshot = await getDocs(collection(db, "companies", empresaId!, "analyticsEvents"));
          eventosPagina = eventosSnapshot.docs.map((d) => d.data() as EventoPaginaData);
        } catch (err) {
          console.warn("Analytics events bloqueados o no disponibles.", err);
        }

        let ordersDocs: OrderData[] = [];
        try {
          const ordersSnapshot = await getDocs(collection(db, "companies", empresaId!, "orders"));
          ordersDocs = ordersSnapshot.docs.map((d) => d.data() as OrderData);
        } catch (err) {
          console.warn("Orders bloqueadas o no disponibles.", err);
        }

        let chatsDocs: QueryDocumentSnapshot<DocumentData, DocumentData>[] = [];
        try {
          const chatsSnapshot = await getDocs(collection(db, "companies", empresaId!, "conversations"));
          chatsDocs = chatsSnapshot.docs;
        } catch (err) {
          console.warn("Conversations bloqueadas o no disponibles.", err);
        }

        const hoy = obtenerInicioDelDia(new Date());

        const actividadPagina: ActividadDia[] = Array.from(
          { length: 7 },
          (_, indice) => {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - (6 - indice));
            return {
              dia: formatearDia(fecha),
              fechaClave: claveFecha(fecha),
              visitas: 0,
              contactos: 0,
              reservas: 0,
              pedidos: 0,
            };
          },
        );

        const visitantesPaginaSet = new Set<string>();
        let visitasPagina = 0;
        let contactosPagina = 0;
        let reservasPagina = 0;
        let clicsWhatsApp = 0;

        eventosPagina.forEach((evento, indice) => {
          if (evento.tipo === "page_view") {
            visitasPagina += 1;
            visitantesPaginaSet.add(evento.visitanteId?.trim() || `visita-${indice}`);
          }

          if (evento.tipo === "lead_submit") {
            contactosPagina += 1;
          }

          if (evento.tipo === "appointment_created") {
            reservasPagina += 1;
          }

          if (evento.tipo === "whatsapp_click") {
            clicsWhatsApp += 1;
          }

          const fechaEvento = evento.createdAt?.toDate();
          if (!fechaEvento) return;

          const itemDia = actividadPagina.find(
            (item) => item.fechaClave === claveFecha(fechaEvento),
          );

          if (!itemDia) return;

          if (evento.tipo === "page_view") itemDia.visitas += 1;
          if (evento.tipo === "lead_submit") itemDia.contactos += 1;
          if (evento.tipo === "appointment_created") itemDia.reservas += 1;
        });

        let pedidosTotales = 0;
        let ingresosTotales = 0;

        ordersDocs.forEach((order) => {
          pedidosTotales += 1;
          ingresosTotales += (typeof order.total === "number" ? order.total : 0);

          const fechaOrder = order.createdAt?.toDate();
          if (fechaOrder) {
            const itemDia = actividadPagina.find(
              (item) => item.fechaClave === claveFecha(fechaOrder),
            );
            if (itemDia) {
              itemDia.pedidos += 1;
            }
          }
        });

        const tasaContactoPagina =
          visitasPagina > 0 ? (contactosPagina / visitasPagina) * 100 : 0;

        const tasaReservaPagina =
          visitasPagina > 0 ? (reservasPagina / visitasPagina) * 100 : 0;

        let abiertas = 0;
        let cerradas = 0;
        let atendidasIA = 0;
        let atendidasHumano = 0;
        let consultasSemana = 0;

        const resultadosMensajes = await Promise.all(
          chatsDocs.map(async (chatDocumento) => {
            const chat = chatDocumento.data() as ChatData;

            if (chat.estado === "cerrada") {
              cerradas += 1;
            } else {
              abiertas += 1;
            }

            if (chat.humanoActivo === true || chat.atendidoPor === "humano") {
              atendidasHumano += 1;
            } else {
              atendidasIA += 1;
            }

            const fechaChat = chat.createdAt?.toDate() || chat.updatedAt?.toDate();

            if (fechaChat) {
              const diferencia = hoy.getTime() - obtenerInicioDelDia(fechaChat).getTime();
              const dias = diferencia / (1000 * 60 * 60 * 24);
              if (dias >= 0 && dias <= 6) {
                consultasSemana += 1;
              }
            }

            let mensajes: MensajeData[] = [];
            try {
              const mensajesSnapshot = await getDocs(
                collection(db, "companies", empresaId!, "conversations", chatDocumento.id, "messages"),
              );
              mensajes = mensajesSnapshot.docs.map((d) => d.data() as MensajeData);
            } catch (err) {}

            return {
              tiempoRespuesta: obtenerTiempoPrimeraRespuesta(mensajes),
            };
          }),
        );

        const tiemposRespuesta = resultadosMensajes
          .map((resultado) => resultado.tiempoRespuesta)
          .filter((tiempo): tiempo is number => typeof tiempo === "number");

        const tiempoRespuestaPromedio =
          tiemposRespuesta.length > 0
            ? tiemposRespuesta.reduce((total, tiempo) => total + tiempo, 0) / tiemposRespuesta.length
            : null;

        if (!activo) return;

        const embudoBase: EmbudoPagina[] = [
          { etapa: "Visitas", cantidad: visitasPagina },
          { etapa: "Contactos", cantidad: contactosPagina },
          { etapa: "Pedidos", cantidad: pedidosTotales },
        ];

        setEstadisticas({
          visitasPagina,
          visitantesPagina: visitantesPaginaSet.size,
          contactosPagina,
          reservasPagina,
          clicsWhatsApp,
          tasaContactoPagina,
          tasaReservaPagina,
          pedidosTotales,
          ingresosTotales,
          totalConsultas: chatsDocs.length,
          consultasSemana,
          abiertas,
          cerradas,
          atendidasIA,
          atendidasHumano,
          tiempoRespuestaPromedio,
          actividadPagina,
          embudoPagina: embudoBase,
        });
      } catch (requestError) {
        console.error("Error al cargar estadísticas:", requestError);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarEstadisticas();

    return () => {
      activo = false;
    };
  }, [empresaId]);

  const porcentajeIA = useMemo(() => {
    if (estadisticas.totalConsultas === 0) return 0;
    return (estadisticas.atendidasIA / estadisticas.totalConsultas) * 100;
  }, [estadisticas.atendidasIA, estadisticas.totalConsultas]);

  const porcentajeHumano = useMemo(() => {
    if (estadisticas.totalConsultas === 0) return 0;
    return (estadisticas.atendidasHumano / estadisticas.totalConsultas) * 100;
  }, [estadisticas.atendidasHumano, estadisticas.totalConsultas]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-background px-3 py-3 text-foreground transition-colors sm:px-6 sm:py-4">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl sm:p-6">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
              Calculando estadísticas...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-foreground transition-colors sm:px-6 sm:py-4">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 sm:mb-6">
          <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 sm:text-xs">
            Rendimiento de tu negocio
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-3xl">
            Estadísticas
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 sm:px-2.5 sm:text-[10px]">
              {puedeVerAvanzadas ? "Métricas avanzadas activas" : "Métricas básicas"}
            </span>
            {nombrePlan && (
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 sm:text-xs">
                {nombrePlan}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
            {puedeVerAvanzadas
              ? "Analizá el rendimiento de tu página, ventas online y la actividad de tus clientes."
              : "Revisá las visitas a tu página, consultas y contactos generados."}
          </p>
        </div>

        {/* MÉTRICAS BÁSICAS DE TRÁFICO Y CONVERSIÓN */}
        <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <StatCardCompacta
            titulo="Visitas totales"
            valor={estadisticas.visitasPagina}
            descripcion="A la página pública"
          />
          <StatCardCompacta
            titulo="Visitantes únicos"
            valor={estadisticas.visitantesPagina}
            descripcion="Personas diferentes"
          />
          <StatCardCompacta
            titulo="Formularios recibidos"
            valor={estadisticas.contactosPagina}
            descripcion="Consultas y presupuestos"
          />
          <StatCardCompacta
            titulo="Clics en WhatsApp"
            valor={estadisticas.clicsWhatsApp}
            descripcion="Derivaciones directas"
          />
        </section>

        {/* MÓDULO E-COMMERCE */}
        {puedeVerProductos ? (
          <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3 lg:grid-cols-4">
            <StatCardDestacada
              titulo="Ingresos estimados"
              valor={formatoPrecio(estadisticas.ingresosTotales)}
              descripcion="A través de pedidos online"
              variante="exito"
            />
            <StatCardDestacada
              titulo="Pedidos recibidos"
              valor={estadisticas.pedidosTotales}
              descripcion="Procesados desde la web"
              variante="primario"
            />
            <StatCardCompacta
              titulo="Tasa de conversión"
              valor={`${(estadisticas.visitasPagina > 0 ? (estadisticas.pedidosTotales / estadisticas.visitasPagina) * 100 : 0).toFixed(1)}%`}
              descripcion="Pedidos sobre visitas"
            />
            <StatCardCompacta
              titulo="Ticket promedio"
              valor={formatoPrecio(estadisticas.pedidosTotales > 0 ? estadisticas.ingresosTotales / estadisticas.pedidosTotales : 0)}
              descripcion="Gasto promedio por pedido"
            />
          </section>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:mt-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      Métricas de Pedidos e Ingresos
                    </h3>
                    <Badge variant="info">
                      <Lock className="mr-1 h-3 w-3 inline" />
                      Plan Pro
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Medí tus ventas online, ingresos acumulados y ticket promedio contratando el <strong>Plan Pro</strong>.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/empresas/${empresaId}/planes`)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Ver planes
              </Button>
            </div>
          </div>
        )}

        {/* GRÁFICOS AVANZADOS (7 DÍAS Y EMBUDO) */}
        {puedeVerAvanzadas ? (
          <section className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl sm:p-5">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-sm font-bold text-slate-950 dark:text-white sm:text-lg">
                  Rendimiento de los últimos 7 días
                </h2>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs sm:leading-5">
                  Evolución de tráfico, contactos y pedidos.
                </p>
              </div>

              <div className="h-56 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={estadisticas.actividadPagina} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorContactos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAccion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="dia" stroke="var(--muted)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} dy={10} />
                    <YAxis allowDecimals={false} stroke="var(--muted)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      labelStyle={{ color: "var(--foreground)", fontWeight: "bold", marginBottom: "8px" }}
                      itemStyle={{ fontSize: "13px" }}
                    />
                    <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitas)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="contactos" name="Contactos" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorContactos)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAccion)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl sm:p-5">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-sm font-bold text-slate-950 dark:text-white sm:text-lg">
                  Embudo de conversión
                </h2>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs sm:leading-5">
                  Análisis del recorrido del cliente.
                </p>
              </div>

              <div className="h-48 w-full sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estadisticas.embudoPagina} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="etapa" stroke="var(--muted)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} dy={10} />
                    <YAxis allowDecimals={false} stroke="var(--muted)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: "var(--border)", opacity: 0.4 }}
                      contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}
                      labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                    />
                    <Bar dataKey="cantidad" name="Total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:mt-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      Gráficos de Evolución y Embudo
                    </h3>
                    <Badge variant="info">
                      <Lock className="mr-1 h-3 w-3 inline" />
                      Plan Pro
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Visualizá tendencias día por día y el embudo de conversión contratando <strong>Página Completa</strong>.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/empresas/${empresaId}/planes`)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Desbloquear gráficos
              </Button>
            </div>
          </div>
        )}

        {/* ASISTENTE IA */}
        {puedeVerIA ? (
          <section className="mt-3 sm:mt-4">
            <div className="mb-2 sm:mb-3">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white sm:text-lg">
                Actividad del Asistente Inteligente
              </h2>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs sm:leading-5">
                Control y métricas del chat dentro de tu página.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl sm:p-5">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Resumen titulo="Consultas totales" valor={estadisticas.totalConsultas} descripcion="Conversaciones del asistente" />
                  <Resumen titulo="Últimos 7 días" valor={estadisticas.consultasSemana} descripcion="Consultas recientes" />
                  <Resumen titulo="Abiertas" valor={estadisticas.abiertas} descripcion="Consultas activas" />
                  <Resumen titulo="Resueltas" valor={estadisticas.cerradas} descripcion="Consultas cerradas" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl sm:p-5">
                <div className="space-y-4 sm:space-y-6">
                  <BarraProgreso titulo="Atendidas por IA automática" valor={estadisticas.atendidasIA} porcentaje={porcentajeIA} color="bg-blue-500" />
                  <BarraProgreso titulo="Intervención humana" valor={estadisticas.atendidasHumano} porcentaje={porcentajeHumano} color="bg-violet-500" />
                  
                  <div className="pt-2">
                    <Resumen
                      titulo="Tiempo de primera respuesta"
                      valor={formatearTiempoRespuesta(estadisticas.tiempoRespuestaPromedio)}
                      descripcion="Promedio combinado (IA + Equipo)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:mt-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      Métricas del Asistente IA
                    </h3>
                    <Badge variant="info">
                      <Lock className="mr-1 h-3 w-3 inline" />
                      Business IA
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Activá tu agente de Inteligencia Artificial para monitorear conversaciones y respuestas automáticas.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/empresas/${empresaId}/planes`)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Conocer Business IA
              </Button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[9px] leading-4 text-slate-500 dark:text-zinc-600 sm:mt-6 sm:text-xs sm:text-center">
          Las métricas se calculan en base a la actividad registrada en la página pública de este negocio.
        </p>
      </div>
    </main>
  );
}

function StatCardDestacada({ titulo, valor, descripcion, variante }: { titulo: string; valor: string | number; descripcion: string; variante: "primario" | "exito" }) {
  const isExito = variante === "exito";
  return (
    <div className={`rounded-xl border p-4 shadow-sm sm:rounded-2xl sm:p-5 ${isExito ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${isExito ? "text-emerald-700 dark:text-emerald-400" : "text-blue-700 dark:text-blue-400"}`}>
        {titulo}
      </p>
      <p className={`mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl ${isExito ? "text-emerald-900 dark:text-emerald-300" : "text-blue-900 dark:text-blue-300"}`}>
        {valor}
      </p>
      <p className={`mt-1 text-[9px] sm:mt-2 sm:text-xs ${isExito ? "text-emerald-600 dark:text-emerald-500" : "text-blue-600 dark:text-blue-500"}`}>
        {descripcion}
      </p>
    </div>
  );
}

function StatCardCompacta({ titulo, valor, descripcion }: { titulo: string; valor: string | number; descripcion: string }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl sm:p-5">
      <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 sm:text-xs">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-bold leading-none text-slate-950 dark:text-white sm:mt-2 sm:text-2xl">
        {valor}
      </p>
      <p className="mt-1.5 line-clamp-2 text-[9px] leading-tight text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-[11px]">
        {descripcion}
      </p>
    </div>
  );
}

function Resumen({ titulo, valor, descripcion }: { titulo: string; valor: string | number; descripcion: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-xl sm:p-4">
      <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 sm:text-xs">
        {titulo}
      </p>
      <p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-2xl">
        {valor}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-slate-500 dark:text-zinc-500 sm:mt-1.5 sm:text-xs">
        {descripcion}
      </p>
    </div>
  );
}

function BarraProgreso({ titulo, valor, porcentaje, color = "bg-blue-500" }: { titulo: string; valor: number; porcentaje: number; color?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-2 sm:gap-3">
        <p className="text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
          {titulo}
        </p>
        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 sm:text-xs">
          {valor} <span className="font-normal opacity-70">({porcentaje.toFixed(1)}%)</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800 sm:h-2.5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
        />
      </div>
    </div>
  );
}