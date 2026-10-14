"use client";

import { useEffect, useState } from "react";
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
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  QrCode,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  UtensilsCrossed,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Zap,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";

const proyectosShowcase = [
  {
    id: "restaurantes",
    label: "Restaurantes",
    icono: UtensilsCrossed,
    titulo: "Sabores del Norte",
    categoria: "Gastronomía & Bares",
    subtitulo: "Menú digital interactivo con pedidos directos a tu WhatsApp, fotos de platos y reserva de mesas.",
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
    titulo: "Catálogo o menú siempre al día",
    detalle: "Cambiás fotos y precios desde tu celu cuando quieras, sin depender de nadie ni pagar costos extra.",
  },
  {
    titulo: "Pedidos organizados y completos",
    detalle: "Te llega el detalle exacto de lo que el cliente quiere, sin mensajes cruzados ni confusiones.",
  },
  {
    titulo: "Turnos sin idas y vueltas",
    detalle: "El cliente elige el día y horario disponible en segundos, sin tener que coordinar manualmente.",
  },
  {
    titulo: "Presencia seria y confiable",
    detalle: "Un link propio con tu marca que transmite seguridad y profesionalismo en cada consulta.",
  },
];

const pasos = [
  {
    numero: "01",
    titulo: "Me contás sobre tu negocio",
    descripcion:
      "Hablamos por WhatsApp sobre qué vendés, qué estilo te gusta y qué necesitás en tu web.",
  },
  {
    numero: "02",
    titulo: "Diseño y cargo todo",
    descripcion:
      "Preparo la estructura, fotos, lista de precios, horarios y botones de contacto de tu negocio.",
  },
  {
    numero: "03",
    titulo: "Revisamos y publicamos",
    descripcion:
      "Mirás cómo quedó, ajustamos lo que haga falta y la dejamos online con seguridad SSL lista para compartir.",
  },
  {
    numero: "04",
    titulo: "La manejás vos",
    descripcion:
      "Te explico en 5 minutos cómo cambiar precios o pausar productos desde tu panel sin depender de nadie.",
  },
];

