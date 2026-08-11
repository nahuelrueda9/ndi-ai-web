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
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type TemaWidget = "oscuro" | "claro";
type PosicionWidget =
  | "derecha"
  | "izquierda";
type FormaWidget =
  | "redondo"
  | "cuadrado";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

interface Empresa {
  nombre?: string;
  userId: string;
  widget?: {
    nombreBot?: string;
    mensajeBienvenida?: string;
    colorPrincipal?: string;
    tema?: TemaWidget;
    posicion?: PosicionWidget;
    formaBoton?: FormaWidget;
    textoPlaceholder?: string;
    mostrarMarca?: boolean;
  };
}

interface MiembroEmpresa {
  rol?: Exclude<
    RolEmpresa,
    "propietario"
  >;
  estado?: "activo" | "inactivo";
}

type ConfigWidget = {
  nombreBot: string;
  mensajeBienvenida: string;
  colorPrincipal: string;
  tema: TemaWidget;
  posicion: PosicionWidget;
  formaBoton: FormaWidget;
  textoPlaceholder: string;
  mostrarMarca: boolean;
};

const CONFIG_INICIAL: ConfigWidget = {
  nombreBot: "Asistente virtual",
  mensajeBienvenida:
    "¡Hola! ¿En qué puedo ayudarte?",
  colorPrincipal: "#3b82f6",
  tema: "oscuro",
  posicion: "derecha",
  formaBoton: "redondo",
  textoPlaceholder:
    "Escribí tu mensaje...",
  mostrarMarca: true,
};

