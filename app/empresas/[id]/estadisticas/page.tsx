"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
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
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type GraficoDia = {
  dia: string;
  conversaciones: number;
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

export default function EstadisticasPage() {
  const params = useParams();
  const empresaId = Object.values(params)[0] as string;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [totalChats, setTotalChats] = useState(0);
  const [totalMensajes, setTotalMensajes] = useState(0);
  const [conversacionesHoy, setConversacionesHoy] = useState(0);
  const [visitantesUnicos, setVisitantesUnicos] = useState(0);
  const [datosGrafico, setDatosGrafico] = useState<GraficoDia[]>([]);

  useEffect(() => {
    async function cargarEstadisticas() {
      try {
        setCargando(true);
        setError("");

        const chatsQuery = query(
          collection(db, "chats"),
          where("empresaId", "==", empresaId)
        );

        const chatsSnapshot = await getDocs(chatsQuery);

        setTotalChats(chatsSnapshot.size);

        const hoy = obtenerInicioDelDia(new Date());
        const visitantes = new Set<string>();

        const ultimosSieteDias = Array.from({ length: 7 }, (_, indice) => {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() - (6 - indice));

          return {
            fecha,
            dia: formatearDia(fecha),
            conversaciones: 0,
          };
        });

        let mensajesAcumulados = 0;
        let chatsDeHoy = 0;

        for (const chatDocumento of chatsSnapshot.docs) {
          const chat = chatDocumento.data() as ChatData;

          if (chat.userId) {
            visitantes.add(chat.userId);
          }

          if (chat.createdAt) {
            const fechaChat = obtenerInicioDelDia(chat.createdAt.toDate());

            if (fechaChat.getTime() === hoy.getTime()) {
              chatsDeHoy += 1;
            }

            const diaEncontrado = ultimosSieteDias.find(
              (item) => item.fecha.getTime() === fechaChat.getTime()
            );

            if (diaEncontrado) {
              diaEncontrado.conversaciones += 1;
            }
          }

          const mensajesSnapshot = await getDocs(
            collection(db, "chats", chatDocumento.id, "messages")
          );

          mensajesAcumulados += mensajesSnapshot.size;
        }

        setTotalMensajes(mensajesAcumulados);
        setConversacionesHoy(chatsDeHoy);
        setVisitantesUnicos(visitantes.size);
        setDatosGrafico(
          ultimosSieteDias.map(({ dia, conversaciones }) => ({
            dia,
            conversaciones,
          }))
        );
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setCargando(false);
      }
    }

    if (!empresaId) {
      setCargando(false);
      setError("No se encontró la empresa.");
      return;
    }

    cargarEstadisticas();
  }, [empresaId]);

  const promedioMensajes = useMemo(() => {
    if (totalChats === 0) {
      return "0";
    }

    return (totalMensajes / totalChats).toFixed(1);
  }, [totalChats, totalMensajes]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            Cargando estadísticas...
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
            Panel de rendimiento
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Estadísticas
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Revisá la actividad del agente, las conversaciones y el uso del
            widget.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Conversaciones de hoy"
            valor={conversacionesHoy}
            descripcion="Iniciadas desde las 00:00"
          />

          <StatCard
            titulo="Conversaciones totales"
            valor={totalChats}
            descripcion="Historial completo"
          />

          <StatCard
            titulo="Mensajes totales"
            valor={totalMensajes}
            descripcion="Clientes y respuestas de la IA"
          />

          <StatCard
            titulo="Visitantes únicos"
            valor={visitantesUnicos}
            descripcion="Usuarios distintos detectados"
          />
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

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
                      border: "1px solid #3f3f46",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                    itemStyle={{ color: "#60a5fa" }}
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
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm text-zinc-500">
                  Promedio de mensajes
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {promedioMensajes}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Por conversación
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm text-zinc-500">
                  Conversaciones esta semana
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {datosGrafico.reduce(
                    (total, item) => total + item.conversaciones,
                    0
                  )}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Últimos siete días
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm text-zinc-500">
                  Estado del agente
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <p className="font-medium text-emerald-400">
                    Activo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}