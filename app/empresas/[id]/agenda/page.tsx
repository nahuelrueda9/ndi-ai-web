"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  List,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type EstadoTurno =
  | "pendiente"
  | "confirmado"
  | "completado"
  | "cancelado"
  | "no_asistio";

type ModoRepeticion = "unico" | "semanal" | "fechas_multiples";

type Turno = {
  id: string;
  nombreCliente: string;
  email?: string;
  telefono?: string;
  servicio: string;
  servicioId?: string;
  precioServicio?: number;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  estado: EstadoTurno;
  notas?: string;
  serieId?: string;
  origen?: "manual" | "web" | "whatsapp" | "instagram";
  tipoReserva?: "alojamiento" | "mesa";
  fechaEntrada?: string;
  fechaSalida?: string;
  huespedes?: number;
  personas?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type FormularioTurno = {
  nombreCliente: string;
  email: string;
  telefono: string;
  servicio: string;
  servicioId: string;
  fecha: string;
  hora: string;
  duracionMinutos: string;
  fechaEntrada: string;
  fechaSalida: string;
  huespedes: string;
  notas: string;
};

type CatalogoServicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracionMinutos?: number;
  activo?: boolean;
  tipo?: "servicio" | "producto";
  rubro?: string;
};

type FiltroEstado = "todos" | EstadoTurno;
type VistaAgenda = "agenda" | "mes" | "lista";

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
  nombre?: string;
  plan?: PlanId;
  rubro?: string;
  tipoNegocio?: string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  paginaPublica?: {
    plantilla?: string;
    rubro?: string;
    publicada?: boolean;
  };
  agendaConfig?: {
    activa?: boolean;
    intervaloMinutos?: number;
    dias?: Record<string, Partial<ConfigDiaAgenda>>;
  };
};

// ==========================================
// 1. CONSTANTES GLOBALES Y UTILIDADES AUXILIARES
// ==========================================
const DIAS_SEMANA: string[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

function obtenerFechaISO(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function obtenerMananaISO() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return obtenerFechaISO(manana);
}

function formatearFechaCorta(fechaISO: string) {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  if (!anio || !mes || !dia) return fechaISO;
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
}

function generarFechasSemanales(fechaInicioISO: string, cantidadSemanas: number): string[] {
  if (!fechaInicioISO) return [];
  const total = Math.max(1, Math.min(52, Number(cantidadSemanas) || 1));
  const base = new Date(`${fechaInicioISO}T12:00:00`);
  if (Number.isNaN(base.getTime())) return [];

  const fechas: string[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7);
    fechas.push(obtenerFechaISO(d));
  }
  return fechas;
}

const FORMULARIO_INICIAL: FormularioTurno = {
  nombreCliente: "",
  email: "",
  telefono: "",
  servicio: "",
  servicioId: "",
  fecha: obtenerFechaISO(new Date()),
  hora: "09:00",
  duracionMinutos: "60",
  fechaEntrada: obtenerFechaISO(new Date()),
  fechaSalida: obtenerMananaISO(),
  huespedes: "2",
  notas: "",
};

const ESTADOS: Record<
  EstadoTurno,
  {
    nombre: string;
    variant: "default" | "info" | "success" | "danger" | "warning";
    clase: string;
  }
