"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  UtensilsCrossed,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Building2,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";
const BEHANCE_URL = "https://www.behance.net/nahuelrueda";

// 20 imágenes del portfolio real
const IMAGENES_PORTFOLIO = [
  "/portfolio/imagen1.jpg",
  "/portfolio/imagen2.jpg",
  "/portfolio/imagen3.jpg",
  "/portfolio/imagen4.jpg",
  "/portfolio/imagen5.jpg",
  "/portfolio/imagen6.jpg",
  "/portfolio/imagen7.jpg",
  "/portfolio/imagen8.jpg",
  "/portfolio/imagen9.jpg",
  "/portfolio/imagen10.jpg",
  "/portfolio/imagen11.jpg",
  "/portfolio/imagen12.jpg",
  "/portfolio/imagen13.jpg",
  "/portfolio/imagen14.jpg",
  "/portfolio/imagen15.jpg",
  "/portfolio/imagen16.jpg",
  "/portfolio/imagen17.jpg",
  "/portfolio/imagen18.png",
  "/portfolio/imagen19.png",
  "/portfolio/imagen20.png",
];

// Modelos de muestra
const modelosArriba = [
  {
    id: "restaurantes",
    label: "Restaurantes",
    icono: UtensilsCrossed,
    titulo: "Sabores del Norte",
    categoria: "Gastronomía & Bares",
    subtitulo: "Menú digital interactivo con pedidos directos a WhatsApp, fotos de platos y reserva de mesas.",
    imagenes: [
      "/modelos/modelo-gastro1.png",
      "/modelos/modelo-gastro2.png",
      "/modelos/modelo-gastro3.png",
    ],
    badge: "Carta & Pedidos",
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
    imagenes: [
      "/modelos/modelo-tienda1.png",
      "/modelos/modelo-tienda2.png",
      "/modelos/modelo-tienda3.png",
    ],
    badge: "Catálogo Online",
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
    imagenes: [
      "/modelos/modelo-estetica1.png",
      "/modelos/modelo-estetica2.png",
      "/modelos/modelo-estetica3.png",
    ],
    badge: "Turnos 24/7",
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Barberías y Salones.")}`,
    caracteristicas: ["Turnos confirmados al instante", "Agenda autogestionable"],
  },
];

const modelosAbajo = [
  {
    id: "consultorios",
    label: "Consultorios",
    icono: Stethoscope,
    titulo: "Centro Médico & Salud",
    categoria: "Consultorios & Profesionales",
    subtitulo: "Gestión de citas previas, información de especialidades, ubicación en mapa y contacto directo.",
    imagenes: [
      "/modelos/modelo-salud1.png",
      "/modelos/modelo-salud2.png",
      "/modelos/modelo-salud3.png",
    ],
    badge: "Atención Profesional",
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Consultorios Profesionales.")}`,
    caracteristicas: ["Citas y horarios disponibles", "Ubicación en Google Maps"],
  },
  {
    id: "hoteles",
    label: "Hotelería",
    icono: Building2,
    titulo: "Hotel & Hospedaje",
    categoria: "Hotelería & Turismo",
    subtitulo: "Galería de habitaciones, consulta directa de disponibilidad y reservas conectadas.",
    imagenes: [
      "/modelos/modelo-hotel1.png",
      "/modelos/modelo-hotel2.png",
      "/modelos/modelo-hotel3.png",
    ],
    badge: "Reservas & Estadías",
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola! Me gustaría ver un demo funcional para Hoteles y Hospedajes.")}`,
    caracteristicas: ["Galería de habitaciones", "Consultas por WhatsApp"],
  },
];

