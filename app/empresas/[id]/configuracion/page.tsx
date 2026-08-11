"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
} from "@/lib/plans/planAccess";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

interface Empresa {
  nombre?: string;
  userId: string;
  plan?: "free" | "pro" | "business";
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;

  personalidad?: string;
  objetivo?: string;
  instrucciones?: string;
  restricciones?: string;
  idioma?: string;

  agente?: {
    nombre?: string;
    rol?: string;
    personalidad?: string;
    objetivo?: string;
    instrucciones?: string;
    restricciones?: string;
    idioma?: string;
  };
}

interface MiembroEmpresa {
  rol?: Exclude<RolEmpresa, "propietario">;
  estado?: "activo" | "inactivo";
}

type ConfiguracionInicial = {
  nombre: string;
  rol: string;
  personalidad: string;
  objetivo: string;
  instrucciones: string;
  restricciones: string;
  idioma: string;
};

const CONFIGURACION_VACIA: ConfiguracionInicial = {
  nombre: "",
  rol: "",
  personalidad: "",
  objetivo: "",
  instrucciones: "",
  restricciones: "",
  idioma: "Español",
};

export default function ConfiguracionPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa,
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const [user, setUser] =
    useState<User | null>(null);

  const [
    empresaNombre,
    setEmpresaNombre,
  ] = useState("");

  const [
    nombreAgente,
    setNombreAgente,
  ] = useState("");

  const [
    rolAgente,
    setRolAgente,
  ] = useState("");

  const [
    personalidadAgente,
    setPersonalidadAgente,
  ] = useState("");

  const [
    objetivoAgente,
    setObjetivoAgente,
  ] = useState("");

  const [
    instruccionesAgente,
    setInstruccionesAgente,
  ] = useState("");

  const [
    restriccionesAgente,
    setRestriccionesAgente,
  ] = useState("");

  const [
    idiomaAgente,
    setIdiomaAgente,
  ] = useState("Español");

  const [
    configuracionInicial,
    setConfiguracionInicial,
  ] = useState<ConfiguracionInicial>(
    CONFIGURACION_VACIA,
  );

  const [loading, setLoading] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [
    asistenteHabilitado,
    setAsistenteHabilitado,
  ] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          if (!empresaId) {
            setError(
              "No se encontró el ID de la empresa.",
            );
            setLoading(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          setUser(null);
          setAccesoVerificado(false);
          setAsistenteHabilitado(null);
          setError("");
          setMensaje("");
          setLoading(true);

          try {
            const empresaReferencia =
              doc(
                db,
                "companies",
                empresaIdSeguro,
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia,
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe.",
              );
              return;
            }

            const empresa =
              empresaSnapshot.data() as Empresa;

            let tieneAcceso =
              empresa.userId ===
              currentUser.uid;

            if (!tieneAcceso) {
              const miembroReferencia =
                doc(
                  db,
                  "companies",
                  empresaIdSeguro,
                  "members",
                  currentUser.uid,
                );

              const miembroSnapshot =
                await getDoc(
                  miembroReferencia,
                );

              if (
                !miembroSnapshot.exists()
              ) {
                router.replace(
                  "/empresas",
                );
                return;
              }

              const miembro =
                miembroSnapshot.data() as MiembroEmpresa;

              tieneAcceso =
                miembro.estado ===
                  "activo" &&
                miembro.rol ===
                  "administrador";

              if (!tieneAcceso) {
                router.replace(
                  `/empresas/${empresaIdSeguro}/dashboard`,
                );
                return;
              }
            }

            const configuracion: ConfiguracionInicial = {
              nombre:
                empresa.agente?.nombre ||
                "",
              rol:
                empresa.agente?.rol ||
                "",
              personalidad:
                empresa.personalidad ||
                empresa.agente
                  ?.personalidad ||
                "Amable, profesional y breve",
              objetivo:
                empresa.objetivo ||
                empresa.agente
                  ?.objetivo ||
                "",
              instrucciones:
                empresa.instrucciones ||
                empresa.agente
                  ?.instrucciones ||
                "",
              restricciones:
                empresa.restricciones ||
                empresa.agente
                  ?.restricciones ||
                "No inventar información que no esté cargada.",
              idioma:
                empresa.idioma ||
                empresa.agente
                  ?.idioma ||
                "Español",
            };

            setUser(currentUser);
            setAccesoVerificado(true);
            setAsistenteHabilitado(
              empresaTieneFuncion(
                empresa,
                "asistente_ia",
              ),
            );

            setEmpresaNombre(
              empresa.nombre || "",
            );

            setNombreAgente(
              configuracion.nombre,
            );

            setRolAgente(
              configuracion.rol,
            );

            setPersonalidadAgente(
              configuracion.personalidad,
            );

            setObjetivoAgente(
              configuracion.objetivo,
            );

            setInstruccionesAgente(
              configuracion.instrucciones,
            );

            setRestriccionesAgente(
              configuracion.restricciones,
            );

            setIdiomaAgente(
              configuracion.idioma,
            );

            setConfiguracionInicial(
              configuracion,
            );
          } catch (firebaseError) {
            console.error(
              "Error al cargar la configuración del asistente:",
              firebaseError,
            );

            setError(
              "No se pudo cargar la configuración del asistente.",
            );
          } finally {
            setLoading(false);
          }
        },
      );

    return () => unsubscribeAuth();
  }, [empresaId, router]);

  const configuracionActual =
    useMemo<ConfiguracionInicial>(
      () => ({
        nombre: nombreAgente,
        rol: rolAgente,
        personalidad:
          personalidadAgente,
        objetivo: objetivoAgente,
        instrucciones:
          instruccionesAgente,
        restricciones:
          restriccionesAgente,
        idioma: idiomaAgente,
      }),
      [
        idiomaAgente,
        instruccionesAgente,
        nombreAgente,
        objetivoAgente,
        personalidadAgente,
        restriccionesAgente,
        rolAgente,
      ],
    );

  const hayCambios =
    useMemo(() => {
      return (
        configuracionActual.nombre !==
          configuracionInicial.nombre ||
        configuracionActual.rol !==
          configuracionInicial.rol ||
        configuracionActual.personalidad !==
          configuracionInicial.personalidad ||
        configuracionActual.objetivo !==
          configuracionInicial.objetivo ||
        configuracionActual.instrucciones !==
          configuracionInicial.instrucciones ||
        configuracionActual.restricciones !==
          configuracionInicial.restricciones ||
        configuracionActual.idioma !==
          configuracionInicial.idioma
      );
    }, [
      configuracionActual,
      configuracionInicial,
    ]);

  const handleGuardar = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !user ||
      !empresaId ||
      !accesoVerificado
    ) {
      return;
    }

    if (!asistenteHabilitado) {
      setError(
        "El Asistente IA está disponible únicamente con Business IA y una suscripción activa.",
      );
      return;
    }

    const nuevaConfiguracion: ConfiguracionInicial = {
      nombre:
        nombreAgente.trim(),
      rol:
        rolAgente.trim(),
      personalidad:
        personalidadAgente.trim(),
      objetivo:
        objetivoAgente.trim(),
      instrucciones:
        instruccionesAgente.trim(),
      restricciones:
        restriccionesAgente.trim(),
      idioma:
        idiomaAgente.trim() ||
        "Español",
    };

    if (!nuevaConfiguracion.nombre) {
      setError(
        "Ingresá el nombre del asistente.",
      );
      return;
    }

    if (!nuevaConfiguracion.rol) {
      setError(
        "Ingresá el rol del asistente.",
      );
      return;
    }

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const empresaReferencia =
        doc(
          db,
          "companies",
          empresaId,
        );

      await setDoc(
        empresaReferencia,
        {
          agente: {
            nombre:
              nuevaConfiguracion.nombre,
            rol:
              nuevaConfiguracion.rol,
            personalidad:
              nuevaConfiguracion.personalidad,
            objetivo:
              nuevaConfiguracion.objetivo,
            instrucciones:
              nuevaConfiguracion.instrucciones,
            restricciones:
              nuevaConfiguracion.restricciones,
            idioma:
              nuevaConfiguracion.idioma,
          },

          // Compatibilidad con el motor actual de IA.
          personalidad:
            nuevaConfiguracion.personalidad,
          objetivo:
            nuevaConfiguracion.objetivo,
          instrucciones:
            nuevaConfiguracion.instrucciones,
          restricciones:
            nuevaConfiguracion.restricciones,
          idioma:
            nuevaConfiguracion.idioma,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setNombreAgente(
        nuevaConfiguracion.nombre,
      );

      setRolAgente(
        nuevaConfiguracion.rol,
      );

      setPersonalidadAgente(
        nuevaConfiguracion.personalidad,
      );

      setObjetivoAgente(
        nuevaConfiguracion.objetivo,
      );

      setInstruccionesAgente(
        nuevaConfiguracion.instrucciones,
      );

      setRestriccionesAgente(
        nuevaConfiguracion.restricciones,
      );

      setIdiomaAgente(
        nuevaConfiguracion.idioma,
      );

      setConfiguracionInicial(
        nuevaConfiguracion,
      );

      setMensaje(
        "Configuración del asistente guardada correctamente.",
      );
    } catch (firebaseError) {
      console.error(
        "Error al guardar la configuración del asistente:",
        firebaseError,
      );

      setError(
        "No se pudo guardar la configuración del asistente.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="font-medium text-slate-950 dark:text-white">
            Cargando asistente...
          </p>
        </Card>
      </section>
    );
  }

  if (
    error &&
    !empresaNombre
  ) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-medium text-red-700 dark:text-red-300">
            {error}
          </p>

          <div className="mt-5">
            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/empresas",
                )
              }
            >
              Volver a empresas
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (!accesoVerificado) {
    return null;
  }

  if (asistenteHabilitado === false) {
    return (
      <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Card className="border-violet-200 bg-violet-50 p-8 text-center sm:p-12 dark:border-violet-500/20 dark:bg-violet-500/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
            <span className="text-2xl">✦</span>
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
            Exclusivo de Business IA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
            Asistente IA
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            El asistente inteligente, su configuración y las respuestas automáticas con IA están disponibles únicamente con Business IA y una suscripción activa.
          </p>

          <Button
            type="button"
            className="mt-7"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/planes`,
              )
            }
          >
            Ver Business IA
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {empresaNombre ||
              "Empresa"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Asistente IA
            </h1>

            <Badge
              variant={
                hayCambios
                  ? "warning"
                  : "success"
              }
            >
              {hayCambios
                ? "Cambios sin guardar"
                : "Configuración guardada"}
            </Badge>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            Definí cómo se presenta, cómo responde y qué reglas debe respetar
            el asistente inteligente de tu negocio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/conocimiento`,
              )
            }
          >
            Base de conocimiento
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/probar`,
              )
            }
          >
            Probar asistente
          </Button>
        </div>
      </header>

      <form
        onSubmit={handleGuardar}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </Card>
          )}

          {mensaje && (
            <Card className="border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {mensaje}
              </p>
            </Card>
          )}

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Identidad
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-500">
                Estos datos definen quién es el asistente frente a tus clientes.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="nombreAgente"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Nombre del asistente
                </label>

                <Input
                  id="nombreAgente"
                  type="text"
                  value={nombreAgente}
                  onChange={(event) => {
                    setNombreAgente(
                      event.target.value,
                    );
                    setMensaje("");
                  }}
                  placeholder="Ejemplo: Sofía"
                  required
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-600">
                  Nombre con el que se presentará durante la atención.
                </p>
              </div>

              <div>
                <label
                  htmlFor="rolAgente"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Rol
                </label>

                <Input
                  id="rolAgente"
                  type="text"
                  value={rolAgente}
                  onChange={(event) => {
                    setRolAgente(
                      event.target.value,
                    );
                    setMensaje("");
                  }}
                  placeholder="Ejemplo: Asistente comercial"
                  required
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-600">
                  Define qué función cumple dentro del negocio.
                </p>
              </div>

              <div>
                <label
                  htmlFor="personalidadAgente"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Personalidad
                </label>

                <Input
                  id="personalidadAgente"
                  type="text"
                  value={
                    personalidadAgente
                  }
                  onChange={(event) => {
                    setPersonalidadAgente(
                      event.target.value,
                    );
                    setMensaje("");
                  }}
                  placeholder="Amable, clara, profesional y breve"
                />
              </div>

              <div>
                <label
                  htmlFor="idiomaAgente"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Idioma principal
                </label>

                <select
                  id="idiomaAgente"
                  value={idiomaAgente}
                  onChange={(event) => {
                    setIdiomaAgente(
                      event.target.value,
                    );
                    setMensaje("");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                  <option value="Español">
                    Español
                  </option>

                  <option value="Inglés">
                    Inglés
                  </option>

                  <option value="Portugués">
                    Portugués
                  </option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Objetivo y comportamiento
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-500">
                Marcá qué debe intentar conseguir en cada consulta y cómo debe
                comportarse.
              </p>
            </div>

            <div>
              <label
                htmlFor="objetivoAgente"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                Objetivo principal
              </label>

              <textarea
                id="objetivoAgente"
                rows={4}
                value={objetivoAgente}
                onChange={(event) => {
                  setObjetivoAgente(
                    event.target.value,
                  );
                  setMensaje("");
                }}
                placeholder="Ejemplo: responder consultas, orientar al cliente y ayudarlo a reservar un turno cuando corresponda."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-700"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="instruccionesAgente"
                  className="block text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Instrucciones especiales
                </label>

                <span className="text-xs text-slate-500 dark:text-zinc-600">
                  {instruccionesAgente.length} caracteres
                </span>
              </div>

              <textarea
                id="instruccionesAgente"
                rows={8}
                value={
                  instruccionesAgente
                }
                onChange={(event) => {
                  setInstruccionesAgente(
                    event.target.value,
                  );
                  setMensaje("");
                }}
                placeholder="Ejemplo: antes de confirmar una reserva, verificá servicio, fecha, horario y datos del cliente."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-700"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="restriccionesAgente"
                  className="block text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Qué no debe hacer
                </label>

                <span className="text-xs text-slate-500 dark:text-zinc-600">
                  {restriccionesAgente.length} caracteres
                </span>
              </div>

              <textarea
                id="restriccionesAgente"
                rows={6}
                value={
                  restriccionesAgente
                }
                onChange={(event) => {
                  setRestriccionesAgente(
                    event.target.value,
                  );
                  setMensaje("");
                }}
                placeholder="Ejemplo: no inventar precios, promociones, horarios ni disponibilidad."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-700"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-zinc-600">
                La base de conocimiento y los datos del negocio aportan la
                información real. Estas reglas indican cómo debe utilizarla.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-950 dark:text-white">
                {hayCambios
                  ? "Tenés cambios pendientes"
                  : "Todo está actualizado"}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                {hayCambios
                  ? "Guardá los cambios para que el asistente use la nueva configuración."
                  : "El asistente ya está usando la configuración guardada."}
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                guardando ||
                !hayCambios
              }
            >
              {guardando
                ? "Guardando..."
                : hayCambios
                  ? "Guardar cambios"
                  : "Configuración guardada"}
            </Button>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Vista previa
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-500">
              Así se presentará el asistente durante una consulta.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <Avatar
                  name={
                    nombreAgente ||
                    "Asistente IA"
                  }
                  size="md"
                />

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950 dark:text-white">
                    {nombreAgente ||
                      "Nombre del asistente"}
                  </p>

                  <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                    {rolAgente ||
                      "Asistente virtual"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl rounded-bl-md border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm leading-6 text-slate-700 dark:text-zinc-200">
                  Hola, soy{" "}
                  {nombreAgente ||
                    "tu asistente virtual"}
                  . ¿En qué puedo ayudarte?
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Qué usa para responder
            </p>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-zinc-500">
              <p>
                • Información del negocio y de tu página.
              </p>

              <p>
                • Servicios y productos activos.
              </p>

              <p>
                • Base de conocimiento.
              </p>

              <p>
                • Historial y memoria de la consulta.
              </p>

              <p>
                • Disponibilidad y herramientas habilitadas.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Recomendación
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-500">
              No cargues acá precios, horarios ni políticas que ya estén en
              Servicios y productos o en la Base de conocimiento. Acá definís
              el comportamiento del asistente.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-600">
              ID de empresa
            </p>

            <p className="mt-2 break-all text-sm text-slate-700 dark:text-zinc-300">
              {empresaId}
            </p>
          </Card>
        </aside>
      </form>
    </section>
  );
}