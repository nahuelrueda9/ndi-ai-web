"use client";

import type { ElementoHero } from "@/app/empresas/[id]/page";
import { Floating, FloatingElement } from "@/components/Ui/parallax-floating";

interface HeroProps {
  titulo: string;
  subtitulo?: string;
  logoUrl?: string;
  colorPrincipal?: string;
  multimediaHero?: ElementoHero[];
}

export default function HeroEdduBarber({
  titulo,
  subtitulo,
  logoUrl,
  colorPrincipal = "#2563eb",
  multimediaHero = [],
}: HeroProps) {
  // Posiciones perfectamente delimitadas para que NUNCA pisen el botón ni el centro
  const slotsConfig = [
    { pos: "-top-[5%] left-[2%] lg:top-[0%] lg:left-[1%] w-36 sm:w-56 lg:w-80 aspect-[9/16] z-10", depth: 1.0 },
    { pos: "top-[2%] right-[2%] lg:top-[0%] lg:right-[1%] w-38 sm:w-52 lg:w-80 aspect-square z-15", depth: 1.1 },
    { pos: "top-[26%] left-[34%] lg:top-[2%] lg:left-[24%] w-28 sm:w-40 lg:w-76 aspect-square z-10", depth: 0.8 },
    { pos: "top-[32%] right-[4%] lg:top-[2%] lg:right-[24%] w-40 sm:w-60 lg:w-76 aspect-square z-15", depth: 1.4 },
    { pos: "top-[48%] left-[-2%] lg:top-[32%] lg:left-[14%] w-42 sm:w-70 lg:w-80 aspect-square z-20", depth: 0.7 },
    { pos: "bottom-[28%] right-[4%] lg:top-[32%] lg:right-[12%] w-42 sm:w-56 lg:w-80 aspect-[4/3] z-15", depth: 1.2 },
    { pos: "bottom-[2%] left-[4%] lg:bottom-[0%] lg:left-[22%] w-38 sm:w-48 lg:w-80 aspect-[3/4] z-15", depth: 1.3 },
    { pos: "bottom-[4%] right-[22%] lg:bottom-[0%] lg:right-[22%] w-44 sm:w-64 lg:w-80 aspect-[4/5] z-15", depth: 1.2 },
  ];

  return (
    <section className="relative flex min-h-screen sm:min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden bg-black px-4 py-16 text-white isolate border-b border-zinc-900">
      
      {/* COLLAGE FLOTANTE DETRÁS DEL CONTENIDO */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
        <Floating sensitivity={1.3} easingFactor={0.05}>
          {multimediaHero.map((item, index) => {
            if (!item?.url) return null;
            const config = slotsConfig[index % slotsConfig.length];

            return (
              <FloatingElement
                key={`hero-collage-${index}`}
                depth={config.depth}
                className={config.pos}
              >
                <div className="relative h-full w-full overflow-hidden bg-black shadow-2xl rounded-2xl border border-zinc-900 transition-transform duration-500 hover:scale-105">
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
                      alt={`Hero media ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </FloatingElement>
            );
          })}
        </Floating>
      </div>

      {/* GRADIENTE CENTRAL PARA DESTACAR EL LOGO */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/80 via-black/95 to-black" />

      {/* CONTENIDO CENTRAL */}
      <div className="relative z-30 mx-auto max-w-xs sm:max-w-sm text-center py-4">
        {logoUrl && (
          <div className="mb-3 inline-block">
            <img
              src={logoUrl}
              alt={titulo}
              className="mx-auto h-auto max-h-32 sm:max-h-48 w-auto max-w-[220px] sm:max-w-[340px] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]"
            />
          </div>
        )}

        {subtitulo && (
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-300 max-w-xs mx-auto drop-shadow-md">
            {subtitulo}
          </p>
        )}

{/* BOTÓN CON DEGRADADO, GLOW Y MAYOR TAMAÑO */}
<div className="mt-7 flex justify-center">
  <a
    href="#reservar"
    className="group relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ED192D] via-[#ff3b4e] to-[#ED192D] px-9 py-4 text-sm sm:text-base font-extrabold text-white tracking-wide shadow-[0_0_30px_rgba(237,25,45,0.65),0_0_10px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(237,25,45,0.9)] active:scale-95 border border-red-300/50"
  >
    <span className="relative z-10">Pedir turno online</span>
    {/* ANILLO DE GRADIENTE Y RESPLANDOR TRASERO */}
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ED192D] to-[#ff2a3f] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
  </a>
</div>
      </div>
    </section>
  );
}