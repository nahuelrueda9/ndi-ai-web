import {
  ChevronDown,
  Clock3,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Quote,
} from "lucide-react";
import { FaInstagram, FaFacebookF, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { adminDb } from "@/lib/firebaseAdmin";
import {
  empresaTieneFuncion,
  empresaTieneSuscripcionActiva,
} from "@/lib/plans/planAccess";
import ReservaForm from "./ReservaForm";
import ReservaAlojamientoForm from "./ReservaAlojamientoForm";
import ReservaMesaForm from "./ReservaMesaForm";
import RestauranteCartaPedidos from "./RestauranteCartaPedidos";
import TiendaCatalogoPedidos from "./TiendaCatalogoPedidos";
import AlojamientoDetalle from "./AlojamientoDetalle";
import ContactoForm from "./ContactForm";
import PublicAnalytics from "./PublicAnalytics";
import PresupuestoFormulario from "./PresupuestoFormulario";
import { fontMap } from "@/lib/fonts";
import BotonTema from "./BotonTema";
import BotonWhatsAppHeader from "./BotonWhatsAppHeader";
import LogoHeaderDinamico from "./LogoHeaderDinamico";
import HeroPublico from "@/components/HeroPublico";
import HorariosTarjetaServicio from "./HorariosTarjetaServicio";

export const dynamic = "force-dynamic";

export type ElementoHero = {
  url: string;
  tipo: "imagen" | "video";
};

interface TestimonioPagina {
  nombre: string;
  cargo?: string;
  texto: string;
}

interface PreguntaFrecuentePagina {
  pregunta: string;
  respuesta: string;
}

interface Empresa {
  nombre?: string;
  plan?: "free" | "pro" | "business";
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  rubro?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  direccion?: string;
  horarios?: string;
  servicios?: any[];
  pagosConfig?: {
    activoMercadoPago?: boolean;
    linkMercadoPago?: string;
    activoTransferencia?: boolean;
    aliasCbu?: string;
    titularCuenta?: string;
    soloWhatsapp?: boolean;
  };

  redesSociales?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };

  paginaPublica?: {
    slug?: string;
    publicada?: boolean;
    titulo?: string;
    subtitulo?: string;
    textoSecundario?: string;
    colorPrincipal?: string;
    tema?: "oscuro" | "claro";
    tipografia?: string;
    logoUrl?: string;
    logoOscuroUrl?: string;
    portadaUrl?: string;
    portadaUrl2?: string;
    portadaUrl3?: string;
    portadaUrl4?: string;
    portadaUrl5?: string;
    portadaUrl6?: string;
    multimediaHero?: ElementoHero[];
    galeria?: string[];
    mostrarWhatsApp?: boolean;
    mostrarEmail?: boolean;
    mostrarLogoHeader?: boolean;
    mostrarDireccion?: boolean;
    mostrarHorarios?: boolean;

    mostrarServicios?: boolean;
    mostrarProductos?: boolean;
    mostrarGaleria?: boolean;
    mostrarMapa?: boolean;
    mostrarPresupuesto?: boolean;
    mostrarReservasMesa?: boolean;
    mostrarPedidosOnline?: boolean;
    mostrarContacto?: boolean;

    testimonios?: TestimonioPagina[];
    preguntasFrecuentes?: PreguntaFrecuentePagina[];
  };

  widget?: {
    nombreBot?: string;
    mensajeBienvenida?: string;
    colorPrincipal?: string;
  };
}

interface VarianteProducto {
  talle: string;
  color: string;
  stock: number;
}

