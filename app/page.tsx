"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  QrCode,
  Sparkles,
  UserRoundCheck,
  Zap,
} from "lucide-react";

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

const ejemplos = [
  {
    rubro: "Barberías, estética y consultorios",
    titulo: "Servicios, precios y reservas",
    descripcion:
      "Mostrá servicios, profesionales, precios y horarios, y permití que tus clientes consulten o reserven turnos desde tu página.",
    icono: CalendarDays,
  },
  {
    rubro: "Alojamiento y turismo",
    titulo: "Todo el alojamiento en un solo lugar",
    descripcion:
      "Mostrá habitaciones, servicios, ubicación, fotografías, preguntas frecuentes y formas de contacto.",
    icono: MapPin,
  },
  {
    rubro: "Profesionales",
    titulo: "Una presencia más profesional",
    descripcion:
      "Presentá tus servicios, experiencia, horarios de atención y permití que potenciales clientes puedan consultarte.",
    icono: UserRoundCheck,
  },
  {
    rubro: "Talleres y comercios",
    titulo: "Servicios claros para tus clientes",
    descripcion:
      "Centralizá trabajos, productos, información útil, horarios y contacto sin depender únicamente de redes sociales.",
    icono: Building2,
  },
];

const planSimple = [
  "Página pública profesional",
  "Logo, portada, colores e identidad visual",
  "Información completa del negocio",
  "Servicios, productos o carta básica según tu negocio",
  "Nombre, descripción, precio y 1 imagen por ítem",
  "Consultas o pedidos por WhatsApp",
  "Horarios de atención",
  "Ubicación y mapa",
  "Redes sociales",
  "Botón directo a WhatsApp",
  "Teléfono, correo y formulario de contacto",
  "Galería de imágenes",
  "Estadísticas básicas",
];

