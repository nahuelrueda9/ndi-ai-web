"use client";

import {
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Clock,
  Save,
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

type AgendaConfig = {
  activa: boolean;
  intervaloMinutos: number;
  dias: Record<string, ConfigDiaAgenda>;
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
};

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

  async function guardarConfiguracionHorarios() {
    if (!empresaId || guardando) return;
    const empresaIdSeguro = empresaId;

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

      const tieneInicioDescanso = Boolean(config.descansoInicio);
      const tieneFinDescanso = Boolean(config.descansoFin);

      if (tieneInicioDescanso !== tieneFinDescanso) {
        setError(`Completá ambos horarios de descanso de ${dia.nombre.toLowerCase()} o dejalos vacíos.`);
        return;
      }

      if (tieneInicioDescanso && tieneFinDescanso) {
        if (
          !horaAgendaValida(config.descansoInicio) ||
          !horaAgendaValida(config.descansoFin) ||
          convertirHoraAMinutos(config.descansoInicio) >=
            convertirHoraAMinutos(config.descansoFin) ||
          convertirHoraAMinutos(config.descansoInicio) <
            convertirHoraAMinutos(config.apertura) ||
          convertirHoraAMinutos(config.descansoFin) >
            convertirHoraAMinutos(config.cierre)
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

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
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
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 lg:grid-cols-[200px_1fr_1fr_1fr_1fr] lg:items-center"
              >
                <label className="flex cursor-pointer items-center gap-3">
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

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-5 dark:border-zinc-800">
          <Button
            type="button"
            disabled={guardando}
            onClick={guardarConfiguracionHorarios}
          >
            <Save className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
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
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-zinc-400">
        {label}
      </label>
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
  };
}

function horaAgendaValida(valor: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}