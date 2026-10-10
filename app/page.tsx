"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  Moon,
  Package,
  QrCode,
  Scissors,
  Shirt,
  Sparkles,
  Sun,
  UserRoundCheck,
  UtensilsCrossed,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";

interface DemoRubro {
  id: "resto" | "tienda" | "barberia";
  etiqueta: string;
  icono: typeof UtensilsCrossed;
  negocio: string;
  rubroTexto: string;
  fotoPortada: string;
  itemDestacado: {
    nombre: string;
    precio: string;
    detalle: string;
  };
  notificacion: {
    icono: typeof MessageCircle;
    titulo: string;
    texto: string;
    tiempo: string;
  };
  linkSlug: string;
}

const DEMOS: DemoRubro[] = [
  {
    id: "resto",
    etiqueta: "Gastronomía",
    icono: UtensilsCrossed,
    negocio: "Sabores del Norte",
    rubroTexto: "Restaurante & Sabores Regionales",
    fotoPortada: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    itemDestacado: {
      nombre: "Humita en chala & Empanadas",
      precio: "$11.500",
      detalle: "Carta digital y pedidos para retirar",
    },
    notificacion: {
      icono: MessageCircle,
      titulo: "Pedido para retirar recibido",
      texto: "Mesa 4 · 2x Empanadas + Humita",
      tiempo: "Hace 1 min",
    },
    linkSlug: "/negocio/sabores-del-norte",
  },
  {
    id: "tienda",
    etiqueta: "Indumentaria",
    icono: Shirt,
    negocio: "Norte Store",
    rubroTexto: "Tienda Urbana & Colección",
    fotoPortada: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    itemDestacado: {
      nombre: "Remera Oversize Essential",
      precio: "$24.900",
      detalle: "Talles S a XL · Stock en tiempo real",
    },
    notificacion: {
      icono: CheckCircle2,
      titulo: "Pago acreditado Mercado Pago",
      texto: "Remera Oversize (Talle L - Gris)",
      tiempo: "Hace 4 min",
    },
    linkSlug: "/negocio/norte-store",
  },
  {
    id: "barberia",
    etiqueta: "Barberías & Estética",
    icono: Scissors,
    negocio: "Black Crown",
    rubroTexto: "Barber Studio & Cuidado Personal",
    fotoPortada: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    itemDestacado: {
      nombre: "Corte Clásico & Fade",
      precio: "$12.000",
      detalle: "Duración 30 min · Agenda online",
    },
    notificacion: {
      icono: CalendarCheck,
      titulo: "Turno reservado online",
      texto: "Mañana 16:30 hs con Lautaro",
      tiempo: "Hace 2 min",
    },
    linkSlug: "/negocio/black-crown",
  },
];

const problemas = [
  "Clientes preguntando siempre lo mismo",
  "Consultas que llegan fuera de horario",
  "Precios e información repartidos entre redes",
  "Turnos organizados manualmente por mensajes",
  "Negocios que dependen solamente de Instagram",
  "Clientes que no encuentran rápido lo que necesitan",
];

const funciones = [
  {
    titulo: "Página inteligente",
    descripcion:
      "Un espacio propio para mostrar tu negocio, servicios, productos, horarios, ubicación, contacto y toda la información importante.",
    icono: Building2,
    estado: "principal",
  },
  {
    titulo: "Asistente con IA",
    descripcion:
      "La IA puede responder consultas desde tu página utilizando la información real que cargaste sobre tu negocio.",
    icono: Sparkles,
    estado: "principal",
  },
  {
    titulo: "Turnos y reservas",
    descripcion:
      "Organizá disponibilidad, servicios, horarios y reservas directamente desde NDI AI.",
    icono: CalendarDays,
    estado: "principal",
  },
  {
    titulo: "Productos y servicios",
    descripcion:
      "Mostrá qué ofrecés, agregá descripciones, precios y organizá tu propuesta para que tus clientes la entiendan rápido.",
    icono: Package,
    estado: "principal",
  },
  {
    titulo: "Presupuestos y contacto",
    descripcion:
      "Facilitá que potenciales clientes puedan dejar sus datos, pedir información o solicitar un presupuesto.",
    icono: FileText,
    estado: "principal",
  },
  {
    titulo: "WhatsApp directo",
    descripcion:
      "Tus clientes pueden pasar de tu página directamente a una conversación con tu negocio mediante WhatsApp.",
    icono: MessageCircle,
    estado: "principal",
  },
  {
    titulo: "QR para compartir",
    descripcion:
      "Compartí tu página desde redes, cartelería, tarjetas o tu propio local utilizando un acceso rápido mediante QR.",
    icono: QrCode,
    estado: "principal",
  },
  {
    titulo: "Leads y clientes",
    descripcion:
      "Centralizá los contactos interesados y administrá la información de potenciales clientes desde NDI AI.",
    icono: UserRoundCheck,
    estado: "principal",
  },
];

