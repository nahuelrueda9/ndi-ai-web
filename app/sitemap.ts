import type { MetadataRoute } from "next";

import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

function obtenerBaseUrl() {
  const valor =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://ndi-ai-web.vercel.app";

  return valor.replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = obtenerBaseUrl();

  const paginas: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const snapshot = await adminDb
      .collection("companies")
      .where(
        "paginaPublica.publicada",
        "==",
        true,
      )
      .get();

    for (const documento of snapshot.docs) {
      const datos = documento.data();

      const paginaPublica =
        datos.paginaPublica &&
        typeof datos.paginaPublica === "object"
          ? datos.paginaPublica
          : {};

      const slug =
        typeof paginaPublica.slug === "string"
          ? paginaPublica.slug.trim()
          : "";

      if (!slug) {
        continue;
      }

      paginas.push({
        url: `${baseUrl}/negocio/${encodeURIComponent(slug)}`,
        lastModified:
          datos.updatedAt?.toDate?.() ??
          datos.createdAt?.toDate?.() ??
          new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar las páginas públicas para sitemap:",
      error,
    );
  }

  return paginas;
}