"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

type Mensaje = {
  id: string;
  role: "user" | "assistant";
  content: string;
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: Timestamp;
};

type Conversacion = {
  id: string;
  empresaId?: string;
  visitanteId?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  email?: string;
telefono?: string;
etiquetas?: string[];
puntuacionLead?: number;
nivelInteres?: "bajo" | "medio" | "alto";
notaInterna?: string;
  ultimoMensaje?: string;
  cantidadMensajes?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}

function formatearHora(fecha?: Timestamp) {
  if (!fecha) {
    return "";
  }

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}

function obtenerNombreVisitante(visitanteId?: string) {
  if (!visitanteId) return "Visitante anónimo";

  const parteVisible = visitanteId
    .replace("visitante-", "")
    .slice(0, 8);

  return `Visitante ${parteVisible}`;
}

export default function ConversacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const mensajesFinalRef = useRef<HTMLDivElement | null>(null);

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const chatId = Array.isArray(params.chatId)
    ? params.chatId[0]
    : (params.chatId as string);

  const [conversacion, setConversacion] =
    useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargandoConversacion, setCargandoConversacion] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(true);
  const [cambiandoAtencion, setCambiandoAtencion] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [notaInterna, setNotaInterna] = useState("");
const [guardandoNota, setGuardandoNota] = useState(false);
  const [error, setError] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");

  useEffect(() => {
    if (!empresaId || !chatId) {
      setError("No se encontró la empresa o la conversación.");
      setCargandoConversacion(false);
      setCargandoMensajes(false);
      return;
    }

    setError("");
    setCargandoConversacion(true);
    setCargandoMensajes(true);

    const chatReferencia = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId
    );

    const cancelarConversacion = onSnapshot(
      chatReferencia,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConversacion(null);
          setError("La conversación no existe.");
          setCargandoConversacion(false);
          return;
        }

        const data = snapshot.data();

        setConversacion({
          id: snapshot.id,
          empresaId: data.empresaId,
          visitanteId: data.visitanteId,
          estado: data.estado,
          atendidoPor: data.atendidoPor,
          humanoActivo: data.humanoActivo,
          ultimoMensaje: data.ultimoMensaje,
          cantidadMensajes: data.cantidadMensajes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          email: data.email,
telefono: data.telefono,
etiquetas: data.etiquetas ?? [],
puntuacionLead: data.puntuacionLead ?? 0,
nivelInteres: data.nivelInteres,
notaInterna: data.notaInterna,
        });

setNotaInterna(data.notaInterna ?? "");
        setCargandoConversacion(false);
      },
      (firebaseError) => {
        console.error("Error al cargar la conversación:", firebaseError);
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
        const listaMensajes: Mensaje[] = snapshot.docs.map((documento) => {
          const data = documento.data();

          return {
            id: documento.id,
            role: data.role,
            content: data.content,
            enviadoPor: data.enviadoPor,
            createdAt: data.createdAt,
          };
        });

        setMensajes(listaMensajes);
        setCargandoMensajes(false);
      },
      (firebaseError) => {
        console.error("Error al cargar los mensajes:", firebaseError);
        setError("No se pudieron cargar los mensajes.");
        setCargandoMensajes(false);
      }
    );

    return () => {
      cancelarConversacion();
      cancelarMensajes();
    };
  }, [empresaId, chatId]);

  useEffect(() => {
    if (!cargandoMensajes && mensajes.length > 0) {
      mensajesFinalRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [cargandoMensajes, mensajes]);

async function cambiarModoAtencion() {
  if (!empresaId || !chatId || !conversacion || cambiandoAtencion) {
    return;
  }

  const humanoEstaActivo =
    conversacion.humanoActivo === true ||
    conversacion.atendidoPor === "humano";

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
      atendidoPor: humanoEstaActivo ? "ia" : "humano",
      humanoActivo: !humanoEstaActivo,
      updatedAt: serverTimestamp(),
    });

    setMensajeAccion(
      humanoEstaActivo
        ? "La IA volvió a tomar la conversación."
        : "Ahora la conversación está siendo atendida por una persona."
    );
  } catch (firebaseError) {
    console.error(
      "Error al cambiar el modo de atención:",
      firebaseError
    );

    setError("No se pudo cambiar el modo de atención.");
  } finally {
    setCambiandoAtencion(false);
  }
}

