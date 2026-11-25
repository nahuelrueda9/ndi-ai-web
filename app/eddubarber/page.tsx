import {
  Mail,
  ArrowRight,
  HelpCircle,
  Quote,
  MapPin,
} from "lucide-react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { adminDb } from "@/lib/firebaseAdmin";
import ReservaFormEddu from "@/app/eddubarber/ReservaFormEddu";
import ContactoForm from "@/app/negocio/[slug]/ContactForm";
import PublicAnalytics from "@/app/negocio/[slug]/PublicAnalytics";
import { fontMap } from "@/lib/fonts";
import LogoHeaderDinamico from "@/app/negocio/[slug]/LogoHeaderDinamico";
import HeaderFlotante from "@/components/HeaderFlotante";
import HeroEdduBarber from "@/components/HeroEdduBarber";
import HorariosTarjetaServicio from "@/app/negocio/[slug]/HorariosTarjetaServicio";
import CookieBannerEddu from "@/app/eddubarber/CookieBannerEddu";

export const dynamic = "force-dynamic";

const SLUG_EDDU = "eddu-barber";

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

interface ConfigSenaEddu {
  habilitada?: boolean;
  monto?: number;
  linkMercadoPago?: string;
}

interface ConfigDiaAgenda {
  activo?: boolean;
  apertura?: string;
  cierre?: string;
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
  agendaConfig?: {
    dias?: Record<string, ConfigDiaAgenda>;
  };
  senaConfig?: ConfigSenaEddu;
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
    mostrarGaleria?: boolean;
    mostrarContacto?: boolean;
    testimonios?: TestimonioPagina[];
    preguntasFrecuentes?: PreguntaFrecuentePagina[];
  };
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
  activo?: boolean;
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

function formatearHoraHs(hora?: string) {
  if (!hora) return "";
  const partes = hora.trim().split(":");
  if (partes.length < 2) return `${hora.trim()}hs`;
  const hh = partes[0].padStart(2, "0");
  const mm = partes[1].padStart(2, "0");
  return `${hh}:${mm}hs`;
}

function formatearDireccionEddu(direccion?: string) {
  const limpia = direccion?.trim() || "";
  if (!limpia) return { linea1: "", linea2: "" };

  const normalizada = limpia.toLowerCase();
  if (
    normalizada.includes("jujuy 44") &&
    normalizada.includes("libertador")
  ) {
    return {
      linea1: "Jujuy 44, Y4512",
      linea2: "Libertador General San Martín",
    };
  }

  const partes = limpia.split(",").map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 2) {
    const primera =
      partes[0].toLowerCase().includes("jujuy 44") && partes[1]?.toLowerCase().includes("y4512")
        ? `${partes[0]}, ${partes[1]}`
        : partes[0];
    const resto = primera.includes("Y4512") ? partes.slice(2).join(", ") : partes.slice(1).join(", ");
    return {
      linea1: primera,
      linea2: resto.replace(/,\s*Jujuy$/i, "").trim(),
    };
  }

  return { linea1: limpia, linea2: "" };
}