export default function WidgetPage() {
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
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [copiado, setCopiado] =
    useState(false);

  const [
    nombreEmpresa,
    setNombreEmpresa,
  ] = useState("");

  const [
    nombreBot,
    setNombreBot,
  ] = useState(
    CONFIG_INICIAL.nombreBot,
  );

  const [
    mensajeBienvenida,
    setMensajeBienvenida,
  ] = useState(
    CONFIG_INICIAL.mensajeBienvenida,
  );

  const [
    colorPrincipal,
    setColorPrincipal,
  ] = useState(
    CONFIG_INICIAL.colorPrincipal,
  );

  const [tema, setTema] =
    useState<TemaWidget>(
      CONFIG_INICIAL.tema,
    );

  const [
    posicion,
    setPosicion,
  ] = useState<PosicionWidget>(
    CONFIG_INICIAL.posicion,
  );

  const [
    formaBoton,
    setFormaBoton,
  ] = useState<FormaWidget>(
    CONFIG_INICIAL.formaBoton,
  );

  const [
    textoPlaceholder,
    setTextoPlaceholder,
  ] = useState(
    CONFIG_INICIAL.textoPlaceholder,
  );

  const [
    mostrarMarca,
    setMostrarMarca,
  ] = useState(
    CONFIG_INICIAL.mostrarMarca,
  );

  const [
    configuracionInicial,
    setConfiguracionInicial,
  ] = useState<ConfigWidget>(
    CONFIG_INICIAL,
  );

  useEffect(() => {
    const unsubscribe =
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
            setCargando(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          setCargando(true);
          setError("");
          setMensaje("");
          setAccesoVerificado(false);

          try {
            const referencia =
              doc(
                db,
                "companies",
                empresaIdSeguro,
              );

            const resultado =
              await getDoc(referencia);

            if (!resultado.exists()) {
              setError(
                "La empresa no existe.",
              );
              return;
            }

            const empresa =
              resultado.data() as Empresa;

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

            const config: ConfigWidget = {
              nombreBot:
                empresa.widget
                  ?.nombreBot ||
                empresa.nombre ||
                CONFIG_INICIAL.nombreBot,

              mensajeBienvenida:
                empresa.widget
                  ?.mensajeBienvenida ||
                CONFIG_INICIAL.mensajeBienvenida,

              colorPrincipal:
                empresa.widget
                  ?.colorPrincipal ||
                CONFIG_INICIAL.colorPrincipal,

              tema:
                empresa.widget?.tema ||
                CONFIG_INICIAL.tema,

              posicion:
                empresa.widget
                  ?.posicion ||
                CONFIG_INICIAL.posicion,

              formaBoton:
                empresa.widget
                  ?.formaBoton ||
                CONFIG_INICIAL.formaBoton,

              textoPlaceholder:
                empresa.widget
                  ?.textoPlaceholder ||
                CONFIG_INICIAL.textoPlaceholder,

              mostrarMarca:
                empresa.widget
                  ?.mostrarMarca ??
                CONFIG_INICIAL.mostrarMarca,
            };

            setUser(currentUser);
            setAccesoVerificado(true);

            setNombreEmpresa(
              empresa.nombre ||
                "Empresa",
            );

            setNombreBot(
              config.nombreBot,
            );

            setMensajeBienvenida(
              config.mensajeBienvenida,
            );

            setColorPrincipal(
              config.colorPrincipal,
            );

            setTema(config.tema);

            setPosicion(
              config.posicion,
            );

            setFormaBoton(
              config.formaBoton,
            );

            setTextoPlaceholder(
              config.textoPlaceholder,
            );

            setMostrarMarca(
              config.mostrarMarca,
            );

            setConfiguracionInicial(
              config,
            );
          } catch (firebaseError) {
            console.error(
              "Error al cargar el widget:",
              firebaseError,
            );

            setError(
              "No se pudo cargar la configuración del widget.",
            );
          } finally {
            setCargando(false);
          }
        },
      );

    return () => unsubscribe();
  }, [empresaId, router]);

  const configuracionActual =
    useMemo<ConfigWidget>(
      () => ({
        nombreBot,
        mensajeBienvenida,
        colorPrincipal,
        tema,
        posicion,
        formaBoton,
        textoPlaceholder,
        mostrarMarca,
      }),
      [
        colorPrincipal,
        formaBoton,
        mensajeBienvenida,
        mostrarMarca,
        nombreBot,
        posicion,
        tema,
        textoPlaceholder,
      ],
    );

  const hayCambios =
    useMemo(() => {
      return (
        configuracionActual.nombreBot !==
          configuracionInicial.nombreBot ||
        configuracionActual.mensajeBienvenida !==
          configuracionInicial.mensajeBienvenida ||
        configuracionActual.colorPrincipal !==
          configuracionInicial.colorPrincipal ||
        configuracionActual.tema !==
          configuracionInicial.tema ||
        configuracionActual.posicion !==
          configuracionInicial.posicion ||
        configuracionActual.formaBoton !==
          configuracionInicial.formaBoton ||
        configuracionActual.textoPlaceholder !==
          configuracionInicial.textoPlaceholder ||
        configuracionActual.mostrarMarca !==
          configuracionInicial.mostrarMarca
      );
    }, [
      configuracionActual,
      configuracionInicial,
    ]);

  const codigoInstalacion =
    useMemo(() => {
      const idSeguro =
        empresaId ||
        "TU_EMPRESA_ID";

      const origen =
        typeof window !==
        "undefined"
          ? window.location.origin
          : "https://tu-dominio.com";

      return `<script
  src="${origen}/widget.js"
  data-empresa-id="${idSeguro}"
  async
></script>`;
    }, [empresaId]);

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(
        codigoInstalacion,
      );

      setCopiado(true);

      window.setTimeout(
        () => setCopiado(false),
        1800,
      );
    } catch (copyError) {
      console.error(
        "No se pudo copiar el código:",
        copyError,
      );

      setError(
        "No se pudo copiar el código.",
      );
    }
  }

  async function guardarApariencia(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !user ||
      !empresaId ||
      !accesoVerificado
    ) {
      return;
    }

    const nombreLimpio =
      nombreBot.trim();

    const bienvenidaLimpia =
      mensajeBienvenida.trim();

    const placeholderLimpio =
      textoPlaceholder.trim();

    if (!nombreLimpio) {
      setError(
        "Ingresá el nombre del widget.",
      );
      return;
    }

    if (!bienvenidaLimpia) {
      setError(
        "Ingresá un mensaje de bienvenida.",
      );
      return;
    }

    if (!placeholderLimpio) {
      setError(
        "Ingresá el texto del campo de mensaje.",
      );
      return;
    }

    const configGuardada: ConfigWidget = {
      nombreBot: nombreLimpio,
      mensajeBienvenida:
        bienvenidaLimpia,
      colorPrincipal,
      tema,
      posicion,
      formaBoton,
      textoPlaceholder:
        placeholderLimpio,
      mostrarMarca,
    };

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await setDoc(
        doc(
          db,
          "companies",
          empresaId,
        ),
        {
          widget:
            configGuardada,
          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setNombreBot(
        configGuardada.nombreBot,
      );

      setMensajeBienvenida(
        configGuardada.mensajeBienvenida,
      );

      setTextoPlaceholder(
        configGuardada.textoPlaceholder,
      );

      setConfiguracionInicial(
        configGuardada,
      );

      setMensaje(
        "Apariencia del widget guardada correctamente.",
      );
    } catch (firebaseError) {
      console.error(
        "Error al guardar el widget:",
        firebaseError,
      );

      setError(
        "No se pudo guardar la apariencia del widget.",
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="font-medium text-slate-950 dark:text-white">
            Cargando widget...
          </p>
        </Card>
      </section>
    );
  }

  if (
    error &&
    !nombreEmpresa
  ) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-300">
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

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {nombreEmpresa}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Widget web
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
            Personalizá el chat que verá el cliente
            e instalalo en cualquier sitio web con un solo script.
          </p>
        </div>

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
      </header>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </Card>
      )}

      {mensaje && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {mensaje}
          </p>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <form
            onSubmit={
              guardarApariencia
            }
          >
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Apariencia del chat
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-500">
                  Estos cambios afectan tanto al widget instalado como
                  al chat que usás dentro de tu página inteligente.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="nombreBot"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Nombre visible
                  </label>

                  <Input
                    id="nombreBot"
                    value={
                      nombreBot
                    }
                    onChange={(
                      event,
                    ) => {
                      setNombreBot(
                        event.target
                          .value,
                      );
                      setMensaje("");
                    }}
                    placeholder="Asistente virtual"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="textoPlaceholder"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Texto del campo
                  </label>

                  <Input
                    id="textoPlaceholder"
                    value={
                      textoPlaceholder
                    }
                    onChange={(
                      event,
                    ) => {
                      setTextoPlaceholder(
                        event.target
                          .value,
                      );
                      setMensaje("");
                    }}
                    placeholder="Escribí tu mensaje..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="mensajeBienvenida"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Mensaje de bienvenida
                  </label>

                  <textarea
                    id="mensajeBienvenida"
                    rows={4}
                    value={
                      mensajeBienvenida
                    }
                    onChange={(
                      event,
                    ) => {
                      setMensajeBienvenida(
                        event.target
                          .value,
                      );
                      setMensaje("");
                    }}
                    placeholder="¡Hola! ¿En qué puedo ayudarte?"
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="colorPrincipal"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Color principal
                  </label>

                  <div className="flex gap-3">
                    <input
                      id="colorPrincipal"
                      type="color"
                      value={
                        colorPrincipal
                      }
                      onChange={(
                        event,
                      ) => {
                        setColorPrincipal(
                          event.target
                            .value,
                        );
                        setMensaje("");
                      }}
                      className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
                    />

                    <Input
                      value={
                        colorPrincipal
                      }
                      onChange={(
                        event,
                      ) => {
                        setColorPrincipal(
                          event.target
                            .value,
                        );
                        setMensaje("");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tema"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Tema
                  </label>

                  <select
                    id="tema"
                    value={tema}
                    onChange={(
                      event,
                    ) => {
                      setTema(
                        event.target
                          .value as TemaWidget,
                      );
                      setMensaje("");
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="oscuro">
                      Oscuro
                    </option>

                    <option value="claro">
                      Claro
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="posicion"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Posición
                  </label>

                  <select
                    id="posicion"
                    value={
                      posicion
                    }
                    onChange={(
                      event,
                    ) => {
                      setPosicion(
                        event.target
                          .value as PosicionWidget,
                      );
                      setMensaje("");
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="derecha">
                      Derecha
                    </option>

                    <option value="izquierda">
                      Izquierda
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="formaBoton"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Forma del botón
                  </label>

                  <select
                    id="formaBoton"
                    value={
                      formaBoton
                    }
                    onChange={(
                      event,
                    ) => {
                      setFormaBoton(
                        event.target
                          .value as FormaWidget,
                      );
                      setMensaje("");
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="redondo">
                      Redondo
                    </option>

                    <option value="cuadrado">
                      Cuadrado
                    </option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">
                      Mostrar “Creado con NDI AI”
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-600">
                      Controla la marca visible debajo del chat.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      mostrarMarca
                    }
                    onChange={(
                      event,
                    ) => {
                      setMostrarMarca(
                        event.target
                          .checked,
                      );
                      setMensaje("");
                    }}
                    className="h-5 w-5 accent-blue-500"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                <p className="text-sm text-slate-500 dark:text-zinc-500">
                  {hayCambios
                    ? "Tenés cambios pendientes."
                    : "La apariencia está actualizada."}
                </p>

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
                      ? "Guardar apariencia"
                      : "Configuración guardada"}
                </Button>
              </div>
            </Card>
          </form>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Código de instalación
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                  Pegalo antes del cierre de la etiqueta{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-zinc-950 dark:text-zinc-300">
                    body
                  </code>{" "}
                  del sitio donde quieras mostrar el chat.
                </p>
              </div>

              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
                SCRIPT
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <pre className="max-h-72 overflow-auto p-4 text-sm leading-6 text-zinc-300">
                <code>
                  {
                    codigoInstalacion
                  }
                </code>
              </pre>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all text-xs text-slate-500 dark:text-zinc-600">
                Empresa: {empresaId}
              </p>

              <Button
                type="button"
                onClick={copiarCodigo}
              >
                {copiado
                  ? "Código copiado"
                  : "Copiar código"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Cómo instalarlo
            </h2>

            <div className="mt-5 space-y-4">
              <Paso
                numero="1"
                titulo="Copiá el código"
                descripcion="Usá el botón de arriba para copiar el script completo."
              />

              <Paso
                numero="2"
                titulo="Pegalo en la web"
                descripcion="Colocalo antes de </body> en el HTML del sitio."
              />

              <Paso
                numero="3"
                titulo="Publicá los cambios"
                descripcion="El botón del chat aparecerá automáticamente."
              />
            </div>

            <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                También podés usar el asistente directamente en la página inteligente de NDI AI sin instalar este script.
              </p>
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">
                  Vista previa
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                  Los cambios se ven acá antes de guardarlos.
                </p>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
                En vivo
              </span>
            </div>

            <div className="relative mt-5 min-h-[580px] overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(to_bottom,_#18181b,_#09090b)] dark:border-zinc-800">
              <div className="absolute inset-x-5 top-5">
                <div className="h-3 w-28 rounded-full bg-zinc-800" />
                <div className="mt-3 h-2.5 w-44 rounded-full bg-zinc-800/70" />
                <div className="mt-2 h-2.5 w-36 rounded-full bg-zinc-800/50" />
              </div>

              <div
                className={`absolute bottom-24 w-[calc(100%-2rem)] overflow-hidden rounded-2xl border shadow-2xl ${
                  posicion ===
                  "derecha"
                    ? "right-4"
                    : "left-4"
                } ${
                  tema ===
                  "oscuro"
                    ? "border-zinc-700 bg-zinc-950"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4 text-white"
                  style={{
                    backgroundColor:
                      colorPrincipal,
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    ✦
                  </div>

                  <div>
                    <p className="font-semibold">
                      {nombreBot ||
                        "Asistente virtual"}
                    </p>

                    <p className="text-xs text-white/80">
                      En línea ahora
                    </p>
                  </div>
                </div>

                <div
                  className={`space-y-4 p-4 ${
                    tema ===
                    "oscuro"
                      ? "bg-zinc-950"
                      : "bg-zinc-50"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm ${
                      tema ===
                      "oscuro"
                        ? "bg-zinc-900 text-zinc-300"
                        : "bg-white text-zinc-700 shadow-sm"
                    }`}
                  >
                    {mensajeBienvenida ||
                      "¡Hola! ¿En qué puedo ayudarte?"}
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                      tema ===
                      "oscuro"
                        ? "border-zinc-800 bg-zinc-900"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span
                      className={`flex-1 truncate text-xs ${
                        tema ===
                        "oscuro"
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      {textoPlaceholder ||
                        "Escribí tu mensaje..."}
                    </span>

                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{
                        backgroundColor:
                          colorPrincipal,
                      }}
                    >
                      ↑
                    </div>
                  </div>

                  {mostrarMarca && (
                    <p
                      className={`text-center text-[10px] ${
                        tema ===
                        "oscuro"
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      Creado con NDI AI
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Abrir vista previa del chat"
                className={`absolute bottom-4 flex h-14 w-14 items-center justify-center text-xl text-white shadow-xl ${
                  posicion ===
                  "derecha"
                    ? "right-4"
                    : "left-4"
                } ${
                  formaBoton ===
                  "redondo"
                    ? "rounded-full"
                    : "rounded-2xl"
                }`}
                style={{
                  backgroundColor:
                    colorPrincipal,
                }}
              >
                💬
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function Paso({
  numero,
  titulo,
  descripcion,
}: {
  numero: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {numero}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">
          {titulo}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-zinc-500">
          {descripcion}
        </p>
      </div>
    </div>
  );
}