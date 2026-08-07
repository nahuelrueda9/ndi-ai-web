"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
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
  Clock3,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

type PlanEmpresa =
  | "free"
  | "pro"
  | "business";

type EmpresaData = {
  userId?: string;
  plan?: PlanEmpresa;
  subscriptionEndsAt?: unknown;
};

type MiembroData = {
  rol?: Exclude<RolEmpresa, "propietario">;
  estado?: "activo" | "inactivo";
};

type TipoDisparador =
  | "palabra_clave"
  | "pide_humano"
  | "sin_respuesta"
  | "fuera_horario";

type TipoAccion =
  | "responder_mensaje"
  | "asignar_humano"
  | "agregar_etiqueta"
  | "cerrar_conversacion";

type Automatizacion = {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  disparador: {
    tipo: TipoDisparador;
    valor?: string;
    minutos?: number;
  };
  accion: {
    tipo: TipoAccion;
    valor?: string;
  };
  ejecuciones?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type FormularioAutomatizacion = {
  nombre: string;
  descripcion: string;
  disparadorTipo: TipoDisparador;
  disparadorValor: string;
  minutos: string;
  accionTipo: TipoAccion;
  accionValor: string;
};

function convertirFecha(
  valor: unknown
) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (
      valor as {
        toDate?: unknown;
      }
    ).toDate === "function"
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

function planPermiteAutomatizaciones(
  empresa: EmpresaData
) {
  const plan: PlanEmpresa =
    empresa.plan === "pro"
      ? "pro"
      : empresa.plan === "business"
        ? "business"
        : "free";

  if (plan === "free") {
    return false;
  }

  const vencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt
    );

  return Boolean(
    vencimiento &&
      vencimiento.getTime() >
        Date.now()
  );
}

const FORMULARIO_INICIAL: FormularioAutomatizacion = {
  nombre: "",
  descripcion: "",
  disparadorTipo: "palabra_clave",
  disparadorValor: "",
  minutos: "15",
  accionTipo: "responder_mensaje",
  accionValor: "",
};

const DISPARADORES: Record<
  TipoDisparador,
  {
    nombre: string;
    descripcion: string;
  }
> = {
  palabra_clave: {
    nombre: "Palabra clave",
    descripcion:
      'Se activa cuando el cliente escribe una frase como "precio".',
  },
  pide_humano: {
    nombre: "Pide atención humana",
    descripcion:
      "Se activa cuando el cliente solicita hablar con una persona.",
  },
  sin_respuesta: {
    nombre: "Sin respuesta",
    descripcion:
      "Se activa después de una cantidad de minutos sin actividad.",
  },
  fuera_horario: {
    nombre: "Fuera de horario",
    descripcion:
      "Se activa cuando llega un mensaje fuera del horario de atención.",
  },
};

const ACCIONES: Record<
  TipoAccion,
  {
    nombre: string;
    descripcion: string;
  }
> = {
  responder_mensaje: {
    nombre: "Responder mensaje",
    descripcion:
      "Envía una respuesta automática al cliente.",
  },
  asignar_humano: {
    nombre: "Derivar a humano",
    descripcion:
      "Pausa la IA y deja la conversación para un operador.",
  },
  agregar_etiqueta: {
    nombre: "Agregar etiqueta",
    descripcion:
      "Añade una etiqueta a la conversación o al lead.",
  },
  cerrar_conversacion: {
    nombre: "Cerrar conversación",
    descripcion:
      "Marca automáticamente la conversación como cerrada.",
  },
};

