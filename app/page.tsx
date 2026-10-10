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
  Sun,
  UserRoundCheck,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";

const problemas = [
  "Clientes preguntando siempre lo mismo por privado",
  "Consultas y pedidos que llegan fuera de horario",
  "Precios e información desactualizados en historias",
  "Turnos y reservas anotados a mano en cuadernos",
  "Negocios que dependen 100% del algoritmo de Instagram",
  "Clientes que abandonan porque no ven precios claros",
];

const funciones = [
  {
    titulo: "Página y Catálogo propio",
    descripcion:
      "Un link profesional con tu logo, fotos, carta o productos organizados, precios y formas de pago.",
    icono: Building2,
    estado: "principal",
  },
  {
    titulo: "Pedidos y Ventas online",
    descripcion:
      "Tus clientes arman el carrito y te mandan el pedido listo a WhatsApp o abonan con Mercado Pago y transferencia.",
    icono: Package,
    estado: "principal",
  },
  {
    titulo: "Turnos y Reservas 24/7",
    descripcion:
      "Sistema de turnos automatizado con horarios disponibles para que tus clientes reserven solos sin esperar respuesta.",
    icono: CalendarDays,
    estado: "principal",
  },
  {
    titulo: "WhatsApp directo",
    descripcion:
      "Conexión instantánea a tu WhatsApp con el mensaje ya redactado con el producto o servicio que eligió.",
    icono: MessageCircle,
    estado: "principal",
  },
  {
    titulo: "QR para tu local",
    descripcion:
      "QR listo para imprimir y colocar en mesas, mostradores, vidrieras o folletos para acceso inmediato.",
    icono: QrCode,
    estado: "principal",
  },
  {
    titulo: "Presupuestos a medida",
    descripcion:
      "Formulario inteligente para cotizaciones complejas sin tener que responder preguntas repetitivas.",
    icono: FileText,
    estado: "principal",
  },
  {
    titulo: "Gestión de clientes",
    descripcion:
      "Base de datos de tus clientes y pedidos centralizados en un panel autogestionable simple y rápido.",
    icono: UserRoundCheck,
    estado: "principal",
  },
];

