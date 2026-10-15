"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Laptop,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserCheck,
  UtensilsCrossed,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Building2,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { RevealOnScroll } from "@/components/Ui/RevealOnScroll";
import { OrbitalGallery } from "@/components/landing/OrbitalGallery";

const WHATSAPP_NUMERO = "5493886575664";
const CORREO_CONTACTO = "soporte@ndiweb.com";
const BEHANCE_URL = "https://www.behance.net/nahuelrueda";

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

const serviciosNDI = [
  {
    icono: Palette,
    titulo: "Branding & Identidad",
    color: "text-purple-500 bg-purple-500/10",
    descripcion:
      "Construcción de marcas sólidas con identidad única. Logotipos, tipografías, paletas de color y sistemas de marca coherentes y reconocibles.",
  },
  {
    icono: Megaphone,
    titulo: "Diseño Publicitario",
    color: "text-amber-500 bg-amber-500/10",
    descripcion:
      "Creatividad visual para campañas digitales e impresas, cartelería, vía pública y piezas para redes sociales pensadas para captar atención y generar impacto real.",
  },
  {
    icono: BookOpen,
    titulo: "Diseño Editorial",
    color: "text-rose-500 bg-rose-500/10",
    descripcion:
      "Diseño de folletos, revistas, catálogos, presentaciones corporativas y balances con enfoque estético y funcional. Cada pieza transmite tu mensaje con claridad.",
  },
  {
    icono: Laptop,
    titulo: "Diseño Web",
    color: "text-blue-500 bg-blue-500/10",
    descripcion:
      "Sitios web visualmente atractivos, rápidos y adaptados a cualquier dispositivo. Diseñados con foco en la experiencia del usuario y en lograr objetivos concretos.",
  },
];

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
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un sitio para Gastronomía y Bares.")}`,
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
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un catálogo online para Tiendas.")}`,
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
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por una agenda de turnos para Barberías.")}`,
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
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por una web para Consultorios.")}`,
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
    urlDemo: `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por una web para Hotel y Hospedaje.")}`,
    caracteristicas: ["Galería de habitaciones", "Consultas por WhatsApp"],
  },
];

const faqs = [
  {
    pregunta: "¿Cómo es el proceso de trabajo?",
    respuesta:
      "Conversamos sobre tu idea y objetivos por WhatsApp o videollamada. Me compartís lo que necesitás, defino una propuesta visual y trabajamos en rondas de revisión hasta que cada detalle quede exactamente como buscás.",
  },
  {
    pregunta: "¿En qué formatos entrego los diseños?",
    respuesta:
      "Para piezas gráficas entrego archivos editables y listos para imprenta o publicación (PDF alta resolución, PNG transparente, JPG y vectoriales SVG/AI). Para webs, el sitio queda totalmente online y adaptado a móviles.",
  },
  {
    pregunta: "¿Hacés tanto diseño gráfico como desarrollo web?",
    respuesta:
      "Sí. Integro ambas disciplinas para que no tengas que coordinar con dos personas distintas: la identidad de tu marca y tu web mantienen la misma coherencia estética y profesional.",
  },
  {
    pregunta: "¿Cuáles son las formas de pago?",
    respuesta:
      "Acepto transferencia bancaria (Alias / CVU) y cobros con tarjeta o saldo a través de Mercado Pago.",
  },
  {
    pregunta: "¿Puedo pedir presupuesto por un trabajo puntual?",
    respuesta:
      "Sí, totalmente. Ya sea un logotipo, folletería, banners para redes o un sitio web completo, escribime y armamos un presupuesto a la medida exacta de tu proyecto.",
  },
];