const beneficios = [
  {
    titulo: "Diseño Web",
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

function TarjetaModelo({ p }: { p: any }) {
  const [slide, setSlide] = useState(0);
  const Icono = p.icono;

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % p.imagenes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [p.imagenes.length]);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 w-full">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
          {p.imagenes.map((img: string, i: number) => (
            <img
              key={img}
              src={img}
              alt={`${p.titulo} vista ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 ${
                i === slide ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              }`}
              onError={(e) => {
                e.currentTarget.src = img.replace(".png", ".jpg");
              }}
            />
          ))}

          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="rounded-full bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
              {p.badge}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 z-10 flex gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-xs">
            {p.imagenes.map((_: any, i: number) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-3 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
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
            {p.caracteristicas.map((c: string, i: number) => (
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
}

export default function HomePage() {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const [mostrarBotonHeader, setMostrarBotonHeader] = useState(false);
  const [errorFotoNahuel, setErrorFotoNahuel] = useState(false);
  const [activo, setActivo] = useState(0);
  const { theme, setTheme } = useTheme();

  // Rotación suave del carrusel 3D
  useEffect(() => {
    const timer = setInterval(() => {
      setActivo((prev) => (prev + 1) % IMAGENES_PORTFOLIO.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

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
              Modelos
            </a>
            <a href="#planes" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Planes
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
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por diseño gráfico y una página web para mi negocio.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[var(--brand)] px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90 whitespace-nowrap"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* PORTADA: CARRUSEL CINEMÁTICO 3D (COVERFLOW SHOWCASE) */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 mb-4">
              <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
              <span>Diseño Gráfico & Desarrollo Web</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.8rem] font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.12]">
              Potencia tu marca con diseño.
              <span className="block text-zinc-500 dark:text-zinc-400 font-medium text-2xl sm:text-4xl lg:text-[2.7rem] mt-2">
                Su visión, nuestra experiencia.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
              Diseño la identidad visual de tu marca y tu web a medida. Tus clientes ven productos, agendan turnos y te hacen pedidos directos por WhatsApp.
            </p>
          </div>

          {/* MARCO GRANDE CON COMPOSICIÓN 3D CINEMÁTICA */}
          <div className="relative mt-12 sm:mt-16 mx-auto max-w-6xl [perspective:1400px]">
            
            {/* TARJETA NEGRA SUPERIOR IZQUIERDA */}
            <div className="absolute -top-5 -left-2 sm:-top-7 sm:-left-6 rounded-2xl sm:rounded-3xl bg-zinc-950 p-4 sm:p-5 text-white shadow-2xl border border-zinc-800 text-left max-w-[170px] sm:max-w-[220px] z-30">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-none">
                100%
              </p>
              <p className="mt-1.5 text-[11px] sm:text-xs text-zinc-400 font-medium leading-snug">
                autogestionable en todos los dispositivos.
              </p>
            </div>

            {/* ESCENA CINEMÁTICA COVERFLOW: Tarjeta central en primer plano y laterales en perspectiva */}
            <div className="relative overflow-hidden rounded-[2.2rem] sm:rounded-[3.2rem] border border-zinc-200/90 bg-zinc-950 shadow-2xl dark:border-zinc-800 aspect-[16/10] sm:aspect-[16/9] w-full min-h-[380px] sm:min-h-[560px] flex items-center justify-center p-4">
              
              <div className="relative w-full h-full flex items-center justify-center">
                {IMAGENES_PORTFOLIO.map((imagen, index) => {
                  const total = IMAGENES_PORTFOLIO.length;
                  let offset = (index - activo) % total;
                  if (offset < -Math.floor(total / 2)) offset += total;
                  if (offset > Math.floor(total / 2)) offset -= total;

                  // Mostramos las más cercanas en 3D
                  const esVisible = Math.abs(offset) <= 2;
                  if (!esVisible) return null;

                  const esCentro = offset === 0;

                  return (
                    <div
                      key={imagen}
                      onClick={() => setActivo(index)}
                      className={`absolute cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        esCentro
                          ? "w-[82%] sm:w-[74%] h-[88%] z-20 border-white/20 scale-100 opacity-100 [transform:translateX(0px)_translateZ(0px)]"
                          : offset < 0
                          ? "w-[68%] sm:w-[60%] h-[78%] z-10 border-white/10 opacity-40 blur-[0.5px] [transform:translateX(-42%)_translateZ(-180px)_rotateY(22deg)] hover:opacity-60"
                          : "w-[68%] sm:w-[60%] h-[78%] z-10 border-white/10 opacity-40 blur-[0.5px] [transform:translateX(42%)_translateZ(-180px)_rotateY(-22deg)] hover:opacity-60"
                      }`}
                    >
                      <img
                        src={imagen}
                        alt={`Portfolio NDI ${index + 1}`}
                        className="w-full h-full object-contain sm:object-cover object-center bg-zinc-900"
                        onError={(e) => {
                          e.currentTarget.src = "/portfolio/imagen1.jpg";
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-25" />
            </div>

            {/* BLOQUE INFERIOR DERECHO */}
            <div className="absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-6 rounded-2xl sm:rounded-3xl bg-white/95 p-3 sm:p-4 shadow-2xl border border-zinc-200/90 backdrop-blur-md dark:bg-zinc-900/95 dark:border-zinc-800 z-30 max-w-[300px] sm:max-w-[420px] w-full">
              <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-2 text-center flex items-center justify-center">
                  Diseño
                </span>
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-2 text-center flex items-center justify-center">
                  Branding
                </span>
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-2 text-center flex items-center justify-center">
                  Logos
                </span>
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-2 text-center flex items-center justify-center">
                  Redes Sociales
                </span>
                <span className="rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-2 text-center flex items-center justify-center">
                  Diseño Editorial
                </span>
                <span className="rounded-xl bg-[var(--brand)]/15 text-[var(--brand-contrast)] dark:text-[var(--brand)] px-2 py-2 text-center font-bold flex items-center justify-center">
                  Páginas Web
                </span>
              </div>
            </div>

          </div>

          <div className="mt-12 sm:mt-16 flex justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por diseño gráfico y una página web para mi negocio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] hover:opacity-90 px-8 py-3.5 sm:px-9 sm:py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition active:scale-95"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>

        </div>
      </section>

      {/* 1. SERVICIOS INTEGRALES */}
      <section id="servicios" className="mx-auto max-w-7xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Servicios integrales
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
            Diseño gráfico y desarrollo web <br className="hidden sm:inline" />
            a tu medida.
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Una solución completa para que tu negocio se destaque tanto en lo visual como en lo técnico.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* Card 1: Identidad Gráfica & Branding */}
          <article className="lg:col-span-7 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Palette className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Identidad Visual
                </span>
              </div>
              <h3 className="mt-4 text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white">
                Identidad Gráfica & Branding
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Logotipos, tipografías, paletas de colores, diseño editorial y piezas gráficas para redes sociales para que tu marca tenga una presencia sólida y profesional.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Logotipos & Manual de marca</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Banners & Redes</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Cartelería & Papelería</span>
            </div>
          </article>

          {/* Card 2: Catálogo & Carta Digital */}
          <article className="lg:col-span-5 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
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
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Tus productos o platos presentados de forma clara, con variantes de talles/gustos y precios actualizables desde tu celular.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Control de stock</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-medium">✓ Pedidos listos a WhatsApp</span>
            </div>
          </article>

          {/* Card 3: Turnos y reservas */}
          <article className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Turnos & Reservas 24/7</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tus clientes eligen día y horario libre desde tu web para salones, barberías o consultorios.
            </p>
          </article>

          {/* Card 4: Conexión a WhatsApp */}
          <article className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-white">Conexión a WhatsApp</h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cada pedido o reserva te llega armada a tu chat para que solo tengas que cobrar y entregar.
            </p>
          </article>

          {/* Card 5: Cobros integrados */}
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

      {/* 2. BENEFICIOS */}
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
              Con tu propia página web, tus clientes ven lo que ofrecés, conocen los precios actualizados y te mandan el pedido o la reserva armada al WhatsApp, a cualquier hora.
            </p>
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

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modelosArriba.map((p) => (
            <TarjetaModelo key={p.id} p={p} />
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-6 max-w-4xl mx-auto">
          {modelosAbajo.map((p) => (
            <div key={p.id} className="flex-1 max-w-md mx-auto sm:mx-0 w-full">
              <TarjetaModelo p={p} />
            </div>
          ))}
        </div>
      </section>

      {/* PLANES Y PRECIOS */}
      <section id="planes" className="mx-auto max-w-7xl px-3.5 py-14 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Planes y Precios
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Elegí cómo querés impulsar tu página web.
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

          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [text-wrap:balance]">
            Soy Diseñador Gráfico Junior y desarrollador web de Ledesma, Jujuy.
          </p>

          <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium [text-wrap:balance]">
            Envíame un mensaje y mejoramos tu negocio
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <UserCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
              <span>Atención directa 1 a 1</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
              <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Diseño Gráfico & Web</span>
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
                Escribime para armar la identidad visual y la web de tu negocio a medida.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Quiero que hablemos sobre el diseño de mi página web y gráfica.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-xs sm:text-sm font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4 text-white" />
                  <span>Consultar por WhatsApp</span>
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
                <li><a href="#planes" className="hover:text-[var(--brand)] transition">Planes</a></li>
                <li><a href="#quien-soy" className="hover:text-[var(--brand)] transition">Quién soy</a></li>
                <li><a href={BEHANCE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition">Behance Portfolio ↗</a></li>
                <li><a href="#contacto" className="hover:text-[var(--brand)] transition">Contacto</a></li>
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
        <a
          href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(`¡Hola Nahuel! Me interesa el plan ${nombre} para mi negocio.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold transition shadow-xs ${
            destacado
              ? "bg-[var(--brand)] text-white hover:opacity-90 shadow-blue-500/20"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          }`}
        >
          Consultar por WhatsApp
        </a>
      </div>
    </article>
  );
}