"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { registrarActividad } from "@/lib/chat/activityService";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import CustomerProfilePanel from "@/components/chat/CustomerProfilePanel";
import CustomerNotesPanel from "@/components/chat/CustomerNotesPanel";
import CustomerTagsPanel from "@/components/chat/CustomerTagsPanel";
import CustomerActivityPanel from "@/components/chat/CustomerActivityPanel";
import AICopilot from "@/components/chat/AICopilot";
import AISummaryCard from "@/components/chat/AISummaryCard";

type Mensaje = {
  id: string;
  role: "user" | "assistant";
  content: string;
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: Timestamp;
};

type MemoriaCliente = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  ultimaActualizacion?: string;
};

type Conversacion = {
  id: string;
  empresaId: string;
  empresaNombre?: string;
  visitanteId?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  ultimoMensaje?: string;
  cantidadMensajes?: number;

  tags?: string[];

  memoriaCliente?: MemoriaCliente;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type ConversationChatPanelProps = {
  empresaId: string;
  chatId: string;
  empresaNombre?: string;
  onAbrirConversacion?: () => void;
};

export default function ConversationChatPanel({
  empresaId,
  chatId,
  empresaNombre,
  onAbrirConversacion,
}: ConversationChatPanelProps) {
  const mensajesFinalRef = useRef<HTMLDivElement | null>(null);

  const [conversacion, setConversacion] =
    useState<Conversacion | null>(null);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [respuesta, setRespuesta] = useState("");

  const [cargandoConversacion, setCargandoConversacion] =
    useState(true);

  const [cargandoMensajes, setCargandoMensajes] =
    useState(true);

  const [enviando, setEnviando] = useState(false);
  const [cambiandoAtencion, setCambiandoAtencion] =
    useState(false);

  const [cambiandoEstado, setCambiandoEstado] =
    useState(false);

  const [guardandoMemoria, setGuardandoMemoria] =
    useState(false);

  const [error, setError] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");

  useEffect(() => {
    setConversacion(null);
    setMensajes([]);
    setRespuesta("");
    setError("");
    setMensajeAccion("");
    setCargandoConversacion(true);
    setCargandoMensajes(true);

    if (!empresaId || !chatId) {
      setError("No se encontró la empresa o la conversación.");
      setCargandoConversacion(false);
      setCargandoMensajes(false);
      return;
    }

    const conversacionReferencia = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId
    );

    const cancelarConversacion = onSnapshot(
      conversacionReferencia,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConversacion(null);
          setError("La conversación ya no existe.");
          setCargandoConversacion(false);
          return;
        }

        const datos = snapshot.data();

        setConversacion({
          id: snapshot.id,
          empresaId,
          empresaNombre,
          visitanteId: datos.visitanteId || "",
          estado: datos.estado || "abierta",
          atendidoPor: datos.atendidoPor || "ia",
          humanoActivo: datos.humanoActivo === true,

          tags: Array.isArray(datos.tags)
           ? datos.tags 
           : [],

          ultimoMensaje: datos.ultimoMensaje || "",
          cantidadMensajes:
  typeof datos.cantidadMensajes === "number"
    ? datos.cantidadMensajes
    : 0,

memoriaCliente:
  datos.memoriaCliente &&
  typeof datos.memoriaCliente === "object"
    ? {
        nombre: datos.memoriaCliente.nombre || "",
        empresa: datos.memoriaCliente.empresa || "",
        email: datos.memoriaCliente.email || "",
        telefono: datos.memoriaCliente.telefono || "",
        ciudad: datos.memoriaCliente.ciudad || "",
        ultimaActualizacion:
          datos.memoriaCliente.ultimaActualizacion || "",
      }
    : {},

createdAt: datos.createdAt,
updatedAt: datos.updatedAt,
        });

        setCargandoConversacion(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar la conversación:",
          firebaseError
        );

        setError("No se pudo cargar la conversación.");
        setCargandoConversacion(false);
      }
    );

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

    const cancelarMensajes = onSnapshot(
      mensajesQuery,
      (snapshot) => {
        const lista: Mensaje[] = snapshot.docs.map(
          (documento) => {
            const datos = documento.data();

            return {
              id: documento.id,
              role: datos.role,
              content: datos.content || "",
              enviadoPor: datos.enviadoPor,
              createdAt: datos.createdAt,
            };
          }
        );

        setMensajes(lista);
        setCargandoMensajes(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar los mensajes:",
          firebaseError
        );

        setError("No se pudieron cargar los mensajes.");
        setCargandoMensajes(false);
      }
    );

    return () => {
      cancelarConversacion();
      cancelarMensajes();
    };
  }, [chatId, empresaId, empresaNombre]);

  useEffect(() => {
    if (cargandoMensajes) return;

    mensajesFinalRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [cargandoMensajes, mensajes]);

  const humanoActivo =
    conversacion?.humanoActivo === true ||
    conversacion?.atendidoPor === "humano";

  const conversacionCerrada =
    conversacion?.estado === "cerrada";

  async function cambiarModoAtencion() {
    if (
      !conversacion ||
      cambiandoAtencion ||
      cambiandoEstado
    ) {
      return;
    }

    setCambiandoAtencion(true);
    setError("");
    setMensajeAccion("");

    try {
      const conversacionReferencia = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId
      );

      await updateDoc(conversacionReferencia, {
        atendidoPor: humanoActivo ? "ia" : "humano",
        humanoActivo: !humanoActivo,
        estado: "abierta",
        updatedAt: serverTimestamp(),
      });

      await registrarActividad({
        empresaId,
        chatId,
        tipo: humanoActivo ? "ia" : "humano",
        titulo: humanoActivo
          ? "Conversación devuelta a la IA"
          : "Conversación tomada por un operador",
        descripcion: humanoActivo
          ? "La IA volvió a atender esta conversación."
          : "Un operador comenzó a atender esta conversación.",
        icono: humanoActivo ? "🤖" : "👤",
      });

      setMensajeAccion(
        humanoActivo
          ? "La IA volvió a tomar la conversación."
          : "Ahora estás atendiendo esta conversación."
      );
    } catch (firebaseError) {
      console.error(
        "Error al cambiar el modo de atención:",
        firebaseError
      );

      setError(
        "No se pudo cambiar el modo de atención."
      );
    } finally {
      setCambiandoAtencion(false);
    }
  }

  async function cambiarEstadoConversacion() {
    if (
      !conversacion ||
      cambiandoEstado ||
      cambiandoAtencion
    ) {
      return;
    }

    const nuevoEstado = conversacionCerrada
      ? "abierta"
      : "cerrada";

    setCambiandoEstado(true);
    setError("");
    setMensajeAccion("");

    try {
      const conversacionReferencia = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId
      );

      await updateDoc(conversacionReferencia, {
        estado: nuevoEstado,
        updatedAt: serverTimestamp(),
      });

      await registrarActividad({
        empresaId,
        chatId,
        tipo: "estado",
        titulo:
          nuevoEstado === "cerrada"
            ? "Conversación cerrada"
            : "Conversación reabierta",
        descripcion:
          nuevoEstado === "cerrada"
            ? "Un operador cerró la conversación."
            : "Un operador reabrió la conversación.",
        icono: nuevoEstado === "cerrada" ? "🔒" : "🔓",
      });

      setMensajeAccion(
        nuevoEstado === "cerrada"
          ? "La conversación fue cerrada."
          : "La conversación fue reabierta."
      );
    } catch (firebaseError) {
      console.error(
        "Error al cambiar el estado de la conversación:",
        firebaseError
      );

      setError(
        "No se pudo cambiar el estado de la conversación."
      );
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function guardarMemoriaCliente(
    memoria: MemoriaCliente
  ) {
    if (!conversacion || guardandoMemoria) {
      return;
    }

    setGuardandoMemoria(true);
    setError("");
    setMensajeAccion("");

    const memoriaLimpia: MemoriaCliente = {
      nombre: memoria.nombre?.trim() || "",
      empresa: memoria.empresa?.trim() || "",
      email: memoria.email?.trim() || "",
      telefono: memoria.telefono?.trim() || "",
      ciudad: memoria.ciudad?.trim() || "",
      ultimaActualizacion: new Date().toISOString(),
    };

    try {
      const conversacionReferencia = doc(
        db,
        "companies",
        empresaId,
        "conversations",
        chatId
      );

      await updateDoc(conversacionReferencia, {
        memoriaCliente: memoriaLimpia,
        updatedAt: serverTimestamp(),
      });

      const tieneInformacion = Boolean(
        memoriaLimpia.nombre ||
          memoriaLimpia.empresa ||
          memoriaLimpia.email ||
          memoriaLimpia.telefono ||
          memoriaLimpia.ciudad
      );

      await registrarActividad({
        empresaId,
        chatId,
        tipo: "memoria",
        titulo: tieneInformacion
          ? "Información del cliente actualizada"
          : "Información del cliente eliminada",
        descripcion: tieneInformacion
          ? "Se editaron los datos guardados del cliente."
          : "Se eliminaron los datos guardados del cliente.",
        icono: "🧠",
      });

      setMensajeAccion(
        "La información del cliente fue actualizada."
      );
    } catch (firebaseError) {
      console.error(
        "Error al guardar la información del cliente:",
        firebaseError
      );

      setError(
        "No se pudo guardar la información del cliente."
      );

      throw firebaseError;
    } finally {
      setGuardandoMemoria(false);
    }
  }

async function enviarRespuesta(
  evento: FormEvent<HTMLFormElement>
) {
  evento.preventDefault();

  const contenido = respuesta.trim();

  if (
    !conversacion ||
    !contenido ||
    enviando
  ) {
    return;
  }

  if (!humanoActivo) {
    setMensajeAccion("");
    setError(
      "Primero tenés que tomar la conversación para responder."
    );
    return;
  }

  if (conversacionCerrada) {
    setMensajeAccion("");
    setError(
      "La conversación está cerrada. Primero tenés que reabrirla."
    );
    return;
  }

  setEnviando(true);
  setError("");
  setMensajeAccion("");

  try {
    const mensajesReferencia = collection(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId,
      "messages"
    );

    const conversacionReferencia = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId
    );

    await addDoc(mensajesReferencia, {
      role: "assistant",
      content: contenido,
      enviadoPor: "humano",
      createdAt: serverTimestamp(),
    });

    await updateDoc(conversacionReferencia, {
      ultimoMensaje: contenido,
      ultimoRol: "assistant",
      cantidadMensajes: increment(1),
      atendidoPor: "humano",
      humanoActivo: true,
      estado: "abierta",
      updatedAt: serverTimestamp(),
    });

    await registrarActividad({
      empresaId,
      chatId,
      tipo: "humano",
      titulo: "Respuesta enviada por el operador",
      descripcion:
        contenido.length > 140
          ? `${contenido.slice(0, 140)}...`
          : contenido,
      icono: "👤",
    });

    setRespuesta("");
    setMensajeAccion("Mensaje enviado.");
  } catch (firebaseError) {
    console.error(
      "Error al enviar la respuesta:",
      firebaseError
    );

    setError(
      "No se pudo enviar el mensaje. Intentá nuevamente."
    );
  } finally {
    setEnviando(false);
  }
}

  const cargando =
    cargandoConversacion || cargandoMensajes;

  if (cargando) {
    return (
      <div className="flex min-h-[650px] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

          <p className="mt-4 font-medium text-white">
            Cargando conversación...
          </p>
        </div>
      </div>
    );
  }

  if (error && !conversacion) {
    return (
      <div className="flex min-h-[650px] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
            ⚠️
          </div>

          <h2 className="mt-5 font-semibold text-white">
            No pudimos abrir el chat
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!conversacion) {
    return null;
  }

  const nombreVisitante = obtenerNombreVisitante(
    conversacion.visitanteId
  );

  return (
    <div className="flex min-h-[650px] flex-col">
      <header className="border-b border-zinc-800 px-5 py-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <Avatar
                name={nombreVisitante}
                size="md"
              />

              <span
                className={[
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-900",
                  conversacionCerrada
                    ? "bg-zinc-600"
                    : "bg-emerald-500",
                ].join(" ")}
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-white">
                {nombreVisitante}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                {empresaNombre && (
                  <span className="truncate text-xs text-blue-400">
                    {empresaNombre}
                  </span>
                )}

                <span className="text-xs text-zinc-600">
                  {mensajes.length}{" "}
                  {mensajes.length === 1
                    ? "mensaje"
                    : "mensajes"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={
                humanoActivo
                  ? "primary"
                  : "secondary"
              }
              disabled={
                cambiandoAtencion || cambiandoEstado
              }
              onClick={cambiarModoAtencion}
            >
              {cambiandoAtencion
                ? "Cambiando..."
                : humanoActivo
                ? "Devolver a la IA"
                : "Tomar conversación"}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              disabled={
                cambiandoEstado || cambiandoAtencion
              }
              onClick={cambiarEstadoConversacion}
            >
              {cambiandoEstado
                ? "Guardando..."
                : conversacionCerrada
                ? "Reabrir"
                : "Cerrar"}
            </Button>

            {onAbrirConversacion && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onAbrirConversacion}
              >
                Ver detalle
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge
            variant={
              conversacionCerrada
                ? "default"
                : "success"
            }
          >
            {conversacionCerrada
              ? "Cerrada"
              : "Abierta"}
          </Badge>

          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-medium",
              humanoActivo
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-blue-500/10 text-blue-400",
            ].join(" ")}
          >
            {humanoActivo
              ? "Atención humana"
              : "IA activa"}
          </span>

          <span className="text-xs text-zinc-600">
            Última actividad:{" "}
            {formatearFecha(conversacion.updatedAt)}
          </span>
        </div>
      </header>

<div className="space-y-4">
  <CustomerProfilePanel
    memoria={conversacion.memoriaCliente}
  />

  <CustomerTagsPanel
    empresaId={empresaId}
    chatId={chatId}
    tags={conversacion.tags ?? []}
  />

  <CustomerNotesPanel
    empresaId={empresaId}
    chatId={chatId}
  />

  <CustomerActivityPanel
    empresaId={empresaId}
    chatId={chatId}
  />
  
  <AISummaryCard
  historial={mensajes}
/>
</div>

      {(error || mensajeAccion) && (
        <div className="border-b border-zinc-800 px-5 py-3 sm:px-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          {mensajeAccion && !error && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-300">
                {mensajeAccion}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="min-h-[420px] flex-1 overflow-y-auto bg-zinc-950/40 px-4 py-6 sm:px-6">
        {mensajes.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                💬
              </div>

              <h3 className="mt-5 font-semibold text-white">
                No hay mensajes
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Esta conversación todavía no tiene mensajes.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {mensajes.map((mensaje) => {
              const esCliente = mensaje.role === "user";
              const esHumano =
                mensaje.enviadoPor === "humano";

              const nombre = esCliente
                ? "Cliente"
                : esHumano
                ? "Operador"
                : "Agente IA";

              return (
                <div
                  key={mensaje.id}
                  className={[
                    "flex items-end gap-3",
                    esCliente
                      ? "justify-end"
                      : "justify-start",
                  ].join(" ")}
                >
                  {!esCliente && (
                    <Avatar
                      name={
                        esHumano
                          ? "Operador"
                          : "Agente IA"
                      }
                      size="sm"
                    />
                  )}

                  <div className="max-w-[85%] sm:max-w-[72%]">
                    <div
                      className={[
                        "mb-2 flex items-center gap-3",
                        esCliente
                          ? "justify-end"
                          : "justify-start",
                      ].join(" ")}
                    >
                      <p className="text-xs font-medium text-zinc-400">
                        {nombre}
                      </p>

                      <p className="text-[11px] text-zinc-600">
                        {formatearHora(
                          mensaje.createdAt
                        )}
                      </p>
                    </div>

                    <div
                      className={
                        esCliente
                          ? "rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-950/20"
                          : esHumano
                          ? "rounded-2xl rounded-bl-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-50"
                          : "rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100"
                      }
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {mensaje.content}
                      </p>
                    </div>
                  </div>

                  {esCliente && (
                    <Avatar
                      name={nombreVisitante}
                      size="sm"
                    />
                  )}
                </div>
              );
            })}

            <div ref={mensajesFinalRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={enviarRespuesta}
        className="border-t border-zinc-800 bg-zinc-950/70 p-4 sm:p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">
              Responder como operador
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {conversacionCerrada
                ? "Reabrí la conversación para responder."
                : humanoActivo
                ? "El visitante recibirá el mensaje en tiempo real."
                : "Tomá la conversación para responder como humano."}
            </p>
          </div>

          <Badge
            variant={
              humanoActivo && !conversacionCerrada
                ? "success"
                : "default"
            }
          >
            {conversacionCerrada
              ? "Chat cerrado"
              : humanoActivo
              ? "Humano activo"
              : "IA activa"}
          </Badge>
        </div>
        
<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
  <div className="flex flex-col gap-3">
    <textarea
      value={respuesta}
      onChange={(evento) =>
        setRespuesta(evento.target.value)
      }
      onKeyDown={(evento) => {
        if (
          evento.key === "Enter" &&
          !evento.shiftKey &&
          !evento.nativeEvent.isComposing
        ) {
          evento.preventDefault();
          evento.currentTarget.form?.requestSubmit();
        }
      }}
      disabled={
        enviando ||
        !humanoActivo ||
        conversacionCerrada
      }
      maxLength={2000}
      rows={3}
      placeholder={
        conversacionCerrada
          ? "La conversación está cerrada"
          : humanoActivo
          ? "Escribí tu mensaje..."
          : "Primero tomá la conversación"
      }
      className="min-h-[92px] flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    />

    <Button
      type="submit"
      disabled={
        enviando ||
        !respuesta.trim() ||
        !humanoActivo ||
        conversacionCerrada
      }
    >
      {enviando ? "Enviando..." : "Enviar"}
    </Button>
  </div>

<AICopilot
  respuestaActual={respuesta}
  historial={mensajes}
  memoria={conversacion.memoriaCliente}
  empresa={empresaNombre}
  onInsertar={setRespuesta}
/>
</div>

        <div className="mt-2 flex justify-between gap-3 text-[11px] text-zinc-600">
          <span>
            Enter para enviar · Shift + Enter para otra línea
          </span>

          <span>{respuesta.length}/2000</span>
        </div>
      </form>
    </div>
  );
}

function obtenerNombreVisitante(visitanteId?: string) {
  if (!visitanteId) return "Visitante anónimo";

  const parteVisible = visitanteId
    .replace("visitante-", "")
    .slice(0, 8);

  return `Visitante ${parteVisible}`;
}

function formatearHora(fecha?: Timestamp) {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}