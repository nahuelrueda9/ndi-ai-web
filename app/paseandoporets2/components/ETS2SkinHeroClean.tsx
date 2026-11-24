"use client";

import React, { useMemo } from "react";

interface SkinItem {
  id: string;
  name: string;
  img: string;
  category: string;
}

export default function ETS2SkinHeroClean() {
  const skins = useMemo(() => {
    const list: SkinItem[] = [];

    const categories = [
      { prefix: "busscarnb1", count: 6, label: "Busscar NB1" },
      { prefix: "marcopolo-g7", count: 6, label: "Marcopolo G7" },
      { prefix: "marcopolo-g8", count: 42, label: "Marcopolo G8" },
      { prefix: "marcopolo-newg7", count: 78, label: "Marcopolo New G7" },
      { prefix: "modasa", count: 9, label: "Modasa" },
      { prefix: "niccoloisidro", count: 6, label: "Niccolo Isidro" },
      { prefix: "starbus3", count: 9, label: "Starbus 3" },
    ];

    categories.forEach((cat) => {
      for (let i = 1; i <= cat.count; i++) {
        const numStr = i.toString().padStart(2, "0");
        list.push({
          id: `${cat.prefix}-${numStr}`,
          name: `${cat.label} #${numStr}`,
          img: `/skins/skin-${cat.prefix}-${numStr}.jpg`,
          category: cat.label,
        });
      }
    });

    return list;
  }, []);

  const row1 = useMemo(() => [...skins].sort(() => Math.random() - 0.5), [skins]);
  const row2 = useMemo(() => [...skins].sort(() => Math.random() - 0.5), [skins]);
  const row3 = useMemo(() => [...skins].sort(() => Math.random() - 0.5), [skins]);
  const row4 = useMemo(() => [...skins].sort(() => Math.random() - 0.5), [skins]);

  return (
    <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-12 bg-white overflow-hidden flex flex-col justify-center items-center">
      <style jsx>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
        }

        /* Velocidad ultra lenta y cinemática */
        .animate-scroll-right-1 {
          animation: scrollRight 1200s linear infinite;
        }
        .animate-scroll-left-1 {
          animation: scrollLeft 1400s linear infinite;
        }
        .animate-scroll-right-2 {
          animation: scrollRight 1600s linear infinite;
        }
        .animate-scroll-left-2 {
          animation: scrollLeft 1300s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="text-center mb-8 px-4">
        <h3 className="text-2xl md:text-3xl font-black text-black tracking-tight mb-2">Catálogo Completo de Skins</h3>
        <p className="text-slate-500 text-xs md:text-sm">Exploración en movimiento de las 52 texturas oficiales</p>
      </div>

      {/* Contenedor de ancho completo con degradado difuminado en los bordes */}
      <div className="w-full flex flex-col gap-5 py-2 select-none [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        
        <div className="w-full overflow-hidden relative py-2">
          <div className="marquee-track animate-scroll-right-1">
            {[...row1, ...row1].map((skin, idx) => (
              <div key={`r1-${idx}`} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[155px] sm:h-[175px] mx-3 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-none">
                <img src={skin.img} alt={skin.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden relative py-2">
          <div className="marquee-track animate-scroll-left-1">
            {[...row2, ...row2].map((skin, idx) => (
              <div key={`r2-${idx}`} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[155px] sm:h-[175px] mx-3 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-none">
                <img src={skin.img} alt={skin.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden relative py-2">
          <div className="marquee-track animate-scroll-right-2">
            {[...row3, ...row3].map((skin, idx) => (
              <div key={`r3-${idx}`} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[155px] sm:h-[175px] mx-3 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-none">
                <img src={skin.img} alt={skin.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden relative py-2">
          <div className="marquee-track animate-scroll-left-2">
            {[...row4, ...row4].map((skin, idx) => (
              <div key={`r4-${idx}`} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[155px] sm:h-[175px] mx-3 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-none">
                <img src={skin.img} alt={skin.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}