"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MessageCircle,
  Moon,
  Package,
  QrCode,
  Sparkles,
  Sun,
  UserRoundCheck,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";

const problemas = [
  "Clientes preguntando precios por privado que no terminan comprando",
  "Consultas que entran a deshora y quedan sin responder",
  "Precios e información desactualizada repartida entre publicaciones",
  "Turnos y pedidos anotados a mano que generan confusiones",
  "Depender únicamente de Instagram sin tener un sitio propio",
  "Falta de imagen profesional frente a negocios que sí tienen su web",
];

const funciones = [
  {
    titulo: "Diseño Web Profesional",
    descripcion:
      "Una página moderna y adaptada a la identidad visual de tu marca, con tus colores, logo y fotos de calidad.",
    icono: Building2,
  },
  {
    titulo: "Catálogo & Menú Digital",
    descripcion:
      "Exhibí tus productos, platos o servicios con fotos, descripciones claras y precios actualizados al instante.",
    icono: Package,
  },
  {
    titulo: "Turnos y Reservas Online",
    descripcion:
      "Tus clientes reservan su cita o mesa en horarios disponibles sin tener que coordinar manualmente por mensaje.",
    icono: CalendarDays,
  },
  {
    titulo: "Conexión Directa a WhatsApp",
    descripcion:
      "Los pedidos y consultas llegan a tu WhatsApp con el detalle exacto de lo que el cliente seleccionó.",
    icono: MessageCircle,
  },
  {
    titulo: "Cobros Online Integrados",
    descripcion:
      "Facilitá transferencias directas (CVU/Alias) o cobros con Mercado Pago para confirmar pedidos al instante.",
    icono: FileText,
  },
  {
    titulo: "Acceso Rápido por Código QR",
    descripcion:
      "Generamos tu código QR para colocar en mesas, vidrieras, folletos o tarjetas de presentación.",
    icono: QrCode,
  },
];

const pasos = [
  {
    numero: "01",
    titulo: "Coordinamos tu proyecto",
    descripcion:
      "Nos contás sobre tu negocio, tus productos o servicios y definimos la estructura ideal para tu web.",
  },
  {
    numero: "02",
    titulo: "Diseñamos y cargamos todo",
    descripcion:
      "Configuramos la identidad visual, fotos, lista de precios, horarios de atención y botones de contacto.",
  },
  {
    numero: "03",
    titulo: "Tu página online",
    descripcion:
      "Publicamos tu sitio en 24 a 48 hs hábiles con certificado de seguridad SSL y link listo para compartir.",
  },
  {
    numero: "04",
    titulo: "Administración simple",
    descripcion:
      "Tenés acceso a tu panel para cambiar precios, pausar ítems o sumar novedades cuando lo necesites.",
  },
];

const faqs = [
  {
    pregunta: "¿Cuánto tiempo tarda en estar lista mi página web?",
    respuesta:
      "Si elegís configurarla desde el panel, tenés acceso instantáneo. Si elegís el armado asistido con nosotros, te la entregamos 100% lista y publicada en un plazo de 24 a 48 horas hábiles.",
  },
  {
    pregunta: "¿Puedo actualizar los precios, fotos o servicios después?",
    respuesta:
      "Sí, totalmente. Contás con un panel de administración autogestionable disponible las 24 hs para cambiar precios, pausar productos o editar horarios sin costos extras.",
  },
  {
    pregunta: "¿Necesito conocimientos técnicos o de programación?",
    respuesta:
      "Para nada. El panel es intuitivo y pensado para dueños de negocios. Además, nuestro equipo se encarga de la puesta en marcha inicial por vos.",
  },
  {
    pregunta: "¿Qué medios de pago aceptan para la contratación?",
    respuesta:
      "Aceptamos transferencias bancarias (CVU / Alias) y pagos con Mercado Pago. Una vez confirmado el pago de la puesta en marcha, comenzamos con tu proyecto de inmediato.",
  },
  {
    pregunta: "¿La página incluye seguridad SSL (HTTPS)?",
    respuesta:
      "Sí, todas las páginas cuentan con certificado de seguridad SSL cifrado (HTTPS) incluido sin costo adicional, garantizando una navegación segura y profesional.",
  },
];

const planSimple = [
  "Página web profesional a medida",
  "Logo, portada, colores e identidad visual",
  "Información completa del negocio",
  "Sistema de turnos y reservas online",
  "Reservas de estadías o mesas",
  "Consultas y pedidos por WhatsApp",
  "Horarios de atención y ubicación en mapa",
  "Enlaces directos a redes sociales",
  "Galería de fotos de alta resolución",
  "Estadísticas de visitas",
];

const planCompleta = [
  "Todo lo incluido en Página Simple",
  "Catálogo completo de productos o carta gastronómica",
  "Hasta 6 imágenes de portada",
  "Hasta 10 imágenes en galería",
  "Cobros online (Mercado Pago, CVU / Alias)",
  "Código QR exclusivo para tu local",
  "Formulario de solicitud de presupuestos",
  "Gestión de pedidos organizada",
  "Estadísticas avanzadas",
];

