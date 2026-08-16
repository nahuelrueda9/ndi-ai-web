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
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Pencil,
  Plus,
  Trash2,
  UserRound,
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
};

type FiltroEstado = "todos" | EstadoTurno;

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

function planPermiteAgenda(
  empresa: EmpresaPlan,
) {
  return empresaTieneFuncion(
    empresa,
    "turnos",
  );
}

const DIAS_SEMANA = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

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
    "0": {
      activo: false,
      apertura: "09:00",
      cierre: "18:00",
      descansoInicio: "",
      descansoFin: "",
    },
    "1": {
      activo: true,
      apertura: "09:00",
      cierre: "18:00",
      descansoInicio: "",
      descansoFin: "",
    },
    "2": {
      activo: true,
      apertura: "09:00",
      cierre: "18:00",
      descansoInicio: "",
      descansoFin: "",
    },
    "3": {
      activo: true,
      apertura: "09:00",
      cierre: "18:00",
      descansoInicio: "",
      descansoFin: "",
    },
    "4": {
      activo: true,
      apertura: "09:00",
      cierre: "18:00",
      descansoInicio: "",
      descansoFin: "",
    },
    "5": {
      activo: true,
      apertura: "09:00",
      cierre: "18:00",
      descansoInicio: "",
      descansoFin: "",
    },
    "6": {
      activo: false,
      apertura: "09:00",
      cierre: "13:00",
      descansoInicio: "",
      descansoFin: "",
    },
  },
};

const FORMULARIO_INICIAL: FormularioTurno = {
  nombreCliente: "",
  email: "",
  telefono: "",
  servicio: "",
  servicioId: "",
  fecha: obtenerFechaISO(new Date()),
  hora: "09:00",
  duracionMinutos: "60",
  notas: "",
};

const ESTADOS: Record<
  EstadoTurno,
  {
    nombre: string;
    variant: "default" | "info" | "success" | "danger" | "warning";
  }
