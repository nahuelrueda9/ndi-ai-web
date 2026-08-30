import {
  ChevronDown,
  Clock3,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Package,
  Phone,
  Quote,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { adminDb } from "@/lib/firebaseAdmin";
import {
  empresaTieneFuncion,
  empresaTieneSuscripcionActiva,
} from "@/lib/plans/planAccess";
import ReservaForm from "./ReservaForm";
import ReservaAlojamientoForm from "./ReservaAlojamientoForm";
import ReservaMesaForm from "./ReservaMesaForm";
import ProximosHorarios from "./ProximosHorarios";
import RestauranteCartaPedidos from "./RestauranteCartaPedidos";
import TiendaCatalogoPedidos from "./TiendaCatalogoPedidos";
import AlojamientoDetalle from "./AlojamientoDetalle";
import ContactoForm from "./ContactForm";
import PublicAnalytics from "./PublicAnalytics";
import CompartirPagina from "./CompartirPagina";
import PresupuestoFormulario from "./PresupuestoFormulario";
import { fontMap } from "@/lib/fonts";
import BotonTema from "./BotonTema";

export const dynamic = "force-dynamic";

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

  const catalogoSnapshot = await adminDb.collection("companies").doc(documento.id).collection("catalog").get();
  const catalogo: CatalogoItem[] = catalogoSnapshot.docs
    .map((docCatalogo) => ({
      id: docCatalogo.id,
      ...(docCatalogo.data() as Omit<CatalogoItem, "id">),
    }))
    .filter((item) => item.activo !== false);

  const puedeUsarCatalogo = empresaTieneFuncion(empresa, "catalogo");
  const puedeUsarProductos = empresaTieneFuncion(empresa, "productos");
  const puedeUsarQr = empresaTieneFuncion(empresa, "qr");
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
  const esTienda = ["tienda", "tienda de ropa", "indumentaria", "ropa"].includes(rubroNormalizado);
  const mostrarHorariosRapidos = ["barberia", "barbería", "peluqueria", "peluquería", "consultorio"].includes(rubroNormalizado);

  const textoHeroGuardado = pagina.subtitulo || empresa.descripcion || "";
  const textoSecundarioGuardado = pagina.textoSecundario || "";
  const lineasHero = !textoSecundarioGuardado && textoHeroGuardado.includes("\n") ? textoHeroGuardado.split("\n").map((linea) => linea.trim()).filter(Boolean) : [];
  const textoPrincipal = lineasHero.length > 0 ? lineasHero[0] : textoHeroGuardado;
  const textoSecundario = textoSecundarioGuardado || (lineasHero.length > 1 ? lineasHero.slice(1).join(" ") : "");

  const colorPrincipal = pagina.colorPrincipal || "#2563eb";
  const logoUrl = pagina.logoUrl?.trim() || "";

  const esClaro = pagina.tema === "claro";
  const logoOscuroUrl = pagina.logoOscuroUrl?.trim() || "";
  const logoParaHeader = esClaro && logoOscuroUrl ? logoOscuroUrl : logoUrl;
  const portadaUrl = pagina.portadaUrl?.trim() || "";
  
  const galeria = Array.isArray(pagina.galeria) ? pagina.galeria.filter((url): url is string => typeof url === "string" && url.trim().length > 0).slice(0, 6) : [];

  const telefonoLimpio = empresa.telefono?.replace(/\D/g, "") || "";
  const whatsappUrl = telefonoLimpio ? `https://wa.me/${telefonoLimpio}` : "";

  const mostrarWhatsApp = pagina.mostrarWhatsApp !== false && Boolean(telefonoLimpio);
  const mostrarEmail = pagina.mostrarEmail !== false && Boolean(empresa.email);
  const mostrarDireccion = pagina.mostrarDireccion !== false && Boolean(empresa.direccion);
  const mostrarHorarios = pagina.mostrarHorarios !== false && Boolean(empresa.horarios);
  const mostrarServicios = pagina.mostrarServicios !== false;
  const mostrarProductos = puedeUsarCatalogo && (esRestaurante || pagina.mostrarProductos !== false);
  const mostrarGaleria = puedeUsarSeccionesAmpliadas && pagina.mostrarGaleria !== false;
  const mostrarMapa = pagina.mostrarMapa !== false;
  const mostrarPresupuesto = pagina.mostrarPresupuesto !== false;
  const mostrarContacto = pagina.mostrarContacto !== false;
  const mostrarLogoHeader = pagina.mostrarLogoHeader !== false;  

  const direccionMapa = empresa.direccion?.trim() || "";
  const mapaEmbedUrl = direccionMapa ? `https://www.google.com/maps?q=${encodeURIComponent(direccionMapa)}&output=embed` : "";
  const mapaAbrirUrl = direccionMapa ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionMapa)}` : "";

  const redesSociales = [
    { nombre: "Instagram", url: normalizarUrlExterna(empresa.redesSociales?.instagram) },
    { nombre: "Facebook", url: normalizarUrlExterna(empresa.redesSociales?.facebook) },
    { nombre: "TikTok", url: normalizarUrlExterna(empresa.redesSociales?.tiktok) },
  ].filter((red): red is { nombre: string; url: string } => Boolean(red.url));

  const testimonios = puedeUsarSeccionesAmpliadas && Array.isArray(pagina.testimonios) ? pagina.testimonios.filter((item): item is TestimonioPagina => Boolean(item && typeof item.nombre === "string" && typeof item.texto === "string" && item.nombre.trim() && item.texto.trim())).map((item) => ({ nombre: item.nombre.trim(), cargo: item.cargo?.trim() || "", texto: item.texto.trim() })).slice(0, 6) : [];
  const preguntasFrecuentes = puedeUsarSeccionesAmpliadas && Array.isArray(pagina.preguntasFrecuentes) ? pagina.preguntasFrecuentes.filter((item): item is PreguntaFrecuentePagina => Boolean(item && typeof item.pregunta === "string" && typeof item.respuesta === "string" && item.pregunta.trim() && item.respuesta.trim())).map((item) => ({ pregunta: item.pregunta.trim(), respuesta: item.respuesta.trim() })).slice(0, 8) : [];

  const puedeUsarTurnos = empresaTieneFuncion(empresa, "turnos");
  const puedeMostrarReservaGenerica = puedeUsarTurnos && servicios.length > 0 && !esRestaurante;
  const mostrarReservaMesa = esRestaurante && puedeUsarTurnos && pagina.mostrarReservasMesa === true;

  const mostrarPedidosOnline = puedeUsarProductos && productos.length > 0;
  
  const puedeMostrarReserva = puedeMostrarReservaGenerica || mostrarReservaMesa;
  const puedeUsarPresupuestos = empresaTieneFuncion(empresa, "presupuestos");
  const puedeUsarAsistenteIA = empresaTieneFuncion(empresa, "asistente_ia");
  const sinMarcaNDI = empresaTieneFuncion(empresa, "sin_marca_ndi");

  const claseTextoSecundario = "text-slate-600 transition-colors dark:text-zinc-400";
  const claseSeccionAlterna = "border-slate-200/80 bg-slate-50/70 transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/30";

  const nombreTipografia = pagina.tipografia || "inter";
  const selectedFont = fontMap[nombreTipografia] || fontMap['inter'];

  return (
    <main
      className="min-h-screen scroll-smooth pb-20 sm:pb-0 bg-white text-slate-950 antialiased selection:bg-blue-500 selection:text-white transition-colors duration-300 dark:bg-[#0c0d0e] dark:text-zinc-100"
      style={selectedFont.style}
    >
      <PublicAnalytics slug={slug} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-colors dark:border-zinc-800/60 dark:bg-[#0c0d0e]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4">
          <a href="#inicio" className="group flex min-w-0 items-center gap-3">
            {logoParaHeader && mostrarLogoHeader ? (
              <img
                src={logoParaHeader}
                alt={`Logo de ${nombre}`}
                className="h-9 w-auto max-w-[90px] shrink-0 object-contain sm:h-11 sm:max-w-[140px]"
              />
            ) : !logoParaHeader && mostrarLogoHeader ? (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-2xl"
                style={{ backgroundColor: colorPrincipal }}
              >
                <Globe2 className="h-5 w-5" />
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

          <nav className="hidden items-center gap-1.5 lg:flex">
            {mostrarServicios && servicios.length > 0 && (
              <a
                href="#servicios"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
              >
                {esAlojamiento ? "Habitaciones" : "Servicios"}
              </a>
            )}

            {mostrarProductos && productos.length > 0 && (
              <a
                href="#productos"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
              >
                {esRestaurante ? "Carta" : "Catálogo"}
              </a>
            )}

            {mostrarGaleria && galeria.length > 0 && (
              <a
                href="#galeria"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
              >
                Galería
              </a>
            )}

            {testimonios.length > 0 && (
              <a
                href="#testimonios"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
              >
                Opiniones
              </a>
            )}

            {preguntasFrecuentes.length > 0 && (
              <a
                href="#preguntas"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
              >
                Preguntas
              </a>
            )}

            {mostrarContacto && (
              <a
                href="#contacto"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
              >
                Contacto
              </a>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <BotonTema temaInicial={pagina.tema || "oscuro"} />
            
            {puedeMostrarReserva && (
              <a
                href="#reservar"
                className="hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95 md:inline-flex"
                style={{ backgroundColor: colorPrincipal }}
              >
                <Clock3 className="h-4 w-4" />
                {mostrarReservaMesa ? "Reservar mesa" : "Reservar turno"}
              </a>
            )}

            {mostrarWhatsApp && (
              <a
                href={whatsappUrl}
                data-analytics-event="whatsapp_click"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 sm:inline-flex"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO ESTILO SAAS / MODERNO */}
      <section
        id="inicio"
        className={`relative flex min-h-[560px] scroll-mt-20 items-center overflow-hidden sm:min-h-[75vh] ${
          portadaUrl ? "text-white" : ""
        }`}
      >
        {portadaUrl ? (
          <>
            <img
              src={portadaUrl}
              alt={`Portada de ${nombre}`}
              className="absolute inset-0 h-full w-full scale-[1.01] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: `radial-gradient(circle at 20% 50%, ${colorPrincipal}66, transparent 60%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${colorPrincipal}44, transparent 70%)`,
            }}
          />
        )}

        <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`Logo de ${nombre}`}
                  className="h-16 w-auto max-w-[120px] rounded-2xl bg-transparent object-contain shadow-xl sm:h-24 sm:max-w-[160px]"
                />
              )}

              {empresa.rubro && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md"
                  style={{
                    borderColor: `${colorPrincipal}66`,
                    backgroundColor: `${colorPrincipal}18`,
                    color: portadaUrl ? "#ffffff" : colorPrincipal,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {empresa.rubro}
                </div>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:mt-6 sm:text-6xl lg:text-5xl">
              {nombre}
            </h1>

            {textoPrincipal && (
              <p
                className={`mt-4 max-w-2xl text-lg font-medium leading-relaxed sm:mt-6 sm:text-2xl sm:leading-snug ${
                  portadaUrl ? "text-zinc-100" : "text-slate-800 dark:text-zinc-200"
                }`}
              >
                {textoPrincipal}
              </p>
            )}

            {textoSecundario && (
              <p
                className={`mt-2 max-w-2xl text-sm leading-relaxed sm:mt-3 sm:text-base ${
                  portadaUrl ? "text-zinc-300" : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                {textoSecundario}
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              {puedeMostrarReserva && (
                <a
                  href="#reservar"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95 sm:text-base"
                  style={{ backgroundColor: colorPrincipal }}
                >
                  <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {mostrarReservaMesa ? "Reservar mesa" : esAlojamiento ? "Reservar estadía" : "Reservar turno"}
                </a>
              )}

              {(mostrarWhatsApp || redesSociales.length > 0) && (
                <div className="flex w-full flex-nowrap items-center gap-2 sm:w-auto">
                  {mostrarWhatsApp && (
                    <a
                      href={whatsappUrl}
                      data-analytics-event="whatsapp_click"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-500 active:scale-95 sm:flex-none sm:text-base"
                    >
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Hablar por WhatsApp
                    </a>
                  )}

                  {redesSociales.map((red) => (
                    <a
                      key={`hero-${red.nombre}`}
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir ${red.nombre}`}
                      title={red.nombre}
                      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm backdrop-blur transition hover:-translate-y-0.5 active:scale-95 ${
                        portadaUrl 
                        ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {red.nombre === "Instagram" ? (
                        <span className="relative block h-5 w-5 rounded-[6px] border-2 border-current">
                          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-current" />
                          <span className="absolute right-[2px] top-[2px] h-[3px] w-[3px] rounded-full bg-current" />
                        </span>
                      ) : red.nombre === "Facebook" ? (
                        <span className="text-xl font-bold leading-none">f</span>
                      ) : (
                        <Music2 className="h-5 w-5" />
                      )}
                    </a>
                  ))}
                </div>
              )}

              {!puedeUsarTurnos && mostrarServicios && servicios.length > 0 && (
                <a
                  href="#servicios"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold backdrop-blur transition hover:-translate-y-0.5 active:scale-95 sm:text-base ${
                    portadaUrl 
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
                    : "border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  {esAlojamiento ? "Ver habitaciones" : "Ver catálogo"}
                </a>
              )}
            </div>

            {puedeUsarQr && (
              <div className="mt-5">
                <CompartirPagina
                  nombre={nombre}
                  tema={esClaro ? "claro" : "oscuro"}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TARJETAS DE INFORMACIÓN */}
      <section className="relative z-10 -mt-6 sm:-mt-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pb-8 sm:gap-4 sm:px-8 sm:pb-12 md:grid-cols-2 lg:grid-cols-4">
          {mostrarHorarios && (
            <InfoCard
              icono={<Clock3 className="h-5 w-5" />}
              titulo="Horarios"
              valor={empresa.horarios || ""}
              color={colorPrincipal}
            />
          )}

          {mostrarDireccion && (
            <a
              href="#ubicacion"
              className="block rounded-2xl transition hover:-translate-y-1"
              aria-label="Ir al mapa y ver cómo llegar"
            >
              <InfoCard
                icono={<MapPin className="h-5 w-5" />}
                titulo="Cómo llegar"
                valor={empresa.direccion || ""}
                color={colorPrincipal}
              />
            </a>
          )}

          {mostrarWhatsApp && (
            <InfoCard
              icono={<Phone className="h-5 w-5" />}
              titulo="Teléfono"
              valor={empresa.telefono || ""}
              color={colorPrincipal}
            />
          )}

          {mostrarEmail && (
            <InfoCard
              icono={<Mail className="h-5 w-5" />}
              titulo="Correo"
              valor={empresa.email || ""}
              color={colorPrincipal}
            />
          )}
        </div>
      </section>

      {/* SECCIÓN SERVICIOS */}
      {mostrarServicios && servicios.length > 0 && (
        <section id="servicios" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
              Lo que ofrecemos
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {esAlojamiento ? "Habitaciones" : "Servicios"}
            </h2>
            <p className={`mt-2 text-sm sm:text-base ${claseTextoSecundario}`}>
              {esAlojamiento ? "Elegí la habitación que mejor se adapte a tu estadía." : "Conocé los servicios disponibles."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servicios.map((servicio) => (
              <CatalogoCard
                key={servicio.id}
                item={servicio}
                color={colorPrincipal}
                puedeReservar={puedeUsarTurnos && !esRestaurante}
                mostrarWhatsApp={mostrarWhatsApp}
                whatsappUrl={whatsappUrl}
                mostrarContacto={mostrarContacto}
                slug={slug}
                mostrarHorariosRapidos={mostrarHorariosRapidos}
                tema={esClaro ? "claro" : "oscuro"}
                esAlojamiento={esAlojamiento}
                limiteFotos={limiteFotosItems}
                pedidosHabilitados={mostrarPedidosOnline}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN PRODUCTOS / CARTA */}
      {mostrarProductos && productos.length > 0 && (
        <section id="productos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
              {esRestaurante ? "Menú" : "Catálogo"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {esRestaurante ? "Carta" : "Productos"}
            </h2>
            <p className={`mt-2 text-sm sm:text-base ${claseTextoSecundario}`}>
              {esRestaurante ? "Explorá nuestras entradas, platos principales, bebidas y postres." : "Productos disponibles en este negocio."}
            </p>
          </div>

          <div className="mt-6 sm:mt-10">
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

      {/* PRESUPUESTO */}
      {puedeUsarPresupuestos && mostrarPresupuesto && (
        <section id="presupuesto" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                    Presupuesto
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                    ¿Necesitás un presupuesto a medida?
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                    Contanos qué estás buscando y te preparamos una cotización personalizada.
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: colorPrincipal }}
                >
                  Solicitar cotización
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                </span>
              </summary>
              <div className="pt-6">
                <PresupuestoFormulario
                  slug={slug}
                  items={catalogoPermitido.map((item) => ({ id: item.id, nombre: item.nombre, tipo: item.tipo }))}
                  tema={esClaro ? "claro" : "oscuro"}
                />
              </div>
            </details>
          </div>
        </section>
      )}

      {/* GALERÍA */}
      {mostrarGaleria && galeria.length > 0 && (
        <section id="galeria" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                Imágenes
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                Galería de fotos
              </h2>
              <p className={`mt-2 text-sm sm:text-base ${claseTextoSecundario}`}>
                Conocé el espacio y la calidad de {empresa.nombre || nombre}.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {galeria.map((url, indice) => (
                <div
                  key={`${url}-${indice}`}
                  className="group aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`${nombre} - imagen ${indice + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RESERVA DE ALOJAMIENTO */}
      {esAlojamiento && puedeMostrarReserva && (
        <section id="reservar" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-20">
            <ReservaAlojamientoForm
              slug={slug}
              habitaciones={servicios.map((servicio) => ({ id: servicio.id, nombre: servicio.nombre, precio: servicio.precio }))}
              colorPrincipal={colorPrincipal}
              tema={esClaro ? "claro" : "oscuro"}
            />
          </div>
        </section>
      )}

      {/* SOBRE EL NEGOCIO */}
      {empresa.descripcion && (
        <section id="nosotros" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20">
            <div className="grid gap-6 sm:gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                  Sobre nosotros
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  Conocé más sobre {empresa.nombre || nombre}
                </h2>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-zinc-300 sm:text-base">
                  {empresa.descripcion}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIOS */}
      {testimonios.length > 0 && (
        <section id="testimonios" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
              Opiniones
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              Lo que dicen nuestros clientes
            </h2>
            <p className={`mt-2 text-sm sm:text-base ${claseTextoSecundario}`}>
              Experiencias de personas que eligen {empresa.nombre || nombre}.
            </p>
          </div>
          <div className={`mt-8 grid gap-4 sm:gap-6 ${testimonios.length === 1 ? "mx-auto max-w-2xl" : testimonios.length === 2 ? "mx-auto grid-cols-2 max-w-4xl" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {testimonios.map((testimonio, index) => (
              <article
                key={`${testimonio.nombre}-${index}`}
                className="relative flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: colorPrincipal }}>
                  <Quote className="h-5 w-5" />
                </div>
                <p className="mt-5 flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-zinc-300 sm:text-base">
                  “{testimonio.texto}”
                </p>
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                  <p className="text-sm font-bold sm:text-base">
                    {testimonio.nombre}
                  </p>
                  {testimonio.cargo && (
                    <p className={`mt-0.5 text-xs ${claseTextoSecundario}`}>
                      {testimonio.cargo}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* PREGUNTAS FRECUENTES */}
      {preguntasFrecuentes.length > 0 && (
        <section id="preguntas" className={`scroll-mt-24 border-y py-12 sm:py-20 ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                Preguntas frecuentes
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                Dudas comunes
              </h2>
            </div>
            <div className="mx-auto mt-8 max-w-2xl space-y-3">
              {preguntasFrecuentes.map((item, index) => (
                <details
                  key={`${item.pregunta}-${index}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition dark:border-zinc-800 dark:bg-zinc-950/70"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    <span>{item.pregunta}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base leading-none text-slate-600 transition group-open:rotate-45 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 pb-5 pt-3 dark:border-zinc-800">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                      {item.respuesta}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REDES SOCIALES */}
      {redesSociales.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 sm:pt-12">
          <div className={`rounded-3xl border p-6 sm:p-10 ${claseSeccionAlterna}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                  Nuestras redes
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-3xl">
                  Seguinos y enterate de novedades
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {redesSociales.map((red) => (
                  <a
                    key={red.nombre}
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ${red.nombre}`}
                    className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    {red.nombre === "Instagram" ? (
                      <span className="relative block h-4 w-4 rounded-[5px] border-2 border-current">
                        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current" />
                        <span className="absolute right-[2px] top-[2px] h-[2px] w-[2px] rounded-full bg-current" />
                      </span>
                    ) : red.nombre === "Facebook" ? (
                      <span className="text-lg font-bold leading-none">f</span>
                    ) : (
                      <Music2 className="h-4 w-4" />
                    )}
                    <span>{red.nombre}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAPA */}
      {mostrarMapa && mostrarDireccion && mapaEmbedUrl && (
        <section id="ubicacion" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Ubicación
                </p>
                <h2 className="mt-1 text-xl font-bold">Cómo llegar</h2>
                <p className={`mt-1 text-sm ${claseTextoSecundario}`}>{direccionMapa}</p>
              </div>
              <a
                href={mapaAbrirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                <MapPin className="h-4 w-4" />
                Abrir en Google Maps
              </a>
            </div>
            <iframe
              src={mapaEmbedUrl}
              title={`Mapa de ${nombre}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[340px] w-full border-0"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* RESERVA ONLINE */}
      {!esAlojamiento && puedeMostrarReserva && (
        <section id="reservar" className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-20">
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

      {/* CONTACTO */}
      {mostrarContacto && (
        <section id="contacto" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-8 sm:py-20">
          <div
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-zinc-800/60 dark:bg-zinc-900/60 sm:p-12"
            style={{ borderColor: `${colorPrincipal}33` }}
          >
            <div className="relative grid gap-8 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                  Contacto directo
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                  ¿Querés hacer una consulta?
                </h2>
                <p className={`mt-3 text-sm leading-relaxed sm:text-base ${claseTextoSecundario}`}>
                  Dejanos tus datos y te responderemos a la brevedad por teléfono o correo electrónico.
                </p>

                <div className="mt-6 flex flex-row gap-3 sm:gap-4">
                  {mostrarWhatsApp && (
                    <a
                      href={whatsappUrl}
                      data-analytics-event="whatsapp_click"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}

                  {mostrarEmail && (
                    <a
                      href={`mailto:${empresa.email}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 active:scale-95"
                    >
                      <Mail className="h-4 w-4" />
                      Correo
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:p-8">
                <ContactoForm slug={slug} nombreNegocio={empresa.nombre || nombre} tema={esClaro ? "claro" : "oscuro"} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOTONERA MÓVIL FIJA */}
      {(puedeMostrarReserva || mostrarContacto || mostrarWhatsApp || puedeUsarAsistenteIA) && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#0c0d0e]/90 sm:hidden">
          <div className={`mx-auto flex max-w-md gap-2 ${puedeUsarAsistenteIA ? "pr-[46px]" : ""}`}>
            {(puedeMostrarReserva || mostrarContacto) && (
              <a
                href={puedeMostrarReserva ? "#reservar" : "#contacto"}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-md active:scale-95"
                style={{ backgroundColor: colorPrincipal }}
              >
                {puedeMostrarReserva ? (
                  <>
                    <Clock3 className="h-4 w-4" />
                    {mostrarReservaMesa ? "Reservar mesa" : "Reservar turno"}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Consultar
                  </>
                )}
              </a>
            )}

            {mostrarWhatsApp && !puedeUsarAsistenteIA && (
              <a
                href={whatsappUrl}
                data-analytics-event="whatsapp_click"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir WhatsApp"
                className={`inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md transition hover:bg-emerald-500 active:scale-95 ${
                  puedeMostrarReserva || mostrarContacto ? "w-11 shrink-0" : "flex-1 gap-2 px-4"
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                {!(puedeMostrarReserva || mostrarContacto) && <span className="text-xs font-bold">WhatsApp</span>}
              </a>
            )}
          </div>
        </div>
      )}

      {/* ASISTENTE IA */}
      {puedeUsarAsistenteIA && (
        <Script src="/widget.js" data-empresa-id={documento.id} data-mobile-dock="true" strategy="afterInteractive" />
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-bold text-slate-900 dark:text-zinc-200">
              {empresa.nombre || nombre}
            </p>
            {empresa.rubro && <p className="mt-1 text-xs">{empresa.rubro}</p>}
          </div>

          {!sinMarcaNDI && (
            <p className="text-xs">
              Página creada con <span className="font-bold text-slate-900 dark:text-zinc-200">NDI AI</span>
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
  mostrarHorariosRapidos = false,
  tema = "oscuro",
  esRestaurante = false,
  esAlojamiento = false,
  esTienda = false,
  limiteFotos = 1,
  pedidosHabilitados = false,
}: {
  item: CatalogoItem;
  color: string;
  puedeReservar: boolean;
  mostrarWhatsApp: boolean;
  whatsappUrl: string;
  mostrarContacto: boolean;
  slug?: string;
  mostrarHorariosRapidos?: boolean;
  tema?: "oscuro" | "claro";
  esRestaurante?: boolean;
  esAlojamiento?: boolean;
  esTienda?: boolean;
  limiteFotos?: number;
  pedidosHabilitados?: boolean;
}) {
  const mensajeWhatsApp =
    esRestaurante && item.tipo === "producto"
      ? `Hola, quiero consultar por "${item.nombre}" de la carta.`
      : `Hola, quiero consultar por ${item.tipo === "servicio" ? "el servicio" : "el producto"} "${item.nombre}".`;

  const whatsappItemUrl = mostrarWhatsApp && whatsappUrl ? `${whatsappUrl}?text=${encodeURIComponent(mensajeWhatsApp)}` : "";

  const imagenesItem = (Array.isArray(item.imagenes) ? item.imagenes.filter((url): url is string => typeof url === "string" && url.trim().length > 0) : [])
    .map((url) => url.trim())
    .slice(0, limiteFotos);

  if (imagenesItem.length === 0 && item.imagenUrl?.trim()) {
    imagenesItem.push(item.imagenUrl.trim());
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-zinc-700">
      {imagenesItem.length > 0 && (
        <div className={`relative overflow-hidden border-b border-slate-100 bg-slate-100 dark:border-zinc-800/80 dark:bg-zinc-950 ${esTienda && item.tipo === "producto" ? "aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]" : "aspect-[4/3]"}`}>
          <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {imagenesItem.map((url, indice) => (
              <img key={`${url}-${indice}`} src={url} alt={`${item.nombre} - foto ${indice + 1}`} loading="lazy" className="h-full w-full shrink-0 snap-center object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          {item.nombre}
        </h3>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
          <div>
            {Boolean(item.precio) && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {esAlojamiento && item.tipo === "servicio" ? "Precio por noche" : "Precio"}
                </p>
                <p className="mt-0.5 text-base font-extrabold sm:text-lg" style={{ color }}>
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Duración
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {item.duracionMinutos} min
              </p>
            </div>
          )}
        </div>

        {puedeReservar && mostrarHorariosRapidos && slug && (
          <div className="mt-3">
            <ProximosHorarios slug={slug} servicioId={item.id} colorPrincipal={color} tema={tema} />
          </div>
        )}

        {(puedeReservar || whatsappItemUrl || mostrarContacto || (esAlojamiento && item.tipo === "servicio")) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {esAlojamiento && item.tipo === "servicio" && (
              <AlojamientoDetalle
                habitacion={{
                  id: item.id,
                  nombre: item.nombre,
                  descripcion: item.descripcion || "",
                  precio: typeof item.precio === "number" ? item.precio : 0,
                  imagenUrl: item.imagenUrl || "",
                  imagenes: Array.isArray(item.imagenes) ? item.imagenes.filter((url): url is string => typeof url === "string").slice(0, limiteFotos) : [],
                }}
                colorPrincipal={color}
                tema={tema}
                puedeReservar={puedeReservar}
              />
            )}

            {puedeReservar && !esAlojamiento && (
              <a
                href={`#reservar-servicio-${encodeURIComponent(item.id)}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
                style={{ backgroundColor: color }}
              >
                <Clock3 className="h-3.5 w-3.5" />
                Reservar
              </a>
            )}

            {!puedeReservar && whatsappItemUrl && (
              <a
                href={whatsappItemUrl}
                data-analytics-event="whatsapp_click"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Consultar
              </a>
            )}

            {!puedeReservar && !whatsappItemUrl && mostrarContacto && (
              <a
                href="#contacto"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
                style={{ backgroundColor: color }}
              >
                <Mail className="h-3.5 w-3.5" />
                Consultar
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function InfoCard({ icono, titulo, valor, color }: { icono: React.ReactNode; titulo: string; valor: string; color: string; }) {
  return (
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 sm:rounded-3xl sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl" style={{ backgroundColor: `${color}15`, color }}>
        {icono}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        {titulo}
      </p>
      <p className="mt-1 whitespace-pre-line break-words text-xs font-medium leading-relaxed text-slate-800 dark:text-zinc-200 sm:text-sm">
        {valor}
      </p>
    </div>
  );
}