function TarjetaModelo({ p }: { p: any }) {
  const [slide, setSlide] = useState(0);
  const Icono = p.icono;

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % p.imagenes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [p.imagenes.length]);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 w-full">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {p.imagenes.map((img: string, i: number) => (
            <img
              key={img}
              src={img}
              alt={`${p.titulo} vista ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 ease-in-out ${
                i === slide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              onError={(e) => {
                e.currentTarget.src = img.replace(".png", ".jpg");
              }}
            />
          ))}

          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="rounded-full bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
              {p.badge}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 z-20 flex gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
            {p.imagenes.map((_: any, i: number) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slide ? "w-3 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-1.5 text-[var(--brand-contrast)] dark:text-[var(--brand)] text-xs font-semibold">
            <Icono className="h-3.5 w-3.5" />
            <span>{p.categoria}</span>
          </div>

          <h3 className="mt-1.5 text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
            {p.titulo}
          </h3>

          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {p.subtitulo}
          </p>

          <div className="mt-3 flex flex-wrap gap-1">
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

      <div className="p-4 sm:p-5 pt-0">
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
  const [carruselActivo, setCarruselActivo] = useState(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCarruselActivo((prev) => (prev + 1) % IMAGENES_PORTFOLIO.length);
    }, 8000);
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

  const irCarruselAnterior = () => {
    setCarruselActivo((prev) => (prev - 1 + IMAGENES_PORTFOLIO.length) % IMAGENES_PORTFOLIO.length);
  };

  const irCarruselSiguiente = () => {
    setCarruselActivo((prev) => (prev + 1) % IMAGENES_PORTFOLIO.length);
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-[#0c0d0e] dark:text-zinc-100 selection:bg-[var(--brand)] selection:text-white overflow-x-hidden">
      {/* HEADER: LOGO A LA IZQUIERDA */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl transition-colors dark:border-zinc-800/80 dark:bg-[#0c0d0e]/90">
        <div className="w-full flex h-14 sm:h-16 items-center justify-between px-3.5 sm:px-8 gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center">
              <Image
                src="/logo-ndi.png"
                alt="Logo ND Diseño Gráfico"
                width={26}
                height={26}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap">
              NDI <span className="font-normal text-zinc-500 dark:text-zinc-400">| Diseño & Web</span>
            </p>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#portfolio" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Portfolio
            </a>
            <a href="#servicios" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Servicios
            </a>
            <a href="#destacados" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Destacados
            </a>
            <a href="#quien-soy" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Quién soy
            </a>
            <a href="#modelos-web" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Modelos web
            </a>
            <a href="#faq" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Preguntas
            </a>
            <a href="#contacto" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Contacto
            </a>
            <a
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)] hover:underline"
            >
              Portfolio Behance ↗
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
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un proyecto de diseño.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[var(--brand)] px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90 whitespace-nowrap"
              >
                Contactame
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 1. PORTADA: ALTURA CALIBRADA (EN MOVIL OCUPA LA PANTALLA COMPLETA CON BOTONES AL BORDE) */}
      <section
        id="portfolio"
        className="relative flex flex-col justify-between min-h-[calc(100svh-56px)] sm:min-h-0 pt-3 pb-3 sm:pt-10 sm:pb-14 border-b border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden"
      >
        {/* ENCABEZADO */}
        <div className="mx-auto max-w-5xl px-3 sm:px-8 text-center shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 mb-1.5 sm:mb-3">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[var(--brand)]" />
            <span>Diseño Gráfico & Desarrollo Web</span>
          </div>

          <h1 className="text-xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.14]">
            Marcas, diseño publicitario y webs pensados para el crecimiento de tu proyecto.
          </h1>

          <p className="mx-auto mt-1.5 sm:mt-2.5 max-w-2xl text-[11px] sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed px-1 sm:px-0">
            Trabajemos juntos para darle forma a tus ideas con un diseño pensado a la medida de tu proyecto y de tus objetivos.
          </p>
        </div>

        {/* ESFERA 3D */}
        <div className="relative my-auto w-full px-0 sm:px-4 flex items-center justify-center">
          <OrbitalGallery />
        </div>

        {/* BOTONES AL PIE: AL RAS DE LA PANTALLA EN MOVIL */}
        <div className="shrink-0 px-3.5 max-w-md sm:max-w-none mx-auto w-full pt-2 pb-1">
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un proyecto de diseño.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-[var(--brand)] hover:opacity-90 px-3 sm:px-8 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition active:scale-95 text-center truncate"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Contactame</span>
            </a>

            <a
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-zinc-300 bg-white hover:bg-zinc-100 px-3 sm:px-8 text-xs sm:text-sm font-bold text-zinc-800 shadow-xs transition active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 text-center truncate"
            >
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--brand)] shrink-0" />
              <span className="truncate">Behance ↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. SERVICIOS (COMIENZA AL HACER SCROLL) */}
      <RevealOnScroll>
        <section id="servicios" className="mx-auto max-w-7xl px-3.5 py-8 sm:px-8 sm:py-20 scroll-mt-20">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
              Servicios
            </span>
            <h2 className="mt-1.5 text-xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
              Soluciones visuales pensadas <br className="hidden md:inline" /> para tu proyecto.
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Diseño gráfico, comunicación y desarrollo web aplicados <br className="hidden md:inline" /> para que tu marca se destaque y conecte con su público.
            </p>
          </div>

          <div className="mt-6 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviciosNDI.map((srv, idx) => {
              const Icono = srv.icono;
              return (
                <RevealOnScroll key={srv.titulo} delay={idx * 80}>
                  <div className="flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div>
                      <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${srv.color}`}>
                        <Icono className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h3 className="mt-4 sm:mt-5 text-sm sm:text-lg font-bold text-zinc-950 dark:text-white">
                        {srv.titulo}
                      </h3>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {srv.descripcion}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          <RevealOnScroll delay={150}>
            <div className="mt-6 sm:mt-10 rounded-2xl sm:rounded-3xl border border-zinc-200 bg-zinc-100/70 p-5 sm:p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="text-base sm:text-2xl font-bold text-zinc-950 dark:text-white max-w-2xl mx-auto">
                ¿Sos parte de una empresa con imagen consolidada que necesita nuevas soluciones?
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Desarrollo piezas gráficas y digitales alineadas a la identidad visual de tu marca, respetando tus manuales de estilo y lineamientos para garantizar coherencia en cada medio de comunicación.
              </p>
              <div className="mt-4 sm:mt-5">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría hablar sobre el desarrollo de piezas gráficas para mi empresa.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Hablemos de tu proyecto</span>
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </RevealOnScroll>

      {/* 3. SHOWCASE DESTACADO */}
      <RevealOnScroll>
        <section id="destacados" className="border-t border-zinc-200/80 bg-zinc-100/50 py-8 sm:py-20 dark:border-zinc-800/60 dark:bg-zinc-950/40 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-8">
            <div className="max-w-2xl mb-6 sm:mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                Showcase
              </span>
              <h2 className="mt-1.5 text-xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
                Piezas y proyectos en foco
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Visualización detallada de identidad visual, manuales editoriales y desarrollos web.
              </p>
            </div>

            <div className="relative mx-auto max-w-5xl">
              <div className="absolute top-2 left-2 sm:-top-5 sm:-left-5 rounded-xl sm:rounded-3xl bg-zinc-950/95 p-2 sm:p-4 text-white shadow-xl border border-zinc-800 text-left max-w-[130px] sm:max-w-[210px] z-30 backdrop-blur-xs">
                <p className="text-sm sm:text-2xl font-bold tracking-tight text-white leading-none">
                  100%
                </p>
                <p className="mt-0.5 text-[8px] sm:text-xs text-zinc-400 font-medium leading-tight">
                  personalizado y adaptado <br /> a tu marca.
                </p>
              </div>

              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] min-h-[220px] sm:min-h-[500px] overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="relative w-full h-full flex items-center justify-center">
                  {IMAGENES_PORTFOLIO.map((imagen, index) => {
                    const total = IMAGENES_PORTFOLIO.length;
                    let offset = (index - carruselActivo) % total;
                    if (offset < -Math.floor(total / 2)) offset += total;
                    if (offset > Math.floor(total / 2)) offset -= total;

                    const esVisible = Math.abs(offset) <= 1;
                    if (!esVisible) return null;

                    const esCentro = offset === 0;

                    return (
                      <div
                        key={imagen}
                        onClick={() => setCarruselActivo(index)}
                        className={`absolute cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                          esCentro
                            ? "w-[94%] sm:w-[86%] h-[94%] sm:h-[92%] z-20 shadow-xl translate-x-0 scale-100 opacity-100"
                            : offset < 0
                            ? "w-[84%] sm:w-[78%] h-[84%] z-10 shadow-md -translate-x-[94%] scale-[0.95] opacity-70 hover:opacity-95"
                            : "w-[84%] sm:w-[78%] h-[84%] z-10 shadow-md translate-x-[94%] scale-[0.95] opacity-70 hover:opacity-95"
                        }`}
                      >
                        <img
                          src={imagen}
                          alt={`Portfolio ND Diseño Gráfico ${index + 1}`}
                          className="w-full h-full object-contain p-1.5 sm:p-4 bg-white dark:bg-zinc-900"
                          onError={(e) => {
                            e.currentTarget.src = "/portfolio/imagen1.jpg";
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={irCarruselAnterior}
                  aria-label="Anterior proyecto"
                  className="absolute left-2 sm:left-4 z-30 flex h-7 w-7 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 shadow-md border border-zinc-200 text-zinc-800 transition hover:scale-105 active:scale-95 dark:bg-zinc-900/95 dark:border-zinc-700 dark:text-zinc-200"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={irCarruselSiguiente}
                  aria-label="Siguiente proyecto"
                  className="absolute right-2 sm:right-4 z-30 flex h-7 w-7 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 shadow-md border border-zinc-200 text-zinc-800 transition hover:scale-105 active:scale-95 dark:bg-zinc-900/95 dark:border-zinc-700 dark:text-zinc-200"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </button>
              </div>

              <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-5 sm:-right-5 rounded-2xl bg-white/95 p-2 sm:p-3.5 shadow-md sm:shadow-2xl border border-zinc-200/90 backdrop-blur-md dark:bg-zinc-900/95 dark:border-zinc-800 z-30 sm:max-w-[380px] w-full">
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-1 text-center flex items-center justify-center">
                    Diseño
                  </span>
                  <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-1 text-center flex items-center justify-center">
                    Branding
                  </span>
                  <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-1 text-center flex items-center justify-center">
                    Logos
                  </span>
                  <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-1 text-center flex items-center justify-center">
                    Redes Sociales
                  </span>
                  <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-1 text-center flex items-center justify-center">
                    Diseño Editorial
                  </span>
                  <span className="rounded-lg sm:rounded-xl bg-[var(--brand)]/15 text-[var(--brand-contrast)] dark:text-[var(--brand)] px-1.5 py-1 text-center font-bold flex items-center justify-center">
                    Páginas Web
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 4. QUIÉN SOY */}
      <RevealOnScroll>
        <section id="quien-soy" className="mx-auto max-w-4xl px-3.5 py-8 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60 scroll-mt-20">
          <div className="text-center max-w-xl mx-auto">
            <div className="relative mx-auto h-24 w-24 sm:h-36 sm:w-36 overflow-hidden rounded-full border-2 border-[var(--brand)]/40 bg-zinc-100 shadow-md ring-4 ring-[var(--brand)]/10 dark:bg-zinc-800">
              {!errorFotoNahuel ? (
                <Image
                  src="/nahuel.jpg"
                  alt="Nahuel - ND Diseño Gráfico"
                  width={256}
                  height={256}
                  quality={95}
                  className="h-full w-full object-cover object-top"
                  onError={() => setErrorFotoNahuel(true)}
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-lg sm:text-xl text-[var(--brand)]">
                  ND
                </div>
              )}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <MapPin className="h-3 w-3 text-[var(--brand)]" />
              <span>Ledesma, Jujuy</span>
            </div>

            <h2 className="mt-2 text-xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Hola, soy Nahuel.
            </h2>

            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [text-wrap:balance]">
              Soy Diseñador Gráfico Junior y desarrollador web de Ledesma, Jujuy.
            </p>

            <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium [text-wrap:balance]">
              Mandame un mensaje y le damos forma a tu proyecto.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 text-[10px] sm:text-xs">
                <UserCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
                <span>Atención directa 1 a 1</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 text-[10px] sm:text-xs">
                <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Diseño Gráfico & Web</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 text-[10px] sm:text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Soporte continuo</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5">
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un proyecto de diseño.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Hablar directo con Nahuel</span>
              </a>

              <a
                href={BEHANCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-zinc-800 shadow-xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
              >
                <Palette className="h-4 w-4 text-[var(--brand)]" />
                <span>Ver portfolio en Behance ↗</span>
              </a>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5. MODELOS WEB */}
      <RevealOnScroll>
        <section id="modelos-web" className="mx-auto max-w-7xl px-3.5 py-8 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                Estructuras disponibles
              </span>
              <h2 className="mt-1.5 text-xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Modelos de muestra listos para adaptar.
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Diseños creados para cada tipo de actividad comercial.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
              <span>Todos los modelos incluyen panel autogestionable</span>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modelosArriba.map((p, idx) => (
              <RevealOnScroll key={p.id} delay={idx * 80}>
                <TarjetaModelo p={p} />
              </RevealOnScroll>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {modelosAbajo.map((p, idx) => (
              <RevealOnScroll key={p.id} delay={idx * 80}>
                <TarjetaModelo p={p} />
              </RevealOnScroll>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      {/* 6. PREGUNTAS FRECUENTES */}
      <RevealOnScroll>
        <section id="faq" className="mx-auto max-w-4xl px-3.5 py-8 sm:px-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/60 scroll-mt-20">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
              Dudas frecuentes
            </span>
            <h2 className="mt-1.5 text-xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
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
      </RevealOnScroll>

      {/* 7. CONTACTO */}
      <RevealOnScroll>
        <section id="contacto" className="border-t border-zinc-200/80 bg-zinc-100/60 py-8 sm:py-20 dark:border-zinc-800/80 dark:bg-zinc-950/60 scroll-mt-20">
          <div className="mx-auto max-w-3xl px-3.5 sm:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-contrast)] dark:text-[var(--brand)]">
              Atención directa
            </span>
            <h2 className="mt-1.5 text-xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Empecemos tu proyecto hoy.
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
              Escribime para coordinar tu identidad de marca, piezas publicitarias, catálogo o diseño web a medida.
            </p>

            <div className="mt-6 sm:mt-8 grid gap-3 sm:grid-cols-3 text-left">
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un proyecto de diseño.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition hover:bg-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">WhatsApp directo</p>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">+54 9 388 657-5664</p>
                </div>
              </a>

              <a
                href={`mailto:${CORREO_CONTACTO}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand-contrast)] dark:text-[var(--brand)]">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500">Correo</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{CORREO_CONTACTO}</p>
                </div>
              </a>

              <a
                href={BEHANCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Palette className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500">Portfolio</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">behance.net/nahuelrueda ↗</p>
                </div>
              </a>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 bg-white py-8 sm:py-12 dark:border-zinc-800 dark:bg-[#0c0d0e]">
        <div className="w-full max-w-[96vw] xl:max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-6 sm:pb-8 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center">
                  <Image
                    src="/logo-ndi.png"
                    alt="Logo ND Diseño Gráfico"
                    width={24}
                    height={24}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  NDI | Diseño & Web
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Diseño gráfico y desarrollo web para emprendimientos, negocios y empresas. Atención directa desde Ledesma, Jujuy.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Navegación
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <li><a href="#portfolio" className="hover:text-[var(--brand)] transition">Portfolio</a></li>
                <li><a href="#servicios" className="hover:text-[var(--brand)] transition">Servicios</a></li>
                <li><a href="#destacados" className="hover:text-[var(--brand)] transition">Destacados</a></li>
                <li><a href="#quien-soy" className="hover:text-[var(--brand)] transition">Quién soy</a></li>
                <li><a href="#modelos-web" className="hover:text-[var(--brand)] transition">Modelos web</a></li>
                <li><a href="#faq" className="hover:text-[var(--brand)] transition">Preguntas</a></li>
                <li><a href="#contacto" className="hover:text-[var(--brand)] transition">Contacto</a></li>
                <li><a href={BEHANCE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition">Behance Portfolio ↗</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Marco legal
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
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
              </ul>
            </div>
          </div>

          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-xs text-zinc-500 text-center sm:text-left">
            <p>© 2026 NDI | Diseño & Web. Todos los derechos reservados.</p>
            <p>Ledesma, Jujuy, Argentina</p>
          </div>
        </div>
      </footer>
    </main>
  );
}