> = {
  pendiente: {
    nombre: "Pendiente",
    variant: "warning",
  },
  confirmado: {
    nombre: "Confirmado",
    variant: "info",
  },
  completado: {
    nombre: "Completado",
    variant: "success",
  },
  cancelado: {
    nombre: "Cancelado",
    variant: "danger",
  },
  no_asistio: {
    nombre: "No asistió",
    variant: "danger",
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
  const [serviciosCatalogo, setServiciosCatalogo] =
    useState<CatalogoServicio[]>([]);
  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const [mesActual, setMesActual] = useState(() => {
    const fecha = new Date();
    fecha.setDate(1);
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  });

  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(obtenerFechaISO(new Date()));

  const [formulario, setFormulario] =
    useState<FormularioTurno>(FORMULARIO_INICIAL);

  const [mostrandoFormulario, setMostrandoFormulario] =
    useState(false);

  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>("todos");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] =
    useState<string | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [
    agendaHabilitada,
    setAgendaHabilitada,
  ] = useState<boolean | null>(null);

  const [rubroEmpresa, setRubroEmpresa] =
    useState("");

  const [agendaConfig, setAgendaConfig] =
    useState<AgendaConfig>(AGENDA_CONFIG_INICIAL);

  const [guardandoHorarios, setGuardandoHorarios] =
    useState(false);

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      setCargando(false);
      return;
    }

    const empresaIdSeguro =
      empresaId;

    let cancelarTurnos:
      | (() => void)
      | undefined;

    let cancelarCatalogo:
      | (() => void)
      | undefined;

    async function cargarAgenda() {
      try {
        const empresaSnapshot =
          await getDoc(
            doc(
              db,
              "companies",
              empresaIdSeguro
            )
          );

        if (!empresaSnapshot.exists()) {
          setError(
            "La empresa no existe."
          );
          setCargando(false);
          return;
        }

        const empresaData =
          empresaSnapshot.data() as EmpresaPlan;

        const habilitada =
          planPermiteAgenda(
            empresaData
          );

        setAgendaHabilitada(
          habilitada
        );

        setRubroEmpresa(
          typeof empresaData.rubro === "string"
            ? empresaData.rubro
            : ""
        );

        setAgendaConfig(
          normalizarAgendaConfig(
            empresaData.agendaConfig
          )
        );

        if (!habilitada) {
          setTurnos([]);
          setServiciosCatalogo([]);
          setCargando(false);
          return;
        }

        cancelarCatalogo = onSnapshot(
          collection(
            db,
            "companies",
            empresaIdSeguro,
            "catalog"
          ),
          (snapshot) => {
            const servicios = snapshot.docs
              .map((documento) => ({
                id: documento.id,
                ...(documento.data() as Omit<
                  CatalogoServicio,
                  "id"
                >),
              }))
              .filter(
                (item) =>
                  item.tipo === "servicio" &&
                  item.activo !== false
              )
              .sort((a, b) =>
                a.nombre.localeCompare(
                  b.nombre,
                  "es"
                )
              );

            setServiciosCatalogo(servicios);
          },
          (firebaseError) => {
            console.error(
              "Error al cargar servicios:",
              firebaseError
            );
          }
        );

        const turnosRef = collection(
          db,
          "companies",
          empresaIdSeguro,
          "appointments"
        );

        cancelarTurnos = onSnapshot(
          turnosRef,
          (snapshot) => {
            const lista =
              snapshot.docs.map(
                (documento) => {
                  const datos =
                    documento.data() as Omit<
                      Turno,
                      "id"
                    >;

                  const fechaNormalizada =
                    datos.fecha ||
                    datos.fechaEntrada ||
                    "";

                  return {
                    id: documento.id,
                    ...datos,
                    fecha:
                      fechaNormalizada,
                    hora:
                      datos.hora ||
                      (datos.tipoReserva ===
                      "alojamiento"
                        ? "14:00"
                        : ""),
                    duracionMinutos:
                      Number(
                        datos.duracionMinutos
                      ) || 0,
                    estado:
                      datos.estado ||
                      "pendiente",
                  };
                }
              );

            setTurnos(lista);
            setError("");
            setCargando(false);
          },
          (firebaseError) => {
            console.error(
              "Error al cargar turnos:",
              firebaseError
            );

            setError(
              firebaseError.code ===
                "permission-denied"
                ? "No tenés permisos para ver la agenda."
                : "No se pudieron cargar los turnos."
            );

            setCargando(false);
          }
        );
      } catch (firebaseError) {
        console.error(
          "Error al verificar el plan de Agenda:",
          firebaseError
        );

        setError(
          "No se pudo verificar el plan."
        );
        setCargando(false);
      }
    }

    void cargarAgenda();

    return () => {
      cancelarTurnos?.();
      cancelarCatalogo?.();
    };
  }, [empresaId]);

  const diasCalendario = useMemo(
    () => construirDiasCalendario(mesActual),
    [mesActual]
  );

  const turnosFiltrados = useMemo(() => {
    const hoy = obtenerFechaISO(
      new Date()
    );

    return turnos
      .filter((turno) => {
        const fechaInicio =
          turno.fechaEntrada ||
          turno.fecha ||
          "";

        const fechaFin =
          turno.fechaSalida ||
          fechaInicio;

        const sigueVigente =
          turno.tipoReserva ===
            "alojamiento"
            ? fechaFin >= hoy
            : fechaInicio >= hoy;

        if (!sigueVigente) {
          return false;
        }

        if (filtroEstado === "todos") {
          return true;
        }

        return turno.estado === filtroEstado;
      })
      .sort((a, b) => {
        const fechaA =
          a.fechaEntrada ||
          a.fecha ||
          "";

        const fechaB =
          b.fechaEntrada ||
          b.fecha ||
          "";

        const porFecha =
          fechaA.localeCompare(fechaB);

        if (porFecha !== 0) {
          return porFecha;
        }

        return (a.hora || "").localeCompare(
          b.hora || ""
        );
      });
  }, [
    turnos,
    filtroEstado,
  ]);

  const resumen = useMemo(() => {
    const hoy = obtenerFechaISO(new Date());

    return {
      total: turnos.length,
      hoy: turnos.filter(
        (turno) => turno.fecha === hoy
      ).length,
      pendientes: turnos.filter(
        (turno) => turno.estado === "pendiente"
      ).length,
      confirmados: turnos.filter(
        (turno) => turno.estado === "confirmado"
      ).length,
    };
  }, [turnos]);

  const turnosPorFecha = useMemo(() => {
    const mapa = new Map<string, Turno[]>();

    turnos.forEach((turno) => {
      const fechas =
        turno.tipoReserva === "alojamiento" &&
        turno.fechaEntrada &&
        turno.fechaSalida
          ? obtenerFechasEstadia(
              turno.fechaEntrada,
              turno.fechaSalida
            )
          : [turno.fecha];

      fechas.forEach((fecha) => {
        const existentes =
          mapa.get(fecha) ?? [];

        mapa.set(
          fecha,
          [...existentes, turno]
        );
      });
    });

    return mapa;
  }, [turnos]);

  function abrirNuevoTurno(
    fecha = fechaSeleccionada
  ) {
    setEditandoId(null);
    setFormulario({
      ...FORMULARIO_INICIAL,
      fecha,
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
      hora: turno.hora,
      duracionMinutos: String(
        turno.duracionMinutos
      ),
      notas: turno.notas || "",
    });

    setFechaSeleccionada(turno.fecha);
    setMostrandoFormulario(true);
    setError("");
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function seleccionarServicio(servicioId: string) {
    const servicio = serviciosCatalogo.find(
      (item) => item.id === servicioId
    );

    if (!servicio) {
      setFormulario((actual) => ({
        ...actual,
        servicioId: "",
        servicio: "",
      }));
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      servicioId: servicio.id,
      servicio: servicio.nombre,
      duracionMinutos: String(
        servicio.duracionMinutos || 60
      ),
    }));
  }

  function actualizarFormulario<
    Clave extends keyof FormularioTurno
  >(
    clave: Clave,
    valor: FormularioTurno[Clave]
  ) {
    setFormulario((actual) => ({
      ...actual,
      [clave]: valor,
    }));
  }

  function validarFormulario() {
    if (!formulario.nombreCliente.trim()) {
      return "Escribí el nombre del cliente.";
    }

    if (!formulario.servicio.trim()) {
      return "Escribí el servicio o motivo del turno.";
    }

    if (!formulario.fecha) {
      return "Seleccioná una fecha.";
    }

    if (!formulario.hora) {
      return "Seleccioná un horario.";
    }

    const duracion = Number(
      formulario.duracionMinutos
    );

    if (
      !Number.isFinite(duracion) ||
      duracion < 5 ||
      duracion > 1440
    ) {
      return "Ingresá una duración válida.";
    }

    return "";
  }

  async function guardarTurno(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!empresaId || guardando) {
      return;
    }

    setError("");
    setMensaje("");

    const validacion = validarFormulario();

    if (validacion) {
      setError(validacion);
      return;
    }

    const duracion = Number(
      formulario.duracionMinutos
    );

    const inicioNuevo =
      convertirHoraAMinutos(formulario.hora);
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

      const inicioExistente =
        convertirHoraAMinutos(turno.hora);
      const finExistente =
        inicioExistente + turno.duracionMinutos;

      return (
        inicioNuevo < finExistente &&
        finNuevo > inicioExistente
      );
    });

    if (conflicto) {
      setError(
        `Ese horario se superpone con el turno de ${conflicto.nombreCliente} a las ${conflicto.hora}.`
      );
      return;
    }

    const servicioSeleccionado =
      serviciosCatalogo.find(
        (item) =>
          item.id === formulario.servicioId
      );

    setGuardando(true);

    try {
      const datosTurno = {
        nombreCliente:
          formulario.nombreCliente.trim(),
        email: formulario.email.trim(),
        telefono: formulario.telefono.trim(),
        servicio: formulario.servicio.trim(),
        servicioId:
          formulario.servicioId || "",
        precioServicio:
          servicioSeleccionado?.precio || 0,
        fecha: formulario.fecha,
        hora: formulario.hora,
        duracionMinutos: duracion,
        notas: formulario.notas.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editandoId) {
        await updateDoc(
          doc(
            db,
            "companies",
            empresaId,
            "appointments",
            editandoId
          ),
          datosTurno
        );

        setMensaje(
          "Turno actualizado correctamente."
        );
      } else {
        await addDoc(
          collection(
            db,
            "companies",
            empresaId,
            "appointments"
          ),
          {
            ...datosTurno,
            estado: "pendiente",
            origen: "manual",
            createdAt: serverTimestamp(),
          }
        );

        setMensaje(
          "Turno creado correctamente."
        );
      }

      setFechaSeleccionada(formulario.fecha);
      setMostrandoFormulario(false);
      setEditandoId(null);
      setFormulario(FORMULARIO_INICIAL);
    } catch (firebaseError) {
      console.error(
        "Error al guardar turno:",
        firebaseError
      );

      setError(
        editandoId
          ? "No se pudo actualizar el turno."
          : "No se pudo crear el turno."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(
    turno: Turno,
    estado: EstadoTurno
  ) {
    if (!empresaId || procesandoId) {
      return;
    }

    setProcesandoId(turno.id);
    setError("");
    setMensaje("");

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "appointments",
          turno.id
        ),
        {
          estado,
          updatedAt: serverTimestamp(),
        }
      );

      setMensaje(
        `Turno marcado como ${ESTADOS[
          estado
        ].nombre.toLowerCase()}.`
      );
    } catch (firebaseError) {
      console.error(
        "Error al cambiar el turno:",
        firebaseError
      );

      setError(
        "No se pudo actualizar el turno."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarTurno(turno: Turno) {
    if (!empresaId || procesandoId) {
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que querés eliminar el turno de ${turno.nombreCliente}?`
    );

    if (!confirmar) {
      return;
    }

    setProcesandoId(turno.id);
    setError("");
    setMensaje("");

    try {
      await deleteDoc(
        doc(
          db,
          "companies",
          empresaId,
          "appointments",
          turno.id
        )
      );

      setMensaje("Turno eliminado.");
    } catch (firebaseError) {
      console.error(
        "Error al eliminar turno:",
        firebaseError
      );

      setError("No se pudo eliminar el turno.");
    } finally {
      setProcesandoId(null);
    }
  }

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
    if (!empresaId || guardandoHorarios) {
      return;
    }

    setError("");
    setMensaje("");

    if (
      !Number.isFinite(agendaConfig.intervaloMinutos) ||
      agendaConfig.intervaloMinutos < 5 ||
      agendaConfig.intervaloMinutos > 240
    ) {
      setError("Elegí un intervalo de turnos válido.");
      return;
    }

    for (const dia of DIAS_CONFIG) {
      const config = agendaConfig.dias[dia.clave];

      if (!config?.activo) {
        continue;
      }

      if (
        !horaAgendaValida(config.apertura) ||
        !horaAgendaValida(config.cierre) ||
        convertirHoraAMinutos(config.apertura) >=
          convertirHoraAMinutos(config.cierre)
      ) {
        setError(
          `Revisá el horario de ${dia.nombre.toLowerCase()}.`
        );
        return;
      }

      const tieneInicioDescanso = Boolean(
        config.descansoInicio
      );
      const tieneFinDescanso = Boolean(
        config.descansoFin
      );

      if (tieneInicioDescanso !== tieneFinDescanso) {
        setError(
          `Completá ambos horarios de descanso de ${dia.nombre.toLowerCase()} o dejalos vacíos.`
        );
        return;
      }

      if (
        tieneInicioDescanso &&
        tieneFinDescanso
      ) {
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
          setError(
            `Revisá el descanso de ${dia.nombre.toLowerCase()}.`
          );
          return;
        }
      }
    }

    setGuardandoHorarios(true);

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId
        ),
        {
          agendaConfig,
          updatedAt: serverTimestamp(),
        }
      );

      setMensaje(
        agendaConfig.activa
          ? "Horarios de reservas guardados y activados."
          : "Horarios guardados. Las reservas online siguen desactivadas."
      );
    } catch (firebaseError) {
      console.error(
        "Error al guardar horarios de agenda:",
        firebaseError
      );

      setError(
        "No se pudieron guardar los horarios de reservas."
      );
    } finally {
      setGuardandoHorarios(false);
    }
  }

  function cambiarMes(diferencia: number) {
    setMesActual((actual) => {
      const nuevoMes = new Date(
        actual.getFullYear(),
        actual.getMonth() + diferencia,
        1
      );

      return nuevoMes;
    });
  }

  function irAHoy() {
    const hoy = new Date();
    const inicioMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    setMesActual(inicioMes);
    setFechaSeleccionada(
      obtenerFechaISO(hoy)
    );
  }

  const rubroNormalizado =
    rubroEmpresa.trim().toLowerCase();

  const usaReservas = [
    "restaurante",
    "restaurant",
    "hotel",
    "hostal",
    "alojamiento",
    "cabaña",
    "cabana",
    "cabañas",
    "cabanas",
  ].some((rubro) =>
    rubroNormalizado.includes(rubro)
  );

  const singularAgenda =
    usaReservas ? "reserva" : "turno";

  const pluralAgenda =
    usaReservas ? "reservas" : "turnos";

  const tituloAgenda =
    usaReservas
      ? "Agenda y reservas"
      : "Agenda y turnos";

  if (agendaHabilitada === false) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-12">
        <Card className="border-cyan-200 bg-cyan-50 p-5 text-center sm:p-12 dark:border-cyan-500/20 dark:bg-cyan-500/5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 sm:h-16 sm:w-16 sm:rounded-2xl">
            <CalendarDays className="h-5 w-5 sm:h-8 sm:w-8" />
          </div>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400 sm:mt-6 sm:text-sm sm:tracking-[0.18em]">
            Función Pro
          </p>

          <h1 className="mt-1.5 text-xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
            {tituloAgenda}
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
            La gestión de {pluralAgenda} está disponible en los planes que incluyen agenda.
          </p>

          <Button
            type="button"
            className="mt-4 sm:mt-7"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/planes`
              )
            }
          >
            Ver plan Pro
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-4 flex items-end justify-between gap-3 sm:mb-8 sm:flex-col sm:items-stretch sm:gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-medium text-cyan-700 dark:text-cyan-400 sm:text-sm">
            Organización comercial
          </p>

          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">
            {tituloAgenda}
          </h1>

          <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:max-w-2xl sm:text-sm sm:leading-6">
            {usaReservas
              ? "Administrá reservas, confirmaciones y seguimiento desde un solo lugar."
              : "Administrá citas, confirmaciones y seguimientos desde un solo lugar."}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => abrirNuevoTurno()}
        >
          <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          {usaReservas ? "Nueva reserva" : "Nuevo turno"}
        </Button>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          titulo={usaReservas ? "Reservas totales" : "Turnos totales"}
          valor={resumen.total}
          icono={
            <CalendarDays className="h-5 w-5" />
          }
        />

        <ResumenCard
          titulo="Para hoy"
          valor={resumen.hoy}
          icono={<Clock3 className="h-5 w-5" />}
        />

        <ResumenCard
          titulo="Pendientes"
          valor={resumen.pendientes}
          icono={
            <UserRound className="h-5 w-5" />
          }
        />

        <ResumenCard
          titulo="Confirmados"
          valor={resumen.confirmados}
          icono={
            <CheckCircle2 className="h-5 w-5" />
          }
        />
      </div>

      <Card className="mb-3 overflow-hidden sm:mb-6">
        <div className="flex flex-col justify-between gap-2.5 border-b border-slate-200 p-3 dark:border-zinc-800 sm:gap-4 sm:p-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                Disponibilidad para reservas online
              </h2>

              <Badge
                variant={
                  agendaConfig.activa
                    ? "success"
                    : "default"
                }
              >
                {agendaConfig.activa
                  ? "Reservas activas"
                  : "Reservas desactivadas"}
              </Badge>
            </div>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
              Definí qué días y horarios puede elegir un cliente desde la página pública.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
            <div>
              <p className="text-[11px] font-medium text-slate-950 dark:text-white sm:text-sm">
                Permitir reservas online
              </p>
              <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-500 sm:text-xs sm:leading-normal">
                Los clientes verán solamente horarios libres.
              </p>
            </div>

            <input
              type="checkbox"
              checked={agendaConfig.activa}
              onChange={(evento) =>
                setAgendaConfig((actual) => ({
                  ...actual,
                  activa: evento.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600 sm:h-5 sm:w-5"
            />
          </label>
        </div>

        <div className="p-3 sm:p-5">
          <div className="mb-3 max-w-xs sm:mb-5">
            <label
              htmlFor="intervaloTurnos"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
            >
              Intervalo entre horarios ofrecidos
            </label>

            <select
              id="intervaloTurnos"
              value={agendaConfig.intervaloMinutos}
              onChange={(evento) =>
                setAgendaConfig((actual) => ({
                  ...actual,
                  intervaloMinutos: Number(
                    evento.target.value
                  ),
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
            >
              {[15, 30, 45, 60].map((minutos) => (
                <option key={minutos} value={minutos}>
                  Cada {minutos} minutos
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {DIAS_CONFIG.map((dia) => {
              const config = agendaConfig.dias[dia.clave];

              return (
                <div
                  key={dia.clave}
                  className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40 sm:gap-4 sm:rounded-2xl sm:p-4 lg:grid-cols-[180px_1fr_1fr_1fr_1fr] lg:items-end"
                >
                  <label className="col-span-2 flex cursor-pointer items-center gap-2 border-b border-slate-200 pb-2 dark:border-zinc-800 sm:gap-3 lg:col-span-1 lg:border-b-0 lg:pb-2">
                    <input
                      type="checkbox"
                      checked={config.activo}
                      onChange={(evento) =>
                        actualizarDiaAgenda(
                          dia.clave,
                          "activo",
                          evento.target.checked
                        )
                      }
                      className="h-4 w-4 accent-blue-600 sm:h-5 sm:w-5"
                    />

                    <span className="text-xs font-medium text-slate-950 dark:text-white sm:text-base">
                      {dia.nombre}
                    </span>
                  </label>

                  <HorarioCampo
                    label="Apertura"
                    value={config.apertura}
                    disabled={!config.activo}
                    onChange={(valor) =>
                      actualizarDiaAgenda(
                        dia.clave,
                        "apertura",
                        valor
                      )
                    }
                  />

                  <HorarioCampo
                    label="Cierre"
                    value={config.cierre}
                    disabled={!config.activo}
                    onChange={(valor) =>
                      actualizarDiaAgenda(
                        dia.clave,
                        "cierre",
                        valor
                      )
                    }
                  />

                  <HorarioCampo
                    label="Descanso desde"
                    value={config.descansoInicio}
                    disabled={!config.activo}
                    onChange={(valor) =>
                      actualizarDiaAgenda(
                        dia.clave,
                        "descansoInicio",
                        valor
                      )
                    }
                  />

                  <HorarioCampo
                    label="Descanso hasta"
                    value={config.descansoFin}
                    disabled={!config.activo}
                    onChange={(valor) =>
                      actualizarDiaAgenda(
                        dia.clave,
                        "descansoFin",
                        valor
                      )
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col justify-between gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800 sm:mt-5 sm:gap-3 sm:pt-5 sm:flex-row sm:items-center">
            <p className="text-[9px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs sm:leading-5">
              {usaReservas
                ? "Las reservas ya ocupadas y los horarios de descanso se eliminan automáticamente de la disponibilidad pública."
                : "Los turnos ya ocupados y los horarios de descanso se eliminan automáticamente de la disponibilidad pública."}
            </p>

            <Button
              type="button"
              disabled={guardandoHorarios}
              onClick={guardarConfiguracionHorarios}
            >
              {guardandoHorarios
                ? "Guardando..."
                : "Guardar horarios"}
            </Button>
          </div>
        </div>
      </Card>

      {mensaje && (
        <Card className="mb-3 border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:mb-6 sm:p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 sm:text-sm">
            {mensaje}
          </p>
        </Card>
      )}

      {error && (
        <Card className="mb-3 border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10 sm:mb-6 sm:p-4">
          <p className="text-xs text-red-700 dark:text-red-400 sm:text-sm">
            {error}
          </p>
        </Card>
      )}

      {mostrandoFormulario && (
        <Card className="mb-3 p-4 sm:mb-6 sm:p-6">
          <div className="mb-3 sm:mb-6">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-xl">
              {editandoId
                ? `Editar ${singularAgenda}`
                : usaReservas
                  ? "Nueva reserva"
                  : "Nuevo turno"}
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
              Completá los datos básicos de la cita.
            </p>
          </div>

          <form
            onSubmit={guardarTurno}
            className="space-y-3 sm:space-y-5"
          >
            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <Input
                id="nombreCliente"
                label="Nombre del cliente"
                value={formulario.nombreCliente}
                onChange={(evento) =>
                  actualizarFormulario(
                    "nombreCliente",
                    evento.target.value
                  )
                }
                placeholder="Ej: Juan Pérez"
              />

              {serviciosCatalogo.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <label
                    htmlFor="servicio"
                    className="block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm"
                  >
                    Servicio
                  </label>

                  <select
                    id="servicio"
                    value={formulario.servicioId}
                    onChange={(evento) =>
                      seleccionarServicio(
                        evento.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <option value="">
                      Seleccioná un servicio
                    </option>

                    {serviciosCatalogo.map(
                      (servicio) => (
                        <option
                          key={servicio.id}
                          value={servicio.id}
                        >
                          {servicio.nombre}
                          {servicio.precio
                            ? ` · $${Number(
                                servicio.precio
                              ).toLocaleString(
                                "es-AR"
                              )}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ) : (
                <Input
                  id="servicio"
                  label="Servicio o motivo"
                  value={formulario.servicio}
                  onChange={(evento) =>
                    actualizarFormulario(
                      "servicio",
                      evento.target.value
                    )
                  }
                  placeholder="Ej: Consulta inicial"
                />
              )}

              <Input
                id="email"
                label="Email opcional"
                type="email"
                value={formulario.email}
                onChange={(evento) =>
                  actualizarFormulario(
                    "email",
                    evento.target.value
                  )
                }
                placeholder="cliente@email.com"
              />

              <Input
                id="telefono"
                label="Teléfono opcional"
                value={formulario.telefono}
                onChange={(evento) =>
                  actualizarFormulario(
                    "telefono",
                    evento.target.value
                  )
                }
                placeholder="+54 9..."
              />

              <Input
                id="fecha"
                label="Fecha"
                type="date"
                value={formulario.fecha}
                onChange={(evento) =>
                  actualizarFormulario(
                    "fecha",
                    evento.target.value
                  )
                }
              />

              <Input
                id="hora"
                label="Hora"
                type="time"
                value={formulario.hora}
                onChange={(evento) =>
                  actualizarFormulario(
                    "hora",
                    evento.target.value
                  )
                }
              />

              <Input
                id="duracion"
                label="Duración en minutos"
                type="number"
                min="5"
                max="1440"
                step="5"
                value={formulario.duracionMinutos}
                onChange={(evento) =>
                  actualizarFormulario(
                    "duracionMinutos",
                    evento.target.value
                  )
                }
              />
            </div>

            <div>
              <label
                htmlFor="notas"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
              >
                Notas opcionales
              </label>

              <textarea
                id="notas"
                rows={3}
                maxLength={1000}
                value={formulario.notas}
                onChange={(evento) =>
                  actualizarFormulario(
                    "notas",
                    evento.target.value
                  )
                }
                placeholder={
                  usaReservas
                    ? "Información adicional sobre la reserva..."
                    : "Información adicional sobre el turno..."
                }
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800 sm:gap-3 sm:pt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMostrandoFormulario(false);
                  setEditandoId(null);
                  setFormulario(
                    FORMULARIO_INICIAL
                  );
                  setError("");
                }}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Guardar cambios"
                  : `Crear ${singularAgenda}`}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-zinc-800 sm:gap-4 sm:p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                {formatearMes(mesActual)}
              </h2>

              <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
                Seleccioná un día para ver sus turnos.
              </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => cambiarMes(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={irAHoy}
              >
                Hoy
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => cambiarMes(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-blue-200 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-500/5">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="px-0.5 py-1.5 text-center text-[8px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 sm:px-2 sm:py-3 sm:text-xs"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {diasCalendario.map((dia) => {
              const fechaISO =
                obtenerFechaISO(dia.fecha);

              const turnosDelDia =
                turnosPorFecha.get(fechaISO) ?? [];

              const seleccionado =
                fechaISO === fechaSeleccionada;

              const esHoy =
                fechaISO ===
                obtenerFechaISO(new Date());

              return (
                <button
                  key={fechaISO}
                  type="button"
                  onClick={() => {
                    setFechaSeleccionada(
                      fechaISO
                    );

                    if (!dia.perteneceAlMes) {
                      const nuevoMes = new Date(
                        dia.fecha.getFullYear(),
                        dia.fecha.getMonth(),
                        1
                      );

                      setMesActual(nuevoMes);
                    }
                  }}
                  onDoubleClick={() =>
                    abrirNuevoTurno(fechaISO)
                  }
                  className={[
                    "relative min-h-14 border-b border-r border-blue-200 p-1 text-left transition-colors dark:border-blue-500/20 sm:min-h-28 sm:p-3",
                    dia.perteneceAlMes
                       ? "bg-white dark:bg-zinc-900/30"
                       : "bg-blue-50/50 dark:bg-zinc-950/70",
                    seleccionado
                       ? "bg-blue-50 ring-2 ring-inset ring-blue-500 dark:bg-blue-500/10"
                       : "hover:bg-blue-50/70 dark:hover:bg-zinc-800/40",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-md px-0.5 text-[10px] sm:h-7 sm:min-w-7 sm:rounded-lg sm:px-1 sm:text-sm",
                      esHoy
                         ? "bg-blue-600 font-bold text-white shadow-sm"
                         : dia.perteneceAlMes
                         ? "font-semibold text-slate-950 dark:text-zinc-100"
                         : "font-medium text-slate-400 dark:text-zinc-600",
                    ].join(" ")}
                  >
                    {dia.fecha.getDate()}
                  </span>

                  {turnosDelDia.length > 0 && (
                    <div className="mt-1 space-y-0.5 sm:mt-2 sm:space-y-1">
                      {turnosDelDia
                        .slice(0, 2)
                        .map((turno) => (
                          <div
                            key={turno.id}
                            className="truncate rounded border border-blue-100 bg-blue-50 px-0.5 py-0.5 text-[7px] font-medium leading-3 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 sm:rounded-md sm:px-2 sm:py-1 sm:text-xs sm:leading-normal"
                          >
                            {turno.tipoReserva ===
                            "alojamiento"
                              ? "Estadía"
                              : turno.tipoReserva ===
                                  "mesa"
                                ? `Mesa ${turno.hora}`
                                : turno.hora}{" "}
                            {turno.nombreCliente}
                          </div>
                        ))}

                      {turnosDelDia.length > 2 && (
                        <p className="px-0.5 text-[7px] text-slate-500 dark:text-zinc-500 sm:px-1 sm:text-[10px]">
                          +{turnosDelDia.length - 2} más
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-3 dark:border-zinc-800 sm:p-5">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div>
                <h2 className="text-xs font-semibold text-slate-950 dark:text-white sm:text-base">
                  {usaReservas
                    ? "Próximas reservas"
                    : "Próximos turnos"}
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                  {turnosFiltrados.length}{" "}
                  {turnosFiltrados.length === 1
                    ? `${singularAgenda} programada`
                    : `${pluralAgenda} programadas`}{" "}
                  · ordenados por fecha
                </p>
              </div>

            </div>

            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 sm:mt-4 sm:gap-2">
              <Filter className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-600" />

              {(
                [
                  "todos",
                  "pendiente",
                  "confirmado",
                  "completado",
                  "cancelado",
                  "no_asistio",
                ] as FiltroEstado[]
              ).map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() =>
                    setFiltroEstado(estado)
                  }
                  className={[
                    "shrink-0 rounded-md px-2 py-1 text-[9px] font-medium transition sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
                    filtroEstado === estado
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-white",
                  ].join(" ")}
                >
                  {estado === "todos"
                    ? "Todos"
                    : ESTADOS[estado].nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-2.5 sm:max-h-[760px] sm:p-4">
            {cargando ? (
              <div className="py-6 text-center sm:py-12">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-600 dark:border-zinc-700 dark:border-t-cyan-500" />

                <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
                  Cargando agenda...
                </p>
              </div>
            ) : turnosFiltrados.length === 0 ? (
              <div className="py-6 text-center sm:py-12">
                <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-zinc-700 sm:h-10 sm:w-10" />

                <h3 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white sm:mt-4 sm:text-base">
                  {usaReservas
                    ? "No hay reservas próximas"
                    : "No hay turnos próximos"}
                </h3>

                <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  {usaReservas
                    ? "Las próximas reservas aparecerán acá ordenadas por fecha."
                    : "Los próximos turnos aparecerán acá ordenados por fecha."}
                </p>

                <Button
                  type="button"
                  className="mt-3 sm:mt-5"
                  onClick={() =>
                    abrirNuevoTurno(
                      fechaSeleccionada
                    )
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  {usaReservas ? "Crear reserva" : "Crear turno"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {turnosFiltrados.map((turno) => (
                  <TurnoCard
                    key={turno.id}
                    turno={turno}
                    procesando={
                      procesandoId === turno.id
                    }
                    onCambiarEstado={
                      cambiarEstado
                    }
                    onEditar={editarTurno}
                    onEliminar={eliminarTurno}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

function TurnoCard({
  turno,
  procesando,
  onCambiarEstado,
  onEditar,
  onEliminar,
}: {
  turno: Turno;
  procesando: boolean;
  onCambiarEstado: (
    turno: Turno,
    estado: EstadoTurno
  ) => void;
  onEditar: (turno: Turno) => void;
  onEliminar: (turno: Turno) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/50 sm:rounded-2xl sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <p className="font-semibold text-slate-950 dark:text-white">
              {turno.tipoReserva ===
              "alojamiento"
                ? "Estadía"
                : turno.tipoReserva ===
                    "mesa"
                  ? `Mesa · ${turno.hora}`
                  : turno.hora}
            </p>

            <Badge
              variant={
                ESTADOS[turno.estado].variant
              }
            >
              {ESTADOS[turno.estado].nombre}
            </Badge>
          </div>

          <h3 className="mt-1.5 truncate text-[11px] font-medium text-slate-950 dark:text-white sm:mt-3 sm:text-base">
            {turno.nombreCliente}
          </h3>

          <p className="mt-0.5 text-[10px] text-slate-600 dark:text-zinc-400 sm:mt-1 sm:text-sm">
            {turno.servicio}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!turno.tipoReserva && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => onEditar(turno)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:text-zinc-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 sm:h-8 sm:w-8 sm:rounded-lg"
              title="Editar turno"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            disabled={procesando}
            onClick={() => onEliminar(turno)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-zinc-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:h-8 sm:w-8 sm:rounded-lg"
            title="Eliminar turno"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 dark:text-zinc-500 sm:mt-4 sm:grid-cols-1 sm:gap-2 sm:text-xs">
        {turno.tipoReserva ===
        "alojamiento" ? (
          <>
            <p>
              Entrada:{" "}
              {turno.fechaEntrada ||
                turno.fecha}
              {turno.hora
                ? ` · ${turno.hora}`
                : ""}
            </p>

            {turno.fechaSalida && (
              <p>
                Salida: {turno.fechaSalida}
              </p>
            )}

            {typeof turno.huespedes ===
              "number" && (
              <p>
                Huéspedes: {turno.huespedes}
              </p>
            )}
          </>
        ) : turno.tipoReserva ===
          "mesa" ? (
          <>
            <p>
              Fecha: {turno.fecha}
            </p>
            <p>
              Horario: {turno.hora}
            </p>
            {typeof turno.personas ===
              "number" && (
              <p>
                Personas: {turno.personas}
              </p>
            )}
          </>
        ) : (
          <>
            <p>
              Fecha: {turno.fecha}
            </p>
            <p>
              Horario: {turno.hora}
            </p>
            <p>
              Duración:{" "}
              {turno.duracionMinutos} minutos
            </p>
          </>
        )}

        {turno.telefono && (
          <p>Teléfono: {turno.telefono}</p>
        )}

        {turno.email && (
          <p className="break-all">
            Email: {turno.email}
          </p>
        )}

        {turno.notas && (
          <p className="col-span-2 rounded-md bg-white p-2 leading-4 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400 sm:col-span-1 sm:rounded-lg sm:p-3 sm:leading-5">
            {turno.notas}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2 dark:border-zinc-800 sm:mt-4 sm:gap-2 sm:pt-4">
        {turno.estado !== "confirmado" && (
          <AccionEstado
            texto="Confirmar"
            disabled={procesando}
            onClick={() =>
              onCambiarEstado(
                turno,
                "confirmado"
              )
            }
          />
        )}

        {turno.estado !== "completado" && (
          <AccionEstado
            texto="Completar"
            disabled={procesando}
            onClick={() =>
              onCambiarEstado(
                turno,
                "completado"
              )
            }
          />
        )}

        {turno.estado !== "cancelado" && (
          <AccionEstado
            texto="Cancelar"
            disabled={procesando}
            danger
            onClick={() =>
              onCambiarEstado(
                turno,
                "cancelado"
              )
            }
          />
        )}

        {turno.estado !== "no_asistio" &&
          turno.estado !== "cancelado" && (
            <AccionEstado
              texto="No asistió"
              disabled={procesando}
              danger
              onClick={() =>
                onCambiarEstado(
                  turno,
                  "no_asistio"
                )
              }
            />
          )}

        {turno.estado !== "pendiente" && (
          <AccionEstado
            texto="Volver a pendiente"
            disabled={procesando}
            onClick={() =>
              onCambiarEstado(
                turno,
                "pendiente"
              )
            }
          />
        )}
      </div>
    </div>
  );
}

function AccionEstado({
  texto,
  onClick,
  disabled,
  danger = false,
}: {
  texto: string;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-md border px-2 py-1.5 text-[9px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-lg sm:px-3 sm:py-2 sm:text-xs",
        danger
          ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
          : "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white",
      ].join(" ")}
    >
      {texto}
    </button>
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
      <label className="mb-1 block text-[9px] font-medium text-slate-500 dark:text-zinc-500 sm:mb-2 sm:text-xs">
        {label}
      </label>

      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
      />
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
    <Card className="p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-500 dark:text-zinc-500 sm:text-sm">
          {titulo}
        </p>

        <div className="scale-75 text-cyan-700 dark:text-cyan-400 sm:scale-100">
          {icono}
        </div>
      </div>

      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
        {valor}
      </p>
    </Card>
  );
}

function convertirHoraAMinutos(hora: string) {
  const [horas, minutos] = hora
    .split(":")
    .map(Number);

  return horas * 60 + minutos;
}

function normalizarAgendaConfig(
  config?: EmpresaPlan["agendaConfig"]
): AgendaConfig {
  const base = AGENDA_CONFIG_INICIAL;

  const dias = Object.fromEntries(
    Object.entries(base.dias).map(
      ([clave, diaBase]) => [
        clave,
        {
          ...diaBase,
          ...(config?.dias?.[clave] || {}),
        },
      ]
    )
  ) as Record<string, ConfigDiaAgenda>;

  return {
    activa: config?.activa ?? false,
    intervaloMinutos: Math.max(
      5,
      Number(config?.intervaloMinutos) || 30
    ),
    dias,
  };
}

function horaAgendaValida(valor: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

function obtenerFechasEstadia(
  fechaEntrada: string,
  fechaSalida: string
) {
  const fechas: string[] = [];

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      fechaEntrada
    ) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      fechaSalida
    ) ||
    fechaSalida <= fechaEntrada
  ) {
    return [fechaEntrada];
  }

  const cursor = new Date(
    `${fechaEntrada}T12:00:00`
  );

  const salida = new Date(
    `${fechaSalida}T12:00:00`
  );

  while (cursor < salida) {
    fechas.push(
      obtenerFechaISO(cursor)
    );

    cursor.setDate(
      cursor.getDate() + 1
    );
  }

  return fechas;
}

function construirDiasCalendario(
  mes: Date
) {
  const primerDiaMes = new Date(
    mes.getFullYear(),
    mes.getMonth(),
    1
  );

  const ultimoDiaMes = new Date(
    mes.getFullYear(),
    mes.getMonth() + 1,
    0
  );

  const diaSemanaInicial =
    (primerDiaMes.getDay() + 6) % 7;

  const inicioCalendario = new Date(
    primerDiaMes
  );

  inicioCalendario.setDate(
    primerDiaMes.getDate() - diaSemanaInicial
  );

  const dias: Array<{
    fecha: Date;
    perteneceAlMes: boolean;
  }> = [];

  for (let indice = 0; indice < 42; indice += 1) {
    const fecha = new Date(inicioCalendario);
    fecha.setDate(
      inicioCalendario.getDate() + indice
    );

    dias.push({
      fecha,
      perteneceAlMes:
        fecha.getMonth() ===
          primerDiaMes.getMonth() &&
        fecha.getFullYear() ===
          primerDiaMes.getFullYear(),
    });
  }

  const necesitaSextaFila =
    dias
      .slice(35)
      .some(
        (dia) =>
          dia.perteneceAlMes &&
          dia.fecha <= ultimoDiaMes
      );

  return necesitaSextaFila
    ? dias
    : dias.slice(0, 35);
}

function obtenerFechaISO(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearMes(fecha: Date) {
  const texto = new Intl.DateTimeFormat(
    "es-AR",
    {
      month: "long",
      year: "numeric",
    }
  ).format(fecha);

  return texto.charAt(0).toUpperCase() +
    texto.slice(1);
}

function formatearFechaSeleccionada(
  fechaISO: string
) {
  const [anio, mes, dia] = fechaISO
    .split("-")
    .map(Number);

  const fecha = new Date(
    anio,
    mes - 1,
    dia
  );

  const texto = new Intl.DateTimeFormat(
    "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  ).format(fecha);

  return texto.charAt(0).toUpperCase() +
    texto.slice(1);
}