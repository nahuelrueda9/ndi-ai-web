"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentReference,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { registrarActividad } from "@/lib/chat/activityService";
import { analizarMensajeCRM } from "@/lib/chat/crmAutomation";
import { crearTarea } from "@/lib/crm/taskService";
import { registrarNuevaConversacion } from "@/lib/plans/limits";

type TemaWidget = "oscuro" | "claro";
type PosicionWidget = "derecha" | "izquierda";
type FormaWidget = "redondo" | "cuadrado";

type MensajeChat = {
  id: string;
  role: "user" | "assistant";
  content: string;
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: Timestamp;
};

type Empresa = {
  nombre?: string;
  descripcion?: string;
  personalidad?: string;
  objetivo?: string;
  instrucciones?: string;
  restricciones?: string;
  idioma?: string;
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
};

type Conocimiento = {
  titulo?: string;
  contenido?: string;
};

type EstadoConversacion = {
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  estado?: "abierta" | "cerrada";
};

const CONFIG_INICIAL = {
  nombreBot: "Asistente virtual",
  mensajeBienvenida: "¡Hola! ¿En qué puedo ayudarte?",
  colorPrincipal: "#3b82f6",
  tema: "oscuro" as TemaWidget,
  posicion: "derecha" as PosicionWidget,
  formaBoton: "redondo" as FormaWidget,
  textoPlaceholder: "Escribí tu mensaje...",
  mostrarMarca: true,
};

function obtenerVisitanteId() {
  if (typeof window === "undefined") return "visitante";

  const clave = "ndi-ai-visitor-id";
  const existente = window.localStorage.getItem(clave);

  if (existente) return existente;

  const nuevoId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitante-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(clave, nuevoId);

  return nuevoId;
}

function obtenerClaveConversacion(empresaId: string) {
  return `ndi-ai-conversation-${empresaId}`;
}

