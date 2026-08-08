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
  orderBy,
  query,
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
  Plus,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import { db } from "@/lib/firebase";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type EstadoTurno =
  | "pendiente"
  | "confirmado"
  | "completado"
  | "cancelado";

type Turno = {
  id: string;
  nombreCliente: string;
  email?: string;
  telefono?: string;
  servicio: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  estado: EstadoTurno;
  notas?: string;
  origen?: "manual" | "web" | "whatsapp" | "instagram";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type FormularioTurno = {
  nombreCliente: string;
  email: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  duracionMinutos: string;
  notas: string;
};

type FiltroEstado = "todos" | EstadoTurno;

type PlanEmpresa =
  | "free"
  | "pro"
  | "business";

type EmpresaPlan = {
  plan?: PlanEmpresa;
  subscriptionEndsAt?: unknown;
};

function convertirFechaPlan(valor: unknown) {
  if (!valor) return null;

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate?: unknown }).toDate === "function"
  ) {
    return (valor as { toDate: () => Date }).toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
      ? null
      : fecha;
  }

  return null;
}

function planPermiteAgenda(
  empresa: EmpresaPlan
) {
  if (empresa.plan === "business") {
    return true;
  }

  if (empresa.plan !== "pro") {
    return false;
  }

  const vencimiento =
    convertirFechaPlan(
      empresa.subscriptionEndsAt
    );

  return Boolean(
    vencimiento &&
      vencimiento.getTime() > Date.now()
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

const FORMULARIO_INICIAL: FormularioTurno = {
  nombreCliente: "",
  email: "",
  telefono: "",
  servicio: "",
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
};

export default function AgendaPage() {
  const params = useParams();
  const router = useRouter();
  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [turnos, setTurnos] = useState<Turno[]>([]);
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

        const habilitada =
          planPermiteAgenda(
            empresaSnapshot.data() as EmpresaPlan
          );

        setAgendaHabilitada(
          habilitada
        );

        if (!habilitada) {
          setTurnos([]);
          setCargando(false);
          return;
        }

        const turnosQuery = query(
          collection(
            db,
            "companies",
            empresaIdSeguro,
            "appointments"
          ),
          orderBy("fecha", "asc")
        );

        cancelarTurnos = onSnapshot(
          turnosQuery,
          (snapshot) => {
            const lista =
              snapshot.docs.map(
                (documento) => ({
                  id: documento.id,
                  ...(documento.data() as Omit<
                    Turno,
                    "id"
                  >),
                })
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
    };
  }, [empresaId]);

  const diasCalendario = useMemo(
    () => construirDiasCalendario(mesActual),
    [mesActual]
  );

  const turnosFiltrados = useMemo(() => {
    return turnos
      .filter((turno) => {
        if (turno.fecha !== fechaSeleccionada) {
          return false;
        }

        if (filtroEstado === "todos") {
          return true;
        }

        return turno.estado === filtroEstado;
      })
      .sort((a, b) =>
        a.hora.localeCompare(b.hora)
      );
  }, [
    turnos,
    fechaSeleccionada,
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
      const existentes = mapa.get(turno.fecha) ?? [];
      mapa.set(turno.fecha, [...existentes, turno]);
    });

    return mapa;
  }, [turnos]);

  function abrirNuevoTurno(
    fecha = fechaSeleccionada
  ) {
    setFormulario({
      ...FORMULARIO_INICIAL,
      fecha,
    });

    setMostrandoFormulario(true);
    setError("");
    setMensaje("");
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

  async function crearTurno(
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

    setGuardando(true);

    try {
      await addDoc(
        collection(
          db,
          "companies",
          empresaId,
          "appointments"
        ),
        {
          nombreCliente:
            formulario.nombreCliente.trim(),
          email: formulario.email.trim(),
          telefono: formulario.telefono.trim(),
          servicio: formulario.servicio.trim(),
          fecha: formulario.fecha,
          hora: formulario.hora,
          duracionMinutos: Number(
            formulario.duracionMinutos
          ),
          estado: "pendiente",
          notas: formulario.notas.trim(),
          origen: "manual",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setFechaSeleccionada(formulario.fecha);
      setMostrandoFormulario(false);
      setFormulario(FORMULARIO_INICIAL);
      setMensaje("Turno creado correctamente.");
    } catch (firebaseError) {
      console.error(
        "Error al crear turno:",
        firebaseError
      );

      setError("No se pudo crear el turno.");
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

  if (agendaHabilitada === false) {
    return (
      <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Card className="border-cyan-200 bg-cyan-50 p-8 text-center sm:p-12 dark:border-cyan-500/20 dark:bg-cyan-500/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
            <CalendarDays className="h-8 w-8" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">
            Función Pro
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
            Agenda y turnos
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            La gestión de citas y turnos está disponible en los planes Pro y Empresa.
          </p>

          <Button
            type="button"
            className="mt-7"
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
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-cyan-700 dark:text-cyan-400">
            Organización comercial
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Agenda y turnos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            Administrá citas, confirmaciones y
            seguimientos desde un solo lugar.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => abrirNuevoTurno()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo turno
        </Button>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          titulo="Turnos totales"
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

      {mensaje && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {mensaje}
          </p>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        </Card>
      )}

      {mostrandoFormulario && (
        <Card className="mb-6 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Nuevo turno
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
              Completá los datos básicos de la cita.
            </p>
          </div>

          <form
            onSubmit={crearTurno}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
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
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                Notas opcionales
              </label>

              <textarea
                id="notas"
                rows={4}
                maxLength={1000}
                value={formulario.notas}
                onChange={(evento) =>
                  actualizarFormulario(
                    "notas",
                    evento.target.value
                  )
                }
                placeholder="Información adicional sobre el turno..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
              />
            </div>

            <div className="flex flex-col justify-end gap-3 border-t border-slate-200 pt-5 dark:border-zinc-800 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMostrandoFormulario(false);
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
                  : "Crear turno"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 dark:border-zinc-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {formatearMes(mesActual)}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                Seleccioná un día para ver sus turnos.
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
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
                    "relative min-h-24 border-b border-r border-blue-200 p-2 text-left transition-colors dark:border-blue-500/20 sm:min-h-28 sm:p-3",
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
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-sm",
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
                    <div className="mt-2 space-y-1">
                      {turnosDelDia
                        .slice(0, 2)
                        .map((turno) => (
                          <div
                            key={turno.id}
                            className="truncate rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 sm:text-xs"
                          >
                            {turno.hora}{" "}
                            {turno.nombreCliente}
                          </div>
                        ))}

                      {turnosDelDia.length > 2 && (
                        <p className="px-1 text-[10px] text-slate-500 dark:text-zinc-500">
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
          <div className="border-b border-slate-200 p-5 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">
                  {formatearFechaSeleccionada(
                    fechaSeleccionada
                  )}
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                  {turnosFiltrados.length}{" "}
                  {turnosFiltrados.length === 1
                    ? "turno"
                    : "turnos"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  abrirNuevoTurno(
                    fechaSeleccionada
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500"
                title="Crear turno"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-600" />

              {(
                [
                  "todos",
                  "pendiente",
                  "confirmado",
                  "completado",
                  "cancelado",
                ] as FiltroEstado[]
              ).map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() =>
                    setFiltroEstado(estado)
                  }
                  className={[
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition",
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

          <div className="max-h-[760px] overflow-y-auto p-4">
            {cargando ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-600 dark:border-zinc-700 dark:border-t-cyan-500" />

                <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
                  Cargando agenda...
                </p>
              </div>
            ) : turnosFiltrados.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-slate-300 dark:text-zinc-700" />

                <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">
                  No hay turnos
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
                  Creá el primer turno para esta fecha.
                </p>

                <Button
                  type="button"
                  className="mt-5"
                  onClick={() =>
                    abrirNuevoTurno(
                      fechaSeleccionada
                    )
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear turno
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
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
  onEliminar,
}: {
  turno: Turno;
  procesando: boolean;
  onCambiarEstado: (
    turno: Turno,
    estado: EstadoTurno
  ) => void;
  onEliminar: (turno: Turno) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950 dark:text-white">
              {turno.hora}
            </p>

            <Badge
              variant={
                ESTADOS[turno.estado].variant
              }
            >
              {ESTADOS[turno.estado].nombre}
            </Badge>
          </div>

          <h3 className="mt-3 truncate font-medium text-slate-950 dark:text-white">
            {turno.nombreCliente}
          </h3>

          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
            {turno.servicio}
          </p>
        </div>

        <button
          type="button"
          disabled={procesando}
          onClick={() => onEliminar(turno)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-zinc-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          title="Eliminar turno"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-500 dark:text-zinc-500">
        <p>
          Duración: {turno.duracionMinutos} minutos
        </p>

        {turno.telefono && (
          <p>Teléfono: {turno.telefono}</p>
        )}

        {turno.email && (
          <p className="break-all">
            Email: {turno.email}
          </p>
        )}

        {turno.notas && (
          <p className="rounded-lg bg-white p-3 leading-5 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
            {turno.notas}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-zinc-800">
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
        "rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
          : "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white",
      ].join(" ")}
    >
      {texto}
    </button>
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
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          {titulo}
        </p>

        <div className="text-cyan-700 dark:text-cyan-400">
          {icono}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
        {valor}
      </p>
    </Card>
  );
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