export default function AutomatizacionesPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [automatizaciones, setAutomatizaciones] =
    useState<Automatizacion[]>([]);

  const [formulario, setFormulario] =
    useState<FormularioAutomatizacion>(
      FORMULARIO_INICIAL
    );

  const [mostrandoFormulario, setMostrandoFormulario] =
    useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] =
    useState<string | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [
    automatizacionesHabilitadas,
    setAutomatizacionesHabilitadas,
  ] = useState(false);

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.replace("/login");
          return;
        }

        if (!empresaId) {
          setError(
            "No se encontró la empresa."
          );
          setCargando(false);
          return;
        }

        const empresaIdSeguro = empresaId;
        const usuarioSeguro = currentUser;

        setAccesoVerificado(false);
        setError("");
        setCargando(true);

        try {
          const empresaReferencia = doc(
            db,
            "companies",
            empresaIdSeguro
          );

          const empresaSnapshot =
            await getDoc(
              empresaReferencia
            );

          if (!empresaSnapshot.exists()) {
            setError(
              "La empresa no existe."
            );
            setCargando(false);
            return;
          }

          const empresa =
            empresaSnapshot.data() as EmpresaData;

          const planHabilitado =
            planPermiteAutomatizaciones(
              empresa
            );

          setAutomatizacionesHabilitadas(
            planHabilitado
          );

          if (
            empresa.userId ===
            usuarioSeguro.uid
          ) {
            setAccesoVerificado(true);

            if (!planHabilitado) {
              setCargando(false);
            }

            return;
          }

          const miembroReferencia = doc(
            db,
            "companies",
            empresaIdSeguro,
            "members",
            usuarioSeguro.uid
          );

          const miembroSnapshot =
            await getDoc(
              miembroReferencia
            );

          if (!miembroSnapshot.exists()) {
            router.replace("/empresas");
            return;
          }

          const miembro =
            miembroSnapshot.data() as MiembroData;

          const tieneAcceso =
            miembro.estado === "activo" &&
            (
              miembro.rol ===
                "administrador" ||
              miembro.rol ===
                "supervisor"
            );

          if (!tieneAcceso) {
            router.replace(
              `/empresas/${empresaIdSeguro}/conversaciones`
            );
            return;
          }

          setAccesoVerificado(true);

          if (!planHabilitado) {
            setCargando(false);
          }
        } catch (firebaseError) {
          console.error(
            "Error al verificar acceso a automatizaciones:",
            firebaseError
          );

          setError(
            "No se pudo verificar el acceso a la empresa."
          );
          setCargando(false);
        }
      }
    );

    return () => cancelarAuth();
  }, [empresaId, router]);

  useEffect(() => {
    if (
      !empresaId ||
      !accesoVerificado ||
      !automatizacionesHabilitadas
    ) {
      return;
    }

    const empresaIdSeguro = empresaId;

    const automatizacionesQuery = query(
      collection(
        db,
        "companies",
        empresaIdSeguro,
        "automations"
      ),
      orderBy("createdAt", "desc")
    );

    const cancelar = onSnapshot(
      automatizacionesQuery,
      (snapshot) => {
        const lista = snapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...(documento.data() as Omit<
              Automatizacion,
              "id"
            >),
          })
        );

        setAutomatizaciones(lista);
        setError("");
        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar automatizaciones:",
          firebaseError
        );

        setError(
          firebaseError.code ===
            "permission-denied"
            ? "No tenés permisos para ver las automatizaciones."
            : "No se pudieron cargar las automatizaciones."
        );

        setCargando(false);
      }
    );

    return () => cancelar();
  }, [
    accesoVerificado,
    automatizacionesHabilitadas,
    empresaId,
  ]);

  const resumen = useMemo(() => {
    const activas = automatizaciones.filter(
      (automatizacion) => automatizacion.activa
    ).length;

    const ejecuciones = automatizaciones.reduce(
      (total, automatizacion) =>
        total + (automatizacion.ejecuciones ?? 0),
      0
    );

    return {
      total: automatizaciones.length,
      activas,
      pausadas: automatizaciones.length - activas,
      ejecuciones,
    };
  }, [automatizaciones]);

  function actualizarFormulario<
    Clave extends keyof FormularioAutomatizacion
  >(
    clave: Clave,
    valor: FormularioAutomatizacion[Clave]
  ) {
    setFormulario((actual) => ({
      ...actual,
      [clave]: valor,
    }));
  }

  function validarFormulario() {
    if (!formulario.nombre.trim()) {
      return "Escribí un nombre para la automatización.";
    }

    if (
      formulario.disparadorTipo === "palabra_clave" &&
      !formulario.disparadorValor.trim()
    ) {
      return "Escribí la palabra o frase que activará la regla.";
    }

    if (formulario.disparadorTipo === "sin_respuesta") {
      const minutos = Number(formulario.minutos);

      if (
        !Number.isFinite(minutos) ||
        minutos < 1 ||
        minutos > 10080
      ) {
        return "Ingresá una cantidad de minutos válida.";
      }
    }

    if (
      formulario.accionTipo === "responder_mensaje" &&
      !formulario.accionValor.trim()
    ) {
      return "Escribí el mensaje automático.";
    }

    if (
      formulario.accionTipo === "agregar_etiqueta" &&
      !formulario.accionValor.trim()
    ) {
      return "Escribí la etiqueta que se agregará.";
    }

    return "";
  }

  async function crearAutomatizacion(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (
      !empresaId ||
      guardando ||
      !automatizacionesHabilitadas
    ) {
      if (!automatizacionesHabilitadas) {
        setError(
          "Las automatizaciones están disponibles en Pro y Empresa."
        );
      }

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
          "automations"
        ),
        {
          nombre: formulario.nombre.trim(),
          descripcion: formulario.descripcion.trim(),
          activa: true,
          disparador: {
            tipo: formulario.disparadorTipo,
            valor:
              formulario.disparadorTipo ===
              "palabra_clave"
                ? formulario.disparadorValor
                    .trim()
                    .toLowerCase()
                : "",
            minutos:
              formulario.disparadorTipo ===
              "sin_respuesta"
                ? Number(formulario.minutos)
                : null,
          },
          accion: {
            tipo: formulario.accionTipo,
            valor:
              formulario.accionTipo ===
                "responder_mensaje" ||
              formulario.accionTipo ===
                "agregar_etiqueta"
                ? formulario.accionValor.trim()
                : "",
          },
          ejecuciones: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setFormulario(FORMULARIO_INICIAL);
      setMostrandoFormulario(false);
      setMensaje(
        "Automatización creada correctamente."
      );
    } catch (firebaseError) {
      console.error(
        "Error al crear automatización:",
        firebaseError
      );

      setError(
        "No se pudo crear la automatización."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(
    automatizacion: Automatizacion
  ) {
    if (
      !empresaId ||
      procesandoId ||
      !automatizacionesHabilitadas
    ) {
      if (!automatizacionesHabilitadas) {
        setError(
          "Las automatizaciones están disponibles en Pro y Empresa."
        );
      }

      return;
    }

    setProcesandoId(automatizacion.id);
    setError("");
    setMensaje("");

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "automations",
          automatizacion.id
        ),
        {
          activa: !automatizacion.activa,
          updatedAt: serverTimestamp(),
        }
      );

      setMensaje(
        automatizacion.activa
          ? "Automatización pausada."
          : "Automatización activada."
      );
    } catch (firebaseError) {
      console.error(
        "Error al cambiar automatización:",
        firebaseError
      );

      setError(
        "No se pudo cambiar el estado de la automatización."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarAutomatizacion(
    automatizacion: Automatizacion
  ) {
    if (
      !empresaId ||
      procesandoId ||
      !automatizacionesHabilitadas
    ) {
      if (!automatizacionesHabilitadas) {
        setError(
          "Las automatizaciones están disponibles en Pro y Empresa."
        );
      }

      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que querés eliminar "${automatizacion.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    setProcesandoId(automatizacion.id);
    setError("");
    setMensaje("");

    try {
      await deleteDoc(
        doc(
          db,
          "companies",
          empresaId,
          "automations",
          automatizacion.id
        )
      );

      setMensaje("Automatización eliminada.");
    } catch (firebaseError) {
      console.error(
        "Error al eliminar automatización:",
        firebaseError
      );

      setError(
        "No se pudo eliminar la automatización."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  if (
    accesoVerificado &&
    !automatizacionesHabilitadas
  ) {
    return (
      <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Card className="border-violet-500/20 bg-violet-500/5 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            <Zap className="h-8 w-8" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-violet-400">
            Función Pro
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Automatizaciones
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Las automatizaciones están disponibles en los planes Pro y Empresa.
            Con Pro podés crear reglas para responder, derivar, etiquetar y cerrar conversaciones automáticamente.
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
          <p className="text-sm font-medium text-violet-400">
            Flujos automáticos
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Automatizaciones
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Creá reglas para responder consultas,
            derivar clientes y organizar conversaciones.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setMostrandoFormulario((actual) => !actual);
            setError("");
            setMensaje("");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />

          {mostrandoFormulario
            ? "Cancelar"
            : "Nueva automatización"}
        </Button>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          titulo="Total"
          valor={resumen.total}
          icono={<Zap className="h-5 w-5" />}
        />

        <ResumenCard
          titulo="Activas"
          valor={resumen.activas}
          icono={<Play className="h-5 w-5" />}
        />

        <ResumenCard
          titulo="Pausadas"
          valor={resumen.pausadas}
          icono={<Pause className="h-5 w-5" />}
        />

        <ResumenCard
          titulo="Ejecuciones"
          valor={resumen.ejecuciones}
          icono={
            <MessageSquareText className="h-5 w-5" />
          }
        />
      </div>

      {mensaje && (
        <Card className="mb-6 border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-300">
            {mensaje}
          </p>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </Card>
      )}

      {mostrandoFormulario && (
        <Card className="mb-6 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Nueva automatización
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Elegí qué debe ocurrir y qué acción
              realizará NDI AI.
            </p>
          </div>

          <form
            onSubmit={crearAutomatizacion}
            className="space-y-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="nombreAutomatizacion"
                label="Nombre"
                value={formulario.nombre}
                onChange={(evento) =>
                  actualizarFormulario(
                    "nombre",
                    evento.target.value
                  )
                }
                placeholder="Ej: Responder consultas de precios"
              />

              <Input
                id="descripcionAutomatizacion"
                label="Descripción opcional"
                value={formulario.descripcion}
                onChange={(evento) =>
                  actualizarFormulario(
                    "descripcion",
                    evento.target.value
                  )
                }
                placeholder="Explicá para qué sirve esta regla"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-white">
                  Si ocurre esto
                </p>

                <div className="space-y-3">
                  {(
                    Object.keys(
                      DISPARADORES
                    ) as TipoDisparador[]
                  ).map((tipo) => (
                    <Opcion
                      key={tipo}
                      seleccionada={
                        formulario.disparadorTipo ===
                        tipo
                      }
                      titulo={
                        DISPARADORES[tipo].nombre
                      }
                      descripcion={
                        DISPARADORES[tipo]
                          .descripcion
                      }
                      onClick={() =>
                        actualizarFormulario(
                          "disparadorTipo",
                          tipo
                        )
                      }
                    />
                  ))}
                </div>

                {formulario.disparadorTipo ===
                  "palabra_clave" && (
                  <div className="mt-4">
                    <Input
                      id="palabraClave"
                      label="Palabra o frase"
                      value={
                        formulario.disparadorValor
                      }
                      onChange={(evento) =>
                        actualizarFormulario(
                          "disparadorValor",
                          evento.target.value
                        )
                      }
                      placeholder="precio"
                    />
                  </div>
                )}

                {formulario.disparadorTipo ===
                  "sin_respuesta" && (
                  <div className="mt-4">
                    <Input
                      id="minutosSinRespuesta"
                      label="Minutos sin actividad"
                      type="number"
                      min="1"
                      max="10080"
                      value={formulario.minutos}
                      onChange={(evento) =>
                        actualizarFormulario(
                          "minutos",
                          evento.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-white">
                  Hacer esto
                </p>

                <div className="space-y-3">
                  {(
                    Object.keys(
                      ACCIONES
                    ) as TipoAccion[]
                  ).map((tipo) => (
                    <Opcion
                      key={tipo}
                      seleccionada={
                        formulario.accionTipo === tipo
                      }
                      titulo={ACCIONES[tipo].nombre}
                      descripcion={
                        ACCIONES[tipo].descripcion
                      }
                      onClick={() =>
                        actualizarFormulario(
                          "accionTipo",
                          tipo
                        )
                      }
                    />
                  ))}
                </div>

                {(formulario.accionTipo ===
                  "responder_mensaje" ||
                  formulario.accionTipo ===
                    "agregar_etiqueta") && (
                  <div className="mt-4">
                    <label
                      htmlFor="valorAccion"
                      className="mb-2 block text-sm font-medium text-zinc-300"
                    >
                      {formulario.accionTipo ===
                      "responder_mensaje"
                        ? "Mensaje automático"
                        : "Nombre de la etiqueta"}
                    </label>

                    {formulario.accionTipo ===
                    "responder_mensaje" ? (
                      <textarea
                        id="valorAccion"
                        rows={4}
                        maxLength={1000}
                        value={formulario.accionValor}
                        onChange={(evento) =>
                          actualizarFormulario(
                            "accionValor",
                            evento.target.value
                          )
                        }
                        placeholder="Hola, nuestros precios comienzan desde..."
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500"
                      />
                    ) : (
                      <Input
                        id="valorAccion"
                        value={formulario.accionValor}
                        onChange={(evento) =>
                          actualizarFormulario(
                            "accionValor",
                            evento.target.value
                          )
                        }
                        placeholder="Interesado en precios"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMostrandoFormulario(false);
                  setFormulario(FORMULARIO_INICIAL);
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
                  : "Crear automatización"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {cargando ? (
        <Card className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />

          <p className="mt-4 text-sm text-zinc-400">
            Cargando automatizaciones...
          </p>
        </Card>
      ) : automatizaciones.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            <Zap className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Todavía no hay automatizaciones
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
            Creá tu primera regla para ahorrar tiempo
            y responder de forma consistente.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() =>
              setMostrandoFormulario(true)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear primera automatización
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {automatizaciones.map(
            (automatizacion) => (
              <Card
                key={automatizacion.id}
                className="p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                        {obtenerIconoDisparador(
                          automatizacion.disparador
                            .tipo
                        )}
                      </div>

                      <div>
                        <h2 className="font-semibold text-white">
                          {automatizacion.nombre}
                        </h2>

                        {automatizacion.descripcion && (
                          <p className="mt-1 text-sm text-zinc-500">
                            {
                              automatizacion.descripcion
                            }
                          </p>
                        )}
                      </div>

                      <Badge
                        variant={
                          automatizacion.activa
                            ? "success"
                            : "default"
                        }
                      >
                        {automatizacion.activa
                          ? "Activa"
                          : "Pausada"}
                      </Badge>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 text-sm text-zinc-400 md:flex-row md:items-center">
                      <span className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        Si:{" "}
                        {describirDisparador(
                          automatizacion
                        )}
                      </span>

                      <span className="hidden text-zinc-700 md:block">
                        →
                      </span>

                      <span className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        Acción:{" "}
                        {describirAccion(
                          automatizacion
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        procesandoId ===
                        automatizacion.id
                      }
                      onClick={() =>
                        cambiarEstado(
                          automatizacion
                        )
                      }
                    >
                      {automatizacion.activa ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      aria-label="Eliminar automatización"
                      title="Eliminar automatización"
                      disabled={
                        procesandoId ===
                        automatizacion.id
                      }
                      onClick={() =>
                        eliminarAutomatizacion(
                          automatizacion
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </section>
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
        <p className="text-sm text-zinc-500">
          {titulo}
        </p>

        <div className="text-violet-400">
          {icono}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-white">
        {valor}
      </p>
    </Card>
  );
}

function Opcion({
  seleccionada,
  titulo,
  descripcion,
  onClick,
}: {
  seleccionada: boolean;
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border p-4 text-left transition",
        seleccionada
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
      ].join(" ")}
    >
      <p className="font-medium text-white">
        {titulo}
      </p>

      <p className="mt-1 text-sm leading-5 text-zinc-500">
        {descripcion}
      </p>
    </button>
  );
}

function obtenerIconoDisparador(
  tipo: TipoDisparador
) {
  if (tipo === "pide_humano") {
    return <UserRound className="h-5 w-5" />;
  }

  if (
    tipo === "sin_respuesta" ||
    tipo === "fuera_horario"
  ) {
    return <Clock3 className="h-5 w-5" />;
  }

  return (
    <MessageSquareText className="h-5 w-5" />
  );
}

function describirDisparador(
  automatizacion: Automatizacion
) {
  const disparador = automatizacion.disparador;

  if (disparador.tipo === "palabra_clave") {
    return `el cliente escribe "${disparador.valor || ""}"`;
  }

  if (disparador.tipo === "pide_humano") {
    return "el cliente pide hablar con una persona";
  }

  if (disparador.tipo === "sin_respuesta") {
    return `pasan ${disparador.minutos ?? 0} minutos sin actividad`;
  }

  return "llega un mensaje fuera de horario";
}

function describirAccion(
  automatizacion: Automatizacion
) {
  const accion = automatizacion.accion;

  if (accion.tipo === "responder_mensaje") {
    const texto = accion.valor || "";

    return texto.length > 70
      ? `${texto.slice(0, 70)}...`
      : texto;
  }

  if (accion.tipo === "asignar_humano") {
    return "derivar la conversación a un humano";
  }

  if (accion.tipo === "agregar_etiqueta") {
    return `agregar la etiqueta "${accion.valor || ""}"`;
  }

  return "cerrar la conversación";
}