"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type ConfigDiaAgenda = {
  activo: boolean;
  apertura: string;
  cierre: string;
  descansoInicio: string;
  descansoFin: string;
};

type DiaExcepcional = {
  fecha: string;
  motivo: string;
};

type AgendaConfig = {
  activa: boolean;
  intervaloMinutos: number;
  dias: Record<string, ConfigDiaAgenda>;
  diasExcepcionales?: DiaExcepcional[];
};

type EmpresaPlan = {
  plan?: PlanId;
  rubro?: string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  agendaConfig?: {
    activa?: boolean;
    intervaloMinutos?: number;
    dias?: Record<string, Partial<ConfigDiaAgenda>>;
    diasExcepcionales?: DiaExcepcional[];
  };
};

function planPermiteAgenda(empresa: EmpresaPlan) {
  return empresaTieneFuncion(empresa, "turnos");
}

const DIAS_CONFIG = [
  { clave: "1", nombre: "Lunes" },
  { clave: "2", nombre: "Martes" },
  { clave: "3", nombre: "Miércoles" },
  { clave: "4", nombre: "Jueves" },
  { clave: "5", nombre: "Viernes" },
  { clave: "6", nombre: "Sábado" },
  { clave: "0", nombre: "Domingo" },
];

const CABECERA_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MOTIVOS_SUGERIDOS = ["Feriado", "Franco", "Vacaciones", "Cierre excepcional"];

const AGENDA_CONFIG_INICIAL: AgendaConfig = {
  activa: false,
  intervaloMinutos: 30,
  dias: {
    "0": { activo: false, apertura: "09:00", cierre: "18:00", descansoInicio: "", descansoFin: "" },
    "1": { activo: true, apertura: "09:00", cierre: "18:00", descansoInicio: "", descansoFin: "" },
    "2": { activo: true, apertura: "09:00", cierre: "18:00", descansoInicio: "", descansoFin: "" },
    "3": { activo: true, apertura: "09:00", cierre: "18:00", descansoInicio: "", descansoFin: "" },
    "4": { activo: true, apertura: "09:00", cierre: "18:00", descansoInicio: "", descansoFin: "" },
    "5": { activo: true, apertura: "09:00", cierre: "18:00", descansoInicio: "", descansoFin: "" },
    "6": { activo: false, apertura: "09:00", cierre: "13:00", descansoInicio: "", descansoFin: "" },
  },
  diasExcepcionales: [],
};

function formatearISO(anio: number, mesIndice: number, dia: number) {
  const m = String(mesIndice + 1).padStart(2, "0");
  const d = String(dia).padStart(2, "0");
  return `${anio}-${m}-${d}`;
}

function formatearFechaCorta(fechaISO: string) {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  if (!anio || !mes || !dia) return fechaISO;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia));
}

