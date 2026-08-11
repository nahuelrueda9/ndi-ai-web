"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { db } from "@/lib/firebase";
import StatCard from "@/components/dashboard/StatCard";

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

type ActividadDia = {
  dia: string;
  fechaClave: string;
  visitas: number;
  contactos: number;
  reservas: number;
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

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [estadisticas, setEstadisticas] =
    useState<EstadisticasCalculadas>(
      ESTADISTICAS_INICIALES,
    );

  useEffect(() => {
    if (!empresaId) {
      setCargando(false);
      setError("No se encontró la empresa.");
      return;
    }

    let activo = true;

    async function cargarEstadisticas() {
      try {
        setCargando(true);
        setError("");

        const [
          chatsSnapshot,
          eventosPaginaSnapshot,
        ] = await Promise.all([
          getDocs(
            collection(
              db,
              "companies",
              empresaId!,
              "conversations",
            ),
          ),
          getDocs(
            collection(
              db,
              "companies",
              empresaId!,
              "analyticsEvents",
            ),
          ),
        ]);

        const hoy =
          obtenerInicioDelDia(new Date());

        const actividadPagina: ActividadDia[] =
          Array.from(
            { length: 7 },
            (_, indice) => {
              const fecha = new Date(hoy);

              fecha.setDate(
                hoy.getDate() - (6 - indice),
              );

              return {
                dia: formatearDia(fecha),
                fechaClave: claveFecha(fecha),
                visitas: 0,
                contactos: 0,
                reservas: 0,
              };
            },
          );

        const eventosPagina =
          eventosPaginaSnapshot.docs.map(
            (documento) =>
              documento.data() as EventoPaginaData,
          );

        const visitantesPaginaSet =
          new Set<string>();

        let visitasPagina = 0;
        let contactosPagina = 0;
        let reservasPagina = 0;
        let clicsWhatsApp = 0;

        eventosPagina.forEach(
          (evento, indice) => {
            if (
              evento.tipo === "page_view"
            ) {
              visitasPagina += 1;

              visitantesPaginaSet.add(
                evento.visitanteId?.trim() ||
                  `visita-${indice}`,
              );
            }

            if (
              evento.tipo === "lead_submit"
            ) {
              contactosPagina += 1;
            }

            if (
              evento.tipo ===
              "appointment_created"
            ) {
              reservasPagina += 1;
            }

            if (
              evento.tipo === "whatsapp_click"
            ) {
              clicsWhatsApp += 1;
            }

            const fechaEvento =
              evento.createdAt?.toDate();

            if (!fechaEvento) {
              return;
            }

            const itemDia =
              actividadPagina.find(
                (item) =>
                  item.fechaClave ===
                  claveFecha(fechaEvento),
              );

            if (!itemDia) {
              return;
            }

            if (
              evento.tipo === "page_view"
            ) {
              itemDia.visitas += 1;
            }

            if (
              evento.tipo === "lead_submit"
            ) {
              itemDia.contactos += 1;
            }

            if (
              evento.tipo ===
              "appointment_created"
            ) {
              itemDia.reservas += 1;
            }
          },
        );

        const tasaContactoPagina =
          visitasPagina > 0
            ? (contactosPagina /
                visitasPagina) *
              100
            : 0;

        const tasaReservaPagina =
          visitasPagina > 0
            ? (reservasPagina /
                visitasPagina) *
              100
            : 0;

        let abiertas = 0;
        let cerradas = 0;
        let atendidasIA = 0;
        let atendidasHumano = 0;
        let consultasSemana = 0;

        const resultadosMensajes =
          await Promise.all(
            chatsSnapshot.docs.map(
              async (chatDocumento) => {
                const chat =
                  chatDocumento.data() as ChatData;

                if (
                  chat.estado === "cerrada"
                ) {
                  cerradas += 1;
                } else {
                  abiertas += 1;
                }

                if (
                  chat.humanoActivo === true ||
                  chat.atendidoPor === "humano"
                ) {
                  atendidasHumano += 1;
                } else {
                  atendidasIA += 1;
                }

                const fechaChat =
                  chat.createdAt?.toDate() ||
                  chat.updatedAt?.toDate();

                if (fechaChat) {
                  const diferencia =
                    hoy.getTime() -
                    obtenerInicioDelDia(
                      fechaChat,
                    ).getTime();

                  const dias =
                    diferencia /
                    (1000 * 60 * 60 * 24);

                  if (
                    dias >= 0 &&
                    dias <= 6
                  ) {
                    consultasSemana += 1;
                  }
                }

                const mensajesSnapshot =
                  await getDocs(
                    collection(
                      db,
                      "companies",
                      empresaId!,
                      "conversations",
                      chatDocumento.id,
                      "messages",
                    ),
                  );

                const mensajes =
                  mensajesSnapshot.docs.map(
                    (documento) =>
                      documento.data() as MensajeData,
                  );

                return {
                  tiempoRespuesta:
                    obtenerTiempoPrimeraRespuesta(
                      mensajes,
                    ),
                };
              },
            ),
          );

        const tiemposRespuesta =
          resultadosMensajes
            .map(
              (resultado) =>
                resultado.tiempoRespuesta,
            )
            .filter(
              (
                tiempo,
              ): tiempo is number =>
                typeof tiempo === "number",
            );

        const tiempoRespuestaPromedio =
          tiemposRespuesta.length > 0
            ? tiemposRespuesta.reduce(
                (total, tiempo) =>
                  total + tiempo,
                0,
              ) /
              tiemposRespuesta.length
            : null;

        if (!activo) {
          return;
        }

        setEstadisticas({
          visitasPagina,
          visitantesPagina:
            visitantesPaginaSet.size,
          contactosPagina,
          reservasPagina,
          clicsWhatsApp,
          tasaContactoPagina,
          tasaReservaPagina,

          totalConsultas:
            chatsSnapshot.size,
          consultasSemana,
          abiertas,
          cerradas,
          atendidasIA,
          atendidasHumano,
          tiempoRespuestaPromedio,

          actividadPagina,
          embudoPagina: [
            {
              etapa: "Visitas",
              cantidad: visitasPagina,
            },
            {
              etapa: "Contactos",
              cantidad: contactosPagina,
            },
            {
              etapa: "Reservas",
              cantidad: reservasPagina,
            },
          ],
        });
      } catch (requestError) {
        console.error(
          "Error al cargar estadísticas:",
          requestError,
        );

        if (activo) {
          setError(
            "No se pudieron cargar las estadísticas.",
          );
        }
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
    if (
      estadisticas.totalConsultas === 0
    ) {
      return 0;
    }

    return (
      (estadisticas.atendidasIA /
        estadisticas.totalConsultas) *
      100
    );
  }, [
    estadisticas.atendidasIA,
    estadisticas.totalConsultas,
  ]);

  const porcentajeHumano =
    useMemo(() => {
      if (
        estadisticas.totalConsultas === 0
      ) {
        return 0;
      }

      return (
        (estadisticas.atendidasHumano /
          estadisticas.totalConsultas) *
        100
      );
    }, [
      estadisticas.atendidasHumano,
      estadisticas.totalConsultas,
    ]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground transition-colors">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

            <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
              Calculando estadísticas...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground transition-colors">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground transition-colors sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Rendimiento de tu página
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">
            Estadísticas
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-400 sm:text-base">
            Medí cuántas personas visitan tu página,
            cuántas dejan una consulta y cuántas terminan reservando.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Visitas"
            valor={estadisticas.visitasPagina}
            descripcion="A la página pública"
          />

          <StatCard
            titulo="Visitantes únicos"
            valor={estadisticas.visitantesPagina}
            descripcion="Personas registradas"
          />

          <StatCard
            titulo="Contactos"
            valor={estadisticas.contactosPagina}
            descripcion="Formularios enviados"
          />

          <StatCard
            titulo="Reservas"
            valor={estadisticas.reservasPagina}
            descripcion="Turnos generados online"
          />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Tasa de contacto"
            valor={`${estadisticas.tasaContactoPagina.toFixed(
              1,
            )}%`}
            descripcion="Contactos sobre visitas"
          />

          <StatCard
            titulo="Tasa de reserva"
            valor={`${estadisticas.tasaReservaPagina.toFixed(
              1,
            )}%`}
            descripcion="Reservas sobre visitas"
          />

          <StatCard
            titulo="Clics en WhatsApp"
            valor={estadisticas.clicsWhatsApp}
            descripcion="Desde tu página pública"
          />

          <StatCard
            titulo="Consultas al asistente"
            valor={estadisticas.totalConsultas}
            descripcion="Conversaciones del widget"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Últimos 7 días
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Actividad de la página
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
                Visitas, contactos y reservas generadas por día.
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={
                    estadisticas.actividadPagina
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />

                  <XAxis
                    dataKey="dia"
                    stroke="var(--muted)"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="var(--muted)"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        "var(--surface)",
                      border:
                        "1px solid var(--border)",
                      borderRadius: "12px",
                    }}
                    labelStyle={{
                      color:
                        "var(--foreground)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="visitas"
                    name="Visitas"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="contactos"
                    name="Contactos"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="reservas"
                    name="Reservas"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Conversión
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Embudo de la página
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
              El recorrido desde una visita hasta una reserva.
            </p>

            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    estadisticas.embudoPagina
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />

                  <XAxis
                    dataKey="etapa"
                    stroke="var(--muted)"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="var(--muted)"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        "var(--surface)",
                      border:
                        "1px solid var(--border)",
                      borderRadius: "12px",
                    }}
                    labelStyle={{
                      color:
                        "var(--foreground)",
                    }}
                  />

                  <Bar
                    dataKey="cantidad"
                    name="Cantidad"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Asistente web
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Actividad de consultas
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
              Esta información queda como apoyo para controlar
              qué está pasando dentro del chat de tu página.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Resumen
                  titulo="Consultas totales"
                  valor={
                    estadisticas.totalConsultas
                  }
                  descripcion="Conversaciones del asistente"
                />

                <Resumen
                  titulo="Últimos 7 días"
                  valor={
                    estadisticas.consultasSemana
                  }
                  descripcion="Consultas recientes"
                />

                <Resumen
                  titulo="Abiertas"
                  valor={estadisticas.abiertas}
                  descripcion="Consultas activas"
                />

                <Resumen
                  titulo="Resueltas"
                  valor={estadisticas.cerradas}
                  descripcion="Consultas cerradas"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <div className="space-y-7">
                <BarraProgreso
                  titulo="Atendidas por IA"
                  valor={
                    estadisticas.atendidasIA
                  }
                  porcentaje={porcentajeIA}
                />

                <BarraProgreso
                  titulo="Atendidas por humano"
                  valor={
                    estadisticas.atendidasHumano
                  }
                  porcentaje={
                    porcentajeHumano
                  }
                />

                <Resumen
                  titulo="Primera respuesta"
                  valor={formatearTiempoRespuesta(
                    estadisticas.tiempoRespuestaPromedio,
                  )}
                  descripcion="Promedio del asistente o del equipo"
                />
              </div>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs leading-5 text-slate-500 dark:text-zinc-600">
          Las métricas principales se calculan con la actividad
          registrada en la página pública de este negocio.
        </p>
      </div>
    </main>
  );
}

function Resumen({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: string | number;
  descripcion: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-slate-500 dark:text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
        {descripcion}
      </p>
    </div>
  );
}

function BarraProgreso({
  titulo,
  valor,
  porcentaje,
}: {
  titulo: string;
  valor: number;
  porcentaje: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
          {titulo}
        </p>

        <p className="text-sm text-slate-500 dark:text-zinc-500">
          {valor} · {porcentaje.toFixed(1)}%
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, porcentaje),
            )}%`,
          }}
        />
      </div>
    </div>
  );
}