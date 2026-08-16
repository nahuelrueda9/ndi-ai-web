"use client";

import type { ComponentType } from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  Bell,
  Bot,
  Building2,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  LogOut,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { useTheme } from "@/components/theme/ThemeProvider";
import { auth, db } from "@/lib/firebase";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

interface Empresa {
  id: string;
  nombre: string;
  rol: RolEmpresa;
}

interface Membresia {
  uid?: string;
  rol?: Exclude<
    RolEmpresa,
    "propietario"
  >;
  estado?: "activo" | "inactivo";
}

type TipoNotificacion =
  | "mensaje"
  | "humano"
  | "lead"
  | "plan"
  | "sistema";

interface Notificacion {
  id: string;
  empresaId: string;
  empresaNombre: string;
  tipo?: TipoNotificacion;
  titulo?: string;
  descripcion?: string;
  leida?: boolean;
  chatId?: string;
  visitanteId?: string;
  url?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface ToastNotification {
  id: string;
  empresaId: string;
  empresaNombre: string;
  titulo: string;
  mensaje: string;
  url?: string;
  chatId?: string;
}

const NOMBRE_ROL: Record<
  RolEmpresa,
  string
> = {
  propietario: "Propietario",
  administrador: "Administrador",
  supervisor: "Supervisor",
  operador: "Operador",
};

const OPCIONES_TEMA = [
  {
    valor: "system",
    nombre: "Sistema",
    descripcion: "Seguir el dispositivo",
    icono: Monitor,
  },
  {
    valor: "light",
    nombre: "Claro",
    descripcion: "Modo claro",
    icono: Sun,
  },
  {
    valor: "dark",
    nombre: "Oscuro",
    descripcion: "Modo noche",
    icono: Moon,
  },
] as const;

type Tema = (typeof OPCIONES_TEMA)[number]["valor"];

export default function Header() {
  const params = useParams();
  const { theme, setTheme } = useTheme();

  const [temaAbierto, setTemaAbierto] =
    useState(false);

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaActualId =
    Array.isArray(parametroEmpresa)
      ? parametroEmpresa[0]
      : (parametroEmpresa as
          | string
          | undefined);

  const [user, setUser] =
    useState<User | null>(null);

  const [empresas, setEmpresas] =
    useState<Empresa[]>([]);

  const [
    notificaciones,
    setNotificaciones,
  ] = useState<Notificacion[]>([]);

  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  const [perfilAbierto, setPerfilAbierto] =
    useState(false);

  const [procesando, setProcesando] =
    useState(false);

  const [toast, setToast] =
    useState<ToastNotification | null>(
      null
    );

  const empresasPropiasRef = useRef<
    Record<string, Empresa>
  >({});

  const empresasCompartidasRef = useRef<
    Record<string, Empresa>
  >({});

  const notificacionesPorEmpresaRef =
    useRef<
      Record<string, Notificacion[]>
    >({});

  const unsubscribesRef = useRef<
    Record<string, () => void>
  >({});

  const empresasInicializadasRef =
    useRef<Set<string>>(new Set());

  const notificacionesConocidasRef =
    useRef<Set<string>>(new Set());

  const toastTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  useEffect(() => {
    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
        }
      );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setEmpresas([]);
      setNotificaciones([]);

      empresasPropiasRef.current = {};
      empresasCompartidasRef.current = {};

      return;
    }

    const usuarioSeguro = user;
    let activo = true;
    let numeroCargaMembresias = 0;

    function combinarNotificaciones() {
      const todas = Object.values(
        notificacionesPorEmpresaRef.current
      ).flat();

      todas.sort((a, b) => {
        const fechaA =
          a.createdAt?.toMillis() ||
          a.updatedAt?.toMillis() ||
          0;

        const fechaB =
          b.createdAt?.toMillis() ||
          b.updatedAt?.toMillis() ||
          0;

        return fechaB - fechaA;
      });

      setNotificaciones(todas);
    }