const pasos = [
  {
    numero: "01",
    titulo: "Configurás tu negocio",
    descripcion:
      "Definís el nombre, información, contacto, ubicación y apariencia general de tu negocio.",
  },
  {
    numero: "02",
    titulo: "Cargás lo que ofrecés",
    descripcion:
      "Agregás servicios, productos, precios, horarios, preguntas frecuentes y demás información.",
  },
  {
    numero: "03",
    titulo: "Tu página queda lista",
    descripcion:
      "La información del negocio se transforma en una presencia digital clara y accesible para tus clientes.",
  },
  {
    numero: "04",
    titulo: "Tus clientes ingresan",
    descripcion:
      "Pueden conocer tu negocio, revisar servicios, consultar información y contactarte fácilmente.",
  },
  {
    numero: "05",
    titulo: "NDI AI los acompaña",
    descripcion:
      "El asistente inteligente puede responder preguntas utilizando los datos reales de tu negocio.",
  },
  {
    numero: "06",
    titulo: "Vos administrás todo",
    descripcion:
      "Gestionás información, contactos, turnos, estadísticas y funciones de tu plan desde un solo panel.",
  },
];

const faqs = [
  {
    pregunta: "¿Cuánto tiempo tarda en estar lista mi página web?",
    respuesta:
      "Si elegís configurarla vos mismo, tenés acceso instantáneo a tu panel para cargarla en minutos. Si elegís la opción de armado asistido por WhatsApp, te la entregamos 100% lista y publicada en un plazo de 24 a 48 horas hábiles.",
  },
  {
    pregunta: "¿Puedo actualizar los precios, fotos o servicios después?",
    respuesta:
      "Sí, totalmente. A diferencia de las páginas estáticas tradicionales, en NDI AI contás con un panel de administración autogestionable disponible las 24 hs para cambiar precios, pausar productos o editar horarios sin pagar extras.",
  },
  {
    pregunta: "¿Necesito conocimientos técnicos o de programación?",
    respuesta:
      "Para nada. El panel es intuitivo y pensado para dueños de negocios reales. Además, si preferís no ocuparte de la carga inicial, nuestro equipo la arma por vos.",
  },
  {
    pregunta: "¿Qué medios de pago aceptan para la contratación?",
    respuesta:
      "Aceptamos transferencias bancarias (CVU / Alias) y pagos con Mercado Pago. Una vez confirmado el pago de la puesta en marcha, se activa tu servicio de inmediato.",
  },
  {
    pregunta: "¿La página incluye seguridad SSL (HTTPS)?",
    respuesta:
      "Sí, todas las páginas generadas en NDI AI cuentan con certificado de seguridad SSL cifrado (HTTPS) incluido sin costo adicional, garantizando una navegación segura y profesional.",
  },
];

const planSimple = [
  "Página pública profesional",
  "Logo, portada, colores e identidad visual",
  "Información completa del negocio",
  "Agenda propia de NDI AI",
  "Turnos y reservas online las 24 hs",
  "Reservas de estadías (hoteles y hostales)",
  "Reservas de mesa para gastronomía",
  "Consultas y pedidos por WhatsApp",
  "Horarios de atención",
  "Ubicación y mapa",
  "Redes sociales",
  "Galería de imágenes",
  "Estadísticas básicas",
];