const planCompleta = [
  "Todo lo incluido en Página Simple",
  "Productos, catálogo o carta",
  "Hasta 3 imágenes por producto o servicio",
  "Detalle completo de productos",
  "Código QR para compartir",
  "Solicitud de presupuestos",
  "Agenda propia de NDI AI",
  "Turnos y reservas online",
  "Reservas de alojamiento para hoteles y hostales",
  "Reservas de mesa para restaurantes",
  "Pedidos online para restaurantes",
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
const proximamente = [
  {
    titulo: "WhatsApp Business",
    descripcion:
      "Atención automática directamente desde WhatsApp Business.",
    icono: MessageCircle,
  },
  {
    titulo: "Instagram",
    descripcion:
      "Automatización de consultas y mensajes recibidos desde Instagram.",
    icono: MessageCircle,
  },
  {
    titulo: "Facebook Messenger",
    descripcion:
      "Atención y respuestas automáticas también desde Messenger.",
    icono: MessageCircle,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-8 sm:py-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 sm:h-11 sm:w-11 sm:rounded-2xl">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-blue-400 sm:text-xs sm:tracking-[0.22em]">
                NDI AI
              </p>
              <p className="text-sm font-semibold leading-5 text-white sm:text-base">
                Páginas inteligentes
              </p>
            </div>
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
              href="#proximamente"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Próximamente
            </a>
          </nav>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Quiero mi página
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_62%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-16 sm:px-8 sm:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] leading-4 text-blue-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
              <Zap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Una nueva forma de mostrar y atender tu negocio
            </div>

            <h1 className="mt-4 max-w-3xl text-[1.8rem] font-bold leading-[1.08] tracking-tight sm:mt-7 sm:text-5xl sm:leading-tight lg:text-6xl">
              Tu negocio, disponible
              <span className="text-blue-400">
                {" "}
                incluso cuando vos no estás.
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-[13px] leading-5 text-zinc-400 sm:mt-6 sm:text-lg sm:leading-8">
              Mostrá tus servicios, productos, precios, horarios y ubicación
              desde una página profesional. Recibí consultas, conectá con
              WhatsApp y sumá inteligencia artificial para atender mejor a tus
              clientes.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 sm:rounded-xl sm:px-6 sm:py-3.5 sm:text-base"
              >
                Ver cómo funciona
                <ArrowRight className="h-5 w-5" />
              </a>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 sm:rounded-xl sm:px-6 sm:py-3.5 sm:text-base"
              >
                Quiero mi página
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-1.5 text-[11px] text-zinc-400 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 sm:text-sm">
              {[
                "Tu información en un solo lugar",
                "WhatsApp directo",
                "Administración desde NDI AI",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* MOCKUP */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-blue-600/10 blur-3xl" />

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 sm:h-10 sm:w-10 sm:rounded-xl">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold">Estudio Norte</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Página del negocio
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Disponible
                  </span>
                </div>

                <div className="relative h-28 border-b border-zinc-800 bg-gradient-to-br from-blue-600/30 via-zinc-900 to-zinc-950 p-4 sm:h-40 sm:p-6">
                  <div className="absolute bottom-3 left-4 sm:bottom-5 sm:left-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-300">
                      Tu negocio online
                    </p>
                    <p className="mt-1 text-lg font-bold leading-6 sm:mt-2 sm:text-2xl">
                      Todo lo que tus clientes necesitan saber.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-3.5 sm:gap-4 sm:p-5">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">Servicios</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Información y precios
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">Horarios</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Siempre actualizados
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">Ubicación</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Fácil de encontrar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Contacto directo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative -mt-3 ml-3 rounded-xl border border-blue-500/20 bg-zinc-950 p-3 shadow-2xl sm:-mt-5 sm:ml-20 sm:rounded-2xl sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Asistente NDI AI
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      “Sí, ese servicio está disponible. El horario de atención
                      de hoy es de 9:00 a 18:00.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESUMEN */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Una presencia digital pensada para negocios reales
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Página profesional"],
              ["02", "Información centralizada"],
              ["03", "WhatsApp directo"],
              ["04", "Asistente inteligente"],
            ].map(([valor, texto]) => (
              <div
                key={valor}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center"
              >
                <p className="text-sm font-bold text-blue-400">{valor}</p>
                <p className="mt-2 font-medium text-white">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-blue-400">
              El problema
            </p>

            <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              Tener Instagram no siempre significa tener tu negocio ordenado
              online.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-zinc-400">
              Muchos negocios tienen información repartida entre publicaciones,
              historias, mensajes y WhatsApp. El cliente termina preguntando
              cosas que podrían estar disponibles en segundos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {problemas.map((problema) => (
              <div
                key={problema}
                className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                  <span className="text-sm text-zinc-400">×</span>
                </div>

                <p className="text-sm leading-6 text-zinc-300">
                  {problema}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium text-blue-400">
              La solución
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Un solo lugar para mostrar, atender y organizar tu negocio.
            </h2>

            <p className="mt-5 leading-8 text-zinc-400">
              NDI AI une tu presencia digital con herramientas para mostrar
              tu negocio, recibir consultas, organizar reservas y sumar
              inteligencia artificial cuando la necesitás.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              "Página profesional",
              "Asistente IA",
              "Turnos",
              "Leads",
              "WhatsApp directo",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-medium text-zinc-200">
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

      {/* FUNCIONES */}
      <section
        id="funciones"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-blue-400">
            Todo alrededor de tu negocio
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Más que una página web.
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-zinc-400">
            La idea es que tu página sea el punto de entrada a todo lo que un
            cliente necesita para conocerte, consultarte y avanzar.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {funciones.map(
            ({ titulo, descripcion, icono: Icono, estado }) => (
              <article
                key={titulo}
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                {estado === "preparacion" && (
                  <span className="absolute right-4 top-4 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                    En preparación
                  </span>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <Icono className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">{titulo}</h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {descripcion}
                </p>
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
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-400">
              Cómo funciona
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              De la información de tu negocio a una presencia digital completa.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pasos.map(({ numero, titulo, descripcion }) => (
              <div
                key={numero}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <span className="text-sm font-bold text-blue-400">
                  {numero}
                </span>

                <h3 className="mt-3 text-xl font-semibold">{titulo}</h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EJEMPLOS */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-blue-400">
            Para distintos rubros
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            NDI AI no está pensado para un solo tipo de negocio.
          </h2>

          <p className="mt-5 leading-8 text-zinc-400">
            La misma plataforma puede adaptarse a distintas actividades,
            mostrando la información que realmente necesita cada cliente.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {ejemplos.map(
            ({ rubro, titulo, descripcion, icono: Icono }) => (
              <article
                key={rubro}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-7 transition hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                    <Icono className="h-6 w-6" />
                  </div>

                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-500">
                    {rubro}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold">{titulo}</h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {descripcion}
                </p>
              </article>
            ),
          )}
        </div>
      </section>

      {/* TURNOS */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
              <CalendarDays className="h-4 w-4" />
              Agenda y reservas
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Tus turnos, ordenados desde un solo lugar.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-zinc-400">
              Configurá horarios, recibí reservas desde tu página y administrá
              cada turno desde el panel de NDI AI. Disponible desde Página
              Completa.
            </p>

            <div className="mt-7 space-y-3">
              {[
                "Turnos del día",
                "Próximas reservas",
                "Calendario mensual",
                "Servicios y duración",
                "Horarios disponibles",
                "Estados de cada turno",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-zinc-300"
                >
                  <Check className="h-4 w-4 text-blue-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
              <div>
                <p className="font-semibold">Agenda</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Reservas y disponibilidad del negocio
                </p>
              </div>

              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                Agosto
              </span>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-zinc-500">
              {["L", "M", "X", "J", "V", "S", "D"].map((dia) => (
                <div key={dia} className="py-2">
                  {dia}
                </div>
              ))}

              {Array.from({ length: 28 }, (_, index) => index + 1).map(
                (dia) => (
                  <div
                    key={dia}
                    className={`rounded-lg py-2.5 ${
                      dia === 12
                        ? "bg-blue-600 font-semibold text-white"
                        : dia === 18 || dia === 22
                          ? "bg-zinc-800 text-zinc-200"
                          : "text-zinc-500"
                    }`}
                  >
                    {dia}
                  </div>
                ),
              )}
            </div>

            <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5">
              <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-3">
                <div>
                  <p className="text-sm font-medium">16:00</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Servicio reservado
                  </p>
                </div>

                <span className="text-xs text-emerald-400">
                  Confirmado
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-3">
                <div>
                  <p className="text-sm font-medium">17:30</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Próximo horario
                  </p>
                </div>

                <span className="text-xs text-blue-400">
                  Disponible
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IA */}
      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold">Asistente NDI AI</p>
              <p className="mt-1 text-xs text-zinc-500">
                Respuestas con información del negocio
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-zinc-800 px-4 py-3">
              <p className="text-sm leading-6 text-zinc-200">
                ¿Cuánto cuesta el servicio y hasta qué hora atienden?
              </p>
              <p className="mt-2 text-[11px] text-zinc-500">
                Cliente
              </p>
            </div>

            <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-blue-600 px-4 py-3">
              <p className="text-sm leading-6 text-white">
                El servicio cuesta $15.000 y hoy atendemos hasta las 18:00.
                También puedo ayudarte con la ubicación o los servicios
                disponibles.
              </p>

              <p className="mt-2 text-[11px] text-blue-200">
                Respondido por NDI AI
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-blue-400">
            Inteligencia artificial
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Una IA que conoce tu negocio.
          </h2>

          <p className="mt-5 max-w-xl leading-8 text-zinc-400">
            En lugar de responder de forma genérica, NDI AI utiliza la
            información que cargaste para ayudar a tus clientes desde tu propia
            página.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Servicios",
              "Productos",
              "Precios",
              "Horarios",
              "Ubicación",
              "Preguntas frecuentes",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300"
              >
                <Check className="h-4 w-4 text-blue-400" />
                {item}
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
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium text-blue-400">
              Planes
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Elegí hasta dónde querés llevar tu negocio.
            </h2>

            <p className="mt-5 leading-8 text-zinc-400">
              Elegí la versión que mejor se adapte a tu negocio. Todos los
              planes incluyen puesta en marcha y mantenimiento mensual.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <PlanCard
              nombre="Página Simple"
              descripcion="Para negocios que quieren tener toda su información ordenada en una página profesional y facilitar el contacto con sus clientes."
              inicial="$ 89.999"
              mensual="$ 5.999/mes"
              features={planSimple}
            />

            <PlanCard
              nombre="Página Completa"
              descripcion="Para negocios que además necesitan catálogo, productos, presupuestos, turnos, reservas o pedidos según su actividad."
              inicial="$ 159.999"
              mensual="$ 9.999/mes"
              features={planCompleta}
              destacado
            />

            <PlanCard
              nombre="Business IA"
              descripcion="La versión más completa, con todas las herramientas de gestión más un asistente inteligente entrenado con la información real del negocio."
              inicial="$ 219.999"
              mensual="$ 15.999/mes"
              features={planBusinessIA}
              lanzamiento
            />
          </div>
        </div>
      </section>

      {/* PRÓXIMAMENTE */}
      <section
        id="proximamente"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Próximamente
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            NDI AI va a seguir creciendo.
          </h2>

          <p className="mt-5 leading-8 text-zinc-400">
            Estas integraciones ya forman parte de nuestra evolución técnica,
            pero todavía no están disponibles comercialmente para conectar
            cuentas externas.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {proximamente.map(
            ({ titulo, descripcion, icono: Icono }) => (
              <article
                key={titulo}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
                  <Icono className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">{titulo}</h3>

                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  {descripcion}
                </p>

                <span className="mt-5 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                  Próximamente
                </span>
              </article>
            ),
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-500/10 px-6 py-12 sm:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_60%)]" />

            <div className="relative">
              <p className="text-sm font-medium text-blue-300">
                NDI AI
              </p>

              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                Dale a tu negocio una presencia digital que trabaje por vos.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-7 text-zinc-300">
                Creá tu página, cargá la información de tu negocio y elegí
                el plan que mejor se adapte a lo que necesitás.
              </p>

              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500"
              >
                Quiero mi página
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-medium text-zinc-300">NDI AI</p>
            <p className="mt-1">
              Páginas inteligentes para negocios.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
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
  descripcion,
  inicial,
  mensual,
  features,
  destacado = false,
  lanzamiento = false,
}: {
  nombre: string;
  descripcion: string;
  inicial: string;
  mensual: string;
  features: string[];
  destacado?: boolean;
  lanzamiento?: boolean;
}) {
  return (
    <article
      className={`relative rounded-3xl p-7 sm:p-8 ${
        destacado
          ? "border border-blue-500/30 bg-blue-500/5"
          : "border border-zinc-800 bg-zinc-900"
      }`}
    >
      {destacado && (
        <span className="absolute right-6 top-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          Recomendado
        </span>
      )}

      {lanzamiento && (
        <span className="absolute right-6 top-6 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
          Precio lanzamiento
        </span>
      )}

      <p
        className={
          destacado
            ? "text-sm font-medium text-blue-400"
            : "text-sm font-medium text-zinc-400"
        }
      >
        {nombre}
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Puesta en marcha
        </p>

        <p className="mt-1 text-3xl font-bold text-white">
          {inicial}
        </p>

        <p className="mt-1 text-sm font-semibold text-blue-400">
          + {mensual}
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">
        {descripcion}
      </p>

      {lanzamiento && (
        <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs leading-5 text-violet-200">
          Conservás este precio mensual mientras mantengas activa tu suscripción.
        </p>
      )}

      <div className="mt-7 space-y-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-3 text-sm text-zinc-300"
          >
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                destacado ? "text-blue-400" : "text-emerald-400"
              }`}
            />

            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Link
        href="/register"
        className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold text-white transition ${
          destacado
            ? "bg-blue-600 hover:bg-blue-500"
            : "border border-zinc-700 hover:bg-zinc-800"
        }`}
      >
        Quiero mi página
      </Link>
    </article>
  );
}