    function actualizarSuscripciones(
      listaEmpresas: Empresa[]
    ) {
      const idsActuales = new Set(
        listaEmpresas.map(
          (empresa) => empresa.id
        )
      );

      Object.entries(
        unsubscribesRef.current
      ).forEach(
        ([empresaId, unsubscribe]) => {
          if (
            idsActuales.has(empresaId)
          ) {
            return;
          }

          unsubscribe();

          delete unsubscribesRef.current[
            empresaId
          ];

          delete notificacionesPorEmpresaRef
            .current[empresaId];

          empresasInicializadasRef.current.delete(
            empresaId
          );
        }
      );

      listaEmpresas.forEach((empresa) => {
        if (
          unsubscribesRef.current[
            empresa.id
          ]
        ) {
          return;
        }

        const notificacionesQuery =
          query(
            collection(
              db,
              "companies",
              empresa.id,
              "notifications"
            ),
            orderBy(
              "createdAt",
              "desc"
            )
          );

        unsubscribesRef.current[
          empresa.id
        ] = onSnapshot(
          notificacionesQuery,
          (snapshot) => {
            const nuevasNotificaciones =
              snapshot.docs.map(
                (documento) => {
                  const data =
                    documento.data() as Omit<
                      Notificacion,
                      | "id"
                      | "empresaId"
                      | "empresaNombre"
                    >;

                  return {
                    id: documento.id,
                    empresaId:
                      empresa.id,
                    empresaNombre:
                      empresa.nombre,
                    ...data,
                  };
                }
              );

            const esPrimeraCarga =
              !empresasInicializadasRef.current.has(
                empresa.id
              );

            nuevasNotificaciones.forEach(
              (notificacion) => {
                const clave =
                  `${notificacion.empresaId}-${notificacion.id}`;

                if (
                  !esPrimeraCarga &&
                  !notificacionesConocidasRef.current.has(
                    clave
                  )
                ) {
                  mostrarNuevaNotificacion(
                    notificacion
                  );
                }

                notificacionesConocidasRef.current.add(
                  clave
                );
              }
            );

            empresasInicializadasRef.current.add(
              empresa.id
            );

            notificacionesPorEmpresaRef.current[
              empresa.id
            ] = nuevasNotificaciones;

            combinarNotificaciones();
          },
          (error) => {
            const codigo =
              typeof error === "object" &&
              error !== null &&
              "code" in error
                ? String(
                    (
                      error as {
                        code?: unknown;
                      }
                    ).code || ""
                  )
                : "";

            /*
             * Si la empresa acaba de eliminarse (o el usuario perdió
             * acceso), Firestore cierra primero el listener de
             * notifications y puede devolver permission-denied antes
             * de que llegue la actualización de la lista de empresas.
             *
             * Es un cierre esperado: limpiamos el estado local y no
             * mostramos un error rojo en la consola.
             */
            if (
              codigo ===
                "permission-denied" ||
              codigo === "not-found"
            ) {
              delete unsubscribesRef.current[
                empresa.id
              ];

              delete notificacionesPorEmpresaRef
                .current[empresa.id];

              empresasInicializadasRef.current.delete(
                empresa.id
              );

              Array.from(
                notificacionesConocidasRef.current
              ).forEach((clave) => {
                if (
                  clave.startsWith(
                    `${empresa.id}-`
                  )
                ) {
                  notificacionesConocidasRef.current.delete(
                    clave
                  );
                }
              });

              setToast((toastActual) =>
                toastActual?.empresaId ===
                empresa.id
                  ? null
                  : toastActual
              );

              combinarNotificaciones();
              return;
            }

            console.error(
              `Error al escuchar notificaciones de ${empresa.nombre}:`,
              error
            );
          }
        );
      });

      if (
        listaEmpresas.length === 0
      ) {
        setNotificaciones([]);

        notificacionesPorEmpresaRef.current =
          {};
      } else {
        combinarNotificaciones();
      }
    }

