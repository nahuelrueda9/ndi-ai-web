import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { ThemeProvider } from "@/components/theme/ThemeProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NDI | Diseño & Web · Páginas web para tu negocio",
  description:
    "Diseño gráfico y desarrollo de páginas web para emprendimientos, negocios y profesionales. Tu sitio a medida, fácil de usar y listo para vender.",
  metadataBase: new URL("https://ndiweb.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NDI | Diseño & Web · Páginas web para tu negocio",
    description:
      "Diseño gráfico y desarrollo de páginas web para emprendimientos, negocios y profesionales. Tu sitio a medida, fácil de usar y listo para vender.",
    url: "https://ndiweb.com",
    siteName: "NDI | Diseño & Web",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NDI | Diseño & Web · Páginas web para tu negocio",
    description:
      "Diseño gráfico y desarrollo de páginas web para emprendimientos, negocios y profesionales. Tu sitio a medida, fácil de usar y listo para vender.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}