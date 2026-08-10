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
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { adminDb } from "@/lib/firebaseAdmin";
import { empresaTieneFuncion } from "@/lib/plans/planAccess";
import ReservaForm from "./ReservaForm";
import ContactoForm from "./ContactForm";
import PublicAnalytics from "./PublicAnalytics";
import CompartirPagina from "./CompartirPagina";
import PresupuestoFormulario from "./PresupuestoFormulario";

export const dynamic = "force-dynamic";

interface Empresa {
  nombre?: string;
  plan?: "free" | "pro" | "business";
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
    logoUrl?: string;
    portadaUrl?: string;
    galeria?: string[];
    mostrarWhatsApp?: boolean;
    mostrarEmail?: boolean;
    mostrarDireccion?: boolean;
    mostrarHorarios?: boolean;
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

  if (!pagina?.publicada) {
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

  if (!pagina?.publicada) {
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

  const servicios = catalogo.filter(
    (item) => item.tipo === "servicio",
  );

  const productos = catalogo.filter(
    (item) => item.tipo === "producto",
  );

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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <PublicAnalytics slug={slug} />
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo de ${nombre}`}
                className="h-11 w-11 rounded-2xl border border-white/10 bg-white object-cover"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                style={{
                  backgroundColor:
                    colorPrincipal,
                }}
              >
                <Globe2 className="h-5 w-5" />
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                {empresa.rubro ||
                  "Negocio"}
              </p>

              <p className="font-semibold">
                {nombre}
              </p>
            </div>
          </div>

          {mostrarWhatsApp && (
            <a
              href={whatsappUrl}
              data-analytics-event="whatsapp_click"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:inline-flex"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {portadaUrl ? (
          <>
            <img
              src={portadaUrl}
              alt={`Portada de ${nombre}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/65" />
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

        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
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
                    : "text-zinc-400"
                }`}
              >
                {subtitulo}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {mostrarWhatsApp && (
                <a
                  href={whatsappUrl}
                  data-analytics-event="whatsapp_click"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-500"
                >
                  <MessageCircle className="h-5 w-5" />
                  Hablar por WhatsApp
                </a>
              )}

              {mostrarEmail && (
                <a
                  href={`mailto:${empresa.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-black/25 px-6 py-3.5 font-semibold text-zinc-100 backdrop-blur transition hover:bg-black/40"
                >
                  <Mail className="h-5 w-5" />
                  Enviar correo
                </a>
              )}
            </div>

            <div className="mt-4">
              <CompartirPagina
                nombre={nombre}
              />
            </div>
          </div>
        </div>
      </section>

      {/* INFORMACIÓN */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
          {mostrarHorarios && (
            <InfoCard
              icono={
                <Clock3 className="h-5 w-5" />
              }
              titulo="Horarios"
              valor={empresa.horarios || ""}
              color={colorPrincipal}
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
            />
          )}
        </div>
      </section>

      {/* REDES SOCIALES */}
      {redesSociales.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
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

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
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
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900"
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
      {mostrarDireccion &&
        mapaEmbedUrl && (
          <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
              <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Ubicación
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    Cómo llegar
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    {direccionMapa}
                  </p>
                </div>

                <a
                  href={mapaAbrirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
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
      {servicios.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
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

            <p className="mt-4 leading-7 text-zinc-400">
              Conocé los servicios disponibles.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicios.map((servicio) => (
              <CatalogoCard
                key={servicio.id}
                item={servicio}
                color={colorPrincipal}
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
          <section className="border-y border-zinc-800 bg-zinc-900/40">
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
              />
            </div>
          </section>
        )}

      {/* PRODUCTOS */}
      {productos.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
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

            <p className="mt-4 leading-7 text-zinc-400">
              Productos disponibles en este negocio.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => (
              <CatalogoCard
                key={producto.id}
                item={producto}
                color={colorPrincipal}
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
        <section className="border-y border-zinc-800 bg-zinc-900/40">
          <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
            <PresupuestoFormulario
              slug={slug}
              items={catalogo.map(
                (item) => ({
                  id: item.id,
                  nombre: item.nombre,
                  tipo: item.tipo,
                }),
              )}
            />
          </div>
        </section>
      )}

      {/* GALERÍA */}
      {galeria.length > 0 && (
        <section className="border-y border-zinc-800 bg-zinc-900/40">
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

              <p className="mt-4 leading-7 text-zinc-400">
                Conocé un poco más sobre {empresa.nombre || nombre}.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galeria.map((url, indice) => (
                <div
                  key={`${url}-${indice}`}
                  className="group aspect-[4/3] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900"
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
        <section className="border-y border-zinc-800 bg-zinc-900/40">
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

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
                <p className="whitespace-pre-line leading-8 text-zinc-300">
                  {empresa.descripcion}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CONTACTO */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-12"
          style={{
            borderColor: `${colorPrincipal}44`,
            background: `linear-gradient(135deg, ${colorPrincipal}18, rgba(24,24,27,0.8))`,
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

              <p className="mt-4 max-w-xl leading-7 text-zinc-400">
                Dejanos tus datos y tu consulta.{" "}
                {empresa.nombre || nombre} podrá responderte usando
                el teléfono o email que indiques.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                {mostrarWhatsApp && (
                  <a
                    href={whatsappUrl}
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/50 px-6 py-3.5 font-semibold text-white transition hover:bg-zinc-900"
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/50 px-6 py-3.5 font-semibold text-white transition hover:bg-zinc-900"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Sitio web
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-7">
              <ContactoForm
                slug={slug}
                nombreNegocio={empresa.nombre || nombre}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ASISTENTE IA REAL */}
      {puedeUsarAsistenteIA && (
        <Script
          src="/widget.js"
          data-empresa-id={documento.id}
          strategy="afterInteractive"
        />
      )}

      {/* FOOTER */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-medium text-zinc-300">
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
              <span className="font-medium text-zinc-300">
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
  icono,
}: {
  item: CatalogoItem;
  color: string;
  icono: React.ReactNode;
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
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
        <p className="mt-3 flex-1 leading-7 text-zinc-400">
          {item.descripcion}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-zinc-800 pt-5">
        <div>
          {Boolean(item.precio) && (
            <>
              <p className="text-xs uppercase tracking-wide text-zinc-600">
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
              <p className="text-xs uppercase tracking-wide text-zinc-600">
                Duración
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-300">
                {item.duracionMinutos} min
              </p>
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
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
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

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600">
        {titulo}
      </p>

      <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-zinc-200">
        {valor}
      </p>
    </div>
  );
}