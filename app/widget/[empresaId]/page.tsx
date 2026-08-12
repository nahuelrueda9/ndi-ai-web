"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";

type TemaWidget = "oscuro" | "claro";
type PosicionWidget = "derecha" | "izquierda";
type FormaWidget = "redondo" | "cuadrado";

type MensajeChat = {
  id: string;
  role: "user" | "assistant";
  content: string;
  enviadoPor?: "cliente" | "ia" | "humano";
  createdAt?: string | null;
};

type Empresa = {
  nombre?: string;
  descripcion?: string;
  personalidad?: string;
  objetivo?: string;
  instrucciones?: string;
  restricciones?: string;
  idioma?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  horario?: string;
  sitioWeb?: string;
  formasPago?: string;
  plan?: "free" | "pro" | "business";
  agente?: {
    nombre?: string;
    rol?: string;
    personalidad?: string;
    instrucciones?: string;
  };
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

type EstadoConversacion = {
  id?: string;
  atendidoPor?: "ia" | "humano";
  humanoActivo?: boolean;
  estado?: "abierta" | "cerrada";
};

type RespuestaCarga = {
  empresa?: Empresa;
  conversacion?: EstadoConversacion | null;
  mensajes?: MensajeChat[];
  error?: string;
};

type RespuestaEnvio = {
  conversacionId?: string;
  accessToken?: string;
  respuesta?: string | null;
  humanoActivo?: boolean;
  error?: string;
};

const CONFIG_INICIAL = {
  nombreBot: "Asistente virtual",
  mensajeBienvenida:
    "¡Hola! ¿En qué puedo ayudarte?",
  colorPrincipal: "#3b82f6",
  tema: "oscuro" as TemaWidget,
  posicion: "derecha" as PosicionWidget,
  formaBoton: "redondo" as FormaWidget,
  textoPlaceholder: "Escribí tu mensaje...",
  mostrarMarca: true,
};

const INTERVALO_ACTUALIZACION = 2500;

function obtenerVisitanteId() {
  if (typeof window === "undefined") {
    return "visitante";
  }

  const clave = "ndi-ai-visitor-id";
  const existente =
    window.localStorage.getItem(clave);

  if (existente) {
    return existente;
  }

  const nuevoId =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitante-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  window.localStorage.setItem(
    clave,
    nuevoId
  );

  return nuevoId;
}

function obtenerClaveConversacion(
  empresaId: string
) {
  return `ndi-ai-conversation-${empresaId}`;
}

function obtenerClaveToken(
  empresaId: string
) {
  return `ndi-ai-conversation-token-${empresaId}`;
}

function obtenerSesionGuardada(
  empresaId: string
) {
  if (typeof window === "undefined") {
    return {
      conversacionId: "",
      accessToken: "",
    };
  }

  return {
    conversacionId:
      window.localStorage.getItem(
        obtenerClaveConversacion(empresaId)
      ) ?? "",
    accessToken:
      window.localStorage.getItem(
        obtenerClaveToken(empresaId)
      ) ?? "",
  };
}

function guardarSesion({
  empresaId,
  conversacionId,
  accessToken,
}: {
  empresaId: string;
  conversacionId: string;
  accessToken: string;
}) {
  window.localStorage.setItem(
    obtenerClaveConversacion(empresaId),
    conversacionId
  );

  window.localStorage.setItem(
    obtenerClaveToken(empresaId),
    accessToken
  );
}

function borrarSesion(
  empresaId: string
) {
  window.localStorage.removeItem(
    obtenerClaveConversacion(empresaId)
  );

  window.localStorage.removeItem(
    obtenerClaveToken(empresaId)
  );
}

function construirUrlCarga({
  empresaId,
  conversacionId,
  accessToken,
}: {
  empresaId: string;
  conversacionId?: string;
  accessToken?: string;
}) {
  const parametros =
    new URLSearchParams({
      empresaId,
    });

  if (
    conversacionId &&
    accessToken
  ) {
    parametros.set(
      "conversacionId",
      conversacionId
    );

    parametros.set(
      "accessToken",
      accessToken
    );
  }

  return `/api/widget/chat?${parametros.toString()}`;
}

export default function WidgetPublicoPage() {
  const params = useParams();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const [empresa, setEmpresa] =
    useState<Empresa | null>(null);

  const [mensajes, setMensajes] =
    useState<MensajeChat[]>([]);

  const [texto, setTexto] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    conversacionId,
    setConversacionId,
  ] = useState("");

  const [accessToken, setAccessToken] =
    useState("");

  const [chatAbierto, setChatAbierto] =
    useState(true);

  const [
    estadoConversacion,
    setEstadoConversacion,
  ] = useState<EstadoConversacion>({
    atendidoPor: "ia",
    humanoActivo: false,
    estado: "abierta",
  });

  const finalChatRef =
    useRef<HTMLDivElement | null>(null);

  const actualizandoRef =
    useRef(false);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const estiloAislado = document.createElement("style");
    estiloAislado.setAttribute("data-ndi-widget-isolation", "true");
    estiloAislado.textContent = `
      html,
      body {
        background: transparent !important;
        background-color: transparent !important;
        color-scheme: normal !important;
      }

      body {
        margin: 0 !important;
        overflow: hidden !important;
      }
    `;

    document.head.appendChild(estiloAislado);

    const htmlColorSchemeAnterior = html.style.colorScheme;
    const bodyColorSchemeAnterior = body.style.colorScheme;

    html.style.colorScheme = "normal";
    body.style.colorScheme = "normal";

    return () => {
      estiloAislado.remove();
      html.style.colorScheme = htmlColorSchemeAnterior;
      body.style.colorScheme = bodyColorSchemeAnterior;
    };
  }, []);

  function enviarMensajeAlContenedor(
    type:
      | "widget:position"
      | "widget:resize",
    payload: Record<
      string,
      string | number
    >
  ) {
    if (
      typeof window === "undefined" ||
      window.parent === window
    ) {
      return;
    }

    window.parent.postMessage(
      {
        source: "ndi-ai-widget",
        type,
        ...payload,
      },
      window.location.origin
    );
  }

  async function cargarDatos({
    mostrarCarga = false,
    conversacionIdActual,
    accessTokenActual,
  }: {
    mostrarCarga?: boolean;
    conversacionIdActual?: string;
    accessTokenActual?: string;
  } = {}) {
    if (!empresaId) {
      setError(
        "No se encontró el ID de la empresa."
      );
      setCargando(false);
      return;
    }

    if (actualizandoRef.current) {
      return;
    }

    actualizandoRef.current = true;

    if (mostrarCarga) {
      setCargando(true);
    }

    try {
      const sesion =
        obtenerSesionGuardada(empresaId);

      const id =
        conversacionIdActual ??
        conversacionId ??
        sesion.conversacionId;

      const token =
        accessTokenActual ??
        accessToken ??
        sesion.accessToken;

      const respuesta = await fetch(
        construirUrlCarga({
          empresaId,
          conversacionId: id,
          accessToken: token,
        }),
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const datos =
        (await respuesta.json()) as RespuestaCarga;

      if (!respuesta.ok) {
        if (
          respuesta.status === 403 &&
          id
        ) {
          borrarSesion(empresaId);
          setConversacionId("");
          setAccessToken("");
          setMensajes([]);
          setEstadoConversacion({
            atendidoPor: "ia",
            humanoActivo: false,
            estado: "abierta",
          });

          const respuestaNueva =
            await fetch(
              construirUrlCarga({
                empresaId,
              }),
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const datosNuevos =
            (await respuestaNueva.json()) as RespuestaCarga;

          if (!respuestaNueva.ok) {
            throw new Error(
              datosNuevos.error ||
                "No se pudo cargar el asistente."
            );
          }

          setEmpresa(
            datosNuevos.empresa ?? null
          );

          return;
        }

        throw new Error(
          datos.error ||
            "No se pudo cargar el asistente."
        );
      }

      if (datos.empresa) {
        setEmpresa(datos.empresa);
      }

      if (datos.conversacion) {
        setEstadoConversacion(
          datos.conversacion
        );
      }

      if (
        Array.isArray(datos.mensajes)
      ) {
        setMensajes(datos.mensajes);
      }

      setError("");
    } catch (requestError) {
      console.error(
        "Error al cargar el widget:",
        requestError
      );

      if (mostrarCarga || !empresa) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el asistente."
        );
      }
    } finally {
      actualizandoRef.current = false;

      if (mostrarCarga) {
        setCargando(false);
      }
    }
  }

  useEffect(() => {
    if (!empresaId) {
      setError(
        "No se encontró el ID de la empresa."
      );
      setCargando(false);
      return;
    }

    const sesion =
      obtenerSesionGuardada(empresaId);

    setConversacionId(
      sesion.conversacionId
    );

    setAccessToken(
      sesion.accessToken
    );

    void cargarDatos({
      mostrarCarga: true,
      conversacionIdActual:
        sesion.conversacionId,
      accessTokenActual:
        sesion.accessToken,
    });
  }, [empresaId]);

  useEffect(() => {
    if (
      !empresaId ||
      !conversacionId ||
      !accessToken
    ) {
      return;
    }

    const intervalo =
      window.setInterval(() => {
        if (
          document.visibilityState ===
            "visible" &&
          !enviando
        ) {
          void cargarDatos({
            conversacionIdActual:
              conversacionId,
            accessTokenActual:
              accessToken,
          });
        }
      }, INTERVALO_ACTUALIZACION);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    empresaId,
    conversacionId,
    accessToken,
    enviando,
  ]);

  useEffect(() => {
    if (!empresa) {
      return;
    }

    const posicionWidget =
      empresa.widget?.posicion ||
      CONFIG_INICIAL.posicion;

    enviarMensajeAlContenedor(
      "widget:position",
      {
        position:
          posicionWidget === "izquierda"
            ? "left"
            : "right",
      }
    );
  }, [empresa]);

  useEffect(() => {
    enviarMensajeAlContenedor(
      "widget:resize",
      {
        width: chatAbierto ? 430 : 88,
        height: chatAbierto ? 700 : 88,
      }
    );
  }, [chatAbierto]);

  useEffect(() => {
    const avisarAlContenedor = () => {
      enviarMensajeAlContenedor(
        "widget:resize",
        {
          width: chatAbierto ? 430 : 88,
          height: chatAbierto ? 700 : 88,
        }
      );
    };

    window.addEventListener(
      "load",
      avisarAlContenedor
    );

    window.setTimeout(
      avisarAlContenedor,
      100
    );

    return () => {
      window.removeEventListener(
        "load",
        avisarAlContenedor
      );
    };
  }, [chatAbierto]);

  useEffect(() => {
    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [mensajes, enviando]);

  async function enviarMensaje(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    const mensajeLimpio =
      texto.trim();

    if (
      !empresaId ||
      !mensajeLimpio ||
      enviando ||
      !empresa
    ) {
      return;
    }

    setTexto("");
    setEnviando(true);
    setError("");

    const mensajeTemporal: MensajeChat = {
      id: `temporal-${Date.now()}`,
      role: "user",
      content: mensajeLimpio,
      enviadoPor: "cliente",
      createdAt:
        new Date().toISOString(),
    };

    setMensajes((actuales) => [
      ...actuales,
      mensajeTemporal,
    ]);

    try {
      const respuesta = await fetch(
        "/api/widget/chat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            empresaId,
            conversacionId:
              conversacionId || undefined,
            accessToken:
              accessToken || undefined,
            visitanteId:
              obtenerVisitanteId(),
            mensaje: mensajeLimpio,
          }),
        }
      );

      const datos =
        (await respuesta.json()) as RespuestaEnvio;

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo enviar el mensaje."
        );
      }

      const nuevoId =
        datos.conversacionId ?? "";

      const nuevoToken =
        datos.accessToken ?? "";

      if (
        nuevoId &&
        nuevoToken
      ) {
        guardarSesion({
          empresaId,
          conversacionId: nuevoId,
          accessToken: nuevoToken,
        });

        setConversacionId(nuevoId);
        setAccessToken(nuevoToken);
      }

      setEstadoConversacion(
        (actual) => ({
          ...actual,
          id: nuevoId || actual.id,
          atendidoPor:
            datos.humanoActivo === true
              ? "humano"
              : "ia",
          humanoActivo:
            datos.humanoActivo === true,
          estado: "abierta",
        })
      );

      await cargarDatos({
        conversacionIdActual:
          nuevoId || conversacionId,
        accessTokenActual:
          nuevoToken || accessToken,
      });
    } catch (requestError) {
      console.error(
        "Error al enviar el mensaje:",
        requestError
      );

      setMensajes((actuales) =>
        actuales.filter(
          (mensaje) =>
            mensaje.id !==
            mensajeTemporal.id
        )
      );

      setTexto(mensajeLimpio);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo enviar el mensaje."
      );
    } finally {
      setEnviando(false);
    }
  }

  function manejarTecla(
    event:
      KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        texto.trim() &&
        !enviando
      ) {
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

  if (!empresa) {
    return null;
  }

  const nombreBot =
    empresa.widget?.nombreBot ||
    empresa.agente?.nombre ||
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
    (empresa.plan || "free") === "free";

  const posicion =
    empresa.widget?.posicion ||
    CONFIG_INICIAL.posicion;

  const formaBoton =
    empresa.widget?.formaBoton ||
    CONFIG_INICIAL.formaBoton;

  const temaOscuro =
    tema === "oscuro";

  const humanoActivo =
    estadoConversacion.humanoActivo ===
      true ||
    estadoConversacion.atendidoPor ===
      "humano";

  const conversacionCerrada =
    estadoConversacion.estado ===
    "cerrada";

  if (!chatAbierto) {
    return (
      <main
        className={`flex min-h-screen items-end overflow-hidden bg-transparent p-3 ${
          posicion === "izquierda"
            ? "justify-start"
            : "justify-end"
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setChatAbierto(true)
          }
          aria-label="Abrir chat"
          className={`flex h-14 w-14 items-center justify-center text-xl text-white shadow-2xl transition hover:scale-105 active:scale-95 ${
            formaBoton === "redondo"
              ? "rounded-full"
              : "rounded-2xl"
          }`}
          style={{
            backgroundColor:
              colorPrincipal,
          }}
        >
          💬
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-end justify-center overflow-hidden bg-transparent p-3 sm:p-4">
      <section
        className={[
          "flex h-[min(680px,calc(100vh-24px))] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border shadow-2xl sm:h-[min(680px,calc(100vh-32px))]",
          temaOscuro
            ? "border-zinc-700 bg-zinc-950"
            : "border-zinc-200 bg-white",
        ].join(" ")}
      >
        <header
          className="flex items-center gap-3 px-4 py-4 text-white"
          style={{
            backgroundColor:
              colorPrincipal,
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">
            {humanoActivo ? "👤" : "✦"}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">
              {humanoActivo
                ? "Soporte humano"
                : nombreBot}
            </h1>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  conversacionCerrada
                    ? "bg-zinc-300"
                    : "bg-emerald-300"
                }`}
              />

              <p className="text-xs text-white/80">
                {conversacionCerrada
                  ? "Conversación cerrada"
                  : humanoActivo
                  ? "Una persona está atendiendo"
                  : "Asistente en línea"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setChatAbierto(false)
            }
            aria-label="Minimizar chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl leading-none text-white transition hover:bg-white/25"
          >
            −
          </button>
        </header>

        <div
          className={[
            "flex-1 space-y-4 overflow-y-auto px-4 py-5",
            temaOscuro
              ? "bg-zinc-950"
              : "bg-zinc-50",
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
            const esUsuario =
              mensaje.role === "user";

            const esHumano =
              mensaje.enviadoPor ===
              "humano";

            const esTemporal =
              mensaje.id.startsWith(
                "temporal-"
              );

            return (
              <div
                key={mensaje.id}
                className={`flex ${
                  esUsuario
                    ? "justify-end"
                    : "justify-start"
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
                      {esHumano
                        ? "Soporte"
                        : nombreBot}
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
                      esTemporal
                        ? "opacity-70"
                        : "",
                    ].join(" ")}
                    style={
                      esUsuario
                        ? {
                            backgroundColor:
                              colorPrincipal,
                          }
                        : undefined
                    }
                  >
                    {mensaje.content}
                  </div>
                </div>
              </div>
            );
          })}

          {enviando &&
            !humanoActivo && (
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

          {enviando &&
            humanoActivo && (
              <p
                className={[
                  "text-center text-xs",
                  temaOscuro
                    ? "text-zinc-500"
                    : "text-zinc-400",
                ].join(" ")}
              >
                Mensaje enviado. Soporte te
                responderá por acá.
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
              Estás hablando con una persona
              del equipo.
            </p>
          )}

          {conversacionCerrada && (
            <p
              className={[
                "mb-2 rounded-lg px-3 py-2 text-xs",
                temaOscuro
                  ? "bg-zinc-900 text-zinc-400"
                  : "bg-zinc-100 text-zinc-600",
              ].join(" ")}
            >
              Esta conversación fue cerrada.
              Al enviar un mensaje se abrirá
              nuevamente.
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
              onChange={(event) =>
                setTexto(
                  event.target.value
                )
              }
              onKeyDown={manejarTecla}
              placeholder={
                textoPlaceholder
              }
              rows={1}
              maxLength={2000}
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
              disabled={
                !texto.trim() ||
                enviando
              }
              aria-label="Enviar mensaje"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor:
                  colorPrincipal,
              }}
            >
              ↑
            </button>
          </form>

          {mostrarMarca && (
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={[
                "mt-2 block text-center text-[10px] transition hover:underline",
                temaOscuro
                  ? "text-zinc-500 hover:text-zinc-300"
                  : "text-zinc-500 hover:text-zinc-700",
              ].join(" ")}
            >
              Creado con NDI AI · Conocé más
            </a>
          )}
        </footer>
      </section>
    </main>
  );
}