export default function WidgetPublicoPage() {
  const params = useParams();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [conocimientos, setConocimientos] = useState<Conocimiento[]>([]);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [chatAbierto, setChatAbierto] = useState(true);
  const [estadoConversacion, setEstadoConversacion] =
    useState<EstadoConversacion>({
      atendidoPor: "ia",
      humanoActivo: false,
      estado: "abierta",
    });

  const finalChatRef = useRef<HTMLDivElement | null>(null);
  const conversacionRef =
    useRef<DocumentReference<DocumentData> | null>(null);

  function enviarMensajeAlContenedor(
    type: "widget:position" | "widget:resize",
    payload: Record<string, string | number>
  ) {
    if (typeof window === "undefined" || window.parent === window) return;

    window.parent.postMessage(
      {
        source: "ndi-ai-widget",
        type,
        ...payload,
      },
      window.location.origin
    );
  }

  useEffect(() => {
    if (!empresa) return;

    const posicionWidget =
      empresa.widget?.posicion || CONFIG_INICIAL.posicion;

    enviarMensajeAlContenedor("widget:position", {
      position: posicionWidget === "izquierda" ? "left" : "right",
    });
  }, [empresa]);

  useEffect(() => {
    enviarMensajeAlContenedor("widget:resize", {
      width: chatAbierto ? 430 : 88,
      height: chatAbierto ? 700 : 88,
    });
  }, [chatAbierto]);

  useEffect(() => {
    const avisarAlContenedor = () => {
      enviarMensajeAlContenedor("widget:resize", {
        width: chatAbierto ? 430 : 88,
        height: chatAbierto ? 700 : 88,
      });
    };

    window.addEventListener("load", avisarAlContenedor);
    window.setTimeout(avisarAlContenedor, 100);

    return () => {
      window.removeEventListener("load", avisarAlContenedor);
    };
  }, [chatAbierto]);

  useEffect(() => {
    const cargarWidget = async () => {
      if (!empresaId) {
        setError("No se encontró el ID de la empresa.");
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const empresaReferencia = doc(db, "companies", empresaId);
        const empresaSnapshot = await getDoc(empresaReferencia);

        if (!empresaSnapshot.exists()) {
          setError("Este asistente no está disponible.");
          return;
        }

        const datosEmpresa = empresaSnapshot.data() as Empresa;
        setEmpresa(datosEmpresa);

        try {
          const conocimientosReferencia = collection(
            db,
            "companies",
            empresaId,
            "knowledge"
          );

          const conocimientosSnapshot = await getDocs(
            conocimientosReferencia
          );

          const conocimientosCargados = conocimientosSnapshot.docs.map(
            (documento) => documento.data() as Conocimiento
          );

          setConocimientos(conocimientosCargados);
        } catch (knowledgeError) {
          console.error(
            "No se pudo cargar la base de conocimiento:",
            knowledgeError
          );
          setConocimientos([]);
        }

        const idGuardado = window.localStorage.getItem(
          obtenerClaveConversacion(empresaId)
        );

        if (idGuardado) {
          const referenciaGuardada = doc(
            db,
            "companies",
            empresaId,
            "conversations",
            idGuardado
          );

          const snapshotGuardado = await getDoc(referenciaGuardada);

          if (snapshotGuardado.exists()) {
            conversacionRef.current = referenciaGuardada;
            setConversacionId(idGuardado);
          } else {
            window.localStorage.removeItem(
              obtenerClaveConversacion(empresaId)
            );
          }
        }
      } catch (firebaseError) {
        console.error("Error al cargar el widget:", firebaseError);
        setError("No se pudo cargar el asistente.");
      } finally {
        setCargando(false);
      }
    };

    void cargarWidget();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId || !conversacionId) return;

    const referenciaConversacion = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      conversacionId
    );

    conversacionRef.current = referenciaConversacion;

    const cancelarConversacion = onSnapshot(
      referenciaConversacion,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setEstadoConversacion({
          atendidoPor: data.atendidoPor ?? "ia",
          humanoActivo: data.humanoActivo === true,
          estado: data.estado ?? "abierta",
        });
      },
      (firebaseError) => {
        console.error(
          "Error al escuchar el estado de la conversación:",
          firebaseError
        );
      }
    );

    const mensajesQuery = query(
      collection(referenciaConversacion, "messages"),
      orderBy("createdAt", "asc")
    );

    const cancelarMensajes = onSnapshot(
      mensajesQuery,
      (snapshot) => {
        const mensajesActualizados: MensajeChat[] = snapshot.docs.map(
          (documento) => {
            const data = documento.data();

            return {
              id: documento.id,
              role: data.role,
              content: data.content,
              enviadoPor:
                data.enviadoPor ??
                (data.role === "user" ? "cliente" : "ia"),
              createdAt: data.createdAt,
            };
          }
        );

        setMensajes(mensajesActualizados);
      },
      (firebaseError) => {
        console.error(
          "Error al escuchar los mensajes de la conversación:",
          firebaseError
        );
        setError("No se pudieron actualizar los mensajes en tiempo real.");
      }
    );

    return () => {
      cancelarConversacion();
      cancelarMensajes();
    };
  }, [empresaId, conversacionId]);

  useEffect(() => {
    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [mensajes, enviando]);

  async function obtenerOCrearConversacion(mensajeInicial: string) {
    if (!empresaId) {
      throw new Error("No se encontró la empresa.");
    }

    if (conversacionRef.current) {
      return conversacionRef.current;
    }

    await registrarNuevaConversacion(empresaId);

    const nuevaConversacion = await addDoc(
      collection(db, "companies", empresaId, "conversations"),
      {
        empresaId,
        visitanteId: obtenerVisitanteId(),
        estado: "abierta",
        atendidoPor: "ia",
        humanoActivo: false,
        ultimoMensaje: mensajeInicial,
        ultimoRol: "user",
        cantidadMensajes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    conversacionRef.current = nuevaConversacion;
    setConversacionId(nuevaConversacion.id);

    window.localStorage.setItem(
      obtenerClaveConversacion(empresaId),
      nuevaConversacion.id
    );

    return nuevaConversacion;
  }

  async function guardarMensaje(
    referenciaConversacion: DocumentReference<DocumentData>,
    mensaje: Omit<MensajeChat, "id" | "createdAt">
  ) {
    await addDoc(collection(referenciaConversacion, "messages"), {
      role: mensaje.role,
      content: mensaje.content,
      enviadoPor:
        mensaje.enviadoPor ??
        (mensaje.role === "user" ? "cliente" : "ia"),
      createdAt: serverTimestamp(),
    });
  }

  async function enviarMensaje(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const mensajeLimpio = texto.trim();

    if (!mensajeLimpio || enviando || !empresa) return;

    const mensajeUsuario = {
      role: "user" as const,
      content: mensajeLimpio,
      enviadoPor: "cliente" as const,
    };

    const historialAnterior = mensajes
      .filter((mensaje) => mensaje.content.trim().length > 0)
      .map(({ role, content }) => ({ role, content }));

    setTexto("");
    setEnviando(true);
    setError("");

    try {
     const referenciaConversacion =
  await obtenerOCrearConversacion(mensajeLimpio);

// Guardamos primero el mensaje del cliente
await guardarMensaje(
  referenciaConversacion,
  mensajeUsuario
);

await registrarActividad({
  empresaId: empresaId!,
  chatId: referenciaConversacion.id,
  tipo: "chat",
  titulo: "Mensaje recibido",
  descripcion:
    mensajeLimpio.length > 140
      ? `${mensajeLimpio.slice(0, 140)}...`
      : mensajeLimpio,
  icono: "💬",
});

// Analizamos automáticamente el mensaje
const analisisCRM = analizarMensajeCRM(mensajeLimpio);

const datosCRM: Record<string, unknown> = {
  puntuacionLead: analisisCRM.puntuacionLead,
  nivelInteres: analisisCRM.nivelInteres,
  ultimoAnalisisCRM: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

if (analisisCRM.etiquetas.length > 0) {
  datosCRM.etiquetas = arrayUnion(
    ...analisisCRM.etiquetas
  );
}

if (analisisCRM.emailDetectado) {
  datosCRM.email = analisisCRM.emailDetectado;
}

if (analisisCRM.telefonoDetectado) {
  datosCRM.telefono = analisisCRM.telefonoDetectado;
}

await updateDoc(
  referenciaConversacion,
  datosCRM
);

if (analisisCRM.crearTarea && analisisCRM.tituloTarea) {
  console.log("Creando tarea automática:", analisisCRM);

  await crearTarea({
    empresaId: empresaId!,
    chatId: referenciaConversacion.id,
    titulo: analisisCRM.tituloTarea,
    descripcion: analisisCRM.descripcionTarea,
    prioridad: analisisCRM.prioridadTarea,
    fechaVencimiento: analisisCRM.fechaVencimientoTarea,
  });

  await registrarActividad({
    empresaId: empresaId!,
    chatId: referenciaConversacion.id,
    tipo: "tarea",
    titulo: "Tarea creada automáticamente",
    descripcion: analisisCRM.tituloTarea,
    icono: "📋",
  });
}

const estadoAntesDeResponder = await getDoc(
  referenciaConversacion
);

      const datosEstado = estadoAntesDeResponder.data();
      const humanoActivo =
        datosEstado?.humanoActivo === true ||
        datosEstado?.atendidoPor === "humano";

      if (humanoActivo) {
  await updateDoc(referenciaConversacion, {
    ultimoMensaje: mensajeLimpio,
    ultimoRol: "user",
    cantidadMensajes: increment(1),
    updatedAt: serverTimestamp(),
  });

  return;
}

      const respuestaApi = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje: mensajeLimpio,
          historial: historialAnterior,
          empresa,
          conocimientos,
            empresaId,
  chatId: referenciaConversacion.id,
        }),
      });

      const responseText = await respuestaApi.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    `La API respondió con HTML. Estado ${respuestaApi.status}. Revisá la terminal de VS Code.`
  );
}

      if (!respuestaApi.ok) {
        throw new Error(
          data?.error || "No se pudo obtener una respuesta."
        );
      }

      const respuestaTexto =
        typeof data?.respuesta === "string"
          ? data.respuesta.trim()
          : "";

      if (!respuestaTexto) {
        throw new Error("La IA devolvió una respuesta vacía.");
      }

      const estadoAntesDeGuardarIA = await getDoc(
        referenciaConversacion
      );

      const datosActualizados = estadoAntesDeGuardarIA.data();
      const humanoTomoControl =
        datosActualizados?.humanoActivo === true ||
        datosActualizados?.atendidoPor === "humano";

      if (humanoTomoControl) {
        return;
      }

      const mensajeAsistente = {
        role: "assistant" as const,
        content: respuestaTexto,
        enviadoPor: "ia" as const,
      };

      await guardarMensaje(
        referenciaConversacion,
        mensajeAsistente
      );

      await registrarActividad({
  empresaId: empresaId!,
  chatId: referenciaConversacion.id,
  tipo: "ia",
  titulo: "Respuesta generada por la IA",
  descripcion:
    respuestaTexto.length > 140
      ? `${respuestaTexto.slice(0, 140)}...`
      : respuestaTexto,
  icono: "🤖",
});

      await updateDoc(referenciaConversacion, {
        ultimoMensaje: respuestaTexto,
        ultimoRol: "assistant",
        cantidadMensajes: increment(2),
        atendidoPor: "ia",
        humanoActivo: false,
        updatedAt: serverTimestamp(),
      });
    } catch (requestError) {
      console.error("Error al enviar el mensaje:", requestError);

      const mensajeError =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo enviar el mensaje.";

      setError(mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  function manejarTecla(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (texto.trim() && !enviando) {
        void enviarMensaje();
      }
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 shadow-2xl">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="text-sm text-zinc-300">
            Cargando asistente...
          </p>
        </div>
      </main>
    );
  }

  if (error && !empresa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-zinc-950 p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            !
          </div>

          <h1 className="mt-4 text-lg font-semibold text-white">
            Asistente no disponible
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!empresa) return null;

  const nombreBot =
    empresa.widget?.nombreBot ||
    empresa.nombre ||
    CONFIG_INICIAL.nombreBot;

  const mensajeBienvenida =
    empresa.widget?.mensajeBienvenida ||
    CONFIG_INICIAL.mensajeBienvenida;

  const colorPrincipal =
    empresa.widget?.colorPrincipal ||
    CONFIG_INICIAL.colorPrincipal;

  const tema =
    empresa.widget?.tema ||
    CONFIG_INICIAL.tema;

  const textoPlaceholder =
    empresa.widget?.textoPlaceholder ||
    CONFIG_INICIAL.textoPlaceholder;

  const mostrarMarca =
    empresa.widget?.mostrarMarca ??
    CONFIG_INICIAL.mostrarMarca;

  const posicion =
    empresa.widget?.posicion ||
    CONFIG_INICIAL.posicion;

  const formaBoton =
    empresa.widget?.formaBoton ||
    CONFIG_INICIAL.formaBoton;

  const temaOscuro = tema === "oscuro";
  const humanoActivo =
    estadoConversacion.humanoActivo === true ||
    estadoConversacion.atendidoPor === "humano";

  if (!chatAbierto) {
    return (
      <main
        className={`flex min-h-screen items-end bg-transparent p-3 ${
          posicion === "izquierda" ? "justify-start" : "justify-end"
        }`}
      >
        <button
          type="button"
          onClick={() => setChatAbierto(true)}
          aria-label="Abrir chat"
          className={`flex h-14 w-14 items-center justify-center text-xl text-white shadow-2xl transition hover:scale-105 active:scale-95 ${
            formaBoton === "redondo" ? "rounded-full" : "rounded-2xl"
          }`}
          style={{ backgroundColor: colorPrincipal }}
        >
          💬
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-end justify-center bg-transparent p-3 sm:p-4">
      <section
        className={[
          "flex h-[min(680px,calc(100vh-24px))] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border shadow-2xl",
          temaOscuro
            ? "border-zinc-700 bg-zinc-950"
            : "border-zinc-200 bg-white",
        ].join(" ")}
      >
        <header
          className="flex items-center gap-3 px-4 py-4 text-white"
          style={{ backgroundColor: colorPrincipal }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">
            {humanoActivo ? "👤" : "✦"}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">
              {humanoActivo ? "Soporte humano" : nombreBot}
            </h1>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              <p className="text-xs text-white/80">
                {humanoActivo
                  ? "Una persona está atendiendo"
                  : "Asistente en línea"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChatAbierto(false)}
            aria-label="Minimizar chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl leading-none text-white transition hover:bg-white/25"
          >
            −
          </button>
        </header>

        <div
          className={[
            "flex-1 space-y-4 overflow-y-auto px-4 py-5",
            temaOscuro ? "bg-zinc-950" : "bg-zinc-50",
          ].join(" ")}
        >
          <div className="flex justify-start">
            <div
              className={[
                "max-w-[84%] whitespace-pre-wrap rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-6",
                temaOscuro
                  ? "bg-zinc-900 text-zinc-200"
                  : "border border-zinc-200 bg-white text-zinc-700 shadow-sm",
              ].join(" ")}
            >
              {mensajeBienvenida}
            </div>
          </div>

          {mensajes.map((mensaje) => {
            const esUsuario = mensaje.role === "user";
            const esHumano = mensaje.enviadoPor === "humano";

            return (
              <div
                key={mensaje.id}
                className={`flex ${
                  esUsuario ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[84%]">
                  {!esUsuario && (
                    <p
                      className={[
                        "mb-1.5 px-1 text-[11px] font-medium",
                        temaOscuro
                          ? "text-zinc-500"
                          : "text-zinc-400",
                      ].join(" ")}
                    >
                      {esHumano ? "Soporte" : nombreBot}
                    </p>
                  )}

                  <div
                    className={[
                      "whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                      esUsuario
                        ? "rounded-br-md text-white"
                        : esHumano
                        ? temaOscuro
                          ? "rounded-bl-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
                          : "rounded-bl-md border border-emerald-200 bg-emerald-50 text-emerald-900"
                        : temaOscuro
                        ? "rounded-bl-md bg-zinc-900 text-zinc-200"
                        : "rounded-bl-md border border-zinc-200 bg-white text-zinc-700 shadow-sm",
                    ].join(" ")}
                    style={
                      esUsuario
                        ? { backgroundColor: colorPrincipal }
                        : undefined
                    }
                  >
                    {mensaje.content}
                  </div>
                </div>
              </div>
            );
          })}

          {enviando && !humanoActivo && (
            <div className="flex justify-start">
              <div
                className={[
                  "flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3",
                  temaOscuro
                    ? "bg-zinc-900"
                    : "border border-zinc-200 bg-white shadow-sm",
                ].join(" ")}
              >
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
              </div>
            </div>
          )}

          {enviando && humanoActivo && (
            <p
              className={[
                "text-center text-xs",
                temaOscuro ? "text-zinc-500" : "text-zinc-400",
              ].join(" ")}
            >
              Mensaje enviado. Soporte te responderá por acá.
            </p>
          )}

          <div ref={finalChatRef} />
        </div>

        <footer
          className={[
            "border-t p-3",
            temaOscuro
              ? "border-zinc-800 bg-zinc-950"
              : "border-zinc-200 bg-white",
          ].join(" ")}
        >
          {error && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          {humanoActivo && (
            <p
              className={[
                "mb-2 rounded-lg px-3 py-2 text-xs",
                temaOscuro
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              Estás hablando con una persona del equipo.
            </p>
          )}

          <form
            onSubmit={enviarMensaje}
            className={[
              "flex items-end gap-2 rounded-2xl border p-2",
              temaOscuro
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-200 bg-zinc-50",
            ].join(" ")}
          >
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={manejarTecla}
              placeholder={textoPlaceholder}
              rows={1}
              disabled={enviando}
              className={[
                "max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none",
                temaOscuro
                  ? "text-white placeholder:text-zinc-600"
                  : "text-zinc-900 placeholder:text-zinc-400",
              ].join(" ")}
            />

            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              aria-label="Enviar mensaje"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: colorPrincipal }}
            >
              ↑
            </button>
          </form>

          {mostrarMarca && (
            <p
              className={[
                "mt-2 text-center text-[10px]",
                temaOscuro
                  ? "text-zinc-600"
                  : "text-zinc-400",
              ].join(" ")}
            >
              Creado con NDI AI
            </p>
          )}
        </footer>
      </section>
    </main>
  );
}