const planBusinessIA = [
  "Todo lo incluido en Página Completa",
  "Asistente conversacional dentro de la página",
  "Configuración personalizada con datos de tu negocio",
  "Respuestas automáticas basadas en tu información real",
  "Historial de conversaciones en el panel",
  "Captura y seguimiento de potenciales clientes",
  "Widget para insertar en otras páginas web",
  "Atención humana cuando sea necesaria",
  "Sin marca comercial en el pie de página",
];

export default function HomePage() {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const { theme, setTheme } = useTheme();

  const container3DRef = useRef<HTMLDivElement>(null);
  const [rotacion3D, setRotacion3D] = useState(18);
  const [elevacionY, setElevacionY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!container3DRef.current) return;
      const scrollY = window.scrollY;
      const nuevaRotacion = Math.max(0, 18 - scrollY * 0.035);
      const nuevaElevacion = Math.min(50, scrollY * 0.07);
      setRotacion3D(nuevaRotacion);
      setElevacionY(nuevaElevacion);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setFaqAbierta(faqAbierta === index ? null : index);
  };

  const alternarTema = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#090a0b] text-zinc-100 transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#090a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 p-1.5 shadow-md shadow-blue-600/30">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={18}
                height={18}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="text-base font-bold tracking-tight text-white">
              NDI <span className="font-normal text-zinc-400">| Diseño & Web</span>
            </p>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#funciones" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Servicios
            </a>
            <a href="#como-funciona" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Proceso
            </a>
            <a href="#planes" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Planes
            </a>
            <a href="#faq" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Preguntas
            </a>
            <a href="#contacto" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={alternarTema}
              type="button"
              aria-label="Cambiar tema"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 transition hover:bg-zinc-800"
            >
              <Sun className="h-4 w-4 hidden dark:block text-amber-400" />
              <Moon className="h-4 w-4 block dark:hidden text-zinc-300" />
            </button>

            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Quiero mi página
            </Link>
          </div>
        </div>
      </header>

      {/* HERO CENTRADO EDITORIAL */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-28 [perspective:1400px]">
        {/* Glow de profundidad sutil */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[550px] w-full max-w-6xl">
          <div className="absolute top-10 left-1/3 h-96 w-96 rounded-full bg-blue-600/15 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-6xl lg:text-[4.2rem] leading-[1.08] text-white">
            Tené tu página web{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              profesional hoy.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-lg leading-relaxed text-zinc-400 font-normal">
            Diseñamos la presencia digital de tu negocio para que vendas más, destaques de tu competencia y recibas consultas organizadas directamente en tu WhatsApp.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-zinc-950 shadow-xl transition hover:bg-zinc-200 active:scale-95"
            >
              Crear mi página
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#contacto"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 active:scale-95"
            >
              Hablar con un asesor
            </a>
          </div>
        </div>

        {/* SHOWCASE 3D: DISEÑOS REALES EN DISPOSITIVO */}
        <div
          ref={container3DRef}
          className="relative mx-auto mt-12 sm:mt-16 max-w-5xl px-3 sm:px-6 transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${rotacion3D}deg) translateY(-${elevacionY}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute inset-x-8 -bottom-8 h-20 rounded-[3rem] bg-blue-600/10 blur-2xl" />

          {/* Marco del Showcase */}
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl ring-1 ring-white/5">
            {/* Barra superior minimalista y sobria */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-5 py-3">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Proyectos reales desarrollados por NDI
              </span>
              <span className="text-xs font-semibold text-blue-400">
                Diseño responsive & a medida
              </span>
            </div>

            {/* Grilla visual con 3 estilos de webs reales creadas */}
            <div className="p-4 sm:p-6 bg-[#0c0d0e]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ejemplo 1: Gastronomía */}
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                      alt="Web Restaurante"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-white">Gastronomía & Bares</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">Carta digital, reservas de mesa y pedidos online.</p>
                  </div>
                </div>

                {/* Ejemplo 2: Indumentaria */}
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
                      alt="Web Tienda de Ropa"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-white">Tiendas & Indumentaria</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">Catálogo con talles, fotos, stock y cobros online.</p>
                  </div>
                </div>

                {/* Ejemplo 3: Servicios & Barberías */}
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
                    <img
                      src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
                      alt="Web Barbería y Estética"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-white">Estética & Profesionales</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">Agenda de turnos online 24/7 sin intermediarios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PROBLEMA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 border-t border-zinc-800/60">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
              El problema actual
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Tener solo Instagram no es suficiente para vender ordenado.
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400">
              La gente no tiene tiempo de esperar horas por una respuesta en historias o mensajes privados. Un sitio web propio le da seriedad a tu marca y permite que tus clientes vean precios, servicios y reserven de inmediato.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {problemas.map((problema) => (
              <div
                key={problema}
                className="flex items-start gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 shadow-sm"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-400">
                  ✕
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-snug">
                  {problema}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS / FUNCIONALIDADES: EXACTAMENTE 6 TARJETAS EN 2 FILAS DE 3 */}
      <section id="funciones" className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 border-t border-zinc-800/60">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
            Lo que incluye tu web
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Diseño y funcionalidad para tu negocio.
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Herramientas pensadas para simplificar tus ventas diarias.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {funciones.map(({ titulo, descripcion, icono: Icono }) => (
            <article
              key={titulo}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                <Icono className="h-5 w-5" />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-white">
                {titulo}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {descripcion}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* PROCESO */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 border-t border-zinc-800/60">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
            Paso a paso
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Cómo ponemos tu página en marcha.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map(({ numero, titulo, descripcion }) => (
            <div
              key={numero}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm"
            >
              <span className="text-xs font-black text-blue-400">
                {numero}
              </span>
              <h3 className="mt-2 text-base font-bold text-white">
                {titulo}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {descripcion}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 border-t border-zinc-800/60">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
            Planes y Precios
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Elegí cómo querés impulsar tu negocio.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400">
            Puesta en marcha inicial y mantenimiento mensual accesible.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <PlanCard
            nombre="Página Simple"
            descripcion="Para negocios y profesionales que quieren presencia web, servicios y agenda de turnos online."
            inicial="$ 89.999"
            mensual="$ 5.999/mes"
            features={planSimple}
          />

          <PlanCard
            nombre="Página Completa"
            etiqueta="Más elegido"
            descripcion="Para comercios que necesitan catálogo de productos, carta gastronómica y cobros online."
            inicial="$ 159.999"
            mensual="$ 9.999/mes"
            features={planCompleta}
            destacado
          />

          <PlanCard
            nombre="Business IA"
            etiqueta="Lanzamiento"
            descripcion="Todas las funciones de gestión más asistente conversacional para responder dudas frecuentes."
            inicial="$ 219.999"
            mensual="$ 15.999/mes"
            features={planBusinessIA}
            lanzamiento
          />
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-24 border-t border-zinc-800/60">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
            Dudas frecuentes
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            ¿Tenés preguntas? Te respondemos.
          </h2>
        </div>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => {
            const abierta = faqAbierta === index;
            return (
              <div
                key={faq.pregunta}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-zinc-200 transition hover:bg-zinc-800/50"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${abierta ? "rotate-180 text-blue-400" : ""}`} />
                </button>
                {abierta && (
                  <div className="border-t border-zinc-800 px-4 pb-4 pt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACTO Y SOPORTE OFICIAL COMPLETO */}
      <section id="contacto" className="border-t border-zinc-800/80 bg-zinc-950/60 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
                Atención directa
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Empecemos tu proyecto hoy.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Escribinos si tenés dudas específicas sobre cómo adaptar tu página o querés consultar por opciones personalizadas.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-300 sm:mt-8 sm:space-y-4">
                <a
                  href={`mailto:${CORREO_CONTACTO}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 transition hover:border-zinc-700 hover:text-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Correo electrónico</p>
                    <p className="text-xs font-semibold text-white sm:text-sm">{CORREO_CONTACTO}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Tengo una consulta sobre una página web para mi negocio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 transition hover:bg-emerald-500/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-400">WhatsApp directo</p>
                    <p className="text-xs font-semibold text-emerald-300 sm:text-sm">+54 9 388 657-5664</p>
                  </div>
                </a>

                <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-zinc-400">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Horario de atención</p>
                    <p className="text-[11px] font-medium text-zinc-300 sm:text-xs">Lunes a sábados de 09:00 a 20:00 hs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-xl sm:p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white sm:text-xl">
                ¿Listo para poner tu negocio online?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Creá tu cuenta ahora y comenzá a configurar tu catálogo, servicios y turnos.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-md shadow-blue-600/20 sm:py-3.5 sm:text-sm"
                >
                  Quiero mi página
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Quiero que me ayuden a armar mi página web.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 sm:py-3.5"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  Hablar con un asesor por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        <p>© 2026 NDI | Diseño & Web. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}

function PlanCard({
  nombre,
  etiqueta,
  descripcion,
  inicial,
  mensual,
  features,
  destacado = false,
  lanzamiento = false,
}: {
  nombre: string;
  etiqueta?: string;
  descripcion: string;
  inicial: string;
  mensual: string;
  features: string[];
  destacado?: boolean;
  lanzamiento?: boolean;
}) {
  return (
    <article
      className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 ${
        destacado
          ? "border-2 border-blue-500 bg-blue-950/20 shadow-2xl shadow-blue-950/40"
          : lanzamiento
          ? "border border-purple-500/40 bg-purple-950/20"
          : "border border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <div>
        {etiqueta && (
          <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {etiqueta}
          </span>
        )}

        <h3 className="text-xl font-bold text-white">{nombre}</h3>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{descripcion}</p>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[10px] uppercase font-bold text-zinc-500">Puesta en marcha</p>
          <p className="text-2xl sm:text-3xl font-black text-white">{inicial}</p>
          <p className="mt-1 text-xs font-bold text-blue-400">+ {mensual}</p>
        </div>

        <div className="mt-6 space-y-2.5">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5 text-xs text-zinc-300">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-zinc-800">
        <Link
          href="/register"
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
        >
          Quiero mi página
        </Link>
      </div>
    </article>
  );
}