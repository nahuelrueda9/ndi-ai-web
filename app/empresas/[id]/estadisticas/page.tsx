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

type Canal =
  | "web"
  | "whatsapp"
  | "instagram"
  | "messenger";

type EstadoComercial =
  | "nuevo"
  | "calificado"
  | "propuesta"
  | "ganado"
  | "perdido";

type ChatData = {
  visitanteId?: string;
  userId?: string;
  canal?: string;
  channel?: string;
  origen?: string;
  source?: string;
  plataforma?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  email?: string;
  telefono?: string;
  nivelInteres?: "bajo" | "medio" | "alto";
  puntuacionLead?: number;
  estadoComercial?: EstadoComercial;
  valorEstimado?: number;
  fechaConversion?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type MensajeData = {
  role?: "user" | "assistant";
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: Timestamp;
};

type GraficoDia = {
  dia: string;
  conversaciones: number;
};

type CanalGrafico = {
  canal: string;
  conversaciones: number;
};

type EmbudoGrafico = {
  etapa: string;
  oportunidades: number;
};

type EstadisticasCalculadas = {
  totalChats: number;
  totalMensajes: number;
  conversacionesHoy: number;
  visitantesUnicos: number;
  conversacionesSemana: number;
  promedioMensajes: number;
  abiertas: number;
  cerradas: number;
  atendidasIA: number;
  atendidasHumano: number;
  leadsIdentificados: number;
  leadsAltoInteres: number;
  tasaCaptura: number;
  tiempoRespuestaPromedio: number | null;
  nuevos: number;
  calificados: number;
  propuestas: number;
  ganados: number;
  perdidos: number;
  tasaConversion: number;
  tasaCierre: number;
  ingresosGanados: number;
  pipelineEstimado: number;
  ticketPromedio: number;
  datosGrafico: GraficoDia[];
  datosCanales: CanalGrafico[];
  datosEmbudo: EmbudoGrafico[];
};

const ESTADISTICAS_INICIALES: EstadisticasCalculadas = {
  totalChats: 0,
  totalMensajes: 0,
  conversacionesHoy: 0,
  visitantesUnicos: 0,
  conversacionesSemana: 0,
  promedioMensajes: 0,
  abiertas: 0,
  cerradas: 0,
  atendidasIA: 0,
  atendidasHumano: 0,
  leadsIdentificados: 0,
  leadsAltoInteres: 0,
  tasaCaptura: 0,
  tiempoRespuestaPromedio: null,
  nuevos: 0,
  calificados: 0,
  propuestas: 0,
  ganados: 0,
  perdidos: 0,
  tasaConversion: 0,
  tasaCierre: 0,
  ingresosGanados: 0,
  pipelineEstimado: 0,
  ticketPromedio: 0,
  datosGrafico: [],
  datosCanales: [],
  datosEmbudo: [],
};

function obtenerInicioDelDia(fecha: Date) {
  const resultado = new Date(fecha);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function formatearDia(fecha: Date) {
  return fecha.toLocaleDateString("es-AR", {
    weekday: "short",
  });
}

function normalizarCanal(valor?: string): Canal {
  const canal = valor?.trim().toLowerCase();

  if (canal === "whatsapp" || canal === "wa") {
    return "whatsapp";
  }

  if (canal === "instagram" || canal === "ig") {
    return "instagram";
  }

  if (
    canal === "messenger" ||
    canal === "facebook" ||
    canal === "facebook_messenger"
  ) {
    return "messenger";
  }

  return "web";
}

function obtenerCanal(chat: ChatData) {
  return normalizarCanal(
    chat.canal ||
      chat.channel ||
      chat.origen ||
      chat.source ||
      chat.plataforma
  );
}

function obtenerNombreCanal(canal: Canal) {
  if (canal === "whatsapp") return "WhatsApp";
  if (canal === "instagram") return "Instagram";
  if (canal === "messenger") return "Messenger";
  return "Web";
}

function obtenerTiempoPrimeraRespuesta(
  mensajes: MensajeData[]
): number | null {
  const ordenados = mensajes
    .filter((mensaje) => mensaje.createdAt)
    .sort(
      (a, b) =>
        (a.createdAt?.toMillis() ?? 0) -
        (b.createdAt?.toMillis() ?? 0)
    );

  const indicePrimerCliente = ordenados.findIndex(
    (mensaje) =>
      mensaje.role === "user" ||
      mensaje.enviadoPor === "cliente"
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
        mensaje.enviadoPor === "humano"
    );

  if (!primerCliente.createdAt || !primeraRespuesta?.createdAt) {
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

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatearTiempoRespuesta(minutos: number | null) {
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
  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasCalculadas>(
      ESTADISTICAS_INICIALES
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

        const chatsSnapshot = await getDocs(
          collection(
            db,
            "companies",
            empresaId!,
            "conversations"
          )
        );

        const hoy = obtenerInicioDelDia(new Date());
        const visitantes = new Set<string>();

        const ultimosSieteDias = Array.from(
          { length: 7 },
          (_, indice) => {
            const fecha = new Date(hoy);
            fecha.setDate(
              hoy.getDate() - (6 - indice)
            );

            return {
              fecha,
              dia: formatearDia(fecha),
              conversaciones: 0,
            };
          }
        );

        const canales: Record<Canal, number> = {
          web: 0,
          whatsapp: 0,
          instagram: 0,
          messenger: 0,
        };

        const etapasComerciales: Record<
          EstadoComercial,
          number
        > = {
          nuevo: 0,
          calificado: 0,
          propuesta: 0,
          ganado: 0,
          perdido: 0,
        };

        let ingresosGanados = 0;
        let pipelineEstimado = 0;
        let conversacionesHoy = 0;
        let abiertas = 0;
        let cerradas = 0;
        let atendidasIA = 0;
        let atendidasHumano = 0;
        let leadsIdentificados = 0;
        let leadsAltoInteres = 0;

        const resultadosMensajes = await Promise.all(
          chatsSnapshot.docs.map(async (chatDocumento) => {
            const chat =
              chatDocumento.data() as ChatData;

            const visitante =
              chat.visitanteId ||
              chat.userId ||
              chatDocumento.id;

            visitantes.add(visitante);

            const canal = obtenerCanal(chat);
            canales[canal] += 1;

            if (chat.estado === "cerrada") {
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

            if (
              Boolean(chat.email?.trim()) ||
              Boolean(chat.telefono?.trim())
            ) {
              leadsIdentificados += 1;
            }

            if (
              chat.nivelInteres === "alto" ||
              (chat.puntuacionLead ?? 0) >= 70
            ) {
              leadsAltoInteres += 1;
            }

            const estadoComercial =
              chat.estadoComercial ?? "nuevo";

            etapasComerciales[estadoComercial] += 1;

            const valorEstimado =
              typeof chat.valorEstimado === "number" &&
              Number.isFinite(chat.valorEstimado) &&
              chat.valorEstimado > 0
                ? chat.valorEstimado
                : 0;

            if (estadoComercial === "ganado") {
              ingresosGanados += valorEstimado;
            } else if (estadoComercial !== "perdido") {
              pipelineEstimado += valorEstimado;
            }

            if (chat.createdAt) {
              const fechaChat = obtenerInicioDelDia(
                chat.createdAt.toDate()
              );

              if (
                fechaChat.getTime() === hoy.getTime()
              ) {
                conversacionesHoy += 1;
              }

              const diaEncontrado =
                ultimosSieteDias.find(
                  (item) =>
                    item.fecha.getTime() ===
                    fechaChat.getTime()
                );

              if (diaEncontrado) {
                diaEncontrado.conversaciones += 1;
              }
            }

            const mensajesSnapshot = await getDocs(
              collection(
                db,
                "companies",
                empresaId!,
                "conversations",
                chatDocumento.id,
                "messages"
              )
            );

            const mensajes =
              mensajesSnapshot.docs.map(
                (documento) =>
                  documento.data() as MensajeData
              );

            return {
              cantidadMensajes:
                mensajesSnapshot.size,
              tiempoRespuesta:
                obtenerTiempoPrimeraRespuesta(
                  mensajes
                ),
            };
          })
        );

        const totalMensajes =
          resultadosMensajes.reduce(
            (total, resultado) =>
              total +
              resultado.cantidadMensajes,
            0
          );

        const tiemposRespuesta =
          resultadosMensajes
            .map(
              (resultado) =>
                resultado.tiempoRespuesta
            )
            .filter(
              (
                tiempo
              ): tiempo is number =>
                typeof tiempo === "number"
            );

        const tiempoRespuestaPromedio =
          tiemposRespuesta.length > 0
            ? tiemposRespuesta.reduce(
                (total, tiempo) =>
                  total + tiempo,
                0
              ) / tiemposRespuesta.length
            : null;

        const totalChats = chatsSnapshot.size;

        const conversacionesSemana =
          ultimosSieteDias.reduce(
            (total, item) =>
              total + item.conversaciones,
            0
          );

        const promedioMensajes =
          totalChats > 0
            ? totalMensajes / totalChats
            : 0;

        const tasaCaptura =
          totalChats > 0
            ? (leadsIdentificados /
                totalChats) *
              100
            : 0;

        const nuevos =
          etapasComerciales.nuevo;
        const calificados =
          etapasComerciales.calificado;
        const propuestas =
          etapasComerciales.propuesta;
        const ganados =
          etapasComerciales.ganado;
        const perdidos =
          etapasComerciales.perdido;

        const tasaConversion =
          totalChats > 0
            ? (ganados / totalChats) * 100
            : 0;

        const oportunidadesCerradas =
          ganados + perdidos;

        const tasaCierre =
          oportunidadesCerradas > 0
            ? (ganados /
                oportunidadesCerradas) *
              100
            : 0;

        const ticketPromedio =
          ganados > 0
            ? ingresosGanados / ganados
            : 0;

        const datosEmbudo: EmbudoGrafico[] = [
          {
            etapa: "Nuevos",
            oportunidades: nuevos,
          },
          {
            etapa: "Calificados",
            oportunidades: calificados,
          },
          {
            etapa: "Propuestas",
            oportunidades: propuestas,
          },
          {
            etapa: "Ganados",
            oportunidades: ganados,
          },
          {
            etapa: "Perdidos",
            oportunidades: perdidos,
          },
        ];

        const datosCanales: CanalGrafico[] = (
          Object.keys(canales) as Canal[]
        ).map((canal) => ({
          canal: obtenerNombreCanal(canal),
          conversaciones: canales[canal],
        }));

        if (!activo) {
          return;
        }

        setEstadisticas({
          totalChats,
          totalMensajes,
          conversacionesHoy,
          visitantesUnicos:
            visitantes.size,
          conversacionesSemana,
          promedioMensajes,
          abiertas,
          cerradas,
          atendidasIA,
          atendidasHumano,
          leadsIdentificados,
          leadsAltoInteres,
          tasaCaptura,
          tiempoRespuestaPromedio,
          nuevos,
          calificados,
          propuestas,
          ganados,
          perdidos,
          tasaConversion,
          tasaCierre,
          ingresosGanados,
          pipelineEstimado,
          ticketPromedio,
          datosGrafico:
            ultimosSieteDias.map(
              ({
                dia,
                conversaciones,
              }) => ({
                dia,
                conversaciones,
              })
            ),
          datosCanales,
          datosEmbudo,
        });
      } catch (requestError) {
        console.error(
          "Error al cargar estadísticas:",
          requestError
        );

        if (activo) {
          setError(
            "No se pudieron cargar las estadísticas."
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
    if (estadisticas.totalChats === 0) {
      return 0;
    }

    return (
      (estadisticas.atendidasIA /
        estadisticas.totalChats) *
      100
    );
  }, [
    estadisticas.atendidasIA,
    estadisticas.totalChats,
  ]);

  const porcentajeHumano = useMemo(() => {
    if (estadisticas.totalChats === 0) {
      return 0;
    }

    return (
      (estadisticas.atendidasHumano /
        estadisticas.totalChats) *
      100
    );
  }, [
    estadisticas.atendidasHumano,
    estadisticas.totalChats,
  ]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

            <p className="mt-4 text-sm text-zinc-400">
              Calculando estadísticas...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-900 bg-red-950/40 p-6 text-red-300">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-400">
            Rendimiento comercial
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Medí conversaciones, canales, leads y
            rendimiento del agente.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Ventas ganadas"
            valor={estadisticas.ganados}
            descripcion="Oportunidades convertidas"
          />

          <StatCard
            titulo="Ingresos ganados"
            valor={formatearMoneda(
              estadisticas.ingresosGanados
            )}
            descripcion="Valor estimado de ventas"
          />

          <StatCard
            titulo="Conversión"
            valor={`${estadisticas.tasaConversion.toFixed(
              1
            )}%`}
            descripcion="Ganadas sobre conversaciones"
          />

          <StatCard
            titulo="Pipeline abierto"
            valor={formatearMoneda(
              estadisticas.pipelineEstimado
            )}
            descripcion="Valor de oportunidades activas"
          />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Ventas perdidas"
            valor={estadisticas.perdidos}
            descripcion="Oportunidades no concretadas"
          />

          <StatCard
            titulo="Leads identificados"
            valor={
              estadisticas.leadsIdentificados
            }
            descripcion="Con email o teléfono"
          />

          <StatCard
            titulo="Conversaciones de hoy"
            valor={
              estadisticas.conversacionesHoy
            }
            descripcion="Iniciadas desde las 00:00"
          />

          <StatCard
            titulo="Respuesta promedio"
            valor={formatearTiempoRespuesta(
              estadisticas.tiempoRespuestaPromedio
            )}
            descripcion="Primera respuesta del agente"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm text-zinc-400">
                Proceso comercial
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Embudo de oportunidades
              </h2>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    estadisticas.datosEmbudo
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                  />

                  <XAxis
                    dataKey="etapa"
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border:
                        "1px solid #3f3f46",
                      borderRadius: "12px",
                    }}
                    labelStyle={{
                      color: "#ffffff",
                    }}
                  />

                  <Bar
                    dataKey="oportunidades"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <p className="text-sm text-zinc-400">
              Ventas
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Rendimiento comercial
            </h2>

            <div className="mt-6 space-y-4">
              <Resumen
                titulo="Tasa de cierre"
                valor={`${estadisticas.tasaCierre.toFixed(
                  1
                )}%`}
                descripcion="Ganadas sobre cerradas"
              />

              <Resumen
                titulo="Ticket promedio"
                valor={formatearMoneda(
                  estadisticas.ticketPromedio
                )}
                descripcion="Promedio de ventas ganadas"
              />

              <Resumen
                titulo="Propuestas enviadas"
                valor={estadisticas.propuestas}
                descripcion="Oportunidades en negociación"
              />

              <Resumen
                titulo="Leads calificados"
                valor={estadisticas.calificados}
                descripcion="Oportunidades con potencial"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm text-zinc-400">
                Actividad reciente
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Conversaciones de los últimos 7 días
              </h2>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={
                    estadisticas.datosGrafico
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                  />

                  <XAxis
                    dataKey="dia"
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border:
                        "1px solid #3f3f46",
                      borderRadius: "12px",
                    }}
                    labelStyle={{
                      color: "#ffffff",
                    }}
                    itemStyle={{
                      color: "#60a5fa",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="conversaciones"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <p className="text-sm text-zinc-400">
              Resumen
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Rendimiento general
            </h2>

            <div className="mt-6 space-y-4">
              <Resumen
                titulo="Promedio de mensajes"
                valor={estadisticas.promedioMensajes.toFixed(
                  1
                )}
                descripcion="Por conversación"
              />

              <Resumen
                titulo="Conversaciones esta semana"
                valor={
                  estadisticas.conversacionesSemana
                }
                descripcion="Últimos siete días"
              />

              <Resumen
                titulo="Tasa de captura"
                valor={`${estadisticas.tasaCaptura.toFixed(
                  1
                )}%`}
                descripcion="Conversaciones con datos de contacto"
              />

              <Resumen
                titulo="Leads de interés alto"
                valor={
                  estadisticas.leadsAltoInteres
                }
                descripcion="Puntuación 70+ o interés alto"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm text-zinc-400">
                Distribución
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Conversaciones por canal
              </h2>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    estadisticas.datosCanales
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                  />

                  <XAxis
                    dataKey="canal"
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border:
                        "1px solid #3f3f46",
                      borderRadius: "12px",
                    }}
                    labelStyle={{
                      color: "#ffffff",
                    }}
                  />

                  <Bar
                    dataKey="conversaciones"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <p className="text-sm text-zinc-400">
              Atención
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              IA frente a operadores
            </h2>

            <div className="mt-8 space-y-7">
              <BarraProgreso
                titulo="Atendidas por IA"
                valor={estadisticas.atendidasIA}
                porcentaje={porcentajeIA}
              />

              <BarraProgreso
                titulo="Atendidas por humano"
                valor={
                  estadisticas.atendidasHumano
                }
                porcentaje={porcentajeHumano}
              />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Resumen
                  titulo="Abiertas"
                  valor={estadisticas.abiertas}
                  descripcion="Conversaciones activas"
                />

                <Resumen
                  titulo="Cerradas"
                  valor={estadisticas.cerradas}
                  descripcion="Conversaciones finalizadas"
                />
              </div>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs leading-5 text-zinc-600">
          Los ingresos, el pipeline y el ticket promedio
          se calculan usando el valor estimado guardado
          en cada conversación.
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {valor}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
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
        <p className="text-sm font-medium text-zinc-300">
          {titulo}
        </p>

        <p className="text-sm text-zinc-500">
          {valor} · {porcentaje.toFixed(1)}%
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, porcentaje)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}