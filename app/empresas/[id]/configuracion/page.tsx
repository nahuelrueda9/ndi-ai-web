"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
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
  agente?: {
    nombre?: string;
    rol?: string;
    personalidad?: string;
    instrucciones?: string;
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
  instrucciones: string;
};

export default function ConfiguracionPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const [user, setUser] = useState<User | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState("");

  const [nombreAgente, setNombreAgente] = useState("");
  const [rolAgente, setRolAgente] = useState("");
  const [personalidadAgente, setPersonalidadAgente] = useState("");
  const [instruccionesAgente, setInstruccionesAgente] = useState("");

  const [configuracionInicial, setConfiguracionInicial] =
    useState<ConfiguracionInicial>({
      nombre: "",
      rol: "",
      personalidad: "",
      instrucciones: "",
    });

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

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
              "No se encontró el ID de la empresa."
            );
            setLoading(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          setUser(null);
          setAccesoVerificado(false);
          setError("");
          setLoading(true);

          try {
            const empresaReferencia =
              doc(
                db,
                "companies",
                empresaIdSeguro
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe."
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
                  currentUser.uid
                );

              const miembroSnapshot =
                await getDoc(
                  miembroReferencia
                );

              if (
                !miembroSnapshot.exists()
              ) {
                router.replace(
                  "/empresas"
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
                  `/empresas/${empresaIdSeguro}/conversaciones`
                );
                return;
              }
            }

            const configuracion = {
              nombre:
                empresa.agente?.nombre ||
                "",
              rol:
                empresa.agente?.rol ||
                "",
              personalidad:
                empresa.agente
                  ?.personalidad ||
                "",
              instrucciones:
                empresa.agente
                  ?.instrucciones ||
                "",
            };

            setUser(currentUser);
            setAccesoVerificado(true);

            setEmpresaNombre(
              empresa.nombre || ""
            );

            setNombreAgente(
              configuracion.nombre
            );

            setRolAgente(
              configuracion.rol
            );

            setPersonalidadAgente(
              configuracion.personalidad
            );

            setInstruccionesAgente(
              configuracion.instrucciones
            );

            setConfiguracionInicial(
              configuracion
            );
          } catch (firebaseError) {
            console.error(
              "Error al cargar la configuración del agente:",
              firebaseError
            );

            setError(
              "No se pudo cargar la configuración del agente."
            );
          } finally {
            setLoading(false);
          }
        }
      );

    return () => unsubscribeAuth();
  }, [empresaId, router]);

  const hayCambios = useMemo(() => {
    return (
      nombreAgente !== configuracionInicial.nombre ||
      rolAgente !== configuracionInicial.rol ||
      personalidadAgente !== configuracionInicial.personalidad ||
      instruccionesAgente !== configuracionInicial.instrucciones
    );
  }, [
    configuracionInicial,
    instruccionesAgente,
    nombreAgente,
    personalidadAgente,
    rolAgente,
  ]);

  const handleGuardar = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !user ||
      !empresaId ||
      !accesoVerificado
    ) {
      return;
    }

    const nombreLimpio = nombreAgente.trim();
    const rolLimpio = rolAgente.trim();
    const personalidadLimpia = personalidadAgente.trim();
    const instruccionesLimpias = instruccionesAgente.trim();

    if (!nombreLimpio) {
      setError("Ingresá el nombre del agente.");
      return;
    }

    if (!rolLimpio) {
      setError("Ingresá el rol del agente.");
      return;
    }

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const empresaReferencia = doc(db, "companies", empresaId);

      await setDoc(
        empresaReferencia,
        {
          agente: {
            nombre: nombreLimpio,
            rol: rolLimpio,
            personalidad: personalidadLimpia,
            instrucciones: instruccionesLimpias,
          },
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      const nuevaConfiguracion = {
        nombre: nombreLimpio,
        rol: rolLimpio,
        personalidad: personalidadLimpia,
        instrucciones: instruccionesLimpias,
      };

      setNombreAgente(nombreLimpio);
      setRolAgente(rolLimpio);
      setPersonalidadAgente(personalidadLimpia);
      setInstruccionesAgente(instruccionesLimpias);
      setConfiguracionInicial(nuevaConfiguracion);
      setMensaje("Configuración guardada correctamente.");
    } catch (firebaseError) {
      console.error(
        "Error al guardar la configuración del agente:",
        firebaseError
      );

      setError("No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium text-white">
            Cargando configuración...
          </p>
        </Card>
      </section>
    );
  }

  if (error && !empresaNombre) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="font-medium text-red-300">{error}</p>

          <div className="mt-5">
            <Button
              variant="secondary"
              onClick={() => router.push("/empresas")}
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

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-blue-400">
            {empresaNombre || "Empresa"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Configuración del Agente IA
            </h1>

            <Badge variant={hayCambios ? "warning" : "success"}>
              {hayCambios ? "Cambios sin guardar" : "Configuración guardada"}
            </Badge>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Definí el nombre, el rol, la personalidad y las reglas que usará el
            asistente para responderle a los clientes.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => router.push(`/empresas/${empresaId}`)}
        >
          Volver a la empresa
        </Button>
      </header>

      <form
        onSubmit={handleGuardar}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-6">
          {error && (
            <Card className="border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-300">{error}</p>
            </Card>
          )}

          {mensaje && (
            <Card className="border-green-500/20 bg-green-500/10 p-4">
              <p className="text-sm text-green-300">{mensaje}</p>
            </Card>
          )}

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Identidad del agente
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Estos datos definen cómo se presenta el asistente frente a los
                visitantes.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="nombreAgente"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Nombre del agente
                </label>

                <Input
                  id="nombreAgente"
                  type="text"
                  value={nombreAgente}
                  onChange={(event) => {
                    setNombreAgente(event.target.value);
                    setMensaje("");
                  }}
                  placeholder="Ejemplo: Sofía"
                  required
                />

                <p className="mt-2 text-xs text-zinc-600">
                  Es el nombre que verá el cliente en el chat.
                </p>
              </div>

              <div>
                <label
                  htmlFor="rolAgente"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Rol del agente
                </label>

                <Input
                  id="rolAgente"
                  type="text"
                  value={rolAgente}
                  onChange={(event) => {
                    setRolAgente(event.target.value);
                    setMensaje("");
                  }}
                  placeholder="Ejemplo: Recepcionista virtual"
                  required
                />

                <p className="mt-2 text-xs text-zinc-600">
                  Describe qué función cumple dentro de la empresa.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Comportamiento
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Indicá el tono que debe usar y las reglas que siempre tiene que
                respetar.
              </p>
            </div>

            <div>
              <label
                htmlFor="personalidadAgente"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Personalidad
              </label>

              <Input
                id="personalidadAgente"
                type="text"
                value={personalidadAgente}
                onChange={(event) => {
                  setPersonalidadAgente(event.target.value);
                  setMensaje("");
                }}
                placeholder="Ejemplo: Amable, clara, cercana y profesional"
              />

              <p className="mt-2 text-xs text-zinc-600">
                Podés combinar varios rasgos separados por comas.
              </p>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="instruccionesAgente"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Instrucciones del agente
                </label>

                <span className="text-xs text-zinc-600">
                  {instruccionesAgente.length} caracteres
                </span>
              </div>

              <textarea
                id="instruccionesAgente"
                rows={10}
                value={instruccionesAgente}
                onChange={(event) => {
                  setInstruccionesAgente(event.target.value);
                  setMensaje("");
                }}
                placeholder="Ejemplo: No inventes precios. Respondé solamente con información de la empresa. Si no sabés una respuesta, indicá que un asesor continuará la atención."
                className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-500"
              />

              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Escribí reglas claras y directas. El agente usará estas
                instrucciones en cada conversación.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">
                {hayCambios
                  ? "Tenés cambios pendientes"
                  : "Todo está actualizado"}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {hayCambios
                  ? "Guardá la configuración antes de salir de esta pantalla."
                  : "La configuración actual ya está guardada en Firebase."}
              </p>
            </div>

            <Button
              type="submit"
              disabled={guardando || !hayCambios}
            >
              {guardando
                ? "Guardando..."
                : hayCambios
                  ? "Guardar configuración"
                  : "Configuración guardada"}
            </Button>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <p className="text-sm font-semibold text-white">
              Vista previa
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Así se presentará el agente en una conversación.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <div className="flex items-center gap-3">
                <Avatar name={nombreAgente || "Agente IA"} size="md" />

                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {nombreAgente || "Nombre del agente"}
                  </p>

                  <p className="truncate text-xs text-zinc-500">
                    {rolAgente || "Rol del agente"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-sm leading-6 text-zinc-200">
                  Hola, soy {nombreAgente || "tu asistente virtual"}. ¿En qué
                  puedo ayudarte?
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-white">
              Recomendaciones
            </p>

            <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-500">
              <p>
                Usá un nombre corto y fácil de recordar para que la conversación
                se sienta más natural.
              </p>

              <p>
                En las instrucciones, aclarale qué información no debe inventar
                y cuándo debe derivar la consulta a una persona.
              </p>

              <p>
                Evitá indicaciones contradictorias. Cuanto más claras sean las
                reglas, más consistentes serán las respuestas.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              ID de empresa
            </p>

            <p className="mt-2 break-all text-sm text-zinc-300">
              {empresaId}
            </p>
          </Card>
        </aside>
      </form>
    </section>
  );
}