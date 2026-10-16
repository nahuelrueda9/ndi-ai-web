"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { 
  Palette, 
  Laptop, 
  ArrowLeft, 
  MessageCircle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ShoppingBag,
  Globe,
  Share2
} from "lucide-react";

const WHATSAPP_NUMERO = "5493886575664";

export default function EmpezarProyectoPage() {
  const [tipoServicio, setTipoServicio] = useState<"grafico" | "web" | null>(null);

  const opcionesGrafico = [
    "Identidad visual y logotipo",
    "Diseño publicitario / Redes sociales",
    "Folletería, catálogos o editorial",
    "Packaging o etiquetas",
    "Otro proyecto de diseño gráfico",
  ];

  const opcionesWeb = [
    "Sitio web institucional o corporativo",
    "Catálogo online / Tienda de productos",
    "Menú o carta digital para gastronomía",
    "Sistema de turnos para estética / barbería",
    "Landing page promocional",
  ];

  const generarLinkWhatsApp = (servicio: string, detalle?: string) => {
    let mensaje = `¡Hola Nahuel! Quiero empezar un proyecto de *${servicio}*.`;
    if (detalle) {
      mensaje += ` Específicamente me interesa: *${detalle}*.`;
    }
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-[#0c0d0e] dark:text-zinc-100 flex flex-col justify-between selection:bg-[var(--brand)] selection:text-white">
      {/* HEADER SIMPLE */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#0c0d0e]/80">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={24}
                height={24}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">
              NDI <span className="font-normal text-zinc-500">| Proyectos</span>
            </span>
          </Link>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-16 my-auto">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
            <span>Atención personalizada</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            ¿Qué tipo de proyecto querés iniciar?
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Elegí la rama principal para coordinar los detalles a la medida de lo que estás buscando.
          </p>
        </div>

        {/* TARJETAS DE SELECCIÓN */}
        {!tipoServicio ? (
          <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            {/* OPCIÓN 1: DISEÑO GRÁFICO */}
            <button
              type="button"
              onClick={() => setTipoServicio("grafico")}
              className="group relative flex flex-col justify-between rounded-3xl border-2 border-zinc-200 bg-white p-6 sm:p-8 text-left shadow-xs transition-all hover:border-[var(--brand)] hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-[var(--brand)] cursor-pointer"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                  <Palette className="h-7 w-7" />
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">
                  Diseño Gráfico
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Identidad visual, logotipos, cartelería, piezas para redes sociales, manuales de marca y material publicitario o impreso.
                </p>

                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    <span>Archivos listos para imprenta y digitales</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    <span>Formatos editables y vectoriales</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                <span>Elegir Diseño Gráfico</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* OPCIÓN 2: DISEÑO WEB */}
            <button
              type="button"
              onClick={() => setTipoServicio("web")}
              className="group relative flex flex-col justify-between rounded-3xl border-2 border-zinc-200 bg-white p-6 sm:p-8 text-left shadow-xs transition-all hover:border-[var(--brand)] hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-[var(--brand)] cursor-pointer"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                  <Laptop className="h-7 w-7" />
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">
                  Diseño Web
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Páginas web modernas, catálogos online, menús digitales con pedidos a WhatsApp y webs adaptadas 100% a celulares.
                </p>

                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Diseño adaptable a móviles y PC</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Panel autogestionable y carga rápida</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                <span>Elegir Diseño Web</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>
        ) : (
          /* PANTALLA SECUNDARIA: SELECCIÓN RÁPIDA O CONSULTA DIRECTA */
          <div className="mt-8 max-w-xl mx-auto rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${tipoServicio === "grafico" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                  {tipoServicio === "grafico" ? <Palette className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    {tipoServicio === "grafico" ? "Proyecto de Diseño Gráfico" : "Proyecto de Diseño Web"}
                  </h3>
                  <p className="text-xs text-zinc-500">¿Qué estás necesitando específicamente?</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTipoServicio(null)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {(tipoServicio === "grafico" ? opcionesGrafico : opcionesWeb).map((opcion) => (
                <a
                  key={opcion}
                  href={generarLinkWhatsApp(tipoServicio === "grafico" ? "Diseño Gráfico" : "Diseño Web", opcion)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 hover:bg-[var(--brand)]/10 hover:border-[var(--brand)]/40 transition dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-[var(--brand)]/10"
                >
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{opcion}</span>
                  <MessageCircle className="h-4 w-4 text-[var(--brand)] shrink-0 ml-2" />
                </a>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <a
                href={generarLinkWhatsApp(tipoServicio === "grafico" ? "Diseño Gráfico" : "Diseño Web")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:opacity-90 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Consultar directamente por WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER SIMPLE */}
      <footer className="py-4 text-center text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60">
        <p>© 2026 NDI | Diseño & Web • Ledesma, Jujuy</p>
      </footer>
    </main>
  );
}