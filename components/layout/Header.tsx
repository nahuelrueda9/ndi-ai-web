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
  CheckCheck,
  CircleAlert,
  MessageCircle,
  Sparkles,
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

export default function Header() {
  const params = useParams();

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

  const tituloPanel =
    rolActual === "operador"
      ? "Panel de operador"
      : rolActual === "supervisor"
      ? "Panel de supervisión"
      : "Panel de administración";

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
    void solicitarPermisoNotificaciones();
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
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              NDI AI
            </p>

            <h1 className="font-semibold text-white">
              {tituloPanel}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                aria-label="Notificaciones"
                onClick={abrirMenu}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              >
                <Bell className="h-5 w-5" />

                {notificacionesNoLeidas.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-zinc-950">
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

                  <div className="absolute right-0 z-50 mt-3 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
                      <div>
                        <p className="font-semibold text-white">
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
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Bell className="mx-auto h-8 w-8 text-zinc-700" />

                        <p className="mt-3 text-sm font-medium text-white">
                          Todavía no hay notificaciones
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          La actividad importante aparecerá acá.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto">
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
                                className="flex w-full gap-3 border-b border-zinc-900 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-900/70"
                              >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                  <Icono className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-medium text-white">
                                      {notificacion.titulo ||
                                        "Notificación"}
                                    </p>

                                    {!notificacion.leida && (
                                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                    )}
                                  </div>

                                  <p className="mt-1 text-[11px] font-medium text-blue-400">
                                    {
                                      notificacion.empresaNombre
                                    }
                                  </p>

                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                                    {notificacion.descripcion ||
                                      "Nueva actividad registrada."}
                                  </p>

                                  <p className="mt-2 text-[11px] text-zinc-600">
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
                        className="w-full border-t border-zinc-800 px-4 py-3 text-center text-sm font-medium text-blue-400 transition hover:bg-zinc-900"
                      >
                        Ver todas las notificaciones
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-48 truncate text-sm font-medium text-white">
                  {user?.displayName ||
                    user?.email ||
                    "Usuario"}
                </p>

                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  <span className="font-medium text-blue-400">
                    {rolActual
                      ? NOMBRE_ROL[rolActual]
                      : empresas.length > 0
                      ? `${empresas.length} empresa${
                          empresas.length === 1
                            ? ""
                            : "s"
                        }`
                      : "Usuario"}
                  </span>

                  <span className="text-zinc-700">
                    •
                  </span>

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="font-medium text-red-400 transition hover:text-red-300"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed right-4 top-24 z-[70] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-blue-500/30 bg-zinc-950 shadow-2xl shadow-black/60">
          <div className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bell className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                {toast.titulo}
              </p>

              <p className="mt-1 text-xs font-medium text-blue-400">
                {toast.empresaNombre}
              </p>

              <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-400">
                {toast.mensaje}
              </p>
            </div>

            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => setToast(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
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