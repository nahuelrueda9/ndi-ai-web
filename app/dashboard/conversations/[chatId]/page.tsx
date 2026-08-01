"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Mensaje = {
  id: string;
  role: "user" | "assistant";
  content: string;
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: Timestamp;
};

type Conversacion = {
  ultimoMensaje?: string;
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  estado?: "abierta" | "cerrada";
  etiquetas?: string[];
  puntuacionLead?: number;
  nivelInteres?: string;
  telefono?: string;
  email?: string;
};

export default function ConversationPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const parametroChatId = params.chatId;
  const chatId = Array.isArray(parametroChatId)
    ? parametroChatId[0]
    : parametroChatId;

  const empresaId = searchParams.get("empresaId") ?? "";

  const [conversacion, setConversacion] =
    useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const finalMensajesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatId || !empresaId) {
      setConversacion(null);
      setMensajes([]);
      setError(
        !empresaId
          ? "Falta identificar la empresa de esta conversación."
          : "Falta identificar la conversación."
      );
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    const referenciaConversacion = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId
    );

    const cancelarConversacion = onSnapshot(
      referenciaConversacion,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConversacion(null);
          setError("La conversación no existe.");
          setCargando(false);
          return;
        }

        setConversacion(snapshot.data() as Conversacion);
        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar conversación:",
          firebaseError
        );

        setConversacion(null);
        setError("No se pudo cargar la conversación.");
        setCargando(false);
      }
    );

    const mensajesQuery = query(
      collection(referenciaConversacion, "messages"),
      orderBy("createdAt", "asc")
    );

    const cancelarMensajes = onSnapshot(
      mensajesQuery,
      (snapshot) => {
        const mensajesActualizados = snapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        ) as Mensaje[];

        setMensajes(mensajesActualizados);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar mensajes:",
          firebaseError
        );
        setError("No se pudieron cargar los mensajes.");
      }
    );

    return () => {
      cancelarConversacion();
      cancelarMensajes();
    };
  }, [chatId, empresaId]);

  useEffect(() => {
    finalMensajesRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [mensajes]);

  async function enviarRespuesta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const mensajeLimpio = respuesta.trim();

    if (
      !chatId ||
      !empresaId ||
      !mensajeLimpio ||
      enviando
    ) {
      return;
    }

    setEnviando(true);

    try {
      const referenciaConversacion = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId
      );

      await updateDoc(referenciaConversacion, {
        humanoActivo: true,
        atendidoPor: "humano",
        estado: "abierta",
        ultimoMensaje: mensajeLimpio,
        updatedAt: serverTimestamp(),
      });

      await addDoc(
        collection(referenciaConversacion, "messages"),
        {
          role: "assistant",
          content: mensajeLimpio,
          enviadoPor: "humano",
          createdAt: serverTimestamp(),
        }
      );

      setRespuesta("");
    } catch (firebaseError) {
      console.error(
        "Error al enviar respuesta:",
        firebaseError
      );

      alert("No se pudo enviar la respuesta.");
    } finally {
      setEnviando(false);
    }
  }

  async function devolverConversacionALaIA() {
    if (!chatId || !empresaId) return;

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "conversations",
          chatId
        ),
        {
          humanoActivo: false,
          atendidoPor: "ia",
          updatedAt: serverTimestamp(),
        }
      );
    } catch (firebaseError) {
      console.error(
        "Error al devolver conversación a la IA:",
        firebaseError
      );

      alert("No se pudo devolver la conversación a la IA.");
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        Cargando conversación...
      </main>
    );
  }

  if (error || !conversacion) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <p className="text-red-400">
          {error || "No se encontró la conversación."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex h-[calc(100vh-48px)] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <h1 className="text-lg font-semibold">
                Conversación
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Estado: {conversacion.estado ?? "abierta"}
              </p>
            </div>

            <span
              className={[
                "rounded-full px-3 py-1 text-xs",
                conversacion.humanoActivo
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-blue-500/10 text-blue-300",
              ].join(" ")}
            >
              {conversacion.humanoActivo
                ? "Atendida por humano"
                : "Atendida por IA"}
            </span>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {mensajes.length === 0 && (
              <p className="text-sm text-zinc-500">
                No hay mensajes.
              </p>
            )}

            {mensajes.map((mensaje) => {
              const esCliente = mensaje.role === "user";
              const esHumano =
                mensaje.enviadoPor === "humano";

              return (
                <div
                  key={mensaje.id}
                  className={`flex ${
                    esCliente
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%]">
                    {!esCliente && (
                      <p className="mb-1 px-1 text-xs text-zinc-500">
                        {esHumano ? "Soporte" : "IA"}
                      </p>
                    )}

                    <div
                      className={[
                        "whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                        esCliente
                          ? "rounded-br-md bg-blue-600 text-white"
                          : esHumano
                            ? "rounded-bl-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                            : "rounded-bl-md bg-zinc-800 text-zinc-200",
                      ].join(" ")}
                    >
                      {mensaje.content}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={finalMensajesRef} />
          </div>

          <form
            onSubmit={enviarRespuesta}
            className="border-t border-zinc-800 p-4"
          >
            <div className="flex gap-3">
              <textarea
                value={respuesta}
                onChange={(evento) =>
                  setRespuesta(evento.target.value)
                }
                placeholder="Escribí una respuesta..."
                rows={2}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!respuesta.trim() || enviando}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="font-semibold">Control del chat</h2>

            <p className="mt-3 text-sm text-zinc-400">
              Al responder manualmente, la IA queda pausada.
            </p>

            {conversacion.humanoActivo && (
              <button
                type="button"
                onClick={devolverConversacionALaIA}
                className="mt-4 w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/20"
              >
                Devolver conversación a la IA
              </button>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="font-semibold">Lead</h2>

            <div className="mt-4">
              <p className="text-3xl font-semibold">
                {conversacion.puntuacionLead ?? 0}
                <span className="text-base text-zinc-500">
                  /100
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Nivel:{" "}
                {conversacion.nivelInteres ?? "sin definir"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="font-semibold">Contacto</h2>

            <div className="mt-4 space-y-2 text-sm text-zinc-400">
              <p>
                Teléfono:{" "}
                {conversacion.telefono ?? "No disponible"}
              </p>

              <p>
                Email:{" "}
                {conversacion.email ?? "No disponible"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="font-semibold">Etiquetas</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {(conversacion.etiquetas ?? []).map(
                (etiqueta) => (
                  <span
                    key={etiqueta}
                    className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                  >
                    {etiqueta}
                  </span>
                )
              )}

              {!conversacion.etiquetas?.length && (
                <p className="text-sm text-zinc-500">
                  Sin etiquetas.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}