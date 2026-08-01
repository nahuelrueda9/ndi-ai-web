"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type TemaWidget = "oscuro" | "claro";
type PosicionWidget = "derecha" | "izquierda";
type FormaWidget = "redondo" | "cuadrado";

interface Empresa {
  nombre?: string;
  userId: string;
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
}

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

export default function WidgetPage() {
  const params = useParams();
  const router = useRouter();

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string | undefined);

  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nombreBot, setNombreBot] = useState(CONFIG_INICIAL.nombreBot);
  const [mensajeBienvenida, setMensajeBienvenida] = useState(
    CONFIG_INICIAL.mensajeBienvenida
  );
  const [colorPrincipal, setColorPrincipal] = useState(
    CONFIG_INICIAL.colorPrincipal
  );
  const [tema, setTema] = useState<TemaWidget>(CONFIG_INICIAL.tema);
  const [posicion, setPosicion] = useState<PosicionWidget>(
    CONFIG_INICIAL.posicion
  );
  const [formaBoton, setFormaBoton] = useState<FormaWidget>(
    CONFIG_INICIAL.formaBoton
  );
  const [textoPlaceholder, setTextoPlaceholder] = useState(
    CONFIG_INICIAL.textoPlaceholder
  );
  const [mostrarMarca, setMostrarMarca] = useState(
    CONFIG_INICIAL.mostrarMarca
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!empresaId) {
        setError("No se encontró el ID de la empresa.");
        setCargando(false);
        return;
      }

      setUser(currentUser);
      setCargando(true);
      setError("");

      try {
        const referencia = doc(db, "companies", empresaId);
        const resultado = await getDoc(referencia);

        if (!resultado.exists()) {
          setError("La empresa no existe.");
          return;
        }

        const empresa = resultado.data() as Empresa;

        if (empresa.userId !== currentUser.uid) {
          setError("No tenés permiso para acceder a esta empresa.");
          return;
        }

        setNombreEmpresa(empresa.nombre || "Empresa");
        setNombreBot(
          empresa.widget?.nombreBot ||
            empresa.nombre ||
            CONFIG_INICIAL.nombreBot
        );
        setMensajeBienvenida(
          empresa.widget?.mensajeBienvenida ||
            CONFIG_INICIAL.mensajeBienvenida
        );
        setColorPrincipal(
          empresa.widget?.colorPrincipal || CONFIG_INICIAL.colorPrincipal
        );
        setTema(empresa.widget?.tema || CONFIG_INICIAL.tema);
        setPosicion(empresa.widget?.posicion || CONFIG_INICIAL.posicion);
        setFormaBoton(
          empresa.widget?.formaBoton || CONFIG_INICIAL.formaBoton
        );
        setTextoPlaceholder(
          empresa.widget?.textoPlaceholder ||
            CONFIG_INICIAL.textoPlaceholder
        );
        setMostrarMarca(
          empresa.widget?.mostrarMarca ?? CONFIG_INICIAL.mostrarMarca
        );
      } catch (firebaseError) {
        console.error("Error al cargar el widget:", firebaseError);
        setError("No se pudo cargar la configuración del widget.");
      } finally {
        setCargando(false);
      }
    });

    return () => unsubscribe();
  }, [empresaId, router]);

  const codigoInstalacion = useMemo(() => {
    const idSeguro = empresaId || "TU_EMPRESA_ID";
    const origen =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://tu-dominio.com";

    return `<script
  src="${origen}/widget.js"
  data-empresa-id="${idSeguro}"
  async
></script>`;
  }, [empresaId]);

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigoInstalacion);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch (copyError) {
      console.error("No se pudo copiar el código:", copyError);
      setError("No se pudo copiar el código.");
    }
  }

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium text-white">
            Cargando configuración del widget...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>

          <button
            type="button"
            onClick={() => router.push("/empresas")}
            className="mt-5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Volver a empresas
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8">
        <button
          type="button"
          onClick={() => router.push(`/empresas/${empresaId}`)}
          className="mb-4 text-sm text-zinc-500 transition hover:text-white"
        >
          ← Volver a configuración
        </button>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">Widget web</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Instalá tu asistente
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Copiá una sola línea de código y pegala en la web de{" "}
              {nombreEmpresa}. NDI AI crea el chat automáticamente.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Widget disponible
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Código de instalación
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Pegalo antes del cierre de la etiqueta{" "}
                  <code className="rounded bg-zinc-950 px-1.5 py-0.5 text-zinc-300">
                    body
                  </code>{" "}
                  de la página.
                </p>
              </div>

              <span className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400">
                SCRIPT
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <pre className="max-h-72 overflow-auto p-4 text-sm leading-6 text-zinc-300">
                <code>{codigoInstalacion}</code>
              </pre>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all text-xs text-zinc-500">
                Empresa: {empresaId}
              </p>

              <button
                type="button"
                onClick={copiarCodigo}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {copiado ? "Código copiado" : "Copiar código"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">
              Cómo instalarlo
            </h2>

            <div className="mt-5 space-y-4">
              <Paso
                numero="1"
                titulo="Copiá el código"
                descripcion="Usá el botón de arriba para copiar el script completo."
              />
              <Paso
                numero="2"
                titulo="Pegalo en la web"
                descripcion="Colocalo antes de </body> en el HTML del sitio."
              />
              <Paso
                numero="3"
                titulo="Publicá los cambios"
                descripcion="Al abrir la página aparecerá el botón del chat automáticamente."
              />
            </div>

            <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-300">
                Compatible con páginas HTML, WordPress, Tiendanube y la mayoría
                de los constructores que permiten código personalizado.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">
              Configuración aplicada
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Estos valores se cargan desde la empresa guardada en Firestore.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Dato label="Nombre del bot" value={nombreBot} />
              <Dato label="Tema" value={tema} />
              <Dato label="Posición" value={posicion} />
              <Dato label="Forma del botón" value={formaBoton} />
              <Dato label="Texto del campo" value={textoPlaceholder} />
              <Dato
                label="Marca de NDI AI"
                value={mostrarMarca ? "Visible" : "Oculta"}
              />
            </div>

            <button
              type="button"
              onClick={() => router.push(`/empresas/${empresaId}`)}
              className="mt-5 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Editar apariencia
            </button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">Vista previa</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Apariencia guardada en Firestore.
                </p>
              </div>

              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                En vivo
              </span>
            </div>

            <div className="relative mt-5 min-h-[580px] overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(to_bottom,_#18181b,_#09090b)]">
              <div className="absolute inset-x-5 top-5">
                <div className="h-3 w-28 rounded-full bg-zinc-800" />
                <div className="mt-3 h-2.5 w-44 rounded-full bg-zinc-800/70" />
                <div className="mt-2 h-2.5 w-36 rounded-full bg-zinc-800/50" />
              </div>

              <div
                className={`absolute bottom-24 w-[calc(100%-2rem)] overflow-hidden rounded-2xl border shadow-2xl ${
                  posicion === "derecha" ? "right-4" : "left-4"
                } ${
                  tema === "oscuro"
                    ? "border-zinc-700 bg-zinc-950"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4 text-white"
                  style={{ backgroundColor: colorPrincipal }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    ✦
                  </div>

                  <div>
                    <p className="font-semibold">{nombreBot}</p>
                    <p className="text-xs text-white/80">En línea ahora</p>
                  </div>
                </div>

                <div
                  className={`space-y-4 p-4 ${
                    tema === "oscuro" ? "bg-zinc-950" : "bg-zinc-50"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm ${
                      tema === "oscuro"
                        ? "bg-zinc-900 text-zinc-300"
                        : "bg-white text-zinc-700 shadow-sm"
                    }`}
                  >
                    {mensajeBienvenida}
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                      tema === "oscuro"
                        ? "border-zinc-800 bg-zinc-900"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span
                      className={`flex-1 truncate text-xs ${
                        tema === "oscuro"
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      {textoPlaceholder}
                    </span>

                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: colorPrincipal }}
                    >
                      ↑
                    </div>
                  </div>

                  {mostrarMarca && (
                    <p
                      className={`text-center text-[10px] ${
                        tema === "oscuro"
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      Creado con NDI AI
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Abrir vista previa del chat"
                className={`absolute bottom-4 flex h-14 w-14 items-center justify-center text-xl text-white shadow-xl ${
                  posicion === "derecha" ? "right-4" : "left-4"
                } ${
                  formaBoton === "redondo" ? "rounded-full" : "rounded-2xl"
                }`}
                style={{ backgroundColor: colorPrincipal }}
              >
                💬
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Paso({
  numero,
  titulo,
  descripcion,
}: {
  numero: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {numero}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{titulo}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{descripcion}</p>
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 capitalize text-sm font-medium text-zinc-200">
        {value}
      </p>
    </div>
  );
}