function formatearHorariosEddu(empresa: Empresa) {
  const dias = empresa.agendaConfig?.dias;
  const ordenDias = ["1", "2", "3", "4", "5", "6", "0"];
  const clavesActivas = dias
    ? ordenDias.filter((k) => Boolean(dias[k]?.activo))
    : [];

  if (clavesActivas.length > 0 && dias) {
    const nombresCortos: Record<string, string> = {
      "1": "Lun",
      "2": "Mar",
      "3": "Mié",
      "4": "Jue",
      "5": "Vie",
      "6": "Sáb",
      "0": "Dom",
    };

    const rangosPorDia = clavesActivas.map((k) => {
      const apertura = formatearHoraHs(dias[k]?.apertura || "09:00");
      const cierre = formatearHoraHs(dias[k]?.cierre || "22:00");
      return {
        clave: k,
        rango: `${apertura} a ${cierre}`,
      };
    });

    const todosIgualHorario = rangosPorDia.every(
      (item) => item.rango === rangosPorDia[0].rango
    );

    if (todosIgualHorario) {
      const esCorrido = ordenDias.slice(
        ordenDias.indexOf(clavesActivas[0]),
        ordenDias.indexOf(clavesActivas[clavesActivas.length - 1]) + 1
      ).join(",") === clavesActivas.join(",");

      const linea1 =
        esCorrido && clavesActivas.length >= 2
          ? `${nombresCortos[clavesActivas[0]]} a ${nombresCortos[clavesActivas[clavesActivas.length - 1]]}`
          : clavesActivas.map((k) => nombresCortos[k] || k).join(", ");

      return {
        linea1,
        linea2: `De ${rangosPorDia[0].rango}`,
      };
    }

    const resumenDias = rangosPorDia
      .map((item) => `${nombresCortos[item.clave] || item.clave}: ${item.rango}`)
      .join(" · ");

    return {
      linea1: resumenDias,
      linea2: "",
    };
  }

  const textoCrudo = empresa.horarios?.trim() || "";
  if (!textoCrudo) return { linea1: "", linea2: "" };

  const matchRango = textoCrudo.match(
    /^(.*?)\s+de\s+(\d{1,2}:\d{2})(?:hs)?\s+a\s+(\d{1,2}:\d{2})(?:hs)?$/i
  );
  if (matchRango) {
    const diasParte = matchRango[1].trim();
    const hInicio = formatearHoraHs(matchRango[2]);
    const hFin = formatearHoraHs(matchRango[3]);
    return {
      linea1: diasParte,
      linea2: `De ${hInicio} a ${hFin}`,
    };
  }

  return {
    linea1: textoCrudo,
    linea2: "",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const empresasSnapshot = await adminDb
    .collection("companies")
    .where("paginaPublica.slug", "==", SLUG_EDDU)
    .limit(1)
    .get();

  if (empresasSnapshot.empty) {
    return {
      title: { absolute: "Eddu Barber" },
      icons: {
        icon: "/eddubarber/icon.png",
        shortcut: "/eddubarber/icon.png",
        apple: "/eddubarber/icon.png",
      },
    };
  }

  const empresa = empresasSnapshot.docs[0].data() as Empresa;
  const pagina = empresa.paginaPublica;
  const nombre = pagina?.titulo?.trim() || empresa.nombre?.trim() || "Eddu Barber";
  const descripcion =
    pagina?.textoSecundario?.trim() ||
    pagina?.subtitulo?.trim() ||
    empresa.descripcion?.trim() ||
    "Reserva tu turno online en Eddu Barber.";
  const imagenSocial = pagina?.portadaUrl?.trim() || pagina?.logoUrl?.trim() || "";
  const iconoPestana =
    pagina?.logoUrl?.trim() || pagina?.logoOscuroUrl?.trim() || "/eddubarber/icon.png";

  return {
    title: {
      absolute: nombre,
    },
    description: descripcion.slice(0, 160),
    icons: {
      icon: iconoPestana,
      shortcut: iconoPestana,
      apple: iconoPestana,
    },
    openGraph: {
      title: nombre,
      description: descripcion.slice(0, 160),
      type: "website",
      locale: "es_AR",
      ...(imagenSocial ? { images: [{ url: imagenSocial, alt: nombre }] } : {}),
    },
  };
}

export default async function EdduBarberPage() {
  const empresasSnapshot = await adminDb
    .collection("companies")
    .where("paginaPublica.slug", "==", SLUG_EDDU)
    .limit(1)
    .get();

  if (empresasSnapshot.empty) notFound();

  const documento = empresasSnapshot.docs[0];
  const empresa = documento.data() as Empresa;
  const pagina = empresa.paginaPublica;

  // Cargar catálogo exclusivo de servicios
  const catalogoSnapshot = await adminDb
    .collection("companies")
    .doc(documento.id)
    .collection("catalog")
    .get();
  const catalogo: CatalogoItem[] = catalogoSnapshot.docs
    .map((docCatalogo) => ({
      id: docCatalogo.id,
      ...(docCatalogo.data() as Omit<CatalogoItem, "id">),
    }))
    .filter((item) => item.activo !== false);

  const servicios = catalogo.filter((item) => item.tipo === "servicio");
  const nombre = pagina?.titulo || empresa.nombre || "Eddu Barber";
  const colorPrincipal = "#ED192D";

  // Control dinámico según el panel de administración
  const mostrarContacto = pagina?.mostrarContacto !== false;

  // Multimedia Hero
  const multimediaHero: ElementoHero[] =
    Array.isArray(pagina?.multimediaHero) && pagina.multimediaHero.length > 0
      ? pagina.multimediaHero
      : [
          pagina?.portadaUrl,
          pagina?.portadaUrl2,
          pagina?.portadaUrl3,
          pagina?.portadaUrl4,
          pagina?.portadaUrl5,
          pagina?.portadaUrl6,
        ]
          .filter((url): url is string => Boolean(url && url.trim().length > 0))
          .map((url) => ({ url, tipo: "imagen" }));

  // Galería de fotos
  const galeriaCruda = Array.isArray(pagina?.galeria)
    ? pagina.galeria.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];
  const galeria = galeriaCruda.slice(0, 5);

  const telefonoLimpio = empresa.telefono?.replace(/\D/g, "") || "";
  const whatsappUrl = telefonoLimpio ? `https://wa.me/${telefonoLimpio}` : "";

  const direccionFormateada = formatearDireccionEddu(empresa.direccion);
  const horarioFormateado = formatearHorariosEddu(empresa);

  const direccionMapa = empresa.direccion?.trim() || "";
  const mapaEmbedUrl = direccionMapa
    ? `https://www.google.com/maps?q=${encodeURIComponent(direccionMapa)}&output=embed`
    : "";
  const mapaAbrirUrl = direccionMapa
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionMapa)}`
    : "";
  const direccionHref = mapaEmbedUrl ? "#ubicacion" : mapaAbrirUrl;

  const testimonios = Array.isArray(pagina?.testimonios)
    ? pagina.testimonios
        .filter(
          (item): item is TestimonioPagina =>
            Boolean(
              item &&
                typeof item.nombre === "string" &&
                typeof item.texto === "string" &&
                item.nombre.trim() &&
                item.texto.trim()
            )
        )
        .map((item) => ({
          nombre: item.nombre.trim(),
          cargo: item.cargo?.trim() || "",
          texto: item.texto.trim(),
        }))
        .slice(0, 6)
    : [];

  const preguntasFrecuentes = Array.isArray(pagina?.preguntasFrecuentes)
    ? pagina.preguntasFrecuentes
        .filter(
          (item): item is PreguntaFrecuentePagina =>
            Boolean(
              item &&
                typeof item.pregunta === "string" &&
                typeof item.respuesta === "string" &&
                item.pregunta.trim() &&
                item.respuesta.trim()
            )
        )
        .map((item) => ({
          pregunta: item.pregunta.trim(),
          respuesta: item.respuesta.trim(),
        }))
        .slice(0, 8)
    : [];

  const selectedFont = fontMap[pagina?.tipografia || "inter"] || fontMap["inter"];

  return (
    <main
      className="min-h-screen scroll-smooth bg-[#0c0d0e] text-zinc-100 antialiased selection:bg-[#ED192D] selection:text-white"
      style={selectedFont.style}
    >
      <PublicAnalytics slug={SLUG_EDDU} />
      <CookieBannerEddu />

      {/* HEADER FLOTANTE NEGRO */}
      <HeaderFlotante slug={SLUG_EDDU}>
        <div className="relative flex h-full w-full items-center justify-between px-4 sm:px-8 bg-black border-0 m-0">
          <div className="flex items-center w-9" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#inicio" className="flex items-center justify-center transition hover:scale-105">
              <LogoHeaderDinamico
                logoClaro={pagina?.logoUrl}
                logoOscuro={pagina?.logoOscuroUrl}
                nombre={nombre}
              />
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {empresa.redesSociales?.instagram && (
              <a
                href={normalizarUrlExterna(empresa.redesSociales.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-pink-400"
              >
                <FaInstagram className="h-4 w-4" />
              </a>
            )}
            {empresa.redesSociales?.tiktok && (
              <a
                href={normalizarUrlExterna(empresa.redesSociales.tiktok)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
              >
                <FaTiktok className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </HeaderFlotante>

      {/* 1. HERO A PANTALLA COMPLETA */}
      <div id="inicio" className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden">
        <HeroEdduBarber
          titulo={pagina?.titulo || empresa.nombre || "Eddu Barber"}
          subtitulo={pagina?.subtitulo || empresa.descripcion || ""}
          logoUrl={pagina?.logoUrl}
          colorPrincipal={colorPrincipal}
          multimediaHero={multimediaHero}
        />
      </div>

      {/* 2. SUCURSAL / MÁS SOBRE LA BARBER (FONDO BLANCO) */}
      <section className="bg-white text-slate-900 border-b border-slate-200 py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
          <div className="max-w-3xl space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ED192D]">
                — BARBERÍA
              </p>
              <h2 className="mt-2 text-xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-slate-950 font-serif">
                {pagina?.textoSecundario?.trim() || "MÁS SOBRE LA BARBER"}
              </h2>
              {pagina?.subtitulo?.trim() && (
                <p className="mt-3 text-sm text-slate-600">
                  {pagina.subtitulo}
                </p>
              )}
            </div>

            <div className="space-y-4 divide-y divide-slate-200 pt-2">
              {empresa.direccion && (
                <div className="grid grid-cols-[105px_1fr] sm:grid-cols-3 items-start sm:items-center gap-2 pt-4">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    DIRECCIÓN
                  </span>
                  {direccionHref ? (
                    <a
                      href={direccionHref}
                      {...(!mapaEmbedUrl
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="sm:col-span-2 text-[13px] sm:text-sm font-medium text-slate-800 leading-snug transition hover:text-[#ED192D]"
                    >
                      <span className="block">{direccionFormateada.linea1}</span>
                      {direccionFormateada.linea2 && (
                        <span className="block text-slate-700 transition hover:text-[#ED192D]">
                          {direccionFormateada.linea2}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div className="sm:col-span-2 text-[13px] sm:text-sm font-medium text-slate-800 leading-snug">
                      <span className="block">{direccionFormateada.linea1}</span>
                      {direccionFormateada.linea2 && (
                        <span className="block text-slate-700">{direccionFormateada.linea2}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(horarioFormateado.linea1 || empresa.horarios) && (
                <div className="grid grid-cols-[105px_1fr] sm:grid-cols-3 items-start sm:items-center gap-2 pt-4">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    HORARIOS
                  </span>
                  <div className="sm:col-span-2 text-[13px] sm:text-sm font-medium text-slate-800 leading-snug">
                    <span className="block">{horarioFormateado.linea1}</span>
                    {horarioFormateado.linea2 && (
                      <span className="block text-slate-700">{horarioFormateado.linea2}</span>
                    )}
                  </div>
                </div>
              )}

              {empresa.telefono && (
                <div className="grid grid-cols-[105px_1fr] sm:grid-cols-3 items-center gap-2 pt-4">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    TELÉFONO
                  </span>
                  <a
                    href={`https://wa.me/${telefonoLimpio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:col-span-2 text-[13px] sm:text-sm font-medium text-slate-800 transition hover:text-[#ED192D] inline-flex items-center gap-1.5"
                  >
                    {empresa.telefono}
                  </a>
                </div>
              )}

              {empresa.redesSociales?.instagram && (
                <div className="grid grid-cols-[105px_1fr] sm:grid-cols-3 items-center gap-2 pt-4">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    INSTAGRAM
                  </span>
                  <a
                    href={normalizarUrlExterna(empresa.redesSociales.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:col-span-2 text-[13px] sm:text-sm font-medium text-slate-800 underline transition hover:text-[#ED192D] break-all sm:break-normal"
                  >
                    @{empresa.redesSociales.instagram.replace(/.*instagram\.com\//, "").replace(/\//g, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICIOS CON FONDO NEGRO */}
      {servicios.length > 0 && (
        <section id="servicios" className="bg-black border-y border-zinc-900 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
            <div className="mb-10 sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1 text-[#ED192D]">
                — LO QUE OFRECEMOS
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-white leading-snug">
                Servicios
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Conocé los servicios disponibles y reservá tu turno.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {servicios.map((servicio) => (
                <div key={servicio.id} className="w-full max-w-sm sm:max-w-md">
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-md transition duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-xl">
                    {servicio.imagenUrl && (
                      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-zinc-800 bg-zinc-950">
                        <img
                          src={servicio.imagenUrl}
                          alt={servicio.nombre}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <h3 className="line-clamp-2 text-base font-bold text-white sm:text-lg">
                        {servicio.nombre}
                      </h3>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Precio
                          </p>
                          <p className="mt-0.5 text-lg font-extrabold sm:text-xl text-[#ED192D]">
                            ${Number(servicio.precio).toLocaleString("es-AR")}
                          </p>
                        </div>
                        {servicio.duracionMinutos && (
                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                              Duración
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-zinc-300">
                              {servicio.duracionMinutos} min
                            </p>
                          </div>
                        )}
                      </div>
                      <HorariosTarjetaServicio
                        slug={SLUG_EDDU}
                        servicioId={servicio.id}
                        colorPrincipal={colorPrincipal}
                      />
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. RESERVA ONLINE (FONDO BLANCO) */}
      <section id="reservar" className="scroll-mt-24 border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <ReservaFormEddu
            slug={SLUG_EDDU}
            servicios={servicios.map((servicio) => ({
              id: servicio.id,
              nombre: servicio.nombre,
              precio: servicio.precio,
              duracionMinutos: servicio.duracionMinutos,
            }))}
            colorPrincipal={colorPrincipal}
            configSena={empresa.senaConfig}
          />
        </div>
      </section>

      {/* 5. GALERÍA DE FOTOS (MÁS SOBRE LA BARBER) */}
      {galeria.length > 0 && (
        <section
          id="galeria"
          className="scroll-mt-24 bg-black py-16 sm:py-24 text-zinc-100 border-t border-zinc-900"
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 sm:mb-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1 text-[#ED192D]">
                  — MÁS SOBRE LA BARBER
                </p>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-white leading-snug">
                  {empresa.descripcion || "Marcando tu estilo con casi 10 años de experiencia 😎"}
                </h2>
              </div>
              {empresa.redesSociales?.instagram && (
                <a
                  href={normalizarUrlExterna(empresa.redesSociales.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white shrink-0"
                >
                  <FaInstagram className="h-4 w-4 text-[#ED192D]" />
                  Más en @
                  {empresa.redesSociales.instagram.replace(/.*instagram\.com\//, "").replace(/\//g, "")}
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
              <div className="lg:col-span-5 group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl aspect-[4/5] lg:aspect-auto lg:h-full">
                <img
                  src={galeria[0]}
                  alt="Eddu Barber foto principal"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                  loading="lazy"
                />
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:gap-6">
                {galeria.slice(1, 5).map((url, index) => (
                  <div
                    key={`galeria-eddu-sec-${index}`}
                    className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl aspect-square"
                  >
                    <img
                      src={url}
                      alt={`Eddu Barber foto ${index + 2}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* UBICACIÓN ABAJO DE MÁS SOBRE LA BARBER (FONDO BLANCO) */}
      {mapaEmbedUrl && (
        <section
          id="ubicacion"
          className="relative z-10 scroll-mt-24 bg-white text-slate-900 pt-12 sm:pt-16 pb-6 sm:pb-8"
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ED192D]">
                    — DÓNDE ESTAMOS
                  </p>
                  <h3 className="mt-1 text-base sm:text-lg font-extrabold text-slate-950">
                    {direccionFormateada.linea1 || direccionMapa}
                  </h3>
                  {direccionFormateada.linea2 && (
                    <p className="text-xs font-medium text-slate-600">
                      {direccionFormateada.linea2}
                    </p>
                  )}
                </div>

                {mapaAbrirUrl && (
                  <a
                    href={mapaAbrirUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:border-[#ED192D] hover:bg-red-50/50 hover:text-[#ED192D]"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#ED192D]" />
                    Abrir en Google Maps
                  </a>
                )}
              </div>

              <iframe
                src={mapaEmbedUrl}
                title={`Ubicación de ${nombre}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] sm:h-[360px] w-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* 6. TESTIMONIOS */}
      {testimonios.length > 0 && (
        <section id="testimonios" className="scroll-mt-24 border-t border-zinc-900 bg-zinc-950/60 py-16 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
            <div className="mb-10 sm:mb-14 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ED192D]">
                — OPINIONES
              </p>
              <h2 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
                Lo que dicen nuestros clientes
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonios.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg flex flex-col justify-between"
                >
                  <Quote className="h-6 w-6 text-[#ED192D] mb-4 opacity-80" />
                  <p className="text-sm text-zinc-300 italic mb-6 leading-relaxed">"{t.texto}"</p>
                  <div>
                    <p className="text-sm font-bold text-white">{t.nombre}</p>
                    {t.cargo && <p className="text-xs text-zinc-500">{t.cargo}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. PREGUNTAS FRECUENTES */}
      {preguntasFrecuentes.length > 0 && (
        <section id="preguntas" className="scroll-mt-24 border-t border-zinc-900 bg-black py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ED192D]">
                — DUDAS
              </p>
              <h2 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
                Preguntas frecuentes
              </h2>
            </div>
            <div className="space-y-4">
              {preguntasFrecuentes.map((pf, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#ED192D] shrink-0" />
                    {pf.pregunta}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 pl-6 leading-relaxed">
                    {pf.respuesta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. CONTACTO DIRECTO (RECONOCE EL SWITCH DEL PANEL) */}
      {mostrarContacto && (
        <section id="contacto" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-10 sm:px-10 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-[#ED192D33] bg-zinc-900/60 p-6 sm:p-10">
            <div className="relative grid gap-8 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#ED192D]">
                  Contacto directo
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  ¿Querés hacer una consulta?
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                  Dejanos tus datos y te responderemos a la brevedad por teléfono o correo electrónico.
                </p>
                <div className="mt-5 flex flex-row gap-3">
                  {whatsappUrl && (
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
                  {empresa.email && (
                    <a
                      href={`mailto:${empresa.email}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-900 active:scale-95"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Correo
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm sm:p-7">
                <ContactoForm slug={SLUG_EDDU} nombreNegocio={nombre} tema="oscuro" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. CTA RESERVÁ AHORA (FONDO BLANCO) */}
      <section className="relative bg-white py-20 sm:py-32 px-4 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="relative p-0 sm:p-4">
            <div className="relative z-10 space-y-6 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ED192D]">
                — RESERVÁ AHORA
              </p>
              <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight font-serif text-slate-950 leading-tight">
                ¿Listo para tu <span className="italic font-normal text-[#ED192D]">nuevo corte?</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Elegí tu estilo y horario en menos de un minuto. Corte, barba, buena música y la mejor atención te esperan.
              </p>

              <div className="pt-4 flex justify-start">
                <a
                  href="#reservar"
                  className="group relative inline-flex items-center gap-2 rounded-full bg-[#ED192D] px-9 py-4 text-xs sm:text-sm font-extrabold text-white tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(237,25,45,0.35)] hover:shadow-[0_15px_40px_rgba(237,25,45,0.5)]"
                >
                  <span className="absolute inset-0 rounded-full bg-[#ED192D] blur-md opacity-40 transition-all duration-300 group-hover:opacity-80 group-hover:blur-lg" />

                  <span className="relative z-10 flex items-center gap-2">
                    RESERVAR TURNO ONLINE
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER EDDU BARBER */}
      <footer className="bg-black text-zinc-400 border-t border-zinc-900 py-16 sm:py-20 w-full">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ED192D]" />
                <span className="text-sm font-extrabold tracking-[0.2em] text-white uppercase font-serif">
                  EDDU BARBER
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                {empresa.descripcion ||
                  "Marcando tu estilo con casi 10 años de experiencia. Más que una barbería, un estilo de vida."}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ED192D]">
                Navegación
              </p>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#inicio" className="transition hover:text-white">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#servicios" className="transition hover:text-white">
                    Servicios
                  </a>
                </li>
                <li>
                  <a href="#galeria" className="transition hover:text-white">
                    Galería
                  </a>
                </li>
                {mostrarContacto && (
                  <li>
                    <a href="#contacto" className="transition hover:text-white">
                      Contacto
                    </a>
                  </li>
                )}
                <li>
                  <a href="/eddubarber/terminos" className="transition hover:text-white">
                    Términos y Condiciones
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ED192D]">
                Servicios
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-500">
                {servicios.slice(0, 4).map((s) => (
                  <li key={`footer-s-${s.id}`} className="truncate">
                    {s.nombre}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ED192D]">
                Seguinos
              </p>
              <div className="flex items-center gap-3 pt-1">
                {empresa.redesSociales?.instagram && (
                  <a
                    href={normalizarUrlExterna(empresa.redesSociales.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-[#ED192D] hover:text-[#ED192D]"
                  >
                    <FaInstagram className="h-4 w-4" />
                  </a>
                )}
                {empresa.redesSociales?.tiktok && (
                  <a
                    href={normalizarUrlExterna(empresa.redesSociales.tiktok)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-[#ED192D] hover:text-[#ED192D]"
                  >
                    <FaTiktok className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-zinc-900/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
            <p>© {new Date().getFullYear()} Eddu Barber. Todos los derechos reservados.</p>
            <p>
              Página creada con <span className="text-zinc-400 font-semibold">NDI AI</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}