const faqs = [
  {
    pregunta: "¿Cuánto tarda en estar lista?",
    respuesta:
      "Entre 24 y 48 horas hábiles desde que me pasás la información y las fotos de tu negocio.",
  },
  {
    pregunta: "¿Puedo cambiar precios y fotos después?",
    respuesta:
      "Sí, totalmente. Tenés tu propio panel para editar lo que quieras las 24 horas desde la compu o el celular, sin tener que pagarle a nadie para actualizar un precio.",
  },
  {
    pregunta: "¿Necesito saber de computación o programación?",
    respuesta:
      "Para nada. El panel es súper simple e intuitivo. Además, yo te dejo todo listo y configurado desde el primer día.",
  },
  {
    pregunta: "¿Cómo se abona?",
    respuesta:
      "Podés pagar por transferencia bancaria (CVU / Alias) o con tarjeta mediante Mercado Pago.",
  },
  {
    pregunta: "¿Tiene costo de mantenimiento?",
    respuesta:
      "Sí, un abono mensual accesible que cubre el servidor rápido, certificado de seguridad HTTPS y soporte directo cuando lo necesites.",
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
  const [rubroSeleccionado, setRubroSeleccionado] = useState(0);
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

  const proyectoActual = proyectosShowcase[rubroSeleccionado];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-[#0c0d0e] dark:text-zinc-100 selection:bg-blue-600 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl transition-colors dark:border-zinc-800/80 dark:bg-[#0c0d0e]/90">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3.5 sm:px-8 gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 p-1 shadow-sm shadow-blue-600/30">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={16}
                height={16}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">
              NDI <span className="hidden sm:inline font-normal text-zinc-500 dark:text-zinc-400">| Diseño & Web</span>
            </p>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a href="#funciones" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Servicios
            </a>
            <a href="#trabajos" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Ejemplos
            </a>
            <a href="#como-funciona" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Proceso
            </a>
            <a href="#quien-soy" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Quién soy
            </a>
            <a href="#planes" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Planes
            </a>
            <a href="#faq" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Preguntas
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
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                className="rounded-xl bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-500 whitespace-nowrap"
              >
                Quiero mi página
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-24 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-full max-w-7xl">
          <div className="absolute top-10 left-1/3 h-80 w-80 rounded-full bg-blue-600/15 blur-[140px]" />
          <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-[130px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
            <span>Diseño gráfico & desarrollo web</span>
          </div>

          <h1 className="text-2xl sm:text-6xl lg:text-[4.2rem] font-black tracking-tight leading-[1.12] sm:leading-[1.08] text-zinc-950 dark:text-white">
            Tené la página web de tu negocio{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-emerald-400">
              lista para vender.
            </span>
          </h1>

          <p className="mx-auto mt-2.5 sm:mt-5 max-w-2xl text-xs sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400 font-normal">
            Diseño tu sitio a medida para que muestres tus productos, organices tus turnos y recibas pedidos claros directo a tu WhatsApp. Sin vueltas técnicas y con atención directa de persona a persona.
          </p>

          <div className="mt-5 sm:mt-7 flex items-center justify-center gap-2 sm:gap-3 max-w-sm sm:max-w-none mx-auto">
            <Link
              href="/register"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl bg-zinc-950 px-4 py-2.5 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 text-center"
            >
              Crear mi página
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>

            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría consultar por una página web para mi negocio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border border-zinc-300 bg-white px-3.5 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95 text-center"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              Hablar por WhatsApp
            </a>
          </div>

          <div className="mt-6 sm:mt-10 flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {proyectosShowcase.map((p, idx) => {
              const Icono = p.icono;
              const activo = rubroSeleccionado === idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setRubroSeleccionado(idx)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                    activo
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icono className="h-3.5 w-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto mt-6 sm:mt-12 max-w-6xl px-3.5 sm:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-300/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 ring-1 ring-black/5 dark:ring-white/10 group">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 sm:px-6 sm:py-4 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  {proyectoActual.categoria}
                </span>
                <span className="hidden sm:inline-flex items-center rounded-md bg-zinc-200/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Ejemplo de diseño
                </span>
              </div>
              <span className="rounded-full bg-blue-600/10 border border-blue-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">
                {proyectoActual.badge}
              </span>
            </div>

            <div className="relative aspect-[16/10] sm:aspect-[2.1/1] w-full overflow-hidden bg-zinc-950">
              <img
                src={proyectoActual.portada}
                alt={proyectoActual.titulo}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex flex-col justify-end p-4 sm:p-10 text-white">
                <div className="flex flex-wrap items-center gap-1.5 mb-2 sm:mb-3">
                  {proyectoActual.caracteristicas.map((caract, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] sm:text-xs font-medium text-emerald-400 border border-white/10"
                    >
                      <Check className="h-2.5 w-2.5 shrink-0" />
                      {caract}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-4xl font-black tracking-tight">{proyectoActual.titulo}</h2>
                    <p className="mt-0.5 sm:mt-2 text-[11px] sm:text-base text-zinc-300 max-w-2xl font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {proyectoActual.subtitulo}
                    </p>
                  </div>

                  <a
                    href={proyectoActual.urlDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-2 text-[11px] sm:text-xs font-bold text-white transition active:scale-95 border border-white/20 whitespace-nowrap"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Consultar por este modelo</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ TENER TU WEB (BLOQUE ASIMÉTRICO EDITORIAL) */}
      <section className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Vender más simple
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
              Dejá de perder tiempo respondiendo precios por privado.
            </h2>
            <p className="mt-3.5 text-xs sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400 font-normal">
              Depender únicamente de mensajes en historias o chats te hace perder ventas todos los días. Con tu propia página, tus clientes ven lo que ofrecés, conocen los precios actualizados y te mandan el pedido o la reserva armada al WhatsApp, a cualquier hora.
            </p>

            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-950/20">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                💡 Menos tiempo respondiendo lo mismo = más foco en atender y vender.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
            {beneficios.map((b, i) => (
              <div
                key={b.titulo}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              >
                <div>
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                    0{i + 1}
                  </span>
                  <h3 className="mt-1 text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
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

      {/* BENTO GRID: TODO LO QUE INCLUYE TU PÁGINA */}
      <section id="funciones" className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-2xl">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Todo lo que incluye tu página
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Pensado para que trabajes más cómodo y atiendas mejor.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Cada función resuelve una tarea concreta de tu rutina comercial.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* Card Destacada 1: Catálogo & Menú Digital (Ancha) */}
          <article className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-5 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 border border-blue-500/20">
                  Función principal
                </span>
              </div>
              <h3 className="mt-4 text-base sm:text-2xl font-bold text-zinc-950 dark:text-white">
                Catálogo & Carta Digital con fotos y precios
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Tus platos, productos o servicios ordenados con fotos de calidad, variantes de talles/gustos y precios que actualizás en un segundo desde tu teléfono.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Control de stock</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Pausa de productos</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Búsqueda rápida</span>
            </div>
          </article>

          {/* Card Destacada 2: Turnos & Reservas 24/7 (Ancha complementaria) */}
          <article className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-5 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-400">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-400 border border-emerald-500/20">
                  Autogestionable
                </span>
              </div>
              <h3 className="mt-4 text-base sm:text-2xl font-bold text-zinc-950 dark:text-white">
                Turnos y reservas online 24/7
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Tus clientes eligen fecha y hora según los turnos libres que tengas cargados. Confirmación inmediata sin coordinar mensaje por mensaje.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Barberías y Salones</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Consultorios</span>
            </div>
          </article>

          {/* 4 Cards compactas inferiores */}
          <article className="lg:col-span-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Diseño a tu medida</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Armado con tus colores, logo y fotos de tu negocio, con terminación profesional.
            </p>
          </article>

          <article className="lg:col-span-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-600/15 dark:text-emerald-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Conexión a WhatsApp</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cada pedido llega a tu chat con el listado detallado para que solo tengas que cobrar y entregar.
            </p>
          </article>

          <article className="lg:col-span-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-600/15 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Cobros integrados</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Botón de Mercado Pago y datos de transferencia con Alias / CVU directo al cliente.
            </p>
          </article>

          <article className="lg:col-span-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-600/15 dark:text-purple-400">
              <QrCode className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Código QR exclusivo</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Listo en alta resolución para colocar en mesas, vidrieras, folletos o tarjetas.
            </p>
          </article>
        </div>
      </section>

      {/* MODELOS DE MUESTRA */}
      <section id="trabajos" className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Estructuras disponibles
            </span>
            <h2 className="mt-1 text-xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Modelos de muestra listos para adaptar.
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Diseños transparentes creados desde cero para cada tipo de actividad comercial.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Todos los modelos incluyen panel autogestionable</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {proyectosShowcase.map((p) => {
            const Icono = p.icono;
            return (
              <article
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
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

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      <Icono className="h-3.5 w-3.5" />
                      <span>{p.categoria}</span>
                    </div>

                    <h3 className="mt-1.5 text-base font-bold text-zinc-950 dark:text-white">
                      {p.titulo}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {p.subtitulo}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
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

                <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                  <a
                    href={p.urlDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-xs font-bold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-700"
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

      {/* PROCESO */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-3xl">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Paso a paso
          </span>
          <h2 className="mt-1 text-xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Cómo trabajamos juntos.
          </h2>
        </div>

        <div className="mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map(({ numero, titulo, descripcion }) => (
            <div
              key={numero}
              className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                {numero}
              </span>
              <h3 className="mt-1.5 text-xs sm:text-base font-bold text-zinc-950 dark:text-white">
                {titulo}
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {descripcion}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* QUIÉN SOY */}
      <section id="quien-soy" className="mx-auto max-w-5xl px-3.5 py-12 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="text-center max-w-2xl mx-auto">
          <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 border-blue-500/40 bg-zinc-100 shadow-md ring-4 ring-blue-500/10 dark:bg-zinc-800">
            {!errorFotoNahuel ? (
              <Image
                src="/nahuel.jpg"
                alt="Nahuel - NDI | Diseño & Web"
                width={112}
                height={112}
                className="h-full w-full object-cover"
                onError={() => setErrorFotoNahuel(true)}
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-black text-lg sm:text-xl text-blue-600 dark:text-blue-400">
                ND
              </div>
            )}
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>Libertador General San Martín, Jujuy</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Hola, soy Nahuel.
          </h2>

          <p className="mt-3 text-xs sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Soy diseñador gráfico y desarrollador web. Trabajo desde Libertador General San Martín, Jujuy, ayudando a negocios, emprendimientos y profesionales a tener su presencia online propia y ordenada.
          </p>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Acá no hablás con intermediarios ni ejecutivos de cuentas: coordinás el diseño, la carga de datos y las dudas directamente conmigo por WhatsApp o llamada.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Atención 1 a 1 sin intermediarios</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Soporte y mantenimiento continuo</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Entrega en 24 a 48 hs hábiles</span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por una página web para mi negocio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hablar directo con Nahuel</span>
            </a>
          </div>
        </div>
      </section>

      {/* PLANES CON JERARQUÍA FÍSICA CLARA */}
      <section id="planes" className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Planes y Precios
          </span>
          <h2 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Elegí cómo querés impulsar tu negocio.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Puesta en marcha inicial y mantenimiento mensual accesible.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:items-center">
          {/* Plan Simple */}
          <PlanCard
            nombre="Página Simple"
            descripcion="Para negocios y profesionales que quieren presencia web, servicios y agenda de turnos online."
            inicial="$ 89.999"
            mensual="$ 5.999/mes"
            features={planSimple}
          />

          {/* Plan Completa - Destacado con escala visual */}
          <PlanCard
            nombre="Página Completa"
            etiqueta="Recomendado"
            descripcion="Para comercios que necesitan catálogo de productos, carta gastronómica y cobros online."
            inicial="$ 159.999"
            mensual="$ 9.999/mes"
            features={planCompleta}
            destacado
          />

          {/* Plan Business IA */}
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
      <section id="faq" className="mx-auto max-w-4xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Dudas frecuentes
          </span>
          <h2 className="mt-1 text-xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            ¿Tenés preguntas? Te respondo.
          </h2>
        </div>

        <div className="mt-6 space-y-2">
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
                  className="flex w-full items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${abierta ? "rotate-180 text-blue-600 dark:text-blue-400" : ""}`} />
                </button>
                {abierta && (
                  <div className="border-t border-zinc-100 px-4 pb-4 pt-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:text-sm">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="border-t border-zinc-200/80 bg-zinc-100/60 py-12 sm:py-24 dark:border-zinc-800/80 dark:bg-zinc-950/60">
        <div className="mx-auto max-w-5xl px-3.5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Atención directa
              </span>
              <h2 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                Empecemos tu proyecto hoy.
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
                Escribime si tenés dudas específicas sobre cómo adaptar tu página o querés consultar por opciones personalizadas.
              </p>

              <div className="mt-5 space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <a
                  href={`mailto:${CORREO_CONTACTO}`}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500">Correo electrónico</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white sm:text-sm">{CORREO_CONTACTO}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Tengo una consulta sobre una página web para mi negocio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-3.5 transition hover:bg-emerald-100/70 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400">WhatsApp directo</p>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 sm:text-sm">+54 9 388 657-5664</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500">Horario de atención</p>
                    <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-300 sm:text-xs">Lunes a sábados de 09:00 a 20:00 hs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h3 className="text-base sm:text-xl font-bold text-zinc-950 dark:text-white">
                ¿Listo para poner tu negocio online?
              </h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Creá tu cuenta ahora y comenzá a configurar tu catálogo, servicios y turnos.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-500 sm:text-sm"
                >
                  Quiero mi página
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Quiero que me ayuden a armar mi página web.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-500">
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
      className={`relative flex flex-col justify-between rounded-3xl p-5 sm:p-8 transition-all ${
        destacado
          ? "border-2 border-blue-600 bg-white shadow-xl dark:border-blue-500 dark:bg-zinc-900 lg:-translate-y-2 ring-1 ring-blue-600/20"
          : lanzamiento
          ? "border border-purple-500/30 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm"
          : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm"
      }`}
    >
      <div>
        {etiqueta && (
          <span
            className={`absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
              destacado ? "bg-blue-600" : "bg-purple-600"
            }`}
          >
            {destacado && <Sparkles className="h-3 w-3" />}
            {etiqueta}
          </span>
        )}

        <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">{nombre}</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{descripcion}</p>

        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/80">
          <p className="text-[9px] uppercase font-bold text-zinc-500">Puesta en marcha inicial</p>
          <p className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white">{inicial}</p>
          <p className="mt-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">+ {mensual}</p>
        </div>

        <div className="mt-5 space-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/register"
          className={`inline-flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-bold transition shadow-sm ${
            destacado
              ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          }`}
        >
          Quiero mi página
        </Link>
      </div>
    </article>
  );
}