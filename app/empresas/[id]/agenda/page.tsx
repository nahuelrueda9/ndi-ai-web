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
  Bed,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  List,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
  Users,
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

function planPermiteAgenda(empresa: EmpresaPlan) {
  return empresaTieneFuncion(empresa, "turnos");
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

function obtenerMananaISO() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return obtenerFechaISO(manana);
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

  // Detección exhaustiva de Alojamiento / Hoteles / Hostales
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

    // Si además tiene ítems cargados que dicen "habitación"
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

        const conflicto = turnos.find((turno) => {
          if (
            turno.id === editandoId ||
            turno.fecha !== formulario.fecha ||
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
          setError(`Ese horario se superpone con el turno de ${conflicto.nombreCliente} a las ${conflicto.hora}.`);
          setGuardando(false);
          return;
        }

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

        if (editandoId) {
          await updateDoc(doc(db, "companies", empresaId, "appointments", editandoId), datosTurno);
          setMensaje("Turno actualizado correctamente.");
        } else {
          await addDoc(collection(db, "companies", empresaId, "appointments"), {
            ...datosTurno,
            estado: "pendiente",
            origen: "manual",
            createdAt: serverTimestamp(),
          });
          setMensaje("Turno creado correctamente.");
        }

        setFechaSeleccionada(formulario.fecha);
      }

      setMostrandoFormulario(false);
      setEditandoId(null);
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

    const confirmar = window.confirm(`¿Seguro que querés eliminar la reserva de ${turno.nombreCliente}?`);
    if (!confirmar) return;

    setProcesandoId(turno.id);
    setError("");
    setMensaje("");

    try {
      await deleteDoc(doc(db, "companies", empresaId, "appointments", turno.id));
      setMensaje("Registro eliminado.");
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
  }

  function irAHoy() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setMesActual(inicioMes);
    setFechaSeleccionada(obtenerFechaISO(hoy));
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

        <Button type="button" onClick={() => abrirNuevoTurno()}>
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

              {/* CAMPOS ESPECÍFICOS PARA HOTELES / ALOJAMIENTOS */}
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
                    label="Fecha"
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
                onClick={() => {
                  setMostrandoFormulario(false);
                  setEditandoId(null);
                  setFormulario(FORMULARIO_INICIAL);
                  setError("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Guardar cambios"
                  : esAlojamiento
                  ? "Crear reserva"
                  : `Crear ${singularAgenda}`}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* BARRA DE VISTAS Y FILTROS */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        {/* Pestañas de Vista */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setVistaActual("agenda")}
            className={[
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
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
            onClick={() => setVistaActual("mes")}
            className={[
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
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
            onClick={() => setVistaActual("lista")}
            className={[
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
              vistaActual === "lista"
                ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white",
            ].join(" ")}
          >
            <List className="h-4 w-4" />
            Listado
          </button>
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 shrink-0 text-slate-400" />
          {(
            ["todos", "pendiente", "confirmado", "completado", "cancelado"] as FiltroEstado[]
          ).map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              className={[
                "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition",
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

      {/* CONTENIDO SEGÚN LA VISTA */}

      {/* 1. VISTA AGENDA DIARIA */}
      {vistaActual === "agenda" && (
        <Card className="overflow-hidden">
          {/* Navegador de Fecha */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-zinc-800 sm:px-6">
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => cambiarDia(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white sm:text-sm">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="bg-transparent font-medium outline-none"
                />
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => cambiarDia(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={irAHoy}>
                Hoy
              </Button>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 sm:text-sm">
              {formatearFechaTexto(fechaSeleccionada)}
            </p>
          </div>

          {/* Lista de Turnos del Día */}
          <div className="p-4 sm:p-6">
            {cargando ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">Cargando {pluralAgenda}...</p>
              </div>
            ) : turnosDelDiaSeleccionado.length === 0 ? (
              <div className="py-16 text-center">
                {esAlojamiento ? (
                  <Bed className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
                ) : (
                  <Clock3 className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
                )}
                <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">
                  No hay {pluralAgenda} para este día
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {esAlojamiento
                    ? "Podés registrar una reserva manual o esperar que los huéspedes reserven desde la web."
                    : "Podés crear una cita manualmente o esperar que tus clientes reserven online."}
                </p>
                <Button type="button" className="mt-5" onClick={() => abrirNuevoTurno(fechaSeleccionada)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {esAlojamiento ? "Crear reserva" : "Crear turno"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {turnosDelDiaSeleccionado.map((turno) => (
                  <TarjetaTurnoAncha
                    key={turno.id}
                    turno={turno}
                    esAlojamiento={esAlojamiento}
                    procesando={procesandoId === turno.id}
                    onCambiarEstado={cambiarEstado}
                    onEditar={editarTurno}
                    onEliminar={eliminarTurno}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 2. VISTA MES */}
      {vistaActual === "mes" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-zinc-800 sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                {formatearMes(mesActual)}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Hacé clic en un día para ver sus {pluralAgenda} en la vista diaria.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => cambiarMes(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={irAHoy}>
                Hoy
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => cambiarMes(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-blue-200 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-500/5">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {diasCalendario.map((dia) => {
              const fechaISO = obtenerFechaISO(dia.fecha);
              const turnosDelDia = turnosPorFecha.get(fechaISO) ?? [];
              const seleccionado = fechaISO === fechaSeleccionada;
              const esHoy = fechaISO === obtenerFechaISO(new Date());

              return (
                <button
                  key={fechaISO}
                  type="button"
                  onClick={() => {
                    setFechaSeleccionada(fechaISO);
                    setVistaActual("agenda");
                  }}
                  className={[
                    "relative min-h-[90px] border-b border-r border-slate-200 p-2 text-left transition-colors dark:border-zinc-800 sm:min-h-[120px] sm:p-3",
                    dia.perteneceAlMes ? "bg-white dark:bg-zinc-900/40" : "bg-slate-50/70 dark:bg-zinc-950/60",
                    seleccionado ? "bg-blue-50/80 ring-2 ring-inset ring-blue-500 dark:bg-blue-500/15" : "hover:bg-slate-100/60 dark:hover:bg-zinc-800/40",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-lg text-xs font-semibold",
                      esHoy
                        ? "bg-blue-600 font-bold text-white shadow-sm"
                        : dia.perteneceAlMes
                        ? "text-slate-950 dark:text-zinc-100"
                        : "text-slate-400 dark:text-zinc-600",
                    ].join(" ")}
                  >
                    {dia.fecha.getDate()}
                  </span>

                  {turnosDelDia.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {turnosDelDia.slice(0, 3).map((turno) => (
                        <div
                          key={turno.id}
                          className="truncate rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                        >
                          {turno.tipoReserva === "alojamiento"
                            ? `🏨 ${turno.nombreCliente}`
                            : `${turno.hora} ${turno.nombreCliente}`}
                        </div>
                      ))}
                      {turnosDelDia.length > 3 && (
                        <p className="text-[10px] font-medium text-slate-500">+{turnosDelDia.length - 3} más</p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* 3. VISTA LISTADO GENERAL */}
      {vistaActual === "lista" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
              {esAlojamiento ? "Próximas reservas de habitaciones" : "Próximos turnos y reservas"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Listado completo cronológico de {pluralAgenda} vigentes.
            </p>
          </div>

          {turnosListadoGeneral.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-300 dark:text-zinc-700" />
              <p className="mt-3 text-sm text-slate-500">No hay {pluralAgenda} registradas con este filtro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {turnosListadoGeneral.map((turno) => (
                <TarjetaTurnoAncha
                  key={turno.id}
                  turno={turno}
                  esAlojamiento={esAlojamiento}
                  mostrarFecha
                  procesando={procesandoId === turno.id}
                  onCambiarEstado={cambiarEstado}
                  onEditar={editarTurno}
                  onEliminar={eliminarTurno}
                />
              ))}
            </div>
          )}
        </Card>
      )}
    </section>
  );

  function cambiarMes(diferencia: number) {
    setMesActual((actual) => new Date(actual.getFullYear(), actual.getMonth() + diferencia, 1));
  }
}

function TarjetaTurnoAncha({
  turno,
  esAlojamiento,
  procesando,
  mostrarFecha = false,
  onCambiarEstado,
  onEditar,
  onEliminar,
}: {
  turno: Turno;
  esAlojamiento: boolean;
  procesando: boolean;
  mostrarFecha?: boolean;
  onCambiarEstado: (turno: Turno, estado: EstadoTurno) => void;
  onEditar: (turno: Turno) => void;
  onEliminar: (turno: Turno) => void;
}) {
  const horaFin = useMemo(() => {
    if (!turno.hora) return "";
    const minInicio = convertirHoraAMinutos(turno.hora);
    const minFin = minInicio + (turno.duracionMinutos || 30);
    const h = Math.floor(minFin / 60) % 24;
    const m = minFin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, [turno.hora, turno.duracionMinutos]);

  const esTipoAlojamiento = turno.tipoReserva === "alojamiento" || esAlojamiento;

  const whatsappHref = turno.telefono
    ? `https://wa.me/${turno.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
        esTipoAlojamiento
          ? `¡Hola ${turno.nombreCliente}! Nos comunicamos desde el alojamiento para confirmar tu estadía (${turno.fechaEntrada || turno.fecha} al ${turno.fechaSalida || "check-out"}).`
          : `¡Hola ${turno.nombreCliente}! Nos comunicamos para confirmar tu turno del ${turno.fecha} a las ${turno.hora} hs.`
      )}`
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 sm:flex-row sm:items-center sm:justify-between">
      {/* Columna Izquierda */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800 sm:w-48 sm:flex-col sm:items-start sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
        {esTipoAlojamiento ? (
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
              <Bed className="h-4 w-4 text-blue-500 shrink-0" />
              <span>{turno.fechaEntrada || turno.fecha}</span>
            </div>
            {turno.fechaSalida && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                hasta el {turno.fechaSalida}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              {turno.hora || "--:--"}
            </p>
            {horaFin && (
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                hasta las {horaFin} hs
              </p>
            )}
          </div>
        )}

        {mostrarFecha && !esTipoAlojamiento && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
            {turno.fecha}
          </span>
        )}
      </div>

      {/* Columna Central: Datos del Cliente y Habitación/Servicio */}
      <div className="min-w-0 flex-1 sm:px-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-slate-950 dark:text-white">
            {turno.nombreCliente}
          </h3>
          <span
            className={[
              "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold",
              ESTADOS[turno.estado].clase,
            ].join(" ")}
          >
            {ESTADOS[turno.estado].nombre}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
          <span>{turno.servicio}</span>
          {turno.precioServicio ? (
            <span className="text-slate-500 dark:text-zinc-400">
              · ${turno.precioServicio.toLocaleString("es-AR")}
            </span>
          ) : null}
          {esTipoAlojamiento && turno.huespedes ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Users className="h-3 w-3" /> {turno.huespedes} huésped{turno.huespedes === 1 ? "" : "es"}
            </span>
          ) : null}
        </div>

        {/* Datos de contacto */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
          {turno.telefono && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {turno.telefono}
            </span>
          )}
          {turno.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {turno.email}
            </span>
          )}
        </div>

        {turno.notas && (
          <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs italic text-slate-600 dark:bg-zinc-950/60 dark:text-zinc-400">
            &quot;{turno.notas}&quot;
          </p>
        )}
      </div>

      {/* Columna Derecha: Acciones Rápidas */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-zinc-800 sm:border-t-0 sm:pt-0">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
            title="Escribir por WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        )}

        {turno.estado !== "confirmado" && (
          <button
            type="button"
            disabled={procesando}
            onClick={() => onCambiarEstado(turno, "confirmado")}
            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
          >
            Confirmar
          </button>
        )}

        {turno.estado !== "completado" && (
          <button
            type="button"
            disabled={procesando}
            onClick={() => onCambiarEstado(turno, "completado")}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            Finalizado
          </button>
        )}

        {turno.estado !== "cancelado" && (
          <button
            type="button"
            disabled={procesando}
            onClick={() => onCambiarEstado(turno, "cancelado")}
            className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/15 dark:text-rose-400"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          disabled={procesando}
          onClick={() => onEditar(turno)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={procesando}
          onClick={() => onEliminar(turno)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ResumenCard({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">{titulo}</p>
        <div className="text-cyan-700 dark:text-cyan-400">{icono}</div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
        {valor}
      </p>
    </Card>
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

function obtenerFechasEstadia(fechaEntrada: string, fechaSalida: string) {
  const fechas: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrada) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaSalida) || fechaSalida <= fechaEntrada) {
    return [fechaEntrada];
  }

  const cursor = new Date(`${fechaEntrada}T12:00:00`);
  const salida = new Date(`${fechaSalida}T12:00:00`);

  while (cursor < salida) {
    fechas.push(obtenerFechaISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return fechas;
}

function construirDiasCalendario(mes: Date) {
  const primerDiaMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const ultimoDiaMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  const diaSemanaInicial = (primerDiaMes.getDay() + 6) % 7;
  const inicioCalendario = new Date(primerDiaMes);
  inicioCalendario.setDate(primerDiaMes.getDate() - diaSemanaInicial);

  const dias: Array<{ fecha: Date; perteneceAlMes: boolean }> = [];

  for (let indice = 0; indice < 42; indice += 1) {
    const fecha = new Date(inicioCalendario);
    fecha.setDate(inicioCalendario.getDate() + indice);
    dias.push({
      fecha,
      perteneceAlMes:
        fecha.getMonth() === primerDiaMes.getMonth() &&
        fecha.getFullYear() === primerDiaMes.getFullYear(),
    });
  }

  const necesitaSextaFila = dias.slice(35).some((dia) => dia.perteneceAlMes && dia.fecha <= ultimoDiaMes);
  return necesitaSextaFila ? dias : dias.slice(0, 35);
}

function obtenerFechaISO(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearMes(fecha: Date) {
  const texto = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFechaTexto(fechaISO: string) {
  if (!fechaISO) return "";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}