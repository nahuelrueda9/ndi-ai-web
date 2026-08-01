"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

import {
  actualizarConversacion,
  actualizarTituloConversacion,
  crearConversacion,
  obtenerConversaciones,
} from "@/lib/chatService";
import {
  guardarMensaje,
  obtenerMensajes,
} from "@/lib/messageService";
import { auth, db } from "@/lib/firebase";

import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type Empresa = {
  nombre?: string;
  descripcion?: string;
  userId?: string;
  agente?: {
    nombre?: string;
    rol?: string;
    personalidad?: string;
    instrucciones?: string;
  };
};

type Conocimiento = {
  id: string;
  titulo?: string;
  contenido?: string;
};

type MensajeChat = {
  role: "user" | "assistant";
  content: string;
};

type Conversacion = {
  id: string;
  titulo?: string;
};

export default function ProbarAgentePage() {
  const params = useParams();
  const router = useRouter();
  const mensajesFinalRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [conocimientos, setConocimientos] = useState<Conocimiento[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [mensajesCargados, setMensajesCargados] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [cargandoPagina, setCargandoPagina] = useState(true);
  const [cargandoConversacion, setCargandoConversacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [copiadoIndex, setCopiadoIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!empresaId) {
        setError("No se encontró el ID de la empresa.");
        setCargandoPagina(false);
        return;
      }

      try {
        const empresaRef = doc(db, "companies", empresaId);
        const empresaSnapshot = await getDoc(empresaRef);

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          setCargandoPagina(false);
          return;
        }

        const datosEmpresa = empresaSnapshot.data() as Empresa;

        if (datosEmpresa.userId !== user.uid) {
          setError("No tenés permiso para acceder a esta empresa.");
          setCargandoPagina(false);
          return;
        }

        setEmpresa(datosEmpresa);

        const chatsQuery = query(
          collection(db, "chats"),
          where("empresaId", "==", empresaId),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc")
        );

        const chatsSnapshot = await getDocs(chatsQuery);

        const listaConversaciones = await obtenerConversaciones(
          empresaId,
          user.uid
        );

        setConversaciones(listaConversaciones);

        if (!chatsSnapshot.empty && !mensajesCargados) {
          const chat = chatsSnapshot.docs[0];

          setChatId(chat.id);

          const historial = await obtenerMensajes(chat.id);

          setMensajes(historial);
          setMensajesCargados(true);
        }

        const knowledgeQuery = query(
          collection(db, "knowledge"),
          where("empresaId", "==", empresaId),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const knowledgeSnapshot = await getDocs(knowledgeQuery);

        const listaConocimientos = knowledgeSnapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        ) as Conocimiento[];

        setConocimientos(listaConocimientos);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los datos del agente.");
      } finally {
        setCargandoPagina(false);
      }
    });

    return () => unsubscribe();
  }, [empresaId, mensajesCargados, router]);

  useEffect(() => {
    mensajesFinalRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [mensajes, enviando]);

  const nombreAgente =
    empresa?.agente?.nombre?.trim() || "Agente IA";

  const rolAgente =
    empresa?.agente?.rol?.trim() || "Asistente virtual";

  const tituloConversacionActual = useMemo(() => {
    return (
      conversaciones.find((item) => item.id === chatId)?.titulo ||
      "Conversación nueva"
    );
  }, [chatId, conversaciones]);

  async function actualizarListaConversaciones() {
    if (!auth.currentUser) return;

    const listaActualizada = await obtenerConversaciones(
      empresaId,
      auth.currentUser.uid
    );

    setConversaciones(listaActualizada);
  }

  async function enviarMensaje() {
    const mensajeLimpio = mensaje.trim();

    if (!mensajeLimpio || !empresa || enviando) {
      return;
    }

    let idConversacion = chatId;

    setError("");
    setEnviando(true);

    try {
      if (!idConversacion && auth.currentUser) {
        idConversacion = await crearConversacion(
          empresaId,
          auth.currentUser.uid
        );

        setChatId(idConversacion);
      }

      const nuevosMensajes: MensajeChat[] = [
        ...mensajes,
        {
          role: "user",
          content: mensajeLimpio,
        },
      ];

      setMensajes(nuevosMensajes);
      setMensaje("");

      if (idConversacion && mensajes.length === 0) {
        await actualizarTituloConversacion(
          idConversacion,
          mensajeLimpio.slice(0, 50)
        );
      }

      if (idConversacion) {
        await guardarMensaje(
          idConversacion,
          "user",
          mensajeLimpio
        );
      }

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje: mensajeLimpio,
          historial: nuevosMensajes,
          empresa: {
            nombre: empresa.nombre,
            descripcion: empresa.descripcion,
            agente: {
              nombre: empresa.agente?.nombre,
              rol: empresa.agente?.rol,
              personalidad: empresa.agente?.personalidad,
              instrucciones: empresa.agente?.instrucciones,
            },
          },
          conocimientos: conocimientos.map((item) => ({
            titulo: item.titulo,
            contenido: item.contenido,
          })),
        }),
      });

      const textoRespuesta = await response.text();

