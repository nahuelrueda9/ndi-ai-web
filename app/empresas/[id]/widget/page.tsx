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
  plan?: "free" | "pro" | "business";
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
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

  const [
    widgetHabilitado,
    setWidgetHabilitado,
  ] = useState<boolean | null>(null);

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
          setWidgetHabilitado(null);

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

            const tieneWidget =
              empresaTieneFuncion(
                empresa,
                "asistente_ia",
              );

            if (!tieneWidget) {
              setWidgetHabilitado(false);
              router.replace(
                `/empresas/${empresaIdSeguro}/dashboard`,
              );
              return;
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
            setWidgetHabilitado(true);

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
    if (!widgetHabilitado) {
      setError(
        "El Widget web está disponible únicamente con Business IA y una suscripción activa.",
      );
      return;
    }

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

    if (!widgetHabilitado) {
      setError(
        "El Widget web está disponible únicamente con Business IA y una suscripción activa.",
      );
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
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="p-6 text-center sm:p-10">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500 sm:mb-4 sm:h-8 sm:w-8" />

          <p className="text-xs font-medium text-slate-950 dark:text-white sm:text-base">
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
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="border-red-200 bg-red-50 p-5 text-center dark:border-red-500/20 dark:bg-red-500/10 sm:p-8">
          <p className="text-xs text-red-700 dark:text-red-300 sm:text-sm">
            {error}
          </p>

          <div className="mt-3 sm:mt-5">
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

  if (widgetHabilitado === null) {
    return null;
  }

  if (widgetHabilitado === false) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-12">
        <Card className="border-violet-200 bg-violet-50 p-5 text-center sm:p-12 dark:border-violet-500/20 dark:bg-violet-500/5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 sm:h-16 sm:w-16 sm:rounded-2xl">
            <span className="text-lg sm:text-2xl">✦</span>
          </div>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400 sm:mt-6 sm:text-sm sm:tracking-[0.18em]">
            Exclusivo de Business IA
          </p>

          <h1 className="mt-1.5 text-xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
            Widget web
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
            El chat con IA para instalar en sitios web está disponible únicamente con Business IA y una suscripción activa.
          </p>

          <Button
            type="button"
            className="mt-4 sm:mt-7"
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
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-4 flex items-end justify-between gap-2 sm:mb-8 sm:flex-col sm:items-stretch sm:gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
            {nombreEmpresa}
          </p>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
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

          <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:max-w-2xl sm:text-sm sm:leading-6">
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
        <Card className="mb-3 border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10 sm:mb-6 sm:p-4">
          <p className="text-xs text-red-700 dark:text-red-300 sm:text-sm">
            {error}
          </p>
        </Card>
      )}

      {mensaje && (
        <Card className="mb-3 border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:mb-6 sm:p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 sm:text-sm">
            {mensaje}
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3 sm:space-y-6">
          <form
            onSubmit={
              guardarApariencia
            }
          >
            <Card className="p-3 sm:p-6">
              <div className="mb-3 sm:mb-6">
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                  Apariencia del chat
                </h2>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-600 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-6">
                  Estos cambios afectan tanto al widget instalado como
                  al chat que usás dentro de tu página inteligente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="nombreBot"
                    className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
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
                    className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
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

                <div className="col-span-2">
                  <label
                    htmlFor="mensajeBienvenida"
                    className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
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
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] leading-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-700 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                  />
                </div>

                <div>
                  <label
                    htmlFor="colorPrincipal"
                    className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
                  >
                    Color principal
                  </label>

                  <div className="flex gap-1.5 sm:gap-3">
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
                      className="h-9 w-11 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950 sm:h-11 sm:w-14 sm:rounded-xl"
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
                    className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
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
                    className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <option value="redondo">
                      Redondo
                    </option>

                    <option value="cuadrado">
                      Cuadrado
                    </option>
                  </select>
                </div>

                <label className="col-span-2 flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60 sm:gap-4 sm:rounded-xl sm:p-4">
                  <div>
                    <p className="text-[10px] font-medium text-slate-950 dark:text-white sm:text-sm">
                      Mostrar “Creado con NDI AI”
                    </p>

                    <p className="mt-0.5 text-[9px] leading-4 text-slate-500 dark:text-zinc-600 sm:mt-1 sm:text-xs sm:leading-5">
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
                    className="h-4 w-4 accent-blue-500 sm:h-5 sm:w-5"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 sm:mt-6 sm:gap-3 sm:pt-5 dark:border-zinc-800">
                <p className="text-[9px] text-slate-500 dark:text-zinc-500 sm:text-sm">
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

          <Card className="p-3 sm:p-6">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
                  Código de instalación
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
                  Pegalo antes del cierre de la etiqueta{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-zinc-950 dark:text-zinc-300">
                    body
                  </code>{" "}
                  del sitio donde quieras mostrar el chat.
                </p>
              </div>

              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
                SCRIPT
              </span>
            </div>

            <div className="mt-2.5 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 dark:border-zinc-800 dark:bg-zinc-950 sm:mt-5 sm:rounded-xl">
              <pre className="max-h-40 overflow-auto p-2.5 text-[9px] leading-4 text-zinc-100 dark:text-zinc-300 sm:max-h-72 sm:p-4 sm:text-sm sm:leading-6">
                <code>
                  {
                    codigoInstalacion
                  }
                </code>
              </pre>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-4 sm:gap-3">
              <p className="min-w-0 truncate text-[9px] text-slate-500 dark:text-zinc-600 sm:break-all sm:text-xs">
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

          <Card className="p-3 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
              Cómo instalarlo
            </h2>

            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:mt-5 sm:block sm:space-y-4">
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

            <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-2.5 sm:mt-5 sm:rounded-xl sm:p-4">
              <p className="text-[10px] leading-4 font-medium text-blue-700 dark:text-blue-300 sm:text-sm sm:leading-normal">
                También podés usar el asistente directamente en la página inteligente de NDI AI sin instalar este script.
              </p>
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <Card className="p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-950 dark:text-white sm:text-base">
                  Vista previa
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                  Los cambios se ven acá antes de guardarlos.
                </p>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500 sm:px-2.5 sm:py-1 sm:text-[11px]">
                En vivo
              </span>
            </div>

            <div className="relative mt-2.5 min-h-[390px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(to_bottom,_#18181b,_#09090b)] sm:mt-5 sm:min-h-[580px] sm:rounded-2xl">
              <div className="absolute inset-x-3 top-3 sm:inset-x-5 sm:top-5">
                <div className="h-2 w-20 rounded-full bg-slate-300 dark:bg-zinc-800 sm:h-3 sm:w-28" />
                <div className="mt-2 h-2 w-32 rounded-full bg-slate-200 dark:bg-zinc-800/70 sm:mt-3 sm:h-2.5 sm:w-44" />
                <div className="mt-1.5 h-2 w-28 rounded-full bg-slate-200 dark:bg-zinc-800/50 sm:mt-2 sm:h-2.5 sm:w-36" />
              </div>

              <div
                className={`absolute bottom-16 w-[calc(100%-1rem)] overflow-hidden rounded-xl border shadow-2xl sm:bottom-24 sm:w-[calc(100%-2rem)] sm:rounded-2xl ${
                  posicion ===
                  "derecha"
                    ? "right-2 sm:right-4"
                    : "left-2 sm:left-4"
                } ${
                  tema ===
                  "oscuro"
                    ? "border-zinc-700 bg-zinc-950 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2.5 text-white sm:gap-3 sm:px-5 sm:py-4"
                  style={{
                    backgroundColor:
                      colorPrincipal,
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 sm:h-10 sm:w-10">
                    ✦
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold sm:text-base">
                      {nombreBot ||
                        "Asistente virtual"}
                    </p>

                    <p className="text-[9px] text-white/80 sm:text-xs">
                      En línea ahora
                    </p>
                  </div>
                </div>

                <div
                  className={`space-y-2 p-2.5 sm:space-y-4 sm:p-4 ${
                    tema ===
                    "oscuro"
                      ? "bg-zinc-950 text-zinc-100"
                      : "bg-slate-50 text-slate-900"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl rounded-bl-md px-3 py-2 text-[10px] leading-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-normal ${
                      tema ===
                      "oscuro"
                        ? "bg-zinc-900 text-zinc-300"
                        : "bg-white text-slate-700 shadow-sm border border-slate-100"
                    }`}
                  >
                    {mensajeBienvenida ||
                      "¡Hola! ¿En qué puedo ayudarte?"}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 ${
                      tema ===
                      "oscuro"
                        ? "border-zinc-800 bg-zinc-900 text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <span
                      className={`flex-1 truncate text-[9px] sm:text-xs ${
                        tema ===
                        "oscuro"
                          ? "text-zinc-500"
                          : "text-slate-400"
                      }`}
                    >
                      {textoPlaceholder ||
                        "Escribí tu mensaje..."}
                    </span>

                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md text-white sm:h-8 sm:w-8 sm:rounded-lg"
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
                      className={`text-center text-[8px] sm:text-[10px] ${
                        tema ===
                        "oscuro"
                          ? "text-zinc-600"
                          : "text-slate-400"
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
                className={`absolute bottom-2 flex h-10 w-10 items-center justify-center text-sm text-white shadow-xl sm:bottom-4 sm:h-14 sm:w-14 sm:text-xl ${
                  posicion ===
                  "derecha"
                    ? "right-2 sm:right-4"
                    : "left-2 sm:left-4"
                } ${
                  formaBoton ===
                  "redondo"
                    ? "rounded-full"
                    : "rounded-lg sm:rounded-2xl"
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
    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
        {numero}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-slate-950 dark:text-white sm:text-sm">
          {titulo}
        </p>

        <p className="mt-0.5 text-[8px] leading-3 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-6">
          {descripcion}
        </p>
      </div>
    </div>
  );
}