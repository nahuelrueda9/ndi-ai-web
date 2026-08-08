"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import Card from "@/components/Ui/Card";

import MetricCard from "../components/MetricCard";
import QuickAccessCard from "../components/QuickAccessCard";
import DashboardChart from "../components/DashboardChart";
import LeadsCard from "../components/LeadsCard";
import RecentConversationCard from "../components/RecentConversationCard";
import PlanUsageCard from "@/components/dashboard/PlanUsageCard";

type Conversacion = {
  id: string;
  visitanteId?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  ultimoMensaje?: string;
  email?: string;
  telefono?: string;
  puntuacionLead?: number;
  nivelInteres?: "bajo" | "medio" | "alto";
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
};

type DiaGrafico = {
  dia: string;
  cantidad: number;
};

type PlanId = "free" | "pro" | "business";

type EmpresaPlan = {
  plan?: PlanId;
  subscriptionEndsAt?: unknown;
};

function convertirFecha(valor: unknown) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate?: unknown }).toDate === "function"
  ) {
    return (
      valor as {
        toDate: () => Date;
      }
    ).toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha = new Date(valor);

    if (!Number.isNaN(fecha.getTime())) {
      return fecha;
    }
  }

  return null;
}

export default function DashboardEmpresaPage() {
  const params = useParams();
  const router = useRouter();

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [conversaciones, setConversaciones] =
    useState<Conversacion[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [empresaPlan, setEmpresaPlan] =
    useState<EmpresaPlan | null>(null);

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró el ID de la empresa.");
      setLoading(false);
      return;
    }

    const conversacionesQuery = query(
      collection(
        db,
        "companies",
        empresaId,
        "conversations"
      ),
      orderBy("updatedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      conversacionesQuery,
      (snapshot) => {
        const conversacionesCargadas =
          snapshot.docs.map((documento) => {
            const datos = documento.data();

            return {
              ...datos,
              id: documento.id,
            } as Conversacion;
          });

        setConversaciones(conversacionesCargadas);
        setError("");
        setLoading(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar el dashboard:",
          firebaseError
        );

        setError(
          "No se pudieron cargar las métricas."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(
        db,
        "companies",
        empresaId
      ),
      (snapshot) => {
        if (!snapshot.exists()) {
          setEmpresaPlan(null);
          return;
        }

        setEmpresaPlan(
          snapshot.data() as EmpresaPlan
        );
      },
      (firebaseError) => {
        console.error(
          "Error al cargar el plan para publicidad:",
          firebaseError
        );
      }
    );

    return () => unsubscribe();
  }, [empresaId]);

  const planGuardado: PlanId =
    empresaPlan?.plan === "pro" ||
    empresaPlan?.plan === "business"
      ? empresaPlan.plan
      : "free";

  const fechaVencimiento =
    convertirFecha(
      empresaPlan?.subscriptionEndsAt
    );

  const planEfectivo: PlanId =
    planGuardado === "business"
      ? "business"
      : planGuardado === "pro" &&
          fechaVencimiento &&
          fechaVencimiento.getTime() >
            Date.now()
        ? "pro"
        : "free";

  const mostrarPublicidad =
    planEfectivo === "free";

  const totalConversaciones = conversaciones.length;

  const abiertas = conversaciones.filter(
    (conversacion) =>
      conversacion.estado !== "cerrada"
  ).length;

  const cerradas = conversaciones.filter(
    (conversacion) =>
      conversacion.estado === "cerrada"
  ).length;

  const leadsCalientes = conversaciones.filter(
    (conversacion) =>
      conversacion.nivelInteres === "alto" ||
      (conversacion.puntuacionLead ?? 0) >= 70
  ).length;

  const leadsMedios = conversaciones.filter(
    (conversacion) => {
      const puntuacion =
        conversacion.puntuacionLead ?? 0;

      return (
        conversacion.nivelInteres === "medio" ||
        (puntuacion >= 35 && puntuacion < 70)
      );
    }
  ).length;

  const leadsFrios = conversaciones.filter(
    (conversacion) => {
      const puntuacion =
        conversacion.puntuacionLead ?? 0;

      return (
        conversacion.nivelInteres === "bajo" ||
        puntuacion < 35
      );
    }
  ).length;

  const ultimasConversaciones =
    conversaciones.slice(0, 5);

  const datosGrafico = useMemo<DiaGrafico[]>(() => {
    const dias: DiaGrafico[] = [];
    const hoy = new Date();

    for (let diferencia = 6; diferencia >= 0; diferencia--) {
      const fecha = new Date(hoy);

      fecha.setHours(0, 0, 0, 0);
      fecha.setDate(fecha.getDate() - diferencia);

      const cantidad = conversaciones.filter(
        (conversacion) => {
          const timestamp =
            conversacion.createdAt ||
            conversacion.updatedAt;

          if (!timestamp) {
            return false;
          }

          const fechaConversacion =
            timestamp.toDate();

          return (
            fechaConversacion.getDate() ===
              fecha.getDate() &&
            fechaConversacion.getMonth() ===
              fecha.getMonth() &&
            fechaConversacion.getFullYear() ===
              fecha.getFullYear()
          );
        }
      ).length;

      const dia = new Intl.DateTimeFormat(
        "es-AR",
        {
          weekday: "short",
        }
      )
        .format(fecha)
        .replace(".", "");

      dias.push({
        dia,
        cantidad,
      });
    }

    return dias;
  }, [conversaciones]);

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600 dark:text-zinc-400">
          Resumen general de la empresa.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </Card>
      )}

      {loading ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Cargando métricas...
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              titulo="Conversaciones"
              valor={totalConversaciones}
              descripcion="Total registrado"
            />

            <MetricCard
              titulo="Leads calientes"
              valor={leadsCalientes}
              descripcion="Interés alto"
            />

            <MetricCard
              titulo="Abiertas"
              valor={abiertas}
              descripcion="En curso"
            />

            <MetricCard
              titulo="Cerradas"
              valor={cerradas}
              descripcion="Atenciones finalizadas"
            />
          </div>

          <Card className="border-blue-200 bg-blue-50/60 p-6 dark:border-blue-500/20 dark:bg-blue-500/5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Primeros pasos
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                  Poné NDI AI a trabajar en 4 pasos
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                  Configurá el negocio, enseñale a la IA qué responder,
                  conectá WhatsApp y hacé una prueba antes de atender clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/ayuda`
                  )
                }
                className="shrink-0 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                Ver tutorial completo
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  numero: "1",
                  titulo: "Configurá tu negocio",
                  texto: "Nombre, horarios, objetivo e instrucciones.",
                  ruta: "configuracion",
                },
                {
                  numero: "2",
                  titulo: "Cargá conocimiento",
                  texto: "Servicios, precios, preguntas y políticas.",
                  ruta: "conocimiento",
                },
                {
                  numero: "3",
                  titulo: "Conectá WhatsApp",
                  texto: "Vinculá el canal desde Integraciones.",
                  ruta: "integraciones",
                },
                {
                  numero: "4",
                  titulo: "Probá la IA",
                  texto: "Verificá las respuestas antes de usarla.",
                  ruta: "probar",
                },
              ].map((paso) => (
                <button
                  key={paso.numero}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/${paso.ruta}`
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500/30 dark:hover:bg-zinc-900"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {paso.numero}
                  </div>

                  <p className="mt-3 font-medium text-slate-950 dark:text-white">
                    {paso.titulo}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-500">
                    {paso.texto}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
              Accesos rápidos
            </h2>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <QuickAccessCard
                titulo="💬 Conversaciones"
                descripcion="Administrar chats y responder clientes."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/conversaciones`
                  )
                }
              />

              <QuickAccessCard
                titulo="📚 Conocimiento"
                descripcion="Gestionar PDF, sitios web y documentos."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/conocimiento`
                  )
                }
              />

              <QuickAccessCard
                titulo="🤖 Probar IA"
                descripcion="Simular conversaciones con el agente."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/probar`
                  )
                }
              />

              <QuickAccessCard
                titulo="⚙️ Configuración"
                descripcion="Editar empresa, agente y widget."
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}`
                  )
                }
              />

              <QuickAccessCard
  titulo="🔗 Integraciones"
  descripcion="Conectar WhatsApp y revisar próximos canales."
  onClick={() =>
    router.push(
      `/empresas/${empresaId}/integraciones`
    )
  }