export default function HorariosPage() {
  const params = useParams();
  const router = useRouter();
  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [agendaHabilitada, setAgendaHabilitada] = useState<boolean | null>(null);

  const [agendaConfig, setAgendaConfig] = useState<AgendaConfig>(AGENDA_CONFIG_INICIAL);

  const hoy = useMemo(() => new Date(), []);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<string[]>([]);
  const [motivoNuevo, setMotivoNuevo] = useState("");

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      setCargando(false);
      return;
    }

    const empresaIdSeguro = empresaId;

    async function cargarHorarios() {
      try {
        const empresaSnapshot = await getDoc(
          doc(db, "companies", empresaIdSeguro)
        );

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          setCargando(false);
          return;
        }

        const empresaData = empresaSnapshot.data() as EmpresaPlan;
        const habilitada = planPermiteAgenda(empresaData);

        setAgendaHabilitada(habilitada);

        if (habilitada) {
          setAgendaConfig(
            normalizarAgendaConfig(empresaData.agendaConfig)
          );
        }
      } catch (err) {
        console.error("Error al cargar configuración de horarios:", err);
        setError("No se pudieron cargar los horarios.");
      } finally {
        setCargando(false);
      }
    }

    void cargarHorarios();
  }, [empresaId]);

  function actualizarDiaAgenda(
    clave: string,
    campo: keyof ConfigDiaAgenda,
    valor: string | boolean
  ) {
    setAgendaConfig((actual) => ({
      ...actual,
      dias: {
        ...actual.dias,
        [clave]: {
          ...actual.dias[clave],
          [campo]: valor,
        },
      },
    }));
  }

  function abrirSelectorCalendario() {
    setError("");
    setFechasSeleccionadas([]);
    setMotivoNuevo("");
    setMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setSelectorAbierto(true);
  }

  function cerrarSelectorCalendario() {
    setSelectorAbierto(false);
    setFechasSeleccionadas([]);
    setMotivoNuevo("");
  }

  function alternarFechaEnCalendario(fechaISO: string) {
    setFechasSeleccionadas((actuales) => {
      if (actuales.includes(fechaISO)) {
        return actuales.filter((f) => f !== fechaISO);
      }
      return [...actuales, fechaISO].sort();
    });
  }

  function confirmarDiasYMotivo() {
    if (fechasSeleccionadas.length === 0) {
      setError("Seleccioná al menos un día en el calendario.");
      return;
    }

    setError("");
    const motivoLimpio = motivoNuevo.trim();

    setAgendaConfig((actual) => {
      const existentes = actual.diasExcepcionales || [];
      const mapaPorFecha = new Map<string, DiaExcepcional>();

      for (const item of existentes) {
        if (item.fecha) {
          mapaPorFecha.set(item.fecha, { ...item });
        }
      }

      for (const fechaISO of fechasSeleccionadas) {
        const previa = mapaPorFecha.get(fechaISO);
        mapaPorFecha.set(fechaISO, {
          fecha: fechaISO,
          motivo: motivoLimpio || previa?.motivo || "",
        });
      }

      const listaActualizada = Array.from(mapaPorFecha.values()).sort((a, b) =>
        a.fecha.localeCompare(b.fecha)
      );

      return {
        ...actual,
        diasExcepcionales: listaActualizada,
      };
    });

    cerrarSelectorCalendario();
  }

  function actualizarFechaExcepcional(index: number, campo: keyof DiaExcepcional, valor: string) {
    setAgendaConfig((actual) => {
      const lista = [...(actual.diasExcepcionales || [])];
      lista[index] = { ...lista[index], [campo]: valor };
      return { ...actual, diasExcepcionales: lista };
    });
  }

  function eliminarFechaExcepcional(index: number) {
    setAgendaConfig((actual) => ({
      ...actual,
      diasExcepcionales: (actual.diasExcepcionales || []).filter((_, i) => i !== index),
    }));
  }

  const celdasCalendario = useMemo(() => {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const totalDiasMes = new Date(anio, mes + 1, 0).getDate();

    const celdas: Array<{ dia: number | null; fechaISO: string | null }> = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push({ dia: null, fechaISO: null });
    }
    for (let d = 1; d <= totalDiasMes; d++) {
      celdas.push({ dia: d, fechaISO: formatearISO(anio, mes, d) });
    }
    return celdas;
  }, [mesVisible]);

  const etiquetaMes = useMemo(() => {
    return new Intl.DateTimeFormat("es-AR", {
      month: "long",
      year: "numeric",
    }).format(mesVisible);
  }, [mesVisible]);

  const fechasYaGuardadas = useMemo(() => {
    return new Set((agendaConfig.diasExcepcionales || []).map((d) => d.fecha));
  }, [agendaConfig.diasExcepcionales]);

  async function guardarConfiguracionHorarios() {
    if (!empresaId || guardando) return;
    const empresaIdSeguro = empresaId;

    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setError("");
    setMensaje("");

    if (
      !Number.isFinite(agendaConfig.intervaloMinutos) ||
      agendaConfig.intervaloMinutos < 5 ||
      agendaConfig.intervaloMinutos > 1440
    ) {
      setError("Ingresá un intervalo en minutos válido (mayor a 5).");
      return;
    }

    for (const dia of DIAS_CONFIG) {
      const config = agendaConfig.dias[dia.clave];
      if (!config?.activo) continue;

      if (
        !horaAgendaValida(config.apertura) ||
        !horaAgendaValida(config.cierre) ||
        convertirHoraAMinutos(config.apertura) >=
          convertirHoraAMinutos(config.cierre)
      ) {
        setError(`Revisá el horario de ${dia.nombre.toLowerCase()}.`);
        return;
      }

      // Si puso 00:00 en ambos o están vacíos / iguales, no hay descanso y se saltea el error
      const tieneDescanso =
        config.descansoInicio &&
        config.descansoFin &&
        config.descansoInicio !== config.descansoFin;

      if (tieneDescanso) {
        if (
          !horaAgendaValida(config.descansoInicio) ||
          !horaAgendaValida(config.descansoFin) ||
          convertirHoraAMinutos(config.descansoInicio) >=
            convertirHoraAMinutos(config.descansoFin)
        ) {
          setError(`Revisá el descanso de ${dia.nombre.toLowerCase()}.`);
          return;
        }
      }
    }

    setGuardando(true);

    try {
      await updateDoc(doc(db, "companies", empresaIdSeguro), {
        agendaConfig,
        updatedAt: serverTimestamp(),
      });

      setMensaje(
        agendaConfig.activa
          ? "Horarios de atención guardados y reservas activadas correctamente."
          : "Horarios guardados correctamente."
      );
    } catch (err) {
      console.error("Error al guardar horarios:", err);
      setError("No se pudieron guardar los horarios.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
        <p className="mt-4 text-sm text-slate-500">Cargando horarios...</p>
      </section>
    );
  }

  if (agendaHabilitada === false) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-12">
        <Card className="border-cyan-200 bg-cyan-50 p-5 text-center sm:p-12 dark:border-cyan-500/20 dark:bg-cyan-500/5">
          <Clock className="mx-auto h-8 w-8 text-cyan-700 dark:text-cyan-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-950 dark:text-white sm:text-3xl">
            Horarios de atención
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            Esta función requiere un plan que soporte agenda y reservas online.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => router.push(`/empresas/${empresaId}/planes`)}
          >
            Ver planes
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
            Configuración comercial
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Horarios de atención
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
            Definí los días, turnos de apertura, cierre y descansos para la disponibilidad pública.
          </p>
        </div>

        <Button
          type="button"
          className="touch-manipulation"
          disabled={guardando}
          onClick={guardarConfiguracionHorarios}
        >
          <Save className="mr-2 h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </header>

      {mensaje && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{mensaje}</p>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                Estado de reservas online
              </h2>
              <Badge variant={agendaConfig.activa ? "success" : "default"}>
                {agendaConfig.activa ? "Activas" : "Desactivadas"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
              Permite que los clientes elijan turnos libres directamente desde tu web pública.
            </p>
          </div>

          <label className="flex cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-sm font-medium text-slate-950 dark:text-white">
              Habilitar en web
            </span>
            <input
              type="checkbox"
              checked={agendaConfig.activa}
              onChange={(e) =>
                setAgendaConfig((actual) => ({
                  ...actual,
                  activa: e.target.checked,
                }))
              }
              className="h-5 w-5 accent-blue-600"
            />
          </label>
        </div>

        <div className="my-6 max-w-xs">
          <Input
            id="intervalo"
            label="Duración de cada turno o intervalo (en minutos)"
            type="number"
            min="5"
            max="1440"
            step="5"
            value={agendaConfig.intervaloMinutos}
            onChange={(e) =>
              setAgendaConfig((actual) => ({
                ...actual,
                intervaloMinutos: Number(e.target.value),
              }))
            }
          />
        </div>

        <div className="space-y-3">
          {DIAS_CONFIG.map((dia) => {
            const config = agendaConfig.dias[dia.clave];

            return (
              <div
                key={dia.clave}
                className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 lg:grid-cols-[180px_1fr_1fr_1fr_1fr] lg:items-center"
              >
                <div className="col-span-2 lg:col-span-1">
                  <label className="flex cursor-pointer touch-manipulation items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.activo}
                      onChange={(e) =>
                        actualizarDiaAgenda(dia.clave, "activo", e.target.checked)
                      }
                      className="h-5 w-5 accent-blue-600"
                    />
                    <span className="text-sm font-semibold text-slate-950 dark:text-white">
                      {dia.nombre}
                    </span>
                  </label>
                </div>

                <HorarioCampo
                  label="Apertura"
                  value={config.apertura}
                  disabled={!config.activo}
                  onChange={(val) => actualizarDiaAgenda(dia.clave, "apertura", val)}
                />

                <HorarioCampo
                  label="Cierre"
                  value={config.cierre}
                  disabled={!config.activo}
                  onChange={(val) => actualizarDiaAgenda(dia.clave, "cierre", val)}
                />

                <HorarioCampo
                  label="Descanso desde"
                  value={config.descansoInicio}
                  disabled={!config.activo}
                  onChange={(val) => actualizarDiaAgenda(dia.clave, "descansoInicio", val)}
                />

                <HorarioCampo
                  label="Descanso hasta"
                  value={config.descansoFin}
                  disabled={!config.activo}
                  onChange={(val) => actualizarDiaAgenda(dia.clave, "descansoFin", val)}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <CalendarX className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                  Días de cierre excepcional / Feriados
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">
                Tocá Agregar fecha para elegir uno o varios días en el calendario y luego indicá el motivo.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={abrirSelectorCalendario}
              className="shrink-0 touch-manipulation bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar fecha
            </Button>
          </div>

          {selectorAbierto && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-500/30 dark:bg-zinc-900 sm:p-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Paso 1 · Elegí día o días
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Podés seleccionar varios días tocándolos en el calendario.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarSelectorCalendario}
                  aria-label="Cerrar calendario"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setMesVisible(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm font-bold capitalize text-slate-950 dark:text-white">
                  {etiquetaMes}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setMesVisible(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                {CABECERA_SEMANA.map((nombreDia) => (
                  <div key={nombreDia} className="py-1">
                    {nombreDia}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1.5">
                {celdasCalendario.map((celda, idx) => {
                  if (!celda.dia || !celda.fechaISO) {
                    return <div key={`vacio-${idx}`} className="h-9" />;
                  }

                  const seleccionada = fechasSeleccionadas.includes(celda.fechaISO);
                  const yaBloqueada = fechasYaGuardadas.has(celda.fechaISO);

                  return (
                    <button
                      key={celda.fechaISO}
                      type="button"
                      onClick={() => alternarFechaEnCalendario(celda.fechaISO!)}
                      className={[
                        "relative flex h-9 touch-manipulation flex-col items-center justify-center rounded-xl text-xs font-semibold transition",
                        seleccionada
                          ? "bg-blue-600 text-white shadow-sm"
                          : yaBloqueada
                          ? "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                          : "border border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-500/40",
                      ].join(" ")}
                    >
                      <span>{celda.dia}</span>
                      {yaBloqueada && !seleccionada && (
                        <span className="h-1 w-1 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Paso 2 · Motivo ({fechasSeleccionadas.length}{" "}
                    {fechasSeleccionadas.length === 1 ? "día elegido" : "días elegidos"})
                  </p>

                  {fechasSeleccionadas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFechasSeleccionadas([])}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>

                {fechasSeleccionadas.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {fechasSeleccionadas.map((fechaISO) => (
                      <span
                        key={fechaISO}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      >
                        {formatearFechaCorta(fechaISO)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-zinc-500">
                    Tocá uno o más días arriba para empezar.
                  </p>
                )}

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Motivo del cierre
                  </label>
                  <input
                    type="text"
                    value={motivoNuevo}
                    onChange={(e) => setMotivoNuevo(e.target.value)}
                    placeholder="Ej: Feriado, Franco, Vacaciones, Navidad..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {MOTIVOS_SUGERIDOS.map((sugerencia) => (
                      <button
                        key={sugerencia}
                        type="button"
                        onClick={() => setMotivoNuevo(sugerencia)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={cerrarSelectorCalendario}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDiasYMotivo}>
                    <Check className="mr-1.5 h-4 w-4" />
                    Agregar {fechasSeleccionadas.length > 0 ? `(${fechasSeleccionadas.length})` : "fechas"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2.5">
            {(!agendaConfig.diasExcepcionales || agendaConfig.diasExcepcionales.length === 0) &&
              !selectorAbierto && (
                <p className="py-2 text-center text-xs italic text-slate-400 dark:text-zinc-600">
                  No hay fechas excepcionales agregadas.
                </p>
              )}

            {agendaConfig.diasExcepcionales?.map((item, index) => (
              <div
                key={`${item.fecha}-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    value={item.fecha}
                    onChange={(e) => actualizarFechaExcepcional(index, "fecha", e.target.value)}
                    className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-950 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Motivo (ej: Navidad, Vacaciones)"
                    value={item.motivo}
                    onChange={(e) => actualizarFechaExcepcional(index, "motivo", e.target.value)}
                    className="w-full min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-950 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => eliminarFechaExcepcional(index)}
                  className="inline-flex touch-manipulation items-center gap-1 self-end text-xs font-medium text-red-500 transition hover:text-red-700 sm:self-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

function HorarioCampo({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-zinc-400">
        {label}
      </label>
      <input
        type="time"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.currentTarget.value)}
        className="w-full min-w-0 touch-manipulation rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:px-3"
      />
    </div>
  );
}

function convertirHoraAMinutos(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function normalizarAgendaConfig(config?: EmpresaPlan["agendaConfig"]): AgendaConfig {
  const base = AGENDA_CONFIG_INICIAL;
  const dias = Object.fromEntries(
    Object.entries(base.dias).map(([clave, diaBase]) => [
      clave,
      {
        ...diaBase,
        ...(config?.dias?.[clave] || {}),
      },
    ])
  ) as Record<string, ConfigDiaAgenda>;

  return {
    activa: config?.activa ?? false,
    intervaloMinutos: Math.max(5, Number(config?.intervaloMinutos) || 30),
    dias,
    diasExcepcionales: Array.isArray(config?.diasExcepcionales) ? config.diasExcepcionales : [],
  };
}

function horaAgendaValida(valor: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}