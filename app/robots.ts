import type { MetadataRoute } from "next";

function obtenerBaseUrl() {
  const valor =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://ndi-ai-web.vercel.app";

  return valor.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = obtenerBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/negocio/",
      ],
      disallow: [
        "/api/",
        "/dashboard/",
        "/empresas/",
        "/login",
        "/inbox/",
        "/widget/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}