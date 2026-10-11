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
  FileText,
  Mail,
  MessageCircle,
  Moon,
  Package,
  QrCode,
  Sun,
  UtensilsCrossed,
  ShoppingBag,
  Scissors,
  Stethoscope,
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
    categoria: "Gastronomía & Restaurantes",
    subtitulo: "Carta digital con fotos, pedidos directos a WhatsApp y reservas de mesa.",
    portada: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    badge: "Carta & Pedidos",
    urlDemo: "ndiweb.com/sabores-del-norte",
  },
  {
    id: "tiendas",
    label: "Tiendas",
    icono: ShoppingBag,
    titulo: "Norte Store",
    categoria: "Tiendas & Catálogo Online",
    subtitulo: "Catálogo ágil con selección de variantes, stock en tiempo real y cobros integrados.",
    portada: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    badge: "Catálogo Online",
    urlDemo: "ndiweb.com/norte-store",
  },
  {
    id: "belleza",
    label: "Barberías & Salones",
    icono: Scissors,
    titulo: "Black Crown Studio",
    categoria: "Barberías & Salones de Belleza",
    subtitulo: "Agenda de turnos online 24/7 para que los clientes elijan su día y horario sin demoras.",
    portada: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80",
    badge: "Turnos Online",
    urlDemo: "ndiweb.com/black-crown",
  },
  {
    id: "consultorios",
    label: "Consultorios",
    icono: Stethoscope,
    titulo: "Centro Médico & Salud",
    categoria: "Consultorios & Profesionales",
    subtitulo: "Gestión de citas médicas, especialidades, ubicación y atención profesional.",
    portada: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80",
    badge: "Citas & Atención",
    urlDemo: "ndiweb.com/consultorio-salud",
  },
];

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
  const [rubroSeleccionado, setRubroSeleccionado] = useState(0);
  const [mostrarBotonHeader, setMostrarBotonHeader] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleFaq = (index: number) => {
    setFaqAbierta(faqAbierta === index ? null : index);
  };

  const container3DRef = useRef<HTMLDivElement>(null);
  const [inclinacion, setInclinacion] = useState(14);
  const [elevacion, setElevacion] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nuevaInclinacion = Math.max(0, 14 - y * 0.03);
      const nuevaElevacion = Math.min(40, y * 0.05);
      setInclinacion(nuevaInclinacion);
      setElevacion(nuevaElevacion);

      // Muestra el botón del header solo cuando el usuario baja más de 350px
      setMostrarBotonHeader(y > 350);
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
      {/* HEADER COMPACTO Y DINÁMICO */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl transition-colors dark:border-zinc-800/80 dark:bg-[#0c0d0e]/85">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
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
            <div className="truncate">
              <p className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                NDI <span className="font-normal text-zinc-500 dark:text-zinc-400">| Diseño & Web</span>
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a href="#funciones" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Servicios
            </a>
            <a href="#como-funciona" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Proceso
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
              className="hidden sm:inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Iniciar sesión
            </Link>

            {/* BOTÓN HEADER: SE OCULTA AL COMIENZO Y APARECE SUAVEMENTE CUANDO SCROLLEAMOS */}
            <Link
              href="/register"
              className={`rounded-xl bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm shadow-blue-600/25 transition-all duration-300 active:scale-95 ${
                mostrarBotonHeader
                  ? "opacity-100 pointer-events-auto translate-y-0"
                  : "opacity-0 pointer-events-none -translate-y-1 sm:opacity-100 sm:pointer-events-auto sm:translate-y-0"
              }`}
            >
              Quiero mi página
            </Link>
          </div>
        </div>
      </header>

      {/* HERO CENTRADO CON PERSPECTIVA 3D */}
      <section className="relative pt-10 pb-16 sm:pt-20 sm:pb-28 [perspective:1600px] overflow-hidden">
        {/* Glow envolvente de fondo */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[650px] w-full max-w-7xl">
          <div className="absolute top-10 left-1/3 h-96 w-96 rounded-full bg-blue-600/15 blur-[150px]" />
          <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[140px]" />
        </div>

        {/* Textos principales */}
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3.5">
            <span>Estudio de Diseño & Desarrollo Digital</span>
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-[4.3rem] font-black tracking-tight leading-[1.08] text-zinc-950 dark:text-white">
            Tené tu página web{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-emerald-400">
              profesional hoy.
            </span>
          </h1>

          <p className="mx-auto mt-3.5 sm:mt-5 max-w-2xl text-xs sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400 font-normal">
            Diseñamos la web de tu negocio con catálogo, turnos online y pedidos ordenados directo a tu WhatsApp. Sin complicaciones técnicas ni intermediarios.
          </p>

          {/* BOTONES PRINCIPALES: EN LA MISMA FILA EN MÓVIL Y DESKTOP */}
          <div className="mt-6 sm:mt-7 grid grid-cols-2 gap-2 max-w-xs sm:max-w-none sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 mx-auto">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl bg-zinc-950 px-3 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 text-center"
            >
              Crear mi página
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            </Link>

            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-1 rounded-xl sm:rounded-2xl border border-zinc-300 bg-white px-3 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95 text-center"
            >
              Hablar con asesor
            </a>
          </div>

          {/* SELECTOR DE RUBROS: SCROLL HORIZONTAL TÁCTIL EN CELULAR */}
          <div className="mt-7 sm:mt-10 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {proyectosShowcase.map((p, idx) => {
              const Icono = p.icono;
              const activo = rubroSeleccionado === idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setRubroSeleccionado(idx)}
                  className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
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

        {/* SHOWCASE 3D PANORÁMICO LIMPIO */}
        <div
          ref={container3DRef}
          className="relative mx-auto mt-8 sm:mt-14 max-w-5xl px-3 sm:px-8 transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${inclinacion}deg) translateY(-${elevacion}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Sombra de apoyo */}
          <div className="absolute inset-x-12 -bottom-10 h-28 rounded-[4rem] bg-black/60 dark:bg-black/90 blur-3xl" />

          {/* Marco del Showcase */}
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-300/80 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-700/80 dark:bg-zinc-950 dark:ring-white/10">
            {/* Barra superior del proyecto */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/90 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] sm:max-w-none">
                  {proyectoActual.urlDemo}
                </span>
              </div>
              <div className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {proyectoActual.badge}
              </div>
            </div>

            {/* Imagen cinematográfica a pantalla completa */}
            <div className="relative aspect-[16/10] sm:aspect-[2.2/1] w-full overflow-hidden bg-zinc-900">
              <img
                src={proyectoActual.portada}
                alt={proyectoActual.titulo}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-4 sm:p-9 text-white">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  {proyectoActual.categoria}
                </span>
                <p className="mt-1 text-lg sm:text-3xl font-black tracking-tight">{proyectoActual.titulo}</p>
                <p className="mt-1 text-[11px] sm:text-sm text-zinc-300 max-w-xl font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">{proyectoActual.subtitulo}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PROBLEMA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              El problema actual
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Tener solo Instagram no es suficiente para vender ordenado.
            </h2>
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              La gente no tiene tiempo de esperar horas por una respuesta en historias o mensajes privados. Un sitio web propio le da seriedad a tu marca y permite que tus clientes vean precios, servicios y reserven de inmediato.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {problemas.map((problema) => (
              <div
                key={problema}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-500">
                  ✕
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                  {problema}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS: 6 TARJETAS SIMÉTRICAS */}
      <section id="funciones" className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Lo que incluye tu web
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Diseño y funcionalidad para tu negocio.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Herramientas pensadas para simplificar tus ventas diarias.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {funciones.map(({ titulo, descripcion, icono: Icono }) => (
            <article
              key={titulo}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                <Icono className="h-5 w-5" />
              </div>
              <h3 className="mt-3.5 text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                {titulo}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {descripcion}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* PROCESO */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Paso a paso
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Cómo ponemos tu página en marcha.
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map(({ numero, titulo, descripcion }) => (
            <div
              key={numero}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                {numero}
              </span>
              <h3 className="mt-2 text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                {titulo}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {descripcion}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Planes y Precios
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Elegí cómo querés impulsar tu negocio.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Puesta en marcha inicial y mantenimiento mensual accesible.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
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

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-14 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Dudas frecuentes
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            ¿Tenés preguntas? Te respondemos.
          </h2>
        </div>

        <div className="mt-8 space-y-2.5">
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

      {/* CONTACTO Y SOPORTE OFICIAL COMPLETO */}
      <section id="contacto" className="border-t border-zinc-200/80 bg-zinc-100/60 py-14 sm:py-20 dark:border-zinc-800/80 dark:bg-zinc-950/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Atención directa
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Empecemos tu proyecto hoy.
              </h2>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
                Escribinos si tenés dudas específicas sobre cómo adaptar tu página o querés consultar por opciones personalizadas.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <a
                  href={`mailto:${CORREO_CONTACTO}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Correo electrónico</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white sm:text-sm">{CORREO_CONTACTO}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Tengo una consulta sobre una página web para mi negocio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-3.5 transition hover:bg-emerald-100/70 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">WhatsApp directo</p>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 sm:text-sm">+54 9 388 657-5664</p>
                  </div>
                </a>

                <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-3.5 text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500">Horario de atención</p>
                    <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-300 sm:text-xs">Lunes a sábados de 09:00 a 20:00 hs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                ¿Listo para poner tu negocio online?
              </h3>
              <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                Creá tu cuenta ahora y comenzá a configurar tu catálogo, servicios y turnos.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500"
                >
                  Quiero mi página
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Quiero que me ayuden a armar mi página web.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  Hablar con un asesor por WhatsApp
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
      className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 ${
        destacado
          ? "border-2 border-blue-500 bg-blue-50/50 shadow-xl dark:bg-blue-950/20 shadow-blue-950/20"
          : lanzamiento
          ? "border border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20"
          : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm"
      }`}
    >
      <div>
        {etiqueta && (
          <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {etiqueta}
          </span>
        )}

        <h3 className="text-lg font-bold text-zinc-950 dark:text-white">{nombre}</h3>
        <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{descripcion}</p>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/70">
          <p className="text-[9px] uppercase font-bold text-zinc-500">Puesta en marcha</p>
          <p className="text-2xl font-black text-zinc-950 dark:text-white">{inicial}</p>
          <p className="mt-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">+ {mensual}</p>
        </div>

        <div className="mt-5 space-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/register"
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
        >
          Quiero mi página
        </Link>
      </div>
    </article>
  );
}