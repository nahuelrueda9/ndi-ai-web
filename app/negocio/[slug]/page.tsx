import {
  Box,
  Clock3,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
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
import ContactoForm from "./ContactForm";
import PublicAnalytics from "./PublicAnalytics";
import CompartirPagina from "./CompartirPagina";
import PresupuestoFormulario from "./PresupuestoFormulario";

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
  sitioWeb?: string;

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
    colorPrincipal?: string;
    tema?: "oscuro" | "claro";
    logoUrl?: string;
    portadaUrl?: string;
    galeria?: string[];
    mostrarWhatsApp?: boolean;
    mostrarEmail?: boolean;
    mostrarDireccion?: boolean;
    mostrarHorarios?: boolean;

    mostrarServicios?: boolean;
    mostrarProductos?: boolean;
    mostrarGaleria?: boolean;
    mostrarMapa?: boolean;
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

interface CatalogoItem {
  id: string;
  tipo: "servicio" | "producto";
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracionMinutos?: number;
  imagenUrl?: string;
  activo?: boolean;
}

function normalizarUrlExterna(
  valor?: string,
) {
  const limpio =
    valor?.trim() || "";

  if (!limpio) {
    return "";
  }

  const candidato =
    /^https?:\/\//i.test(limpio)
      ? limpio
      : `https://${limpio}`;

  try {
    const url =
      new URL(candidato);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const empresasSnapshot = await adminDb
    .collection("companies")
    .where(
      "paginaPublica.slug",
      "==",
      slug,
    )
    .limit(2)
    .get();

  if (empresasSnapshot.size !== 1) {
    return {
      title: "Negocio no encontrado | NDI AI",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const empresa =
    empresasSnapshot.docs[0].data() as Empresa;

  const pagina =
    empresa.paginaPublica;

  if (
    !pagina?.publicada ||
    !empresaTieneSuscripcionActiva(
      empresa,
    ) ||
    !empresaTieneFuncion(
      empresa,
      "pagina_publica",
    )
  ) {
    return {
      title: "Página no disponible | NDI AI",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const nombre =
    pagina.titulo?.trim() ||
    empresa.nombre?.trim() ||
    "Negocio";

  const descripcion =
    pagina.subtitulo?.trim() ||
    empresa.descripcion?.trim() ||
    `Conocé ${nombre}, sus servicios, horarios y formas de contacto.`;

  const imagenSocial =
    pagina.portadaUrl?.trim() ||
    pagina.logoUrl?.trim() ||
    "";

  return {
    title: `${nombre} | NDI AI`,
    description: descripcion.slice(
      0,
      160,
    ),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: nombre,
      description:
        descripcion.slice(0, 160),
      type: "website",
      locale: "es_AR",
      ...(imagenSocial
        ? {
            images: [
              {
                url: imagenSocial,
                alt: nombre,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card:
        imagenSocial
          ? "summary_large_image"
          : "summary",
      title: nombre,
      description:
        descripcion.slice(0, 160),
      ...(imagenSocial
        ? {
            images: [imagenSocial],
          }
        : {}),
    },
  };
}

export default async function NegocioPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const empresasSnapshot = await adminDb
    .collection("companies")
    .where("paginaPublica.slug", "==", slug)
    .limit(2)
    .get();

  if (empresasSnapshot.size !== 1) {
    notFound();
  }

  const documento = empresasSnapshot.docs[0];

  const empresa =
    documento.data() as Empresa;

  const pagina = empresa.paginaPublica;

  if (
    !pagina?.publicada ||
    !empresaTieneSuscripcionActiva(
      empresa,
    ) ||
    !empresaTieneFuncion(
      empresa,
      "pagina_publica",
    )
  ) {
    notFound();
  }

  const catalogoSnapshot = await adminDb
    .collection("companies")
    .doc(documento.id)
    .collection("catalog")
    .get();

  const catalogo: CatalogoItem[] =
    catalogoSnapshot.docs
      .map((docCatalogo) => ({
        id: docCatalogo.id,
        ...(docCatalogo.data() as Omit<
          CatalogoItem,
          "id"
        >),
      }))
      .filter(
        (item) => item.activo !== false,
      );

  const puedeUsarProductos =
    empresaTieneFuncion(
      empresa,
      "productos",
    );

  const puedeUsarQr =
    empresaTieneFuncion(
      empresa,
      "qr",
    );

  /*
   * Página Completa y Business IA son los planes que incluyen
   * catálogo ampliado / más secciones. "productos" funciona acá
   * como capacidad del nivel Completa o superior, sin depender
   * directamente del id técnico del plan.
   */
  const puedeUsarSeccionesAmpliadas =
    puedeUsarProductos;

  const servicios = catalogo.filter(
    (item) => item.tipo === "servicio",
  );

  const productos =
    puedeUsarProductos
      ? catalogo.filter(
          (item) =>
            item.tipo === "producto",
        )
      : [];

  const catalogoPermitido =
    puedeUsarProductos
      ? catalogo
      : servicios;

  const nombre =
    pagina.titulo ||
    empresa.nombre ||
    "Negocio";

  const subtitulo =
    pagina.subtitulo ||
    empresa.descripcion ||
    "";

  const colorPrincipal =
    pagina.colorPrincipal ||
    "#2563eb";

  const logoUrl =
    pagina.logoUrl?.trim() || "";

  const portadaUrl =
    pagina.portadaUrl?.trim() || "";

  const galeria =
    Array.isArray(pagina.galeria)
      ? pagina.galeria
          .filter(
            (url): url is string =>
              typeof url === "string" &&
              url.trim().length > 0,
          )
          .slice(0, 6)
      : [];

  const telefonoLimpio =
    empresa.telefono?.replace(
      /\D/g,
      "",
    ) || "";

  const whatsappUrl =
    telefonoLimpio
      ? `https://wa.me/${telefonoLimpio}`
      : "";

  const mostrarWhatsApp =
    pagina.mostrarWhatsApp !== false &&
    Boolean(telefonoLimpio);

  const mostrarEmail =
    pagina.mostrarEmail !== false &&
    Boolean(empresa.email);

  const mostrarDireccion =
    pagina.mostrarDireccion !== false &&
    Boolean(empresa.direccion);

  const mostrarHorarios =
    pagina.mostrarHorarios !== false &&
    Boolean(empresa.horarios);

  const mostrarServicios =
    pagina.mostrarServicios !== false;

  const mostrarProductos =
    puedeUsarProductos &&
    pagina.mostrarProductos !== false;

  const mostrarGaleria =
    puedeUsarSeccionesAmpliadas &&
    pagina.mostrarGaleria !== false;

  const mostrarMapa =
    pagina.mostrarMapa !== false;

  const mostrarContacto =
    pagina.mostrarContacto !== false;

  const direccionMapa =
    empresa.direccion?.trim() || "";

  const mapaEmbedUrl =
    direccionMapa
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          direccionMapa,
        )}&output=embed`
      : "";

  const mapaAbrirUrl =
    direccionMapa
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          direccionMapa,
        )}`
      : "";

  const redesSociales = [
    {
      nombre: "Instagram",
      url: normalizarUrlExterna(
        empresa.redesSociales?.instagram,
      ),
    },
    {
      nombre: "Facebook",
      url: normalizarUrlExterna(
        empresa.redesSociales?.facebook,
      ),
    },
    {
      nombre: "TikTok",
      url: normalizarUrlExterna(
        empresa.redesSociales?.tiktok,
      ),
    },
  ].filter(
    (
      red,
    ): red is {
      nombre: string;
      url: string;
    } => Boolean(red.url),
  );

  const testimonios =
    puedeUsarSeccionesAmpliadas &&
    Array.isArray(pagina.testimonios)
      ? pagina.testimonios
          .filter(
            (
              item,
            ): item is TestimonioPagina =>
              Boolean(
                item &&
                  typeof item.nombre ===
                    "string" &&
                  typeof item.texto ===
                    "string" &&
                  item.nombre.trim() &&
                  item.texto.trim(),
              ),
          )
          .map((item) => ({
            nombre:
              item.nombre.trim(),
            cargo:
              item.cargo?.trim() || "",
            texto:
              item.texto.trim(),
          }))
          .slice(0, 6)
      : [];

  const preguntasFrecuentes =
    puedeUsarSeccionesAmpliadas &&
    Array.isArray(
      pagina.preguntasFrecuentes,
    )
      ? pagina.preguntasFrecuentes
          .filter(
            (
              item,
            ): item is PreguntaFrecuentePagina =>
              Boolean(
                item &&
                  typeof item.pregunta ===
                    "string" &&
                  typeof item.respuesta ===
                    "string" &&
                  item.pregunta.trim() &&
                  item.respuesta.trim(),
              ),
          )
          .map((item) => ({
            pregunta:
              item.pregunta.trim(),
            respuesta:
              item.respuesta.trim(),
          }))
          .slice(0, 8)
      : [];

  const puedeUsarTurnos =
    empresaTieneFuncion(
      empresa,
      "turnos",
    );

  const puedeUsarPresupuestos =
    empresaTieneFuncion(
      empresa,
      "presupuestos",
    );

  const puedeUsarAsistenteIA =
    empresaTieneFuncion(
      empresa,
      "asistente_ia",
    );

  const sinMarcaNDI =
    empresaTieneFuncion(
      empresa,
      "sin_marca_ndi",
    );

  const esClaro =
    pagina.tema === "claro";

  const claseTextoSecundario =
    esClaro
      ? "text-slate-600"
      : "text-zinc-400";

  const claseSeccionAlterna =
    esClaro
      ? "border-slate-200 bg-slate-50"
      : "border-zinc-800 bg-zinc-900/40";

  return (
    <main
      className={`min-h-screen scroll-smooth pb-20 sm:pb-0 ${
        esClaro
          ? "bg-white text-slate-950"
          : "bg-zinc-950 text-white"
      }`}
    >
      <PublicAnalytics slug={slug} />
      {/* HEADER */}
      <header
        className={`sticky top-0 z-50 border-b shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl ${
          esClaro
            ? "border-slate-200 bg-white/90"
            : "border-white/10 bg-zinc-950/80"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-3.5 sm:px-8">
          <a
            href="#inicio"
            className="flex min-w-0 items-center gap-3"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo de ${nombre}`}
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white object-cover shadow-lg"
              />
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  backgroundColor:
                    colorPrincipal,
                }}
              >
                <Globe2 className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0">
              <p
                className={`truncate text-[11px] uppercase tracking-[0.18em] ${
                  esClaro
                    ? "text-slate-500"
                    : "text-zinc-500"
                }`}
              >
                {empresa.rubro ||
                  "Negocio"}
              </p>

              <p className="truncate font-semibold">
                {nombre}
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {mostrarServicios && servicios.length > 0 && (
              <a
                href="#servicios"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  esClaro
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Servicios
              </a>
            )}

            {mostrarProductos && productos.length > 0 && (
              <a
                href="#productos"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  esClaro
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Productos
              </a>
            )}

            {mostrarGaleria && galeria.length > 0 && (
              <a
                href="#galeria"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  esClaro
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Galería
              </a>
            )}

            {testimonios.length > 0 && (
              <a
                href="#testimonios"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  esClaro
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Opiniones
              </a>
            )}

            {preguntasFrecuentes.length > 0 && (
              <a
                href="#preguntas"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  esClaro
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Preguntas
              </a>
            )}

            {mostrarContacto && (
              <a
                href="#contacto"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  esClaro
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Contacto
              </a>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {puedeUsarTurnos &&
              servicios.length > 0 && (
                <a
                  href="#reservar"
                  className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 md:inline-flex"
                  style={{
                    backgroundColor:
                      colorPrincipal,
                  }}
                >
                  <Clock3 className="h-4 w-4" />
                  Reservar
                </a>
              )}

            {mostrarWhatsApp && (
              <a
                href={whatsappUrl}
                data-analytics-event="whatsapp_click"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 sm:inline-flex"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="inicio"
        className={`relative flex min-h-[68vh] scroll-mt-24 items-center overflow-hidden ${
          portadaUrl ? "text-white" : ""
        }`}
      >
        {portadaUrl ? (
          <>
            <img
              src={portadaUrl}
              alt={`Portada de ${nombre}`}
              className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(135deg, ${colorPrincipal}55, transparent 65%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at top, ${colorPrincipal}, transparent 65%)`,
            }}
          />
        )}

        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`Logo de ${nombre}`}
                  className="h-20 w-20 rounded-3xl border border-white/15 bg-white object-cover shadow-2xl"
                />
              )}

              {empresa.rubro && (
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm backdrop-blur"
                  style={{
                    borderColor: `${colorPrincipal}77`,
                    backgroundColor: `${colorPrincipal}25`,
                    color: portadaUrl
                      ? "#ffffff"
                      : colorPrincipal,
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  {empresa.rubro}
                </div>
              )}
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {nombre}
            </h1>

            {subtitulo && (
              <p
                className={`mt-6 max-w-2xl text-base leading-8 sm:text-lg ${
                  portadaUrl
                    ? "text-zinc-200"
                    : esClaro
                      ? "text-slate-600"
                      : "text-zinc-400"
                }`}
              >
                {subtitulo}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {puedeUsarTurnos &&
                servicios.length > 0 && (
                  <a
                    href="#reservar"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:brightness-110"
                    style={{
                      backgroundColor:
                        colorPrincipal,
                    }}
                  >
                    <Clock3 className="h-5 w-5" />
                    Reservar turno
                  </a>
                )}

              {mostrarWhatsApp && (
                <a
                  href={whatsappUrl}
                  data-analytics-event="whatsapp_click"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-500"
                >
                  <MessageCircle className="h-5 w-5" />
                  Hablar por WhatsApp
                </a>
              )}

              {!puedeUsarTurnos &&
                mostrarServicios &&
                servicios.length > 0 && (
                  <a
                    href="#servicios"
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold backdrop-blur transition ${
                      portadaUrl || !esClaro
                        ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                        : "border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    Ver servicios
                  </a>
                )}

              {!mostrarWhatsApp &&
                mostrarEmail && (
                  <a
                    href={`mailto:${empresa.email}`}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold backdrop-blur transition ${
                      portadaUrl || !esClaro
                        ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                        : "border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <Mail className="h-5 w-5" />
                    Enviar correo
                  </a>
                )}
            </div>

            {puedeUsarQr && (
              <div className="mt-4">
                <CompartirPagina
                  nombre={nombre}
                  tema={
                    esClaro
                      ? "claro"
                      : "oscuro"
                  }
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INFORMACIÓN */}
      <section className="relative z-10 -mt-7">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-10 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
          {mostrarHorarios && (
            <InfoCard
              icono={
                <Clock3 className="h-5 w-5" />
              }
              titulo="Horarios"
              valor={empresa.horarios || ""}
              color={colorPrincipal}
              claro={esClaro}
            />
          )}

          {mostrarDireccion && (
            <InfoCard
              icono={
                <MapPin className="h-5 w-5" />
              }
              titulo="Ubicación"
              valor={empresa.direccion || ""}
              color={colorPrincipal}
              claro={esClaro}
            />
          )}

          {mostrarWhatsApp && (
            <InfoCard
              icono={
                <Phone className="h-5 w-5" />
              }
              titulo="Teléfono"
              valor={empresa.telefono || ""}
              color={colorPrincipal}
              claro={esClaro}
            />
          )}

          {mostrarEmail && (
            <InfoCard
              icono={
                <Mail className="h-5 w-5" />
              }
              titulo="Correo"
              valor={empresa.email || ""}
              color={colorPrincipal}
              claro={esClaro}
            />
          )}
        </div>
      </section>

      {/* REDES SOCIALES */}
      {redesSociales.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
          <div
            className={`rounded-3xl border p-6 sm:p-8 ${
              esClaro
                ? "border-slate-200 bg-slate-50"
                : "border-zinc-800 bg-zinc-900/70"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color: colorPrincipal,
                  }}
                >
                  Redes sociales
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Seguinos también acá
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {redesSociales.map(
                  (red) => (
                    <a
                      key={red.nombre}
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        esClaro
                          ? "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                          : "border-zinc-700 bg-zinc-950 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900"
                      }`}
                    >
                      <Globe2 className="h-4 w-4" />
                      {red.nombre}
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                    </a>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAPA */}
      {mostrarMapa &&
        mostrarDireccion &&
        mapaEmbedUrl && (
          <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
            <div
              className={`overflow-hidden rounded-3xl border ${
                esClaro
                  ? "border-slate-200 bg-white shadow-sm"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <div
                className={`flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between ${
                  esClaro
                    ? "border-slate-200"
                    : "border-zinc-800"
                }`}
              >
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                      esClaro
                        ? "text-slate-500"
                        : "text-zinc-500"
                    }`}
                  >
                    Ubicación
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Cómo llegar
                  </h2>

                  <p className={`mt-1 text-sm ${claseTextoSecundario}`}>
                    {direccionMapa}
                  </p>
                </div>

                <a
                  href={mapaAbrirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    esClaro
                      ? "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200"
                      : "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
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
                className="h-[320px] w-full border-0"
                allowFullScreen
              />
            </div>
          </section>
        )}

      {/* SERVICIOS */}
      {mostrarServicios &&
        servicios.length > 0 && (
        <section id="servicios" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <p
              className="text-sm font-medium"
              style={{
                color: colorPrincipal,
              }}
            >
              Lo que ofrecemos
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Servicios
            </h2>

            <p className={`mt-4 leading-7 ${claseTextoSecundario}`}>
              Conocé los servicios disponibles.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicios.map((servicio) => (
              <CatalogoCard
                key={servicio.id}
                item={servicio}
                color={colorPrincipal}
                claro={esClaro}
                puedeReservar={
                  puedeUsarTurnos
                }
                mostrarWhatsApp={
                  mostrarWhatsApp
                }
                whatsappUrl={
                  whatsappUrl
                }
                mostrarContacto={
                  mostrarContacto
                }
                icono={
                  <Package className="h-5 w-5" />
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* RESERVA ONLINE */}
      {puedeUsarTurnos &&
        servicios.length > 0 && (
          <section
            id="reservar"
            className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}
          >
            <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
              <ReservaForm
                slug={slug}
                servicios={servicios.map(
                  (servicio) => ({
                    id: servicio.id,
                    nombre: servicio.nombre,
                    precio:
                      servicio.precio,
                    duracionMinutos:
                      servicio.duracionMinutos,
                  }),
                )}
                colorPrincipal={
                  colorPrincipal
                }
                tema={
                  esClaro
                    ? "claro"
                    : "oscuro"
                }
              />
            </div>
          </section>
        )}

      {/* PRODUCTOS */}
      {mostrarProductos &&
        productos.length > 0 && (
        <section id="productos" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <p
              className="text-sm font-medium"
              style={{
                color: colorPrincipal,
              }}
            >
              Catálogo
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Productos
            </h2>

            <p className={`mt-4 leading-7 ${claseTextoSecundario}`}>
              Productos disponibles en este negocio.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => (
              <CatalogoCard
                key={producto.id}
                item={producto}
                color={colorPrincipal}
                claro={esClaro}
                puedeReservar={false}
                mostrarWhatsApp={
                  mostrarWhatsApp
                }
                whatsappUrl={
                  whatsappUrl
                }
                mostrarContacto={
                  mostrarContacto
                }
                icono={
                  <Box className="h-5 w-5" />
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* PRESUPUESTO */}
      {puedeUsarPresupuestos && (
        <section
            id="presupuesto"
            className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}
          >
          <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
            <PresupuestoFormulario
              slug={slug}
              items={catalogoPermitido.map(
                (item) => ({
                  id: item.id,
                  nombre: item.nombre,
                  tipo: item.tipo,
                }),
              )}
              tema={
                esClaro
                  ? "claro"
                  : "oscuro"
              }
            />
          </div>
        </section>
      )}

      {/* GALERÍA */}
      {mostrarGaleria &&
        galeria.length > 0 && (
        <section
            id="galeria"
            className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}
          >
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="max-w-2xl">
              <p
                className="text-sm font-medium"
                style={{
                  color: colorPrincipal,
                }}
              >
                Imágenes
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Galería
              </h2>

              <p className={`mt-4 leading-7 ${claseTextoSecundario}`}>
                Conocé un poco más sobre {empresa.nombre || nombre}.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galeria.map((url, indice) => (
                <div
                  key={`${url}-${indice}`}
                  className={`group aspect-[4/3] overflow-hidden rounded-3xl border ${
                    esClaro
                      ? "border-slate-200 bg-slate-100"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${nombre} - imagen ${indice + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SOBRE EL NEGOCIO */}
      {empresa.descripcion && (
        <section
            id="nosotros"
            className={`scroll-mt-24 border-y ${claseSeccionAlterna}`}
          >
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      colorPrincipal,
                  }}
                >
                  Sobre nosotros
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Conocé más sobre{" "}
                  {empresa.nombre ||
                    nombre}
                </h2>
              </div>

              <div
                className={`rounded-3xl border p-7 ${
                  esClaro
                    ? "border-slate-200 bg-white shadow-sm"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <p
                  className={`whitespace-pre-line leading-8 ${
                    esClaro
                      ? "text-slate-700"
                      : "text-zinc-300"
                  }`}
                >
                  {empresa.descripcion}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIOS */}
      {testimonios.length > 0 && (
        <section
          id="testimonios"
          className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="text-sm font-medium"
              style={{
                color: colorPrincipal,
              }}
            >
              Opiniones
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Lo que dicen nuestros clientes
            </h2>

            <p
              className={`mt-4 leading-7 ${claseTextoSecundario}`}
            >
              Experiencias compartidas por personas que ya eligieron{" "}
              {empresa.nombre || nombre}.
            </p>
          </div>

          <div
            className={`mt-10 grid gap-5 ${
              testimonios.length === 1
                ? "mx-auto max-w-2xl"
                : testimonios.length === 2
                  ? "mx-auto max-w-4xl md:grid-cols-2"
                  : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {testimonios.map(
              (
                testimonio,
                index,
              ) => (
                <article
                  key={`${testimonio.nombre}-${index}`}
                  className={`relative flex h-full flex-col rounded-3xl border p-6 shadow-[0_18px_45px_rgba(0,0,0,0.08)] ${
                    esClaro
                      ? "border-slate-200 bg-white"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                    style={{
                      backgroundColor:
                        colorPrincipal,
                    }}
                  >
                    <Quote className="h-5 w-5" />
                  </div>

                  <p
                    className={`mt-6 flex-1 whitespace-pre-line leading-7 ${
                      esClaro
                        ? "text-slate-700"
                        : "text-zinc-300"
                    }`}
                  >
                    “{testimonio.texto}”
                  </p>

                  <div
                    className={`mt-6 border-t pt-5 ${
                      esClaro
                        ? "border-slate-200"
                        : "border-zinc-800"
                    }`}
                  >
                    <p className="font-semibold">
                      {testimonio.nombre}
                    </p>

                    {testimonio.cargo && (
                      <p
                        className={`mt-1 text-sm ${claseTextoSecundario}`}
                      >
                        {testimonio.cargo}
                      </p>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}

      {/* PREGUNTAS FRECUENTES */}
      {preguntasFrecuentes.length > 0 && (
        <section
          id="preguntas"
          className={`scroll-mt-24 border-y py-20 ${
            esClaro
              ? "border-slate-200 bg-slate-50"
              : "border-zinc-800 bg-zinc-900/40"
          }`}
        >
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <p
                className="text-sm font-medium"
                style={{
                  color: colorPrincipal,
                }}
              >
                Preguntas frecuentes
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Resolvemos las dudas más comunes
              </h2>

              <p
                className={`mx-auto mt-4 max-w-2xl leading-7 ${claseTextoSecundario}`}
              >
                Encontrá rápidamente información útil antes de contactarnos.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {preguntasFrecuentes.map(
                (
                  item,
                  index,
                ) => (
                  <details
                    key={`${item.pregunta}-${index}`}
                    className={`group overflow-hidden rounded-2xl border transition ${
                      esClaro
                        ? "border-slate-200 bg-white"
                        : "border-zinc-800 bg-zinc-950/70"
                    }`}
                  >
                    <summary
                      className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-semibold ${
                        esClaro
                          ? "text-slate-900"
                          : "text-white"
                      }`}
                    >
                      <span>
                        {item.pregunta}
                      </span>

                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition group-open:rotate-45 ${
                          esClaro
                            ? "border-slate-200 bg-slate-50 text-slate-600"
                            : "border-zinc-700 bg-zinc-900 text-zinc-300"
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </summary>

                    <div
                      className={`border-t px-5 py-5 ${
                        esClaro
                          ? "border-slate-200"
                          : "border-zinc-800"
                      }`}
                    >
                      <p
                        className={`whitespace-pre-line leading-7 ${
                          esClaro
                            ? "text-slate-600"
                            : "text-zinc-400"
                        }`}
                      >
                        {item.respuesta}
                      </p>
                    </div>
                  </details>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* CONTACTO */}
      {mostrarContacto && (
      <section id="contacto" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
        <div
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-12"
          style={{
            borderColor: `${colorPrincipal}44`,
            background: esClaro
              ? `linear-gradient(135deg, ${colorPrincipal}12, rgba(248,250,252,0.98))`
              : `linear-gradient(135deg, ${colorPrincipal}18, rgba(24,24,27,0.8))`,
          }}
        >
          <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p
                className="text-sm font-medium"
                style={{
                  color: colorPrincipal,
                }}
              >
                Contacto
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Querés consultar algo?
              </h2>

              <p className={`mt-4 max-w-xl leading-7 ${claseTextoSecundario}`}>
                Dejanos tus datos y tu consulta.{" "}
                {empresa.nombre || nombre} podrá responderte usando
                el teléfono o email que indiques.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                {mostrarWhatsApp && (
                  <a
                    href={whatsappUrl}
                    data-analytics-event="whatsapp_click"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                )}

                {mostrarEmail && (
                  <a
                    href={`mailto:${empresa.email}`}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold transition ${
                      esClaro
                        ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                        : "border-zinc-700 bg-zinc-950/50 text-white hover:bg-zinc-900"
                    }`}
                  >
                    <Mail className="h-5 w-5" />
                    Correo
                  </a>
                )}

                {empresa.sitioWeb && (
                  <a
                    href={empresa.sitioWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold transition ${
                      esClaro
                        ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                        : "border-zinc-700 bg-zinc-950/50 text-white hover:bg-zinc-900"
                    }`}
                  >
                    <ExternalLink className="h-5 w-5" />
                    Sitio web
                  </a>
                )}
              </div>
            </div>

            <div
              className={`rounded-3xl border p-5 sm:p-7 ${
                esClaro
                  ? "border-slate-200 bg-white shadow-sm"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              <ContactoForm
                slug={slug}
                nombreNegocio={empresa.nombre || nombre}
                tema={
                  esClaro
                    ? "claro"
                    : "oscuro"
                }
              />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* CTA MÓVIL FIJO */}
      {(puedeUsarTurnos &&
        servicios.length > 0) ||
      mostrarContacto ||
      mostrarWhatsApp ? (
        <div
          className={`fixed inset-x-0 bottom-0 z-50 border-t p-3 backdrop-blur-xl sm:hidden ${
            esClaro
              ? "border-slate-200 bg-white/95"
              : "border-white/10 bg-zinc-950/90"
          }`}
        >
          <div className="mx-auto flex max-w-md gap-2">
            {(puedeUsarTurnos &&
              servicios.length > 0) ||
            mostrarContacto ? (
              <a
                href={
                  puedeUsarTurnos &&
                  servicios.length > 0
                    ? "#reservar"
                    : "#contacto"
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg"
                style={{
                  backgroundColor:
                    colorPrincipal,
                }}
              >
                {puedeUsarTurnos &&
                servicios.length > 0 ? (
                  <>
                    <Clock3 className="h-4 w-4" />
                    Reservar
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Consultar
                  </>
                )}
              </a>
            ) : null}

            {mostrarWhatsApp && (
              <a
                href={whatsappUrl}
                data-analytics-event="whatsapp_click"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir WhatsApp"
                className={`inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-500 ${
                  (puedeUsarTurnos &&
                    servicios.length > 0) ||
                  mostrarContacto
                    ? "w-12 shrink-0"
                    : "flex-1 gap-2 px-4"
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                {!(
                  (puedeUsarTurnos &&
                    servicios.length > 0) ||
                  mostrarContacto
                ) && (
                  <span className="text-sm font-semibold">
                    WhatsApp
                  </span>
                )}
              </a>
            )}
          </div>
        </div>
      ) : null}

      {/* ASISTENTE IA REAL */}
      {puedeUsarAsistenteIA && (
        <Script
          src="/widget.js"
          data-empresa-id={documento.id}
          strategy="afterInteractive"
        />
      )}

      {/* FOOTER */}
      <footer
        className={`border-t ${
          esClaro
            ? "border-slate-200"
            : "border-zinc-800"
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 ${
            esClaro
              ? "text-slate-500"
              : "text-zinc-500"
          }`}
        >
          <div>
            <p
              className={`font-medium ${
                esClaro
                  ? "text-slate-800"
                  : "text-zinc-300"
              }`}
            >
              {empresa.nombre ||
                nombre}
            </p>

            {empresa.rubro && (
              <p className="mt-1">
                {empresa.rubro}
              </p>
            )}
          </div>

          {!sinMarcaNDI && (
            <p>
              Página creada con{" "}
              <span
                className={`font-medium ${
                  esClaro
                    ? "text-slate-800"
                    : "text-zinc-300"
                }`}
              >
                NDI AI
              </span>
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
  claro,
  puedeReservar,
  mostrarWhatsApp,
  whatsappUrl,
  mostrarContacto,
  icono,
}: {
  item: CatalogoItem;
  color: string;
  claro: boolean;
  puedeReservar: boolean;
  mostrarWhatsApp: boolean;
  whatsappUrl: string;
  mostrarContacto: boolean;
  icono: React.ReactNode;
}) {
  const mensajeWhatsApp =
    `Hola, quiero consultar por ${item.tipo === "servicio" ? "el servicio" : "el producto"} "${item.nombre}".`;

  const whatsappItemUrl =
    mostrarWhatsApp &&
    whatsappUrl
      ? `${whatsappUrl}?text=${encodeURIComponent(
          mensajeWhatsApp,
        )}`
      : "";
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border shadow-[0_18px_50px_rgba(0,0,0,0.10)] transition duration-300 hover:-translate-y-1 ${
        claro
          ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/90"
      }`}
    >
      {item.imagenUrl && (
        <div
          className={`aspect-[16/10] overflow-hidden border-b ${
            claro
              ? "border-slate-200 bg-slate-100"
              : "border-zinc-800 bg-zinc-950"
          }`}
        >
          <img
            src={item.imagenUrl}
            alt={item.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            backgroundColor:
              `${color}18`,
            color,
          }}
        >
          {icono}
        </div>

        <h3 className="mt-5 text-xl font-semibold">
          {item.nombre}
        </h3>

        {item.descripcion && (
          <p
            className={`mt-3 flex-1 leading-7 ${
              claro
                ? "text-slate-600"
                : "text-zinc-400"
            }`}
          >
            {item.descripcion}
          </p>
        )}

        <div
          className={`mt-6 flex flex-wrap items-end justify-between gap-3 border-t pt-5 ${
            claro
              ? "border-slate-200"
              : "border-zinc-800"
          }`}
        >
          <div>
            {Boolean(item.precio) && (
              <>
                <p
                  className={`text-xs uppercase tracking-wide ${
                    claro
                      ? "text-slate-400"
                      : "text-zinc-600"
                  }`}
                >
                  Precio
                </p>

                <p
                  className="mt-1 text-xl font-bold"
                  style={{
                    color,
                  }}
                >
                  $
                  {Number(
                    item.precio,
                  ).toLocaleString(
                    "es-AR",
                  )}
                </p>
              </>
            )}
          </div>

          {item.tipo === "servicio" &&
            Boolean(
              item.duracionMinutos,
            ) && (
              <div className="text-right">
                <p
                  className={`text-xs uppercase tracking-wide ${
                    claro
                      ? "text-slate-400"
                      : "text-zinc-600"
                  }`}
                >
                  Duración
                </p>

                <p
                  className={`mt-1 text-sm font-medium ${
                    claro
                      ? "text-slate-700"
                      : "text-zinc-300"
                  }`}
                >
                  {item.duracionMinutos} min
                </p>
              </div>
            )}
        </div>

        {(puedeReservar ||
          whatsappItemUrl ||
          mostrarContacto) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {puedeReservar && (
              <a
                href={`#reservar-servicio-${encodeURIComponent(
                  item.id,
                )}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{
                  backgroundColor:
                    color,
                }}
              >
                <Clock3 className="h-4 w-4" />
                Reservar
              </a>
            )}

            {!puedeReservar &&
              whatsappItemUrl && (
                <a
                  href={
                    whatsappItemUrl
                  }
                  data-analytics-event="whatsapp_click"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar
                </a>
              )}

            {!puedeReservar &&
              !whatsappItemUrl &&
              mostrarContacto && (
                <a
                  href="#contacto"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{
                    backgroundColor:
                      color,
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Consultar
                </a>
              )}
          </div>
        )}
      </div>
    </article>
  );
}

function InfoCard({
  icono,
  titulo,
  valor,
  color,
  claro,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  color: string;
  claro: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-[0_14px_35px_rgba(0,0,0,0.12)] backdrop-blur ${
        claro
          ? "border-slate-200 bg-white/95"
          : "border-white/10 bg-zinc-950/90"
      }`}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor:
            `${color}18`,
          color,
        }}
      >
        {icono}
      </div>

      <p
        className={`mt-4 text-xs font-medium uppercase tracking-[0.14em] ${
          claro
            ? "text-slate-400"
            : "text-zinc-600"
        }`}
      >
        {titulo}
      </p>

      <p
        className={`mt-2 whitespace-pre-line break-words text-sm leading-6 ${
          claro
            ? "text-slate-700"
            : "text-zinc-200"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}