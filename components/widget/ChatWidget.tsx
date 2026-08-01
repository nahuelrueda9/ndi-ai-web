"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { MessageCircle, Send, X } from "lucide-react";

import { db } from "@/lib/firebase";

type WidgetConfig = {
  id: string;
  nombre: string;
  logo?: string;
  color?: string;
  saludo?: string;
  posicion?: "left" | "right";
  avatar?: string;
  online?: boolean;
};

type Mensaje = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetProps = {
  empresaId: string;
};

export default function ChatWidget({
  empresaId,
}: ChatWidgetProps) {
  const [config, setConfig] =
    useState<WidgetConfig | null>(null);

  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [error, setError] = useState("");

  const visitanteId = useMemo(() => {
    if (typeof window === "undefined") return "";

    const clave = `ndi-visitante-${empresaId}`;
    const existente = localStorage.getItem(clave);

    if (existente) return existente;

    const nuevo = `visitante-${crypto.randomUUID()}`;
    localStorage.setItem(clave, nuevo);

    return nuevo;
  }, [empresaId]);

  const chatId = useMemo(() => {
    if (!visitanteId) return "";

    return visitanteId;
  }, [visitanteId]);

  useEffect(() => {
    async function cargarConfig() {
      try {
        const respuesta = await fetch(
          `/api/widget/config?empresaId=${encodeURIComponent(
            empresaId
          )}`
        );

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            data?.error || "No se pudo cargar el widget."
          );
        }

        setConfig(data);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Error al cargar el widget."
        );
      }
    }

    cargarConfig();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId || !chatId) return;

    const mensajesQuery = query(
      collection(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId,
        "messages"
      ),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(mensajesQuery, (snapshot) => {
      setMensajes(
        snapshot.docs.map((documento) => {
          const data = documento.data();

          return {
            id: documento.id,
            role: data.role,
            content: data.content || "",
          };
        })
      );
    });
  }, [chatId, empresaId]);

  async function enviarMensaje(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    const contenido = texto.trim();

    if (!contenido || enviando || !chatId) return;

    setEnviando(true);
    setError("");

    try {
      const conversacionRef = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId
      );

      await setDoc(
        conversacionRef,
        {
          visitanteId,
          estado: "abierta",
          atendidoPor: "ia",
          humanoActivo: false,
          ultimoMensaje: contenido,
          ultimoRol: "user",
          cantidadMensajes: increment(1),
          canal: "web",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      await addDoc(
        collection(
          db,
          "companies",
          empresaId,
          "conversations",
          chatId,
          "messages"
        ),
        {
          role: "user",
          content: contenido,
          enviadoPor: "cliente",
          createdAt: serverTimestamp(),
        }
      );

      setTexto("");

      const respuestaIA = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  mensaje: contenido,
  empresaId,
  chatId,
  visitanteId,
  empresa: config,
  historial: mensajes.map((mensaje) => ({
    role: mensaje.role,
    content: mensaje.content,
  })),
})
      });

      const data = await respuestaIA.json();

      if (!respuestaIA.ok) {
        throw new Error(
          data?.error || "La IA no pudo responder."
        );
      }

      const respuestaTexto =
        data?.respuesta ||
        data?.resultado ||
        data?.message ||
        "";

      if (respuestaTexto) {
        await addDoc(
          collection(
            db,
            "companies",
            empresaId,
            "conversations",
            chatId,
            "messages"
          ),
          {
            role: "assistant",
            content: respuestaTexto,
            enviadoPor: "ia",
            createdAt: serverTimestamp(),
          }
        );

        await updateDoc(conversacionRef, {
          ultimoMensaje: respuestaTexto,
          ultimoRol: "assistant",
          cantidadMensajes: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (errorDesconocido) {
      console.error(errorDesconocido);

      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo enviar el mensaje."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!config) return null;

  const posicion =
    config.posicion === "left" ? "left-5" : "right-5";

  const color = config.color || "#2563eb";

  return (
    <div className={`fixed bottom-5 ${posicion} z-50`}>
      {abierto && (
        <div className="mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <header
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/15">
                {config.logo ? (
                  <img
                    src={config.logo}
                    alt={config.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MessageCircle size={18} />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {config.nombre || "Asistente"}
                </p>

                <p className="text-xs text-white/75">
                  {config.online === false
                    ? "Fuera de línea"
                    : "En línea"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-lg p-2 transition hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {mensajes.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-sm leading-6 text-zinc-200">
                  {config.saludo ||
                    "¡Hola! ¿En qué podemos ayudarte?"}
                </p>
              </div>
            )}

            {mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={
                  mensaje.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    mensaje.role === "user"
                      ? "max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-white"
                      : "max-w-[82%] rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200"
                  }
                  style={
                    mensaje.role === "user"
                      ? { backgroundColor: color }
                      : undefined
                  }
                >
                  <p className="whitespace-pre-wrap break-words">
                    {mensaje.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 pb-2">
              <p className="text-xs text-red-400">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={enviarMensaje}
            className="border-t border-zinc-800 p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={texto}
                onChange={(evento) =>
                  setTexto(evento.target.value)
                }
                rows={1}
                maxLength={1000}
                placeholder="Escribí tu mensaje..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: color }}
              >
                <Send size={17} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105"
        style={{ backgroundColor: color }}
      >
        {abierto ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}