/>

            </div>
          </div>

          {mostrarPublicidad && (
            <Card className="overflow-hidden border-blue-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 dark:border-blue-500/20 dark:from-blue-500/10 dark:via-zinc-900 dark:to-violet-500/10">
              <div
                id="ndi-ai-free-ad-slot-dashboard"
                data-ad-slot="dashboard-free"
                className="flex flex-col justify-between gap-5 p-6 md:flex-row md:items-center"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
                    Publicidad
                  </p>

                  <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    Usás NDI AI Free
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                    El plan gratuito puede mostrar promociones de NDI AI o
                    patrocinadores directos. Pasate a Pro para usar el panel sin publicidad.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/planes`
                    )
                  }
                  className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Pasar a Pro sin publicidad
                </button>
              </div>
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.7fr)]">

  <div className="space-y-6">
    <DashboardChart datos={datosGrafico} />
    <PlanUsageCard />
  </div>

  <LeadsCard
    total={totalConversaciones}
    calientes={leadsCalientes}
    medios={leadsMedios}
    frios={leadsFrios}
  />

</div>

          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-5 dark:border-zinc-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Últimas conversaciones
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                  Los chats con actividad más reciente.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/conversaciones`
                  )
                }
                className="text-left text-sm font-medium text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver todas →
              </button>
            </div>

            {ultimasConversaciones.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-3xl">
                  💬
                </div>

                <p className="mt-4 font-medium text-slate-950 dark:text-white">
                  Todavía no hay conversaciones
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                  Cuando alguien use el widget,
                  aparecerá acá.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-zinc-800">
                {ultimasConversaciones.map(
                  (conversacion) => {
                    const nombreVisitante =
                      obtenerNombreVisitante(
                        conversacion.visitanteId
                      );

                    return (
                      <button
                        key={conversacion.id}
                        type="button"
                        onClick={() =>
                          router.push(
                            `/empresas/${empresaId}/conversaciones/${conversacion.id}`
                          )
                        }
                        className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/40 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.7fr)_130px_110px] md:items-center md:px-6"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                            {nombreVisitante}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-zinc-500">
                            {conversacion.email ||
                              conversacion.telefono ||
                              `ID ${(
                                conversacion.id ||
                                "sin-id"
                              ).slice(0, 8)}`}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-700 dark:text-zinc-300">
                            {conversacion.ultimoMensaje ||
                              "Sin mensajes"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-600">
                            Atendido por{" "}
                            {conversacion.atendidoPor ===
                            "humano"
                              ? "una persona"
                              : "la IA"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {conversacion.puntuacionLead ??
                              0}
                            /100
                          </p>

                          <p className="mt-1 text-xs capitalize text-slate-500 dark:text-zinc-500">
                            Interés{" "}
                            {conversacion.nivelInteres ||
                              "bajo"}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              conversacion.estado ===
                              "cerrada"
                                ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
                            ].join(" ")}
                          >
                            {conversacion.estado ===
                            "cerrada"
                              ? "Cerrada"
                              : "Abierta"}
                          </span>

                          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-600">
                            {formatearFecha(
                              conversacion.updatedAt ||
                                conversacion.createdAt
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}

function obtenerNombreVisitante(
  visitanteId?: string
) {
  if (!visitanteId) {
    return "Visitante anónimo";
  }

  const parteVisible = visitanteId
    .replace("visitante-", "")
    .slice(0, 8);

  return `Visitante ${parteVisible}`;
}

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}