const pasos = [
  {
    numero: "01",
    titulo: "Configurás tu marca",
    descripcion:
      "Elegís tu tipografía, colores, subís tu logo y las fotos de tu local o productos.",
  },
  {
    numero: "02",
    titulo: "Cargás tu propuesta",
    descripcion:
      "Subís tus productos, servicios, precios, horarios de atención y formas de pago.",
  },
  {
    numero: "03",
    titulo: "Compartís tu link",
    descripcion:
      "Lo pegás en tu biografía de Instagram, WhatsApp Business, TikTok y en el QR de tu local.",
  },
  {
    numero: "04",
    titulo: "Tus clientes compran",
    descripcion:
      "Ven la carta o catálogo, reservan sus turnos o te envían pedidos organizados sin demoras.",
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
  "Hasta 6 imágenes de portada",
  "Hasta 10 imágenes en galería",
  "Cobros online (Mercado Pago, CVU / Alias)",
  "Código QR para compartir",
  "Solicitud de presupuestos",
  "Pedidos online organizados",
  "Estadísticas avanzadas",
];

const planBusinessIA = [
  "Todo lo incluido en Página Completa",
  "Asistente conversacional dentro de la página",
  "Asistente configurable para cada negocio",
  "Base de conocimiento del negocio",
  "Respuestas basadas en información real",
  "Conversaciones guardadas en el panel",
  "Captura y seguimiento de potenciales clientes",
  "Widget para otras páginas web",
  "Atención humana cuando sea necesaria",
  "Sin marca comercial de NDI AI",
];

export default function HomePage() {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const { theme, setTheme } = useTheme();

  // Control de scroll para el efecto 3D
  const container3DRef = useRef<HTMLDivElement>(null);
  const [rotacion3D, setRotacion3D] = useState(20);
  const [elevacionY, setElevacionY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!container3DRef.current) return;
      const scrollY = window.scrollY;
      // Progresión 3D: a medida que baja el scroll la perspectiva se endereza de 22deg a 0deg
      const nuevaRotacion = Math.max(0, 22 - scrollY * 0.04);
      const nuevaElevacion = Math.min(60, scrollY * 0.08);
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-1.5 shadow-md shadow-blue-600/30">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={18}
                height={18}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="text-base font-extrabold tracking-tight text-white">
              NDI <span className="text-blue-500 font-normal">PLATAFORMA</span>
            </p>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#funciones" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Funciones
            </a>
            <a href="#como-funciona" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              Cómo funciona
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
              Crear mi página
            </Link>
          </div>
        </div>
      </header>

      {/* HERO CON PERSPECTIVA 3D TIPO SCROLL-SHOWCASE */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 [perspective:1400px]">
        {/* Glow atmosférico */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-full max-w-6xl">
          <div className="absolute top-10 left-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
          <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[130px]" />
        </div>

        {/* TEXTOS PRINCIPALES CENTRADOS DE ALTO IMPACTO */}
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
          <h1 className="text-3xl font-black tracking-tight sm:text-6xl lg:text-[4.2rem] leading-[1.08] text-white">
            El link definitivo para vender,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              mostrar tu carta y agendar turnos.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-lg leading-relaxed text-zinc-400">
            Olvidate de pasar fotos sueltas de precios o anotar turnos a mano en WhatsApp. 
            Centralizá tu negocio en una web moderna, rápida y adaptable a cualquier celular.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-zinc-950 shadow-2xl transition hover:bg-zinc-200 active:scale-95"
            >
              Comenzar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#funciones"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-6 py-4 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 active:scale-95"
            >
              Ver funciones en acción
            </a>
          </div>
        </div>

        {/* CONTENEDOR SHOWCASE 3D REACTIVO AL SCROLL */}
        <div
          ref={container3DRef}
          className="relative mx-auto mt-12 sm:mt-16 max-w-5xl px-3 sm:px-6 transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${rotacion3D}deg) translateY(-${elevacionY}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Sombras profundas proyectadas */}
          <div className="absolute inset-x-8 -bottom-10 h-24 rounded-[3rem] bg-blue-600/15 blur-3xl" />

          {/* Marco del Showcase */}
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-700/80 bg-zinc-900/90 shadow-[0_30px_90px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-2xl">
            {/* Barra superior de navegador / app */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-1 text-xs text-zinc-400">
                <span>ndiweb.com/tu-negocio</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                Online 24/7
              </div>
            </div>

            {/* VISTA REAL DEL NEGOCIO INTERACTIVO (GRILLA COMPACTA DE PRODUCTOS) */}
            <div className="p-4 sm:p-7 bg-[#0c0d0e]">
              {/* Header interior del negocio */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Catálogo oficial
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Colección Urbana & Calidad
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                    WhatsApp directo
                  </span>
                  <span className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400">
                    Mercado Pago
                  </span>
                </div>
              </div>

              {/* 4 Cards de productos reales compactas */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  {
                    nombre: "Remera Oversize Essential",
                    precio: "$ 24.900",
                    foto: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
                    tag: "Talles S a XL",
                  },
                  {
                    nombre: "Buzo Canguro Urban",
                    precio: "$ 44.900",
                    foto: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=500&q=80",
                    tag: "Frisa pesada",
                  },
                  {
                    nombre: "Riñonera Waterproof",
                    precio: "$ 21.900",
                    foto: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80",
                    tag: "Impermeable",
                  },
                  {
                    nombre: "Gorra Classic Strapback",
                    precio: "$ 18.900",
                    foto: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=500&q=80",
                    tag: "Ajustable",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2 sm:p-3 shadow-md"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg sm:rounded-xl">
                      <img
                        src={item.foto}
                        alt={item.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2.5">
                      <p className="line-clamp-1 text-xs sm:text-sm font-bold text-white">
                        {item.nombre}
                      </p>
                      <p className="text-[10px] text-zinc-500">{item.tag}</p>
                      <div className="mt-2 flex items-center justify-between border-t border-zinc-800/80 pt-2">
                        <span className="text-xs sm:text-sm font-black text-emerald-400">
                          {item.precio}
                        </span>
                        <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[9px] font-semibold text-zinc-200">
                          Ver
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
              El problema real
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Tener Instagram no significa tener tu negocio ordenado.
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400">
              Los clientes no tienen tiempo de esperar que les contestes un mensaje para saber cuánto cuesta un producto o si tenés turno libre. Si no lo encuentran en segundos, se van a otro lado.
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

      {/* FUNCIONES CLAVE */}
      <section id="funciones" className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 border-t border-zinc-800/60">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
            Herramientas integradas
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Todo lo que tu comercio necesita en un solo lugar.
          </h2>
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
            Puesta en marcha única y mantenimiento mensual accesible.
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
            descripcion="Todas las funciones de gestión más asistente inteligente entrenado con datos de tu negocio."
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
            Dudas comunes
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

      {/* CONTACTO */}
      <section id="contacto" className="border-t border-zinc-800/80 bg-zinc-950/60 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Empecemos tu proyecto hoy.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400">
            Escribinos directamente por WhatsApp para coordinar el armado de tu página.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Quiero activar mi página en NDI.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl transition hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              Contactar por WhatsApp
            </a>
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