const planCompleta = [
  "Todo lo incluido en Página Simple",
  "Catálogo completo de productos y carta digital",
  "Hasta 3 imágenes por producto",
  "Cobros online (Mercado Pago, CVU / Alias)",
  "Código QR para compartir",
  "Solicitud de presupuestos",
  "Pedidos online organizados",
  "Estadísticas avanzadas",
];

const planBusinessIA = [
  "Todo lo incluido en Página Completa",
  "Asistente IA dentro de la página",
  "Asistente configurable para cada negocio",
  "Base de conocimiento del negocio",
  "Respuestas basadas en información real",
  "Conversaciones guardadas en el panel",
  "Captura y seguimiento de potenciales clientes",
  "Widget de IA para otras páginas web",
  "Atención humana cuando sea necesaria",
  "Sin marca comercial de NDI AI",
];

export default function HomePage() {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const [rubroActivo, setRubroActivo] = useState<DemoRubro>(DEMOS[0]);
  const { theme, setTheme } = useTheme();

  const toggleFaq = (index: number) => {
    setFaqAbierta(faqAbierta === index ? null : index);
  };

  const alternarTema = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-8 sm:py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 p-1 shadow-sm shadow-blue-600/20 sm:h-7 sm:w-7">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={14}
                height={14}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <p className="text-sm font-bold tracking-[0.14em] text-zinc-900 dark:text-white">
              NDI AI
            </p>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#funciones"
              className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Funciones
            </a>
            <a
              href="#como-funciona"
              className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Cómo funciona
            </a>
            <a
              href="#planes"
              className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Planes
            </a>
            <a
              href="#faq"
              className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Preguntas
            </a>
            <a
              href="#contacto"
              className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={alternarTema}
              type="button"
              aria-label="Cambiar tema"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Sun className="h-4 w-4 hidden dark:block text-amber-400" />
              <Moon className="h-4 w-4 block dark:hidden text-zinc-700" />
            </button>

            <Link
              href="/login"
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white sm:px-3 sm:py-2 sm:text-xs"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-500 sm:px-4 sm:text-xs"
            >
              Quiero mi página
            </Link>
          </div>
        </div>
      </header>

      {/* HERO RENOVADO DE ALTA CONVERSIÓN */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
        {/* Luces y resplandores de profundidad */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_65%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          {/* COLUMNA IZQUIERDA: PROPUESTA DE VALOR DIRECTA */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sin comisiones por venta · Tu negocio en 1 solo link</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
              Dejá de pasar precios por chat.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-emerald-400">
                Tu catálogo, carta y turnos
              </span>{" "}
              en un link profesional.
            </h1>

            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-5 sm:text-base sm:leading-7">
              Centralizá fotos, cobros por transferencia o Mercado Pago y reservas automáticas las 24 horas. Tus clientes encuentran todo al instante sin esperarte en Instagram.
            </p>

            {/* SELECTOR INTERACTIVO DE RUBROS */}
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Mirá cómo se adapta a tu rubro en vivo:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {DEMOS.map((demo) => {
                  const Icono = demo.icono;
                  const activo = rubroActivo.id === demo.id;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => setRubroActivo(demo)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                        activo
                          ? "border border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icono className="h-3.5 w-3.5" />
                      {demo.etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTONES PRINCIPALES */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-500 active:scale-95"
              >
                Quiero mi página
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={rubroActivo.linkSlug}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 active:scale-95"
              >
                <ExternalLink className="h-4 w-4 text-zinc-400" />
                Ver demo de {rubroActivo.etiqueta}
              </a>
            </div>

            {/* PRUEBA SOCIAL */}
            <div className="mt-8 flex items-center gap-3 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
              <div className="flex -space-x-2">
                <span className="inline-block h-8 w-8 rounded-full border-2 border-white bg-emerald-600 text-center text-xs font-bold leading-7 text-white dark:border-zinc-950">R</span>
                <span className="inline-block h-8 w-8 rounded-full border-2 border-white bg-blue-600 text-center text-xs font-bold leading-7 text-white dark:border-zinc-950">N</span>
                <span className="inline-block h-8 w-8 rounded-full border-2 border-white bg-purple-600 text-center text-xs font-bold leading-7 text-white dark:border-zinc-950">B</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <strong className="text-zinc-900 dark:text-white">Negocios reales</strong> ya automatizan pedidos y turnos sin intermediarios.
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA: MOCKUP INTERACTIVO EN VIVO */}
          <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
            {/* Notificación flotante 1: Ventas en tiempo real */}
            <div className="absolute -top-3 -left-3 z-20 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <rubroActivo.notificacion.icono className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                  {rubroActivo.notificacion.titulo}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {rubroActivo.notificacion.texto} · <span className="font-semibold text-emerald-600 dark:text-emerald-400">{rubroActivo.notificacion.tiempo}</span>
                </p>
              </div>
            </div>

            {/* MARCO DEL DISPOSITIVO */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white p-3.5 shadow-2xl transition dark:border-zinc-800 dark:bg-zinc-950">
              <div className="overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800/80 dark:bg-[#0c0d0e]">
                {/* Header simulado del negocio */}
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      {rubroActivo.negocio.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{rubroActivo.negocio}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400">{rubroActivo.rubroTexto}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Abierto
                  </span>
                </div>

                {/* Banner de foto dinámico */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={rubroActivo.fotoPortada}
                    alt={rubroActivo.negocio}
                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-80" />
                </div>

                {/* Tarjeta de producto o servicio en catálogo */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Destacado en el link
                    </p>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Entrega rápida</span>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      {rubroActivo.itemDestacado.nombre}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {rubroActivo.itemDestacado.detalle}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {rubroActivo.itemDestacado.precio}
                      </span>
                      <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                        {rubroActivo.id === "barberia" ? "Reservar" : "Pedir ahora"}
                      </span>
                    </div>
                  </div>

                  {/* Acciones directas integradas */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-100/60 p-2 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Pagos</p>
                      <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Mercado Pago / CVU</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-100/60 p-2 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Pedidos</p>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Directo a WhatsApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESUMEN */}
      <section className="border-y border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-sm">
            Una presencia digital pensada para negocios reales
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[
              ["01", "Página profesional"],
              ["02", "Información centralizada"],
              ["03", "WhatsApp directo"],
              ["04", "Asistente inteligente"],
            ].map(([valor, texto]) => (
              <div
                key={valor}
                className="rounded-2xl border border-zinc-200 bg-white p-3.5 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
              >
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 sm:text-sm">{valor}</p>
                <p className="mt-1 text-xs font-medium text-zinc-900 dark:text-white sm:mt-2 sm:text-base">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
              El problema
            </p>

            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
              Tener Instagram no siempre significa tener tu negocio ordenado online.
            </h2>

            <p className="mt-3.5 max-w-xl text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
              Muchos negocios tienen información repartida entre publicaciones,
              historias, mensajes y WhatsApp. El cliente termina preguntando
              cosas que podrían estar disponibles en segundos.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {problemas.map((problema) => (
              <div
                key={problema}
                className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl sm:p-4"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 sm:h-7 sm:w-7 sm:text-sm">
                  ×
                </div>

                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-sm sm:leading-6">
                  {problema}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="border-y border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
              La solución
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
              Un solo lugar para mostrar, atender y organizar tu negocio.
            </h2>

            <p className="mt-3.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
              NDI AI une tu presencia digital con herramientas para mostrar
              tu negocio, recibir consultas, organizar reservas y sumar
              inteligencia artificial cuando la necesitás.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-12 sm:gap-3">
            {[
              "Página profesional",
              "Asistente IA",
              "Turnos",
              "Leads",
              "WhatsApp directo",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 sm:px-5 sm:py-3 sm:text-sm">
                  {item}
                </div>

                {index < 4 && (
                  <span className="hidden text-zinc-400 dark:text-zinc-700 sm:inline">+</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section
        id="funciones"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
            Todo alrededor de tu negocio
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
            Más que una página web.
          </h2>

          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
            La idea es que tu página sea el punto de entrada a todo lo que un
            cliente necesita para conocerte, consultarte y avanzar.
          </p>
        </div>

        <div className="mt-8 grid gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {funciones.map(
            ({ titulo, descripcion, icono: Icono, estado }) => (
              <article
                key={titulo}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800/90 dark:bg-zinc-900/90 dark:hover:border-zinc-700 sm:p-6"
              >
                <div>
                  {estado === "preparacion" && (
                    <span className="absolute right-3 top-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300 sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[11px]">
                      En preparación
                    </span>
                  )}

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icono className="h-5 w-5 sm:h-5 sm:w-5" />
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-zinc-950 dark:text-white sm:mt-4 sm:text-lg">
                    {titulo}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-2.5 sm:text-sm sm:leading-6">
                    {descripcion}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section
        id="como-funciona"
        className="border-y border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
              Cómo funciona
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
              De la información de tu negocio a una presencia digital completa.
            </h2>
          </div>

          <div className="mt-8 grid gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {pasos.map(({ numero, titulo, descripcion }) => (
              <div
                key={numero}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
              >
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 sm:text-sm">
                  {numero}
                </span>

                <h3 className="mt-2 text-base font-semibold text-zinc-950 dark:text-white sm:mt-3 sm:text-xl">
                  {titulo}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
                  {descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section
        id="planes"
        className="border-y border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
              Planes
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
              Elegí hasta dónde querés llevar tu negocio.
            </h2>

            <p className="mt-3.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
              Elegí la versión que mejor se adapte a tu negocio. Todos los planes incluyen puesta en marcha y mantenimiento mensual.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:mt-12 lg:grid-cols-3">
            <PlanCard
              nombre="Página Simple"
              descripcion="Para negocios y profesionales que quieren su presencia web, servicios y sistema de turnos o reservas online."
              inicial="$ 89.999"
              mensual="$ 5.999/mes"
              features={planSimple}
            />

            <PlanCard
              nombre="Página Completa"
              etiqueta="Recomendado"
              descripcion="Para negocios que además necesitan catálogo de productos, cobros online con Mercado Pago y transferencias."
              inicial="$ 159.999"
              mensual="$ 9.999/mes"
              features={planCompleta}
              destacado
            />

            <PlanCard
              nombre="Business IA"
              etiqueta="Precio lanzamiento"
              descripcion="La versión más completa, con todas las herramientas de gestión más un asistente inteligente entrenado con la información real del negocio."
              inicial="$ 219.999"
              mensual="$ 15.999/mes"
              features={planBusinessIA}
              lanzamiento
            />
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="mx-auto max-w-5xl px-4 py-14 sm:px-8 sm:py-24">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Dudas frecuentes
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
            ¿Tenés preguntas? Nosotros te respondemos.
          </h2>
          <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
            Todo lo que necesitás saber antes de poner en marcha tu página web.
          </p>
        </div>

        <div className="mt-8 space-y-2.5 sm:mt-12 sm:space-y-3">
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
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40 sm:p-5"
                >
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 sm:text-base">
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 sm:h-5 sm:w-5 ${
                      abierta ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>
                {abierta && (
                  <div className="border-t border-zinc-200 px-4 pb-4 pt-2.5 dark:border-zinc-800/60 sm:px-5 sm:pb-5 sm:pt-3">
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
                      {faq.respuesta}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACTO */}
      <section
        id="contacto"
        className="border-t border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Atención directa
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-4xl">
                Empecemos tu proyecto hoy.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
                Escribinos si tenés dudas específicas sobre cómo adaptar NDI AI a tu negocio o querés consultar por planes personalizados.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300 sm:mt-8 sm:space-y-4">
                <a
                  href={`mailto:${CORREO_CONTACTO}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-zinc-700 dark:hover:text-white sm:gap-3.5 sm:p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:h-10 sm:w-10">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 sm:text-xs">Correo electrónico</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white sm:text-sm">{CORREO_CONTACTO}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Tengo una consulta sobre NDI AI para mi negocio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50 p-3.5 transition hover:bg-emerald-100/70 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 sm:gap-3.5 sm:p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 sm:h-10 sm:w-10">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 sm:text-xs">WhatsApp directo</p>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 sm:text-sm">+54 9 388 657-5664</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 sm:gap-3.5 sm:p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 sm:h-10 sm:w-10">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 sm:text-xs">Horario de atención</p>
                    <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-300 sm:text-xs">Lunes a sábados de 09:00 a 20:00 hs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400 sm:h-14 sm:w-14">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-white sm:mt-5 sm:text-xl">
                ¿Listo para poner tu negocio online?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
                Creá tu cuenta ahora y comenzá a configurar tu catálogo, servicios y turnos.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-md shadow-blue-600/20 sm:py-3.5 sm:text-sm"
                >
                  Quiero mi página
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Quiero que me ayuden a armar mi página web en NDI AI.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:py-3.5"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Hablar con un asesor por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTÓN FLOTANTE DE WHATSAPP */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre NDI AI para mi negocio.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 p-2.5 text-white shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 sm:bottom-5 sm:right-5 sm:h-13 sm:w-13 sm:p-3"
      >
        <MessageCircle className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
      </a>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8 sm:text-sm">
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">NDI AI</p>
            <p className="mt-0.5 sm:mt-1">
              Páginas inteligentes para negocios.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2">
            <Link
              href="/privacidad"
              className="transition hover:text-zinc-950 dark:hover:text-white"
            >
              Privacidad
            </Link>

            <Link
              href="/terminos"
              className="transition hover:text-zinc-950 dark:hover:text-white"
            >
              Términos
            </Link>

            <Link
              href="/login"
              className="transition hover:text-zinc-950 dark:hover:text-white"
            >
              Iniciar sesión
            </Link>
          </div>

          <p>© 2026 NDI AI.</p>
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
      className={`relative flex flex-col justify-between rounded-2xl p-5 sm:rounded-3xl sm:p-8 ${
        destacado
          ? "border border-blue-500/40 bg-blue-50/50 ring-1 ring-blue-500/20 shadow-xl shadow-blue-500/10 dark:bg-blue-500/5"
          : lanzamiento
          ? "border border-violet-500/40 bg-violet-50/50 ring-1 ring-violet-500/20 shadow-lg shadow-violet-500/10 dark:bg-violet-500/5"
          : "border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div>
        {etiqueta && (
          <span
            className={`absolute -top-3 left-5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm sm:left-6 sm:px-3 sm:py-1 sm:text-[11px] ${
              lanzamiento
                ? "bg-violet-600"
                : destacado
                ? "bg-blue-600"
                : "bg-slate-800"
            }`}
          >
            {etiqueta}
          </span>
        )}

        <h3
          className={`text-lg font-bold sm:text-xl ${
            destacado
              ? "text-blue-600 dark:text-blue-400"
              : lanzamiento
              ? "text-violet-600 dark:text-violet-400"
              : "text-zinc-950 dark:text-white"
          }`}
        >
          {nombre}
        </h3>

        <div className="mt-3.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/60 sm:mt-4 sm:rounded-2xl sm:p-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">
            Puesta en marcha
          </p>

          <p className="mt-0.5 text-2xl font-black text-zinc-950 dark:text-white sm:text-3xl">
            {inicial}
          </p>

          <p className="mt-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 sm:mt-1 sm:text-xs">
            + {mensual}
          </p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-4">
          {descripcion}
        </p>

        {lanzamiento && (
          <p className="mt-2.5 rounded-xl border border-violet-500/20 bg-violet-500/10 p-2 text-[10px] leading-relaxed text-violet-700 dark:text-violet-200 sm:mt-3 sm:p-2.5 sm:text-[11px]">
            Conservás el precio mensual de lanzamiento mientras mantengas activa tu suscripción.
          </p>
        )}

        <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-2.5">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 sm:gap-2.5 sm:text-xs"
            >
              <Check
                className={`mt-0.5 h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${
                  destacado ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              />

              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 sm:mt-8 sm:pt-4">
        <Link
          href="/register"
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold text-white transition sm:px-5 sm:py-3 ${
            destacado
              ? "bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
              : lanzamiento
              ? "bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/20"
              : "border border-zinc-200 bg-zinc-900 hover:bg-zinc-800 dark:border-zinc-700 dark:bg-zinc-800"
          }`}
        >
          Quiero mi página
        </Link>
      </div>
    </article>
  );
}