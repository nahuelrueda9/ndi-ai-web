"use client";

import { useState } from "react";
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
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  QrCode,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "nahuel.disenio@gmail.com";

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

  const toggleFaq = (index: number) => {
    setFaqAbierta(faqAbierta === index ? null : index);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
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

            <p className="text-sm font-bold tracking-[0.14em] text-white">
              NDI AI
            </p>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#funciones"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Funciones
            </a>
            <a
              href="#como-funciona"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Cómo funciona
            </a>
            <a
              href="#planes"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Planes
            </a>
            <a
              href="#faq"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Preguntas
            </a>
            <a
              href="#contacto"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Contacto
            </a>
          </nav>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white sm:px-3 sm:py-2 sm:text-xs"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-500 sm:px-4 sm:text-xs"
            >
              Quiero mi página
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_64%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400 sm:text-xs">
              Páginas inteligentes para negocios
            </p>

            <h1 className="mt-2.5 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:mt-4 sm:text-5xl lg:text-[3.6rem]">
              Tu negocio,
              <span className="block text-blue-400">
                siempre disponible.
              </span>
            </h1>

            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:mt-5 sm:text-base sm:leading-7">
              Mostrá lo que ofrecés, centralizá tu información y facilitá que tus
              clientes te encuentren, consulten o reserven desde un solo lugar.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/25 sm:px-6 sm:py-3.5"
              >
                Crear mi página
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-4 text-xs text-zinc-500 sm:mt-6">
              Página propia · WhatsApp · Turnos · Asistente IA
            </p>
          </div>

          {/* VISTA PREVIA */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-600/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 sm:px-5 sm:py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-zinc-700 sm:h-2.5 sm:w-2.5" />
                  <span className="h-2 w-2 rounded-full bg-zinc-700 sm:h-2.5 sm:w-2.5" />
                  <span className="h-2 w-2 rounded-full bg-zinc-700 sm:h-2.5 sm:w-2.5" />
                </div>

                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">
                  Ejemplo de página NDI AI
                </p>
              </div>

              <div className="relative min-h-[260px] bg-gradient-to-br from-blue-600/15 via-zinc-950 to-zinc-900 p-4 sm:min-h-[390px] sm:p-8">
                <div className="mx-auto flex max-w-lg flex-col items-center justify-center text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 sm:h-12 sm:w-12">
                    <Globe2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400 sm:text-xs">
                    Tu página puede verse así
                  </p>

                  <h2 className="mt-2 max-w-md text-xl font-bold leading-snug text-white sm:text-3xl">
                    Una página clara, profesional y pensada para tu negocio.
                  </h2>

                  <p className="mt-2.5 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm sm:leading-6">
                    Acá podés mostrar tus servicios, productos, horarios, ubicación, reservas y botones de contacto directo.
                  </p>

                  <div className="mt-5 grid w-full max-w-md grid-cols-3 gap-2 sm:gap-2.5">
                    {[
                      "Servicios",
                      "Ubicación",
                      "Contacto",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-2 py-2 text-[10px] font-medium text-zinc-300 sm:py-3 sm:text-xs"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 px-4 py-2.5 text-center sm:px-5 sm:py-3">
                <p className="text-[10px] text-zinc-500 sm:text-xs">
                  Adaptable a celulares, tablets y computadoras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESUMEN */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
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
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-center sm:p-5"
              >
                <p className="text-xs font-bold text-blue-400 sm:text-sm">{valor}</p>
                <p className="mt-1 text-xs font-medium text-white sm:mt-2 sm:text-base">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
              El problema
            </p>

            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
              Tener Instagram no siempre significa tener tu negocio ordenado online.
            </h2>

            <p className="mt-3.5 max-w-xl text-xs leading-relaxed text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
              Muchos negocios tienen información repartida entre publicaciones,
              historias, mensajes y WhatsApp. El cliente termina preguntando
              cosas que podrían estar disponibles en segundos.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {problemas.map((problema) => (
              <div
                key={problema}
                className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:rounded-2xl sm:p-4"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400 sm:h-7 sm:w-7 sm:text-sm">
                  ×
                </div>

                <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm sm:leading-6">
                  {problema}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
              La solución
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
              Un solo lugar para mostrar, atender y organizar tu negocio.
            </h2>

            <p className="mt-3.5 text-xs leading-relaxed text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
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
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-200 sm:px-5 sm:py-3 sm:text-sm">
                  {item}
                </div>

                {index < 4 && (
                  <span className="hidden text-zinc-700 sm:inline">+</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES (OPTIMIZADA COMPACTA) */}
      <section
        id="funciones"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
            Todo alrededor de tu negocio
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
            Más que una página web.
          </h2>

          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
            La idea es que tu página sea el punto de entrada a todo lo que un
            cliente necesita para conocerte, consultarte y avanzar.
          </p>
        </div>

        <div className="mt-8 grid gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {funciones.map(
            ({ titulo, descripcion, icono: Icono, estado }) => (
              <article
                key={titulo}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/90 p-4 transition hover:border-zinc-700 sm:p-6"
              >
                <div>
                  {estado === "preparacion" && (
                    <span className="absolute right-3 top-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[11px]">
                      En preparación
                    </span>
                  )}

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icono className="h-5 w-5 sm:h-5 sm:w-5" />
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-white sm:mt-4 sm:text-lg">
                    {titulo}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:mt-2.5 sm:text-sm sm:leading-6">
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
        className="border-y border-zinc-800 bg-zinc-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
              Cómo funciona
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
              De la información de tu negocio a una presencia digital completa.
            </h2>
          </div>

          <div className="mt-8 grid gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {pasos.map(({ numero, titulo, descripcion }) => (
              <div
                key={numero}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
              >
                <span className="text-xs font-bold text-blue-400 sm:text-sm">
                  {numero}
                </span>

                <h3 className="mt-2 text-base font-semibold text-white sm:mt-3 sm:text-xl">
                  {titulo}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
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
        className="border-y border-zinc-800 bg-zinc-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
              Planes
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
              Elegí hasta dónde querés llevar tu negocio.
            </h2>

            <p className="mt-3.5 text-xs leading-relaxed text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">
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
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Dudas frecuentes
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
            ¿Tenés preguntas? Nosotros te respondemos.
          </h2>
          <p className="mt-3 text-xs text-zinc-400 sm:mt-4 sm:text-sm">
            Todo lo que necesitás saber antes de poner en marcha tu página web.
          </p>
        </div>

        <div className="mt-8 space-y-2.5 sm:mt-12 sm:space-y-3">
          {faqs.map((faq, index) => {
            const abierta = faqAbierta === index;
            return (
              <div
                key={faq.pregunta}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-zinc-800/40 sm:p-5"
                >
                  <span className="text-xs font-semibold text-zinc-200 sm:text-base">
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 sm:h-5 sm:w-5 ${
                      abierta ? "rotate-180 text-blue-400" : ""
                    }`}
                  />
                </button>
                {abierta && (
                  <div className="border-t border-zinc-800/60 px-4 pb-4 pt-2.5 sm:px-5 sm:pb-5 sm:pt-3">
                    <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
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
        className="border-t border-zinc-800 bg-zinc-900/40"
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Atención directa
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
                Empecemos tu proyecto hoy.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400 sm:mt-4 sm:text-sm">
                Escribinos si tenés dudas específicas sobre cómo adaptar NDI AI a tu negocio o querés consultar por planes personalizados.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-300 sm:mt-8 sm:space-y-4">
                <a
                  href={`mailto:${CORREO_CONTACTO}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 transition hover:border-zinc-700 hover:text-white sm:gap-3.5 sm:p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 sm:h-10 sm:w-10">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 sm:text-xs">Correo electrónico</p>
                    <p className="text-xs font-semibold text-white sm:text-sm">{CORREO_CONTACTO}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Tengo una consulta sobre NDI AI para mi negocio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 transition hover:bg-emerald-500/10 sm:gap-3.5 sm:p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 sm:h-10 sm:w-10">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-400/80 sm:text-xs">WhatsApp directo</p>
                    <p className="text-xs font-semibold text-emerald-300 sm:text-sm">+54 9 388 657-5664</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-zinc-400 sm:gap-3.5 sm:p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 sm:h-10 sm:w-10">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 sm:text-xs">Horario de atención</p>
                    <p className="text-[11px] font-medium text-zinc-300 sm:text-xs">Lunes a sábados de 09:00 a 20:00 hs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8 text-center shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 sm:h-14 sm:w-14">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white sm:mt-5 sm:text-xl">
                ¿Listo para poner tu negocio online?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 py-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 sm:py-3.5"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
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
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8 sm:text-sm">
          <div>
            <p className="font-medium text-zinc-300">NDI AI</p>
            <p className="mt-0.5 sm:mt-1">
              Páginas inteligentes para negocios.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2">
            <Link
              href="/privacidad"
              className="transition hover:text-white"
            >
              Privacidad
            </Link>

            <Link
              href="/terminos"
              className="transition hover:text-white"
            >
              Términos
            </Link>

            <Link
              href="/login"
              className="transition hover:text-white"
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
          ? "border border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20 shadow-xl shadow-blue-500/10"
          : lanzamiento
          ? "border border-violet-500/40 bg-violet-500/5 ring-1 ring-violet-500/20 shadow-lg shadow-violet-500/10"
          : "border border-zinc-800 bg-zinc-900"
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
              ? "text-blue-400"
              : lanzamiento
              ? "text-violet-400"
              : "text-white"
          }`}
        >
          {nombre}
        </h3>

        <div className="mt-3.5 rounded-xl bg-zinc-950/60 p-3 border border-zinc-800/80 sm:mt-4 sm:rounded-2xl sm:p-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">
            Puesta en marcha
          </p>

          <p className="mt-0.5 text-2xl font-black text-white sm:text-3xl">
            {inicial}
          </p>

          <p className="mt-0.5 text-[11px] font-bold text-blue-400 sm:mt-1 sm:text-xs">
            + {mensual}
          </p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-zinc-400 sm:mt-4">
          {descripcion}
        </p>

        {lanzamiento && (
          <p className="mt-2.5 rounded-xl border border-violet-500/20 bg-violet-500/10 p-2 text-[10px] leading-relaxed text-violet-200 sm:mt-3 sm:p-2.5 sm:text-[11px]">
            Conservás el precio mensual de lanzamiento mientras mantengas activa tu suscripción.
          </p>
        )}

        <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-2.5">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-2 text-[11px] text-zinc-300 sm:gap-2.5 sm:text-xs"
            >
              <Check
                className={`mt-0.5 h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${
                  destacado ? "text-blue-400" : "text-emerald-400"
                }`}
              />

              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-zinc-800/80 sm:mt-8 sm:pt-4">
        <Link
          href="/register"
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold text-white transition sm:px-5 sm:py-3 ${
            destacado
              ? "bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
              : lanzamiento
              ? "bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/20"
              : "border border-zinc-700 hover:bg-zinc-800"
          }`}
        >
          Quiero mi página
        </Link>
      </div>
    </article>
  );
}