    function sincronizarEmpresas() {
      const mapa =
        new Map<string, Empresa>();

      Object.values(
        empresasPropiasRef.current
      ).forEach((empresa) => {
        mapa.set(empresa.id, empresa);
      });

      Object.values(
        empresasCompartidasRef.current
      ).forEach((empresa) => {
        if (!mapa.has(empresa.id)) {
          mapa.set(empresa.id, empresa);
        }
      });

      const lista =
        Array.from(mapa.values());

      setEmpresas(lista);
      actualizarSuscripciones(lista);
    }

    const empresasQuery = query(
      collection(db, "companies"),
      where(
        "userId",
        "==",
        usuarioSeguro.uid
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

    const membresiasQuery = query(
      collectionGroup(db, "members"),
      where(
        "uid",
        "==",
        usuarioSeguro.uid
      ),
      where(
        "estado",
        "==",
        "activo"
      )
    );

    const unsubscribeEmpresas =
      onSnapshot(
        empresasQuery,
        (snapshot) => {
          if (!activo) {
            return;
          }

          const propias: Record<
            string,
            Empresa
          > = {};

          snapshot.docs.forEach(
            (documento) => {
              const data =
                documento.data() as {
                  nombre?: string;
                };

              propias[documento.id] = {
                id: documento.id,
                nombre:
                  data.nombre ||
                  "Empresa",
                rol: "propietario",
              };
            }
          );

          empresasPropiasRef.current =
            propias;

          sincronizarEmpresas();
        },
        (error) => {
          console.error(
            "Error al cargar empresas propias en el header:",
            error
          );
        }
      );

    const unsubscribeMembresias =
      onSnapshot(
        membresiasQuery,
        async (snapshot) => {
          const cargaActual =
            ++numeroCargaMembresias;

          try {
            const resultados =
              await Promise.all(
                snapshot.docs.map(
                  async (
                    documento
                  ): Promise<Empresa | null> => {
                    const empresaReferencia =
                      documento.ref.parent
                        .parent;

                    if (
                      !empresaReferencia
                    ) {
                      return null;
                    }

                    const membresia =
                      documento.data() as Membresia;

                    const empresaSnapshot =
                      await getDoc(
                        empresaReferencia
                      );

                    if (
                      !empresaSnapshot.exists()
                    ) {
                      return null;
                    }

                    const empresa =
                      empresaSnapshot.data() as {
                        nombre?: string;
                      };

                    return {
                      id:
                        empresaReferencia.id,
                      nombre:
                        empresa.nombre ||
                        "Empresa",
                      rol:
                        membresia.rol ||
                        "operador",
                    };
                  }
                )
              );

            if (
              !activo ||
              cargaActual !==
                numeroCargaMembresias
            ) {
              return;
            }

            const compartidas: Record<
              string,
              Empresa
            > = {};

            resultados.forEach(
              (empresa) => {
                if (empresa) {
                  compartidas[
                    empresa.id
                  ] = empresa;
                }
              }
            );

            empresasCompartidasRef.current =
              compartidas;

            sincronizarEmpresas();
          } catch (error) {
            console.error(
              "Error al cargar empresas compartidas en el header:",
              error
            );
          }
        },
        (error) => {
          console.error(
            "Error al cargar membresías en el header:",
            error
          );
        }
      );

    return () => {
      activo = false;

      unsubscribeEmpresas();
      unsubscribeMembresias();

      Object.values(
        unsubscribesRef.current
      ).forEach((unsubscribe) =>
        unsubscribe()
      );

      unsubscribesRef.current = {};

      notificacionesPorEmpresaRef.current =
        {};

      empresasInicializadasRef.current.clear();
      notificacionesConocidasRef.current.clear();

      empresasPropiasRef.current = {};
      empresasCompartidasRef.current = {};
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const notificacionesNoLeidas = useMemo(
    () =>
      notificaciones.filter(
        (notificacion) => !notificacion.leida
      ),
    [notificaciones]
  );

  const notificacionesRecientes =
    notificaciones.slice(0, 6);

  const empresaActual = useMemo(
    () =>
      empresas.find(
        (empresa) =>
          empresa.id === empresaActualId
      ),
    [empresaActualId, empresas]
  );

  const rolActual =
    empresaActual?.rol;

  const opcionTemaActual =
    OPCIONES_TEMA.find(
      (opcion) => opcion.valor === theme
    ) ?? OPCIONES_TEMA[0];

  const IconoTemaActual =
    opcionTemaActual.icono;

  const tituloPanel =
    rolActual === "operador"
      ? "Panel de operador"
      : rolActual === "supervisor"
      ? "Panel de supervisión"
      : "Panel de administración";

  const nombreUsuario =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const emailUsuario = user?.email || "";

  const nombreWorkspace =
    empresaActual?.nombre ||
    (empresas.length === 1
      ? empresas[0]?.nombre
      : "Workspace");

  const etiquetaRol = rolActual
    ? NOMBRE_ROL[rolActual]
    : empresas.length > 0
    ? `${empresas.length} empresa${
        empresas.length === 1 ? "" : "s"
      }`
    : "Usuario";

  const inicialUsuario =
    nombreUsuario.trim().charAt(0).toUpperCase() ||
    "U";

  function mostrarNuevaNotificacion(
    notificacion: Notificacion
  ) {
    reproducirSonido();

    const nuevaNotificacion: ToastNotification = {
      id: `${notificacion.empresaId}-${notificacion.id}`,
      empresaId: notificacion.empresaId,
      empresaNombre: notificacion.empresaNombre,
      titulo:
        notificacion.titulo || "Nueva notificación",
      mensaje:
        notificacion.descripcion ||
        "Se registró una nueva actividad.",
      url: notificacion.url,
      chatId: notificacion.chatId,
    };

    setToast(nuevaNotificacion);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);

    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      const navegador = new Notification(
        nuevaNotificacion.titulo,
        {
          body: `${notificacion.empresaNombre}: ${nuevaNotificacion.mensaje}`,
        }
      );

      navegador.onclick = () => {
        window.focus();

        abrirRutaNotificacion({
          empresaId: notificacion.empresaId,
          url: notificacion.url,
          chatId: notificacion.chatId,
        });
      };
    }
  }

  function reproducirSonido() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      const oscillator =
        audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(
        720,
        audioContext.currentTime
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        940,
        audioContext.currentTime + 0.14
      );

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        audioContext.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.22
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(
        audioContext.currentTime + 0.23
      );
    } catch (error) {
      console.error(
        "No se pudo reproducir el sonido:",
        error
      );
    }
  }

  async function marcarComoLeida(
    notificacion: Notificacion
  ) {
    try {
      if (!notificacion.leida) {
        await updateDoc(
          doc(
            db,
            "companies",
            notificacion.empresaId,
            "notifications",
            notificacion.id
          ),
          {
            leida: true,
            leidaAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      }

      setMenuAbierto(false);
      abrirRutaNotificacion(notificacion);
    } catch (error) {
      console.error(
        "No se pudo marcar la notificación:",
        error
      );
    }
  }

  async function marcarTodoComoLeido() {
    if (
      notificacionesNoLeidas.length === 0 ||
      procesando
    ) {
      return;
    }

    setProcesando(true);

    try {
      const bloques: Notificacion[][] = [];

      for (
        let indice = 0;
        indice < notificacionesNoLeidas.length;
        indice += 400
      ) {
        bloques.push(
          notificacionesNoLeidas.slice(
            indice,
            indice + 400
          )
        );
      }

      for (const bloque of bloques) {
        const batch = writeBatch(db);

        bloque.forEach((notificacion) => {
          const referencia = doc(
            db,
            "companies",
            notificacion.empresaId,
            "notifications",
            notificacion.id
          );

          batch.update(referencia, {
            leida: true,
            leidaAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }
    } catch (error) {
      console.error(
        "No se pudieron marcar las notificaciones:",
        error
      );
    } finally {
      setProcesando(false);
    }
  }

  async function solicitarPermisoNotificaciones() {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  function abrirMenu() {
    setMenuAbierto((estadoActual) => !estadoActual);
    setTemaAbierto(false);
    setPerfilAbierto(false);
    void solicitarPermisoNotificaciones();
  }

  function abrirMenuTema() {
    setTemaAbierto(
      (estadoActual) => !estadoActual
    );
    setMenuAbierto(false);
    setPerfilAbierto(false);
  }

  function abrirMenuPerfil() {
    setPerfilAbierto(
      (estadoActual) => !estadoActual
    );
    setTemaAbierto(false);
    setMenuAbierto(false);
  }

  function seleccionarTema(
    nuevoTema: Tema
  ) {
    setTheme(nuevoTema);
    setTemaAbierto(false);
  }

  function abrirRutaNotificacion({
    empresaId,
    url,
    chatId,
  }: {
    empresaId: string;
    url?: string;
    chatId?: string;
  }) {
    if (url) {
      window.location.href = url;
      return;
    }

    if (chatId) {
      window.location.href =
        `/empresas/${empresaId}/conversaciones/${chatId}`;
      return;
    }

    window.location.href =
      `/empresas/${empresaId}/notificaciones`;
  }

  async function cerrarSesion() {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error(
        "No se pudo cerrar la sesión:",
        error
      );
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80 sm:px-6">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-sm shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                  NDI AI
                </p>

                <span className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 sm:inline-flex">
                  Workspace
                </span>
              </div>

              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[150px] truncate font-medium text-zinc-700 dark:text-zinc-300 sm:max-w-[240px]">
                  {nombreWorkspace}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">
                  /
                </span>
                <span className="hidden truncate sm:inline">
                  {tituloPanel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                aria-label={`Tema: ${opcionTemaActual.nombre}`}
                title={`Tema: ${opcionTemaActual.nombre}`}
                onClick={abrirMenuTema}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <IconoTemaActual className="h-[18px] w-[18px]" />
              </button>

              {temaAbierto && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar selector de tema"
                    onClick={() => setTemaAbierto(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50">
                    <div className="px-3 pb-2 pt-2">
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        Apariencia
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Elegí cómo querés ver NDI AI.
                      </p>
                    </div>

                    <div className="space-y-1">
                      {OPCIONES_TEMA.map(
                        ({
                          valor,
                          nombre,
                          descripcion,
                          icono: Icono,
                        }) => {
                          const seleccionado =
                            theme === valor;

                          return (
                            <button
                              key={valor}
                              type="button"
                              onClick={() =>
                                seleccionarTema(valor)
                              }
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                seleccionado
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                              }`}
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  seleccionado
                                    ? "bg-blue-500/10"
                                    : "bg-zinc-100 dark:bg-zinc-900"
                                }`}
                              >
                                <Icono className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {nombre}
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                  {descripcion}
                                </p>
                              </div>

                              {seleccionado && (
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Notificaciones"
                onClick={abrirMenu}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <Bell className="h-[18px] w-[18px]" />

                {notificacionesNoLeidas.length > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                    {notificacionesNoLeidas.length > 99
                      ? "99+"
                      : notificacionesNoLeidas.length}
                  </span>
                )}
              </button>

              {menuAbierto && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar notificaciones"
                    onClick={() => setMenuAbierto(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="fixed left-3 right-3 top-[84px] z-50 max-h-[calc(100dvh-100px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[min(92vw,390px)] sm:max-h-none">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-white">
                          Notificaciones
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {notificacionesNoLeidas.length === 0
                            ? "No tenés notificaciones nuevas"
                            : `${notificacionesNoLeidas.length} sin leer`}
                        </p>
                      </div>

                      {notificacionesNoLeidas.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            void marcarTodoComoLeido()
                          }
                          disabled={procesando}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-500 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400"
                        >
                          <CheckCheck className="h-4 w-4" />

                          {procesando
                            ? "Actualizando..."
                            : "Marcar leídas"}
                        </button>
                      )}
                    </div>

                    {notificacionesRecientes.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <Bell className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />

                        <p className="mt-3 text-sm font-medium text-zinc-950 dark:text-white">
                          Todavía no hay notificaciones
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          La actividad importante aparecerá acá.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[calc(100dvh-225px)] overflow-y-auto overscroll-contain sm:max-h-[420px]">
                        {notificacionesRecientes.map(
                          (notificacion) => {
                            const Icono =
                              obtenerIcono(
                                notificacion.tipo
                              );

                            return (
                              <button
                                key={`${notificacion.empresaId}-${notificacion.id}`}
                                type="button"
                                onClick={() =>
                                  void marcarComoLeida(
                                    notificacion
                                  )
                                }
                                className="flex w-full gap-3 border-b border-zinc-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/70"
                              >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
                                  <Icono className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-white">
                                      {notificacion.titulo ||
                                        "Notificación"}
                                    </p>

                                    {!notificacion.leida && (
                                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                    )}
                                  </div>

                                  <p className="mt-1 text-[11px] font-medium text-blue-500 dark:text-blue-400">
                                    {notificacion.empresaNombre}
                                  </p>

                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                    {notificacion.descripcion ||
                                      "Nueva actividad registrada."}
                                  </p>

                                  <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-600">
                                    {formatearFecha(
                                      notificacion.createdAt ||
                                        notificacion.updatedAt
                                    )}
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {empresaActualId && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuAbierto(false);

                          window.location.href =
                            `/empresas/${empresaActualId}/notificaciones`;
                        }}
                        className="w-full border-t border-zinc-200 px-4 py-3 text-center text-sm font-medium text-blue-500 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-900"
                      >
                        Ver todas las notificaciones
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label="Abrir menú del negocio"
              title="Menú"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent(
                    "ndi-ai:open-mobile-sidebar"
                  )
                );
                setTemaAbierto(false);
                setMenuAbierto(false);
                setPerfilAbierto(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white md:hidden"
            >
              <Menu className="h-[19px] w-[19px]" />
            </button>

            <div className="relative ml-0 md:ml-1">
              <button
                type="button"
                aria-label="Abrir menú de perfil"
                aria-expanded={perfilAbierto}
                onClick={abrirMenuPerfil}
                className="group flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white py-1.5 pl-1.5 pr-2 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                  {inicialUsuario}
                </div>

                <div className="hidden min-w-0 text-left md:block">
                  <p className="max-w-36 truncate text-xs font-semibold text-zinc-950 dark:text-white lg:max-w-44">
                    {nombreUsuario}
                  </p>
                  <p className="mt-0.5 max-w-36 truncate text-[10px] font-medium text-zinc-500 lg:max-w-44">
                    {etiquetaRol}
                  </p>
                </div>

                <ChevronDown
                  className={`hidden h-4 w-4 text-zinc-400 transition-transform md:block ${
                    perfilAbierto ? "rotate-180" : ""
                  }`}
                />
              </button>

              {perfilAbierto && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar menú de perfil"
                    onClick={() => setPerfilAbierto(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 z-50 mt-3 w-[min(88vw,280px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50">
                    <div className="rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
                          {inicialUsuario}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                            {nombreUsuario}
                          </p>
                          {emailUsuario && (
                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                              {emailUsuario}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
                        <span className="text-zinc-500">
                          Rol actual
                        </span>
                        <span className="rounded-lg bg-blue-500/10 px-2 py-1 font-semibold text-blue-600 dark:text-blue-400">
                          {etiquetaRol}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void cerrarSesion()}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed right-4 top-24 z-[70] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-blue-500/30 bg-white shadow-2xl shadow-black/10 dark:bg-zinc-950 dark:shadow-black/60">
          <div className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bell className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                {toast.titulo}
              </p>

              <p className="mt-1 text-xs font-medium text-blue-500 dark:text-blue-400">
                {toast.empresaNombre}
              </p>

              <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
                {toast.mensaje}
              </p>
            </div>

            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => setToast(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function obtenerIcono(
  tipo?: TipoNotificacion
): ComponentType<{ className?: string }> {
  if (tipo === "mensaje") {
    return MessageCircle;
  }

  if (tipo === "humano") {
    return UserRound;
  }

  if (tipo === "lead") {
    return Sparkles;
  }

  if (tipo === "plan") {
    return CircleAlert;
  }

  return Bell;
}

function formatearFecha(timestamp?: Timestamp) {
  if (!timestamp) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}