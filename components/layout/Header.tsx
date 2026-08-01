"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bot,
  CheckCheck,
  MessageCircle,
  X,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

interface Empresa {
  id: string;
  nombre: string;
}

interface Conversacion {
  id: string;
  empresaId: string;
  empresaNombre: string;
  titulo?: string;
  ultimoMensaje?: string;
  visitanteId?: string;
  humanoActivo?: boolean;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

interface ToastNotification {
  id: string;
  empresaNombre: string;
  mensaje: string;
}

const STORAGE_KEY = "ndi-ai-notificaciones-vistas";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [ultimaLectura, setUltimaLectura] = useState<number>(0);

  const conversacionesPorEmpresaRef = useRef<
    Record<string, Conversacion[]>
  >({});
  const unsubscribesRef = useRef<Record<string, () => void>>({});
  const conversacionesConocidasRef = useRef<Record<string, number>>({});
  const primeraCargaRef = useRef(true);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    setUltimaLectura(guardado ? Number(guardado) : Date.now());

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const combinarConversaciones = () => {
      const todas = Object.values(conversacionesPorEmpresaRef.current).flat();

      todas.sort((a, b) => {
        const fechaA =
          a.updatedAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const fechaB =
          b.updatedAt?.toMillis() || b.createdAt?.toMillis() || 0;

        return fechaB - fechaA;
      });

      setConversaciones(todas);
    };

