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

const serviciosNDI = [
  {
    icono: BookOpen,
    titulo: "Diseño Editorial",
    color: "text-rose-500 bg-rose-500/10",
    descripcion:
      "Diseño de folletos, revistas, catálogos, presentaciones corporativas y balances con enfoque estético y funcional. Cada pieza transmite tu mensaje con claridad.",
  },
  {
    icono: Megaphone,
    titulo: "Diseño Publicitario",
    color: "text-amber-500 bg-amber-500/10",
    descripcion:
      "Creatividad visual para campañas digitales e impresas, cartelería, vía pública y piezas para redes sociales pensadas para captar atención y generar impacto real.",
  },
  {
    icono: Palette,
    titulo: "Branding & Identidad",
    color: "text-purple-500 bg-purple-500/10",
    descripcion:
      "Construcción de marcas sólidas con identidad única. Logotipos, tipografías, paletas de color y sistemas de marca coherentes y reconocibles.",
  },
  {
    icono: Laptop,
    titulo: "Diseño Web & UX/UI",
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

  // 5 segundos exactos con transición suave
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
  const [activo, setActivo] = useState(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setActivo((prev) => (prev + 1) % IMAGENES_PORTFOLIO.length);
    }, 10000);
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

  const irAnterior = () => {
    setActivo((prev) => (prev - 1 + IMAGENES_PORTFOLIO.length) % IMAGENES_PORTFOLIO.length);
  };

  const irSiguiente = () => {
    setActivo((prev) => (prev + 1) % IMAGENES_PORTFOLIO.length);
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-[#0c0d0e] dark:text-zinc-100 selection:bg-[var(--brand)] selection:text-white overflow-x-hidden">
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

      {/* HERO: TEXTO Y BOTONES AJUSTADOS */}
      <section className="relative pt-6 pb-12 sm:pt-16 sm:pb-24 overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/60">
        <div className="mx-auto max-w-7xl px-3 sm:px-8">
          
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-zinc-200 bg-white px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 mb-3 sm:mb-4">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[var(--brand)]" />
              <span>Diseño Gráfico & Desarrollo Web</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.6rem] font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
              Potencia tu marca con diseño.
              <span className="block text-zinc-500 dark:text-zinc-400 font-medium text-lg sm:text-3xl lg:text-[2.5rem] mt-1 sm:mt-2">
                Su visión, nuestra experiencia.
              </span>
            </h1>

            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed px-2 sm:px-0">
              Trabajemos juntos para darle forma a tus ideas con un diseño pensado a la medida de tu proyecto y de tus objetivos.
            </p>
          </div>

          {/* CONTENEDOR HERO SLIDER */}
          <div className="relative mt-8 sm:mt-14 mx-auto max-w-5xl">
            
            {/* BADGE AJUSTADO */}
            <div className="absolute top-2 left-2 sm:-top-5 sm:-left-5 rounded-xl sm:rounded-3xl bg-zinc-950/95 p-2 sm:p-4 text-white shadow-xl border border-zinc-800 text-left max-w-[135px] sm:max-w-[210px] z-30 backdrop-blur-xs">
              <p className="text-base sm:text-2xl font-bold tracking-tight text-white leading-none">
                100%
              </p>
              <p className="mt-1 text-[9px] sm:text-xs text-zinc-400 font-medium leading-tight">
                personalizado y adaptado a tu marca.
              </p>
            </div>

            {/* VISOR DE FOTOS */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] min-h-[250px] sm:min-h-[500px] overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="relative w-full h-full flex items-center justify-center">
                {IMAGENES_PORTFOLIO.map((imagen, index) => {
                  const total = IMAGENES_PORTFOLIO.length;
                  let offset = (index - activo) % total;
                  if (offset < -Math.floor(total / 2)) offset += total;
                  if (offset > Math.floor(total / 2)) offset -= total;

                  const esVisible = Math.abs(offset) <= 1;
                  if (!esVisible) return null;

                  const esCentro = offset === 0;

                  return (
                    <div
                      key={imagen}
                      onClick={() => setActivo(index)}
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
                        alt={`Portfolio NDI ${index + 1}`}
                        className="w-full h-full object-contain p-1.5 sm:p-4 bg-white dark:bg-zinc-900"
                        onError={(e) => {
                          e.currentTarget.src = "/portfolio/imagen1.jpg";
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* FLECHAS */}
              <button
                onClick={irAnterior}
                aria-label="Anterior proyecto"
                className="absolute left-2 sm:left-4 z-30 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 shadow-md border border-zinc-200 text-zinc-800 transition hover:scale-105 active:scale-95 dark:bg-zinc-900/95 dark:border-zinc-700 dark:text-zinc-200"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={irSiguiente}
                aria-label="Siguiente proyecto"
                className="absolute right-2 sm:right-4 z-30 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 shadow-md border border-zinc-200 text-zinc-800 transition hover:scale-105 active:scale-95 dark:bg-zinc-900/95 dark:border-zinc-700 dark:text-zinc-200"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* PASTILLAS DE SERVICIOS */}
            <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-5 sm:-right-5 rounded-2xl bg-white/95 p-2.5 sm:p-3.5 shadow-md sm:shadow-2xl border border-zinc-200/90 backdrop-blur-md dark:bg-zinc-900/95 dark:border-zinc-800 z-30 sm:max-w-[380px] w-full">
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1.5 text-center flex items-center justify-center">
                  Diseño
                </span>
                <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1.5 text-center flex items-center justify-center">
                  Branding
                </span>
                <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1.5 text-center flex items-center justify-center">
                  Logos
                </span>
                <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1.5 text-center flex items-center justify-center">
                  Redes Sociales
                </span>
                <span className="rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1.5 text-center flex items-center justify-center">
                  Diseño Editorial
                </span>
                <span className="rounded-lg sm:rounded-xl bg-[var(--brand)]/15 text-[var(--brand-contrast)] dark:text-[var(--brand)] px-2 py-1.5 text-center font-bold flex items-center justify-center">
                  Páginas Web
                </span>
              </div>
            </div>
          </div>

          {/* BOTONES ACCIÓN: CONTACTAME + PORTFOLIO BEHANCE */}
          <div className="mt-8 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un proyecto de diseño.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] hover:opacity-90 px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contactame</span>
            </a>

            <a
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white hover:bg-zinc-100 px-8 py-3.5 text-xs sm:text-sm font-bold text-zinc-800 shadow-sm transition active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Palette className="h-4 w-4 text-[var(--brand)]" />
              <span>Portfolio en Behance ↗</span>
            </a>
          </div>

        </div>
      </section>

      {/* SECCIÓN SERVICIOS: BASADA EN LA ESTRUCTURA Y CONTENIDO DE LA REFERENCIA */}
      <section id="servicios" className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Servicios
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
            Soluciones visuales pensadas para tu proyecto.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Diseño gráfico, comunicación y desarrollo web aplicados para que tu marca se destaque y conecte con su público.
          </p>
        </div>

        {/* GRILLA DE 4 SERVICIOS CLAVE */}
        <div className="mt-8 sm:mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {serviciosNDI.map((srv) => {
            const Icono = srv.icono;
            return (
              <div
                key={srv.titulo}
                className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${srv.color}`}>
                    <Icono className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                    {srv.titulo}
                  </h3>
                  <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {srv.descripcion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* BLOQUE EMPRESAS / MARCAS CONSOLIDADAS */}
        <div className="mt-8 sm:mt-10 rounded-3xl border border-zinc-200 bg-zinc-100/70 p-6 sm:p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)] mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Colaboración Directa</span>
          </span>
          <h3 className="text-lg sm:text-2xl font-bold text-zinc-950 dark:text-white max-w-2xl mx-auto">
            ¿Sos parte de una empresa con imagen consolidada que necesita nuevas soluciones?
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Desarrollo piezas gráficas y digitales alineadas a la identidad visual de tu marca, respetando tus manuales de estilo y lineamientos para garantizar coherencia en cada medio de comunicación.
          </p>
          <div className="mt-5">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría hablar sobre el desarrollo de piezas gráficas para mi empresa.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hablemos de tu proyecto</span>
            </a>
          </div>
        </div>
      </section>

      {/* MODELOS DE MUESTRA (CON ROTACIÓN DE 5 SEGUNDOS Y SIN FONDO NEGRO) */}
      <section id="trabajos" className="mx-auto max-w-7xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
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

        <div className="mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modelosArriba.map((p) => (
            <TarjetaModelo key={p.id} p={p} />
          ))}
        </div>

        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {modelosAbajo.map((p) => (
            <TarjetaModelo key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* QUIÉN SOY */}
      <section id="quien-soy" className="mx-auto max-w-4xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <div className="text-center max-w-xl mx-auto">
          <div className="relative mx-auto h-20 w-20 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 border-[var(--brand)]/40 bg-zinc-100 shadow-md ring-4 ring-[var(--brand)]/10 dark:bg-zinc-800">
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

          <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-0.5 text-xs font-semibold text-zinc-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <MapPin className="h-3 w-3 text-[var(--brand)]" />
            <span>Ledesma, Jujuy</span>
          </div>

          <h2 className="mt-2 text-xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Hola, soy Nahuel.
          </h2>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [text-wrap:balance]">
            Soy Diseñador Gráfico Junior y desarrollador web de Ledesma, Jujuy.
          </p>

          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium [text-wrap:balance]">
            Envíame un mensaje y mejoramos tu negocio
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 text-[11px] sm:text-xs">
              <UserCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
              <span>Atención directa 1 a 1</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 text-[11px] sm:text-xs">
              <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Diseño Gráfico & Web</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 font-medium text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 text-[11px] sm:text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Soporte continuo</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por un proyecto de diseño.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs shadow-blue-500/20 transition hover:opacity-90 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hablar directo con Nahuel</span>
            </a>

            <a
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-800 shadow-xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
            >
              <Palette className="h-4 w-4 text-[var(--brand)]" />
              <span>Ver portfolio en Behance ↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ ADAPTADAS A DISEÑO GRÁFICO & WEB */}
      <section id="faq" className="mx-auto max-w-4xl px-3.5 py-12 sm:px-8 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/60">
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

      {/* CONTACTO LIMPIO (SIN TARJETA REPETIDA QUE GENERABA RUIDO) */}
      <section id="contacto" className="border-t border-zinc-200/80 bg-zinc-100/60 py-12 sm:py-24 dark:border-zinc-800/80 dark:bg-zinc-950/60">
        <div className="mx-auto max-w-3xl px-3.5 sm:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-contrast)] dark:text-[var(--brand)]">
            Atención directa
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Empecemos tu proyecto hoy.
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            Escribime para coordinar tu identidad de marca, piezas publicitarias, catálogo o diseño web a medida.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 text-left">
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

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 bg-white py-10 sm:py-12 dark:border-zinc-800 dark:bg-[#0c0d0e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pb-6 sm:pb-8 border-b border-zinc-100 dark:border-zinc-800/80">
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
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Diseño gráfico y desarrollo web para emprendimientos, negocios y empresas. Atención directa desde Ledesma, Jujuy.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Navegación
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <li><a href="#servicios" className="hover:text-[var(--brand)] transition">Servicios</a></li>
                <li><a href="#trabajos" className="hover:text-[var(--brand)] transition">Modelos</a></li>
                <li><a href="#quien-soy" className="hover:text-[var(--brand)] transition">Quién soy</a></li>
                <li><a href={BEHANCE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition">Behance Portfolio ↗</a></li>
                <li><a href="#faq" className="hover:text-[var(--brand)] transition">Preguntas</a></li>
                <li><a href="#contacto" className="hover:text-[var(--brand)] transition">Contacto</a></li>
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
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Botón de arrepentimiento
                </a>
              </div>
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