"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Palette,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  UserCheck,
  UtensilsCrossed,
  ShoppingBag,
  Scissors,
  Stethoscope,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";
const BEHANCE_URL = "https://www.behance.net/nahuelrueda";

const proyectosShowcase = [
  {
    id: "restaurantes",
    label: "Restaurantes",
    icono: UtensilsCrossed,
    titulo: "Sabores del Norte",
    categoria: "Gastronomía & Bares",
    subtitulo: "Menú digital interactivo con pedidos directos a WhatsApp, fotos de platos y reserva de mesas.",
    portada: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80",
    badge: "Carta & Pedidos",
    esReal: false,
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Gastronomía y Bares.")}`,
    caracteristicas: ["Carta con fotos y precios", "Pedidos listos a WhatsApp"],
  },
  {
    id: "tiendas",
    label: "Tiendas",
    icono: ShoppingBag,
    titulo: "Norte Store",
    categoria: "Indumentaria & Productos",
    subtitulo: "Catálogo online con variantes de talles, colores, stock en tiempo real y cobros integrados.",
    portada: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80",
    badge: "Catálogo Online",
    esReal: false,
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Tiendas e Indumentaria.")}`,
    caracteristicas: ["Control de talles y stock", "Cobros con CVU y Mercado Pago"],
  },
  {
    id: "belleza",
    label: "Barberías & Salones",
    icono: Scissors,
    titulo: "Black Crown Studio",
    categoria: "Barberías & Estética",
    subtitulo: "Agenda de turnos online disponible las 24 horas para que el cliente elija servicio y horario sin esperas.",
    portada: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=80",
    badge: "Turnos 24/7",
    esReal: false,
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Barberías y Salones.")}`,
    caracteristicas: ["Turnos confirmados al instante", "Agenda autogestionable"],
  },
  {
    id: "consultorios",
    label: "Consultorios",
    icono: Stethoscope,
    titulo: "Centro Médico & Salud",
    categoria: "Consultorios & Profesionales",
    subtitulo: "Gestión de citas previas, información de especialidades, ubicación en mapa y contacto directo.",
    portada: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1800&q=80",
    badge: "Atención Profesional",
    esReal: false,
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Consultorios Profesionales.")}`,
    caracteristicas: ["Citas y horarios disponibles", "Ubicación en Google Maps"],
  },
];

const beneficios = [
  {
    titulo: "Diseño gráfico profesional",
    detalle: "Tu web con estética cuidada, colores combinados y piezas visuales que dan confianza real a tus clientes.",
  },
  {
    titulo: "Catálogo o menú al día",
    detalle: "Cambiás fotos y precios desde tu celu cuando quieras, sin depender de nadie ni pagar de más.",
  },
  {
    titulo: "Pedidos y turnos organizados",
    detalle: "Te llega el detalle exacto de lo que el cliente quiere a tu WhatsApp, sin idas y vueltas interminables.",
  },
  {
    titulo: "Presencia seria en Google y redes",
    detalle: "Un link propio con tu marca para poner en Instagram, TikTok y Google Maps.",
  },
];

const faqs = [
  {
    pregunta: "¿Cómo es el proceso de trabajo?",
    respuesta:
      "Coordinamos por WhatsApp, me pasás la información y fotos de tu negocio, y me pongo a diseñar tanto la parte gráfica como la web. Vamos revisando avances hasta que quede exactamente como querés.",
  },
  {
    pregunta: "¿Puedo cambiar precios y fotos después?",
    respuesta:
      "Sí, totalmente. Tenés tu propio panel para editar lo que quieras las 24 horas desde la compu o el celular, sin tener que pagarle a nadie para actualizar un precio.",
  },
  {
    pregunta: "¿También hacés diseño gráfico para redes o logos?",
    respuesta:
      "Sí, desarrollo identidades visuales, logotipos, piezas gráficas para redes sociales y banners comerciales. Podés ver parte de mis proyectos gráficos en mi portfolio de Behance.",
  },
  {
    pregunta: "¿Cómo se abona?",
    respuesta:
      "Podés pagar por transferencia bancaria (CVU / Alias) o con tarjeta mediante Mercado Pago.",
  },
  {
    pregunta: "¿Tiene costo de mantenimiento?",
    respuesta:
      "Sí, un abono mensual accesible que cubre el servidor rápido, certificado de seguridad HTTPS, actualizaciones técnicas y soporte directo conmigo.",
  },
];

