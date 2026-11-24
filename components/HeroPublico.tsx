"use client";

import { useEffect, useState } from "react";
import type { ElementoHero } from "@/app/empresas/[id]/page";

interface HeroProps {
  titulo: string;
  subtitulo?: string;
  logoUrl?: string;
  colorPrincipal?: string;
  multimediaHero?: ElementoHero[];
}

export default function HeroPublico({
  titulo,
  subtitulo,
  logoUrl,
  colorPrincipal = "#2563eb",
  multimediaHero = [],
}: HeroProps) {
  // Filtramos solo los elementos que tengan URL válida
  const itemsValidos = multimediaHero.filter((m) => Boolean(m?.url?.trim()));
  const [indiceActual, setIndiceActual] = useState(0);

  // Carrusel automático cada 4 segundos
  useEffect(() => {
    if (itemsValidos.length <= 1) return;

    const interval = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % itemsValidos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [itemsValidos.length]);

  return (
    <section className="relative flex min-h-[65vh] sm:min-h-[75vh] w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-16 text-white dark:bg-zinc-950">
      {/* FONDO MULTIMEDIA CON ANIMACIÓN Y FADE EN CARRUSEL */}
      {itemsValidos.length > 0 && (
        <div className="absolute inset-0 z-0">
          {itemsValidos.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === indiceActual ? "opacity-35 scale-105 transition-transform duration-7000" : "opacity-0 scale-100"
              }`}
            >
              {item.tipo === "video" ? (
                <video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt={titulo}
                  className="h-full w-full object-cover blur-[2px]"
                />
              )}
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
        </div>
      )}

      {/* CONTENIDO DEL HERO */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {logoUrl && (
          <div className="mb-6 inline-block overflow-hidden rounded-2xl bg-white p-3 shadow-2xl transition hover:scale-105">
            <img
              src={logoUrl}
              alt={titulo}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            />
          </div>
        )}

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl drop-shadow-md">
          {titulo}
        </h1>

        {subtitulo && (
          <p className="mt-4 text-base text-slate-300 sm:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow">
            {subtitulo}
          </p>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <a
            href="#contacto"
            style={{ backgroundColor: colorPrincipal }}
            className="rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 hover:brightness-110 active:scale-95"
          >
            Contactar ahora
          </a>
        </div>

        {/* INDICADORES DEL CARRUSEL (PUNTOS INFERIORES) */}
        {itemsValidos.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {itemsValidos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setIndiceActual(idx)}
                aria-label={`Ir a imagen ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === indiceActual ? "w-6 bg-white" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}