interface CatalogoItem {
  id: string;
  tipo: "servicio" | "producto";
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracionMinutos?: number;
  imagenUrl?: string;
  imagenes?: string[];
  categoria?: string;
  talles?: string[];
  colores?: string[];
  variantes?: VarianteProducto[];
  stockGeneral?: number;
  stockTotal?: number;
  activo?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

function normalizarUrlExterna(valor?: string) {
  const limpio = valor?.trim() || "";
  if (!limpio) return "";
  const candidato = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  try {
    const url = new URL(candidato);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "eddu-barber") {
    redirect("/eddubarber");
  }

  const empresasSnapshot = await adminDb
    .collection("companies")
    .where("paginaPublica.slug", "==", slug)
    .limit(2)
    .get();

  if (empresasSnapshot.size !== 1) {
    return {
      title: "Negocio no encontrado | NDI AI",
      robots: { index: false, follow: false },
    };
  }

  const empresa = empresasSnapshot.docs[0].data() as Empresa;
  const pagina = empresa.paginaPublica;

  if (!pagina?.publicada || !empresaTieneSuscripcionActiva(empresa) || !empresaTieneFuncion(empresa, "pagina_publica")) {
    return {
      title: "Página no disponible | NDI AI",
      robots: { index: false, follow: false },
    };
  }

  const nombre = pagina.titulo?.trim() || empresa.nombre?.trim() || "Negocio";
  const descripcion = pagina.textoSecundario?.trim() || pagina.subtitulo?.trim() || empresa.descripcion?.trim() || `Conocé ${nombre}, sus servicios, horarios y formas de contacto.`;
  const imagenSocial = pagina.portadaUrl?.trim() || pagina.logoUrl?.trim() || "";

  return {
    title: `${nombre} | NDI AI`,
    description: descripcion.slice(0, 160),
    robots: { index: true, follow: true },
    openGraph: {
      title: nombre,
      description: descripcion.slice(0, 160),
      type: "website",
      locale: "es_AR",
      ...(imagenSocial ? { images: [{ url: imagenSocial, alt: nombre }] } : {}),
    },
    twitter: {
      card: imagenSocial ? "summary_large_image" : "summary",
      title: nombre,
      description: descripcion.slice(0, 160),
      ...(imagenSocial ? { images: [imagenSocial] } : {}),
    },
  };
}

export default async function NegocioPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug === "eddu-barber") {
    redirect("/eddubarber");
  }

  const empresasSnapshot = await adminDb
    .collection("companies")
    .where("paginaPublica.slug", "==", slug)
    .limit(2)
    .get();

  if (empresasSnapshot.size !== 1) notFound();

  const documento = empresasSnapshot.docs[0];
  const empresa = documento.data() as Empresa;
  const pagina = empresa.paginaPublica;

  if (!pagina?.publicada || !empresaTieneSuscripcionActiva(empresa) || !empresaTieneFuncion(empresa, "pagina_publica")) {
    notFound();
  }

  // LECTURA DE CATÁLOGO / SERVICIOS
  const catalogoSnapshot = await adminDb.collection("companies").doc(documento.id).collection("catalog").get();
  const catalogo: CatalogoItem[] = catalogoSnapshot.docs
    .map((docCatalogo) => ({
      id: docCatalogo.id,
      ...(docCatalogo.data() as Omit<CatalogoItem, "id">),
    }))
    .filter((item) => item.activo !== false);

  const puedeUsarCatalogo = empresaTieneFuncion(empresa, "catalogo");
  const puedeUsarProductos = empresaTieneFuncion(empresa, "productos");
  const puedeUsarSeccionesAmpliadas = puedeUsarProductos;

  const esBusiness = empresa.plan === "business";
  const limiteFotosItems = esBusiness ? 6 : puedeUsarProductos ? 3 : 1;

  const servicios = catalogo.filter((item) => item.tipo === "servicio");
  const productos = puedeUsarCatalogo ? catalogo.filter((item) => item.tipo === "producto") : [];

  const productosRestaurante = productos.map((producto) => ({
    id: producto.id,
    nombre: producto.nombre || "",
    descripcion: producto.descripcion || "",
    precio: typeof producto.precio === "number" ? producto.precio : 0,
    imagenUrl: producto.imagenUrl || "",
    imagenes: Array.isArray(producto.imagenes)
      ? producto.imagenes.filter((url): url is string => typeof url === "string").slice(0, limiteFotosItems)
      : [],
    categoria: producto.categoria || "",
  }));

  const productosTienda = productos.map((producto) => ({
    id: producto.id,
    tipo: producto.tipo || "producto",
    nombre: producto.nombre || "",
    descripcion: producto.descripcion || "",
    precio: typeof producto.precio === "number" ? producto.precio : 0,
    imagenUrl: producto.imagenUrl || "",
    imagenes: Array.isArray(producto.imagenes)
      ? producto.imagenes.filter((url): url is string => typeof url === "string").slice(0, limiteFotosItems)
      : [],
    talles: Array.isArray(producto.talles) ? producto.talles : [],
    colores: Array.isArray(producto.colores) ? producto.colores : [],
    variantes: Array.isArray(producto.variantes) ? producto.variantes.map(v => ({ talle: v.talle, color: v.color, stock: v.stock })) : [],
    stockGeneral: producto.stockGeneral || 0,
    stockTotal: producto.stockTotal || 0,
    activo: producto.activo ?? true,
  }));

  const catalogoPermitido = puedeUsarProductos ? catalogo : servicios;
  const nombre = pagina.titulo || empresa.nombre || "Negocio";
  const rubroNormalizado = (empresa.rubro || "").trim().toLowerCase();
  const esAlojamiento = rubroNormalizado === "hotel" || rubroNormalizado === "hostal";
  const esRestaurante = rubroNormalizado === "restaurante" || rubroNormalizado === "restaurant";

  const colorPrincipal = pagina.colorPrincipal || "#2563eb";
  const logoUrl = pagina.logoUrl?.trim() || "";
  const logoOscuroUrl = pagina.logoOscuroUrl?.trim() || "";
  const esClaro = pagina.tema === "claro";

  const multimediaHero: ElementoHero[] = Array.isArray(pagina.multimediaHero) && pagina.multimediaHero.length > 0
    ? pagina.multimediaHero
    : [
        pagina.portadaUrl,
        pagina.portadaUrl2,
        pagina.portadaUrl3,
        pagina.portadaUrl4,
        pagina.portadaUrl5,
        pagina.portadaUrl6,
      ]
        .filter((url): url is string => Boolean(url && url.trim().length > 0))
        .map((url) => ({ url, tipo: "imagen" }));

  const galeria = Array.isArray(pagina.galeria)
    ? pagina.galeria.filter((url): url is string => typeof url === "string" && url.trim().length > 0).slice(0, 10)
    : [];

  const telefonoLimpio = empresa.telefono?.replace(/\D/g, "") || "";
  const whatsappUrl = telefonoLimpio ? `https://wa.me/${telefonoLimpio}` : "";

  const mostrarWhatsApp = pagina.mostrarWhatsApp !== false && Boolean(telefonoLimpio);
  const mostrarEmail = pagina.mostrarEmail !== false && Boolean(empresa.email);
  const mostrarDireccion = pagina.mostrarDireccion !== false && Boolean(empresa.direccion);
  const mostrarHorarios = pagina.mostrarHorarios !== false && Boolean(empresa.horarios);
  const mostrarServicios = pagina.mostrarServicios !== false;
  const mostrarProductos = puedeUsarCatalogo && (esRestaurante || pagina.mostrarProductos !== false);
  const mostrarGaleria = pagina.mostrarGaleria !== false;
  const mostrarMapa = pagina.mostrarMapa !== false;
  const mostrarPresupuesto = pagina.mostrarPresupuesto !== false;
  const mostrarContacto = pagina.mostrarContacto !== false;
  const mostrarLogoHeader = pagina.mostrarLogoHeader !== false;  

  const direccionMapa = empresa.direccion?.trim() || "";
  const mapaEmbedUrl = direccionMapa ? `https://www.google.com/maps?q=${encodeURIComponent(direccionMapa)}&output=embed` : "";
  const mapaAbrirUrl = direccionMapa ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionMapa)}` : "";

  const testimonios = puedeUsarSeccionesAmpliadas && Array.isArray(pagina.testimonios) ? pagina.testimonios.filter((item): item is TestimonioPagina => Boolean(item && typeof item.nombre === "string" && typeof item.texto === "string" && item.nombre.trim() && item.texto.trim())).map((item) => ({ nombre: item.nombre.trim(), cargo: item.cargo?.trim() || "", texto: item.texto.trim() })).slice(0, 6) : [];
  const preguntasFrecuentes = puedeUsarSeccionesAmpliadas && Array.isArray(pagina.preguntasFrecuentes) ? pagina.preguntasFrecuentes.filter((item): item is PreguntaFrecuentePagina => Boolean(item && typeof item.pregunta === "string" && typeof item.respuesta === "string" && item.pregunta.trim() && item.respuesta.trim())).map((item) => ({ pregunta: item.pregunta.trim(), respuesta: item.respuesta.trim() })).slice(0, 8) : [];

  const puedeUsarTurnos = empresaTieneFuncion(empresa, "turnos");
  const puedeMostrarReservaGenerica = puedeUsarTurnos && servicios.length > 0 && !esRestaurante;
  const mostrarReservaMesa = esRestaurante && puedeUsarTurnos && pagina.mostrarReservasMesa === true;

  const mostrarPedidosOnline = puedeUsarProductos && productos.length > 0;
  const puedeMostrarReserva = puedeMostrarReservaGenerica || mostrarReservaMesa;
  const puedeUsarPresupuestos = empresaTieneFuncion(empresa, "presupuestos");
  const sinMarcaNDI = empresaTieneFuncion(empresa, "sin_marca_ndi");

  const claseTextoSecundario = "text-slate-600 transition-colors dark:text-zinc-400";
  const claseSeccionAlterna = "border-slate-200/80 bg-slate-50/70 transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/30";

  const selectedFont = fontMap[pagina.tipografia || "inter"] || fontMap['inter'];
  const tieneInfo = Boolean(empresa.horarios || empresa.direccion || empresa.telefono || empresa.email);

  return (
    <main
      className="min-h-screen scroll-smooth bg-[#f8f9fa] text-slate-950 antialiased selection:bg-blue-600 selection:text-white transition-colors duration-300 dark:bg-[#0c0d0e] dark:text-zinc-100"
      style={selectedFont.style}
    >
      <PublicAnalytics slug={slug} />

      {/* HEADER ESTÁNDAR */}
      <header className="sticky top-0 z-50 h-16 bg-[#f8f9fa]/90 backdrop-blur-xl transition-colors dark:bg-[#0c0d0e]/90 border-b border-slate-200/40 dark:border-zinc-800/40">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
          <a href="#inicio" className="group flex min-w-0 items-center gap-3">
            {mostrarLogoHeader && (logoUrl || logoOscuroUrl) ? (
              <LogoHeaderDinamico
                logoClaro={logoUrl}
                logoOscuro={logoOscuroUrl}
                nombre={nombre}
              />
            ) : mostrarLogoHeader ? (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition group-hover:scale-105"
                style={{ backgroundColor: colorPrincipal }}
              >
                <Globe2 className="h-4 w-4" />
              </div>
            ) : null}

            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                {empresa.rubro || "Negocio"}
              </p>
              <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {nombre}
              </p>
            </div>
          </a>  

          <nav className="hidden items-center gap-1 lg:flex">
            {mostrarServicios && servicios.length > 0 && (
              <a
                href="#servicios"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
              >
                {esAlojamiento ? "Habitaciones" : "Servicios"}
              </a>
            )}

            {mostrarProductos && productos.length > 0 && (
              <a
                href="#productos"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
              >
                {esRestaurante ? "Carta" : "Tienda"}
              </a>
            )}

            {mostrarGaleria && galeria.length > 0 && (
              <a
                href="#galeria"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Galería
              </a>
            )}

            {testimonios.length > 0 && (
              <a
                href="#testimonios"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Opiniones
              </a>
            )}

            {preguntasFrecuentes.length > 0 && (
              <a
                href="#preguntas"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Preguntas
              </a>
            )}

            {mostrarContacto && (
              <a
                href="#contacto"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Contacto
              </a>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <BotonTema temaInicial={pagina.tema || "oscuro"} />
            
            {puedeMostrarReserva && (
              <a
                href="#reservar"
                className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95 md:inline-flex"
                style={{ backgroundColor: colorPrincipal }}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {mostrarReservaMesa ? "Reservar mesa" : "Reservar turno"}
              </a>
            )}

            {mostrarWhatsApp && (
              <BotonWhatsAppHeader whatsappUrl={whatsappUrl} />
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO */}
      <div id="inicio">
        <HeroPublico
          titulo={pagina.titulo || empresa.nombre || "Negocio"}
          subtitulo={pagina.subtitulo || empresa.descripcion || ""}
          logoUrl={logoUrl}
          colorPrincipal={colorPrincipal}
          multimediaHero={multimediaHero}
        />
      </div>

      {/* 2. BARRA DE INFORMACIÓN RÁPIDA */}
      {tieneInfo && (
        <section className="mx-auto max-w-[1440px] px-4 py-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 dark:text-zinc-300">
            {mostrarHorarios && empresa.horarios && (
              <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 px-3 py-2 border border-slate-200/70 dark:border-zinc-800/70 shadow-sm backdrop-blur-md">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Horarios</p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-800 dark:text-zinc-200 leading-tight">{empresa.horarios}</p>
                </div>
              </div>
            )}

            {mostrarDireccion && empresa.direccion && (
              <a
                href="#ubicacion"
                className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 px-3 py-2 border border-slate-200/70 dark:border-zinc-800/70 shadow-sm backdrop-blur-md transition hover:border-slate-300"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Ubicación</p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-800 dark:text-zinc-200 leading-tight line-clamp-2">{empresa.direccion}</p>
                </div>
              </a>
            )}

            {mostrarWhatsApp && empresa.telefono && (
              <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 px-3 py-2 border border-slate-200/70 dark:border-zinc-800/70 shadow-sm backdrop-blur-md">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Teléfono</p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-800 dark:text-zinc-200 leading-tight truncate">{empresa.telefono}</p>
                </div>
              </div>
            )}

            {mostrarEmail && empresa.email && (
              <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 px-3 py-2 border border-slate-200/70 dark:border-zinc-800/70 shadow-sm backdrop-blur-md">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Correo</p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-800 dark:text-zinc-200 leading-tight truncate">{empresa.email}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. SERVICIOS */}
      {mostrarServicios && servicios.length > 0 && (
        <section id="servicios" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-12 sm:px-10 sm:py-16">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: colorPrincipal }}>
              — LO QUE OFRECEMOS
            </p>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {esAlojamiento ? "Habitaciones" : "Servicios"}
            </h2>
            <p className={`mt-1 text-xs sm:text-sm ${claseTextoSecundario}`}>
              {esAlojamiento ? "Elegí la habitación que mejor se adapte a tu estadía." : "Conocé los servicios disponibles y reservá tu turno."}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="w-full max-w-sm sm:max-w-md">
                <CatalogoCard
                  item={servicio}
                  color={colorPrincipal}
                  puedeReservar={puedeUsarTurnos && !esRestaurante}
                  mostrarWhatsApp={mostrarWhatsApp}
                  whatsappUrl={whatsappUrl}
                  mostrarContacto={mostrarContacto}
                  slug={slug}
                  tema={esClaro ? "claro" : "oscuro"}
                  esAlojamiento={esAlojamiento}
                  limiteFotos={limiteFotosItems}
                  pedidosHabilitados={mostrarPedidosOnline}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. RESERVA ONLINE */}
      {!esAlojamiento && puedeMostrarReserva && (
        <section id="reservar" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
            {mostrarReservaMesa ? (
              <ReservaMesaForm slug={slug} colorPrincipal={colorPrincipal} tema={esClaro ? "claro" : "oscuro"} />
            ) : (
              <ReservaForm
                slug={slug}
                servicios={servicios.map((servicio) => ({ id: servicio.id, nombre: servicio.nombre, precio: servicio.precio, duracionMinutos: servicio.duracionMinutos }))}
                colorPrincipal={colorPrincipal}
                tema={esClaro ? "claro" : "oscuro"}
              />
            )}
          </div>
        </section>
      )}

      {/* 5. PRODUCTOS / CARTA */}
      {mostrarProductos && productos.length > 0 && (
        <section id="productos" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-8 sm:px-10 sm:py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colorPrincipal }}>
              {esRestaurante ? "Menú" : "Colección"}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {esRestaurante ? "Carta" : "Catálogo de productos"}
            </h2>
            <p className={`mt-1 text-xs sm:text-sm ${claseTextoSecundario}`}>
              {esRestaurante ? "Explorá nuestras entradas, platos principales, bebidas y postres." : "Descubrí todos los productos disponibles en nuestra tienda."}
            </p>
          </div>

          <div className="mt-5 sm:mt-7">
            {esRestaurante ? (
              <RestauranteCartaPedidos
                slug={slug}
                productos={productosRestaurante}
                colorPrincipal={colorPrincipal}
                tema={esClaro ? "claro" : "oscuro"}
                pedidosHabilitados={mostrarPedidosOnline}
                whatsappUrl={whatsappUrl}
                mostrarWhatsApp={mostrarWhatsApp}
              />
            ) : (
              <TiendaCatalogoPedidos
                slug={slug}
                empresaId={documento.id}
                productos={productosTienda}
                colorPrincipal={colorPrincipal}
                tema={esClaro ? "claro" : "oscuro"}
                pedidosHabilitados={mostrarPedidosOnline}
                whatsappUrl={whatsappUrl}
                mostrarWhatsApp={mostrarWhatsApp}
                mostrarContacto={mostrarContacto}
                pagosConfig={empresa.pagosConfig}
              />
            )}
          </div>
        </section>
      )}

      {/* 6. GALERÍA DE FOTOS */}
      {mostrarGaleria && galeria.length > 0 && (
        <section id="galeria" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-10 sm:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colorPrincipal }}>
                Espacio
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Galería de fotos
              </h2>
              <p className={`mt-1 text-xs sm:text-sm ${claseTextoSecundario}`}>
                Conocé el espacio y la calidad de {empresa.nombre || nombre}.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {galeria.map((url, indice) => (
                <div
                  key={`${url}-${indice}`}
                  className="group aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`${nombre} imagen ${indice + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. SOBRE NOSOTROS */}
      {empresa.descripcion && (
        <section id="nosotros" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-10 sm:py-16">
            <div className="grid gap-6 sm:gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colorPrincipal }}>
                  Sobre nosotros
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
                  Conocé más sobre {empresa.nombre || nombre}
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
                <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                  {empresa.descripcion}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. MAPA */}
      {mostrarMapa && mostrarDireccion && mapaEmbedUrl && (
        <section id="ubicacion" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-10 sm:px-10">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-2 border-b border-slate-200 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Ubicación
                </p>
                <h2 className="mt-0.5 text-base sm:text-lg font-semibold">Cómo llegar</h2>
                <p className={`mt-0.5 text-xs ${claseTextoSecundario}`}>{direccionMapa}</p>
              </div>
              <a
                href={mapaAbrirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                <MapPin className="h-3.5 w-3.5" />
                Abrir en Google Maps
              </a>
            </div>
            <iframe
              src={mapaEmbedUrl}
              title={`Mapa de ${nombre}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[300px] w-full border-0"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* 9. CONTACTO */}
      {mostrarContacto && (
        <section id="contacto" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-10 sm:px-10 sm:py-16">
          <div
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-zinc-800/60 dark:bg-zinc-900/60 sm:p-10"
            style={{ borderColor: `${colorPrincipal}33` }}
          >
            <div className="relative grid gap-8 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colorPrincipal }}>
                  Contacto directo
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  ¿Querés hacer una consulta?
                </h2>
                <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${claseTextoSecundario}`}>
                  Dejanos tus datos y te responderemos a la brevedad por teléfono o correo electrónico.
                </p>

                <div className="mt-5 flex flex-row gap-3">
                  {mostrarWhatsApp && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 active:scale-95"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}

                  {mostrarEmail && (
                    <a
                      href={`mailto:${empresa.email}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 active:scale-95"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Correo
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:p-7">
                <ContactoForm slug={slug} nombreNegocio={empresa.nombre || nombre} tema={esClaro ? "claro" : "oscuro"} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER ESTÁNDAR */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0c0d0e] w-full">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-8 text-xs text-slate-500 dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-semibold text-slate-900 dark:text-zinc-200">
              {empresa.nombre || nombre}
            </p>
            {empresa.rubro && <p className="mt-0.5 text-[11px]">{empresa.rubro}</p>}
          </div>

          {!sinMarcaNDI && (
            <p className="text-[11px]">
              Página creada con <span className="font-semibold text-slate-900 dark:text-zinc-200">NDI AI</span>
            </p>
          )}
        </div>
      </footer>
    </main>
  );
}

function CatalogoCard({
  item,
  color,
  puedeReservar,
  mostrarWhatsApp,
  whatsappUrl,
  mostrarContacto,
  slug,
  tema = "oscuro",
  esRestaurante = false,
  esAlojamiento = false,
  limiteFotos = 1,
}: {
  item: CatalogoItem;
  color: string;
  puedeReservar: boolean;
  mostrarWhatsApp: boolean;
  whatsappUrl: string;
  mostrarContacto: boolean;
  slug?: string;
  tema?: "oscuro" | "claro";
  esRestaurante?: boolean;
  esAlojamiento?: boolean;
  limiteFotos?: number;
  pedidosHabilitados?: boolean;
}) {
  const mensajeWhatsApp = `Hola, quiero consultar por ${item.tipo === "servicio" ? "el servicio" : "el producto"} "${item.nombre}".`;
  const whatsappItemUrl = mostrarWhatsApp && whatsappUrl ? `${whatsappUrl}?text=${encodeURIComponent(mensajeWhatsApp)}` : "";

  const imagenesItem = (Array.isArray(item.imagenes) ? item.imagenes.filter((url): url is string => typeof url === "string" && url.trim().length > 0) : [])
    .map((url) => url.trim())
    .slice(0, limiteFotos);

  if (imagenesItem.length === 0 && item.imagenUrl?.trim()) {
    imagenesItem.push(item.imagenUrl.trim());
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-zinc-700">
      {imagenesItem.length > 0 && (
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-slate-100 bg-slate-100 dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {imagenesItem.map((url, indice) => (
              <img
                key={`${url}-${indice}`}
                src={url}
                alt={`${item.nombre} foto ${indice + 1}`}
                loading="lazy"
                className="h-full w-full shrink-0 snap-center object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
          {item.nombre}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
          <div>
            {Boolean(item.precio) && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {esAlojamiento && item.tipo === "servicio" ? "Por noche" : "Precio"}
                </p>
                <p className="mt-0.5 text-lg font-extrabold sm:text-xl" style={{ color }}>
                  ${Number(item.precio).toLocaleString("es-AR")}
                  {esAlojamiento && item.tipo === "servicio" && (
                    <span className="ml-1 text-xs font-normal text-slate-500 dark:text-zinc-400">
                      / noche
                    </span>
                  )}
                </p>
              </>
            )}
          </div>

          {item.tipo === "servicio" && Boolean(item.duracionMinutos) && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Duración
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
                {item.duracionMinutos} min
              </p>
            </div>
          )}
        </div>

        {puedeReservar && !esAlojamiento && slug && (
          <HorariosTarjetaServicio
            slug={slug}
            servicioId={item.id}
            colorPrincipal={color}
          />
        )}
      </div>
    </article>
  );
}