    const unsubscribeEmpresas = onSnapshot(
      empresasQuery,
      (snapshot) => {
        const nuevasEmpresas = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...(documento.data() as Omit<Empresa, "id">),
        }));

        setEmpresas(nuevasEmpresas);

        const idsActuales = new Set(
          nuevasEmpresas.map((empresa) => empresa.id)
        );

        Object.entries(unsubscribesRef.current).forEach(
          ([empresaId, unsubscribe]) => {
            if (!idsActuales.has(empresaId)) {
              unsubscribe();
              delete unsubscribesRef.current[empresaId];
              delete conversacionesPorEmpresaRef.current[empresaId];
            }
          }
        );

        nuevasEmpresas.forEach((empresa) => {
          if (unsubscribesRef.current[empresa.id]) return;

          const conversacionesQuery = query(
            collection(db, "companies", empresa.id, "conversations"),
            orderBy("updatedAt", "desc")
          );

          unsubscribesRef.current[empresa.id] = onSnapshot(
            conversacionesQuery,
            (conversacionesSnapshot) => {
              const nuevasConversaciones =
                conversacionesSnapshot.docs.map((documento) => {
                  const data = documento.data() as Omit<
                    Conversacion,
                    "id" | "empresaId" | "empresaNombre"
                  >;

                  return {
                    id: documento.id,
                    empresaId: empresa.id,
                    empresaNombre: empresa.nombre,
                    ...data,
                  };
                });

              conversacionesPorEmpresaRef.current[empresa.id] =
                nuevasConversaciones;

              nuevasConversaciones.forEach((conversacion) => {
                const clave = `${conversacion.empresaId}-${conversacion.id}`;
                const fechaActual =
                  conversacion.updatedAt?.toMillis() ||
                  conversacion.createdAt?.toMillis() ||
                  0;
                const fechaAnterior =
                  conversacionesConocidasRef.current[clave] || 0;

                if (
                  !primeraCargaRef.current &&
                  fechaAnterior > 0 &&
                  fechaActual > fechaAnterior
                ) {
                  mostrarNuevaNotificacion(conversacion);
                }

                conversacionesConocidasRef.current[clave] = fechaActual;
              });

              combinarConversaciones();

              window.setTimeout(() => {
                primeraCargaRef.current = false;
              }, 700);
            },
            (error) => {
              console.error(
                `Error al escuchar conversaciones de ${empresa.nombre}:`,
                error
              );
            }
          );
        });

        if (nuevasEmpresas.length === 0) {
          setConversaciones([]);
          conversacionesPorEmpresaRef.current = {};
          primeraCargaRef.current = false;
        }
      },
      (error) => {
        console.error("Error al cargar empresas en el header:", error);
      }
    );

    return () => {
      unsubscribeEmpresas();

      Object.values(unsubscribesRef.current).forEach((unsubscribe) =>
        unsubscribe()
      );

      unsubscribesRef.current = {};
      conversacionesPorEmpresaRef.current = {};
      conversacionesConocidasRef.current = {};
      primeraCargaRef.current = true;
    };
  }, [user]);

  const notificacionesNoLeidas = useMemo(
    () =>
      conversaciones.filter((conversacion) => {
        const fecha =
          conversacion.updatedAt?.toMillis() ||
          conversacion.createdAt?.toMillis() ||
          0;

        return fecha > ultimaLectura;
      }),
    [conversaciones, ultimaLectura]
  );

  const conversacionesRecientes = conversaciones.slice(0, 6);

  function mostrarNuevaNotificacion(conversacion: Conversacion) {
    reproducirSonido();

    const nuevaNotificacion = {
      id: `${conversacion.empresaId}-${conversacion.id}-${Date.now()}`,
      empresaNombre: conversacion.empresaNombre,
      mensaje:
        conversacion.ultimoMensaje ||
        conversacion.titulo ||
        "Se recibió un nuevo mensaje.",
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
      const navegador = new Notification("Nuevo mensaje en NDI AI", {
        body: `${conversacion.empresaNombre}: ${nuevaNotificacion.mensaje}`,
      });

      navegador.onclick = () => {
        window.focus();
        window.location.href = `/empresas/${conversacion.empresaId}/conversaciones/${conversacion.id}`;
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

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        940,
        audioContext.currentTime + 0.14
      );

      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
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
      oscillator.stop(audioContext.currentTime + 0.23);
    } catch (error) {
      console.error("No se pudo reproducir el sonido:", error);
    }
  }

  function marcarTodoComoLeido() {
    const ahora = Date.now();

    window.localStorage.setItem(STORAGE_KEY, String(ahora));
    setUltimaLectura(ahora);
  }

  async function solicitarPermisoNotificaciones() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  function abrirMenu() {
    setMenuAbierto((estadoActual) => !estadoActual);
    solicitarPermisoNotificaciones();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">NDI AI</p>
            <h1 className="font-semibold text-white">
              Panel de administración
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

                  <div className="absolute right-0 z-50 mt-3 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
                      <div>
                        <p className="font-semibold text-white">
                          Notificaciones
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {notificacionesNoLeidas.length === 0
                            ? "No tenés mensajes nuevos"
                            : `${notificacionesNoLeidas.length} sin leer`}
                        </p>
                      </div>

                      {notificacionesNoLeidas.length > 0 && (
                        <button
                          type="button"
                          onClick={marcarTodoComoLeido}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/10"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Marcar leídas
                        </button>
                      )}
                    </div>

                    {conversacionesRecientes.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <MessageCircle className="mx-auto h-8 w-8 text-zinc-700" />
                        <p className="mt-3 text-sm font-medium text-white">
                          Todavía no hay conversaciones
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Los mensajes nuevos aparecerán acá.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto">
                        {conversacionesRecientes.map((conversacion) => {
                          const fecha =
                            conversacion.updatedAt?.toMillis() ||
                            conversacion.createdAt?.toMillis() ||
                            0;
                          const sinLeer = fecha > ultimaLectura;

                          return (
                            <button
                              key={`${conversacion.empresaId}-${conversacion.id}`}
                              type="button"
                              onClick={() => {
                                marcarTodoComoLeido();
                                window.location.href = `/empresas/${conversacion.empresaId}/conversaciones/${conversacion.id}`;
                              }}
                              className="flex w-full gap-3 border-b border-zinc-900 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-900/70"
                            >
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                <MessageCircle className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-medium text-white">
                                    {conversacion.empresaNombre}
                                  </p>

                                  {sinLeer && (
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                  )}
                                </div>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                                  {conversacion.ultimoMensaje ||
                                    conversacion.titulo ||
                                    "Nueva conversación"}
                                </p>

                                <p className="mt-2 text-[11px] text-zinc-600">
                                  {formatearFecha(
                                    conversacion.updatedAt ||
                                      conversacion.createdAt
                                  )}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">
                  Agente activo
                </p>
                <p className="text-xs text-zinc-500">
                  {empresas.length > 0
                    ? `${empresas.length} agente${
                        empresas.length === 1 ? "" : "s"
                      } disponible${empresas.length === 1 ? "" : "s"}`
                    : "Listo para configurar"}
                </p>
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
                Nuevo mensaje
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

function formatearFecha(timestamp?: Timestamp) {
  if (!timestamp) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}