const planSimple = [
  "Página web profesional a medida",
  "Diseño gráfico adaptado a tu marca",
  "Información completa del negocio",
  "Sistema de turnos y reservas online",
  "Consultas y pedidos por WhatsApp",
  "Horarios de atención y mapa interactivo",
  "Enlaces a redes sociales y galería",
  "Estadísticas de visitas",
];

const planCompleta = [
  "Todo lo incluido en Página Simple",
  "Catálogo completo de productos o carta gastronómica",
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
  "Widget para insertar en otras webs",
  "Sin marca comercial en el pie de página",
];

export default function HomePage() {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const [mostrarBotonHeader, setMostrarBotonHeader] = useState(false);
  const [errorFotoNahuel, setErrorFotoNahuel] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleFaq = (index: number) => {
    setFaqAbierta(faqAbierta === index ? null : index);
  };

  useEffect(() => {
    const onScroll = () => {
      setMostrarBotonHeader(window.scrollY > 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const alternarTema = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-[#0c0d0e] dark:text-zinc-100 selection:bg-[var(--brand)] selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl transition-colors dark:border-zinc-800/80 dark:bg-[#0c0d0e]/90">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3.5 sm:px-8 gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] p-1 shadow-xs shadow-blue-500/20">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={16}
                height={16}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap">
              NDI <span className="font-normal text-zinc-500 dark:text-zinc-400">| Diseño & Web</span>
            </p>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#servicios" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Servicios
            </a>
            <a href="#trabajos" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Ejemplos
            </a>
            <a href="#quien-soy" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Quién soy
            </a>
            <a
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)] hover:underline"
            >
              Portfolio Behance ↗
            </a>
            <a href="#planes" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Planes
            </a>
            <a href="#contacto" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={alternarTema}
              type="button"
              aria-label="Cambiar tema"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Sun className="h-4 w-4 hidden dark:block text-amber-400" />
              <Moon className="h-4 w-4 block dark:hidden text-zinc-700" />
            </button>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 whitespace-nowrap"
            >
              Iniciar sesión
            </Link>

            {mostrarBotonHeader && (
              <Link
                href="/register"
                className="rounded-xl bg-[var(--brand)] px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90 whitespace-nowrap"
              >
                Quiero mi página
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* PORTADA ESTUDIO CREATIVO (ESTRUCTURA REFERENCIA IMAGEN 1) */}
      <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-24 overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          
          {/* ENCABEZADO CENTRADO CON ESPACIO Y AIRE */}
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 mb-4">
              <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
              <span>Diseño Gráfico & Desarrollo Web</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.12]">
              Tené la página web de tu negocio{" "}
              <span className="relative inline-block whitespace-nowrap">
                lista para vender.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 280 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute -bottom-2 left-0 w-full text-[var(--brand)] overflow-visible"
                >
                  <path
                    d="M3 14C60 6 180 4 277 12C210 16 90 18 12 16"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
              Diseño la identidad visual de tu marca y tu web a medida. Tus clientes ven productos, agendan turnos y te hacen pedidos directos por WhatsApp.
            </p>
          </div>

          {/* LIENZO COMPUESTO CON CARDS FLOTANTES SUPERPUESTAS */}
          <div className="relative mt-12 sm:mt-16 mx-auto max-w-4xl">
            
            {/* 1. LIENZO PRINCIPAL CENTRAL: ENTORNO VISUAL REAL DE DISEÑO */}
            <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.8rem] border border-zinc-200/80 bg-zinc-900 shadow-2xl dark:border-zinc-800 aspect-[16/10] sm:aspect-[16/9] w-full">
              <img
                src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1800&q=80"
                alt="Diseño web y gráfico en proceso"
                className="h-full w-full object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* MOCKUP INTERACTIVO SIMULADO ADENTRO DEL LIENZO */}
              <div className="absolute inset-x-4 bottom-4 sm:bottom-6 sm:inset-x-8 flex items-end justify-between">
                <div className="rounded-2xl bg-white/95 p-3 sm:p-4 backdrop-blur-md dark:bg-zinc-950/95 border border-white/20 shadow-lg text-left max-w-xs sm:max-w-sm hidden sm:block">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-[10px] font-bold">
                      NDI
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Carta Digital & WhatsApp</p>
                      <p className="text-[10px] text-zinc-500">Pedidos directos sin comisiones</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CARD FLOTANTE SUPERIOR IZQUIERDA: MÉTRICA OSCURA DE IMPACTO */}
            <div className="absolute -top-6 -left-3 sm:-top-8 sm:-left-8 rounded-2xl sm:rounded-3xl bg-zinc-950 p-4 sm:p-5 text-white shadow-2xl border border-zinc-800 text-left max-w-[170px] sm:max-w-[210px] z-20">
              <p className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-none">
                +100%
              </p>
              <p className="mt-2 text-[11px] sm:text-xs text-zinc-400 font-medium leading-snug">
                Autogestionable desde tu celular, sin intermediarios.
              </p>
            </div>

            {/* 3. CARD FLOTANTE SUPERIOR DERECHA: CONFIANZA Y VALORACIÓN */}
            <div className="absolute -top-4 -right-3 sm:-top-6 sm:-right-8 rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-4 text-zinc-900 shadow-xl border border-zinc-200/80 backdrop-blur-md dark:bg-zinc-900/95 dark:border-zinc-800 dark:text-white text-left z-20">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight">4.9</span>
                <div className="flex text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                </div>
              </div>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Atención personalizada y soporte continuo
              </p>
            </div>

            {/* 4. CARD FLOTANTE INFERIOR IZQUIERDA: ATENCIÓN LOCAL DIRECTA */}
            <div className="absolute -bottom-6 -left-2 sm:-bottom-8 sm:-left-6 rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-4 text-zinc-900 shadow-xl border border-zinc-200/80 backdrop-blur-md dark:bg-zinc-900/95 dark:border-zinc-800 dark:text-white text-left z-20">
              <p className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">
                Trato directo 1 a 1
              </p>
              <p className="mt-0.5 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                Diseñado desde Ledesma, Jujuy
              </p>
            </div>

            {/* 5. PÍLDORAS FLOTANTES INFERIOR DERECHA: SERVICIOS CLAVE */}
            <div className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:-right-6 rounded-2xl sm:rounded-3xl bg-white/95 p-2.5 sm:p-3 shadow-xl border border-zinc-200/80 backdrop-blur-md dark:bg-zinc-900/95 dark:border-zinc-800 z-20">
              <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-center">
                  Diseño Gráfico
                </span>
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-center">
                  Branding
                </span>
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-center">
                  Páginas Web
                </span>
                <span className="rounded-xl bg-[var(--brand)]/10 text-[var(--brand-contrast)] dark:text-[var(--brand)] px-2.5 py-1 text-center font-bold">
                  Catálogo & QR
                </span>
              </div>
            </div>

          </div>

          {/* BOTONES DE LLAMADA A LA ACCIÓN INFERIORES */}
          <div className="mt-14 sm:mt-16 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por el diseño de una página web y gráfica para mi negocio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] hover:opacity-90 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Consultar por WhatsApp</span>
            </a>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 text-xs sm:text-sm font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
            >
              Quiero mi página
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* BENEFICIOS EDITORIALES */}
      <section className="mx-auto max-w-7xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
              Diseño & Solución Comercial
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
              Dejá de perder tiempo respondiendo precios por privado.
            </h2>
            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400 font-normal">
              Con tu propia página con estética profesional, tus clientes ven lo que ofrecés, conocen los precios actualizados y te mandan el pedido o la reserva armada al WhatsApp, a cualquier hora.
            </p>

            <div className="mt-6 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4 dark:border-[var(--brand)]/20 dark:bg-[var(--brand)]/10">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                💡 Diseño profesional + WhatsApp directo = clientes que compran con confianza.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-3.5 sm:grid-cols-2">
            {beneficios.map((b, i) => (
              <div
                key={b.titulo}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              >
                <div>
                  <span className="text-xs font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                    0{i + 1}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-zinc-950 dark:text-white">
                    {b.titulo}
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {b.detalle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID: SERVICIOS */}
      <section id="servicios" className="mx-auto max-w-7xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Servicios integrales
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Diseño gráfico y desarrollo web a tu medida.
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Una solución completa para que tu negocio se destaque tanto en lo visual como en lo técnico.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <article className="lg:col-span-7 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                  <Package className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)] border border-[var(--brand)]/20">
                  Catálogo & Pedidos
                </span>
              </div>
              <h3 className="mt-4 text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white">
                Catálogo & Carta Digital con fotos y precios
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Tus productos o platos presentados de manera clara, con variantes de talles/gustos y precios actualizables desde tu teléfono.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Control de stock</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Pausa de productos</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Búsqueda rápida</span>
            </div>
          </article>

          <article className="lg:col-span-5 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Turnos 24/7
                </span>
              </div>
              <h3 className="mt-4 text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white">
                Turnos y reservas online automáticas
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Tus clientes eligen fecha y hora según los turnos libres. Sin demoras ni mensajes manuales cruzados.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Barberías y Salones</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Consultorios</span>
            </div>
          </article>

          <article className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Palette className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Identidad Gráfica & Branding</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Logotipos, tipografías, banners y estética para que tu negocio tenga coherencia en redes y en la web.
            </p>
          </article>

          <article className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Conexión a WhatsApp</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cada pedido o reserva te llega armada a tu chat para que solo tengas que cobrar y entregar.
            </p>
          </article>

          <article className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Cobros integrados</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Mercado Pago y datos de transferencia con Alias / CVU disponibles para el comprador.
            </p>
          </article>
        </div>
      </section>

      {/* MODELOS DE MUESTRA */}
      <section id="trabajos" className="mx-auto max-w-7xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
              Estructuras disponibles
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Modelos de muestra listos para adaptar.
            </h2>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              Diseños creados para cada tipo de actividad comercial.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
            <span>Todos los modelos incluyen panel autogestionable</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {proyectosShowcase.map((p) => {
            const Icono = p.icono;
            return (
              <article
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                    <img
                      src={p.portada}
                      alt={p.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="rounded-full bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        {p.esReal ? "Cliente online" : "Ejemplo de diseño"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-[var(--brand-contrast)] dark:text-[var(--brand)] text-xs font-semibold">
                      <Icono className="h-3.5 w-3.5" />
                      <span>{p.categoria}</span>
                    </div>

                    <h3 className="mt-1.5 text-base font-bold text-zinc-950 dark:text-white">
                      {p.titulo}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {p.subtitulo}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-1">
                      {p.caracteristicas.map((c, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <a
                    href={p.urlDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-xs font-bold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <span>Consultar por este diseño</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* QUIÉN SOY */}
      <section id="quien-soy" className="mx-auto max-w-4xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="text-center max-w-xl mx-auto">
          <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 border-[var(--brand)]/40 bg-zinc-100 shadow-md ring-4 ring-[var(--brand)]/10 dark:bg-zinc-800">
            {!errorFotoNahuel ? (
              <Image
                src="/nahuel.jpg"
                alt="Nahuel - NDI | Diseño & Web"
                width={256}
                height={256}
                quality={95}
                className="h-full w-full object-cover object-top"
                onError={() => setErrorFotoNahuel(true)}
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-lg sm:text-xl text-[var(--brand)]">
                NDI
              </div>
            )}
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <MapPin className="h-3 w-3 text-[var(--brand)]" />
            <span>Ledesma, Jujuy</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Hola, soy Nahuel.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 [text-wrap:balance]">
            Soy Diseñador Gráfico Junior y desarrollador web de Ledesma, Jujuy. Creo páginas webs y gráficas pensadas para que tu negocio se vea profesional y venda.
          </p>

          <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 [text-wrap:balance]">
            Tratás directo conmigo: sin vueltas, sin intermediarios y con soporte constante.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <UserCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
              <span>Atención directa 1 a 1</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Diseño gráfico & Identidad</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Soporte continuo</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por diseño gráfico y una página web para mi negocio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hablar directo con Nahuel</span>
            </a>

            <a
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-800 shadow-xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
            >
              <Palette className="h-4 w-4 text-[var(--brand)]" />
              <span>Ver portfolio en Behance ↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="mx-auto max-w-7xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Planes y Precios
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Elegí cómo querés impulsar tu negocio.
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Puesta en marcha inicial y mantenimiento mensual accesible.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:items-center">
          <PlanCard
            nombre="Página Simple"
            descripcion="Para negocios y profesionales que quieren presencia web, servicios y agenda de turnos online."
            inicial="$ 89.999"
            mensual="$ 5.999/mes"
            features={planSimple}
          />

          <PlanCard
            nombre="Página Completa"
            etiqueta="Recomendado"
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

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Dudas frecuentes
          </span>
          <h2 className="mt-2 text-xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            ¿Tenés preguntas? Te respondo.
          </h2>
        </div>

        <div className="mt-6 space-y-2.5">
          {faqs.map((faq, index) => {
            const abierta = faqAbierta === index;
            return (
              <div
                key={faq.pregunta}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${abierta ? "rotate-180 text-[var(--brand)]" : ""}`} />
                </button>
                {abierta && (
                  <div className="border-t border-zinc-100 px-4 pb-4 pt-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:px-5 sm:pb-5 sm:text-sm">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="border-t border-zinc-200/80 bg-zinc-100/60 py-14 sm:py-24 dark:border-zinc-800/80 dark:bg-zinc-950/60">
        <div className="mx-auto max-w-5xl px-3.5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                Atención directa
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Empecemos tu proyecto hoy.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Escribime para consultar por tu diseño gráfico, catálogo o página web a medida.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <a
                  href={`mailto:${CORREO_CONTACTO}`}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Correo electrónico</p>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">{CORREO_CONTACTO}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Tengo una consulta sobre diseño gráfico y desarrollo web para mi negocio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 transition hover:bg-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">WhatsApp directo</p>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300">+54 9 388 657-5664</p>
                  </div>
                </a>

                <a
                  href={BEHANCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Portfolio de diseño</p>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">behance.net/nahuelrueda ↗</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 text-center shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">
                ¿Listo para poner tu negocio online?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Creá tu cuenta ahora y comenzá a configurar tu catálogo, servicios y turnos.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] py-3 text-xs sm:text-sm font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90"
                >
                  Quiero mi página
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Quiero que hablemos sobre el diseño de mi página web.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-xs sm:text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  Hablar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 bg-white py-12 dark:border-zinc-800 dark:bg-[#0c0d0e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-8 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--brand)] p-1">
                  <Image
                    src="/logo-ndi.png"
                    alt="Logo NDI"
                    width={16}
                    height={16}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  NDI | Diseño & Web
                </span>
              </div>
              <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Diseño gráfico y desarrollo web para emprendimientos, negocios y profesionales. Atención directa desde Ledesma, Jujuy.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Navegación
              </p>
              <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li><a href="#servicios" className="hover:text-[var(--brand)] transition">Servicios</a></li>
                <li><a href="#trabajos" className="hover:text-[var(--brand)] transition">Modelos</a></li>
                <li><a href="#quien-soy" className="hover:text-[var(--brand)] transition">Quién soy</a></li>
                <li><a href={BEHANCE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition">Behance Portfolio ↗</a></li>
                <li><a href="#planes" className="hover:text-[var(--brand)] transition">Planes</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Marco legal
              </p>
              <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link href="/terminos" className="hover:text-[var(--brand)] transition">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="hover:text-[var(--brand)] transition">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--brand)] transition"
                  >
                    Defensa del Consumidor
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Defensa del consumidor
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Podés revocar tu contratación dentro del plazo de 10 días corridos contados desde la aceptación del servicio.
              </p>
              <div className="mt-3">
                <a
                  href={`mailto:${CORREO_CONTACTO}?subject=${encodeURIComponent("Solicitud de revocación - Botón de arrepentimiento")}&body=${encodeURIComponent("Hola, solicito la revocación de la contratación del servicio conforme al artículo 34 de la Ley 24.240 y Resolución 424/2020.")}`}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Botón de arrepentimiento
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <p>© 2026 NDI | Diseño & Web. Todos los derechos reservados.</p>
            <p>Ledesma, Jujuy, Argentina</p>
          </div>
        </div>
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
      className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all ${
        destacado
          ? "border-2 border-[var(--brand)] bg-white shadow-xl dark:border-[var(--brand)] dark:bg-zinc-900 lg:-translate-y-2 ring-1 ring-blue-500/20"
          : lanzamiento
          ? "border border-purple-500/30 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs"
          : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs"
      }`}
    >
      <div>
        {etiqueta && (
          <span
            className={`absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${
              destacado ? "bg-[var(--brand)]" : "bg-purple-600"
            }`}
          >
            {destacado && <Sparkles className="h-3 w-3" />}
            {etiqueta}
          </span>
        )}

        <h3 className="text-xl font-bold text-zinc-950 dark:text-white">{nombre}</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{descripcion}</p>

        <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
          <p className="text-[10px] uppercase font-bold text-zinc-500">Puesta en marcha inicial</p>
          <p className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white">{inicial}</p>
          <p className="mt-0.5 text-xs font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)]">+ {mensual}</p>
        </div>

        <div className="mt-6 space-y-2.5">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/register"
          className={`inline-flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold transition shadow-xs ${
            destacado
              ? "bg-[var(--brand)] text-white hover:opacity-90 shadow-blue-500/20"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          }`}
        >
          Quiero mi página
        </Link>
      </div>
    </article>
  );
}