let data: any;

try {
  data = JSON.parse(textoRespuesta);
} catch {
  console.error("Respuesta real de /api/gemini:", textoRespuesta);

  throw new Error(
    `La API devolvió HTML. Estado ${response.status}`
  );
}

      if (!response.ok) {
        setError(data.error || "No se pudo generar la respuesta.");
        return;
      }

      const respuesta =
        data.respuesta || "El agente no devolvió una respuesta.";

      setMensajes((actuales) => [
        ...actuales,
        {
          role: "assistant",
          content: respuesta,
        },
      ]);

      if (idConversacion) {
        await guardarMensaje(
          idConversacion,
          "assistant",
          respuesta
        );

        await actualizarConversacion(idConversacion);
      }

      await actualizarListaConversaciones();
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el agente.");
    } finally {
      setEnviando(false);
      textareaRef.current?.focus();
    }
  }

  async function nuevaConversacion() {
    if (!auth.currentUser || enviando) return;

    setError("");
    setCargandoConversacion(true);

    try {
      const nuevoChatId = await crearConversacion(
        empresaId,
        auth.currentUser.uid
      );

      setChatId(nuevoChatId);
      setMensajes([]);
      setMensaje("");

      await actualizarListaConversaciones();

      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (err) {
      console.error(err);
      setError("No se pudo crear una conversación nueva.");
    } finally {
      setCargandoConversacion(false);
    }
  }

  async function seleccionarConversacion(id: string) {
    if (id === chatId || enviando) return;

    setError("");
    setCargandoConversacion(true);
    setChatId(id);

    try {
      const historial = await obtenerMensajes(id);
      setMensajes(historial);
      setMensaje("");
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la conversación.");
    } finally {
      setCargandoConversacion(false);
    }
  }

  function limpiarConversacion() {
    setMensajes([]);
    setMensaje("");
    setError("");
    textareaRef.current?.focus();
  }

  async function copiarMensaje(
    contenido: string,
    index: number
  ) {
    try {
      await navigator.clipboard.writeText(contenido);
      setCopiadoIndex(index);

      window.setTimeout(() => {
        setCopiadoIndex(null);
      }, 1600);
    } catch (err) {
      console.error(err);
      setError("No se pudo copiar el mensaje.");
    }
  }

  function handleTeclaMensaje(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void enviarMensaje();
    }
  }

  if (cargandoPagina) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium text-white">
            Cargando agente...
          </p>
        </Card>
      </section>
    );
  }

  if (error && !empresa) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="font-medium text-red-300">{error}</p>

          <div className="mt-5">
            <Button
              variant="secondary"
              onClick={() => router.push("/empresas")}
            >
              Volver a empresas
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Playground del agente
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Probar agente de {empresa?.nombre || "la empresa"}
            </h1>

            <Badge variant="success">Agente conectado</Badge>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Simulá una conversación real y comprobá cómo responde el agente
            con la configuración y la información cargada.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => router.push(`/empresas/${empresaId}`)}
        >
          Volver a la empresa
        </Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">
                    Conversaciones
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {conversaciones.length} guardadas
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={nuevaConversacion}
                  disabled={cargandoConversacion || enviando}
                >
                  + Nueva
                </Button>
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-3">
              {conversaciones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-center">
                  <p className="text-sm text-zinc-500">
                    Todavía no hay conversaciones.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversaciones.map((conversacion, index) => {
                    const activa = chatId === conversacion.id;

                    return (
                      <button
                        key={conversacion.id}
                        type="button"
                        onClick={() =>
                          void seleccionarConversacion(conversacion.id)
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          activa
                            ? "border-blue-500/40 bg-blue-500/10"
                            : "border-transparent hover:border-zinc-800 hover:bg-zinc-900"
                        }`}
                      >
                        <p
                          className={`truncate text-sm font-medium ${
                            activa ? "text-blue-300" : "text-zinc-300"
                          }`}
                        >
                          {conversacion.titulo ||
                            `Conversación ${index + 1}`}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {activa ? "Conversación activa" : "Abrir historial"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={nombreAgente} size="md" />

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {nombreAgente}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {rolAgente}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5">
              <DatoAgente
                etiqueta="Base de conocimiento"
                valor={`${conocimientos.length} registros`}
              />
              <DatoAgente
                etiqueta="Personalidad"
                valor={
                  empresa?.agente?.personalidad ||
                  "Sin personalización"
                }
              />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-white">
              Consejos para probar
            </p>

            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-500">
              <p>Probá preguntas sobre precios, servicios y horarios.</p>
              <p>Hacé una consulta que no esté en la base para ver cómo reacciona.</p>
              <p>Simulá una conversación larga para comprobar la memoria.</p>
            </div>
          </Card>
        </aside>

        <Card className="flex min-h-[720px] flex-col overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={nombreAgente} size="md" />

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {tituloConversacionActual}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-xs text-zinc-500">
                    {nombreAgente} está disponible
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={limpiarConversacion}
              disabled={mensajes.length === 0 || enviando}
            >
              Limpiar vista
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto bg-zinc-950/40 p-4 sm:p-6">
            {cargandoConversacion ? (
              <div className="flex h-full min-h-[480px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
                  <p className="text-sm text-zinc-500">
                    Cargando conversación...
                  </p>
                </div>
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex h-full min-h-[480px] items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10">
                    <Avatar name={nombreAgente} size="lg" />
                  </div>

                  <h2 className="mt-6 text-xl font-semibold text-white">
                    Empezá una conversación
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Escribí una consulta como si fueras un cliente real. El
                    agente responderá usando su configuración y la base de
                    conocimiento.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "¿Qué servicios ofrecen?",
                      "¿Cuáles son sus horarios?",
                      "¿Cómo puedo comunicarme con un asesor?",
                    ].map((sugerencia) => (
                      <button
                        key={sugerencia}
                        type="button"
                        onClick={() => {
                          setMensaje(sugerencia);
                          textareaRef.current?.focus();
                        }}
                        className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 transition hover:border-blue-500/40 hover:text-zinc-200"
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {mensajes.map((item, index) => {
                  const esUsuario = item.role === "user";

                  return (
                    <div
                      key={`${item.role}-${index}`}
                      className={`flex gap-3 ${
                        esUsuario ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!esUsuario && (
                        <div className="mt-1 shrink-0">
                          <Avatar name={nombreAgente} size="sm" />
                        </div>
                      )}

                      <div className="group max-w-[88%]">
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-7 sm:px-5 ${
                            esUsuario
                              ? "rounded-br-md bg-blue-600 text-white"
                              : "rounded-bl-md border border-zinc-800 bg-zinc-900 text-zinc-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {item.content}
                          </p>
                        </div>

                        <div
                          className={`mt-2 flex items-center gap-3 text-xs text-zinc-600 ${
                            esUsuario ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>
                            {esUsuario ? "Cliente" : nombreAgente}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              void copiarMensaje(item.content, index)
                            }
                            className="transition hover:text-zinc-300"
                          >
                            {copiadoIndex === index
                              ? "Copiado"
                              : "Copiar"}
                          </button>
                        </div>
                      </div>

                      {esUsuario && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white">
                          Tú
                        </div>
                      )}
                    </div>
                  );
                })}

                {enviando && (
                  <div className="flex items-start gap-3">
                    <Avatar name={nombreAgente} size="sm" />

                    <div className="rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={mensajesFinalRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 sm:mx-6">
              {error}
            </div>
          )}

          <div className="border-t border-zinc-800 p-4 sm:p-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 transition focus-within:border-blue-500">
              <textarea
                ref={textareaRef}
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                onKeyDown={handleTeclaMensaje}
                rows={3}
                maxLength={4000}
                placeholder="Escribí un mensaje como si fueras un cliente..."
                disabled={enviando || cargandoConversacion}
                className="w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 text-white outline-none placeholder:text-zinc-700 disabled:cursor-not-allowed"
              />

              <div className="mt-3 flex flex-col justify-between gap-3 border-t border-zinc-900 pt-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <span>Enter para enviar</span>
                  <span>Shift + Enter para otra línea</span>
                  <span>{mensaje.length}/4000</span>
                </div>

                <Button
                  onClick={() => void enviarMensaje()}
                  disabled={
                    enviando ||
                    cargandoConversacion ||
                    !mensaje.trim()
                  }
                >
                  {enviando ? "Enviando..." : "Enviar mensaje"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function DatoAgente({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-600">
        {etiqueta}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-300">
        {valor}
      </p>
    </div>
  );
}