> = {
  pendiente: {
    nombre: "Pendiente",
    variant: "warning",
    clase: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  confirmado: {
    nombre: "Confirmado",
    variant: "info",
    clase: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  completado: {
    nombre: "Finalizado",
    variant: "success",
    clase: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  cancelado: {
    nombre: "Cancelado",
    variant: "danger",
    clase: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  no_asistio: {
    nombre: "No asistió",
    variant: "danger",
    clase: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

function planPermiteAgenda(empresa: EmpresaPlan) {
  return empresaTieneFuncion(empresa, "turnos");
}

function normalizarAgendaConfig(config?: EmpresaPlan["agendaConfig"]): AgendaConfig {
  return {
    activa: config?.activa ?? AGENDA_CONFIG_INICIAL.activa,
    intervaloMinutos: config?.intervaloMinutos ?? AGENDA_CONFIG_INICIAL.intervaloMinutos,
    dias: {
      ...AGENDA_CONFIG_INICIAL.dias,
      ...(config?.dias || {}),
    } as Record<string, ConfigDiaAgenda>,
  };
}

function convertirHoraAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function obtenerFechasEstadia(entrada: string, salida: string): string[] {
  const fechas: string[] = [];
  const actual = new Date(`${entrada}T12:00:00`);
  const fin = new Date(`${salida}T12:00:00`);

  while (actual <= fin) {
    fechas.push(obtenerFechaISO(actual));
    actual.setDate(actual.getDate() + 1);
  }
  return fechas;
}

function construirDiasCalendario(mesActual: Date) {
  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDiaMes = new Date(anio, mes, 1);
  let diaSemanaInicio = primerDiaMes.getDay() - 1;
  if (diaSemanaInicio === -1) diaSemanaInicio = 6;

  const dias: { fecha: string; esMesActual: boolean; numeroDia: number }[] = [];
  const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate();
  const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();

  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const d = new Date(anio, mes - 1, ultimoDiaMesAnterior - i);
    dias.push({ fecha: obtenerFechaISO(d), esMesActual: false, numeroDia: d.getDate() });
  }

  for (let i = 1; i <= ultimoDiaMes; i++) {
    const d = new Date(anio, mes, i);
    dias.push({ fecha: obtenerFechaISO(d), esMesActual: true, numeroDia: i });
  }

  const totalCeldas = Math.ceil(dias.length / 7) * 7;
  const diasRestantes = totalCeldas - dias.length;
  for (let i = 1; i <= diasRestantes; i++) {
    const d = new Date(anio, mes + 1, i);
    dias.push({ fecha: obtenerFechaISO(d), esMesActual: false, numeroDia: i });
  }

  return dias;
}

function formatearFechaTexto(fechaISO: string): string {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function ResumenCard({ titulo, valor, icono }: { titulo: string; valor: number; icono: React.ReactNode }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{titulo}</p>
        <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">{valor}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
        {icono}
      </div>
    </Card>
  );
}

// ==========================================
// 2. COMPONENTE PRINCIPAL DE AGENDA
// ==========================================
export default function AgendaPage() {
  const params = useParams();
  const router = useRouter();
  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<CatalogoServicio[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  // Estados para agendar múltiples días o repetición semanal
  const [modoRepeticion, setModoRepeticion] = useState<ModoRepeticion>("unico");
  const [cantidadSemanas, setCantidadSemanas] = useState("4");
  const [fechaExtraInput, setFechaExtraInput] = useState(obtenerFechaISO(new Date()));
  const [fechasExtra, setFechasExtra] = useState<string[]>([]);

  const [vistaActual, setVistaActual] = useState<VistaAgenda>("agenda");

  const [mesActual, setMesActual] = useState(() => {
    const fecha = new Date();
    fecha.setDate(1);
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  });

  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaISO(new Date()));
  const [formulario, setFormulario] = useState<FormularioTurno>(FORMULARIO_INICIAL);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [agendaHabilitada, setAgendaHabilitada] = useState<boolean | null>(null);
  const [empresaDocData, setEmpresaDocData] = useState<EmpresaPlan | null>(null);
  const [, setAgendaConfig] = useState<AgendaConfig>(AGENDA_CONFIG_INICIAL);

  const esAlojamiento = useMemo(() => {
    const textoDetectar = [
      empresaDocData?.rubro,
      empresaDocData?.tipoNegocio,
      empresaDocData?.nombre,
      empresaDocData?.paginaPublica?.rubro,
      empresaDocData?.paginaPublica?.plantilla,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const coincideTexto = [
      "hotel",
      "hostal",
      "hostel",
      "alojamiento",
      "hospedaje",
      "cabaña",
      "cabana",
      "cabañas",
      "cabanas",
      "posada",
      "departamento",
    ].some((palabra) => textoDetectar.includes(palabra));

    const tieneHabitacionesEnCatalogo = serviciosCatalogo.some((item) =>
      item.nombre.toLowerCase().includes("habitac") ||
      item.nombre.toLowerCase().includes("depto") ||
      item.nombre.toLowerCase().includes("suite")
    );

    return coincideTexto || tieneHabitacionesEnCatalogo;
  }, [empresaDocData, serviciosCatalogo]);

  const usaReservas = esAlojamiento || [
    "restaurante",
    "restaurant",
    "bar",
    "gastronomia",
  ].some((r) => (empresaDocData?.rubro || "").toLowerCase().includes(r));

  const singularAgenda = esAlojamiento ? "reserva" : usaReservas ? "reserva" : "turno";
  const pluralAgenda = esAlojamiento ? "reservas" : usaReservas ? "reservas" : "turnos";
  const tituloAgenda = esAlojamiento ? "Agenda de Reservas" : usaReservas ? "Agenda y Reservas" : "Agenda y Turnos";

  const fechasObjetivoTurno = useMemo(() => {
    if (editandoId || esAlojamiento) {
      return formulario.fecha ? [formulario.fecha] : [];
    }

    if (modoRepeticion === "semanal") {
      return generarFechasSemanales(formulario.fecha, Number(cantidadSemanas) || 1);
    }

    if (modoRepeticion === "fechas_multiples") {
      const combinadas = new Set<string>(fechasExtra);
      if (formulario.fecha) combinadas.add(formulario.fecha);
      return Array.from(combinadas).sort();
    }

    return formulario.fecha ? [formulario.fecha] : [];
  }, [editandoId, esAlojamiento, formulario.fecha, modoRepeticion, cantidadSemanas, fechasExtra]);

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      setCargando(false);
      return;
    }

    const empresaIdSeguro = empresaId;
    let cancelarTurnos: (() => void) | undefined;
    let cancelarCatalogo: (() => void) | undefined;

    async function cargarAgenda() {
      try {
        const empresaSnapshot = await getDoc(doc(db, "companies", empresaIdSeguro));

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          setCargando(false);
          return;
        }

        const empresaData = empresaSnapshot.data() as EmpresaPlan;
        const habilitada = planPermiteAgenda(empresaData);

        setAgendaHabilitada(habilitada);
        setEmpresaDocData(empresaData);
        setAgendaConfig(normalizarAgendaConfig(empresaData.agendaConfig));

        if (!habilitada) {
          setTurnos([]);
          setServiciosCatalogo([]);
          setCargando(false);
          return;
        }

        cancelarCatalogo = onSnapshot(
          collection(db, "companies", empresaIdSeguro, "catalog"),
          (snapshot) => {
            const servicios = snapshot.docs
              .map((documento) => ({
                id: documento.id,
                ...(documento.data() as Omit<CatalogoServicio, "id">),
              }))
              .filter((item) => item.tipo === "servicio" && item.activo !== false)
              .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

            setServiciosCatalogo(servicios);
          },
          (firebaseError) => {
            console.error("Error al cargar servicios:", firebaseError);
          }
        );

        const turnosRef = collection(db, "companies", empresaIdSeguro, "appointments");

        cancelarTurnos = onSnapshot(
          turnosRef,
          (snapshot) => {
            const lista = snapshot.docs.map((documento) => {
              const datos = documento.data() as Omit<Turno, "id">;
              const fechaNormalizada = datos.fecha || datos.fechaEntrada || "";

              return {
                id: documento.id,
                ...datos,
                fecha: fechaNormalizada,
                hora: datos.hora || (datos.tipoReserva === "alojamiento" ? "14:00" : ""),
                duracionMinutos: Number(datos.duracionMinutos) || 30,
                estado: datos.estado || "pendiente",
              };
            });

            setTurnos(lista);
            setError("");
            setCargando(false);
          },
          (firebaseError) => {
            console.error("Error al cargar turnos:", firebaseError);
            setCargando(false);
          }
        );
      } catch (firebaseError) {
        console.error("Error al verificar el plan de Agenda:", firebaseError);
        setError("No se pudo verificar el plan.");
        setCargando(false);
      }
    }

    void cargarAgenda();

    return () => {
      cancelarTurnos?.();
      cancelarCatalogo?.();
    };
  }, [empresaId]);

  const diasCalendario = useMemo(() => construirDiasCalendario(mesActual), [mesActual]);

  const turnosDelDiaSeleccionado = useMemo(() => {
    return turnos
      .filter((t) => {
        const coincideFecha =
          t.tipoReserva === "alojamiento"
            ? t.fechaEntrada && t.fechaSalida
              ? fechaSeleccionada >= t.fechaEntrada && fechaSeleccionada <= t.fechaSalida
              : t.fecha === fechaSeleccionada
            : t.fecha === fechaSeleccionada;

        if (!coincideFecha) return false;
        if (filtroEstado === "todos") return true;
        return t.estado === filtroEstado;
      })
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  }, [turnos, fechaSeleccionada, filtroEstado]);

  const turnosListadoGeneral = useMemo(() => {
    const hoy = obtenerFechaISO(new Date());

    return turnos
      .filter((turno) => {
        const fechaInicio = turno.fechaEntrada || turno.fecha || "";
        const fechaFin = turno.fechaSalida || fechaInicio;
        const sigueVigente = turno.tipoReserva === "alojamiento" ? fechaFin >= hoy : fechaInicio >= hoy;

        if (!sigueVigente) return false;
        if (filtroEstado === "todos") return true;
        return turno.estado === filtroEstado;
      })
      .sort((a, b) => {
        const fechaA = a.fechaEntrada || a.fecha || "";
        const fechaB = b.fechaEntrada || b.fecha || "";
        const porFecha = fechaA.localeCompare(fechaB);
        if (porFecha !== 0) return porFecha;
        return (a.hora || "").localeCompare(b.hora || "");
      });
  }, [turnos, filtroEstado]);

  const resumen = useMemo(() => {
    const hoy = obtenerFechaISO(new Date());

    return {
      total: turnos.length,
      hoy: turnos.filter((turno) => {
        if (turno.tipoReserva === "alojamiento" && turno.fechaEntrada && turno.fechaSalida) {
          return hoy >= turno.fechaEntrada && hoy <= turno.fechaSalida;
        }
        return turno.fecha === hoy;
      }).length,
      pendientes: turnos.filter((turno) => turno.estado === "pendiente").length,
      confirmados: turnos.filter((turno) => turno.estado === "confirmado").length,
    };
  }, [turnos]);

  const turnosPorFecha = useMemo(() => {
    const mapa = new Map<string, Turno[]>();

    turnos.forEach((turno) => {
      const fechas =
        turno.tipoReserva === "alojamiento" && turno.fechaEntrada && turno.fechaSalida
          ? obtenerFechasEstadia(turno.fechaEntrada, turno.fechaSalida)
          : [turno.fecha];

      fechas.forEach((fecha) => {
        const existentes = mapa.get(fecha) ?? [];
        mapa.set(fecha, [...existentes, turno]);
      });
    });

    return mapa;
  }, [turnos]);

  function abrirNuevoTurno(fecha = fechaSeleccionada) {
    setEditandoId(null);
    setConfirmandoEliminarId(null);
    setModoRepeticion("unico");
    setCantidadSemanas("4");
    setFechaExtraInput(fecha);
    setFechasExtra([fecha]);
    const fechaSalidaCalculada = new Date(`${fecha}T12:00:00`);
    fechaSalidaCalculada.setDate(fechaSalidaCalculada.getDate() + 1);

    setFormulario({
      ...FORMULARIO_INICIAL,
      fecha,
      fechaEntrada: fecha,
      fechaSalida: obtenerFechaISO(fechaSalidaCalculada),
    });
    setMostrandoFormulario(true);
    setError("");
    setMensaje("");
  }

  function editarTurno(turno: Turno) {
    setEditandoId(turno.id);
    setConfirmandoEliminarId(null);
    setModoRepeticion("unico");
    setFechasExtra([]);
    setFormulario({
      nombreCliente: turno.nombreCliente,
      email: turno.email || "",
      telefono: turno.telefono || "",
      servicio: turno.servicio,
      servicioId: turno.servicioId || "",
      fecha: turno.fecha,
      hora: turno.hora || "14:00",
      duracionMinutos: String(turno.duracionMinutos || 30),
      fechaEntrada: turno.fechaEntrada || turno.fecha,
      fechaSalida: turno.fechaSalida || obtenerMananaISO(),
      huespedes: String(turno.huespedes || 2),
      notas: turno.notas || "",
    });

    setFechaSeleccionada(turno.fechaEntrada || turno.fecha);
    setMostrandoFormulario(true);
    setError("");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function agregarFechaExtra() {
    if (!fechaExtraInput) return;
    setFechasExtra((actuales) => {
      if (actuales.includes(fechaExtraInput)) return actuales;
      return [...actuales, fechaExtraInput].sort();
    });
  }

  function quitarFechaExtra(fechaISO: string) {
    setFechasExtra((actuales) => actuales.filter((f) => f !== fechaISO));
  }

  function seleccionarServicio(servicioId: string) {
    const servicio = serviciosCatalogo.find((item) => item.id === servicioId);

    if (!servicio) {
      setFormulario((actual) => ({ ...actual, servicioId: "", servicio: "" }));
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      servicioId: servicio.id,
      servicio: servicio.nombre,
      duracionMinutos: String(servicio.duracionMinutos || 30),
    }));
  }

  function actualizarFormulario<Clave extends keyof FormularioTurno>(
    clave: Clave,
    valor: FormularioTurno[Clave]
  ) {
    setFormulario((actual) => ({
      ...actual,
      [clave]: valor,
    }));
  }

  function validarFormulario() {
    if (!formulario.nombreCliente.trim()) return "Escribí el nombre del cliente.";
    if (!formulario.servicio.trim()) {
      return esAlojamiento ? "Seleccioná una habitación." : "Escribí el servicio o motivo del turno.";
    }

    if (esAlojamiento) {
      if (!formulario.fechaEntrada) return "Seleccioná la fecha de entrada (check-in).";
      if (!formulario.fechaSalida) return "Seleccioná la fecha de salida (check-out).";
      if (formulario.fechaSalida <= formulario.fechaEntrada) {
        return "La fecha de salida debe ser posterior a la fecha de entrada.";
      }
      const huespedesNum = Number(formulario.huespedes);
      if (!Number.isInteger(huespedesNum) || huespedesNum < 1 || huespedesNum > 30) {
        return "Ingresá una cantidad de huéspedes válida.";
      }
    } else {
      if (!formulario.fecha) return "Seleccioná una fecha.";
      if (!formulario.hora) return "Seleccioná un horario.";
      const duracion = Number(formulario.duracionMinutos);
      if (!Number.isFinite(duracion) || duracion < 5 || duracion > 1440) {
        return "Ingresá una duración válida.";
      }
      if (!editandoId && modoRepeticion === "semanal") {
        const semanas = Number(cantidadSemanas);
        if (!Number.isInteger(semanas) || semanas < 1 || semanas > 52) {
          return "Ingresá una cantidad de semanas válida (entre 1 y 52).";
        }
      }
      if (!editandoId && fechasObjetivoTurno.length === 0) {
        return "Seleccioná al menos una fecha.";
      }
    }

    return "";
  }

  async function guardarTurno(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!empresaId || guardando) return;

    setError("");
    setMensaje("");

    const validacion = validarFormulario();
    if (validacion) {
      setError(validacion);
      return;
    }

    const servicioSeleccionado = serviciosCatalogo.find((item) => item.id === formulario.servicioId);
    setGuardando(true);

    try {
      if (esAlojamiento) {
        const datosAlojamiento = {
          nombreCliente: formulario.nombreCliente.trim(),
          email: formulario.email.trim(),
          telefono: formulario.telefono.trim(),
          servicio: formulario.servicio.trim(),
          servicioId: formulario.servicioId || "",
          precioServicio: servicioSeleccionado?.precio || 0,
          tipoReserva: "alojamiento" as const,
          fecha: formulario.fechaEntrada,
          hora: "14:00",
          duracionMinutos: 0,
          fechaEntrada: formulario.fechaEntrada,
          fechaSalida: formulario.fechaSalida,
          huespedes: Number(formulario.huespedes) || 2,
          notas: formulario.notas.trim(),
          updatedAt: serverTimestamp(),
        };

        if (editandoId) {
          await updateDoc(doc(db, "companies", empresaId, "appointments", editandoId), datosAlojamiento);
          setMensaje("Reserva de habitación actualizada correctamente.");
        } else {
          await addDoc(collection(db, "companies", empresaId, "appointments"), {
            ...datosAlojamiento,
            estado: "pendiente",
            origen: "manual",
            createdAt: serverTimestamp(),
          });
          setMensaje("Reserva de habitación creada correctamente.");
        }

        setFechaSeleccionada(formulario.fechaEntrada);
      } else {
        const duracion = Number(formulario.duracionMinutos);
        const inicioNuevo = convertirHoraAMinutos(formulario.hora);
        const finNuevo = inicioNuevo + duracion;
        const fechasAGuardar = editandoId ? [formulario.fecha] : fechasObjetivoTurno;

        for (const fechaObjetivo of fechasAGuardar) {
          const conflicto = turnos.find((turno) => {
            if (
              turno.id === editandoId ||
              turno.fecha !== fechaObjetivo ||
              turno.estado === "cancelado" ||
              turno.estado === "no_asistio"
            ) {
              return false;
            }

            const inicioExistente = convertirHoraAMinutos(turno.hora);
            const finExistente = inicioExistente + turno.duracionMinutos;

            return inicioNuevo < finExistente && finNuevo > inicioExistente;
          });

          if (conflicto) {
            setError(
              `El día ${formatearFechaCorta(fechaObjetivo)} se superpone con el turno de ${conflicto.nombreCliente} a las ${conflicto.hora}.`
            );
            setGuardando(false);
            return;
          }
        }

        if (editandoId) {
          const datosTurno = {
            nombreCliente: formulario.nombreCliente.trim(),
            email: formulario.email.trim(),
            telefono: formulario.telefono.trim(),
            servicio: formulario.servicio.trim(),
            servicioId: formulario.servicioId || "",
            precioServicio: servicioSeleccionado?.precio || 0,
            fecha: formulario.fecha,
            hora: formulario.hora,
            duracionMinutos: duracion,
            notas: formulario.notas.trim(),
            updatedAt: serverTimestamp(),
          };

          await updateDoc(doc(db, "companies", empresaId, "appointments", editandoId), datosTurno);
          setMensaje("Turno actualizado correctamente.");
          setFechaSeleccionada(formulario.fecha);
        } else {
          const serieId =
            fechasAGuardar.length > 1
              ? `serie_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
              : undefined;

          await Promise.all(
            fechasAGuardar.map((fechaObjetivo) =>
              addDoc(collection(db, "companies", empresaId, "appointments"), {
                nombreCliente: formulario.nombreCliente.trim(),
                email: formulario.email.trim(),
                telefono: formulario.telefono.trim(),
                servicio: formulario.servicio.trim(),
                servicioId: formulario.servicioId || "",
                precioServicio: servicioSeleccionado?.precio || 0,
                fecha: fechaObjetivo,
                hora: formulario.hora,
                duracionMinutos: duracion,
                notas: formulario.notas.trim(),
                ...(serieId ? { serieId } : {}),
                estado: "pendiente",
                origen: "manual",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            )
          );

          setMensaje(
            fechasAGuardar.length > 1
              ? `${fechasAGuardar.length} ${pluralAgenda} creados correctamente en distintas fechas.`
              : `${singularAgenda.charAt(0).toUpperCase() + singularAgenda.slice(1)} creado correctamente.`
          );
          setFechaSeleccionada(fechasAGuardar[0]);
        }
      }

      setMostrandoFormulario(false);
      setEditandoId(null);
      setModoRepeticion("unico");
      setFechasExtra([]);
      setFormulario(FORMULARIO_INICIAL);
    } catch (firebaseError) {
      console.error("Error al guardar reserva/turno:", firebaseError);
      setError(editandoId ? "No se pudo actualizar." : "No se pudo crear.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(turno: Turno, estado: EstadoTurno) {
    if (!empresaId || procesandoId) return;

    setProcesandoId(turno.id);
    setError("");
    setMensaje("");

    try {
      await updateDoc(doc(db, "companies", empresaId, "appointments", turno.id), {
        estado,
        updatedAt: serverTimestamp(),
      });
      setMensaje(`Reserva marcada como ${ESTADOS[estado].nombre.toLowerCase()}.`);
    } catch (firebaseError) {
      console.error("Error al cambiar el estado:", firebaseError);
      setError("No se pudo actualizar el estado.");
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarTurno(turno: Turno) {
    if (!empresaId || procesandoId) return;

    if (confirmandoEliminarId !== turno.id) {
      setConfirmandoEliminarId(turno.id);
      return;
    }

    setConfirmandoEliminarId(null);
    setProcesandoId(turno.id);
    setError("");
    setMensaje("");

    try {
      await deleteDoc(doc(db, "companies", empresaId, "appointments", turno.id));
      setMensaje(`Registro de ${turno.nombreCliente} eliminado.`);
    } catch (firebaseError) {
      console.error("Error al eliminar:", firebaseError);
      setError("No se pudo eliminar.");
    } finally {
      setProcesandoId(null);
    }
  }

  function cambiarDia(offset: number) {
    const d = new Date(`${fechaSeleccionada}T12:00:00`);
    d.setDate(d.getDate() + offset);
    setFechaSeleccionada(obtenerFechaISO(d));
    setConfirmandoEliminarId(null);
  }

  function irAHoy() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setMesActual(inicioMes);
    setFechaSeleccionada(obtenerFechaISO(hoy));
    setConfirmandoEliminarId(null);
  }

  if (agendaHabilitada === false) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-12">
        <Card className="border-blue-200 bg-blue-50 p-5 text-center sm:p-12 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 sm:h-16 sm:w-16 sm:rounded-2xl">
            <CalendarDays className="h-5 w-5 sm:h-8 sm:w-8" />
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 sm:mt-6 sm:text-sm sm:tracking-[0.18em]">
            Suscripción requerida
          </p>
          <h1 className="mt-1.5 text-xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
            {tituloAgenda}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
            Para acceder a la agenda y gestionar {pluralAgenda} necesitás contar con una suscripción activa de NDI AI.
          </p>
          <Button
            type="button"
            className="mt-4 sm:mt-7"
            onClick={() => router.push(`/empresas/${empresaId}/planes`)}
          >
            Ver planes disponibles
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      {/* CABECERA */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Gestión Operativa
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {tituloAgenda}
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
            Disponibilidad, reservas, reprogramaciones y seguimiento de clientes.
          </p>
        </div>

        <Button type="button" className="touch-manipulation" onClick={() => abrirNuevoTurno()}>
          <Plus className="mr-1.5 h-4 w-4" />
          {esAlojamiento ? "Nueva reserva" : usaReservas ? "Nueva reserva" : "Nuevo turno"}
        </Button>
      </header>

      {/* METRICAS */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <ResumenCard
          titulo={pluralAgenda.charAt(0).toUpperCase() + pluralAgenda.slice(1) + " totales"}
          valor={resumen.total}
          icono={<CalendarDays className="h-5 w-5" />}
        />
        <ResumenCard
          titulo={esAlojamiento ? "Huéspedes hoy" : "Para hoy"}
          valor={resumen.hoy}
          icono={<Clock3 className="h-5 w-5" />}
        />
        <ResumenCard
          titulo="Pendientes"
          valor={resumen.pendientes}
          icono={<UserRound className="h-5 w-5" />}
        />
        <ResumenCard
          titulo="Confirmados"
          valor={resumen.confirmados}
          icono={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      {mensaje && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 sm:text-sm">{mensaje}</p>
        </Card>
      )}

      {error && (
        <Card className="mb-5 border-red-200 bg-red-50 p-3.5 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-xs text-red-700 dark:text-red-400 sm:text-sm">{error}</p>
        </Card>
      )}

      {/* FORMULARIO DE AGREGAR/EDITAR */}
      {mostrandoFormulario && (
        <Card className="mb-6 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
              {editandoId
                ? `Editar ${singularAgenda}`
                : esAlojamiento
                ? "Nueva reserva de habitación"
                : `Nuevo ${singularAgenda}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              {esAlojamiento
                ? "Completá los datos del huésped y las fechas de estadía."
                : "Completá los datos del cliente y los detalles de la cita."}
            </p>
          </div>

          <form onSubmit={guardarTurno} className="space-y-4">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <Input
                id="nombreCliente"
                label={esAlojamiento ? "Nombre del huésped / titular" : "Nombre del cliente"}
                value={formulario.nombreCliente}
                onChange={(evento) => actualizarFormulario("nombreCliente", evento.target.value)}
                placeholder="Ej: Juan Pérez"
              />

              {serviciosCatalogo.length > 0 ? (
                <div className="space-y-1.5">
                  <label htmlFor="servicio" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
                    {esAlojamiento ? "Habitación" : "Servicio"}
                  </label>
                  <select
                    id="servicio"
                    value={formulario.servicioId}
                    onChange={(evento) => seleccionarServicio(evento.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <option value="">
                      {esAlojamiento ? "Seleccioná una habitación" : "Seleccioná un servicio"}
                    </option>
                    {serviciosCatalogo.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                        {servicio.precio ? ` · $${Number(servicio.precio).toLocaleString("es-AR")}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  id="servicio"
                  label={esAlojamiento ? "Habitación o tipo de estadía" : "Servicio o motivo"}
                  value={formulario.servicio}
                  onChange={(evento) => actualizarFormulario("servicio", evento.target.value)}
                  placeholder={esAlojamiento ? "Ej: Habitación Matrimonial" : "Ej: Consulta inicial"}
                />
              )}

              <Input
                id="telefono"
                label="Teléfono / WhatsApp"
                value={formulario.telefono}
                onChange={(evento) => actualizarFormulario("telefono", evento.target.value)}
                placeholder="+54 9..."
              />

              <Input
                id="email"
                label="Email (opcional)"
                type="email"
                value={formulario.email}
                onChange={(evento) => actualizarFormulario("email", evento.target.value)}
                placeholder="cliente@email.com"
              />

              {esAlojamiento ? (
                <>
                  <Input
                    id="fechaEntrada"
                    label="Fecha de entrada (Check-in)"
                    type="date"
                    value={formulario.fechaEntrada}
                    onChange={(evento) => actualizarFormulario("fechaEntrada", evento.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="fechaSalida"
                      label="Fecha de salida (Check-out)"
                      type="date"
                      value={formulario.fechaSalida}
                      onChange={(evento) => actualizarFormulario("fechaSalida", evento.target.value)}
                    />
                    <Input
                      id="huespedes"
                      label="Huéspedes"
                      type="number"
                      min="1"
                      max="30"
                      value={formulario.huespedes}
                      onChange={(evento) => actualizarFormulario("huespedes", evento.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Input
                    id="fecha"
                    label={modoRepeticion === "semanal" ? "Fecha de inicio" : "Fecha principal"}
                    type="date"
                    value={formulario.fecha}
                    onChange={(evento) => actualizarFormulario("fecha", evento.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="hora"
                      label="Hora"
                      type="time"
                      value={formulario.hora}
                      onChange={(evento) => actualizarFormulario("hora", evento.target.value)}
                    />
                    <Input
                      id="duracion"
                      label="Duración (min)"
                      type="number"
                      min="5"
                      max="1440"
                      step="5"
                      value={formulario.duracionMinutos}
                      onChange={(evento) => actualizarFormulario("duracionMinutos", evento.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* REPETICIÓN SEMANAL / MÚLTIPLES FECHAS DE DISTINTOS MESES */}
            {!esAlojamiento && !editandoId && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      Frecuencia / Varios días
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Agendá un turno único o repetilo cada semana o en varias fechas de distintos meses.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "unico", label: "Solo este día" },
                        { id: "semanal", label: "Repetir semanalmente" },
                        { id: "fechas_multiples", label: "Varios días / meses" },
                      ] as { id: ModoRepeticion; label: string }[]
                    ).map((opcion) => (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() => setModoRepeticion(opcion.id)}
                        className={[
                          "touch-manipulation rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                          modoRepeticion === opcion.id
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
                        ].join(" ")}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                </div>

                {modoRepeticion === "semanal" && (
                  <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-end pt-1">
                    <Input
                      id="cantidadSemanas"
                      label="Cantidad de semanas"
                      type="number"
                      min="1"
                      max="52"
                      value={cantidadSemanas}
                      onChange={(e) => setCantidadSemanas(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 dark:text-zinc-400 pb-2">
                      Se repetirá cada 7 días desde la fecha de inicio, abarcando los meses que correspondan.
                    </p>
                  </div>
                )}

                {modoRepeticion === "fechas_multiples" && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Input
                          id="fechaExtraInput"
                          label="Sumar otra fecha (cualquier mes)"
                          type="date"
                          value={fechaExtraInput}
                          onChange={(e) => setFechaExtraInput(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="touch-manipulation"
                        onClick={agregarFechaExtra}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Sumar fecha
                      </Button>
                    </div>
                  </div>
                )}

                {fechasObjetivoTurno.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                      Fechas a crear ({fechasObjetivoTurno.length}) a las {formulario.hora || "--:--"} hs:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {fechasObjetivoTurno.map((fechaItem) => (
                        <span
                          key={fechaItem}
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300"
                        >
                          {formatearFechaCorta(fechaItem)}
                          {modoRepeticion === "fechas_multiples" && fechaItem !== formulario.fecha && (
                            <button
                              type="button"
                              onClick={() => quitarFechaExtra(fechaItem)}
                              className="ml-0.5 hover:text-red-500"
                              aria-label={`Quitar ${fechaItem}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="notas" className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
                Notas adicionales
              </label>
              <textarea
                id="notas"
                rows={2}
                maxLength={1000}
                value={formulario.notas}
                onChange={(evento) => actualizarFormulario("notas", evento.target.value)}
                placeholder="Aclaraciones sobre la reserva o requerimientos especiales..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800">
              <Button
                type="button"
                variant="secondary"
                className="touch-manipulation"
                onClick={() => {
                  setMostrandoFormulario(false);
                  setEditandoId(null);
                  setModoRepeticion("unico");
                  setFechasExtra([]);
                  setFormulario(FORMULARIO_INICIAL);
                  setError("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="touch-manipulation" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Guardar cambios"
                  : esAlojamiento
                  ? "Crear reserva"
                  : fechasObjetivoTurno.length > 1
                  ? `Crear ${fechasObjetivoTurno.length} ${pluralAgenda}`
                  : `Crear ${singularAgenda}`}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* BARRA DE VISTAS Y FILTROS */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => {
              setVistaActual("agenda");
              setConfirmandoEliminarId(null);
            }}
            className={[
              "flex touch-manipulation items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
              vistaActual === "agenda"
                ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white",
            ].join(" ")}
          >
            <Clock3 className="h-4 w-4" />
            {esAlojamiento ? "Vista por día" : "Agenda diaria"}
          </button>
          <button
            type="button"
            onClick={() => {
              setVistaActual("mes");
              setConfirmandoEliminarId(null);
            }}
            className={[
              "flex touch-manipulation items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
              vistaActual === "mes"
                ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white",
            ].join(" ")}
          >
            <CalendarIcon className="h-4 w-4" />
            Mes
          </button>
          <button
            type="button"
            onClick={() => {
              setVistaActual("lista");
              setConfirmandoEliminarId(null);
            }}
            className={[
              "flex touch-manipulation items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
              vistaActual === "lista"
                ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white",
            ].join(" ")}
          >
            <List className="h-4 w-4" />
            Listado
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 shrink-0 text-slate-400" />
          {(
            ["todos", "pendiente", "confirmado", "completado", "cancelado"] as FiltroEstado[]
          ).map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => {
                setFiltroEstado(estado);
                setConfirmandoEliminarId(null);
              }}
              className={[
                "shrink-0 touch-manipulation rounded-lg px-2.5 py-1 text-xs font-medium transition",
                filtroEstado === estado
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white",
              ].join(" ")}
            >
              {estado === "todos" ? "Todos" : ESTADOS[estado].nombre}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA 1: AGENDA DIARIA */}
      {vistaActual === "agenda" && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-zinc-800 sm:px-6">
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="secondary" className="touch-manipulation" onClick={() => cambiarDia(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {formatearFechaTexto(fechaSeleccionada)}
              </div>
              <Button type="button" size="sm" variant="secondary" className="touch-manipulation" onClick={() => cambiarDia(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="secondary" className="touch-manipulation" onClick={irAHoy}>
                Hoy
              </Button>
              <Button type="button" size="sm" className="touch-manipulation" onClick={() => abrirNuevoTurno(fechaSeleccionada)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {cargando ? (
              <div className="py-12 text-center text-sm text-slate-500">Cargando agenda...</div>
            ) : turnosDelDiaSeleccionado.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  No hay {pluralAgenda} programados para este día.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3 touch-manipulation"
                  onClick={() => abrirNuevoTurno(fechaSeleccionada)}
                >
                  Crear {singularAgenda} ahora
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {turnosDelDiaSeleccionado.map((turno) => {
                  const estaConfirmando = confirmandoEliminarId === turno.id;

                  return (
                    <div
                      key={turno.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {turno.nombreCliente}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              ESTADOS[turno.estado]?.clase || "",
                            ].join(" ")}
                          >
                            {ESTADOS[turno.estado]?.nombre || turno.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-400">
                          {turno.tipoReserva === "alojamiento" ? (
                            <>
                              <span className="font-medium text-cyan-600 dark:text-cyan-400">Habitación/Estadía:</span>{" "}
                              {turno.servicio} | <span className="font-medium">Check-in:</span> {turno.fechaEntrada} al{" "}
                              <span className="font-medium">Check-out:</span> {turno.fechaSalida} ({turno.huespedes || 2}{" "}
                              huéspedes)
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-cyan-600 dark:text-cyan-400">{turno.hora} hs</span> (
                              {turno.duracionMinutos} min) — {turno.servicio}
                            </>
                          )}
                        </p>
                        {turno.telefono && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {turno.telefono}
                          </p>
                        )}
                        {turno.notas && (
                          <p className="text-xs italic text-slate-500 dark:text-zinc-500">
                            &ldquo;{turno.notas}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800 sm:border-t-0 sm:pt-0">
                        <select
                          value={turno.estado}
                          onChange={(e) => cambiarEstado(turno, e.target.value as EstadoTurno)}
                          disabled={procesandoId === turno.id}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="completado">Finalizado</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="no_asistio">No asistió</option>
                        </select>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="touch-manipulation"
                          onClick={() => editarTurno(turno)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          className="touch-manipulation"
                          onClick={() => eliminarTurno(turno)}
                          disabled={procesandoId === turno.id}
                          title={estaConfirmando ? "Confirmar eliminación" : "Eliminar"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {estaConfirmando && <span className="ml-1 text-[11px] font-semibold">Confirmar</span>}
                        </Button>

                        {estaConfirmando && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="touch-manipulation"
                            onClick={() => setConfirmandoEliminarId(null)}
                          >
                            No
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* VISTA 2: MES */}
      {vistaActual === "mes" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 dark:text-white sm:text-lg">
              {mesActual.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="touch-manipulation"
                onClick={() => {
                  const nuevoMes = new Date(mesActual);
                  nuevoMes.setMonth(nuevoMes.getMonth() - 1);
                  setMesActual(nuevoMes);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="touch-manipulation"
                onClick={() => {
                  const nuevoMes = new Date(mesActual);
                  nuevoMes.setMonth(nuevoMes.getMonth() + 1);
                  setMesActual(nuevoMes);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
            {DIAS_SEMANA.map((dia: string) => (
              <div key={dia} className="py-1">{dia}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {diasCalendario.map((dia, idx) => {
              const turnosDelDia = turnosPorFecha.get(dia.fecha) || [];
              const esHoy = dia.fecha === obtenerFechaISO(new Date());
              const esSeleccionado = dia.fecha === fechaSeleccionada;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setFechaSeleccionada(dia.fecha);
                    setVistaActual("agenda");
                  }}
                  className={[
                    "min-h-[80px] cursor-pointer touch-manipulation rounded-xl border p-1.5 transition flex flex-col justify-between",
                    dia.esMesActual ? "bg-white dark:bg-zinc-950" : "bg-slate-50/50 opacity-40 dark:bg-zinc-900/50",
                    esSeleccionado
                      ? "border-blue-600 ring-2 ring-blue-600/20"
                      : "border-slate-200 dark:border-zinc-800 hover:border-slate-300",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        esHoy ? "bg-blue-600 text-white" : "text-slate-900 dark:text-white",
                      ].join(" ")}
                    >
                      {dia.numeroDia}
                    </span>
                    {turnosDelDia.length > 0 && (
                      <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                        {turnosDelDia.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden mt-1">
                    {turnosDelDia.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-800 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        {t.hora ? `${t.hora} ` : ""}{t.nombreCliente}
                      </div>
                    ))}
                    {turnosDelDia.length > 2 && (
                      <div className="text-[9px] font-medium text-slate-400 pl-0.5">
                        +{turnosDelDia.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* VISTA 3: LISTADO GENERAL */}
      {vistaActual === "lista" && (
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-base font-bold text-slate-950 dark:text-white sm:text-lg">
            Próximos {pluralAgenda} vigentes
          </h2>

          {turnosListadoGeneral.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
              No hay {pluralAgenda} vigentes registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {turnosListadoGeneral.map((turno) => {
                const estaConfirmando = confirmandoEliminarId === turno.id;

                return (
                  <div
                    key={turno.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {turno.nombreCliente}
                        </span>
                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            ESTADOS[turno.estado]?.clase || "",
                          ].join(" ")}
                        >
                          {ESTADOS[turno.estado]?.nombre || turno.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        <span className="font-medium text-cyan-600 dark:text-cyan-400">
                          {turno.tipoReserva === "alojamiento"
                            ? `Del ${turno.fechaEntrada} al ${turno.fechaSalida}`
                            : `${turno.fecha} - ${turno.hora} hs`}
                        </span>{" "}
                        — {turno.servicio}
                      </p>
                      {turno.telefono && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {turno.telefono}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="touch-manipulation"
                        onClick={() => editarTurno(turno)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        className="touch-manipulation"
                        onClick={() => eliminarTurno(turno)}
                        disabled={procesandoId === turno.id}
                      >
                        {estaConfirmando ? "Confirmar" : "Eliminar"}
                      </Button>
                      {estaConfirmando && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="touch-manipulation"
                          onClick={() => setConfirmandoEliminarId(null)}
                        >
                          No
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </section>
  );
}