async function cambiarEstadoConversacion() {
  if (!empresaId || !chatId || !conversacion) {
    return;
  }

  const estaCerrada = conversacion.estado === "cerrada";

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
      estado: estaCerrada ? "abierta" : "cerrada",
      atendidoPor: estaCerrada
        ? conversacion.atendidoPor || "ia"
        : "ia",
      humanoActivo: estaCerrada
        ? conversacion.humanoActivo === true
        : false,
      updatedAt: serverTimestamp(),
    });

    setMensajeAccion(
      estaCerrada
        ? "La conversación fue reabierta."
        : "La conversación fue cerrada."
    );
  } catch (firebaseError) {
    console.error(
      "Error al cambiar el estado de la conversación:",
      firebaseError
    );

    setError("No se pudo cambiar el estado de la conversación.");
  }
}

async function guardarNotaInterna() {
  if (!empresaId || !chatId || !conversacion || guardandoNota) {
    return;
  }

  setGuardandoNota(true);
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
      notaInterna: notaInterna.trim(),
      updatedAt: serverTimestamp(),
    });

    setMensajeAccion("La nota interna fue guardada.");
  } catch (firebaseError) {
    console.error("Error al guardar la nota interna:", firebaseError);
    setError("No se pudo guardar la nota interna.");
  } finally {
    setGuardandoNota(false);
  }
}

  async function enviarRespuestaHumana(
    evento: React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    const contenido = respuesta.trim();

    if (
      !empresaId ||
      !chatId ||
      !conversacion ||
      !contenido ||
      enviandoRespuesta
    ) {
      return;
    }

    const humanoEstaActivo =
      conversacion.humanoActivo === true ||
      conversacion.atendidoPor === "humano";

    if (!humanoEstaActivo) {
      setMensajeAccion("");
      setError(
        "Primero tenés que tomar la conversación para responder como humano."
      );
      return;
    }

    setEnviandoRespuesta(true);
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
        cantidadMensajes: increment(1),
        atendidoPor: "humano",
        humanoActivo: true,
        estado: "abierta",
        updatedAt: serverTimestamp(),
      });

      setRespuesta("");
      setMensajeAccion("Mensaje enviado al visitante.");
    } catch (firebaseError) {
      console.error("Error al enviar la respuesta humana:", firebaseError);
      setError("No se pudo enviar el mensaje. Intentá nuevamente.");
    } finally {
      setEnviandoRespuesta(false);
    }
  }

  const totalMensajesCliente = useMemo(
    () => mensajes.filter((mensaje) => mensaje.role === "user").length,
    [mensajes]
  );

  const totalRespuestasIA = useMemo(
    () => mensajes.filter((mensaje) => mensaje.role === "assistant").length,
    [mensajes]
  );

  const cargando = cargandoConversacion || cargandoMensajes;

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-400">
            Historial de atención
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="truncate text-3xl font-bold tracking-tight text-white">
              {obtenerNombreVisitante(conversacion?.visitanteId)}
            </h1>

            {!cargando && !error && conversacion && (
              <Badge
                variant={
                  conversacion.estado === "cerrada"
                    ? "default"
                    : "success"
                }
              >
                {conversacion.estado === "cerrada"
                  ? "Cerrada"
                  : "Abierta"}
              </Badge>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Revisá el intercambio completo entre el visitante y el agente de IA.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!cargando && !error && conversacion && (
            <Button
              variant={
                conversacion.humanoActivo ||
                conversacion.atendidoPor === "humano"
                  ? "primary"
                  : "secondary"
              }
              disabled={cambiandoAtencion}
              onClick={cambiarModoAtencion}
            >
              {cambiandoAtencion
                ? "Cambiando..."
                : conversacion.humanoActivo ||
                  conversacion.atendidoPor === "humano"
                ? "👤 Humano atendiendo"
                : "🤖 IA respondiendo"}
            </Button>
          )}

          {!cargando && !error && conversacion && (
  <Button
    variant={
      conversacion.estado === "cerrada"
        ? "secondary"
        : "ghost"
    }
    onClick={cambiarEstadoConversacion}
  >
    {conversacion.estado === "cerrada"
      ? "Reabrir conversación"
      : "Cerrar conversación"}
  </Button>
)}

          <Button
            variant="secondary"
            onClick={() =>
              router.push(`/empresas/${empresaId}/conversaciones`)
            }
          >
            Volver a conversaciones
          </Button>
        </div>
      </header>

      {mensajeAccion && !error && (
        <Card className="mb-6 border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-300">{mensajeAccion}</p>
        </Card>
      )}

      {cargando && (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium text-white">
            Cargando conversación...
          </p>
        </Card>
      )}

      {!cargando && error && (
        <Card className="border-red-500/20 bg-red-500/10 p-6">
          <p className="font-medium text-red-300">{error}</p>

          <div className="mt-5">
            <Button
              variant="secondary"
              onClick={() =>
                router.push(`/empresas/${empresaId}/conversaciones`)
              }
            >
              Volver
            </Button>
          </div>
        </Card>
      )}

<Card className="p-6">
  <p className="text-sm font-semibold text-white">
    Nota interna
  </p>

  <textarea
    value={notaInterna}
    onChange={(e) => setNotaInterna(e.target.value)}
    rows={5}
    placeholder="Escribí una nota que solo verá tu equipo..."
    className="mt-4 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
  />

  <Button
    className="mt-4 w-full"
    onClick={guardarNotaInterna}
    disabled={guardandoNota}
  >
    {guardandoNota ? "Guardando..." : "Guardar nota"}
  </Button>
</Card>

      {!cargando && !error && conversacion && (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Avatar
                  name={obtenerNombreVisitante(conversacion.visitanteId)}
                  size="lg"
                />

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Visitante
                  </p>

                  <p className="mt-1 truncate font-semibold text-white">
                    {obtenerNombreVisitante(conversacion.visitanteId)}
                  </p>
                </div>
              </div>

<div className="mt-6 space-y-4 border-t border-zinc-800 pt-5">
  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Conversación creada
    </p>
    <p className="mt-1 text-sm text-zinc-300">
      {formatearFecha(conversacion.createdAt)}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Última actividad
    </p>
    <p className="mt-1 text-sm text-zinc-300">
      {formatearFecha(conversacion.updatedAt)}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Atendido por
    </p>
    <div className="mt-2 flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          conversacion.humanoActivo ||
          conversacion.atendidoPor === "humano"
            ? "bg-emerald-400"
            : "bg-blue-400"
        }`}
      />

      <p className="text-sm text-zinc-300">
        {conversacion.humanoActivo ||
        conversacion.atendidoPor === "humano"
          ? "Una persona"
          : "La IA"}
      </p>
    </div>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Email
    </p>
    <p className="mt-1 break-all text-sm text-zinc-300">
      {conversacion.email || "No detectado"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Teléfono
    </p>
    <p className="mt-1 text-sm text-zinc-300">
      {conversacion.telefono || "No detectado"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Nivel de interés
    </p>
    <p className="mt-1 text-sm capitalize text-zinc-300">
      {conversacion.nivelInteres || "bajo"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Puntuación del lead
    </p>

    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full rounded-full bg-blue-500"
        style={{
          width: `${conversacion.puntuacionLead ?? 0}%`,
        }}
      />
    </div>

    <p className="mt-1 text-sm text-zinc-300">
      {conversacion.puntuacionLead ?? 0}/100
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      Etiquetas
    </p>

    <div className="mt-2 flex flex-wrap gap-2">
      {conversacion.etiquetas?.length ? (
        conversacion.etiquetas.map((etiqueta) => (
          <span
            key={etiqueta}
            className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-300"
          >
            {etiqueta}
          </span>
        ))
      ) : (
        <span className="text-sm text-zinc-500">
          Sin etiquetas
        </span>
      )}
    </div>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-zinc-600">
      ID de conversación
    </p>
    <p className="mt-1 break-all text-sm text-zinc-300">
      {conversacion.id}
    </p>
  </div>
</div>
</Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-white">
                Resumen
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 xl:grid-cols-1">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-2xl font-bold text-white">
                    {mensajes.length}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Mensajes
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-2xl font-bold text-white">
                    {totalMensajesCliente}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Del cliente
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-2xl font-bold text-white">
                    {totalRespuestasIA}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    De la IA
                  </p>
                </div>
              </div>
            </Card>
          </aside>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold text-white">
                  Mensajes
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Historial completo de la conversación
                </p>
              </div>

              <Badge variant="info">
                {mensajes.length}{" "}
                {mensajes.length === 1 ? "mensaje" : "mensajes"}
              </Badge>
            </div>

            <div className="max-h-[720px] min-h-[480px] overflow-y-auto bg-zinc-950/40 px-4 py-6 sm:px-6">
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
                      Esta conversación todavía no tiene mensajes guardados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {mensajes.map((mensaje) => {
                    const esCliente = mensaje.role === "user";
                    const esHumano = mensaje.enviadoPor === "humano";
                    const nombre = esCliente
                      ? "Cliente"
                      : esHumano
                      ? "Operador"
                      : "Agente IA";

                    return (
                      <div
                        key={mensaje.id}
                        className={`flex items-end gap-3 ${
                          esCliente ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!esCliente && (
                          <Avatar
                            name={esHumano ? "Operador" : "Agente IA"}
                            size="sm"
                          />
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[72%] ${
                            esCliente ? "order-first" : ""
                          }`}
                        >
                          <div
                            className={`mb-2 flex items-center gap-3 ${
                              esCliente
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <p className="text-xs font-medium text-zinc-400">
                              {nombre}
                            </p>

                            <p className="text-[11px] text-zinc-600">
                              {formatearHora(mensaje.createdAt)}
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
                            name={obtenerNombreVisitante(
                              conversacion.visitanteId
                            )}
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
              onSubmit={enviarRespuestaHumana}
              className="border-t border-zinc-800 bg-zinc-950/70 p-4 sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Responder como operador
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {conversacion.humanoActivo ||
                    conversacion.atendidoPor === "humano"
                      ? "El visitante recibirá el mensaje en tiempo real."
                      : "Tomá la conversación para habilitar la respuesta humana."}
                  </p>
                </div>

                <Badge
                  variant={
                    conversacion.humanoActivo ||
                    conversacion.atendidoPor === "humano"
                      ? "success"
                      : "default"
                  }
                >
                  {conversacion.humanoActivo ||
                  conversacion.atendidoPor === "humano"
                    ? "Humano activo"
                    : "IA activa"}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  value={respuesta}
                  onChange={(evento) => setRespuesta(evento.target.value)}
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
  enviandoRespuesta ||
  !respuesta.trim() ||
  conversacion.estado === "cerrada" ||
  !(
    conversacion.humanoActivo ||
    conversacion.atendidoPor === "humano"
  )
}
                  maxLength={2000}
                  rows={3}
placeholder={
  conversacion.estado === "cerrada"
    ? "La conversación está cerrada."
    : conversacion.humanoActivo ||
      conversacion.atendidoPor === "humano"
    ? "Escribí tu mensaje..."
    : "Primero tomá la conversación para responder."
}
                  className="min-h-[92px] flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <Button
                  type="submit"
                  disabled={
                    enviandoRespuesta ||
                    !respuesta.trim() ||
                    !(
                      conversacion.humanoActivo ||
                      conversacion.atendidoPor === "humano"
                    )
                  }
                >
                  {enviandoRespuesta ? "Enviando..." : "Enviar"}
                </Button>
              </div>

              <div className="mt-2 flex justify-between gap-3 text-[11px] text-zinc-600">
                <span>Enter para enviar · Shift + Enter para otra línea</span>
                <span>{respuesta.length}/2000</span>
              </div>
            </form>
          </Card>
        </div>
      )}
    </section>
  );
}