"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// Este archivo va en app/components/, por eso sube un nivel para llegar a app/logo-paths
import { LOGO, ORO, CELESTE } from "../logo-paths";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  TEXTOS, LINKS E IMÁGENES (cambiá lo que quieras acá)               */
/* ------------------------------------------------------------------ */
const WORDS = ["Paseando", "por", "ETS 2"];
const SCROLL_LABEL = "jugando en rutas argentinas";
const BUTTON_TEXT = "Suscribite";
const BUTTON_HREF = "https://www.youtube.com/@paseandoporets2?sub_confirmation=1";
const FALLBACK_IMG = "/rio-uruguay.png";

// Tipografía condensada y pesada, parecida a las letras del logo
const TITLE_FONT = 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif';
const TITLE_COLOR = "#50AEE2";
const GOLD = "#FFBC61";

const SKINS = [
"/skins/skin-busscarnb1-02.jpg",
  "/skins/skin-marcopolo-g7-03.jpg",
  "/skins/skin-marcopolo-g8-13.jpg",
  "/skins/skin-marcopolo-g8-18.jpg",
  "/skins/skin-marcopolo-g8-38.jpg",
  "/skins/skin-marcopolo-newg7-34.jpg",
  "/skins/skin-marcopolo-newg7-68.jpg",
  "/skins/skin-marcopolo-newg7-70.jpg",
  "/skins/skin-modasa-02.jpg",
];

/*
  Cada columna de tarjetas es una "tira" vertical que se desliza con el scroll.
  `order` son índices de SKINS (se pueden repetir).
  - left / right: el primer elemento es la tarjeta de ABAJO (entra desde arriba).
  - center: el primer elemento es la tarjeta de ARRIBA (entra desde abajo).
*/
const STRIPS = [
  { col: "left", order: [0, 1, 2, 3, 4, 5] },
  { col: "center", order: [3, 4, 5, 0, 1, 2, 3] },
  { col: "right", order: [2, 3, 4, 5, 0, 1] },
] as const;

/* ------------------------------------------------------------------ */
/*  LÍNEA DE TIEMPO (progreso total del scroll: 0 → 1)                 */
/*  Para que dure más o menos scroll, cambiá h-[1000vh] más abajo.     */
/* ------------------------------------------------------------------ */
const T = {
  logoEnd: 0.29, // 0 → 0.29: se arma el logo
  wordStart: 0.29, // 0.29 → 0.35: el logo se achica y salen las palabras abajo
  wordEnd: 0.35,
  exitStart: 0.4, // 0.40 → 0.46: el logo se va y la palabra baja al centro
  exitEnd: 0.46,
  tilesStart: 0.46, // 0.46 → 0.90: tarjetas
  tilesEnd: 0.9,
  finalStart: 0.86, // 0.86 → 0.96: la palabra sube y aparece el botón rojo
  finalEnd: 0.96,
};

/* ------------------------------------------------------------------ */
/*  AYUDAS                                                             */
/* ------------------------------------------------------------------ */
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
// Devuelve 0..1 mientras p avanza de "desde" a "hasta"
const seg = (p: number, desde: number, hasta: number) => clamp01((p - desde) / (hasta - desde));

// Rebote: la animación se pasa un poquito y vuelve a su lugar
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Aparición escalonada: la pieza i de n aparece a medida que la variable CSS v avanza de 0 a 1
const stagger = (v: string, i: number, n: number) =>
  `clamp(0, calc((var(${v}, 0) * ${n + 1.5} - ${i}) / 1.5), 1)`;

// Estrellas: "sube" = cuánto empiezan escondidas detrás del escudo (px), "giro" = grados que giran al salir
const ESTRELLAS = [
  { d: LOGO.estrellas[1], v: "--s1", sube: 245, giro: -25 }, // centro
  { d: LOGO.estrellas[0], v: "--s2", sube: 175, giro: -35 }, // izquierda
  { d: LOGO.estrellas[2], v: "--s3", sube: 175, giro: 35 }, // derecha
];

/* ------------------------------------------------------------------ */
/*  LOGO ANIMADO (el mismo del page.tsx viejo)                         */
/* ------------------------------------------------------------------ */

// Letras del logo que van apareciendo una tras otra
function Letras({ paths, v }: { paths: readonly string[]; v: string }) {
  return (
    <>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={CELESTE}
          fillRule="evenodd"
          style={{
            opacity: stagger(v, i, paths.length),
            transform: `translateY(calc((1 - ${stagger(v, i, paths.length)}) * 26px))`,
          }}
        />
      ))}
    </>
  );
}

// Logo que se va construyendo por piezas mientras bajás (las variables CSS las escribe el scroll).
// Al final se mezcla con tu logo.png real para que quede exactamente igual.
function LogoAnimado() {
  const centrar = { transformBox: "fill-box", transformOrigin: "center" } as const;

  return (
    <svg
      viewBox="200 0 680 1080"
      role="img"
      aria-label="Logo Paseando por ETS 2"
      className="h-[min(58vh,520px)] w-auto overflow-visible"
      style={{ aspectRatio: "680 / 1080" }}
    >
      <defs>
        <clipPath id="logo-clip-silueta"><path d={LOGO.silueta} /></clipPath>
        <clipPath id="logo-clip-banda"><rect x="232" y="418.5" width="617" height="160.5" /></clipPath>
      </defs>

      <g style={{ opacity: "calc(1 - var(--png, 0))" }}>
        {/* 7) Estrellas: salen desde atrás del escudo, girando y con un pequeño rebote */}
        {ESTRELLAS.map((e, i) => (
          <path
            key={i}
            d={e.d}
            fill={ORO}
            style={{
              ...centrar,
              opacity: "var(--so, 0)",
              transform: `translateY(calc((1 - var(${e.v}, 0)) * ${e.sube}px)) rotate(calc((1 - var(${e.v}, 0)) * ${e.giro}deg))`,
            }}
          />
        ))}

        {/* Fondo blanco del escudo: tapa las estrellas mientras están escondidas */}
        <path d={LOGO.silueta} fill="#fff" />

        {/* 1) Contorno dorado: se dibuja recorriendo el borde */}
        <path
          d={LOGO.silueta}
          fill="none"
          stroke={ORO}
          strokeWidth={18}
          strokeLinejoin="round"
          pathLength={1}
          clipPath="url(#logo-clip-silueta)"
          style={{ strokeDasharray: "1.002 1", strokeDashoffset: "calc((1 - var(--l1, 0)) * 1.002px)" }}
        />

        {/* 2) Borde celeste: crece desde la punta de abajo hacia arriba */}
        <path
          d={LOGO.azul}
          fill={CELESTE}
          style={{ ...centrar, transformOrigin: "50% 100%", transform: "scaleY(var(--l2, 0))" }}
        />

        {/* 3) Interior: se abre el marco dorado y el fondo blanco */}
        <g
          style={{
            ...centrar,
            opacity: "var(--l3, 0)",
            transform: "scale(calc(0.55 + var(--l3, 0) * 0.45))",
          }}
        >
          <path d={LOGO.oroInt} fill={ORO} />
          <path d={LOGO.blanco} fill="#fff" />
        </g>

        {/* 4) "PASEANDO": letra por letra */}
        <Letras paths={LOGO.paseando} v="--tp" />

        {/* 5) Banda del medio: se abre desde el centro, después entran la caja de "POR" y las franjas */}
        <rect
          x="232" y="418.5" width="617" height="160.5" fill={ORO}
          style={{ ...centrar, transform: "scaleX(var(--l5, 0))" }}
        />
        <rect
          x="234.5" y="425.5" width="303" height="147.5" fill="#fff"
          style={{ opacity: "clamp(0, calc((var(--l5, 0) - 0.6) * 2.5), 1)" }}
        />
        <g clipPath="url(#logo-clip-banda)">
          <rect x="543.5" y="425.5" width="302.5" height="45" fill={CELESTE}
            style={{ opacity: "var(--f1, 0)", transform: "translateX(calc((1 - var(--f1, 0)) * 320px))" }} />
          <rect x="543.5" y="476.5" width="302.5" height="46" fill="#fff"
            style={{ opacity: "var(--f2, 0)", transform: "translateX(calc((1 - var(--f2, 0)) * 320px))" }} />
          <rect x="543.5" y="527.5" width="302.5" height="46" fill={CELESTE}
            style={{ opacity: "var(--f3, 0)", transform: "translateX(calc((1 - var(--f3, 0)) * 320px))" }} />
        </g>
        <Letras paths={LOGO.por} v="--rp" />

        {/* 6) "ETS" y el "2" */}
        <Letras paths={[...LOGO.ets, ...LOGO.dos]} v="--bp" />
      </g>

      {/* 8) Tu logo real: aparece encima para que el resultado final sea idéntico */}
      <image href="/logo.png" x="0" y="0" width="1080" height="1080" style={{ opacity: "var(--png, 0)" }} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  AJUSTES DEL MOVIMIENTO DE LAS TARJETAS                             */
/*  Medidas en "tarjetas" (1 = lado de una tarjeta). p = progreso 0→1  */
/*  de la fase de tarjetas.                                            */
/* ------------------------------------------------------------------ */
type Keys = ReadonlyArray<readonly [number, number]>;

const GAP_V = 1.34; // distancia vertical entre tarjetas de una misma columna

// Zoom de toda la grilla
const K_SCALE: Keys = [
  [0, 1],
  [0.3, 1],
  [0.45, 1.077],
  [0.6, 1.35],
  [0.75, 1.79],
  [0.9, 2],
  [1, 2],
];

// Separación horizontal entre columnas (centro a centro)
const K_PITCH: Keys = [
  [0, 1.13],
  [0.3, 1.13],
  [0.45, 1.19],
  [0.6, 1.395],
  [0.75, 1.734],
  [0.9, 2.3],
  [1, 2.6],
];

// Posición vertical de la tarjeta "base" de las columnas de los costados
// (el punto de partida, p = 0, se calcula solo según el tamaño de pantalla)
const K_SIDE_REST: Keys = [
  [0.3, 0.54],
  [0.45, 1.15],
  [0.6, 1.76],
  [0.75, 2.37],
  [0.9, 3.0],
  [1, 3.6],
];

// Las 2 tarjetas finales del centro: una sube y otra baja (el último valor
// de salida se calcula solo para que siempre queden fuera de pantalla)
const K_RED: Keys = [
  [0.6, -0.42],
  [0.75, -0.73],
  [0.9, -0.98],
];
const K_RIB: Keys = [
  [0.6, 0.92],
  [0.75, 0.73],
  [0.9, 0.98],
];

function lerpKeys(keys: Keys, p: number): number {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i][0]) {
      const [p0, v0] = keys[i - 1];
      const [p1, v1] = keys[i];
      return v0 + (v1 - v0) * ((p - p0) / (p1 - p0));
    }
  }
  return keys[keys.length - 1][1];
}

/* ------------------------------------------------------------------ */
/*  COMPONENTE                                                         */
/* ------------------------------------------------------------------ */
export default function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const set = (nombre: string, valor: number) =>
      section.style.setProperty(nombre, valor.toFixed(4));

    // Accesibilidad: sin animación, se muestra directo el estado final
    // (palabra + botón, sin logo ni tarjetas).
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      section.style.height = "100vh";
      grid.style.display = "none";
      if (logoRef.current) logoRef.current.style.display = "none";
      if (labelRef.current) labelRef.current.style.display = "none";
      set("--w1", 1);
      set("--w2", 1);
      set("--w3", 1);
      set("--ty", -10);
      set("--fin", 1);
      if (finalRef.current) finalRef.current.style.pointerEvents = "auto";
      return () => {
        section.style.height = "";
      };
    }

    const tiles = Array.from(grid.querySelectorAll<HTMLElement>(".hero-tile"));
    const state = { p: 0 };

    // Calcula la posición de TODAS las tarjetas para un progreso p (0→1 de la fase de tarjetas)
    const renderTiles = (p: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const S = Math.min(W * (W < 768 ? 0.26 : 0.19), H * 0.36); // lado de tarjeta en px
      const k = lerpKeys(K_SCALE, p);
      const pitch = lerpKeys(K_PITCH, p);

      // punto de partida: la tarjeta base arranca justo fuera de pantalla
      const startY = (H / 2 + S / 2) / S + 0.1;
      const side = lerpKeys([[0, -startY], ...K_SIDE_REST], p);
      const centerTop = -side;

      // salida final de las 2 tarjetas del centro
      const exit = Math.max(1.45, H / (4 * S) + 0.6);
      const redKeys: Keys = [...K_RED, [1, -exit]];
      const ribKeys: Keys = [...K_RIB, [1, exit]];
      const redY = lerpKeys(redKeys, p);
      const ribY = lerpKeys(ribKeys, p);

      for (const t of tiles) {
        const col = t.dataset.col;
        const j = Number(t.dataset.j);
        let x = 0;
        let y = 0;

        if (col === "center") {
          y = centerTop + j * GAP_V;
          if (p > 0.6) {
            if (j === 1) y = redY;
            else if (j >= 2) y = ribY + (j - 2) * GAP_V;
          }
        } else {
          x = (col === "left" ? -1 : 1) * pitch;
          y = side - j * GAP_V;
        }

        t.style.transform = `translate3d(${x * S}px, ${y * S}px, 0)`;
      }

      grid.style.transform = `scale(${k})`;
      grid.style.setProperty("--hero-s", `${S}px`);
    };

    // Motor principal: P (0→1) es el progreso TOTAL del scroll de la sección
    const render = (P: number) => {
      /* --- 1) Armado del logo, de a poco y en etapas --- */
      // pl reutiliza la escala de tiempos del hero viejo (0 → 0.43)
      const pl = clamp01(P / T.logoEnd) * 0.43;
      set("--l1", seg(pl, 0, 0.05)); // se dibuja el contorno dorado del escudo
      set("--l2", seg(pl, 0.04, 0.09)); // se llena el borde celeste
      set("--l3", seg(pl, 0.08, 0.13)); // se abre el interior blanco con su marco dorado
      set("--tp", seg(pl, 0.12, 0.2)); // letras de "PASEANDO"
      set("--l5", seg(pl, 0.19, 0.23)); // se abre la banda del medio
      set("--f1", seg(pl, 0.22, 0.25)); // franja 1 de la bandera
      set("--f2", seg(pl, 0.23, 0.26)); // franja 2
      set("--f3", seg(pl, 0.24, 0.27)); // franja 3
      set("--rp", seg(pl, 0.22, 0.27)); // letras de "POR"
      set("--bp", seg(pl, 0.26, 0.33)); // "ETS" y "2"
      set("--so", pl >= 0.31 ? 1 : 0); // las estrellas existen (escondidas detrás del escudo)
      set("--s1", easeOutBack(seg(pl, 0.32, 0.37))); // estrella del centro sale de atrás
      set("--s2", easeOutBack(seg(pl, 0.35, 0.4))); // estrella izquierda
      set("--s3", easeOutBack(seg(pl, 0.36, 0.41))); // estrella derecha
      set("--png", seg(pl, 0.4, 0.43)); // se mezcla con tu logo.png real

      /* --- 2) Posición del logo: zoom al armarse, se achica cuando sale la palabra, y se va --- */
      const build = seg(P, 0, T.logoEnd);
      const shrink = seg(P, T.wordStart, T.wordEnd);
      const exit = seg(P, T.exitStart, T.exitEnd);
      set("--ls", (0.9 + build * 0.14) * (1 - shrink * 0.22) * (1 - exit * 0.15));
      set("--lo", 1 - exit);
      set("--ly", -9 * shrink - 7 * exit); // en vh

      /* --- 3) Palabra PASEANDO POR ETS 2 --- */
      set("--w1", seg(P, 0.29, 0.315));
      set("--w2", seg(P, 0.31, 0.335));
      set("--w3", seg(P, 0.325, 0.35));
      const fin = seg(P, T.finalStart, T.finalEnd);
      // 24 = abajo del logo; 0 = centro; -10 = un poco arriba del centro (final)
      set("--ty", 24 * (1 - exit) - 10 * fin); // en vh
      set("--fin", fin); // botón rojo
      set("--hint", 1 - seg(P, 0, 0.02));
      if (finalRef.current) finalRef.current.style.pointerEvents = fin > 0.6 ? "auto" : "none";

      /* --- 4) Tarjetas --- */
      renderTiles(seg(P, T.tilesStart, T.tilesEnd));
    };

    render(0);
    tiles.forEach((t) => (t.style.visibility = "visible"));

    const onResize = () => render(state.p);
    window.addEventListener("resize", onResize);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // p va de 0 a 1 con el scroll y mueve todo
      tl.to(state, { p: 1, duration: 1, onUpdate: () => render(state.p) }, 0);
    }, section);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  return (
    // OJO: sin overflow-hidden acá, rompe el position: sticky de adentro.
    // Para que dure más o menos scroll, cambiá h-[1000vh].
    <section
      ref={sectionRef}
      className="relative h-[1000vh] w-full select-none bg-white text-black"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* 1) LOGO: se arma con el scroll, se achica y se va */}
        <div
          ref={logoRef}
          className="absolute inset-0 z-10 flex items-center justify-center will-change-transform"
          style={{
            opacity: "var(--lo, 1)",
            transform: "translateY(calc(var(--ly, 0) * 1vh)) scale(var(--ls, 0.9))",
          }}
        >
          <LogoAnimado />
        </div>

        {/* 2) TARJETAS (debajo de la palabra) */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <div
            ref={gridRef}
            className="absolute inset-0 will-change-transform"
            style={{ "--hero-s": "20vw" } as React.CSSProperties}
          >
            {STRIPS.map((strip) =>
              strip.order.map((skinIdx, j) => (
                <div
                  key={`${strip.col}-${j}`}
                  data-col={strip.col}
                  data-j={j}
                  className="hero-tile invisible absolute left-1/2 top-1/2 overflow-hidden bg-neutral-200 will-change-transform"
                  style={{
                    width: "var(--hero-s)",
                    height: "var(--hero-s)",
                    marginLeft: "calc(var(--hero-s) / -2)",
                    marginTop: "calc(var(--hero-s) / -2)",
                  }}
                >
                  <img
                    src={SKINS[skinIdx]}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = "1";
                        img.src = FALLBACK_IMG;
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3) PALABRA "PASEANDO POR ETS 2": sale abajo del logo y se queda hasta el final */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex flex-col items-center px-6"
          style={{ transform: "translateY(calc(-50% + var(--ty, 24) * 1vh))" }}
        >
          <h2
            className="flex flex-wrap justify-center gap-x-4 text-center text-5xl uppercase leading-none md:gap-x-8 md:text-8xl"
            style={{
              fontFamily: TITLE_FONT,
              letterSpacing: "0.02em",
              color: TITLE_COLOR,
              // halo blanco para que se lea bien encima de las tarjetas
              WebkitTextStroke: "8px #fff",
              paintOrder: "stroke fill",
            }}
          >
            {WORDS.map((w, i) => (
              <span
                key={w}
                className="inline-block"
                style={{
                  opacity: `var(--w${i + 1}, 0)`,
                  transform: `translateY(calc((1 - var(--w${i + 1}, 0)) * 30px))`,
                }}
              >
                {w}
              </span>
            ))}
          </h2>
          <div
            className="mt-5 h-1.5 rounded-full"
            style={{ background: GOLD, width: "calc(var(--w3, 0) * min(60vw, 360px))" }}
          />
        </div>

        {/* 4) BOTÓN ROJO DE YOUTUBE: aparece al final */}
        <div
          ref={finalRef}
          className="pointer-events-none absolute inset-x-0 top-[57%] z-30 flex justify-center px-6"
          style={{
            opacity: "var(--fin, 0)",
            transform: "translateY(calc((1 - var(--fin, 0)) * 12px))",
          }}
        >
          <a
            href={BUTTON_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-[#FF0000] px-8 py-3.5 text-sm font-bold text-white shadow-xl transition hover:scale-105 hover:bg-[#cc0000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            {BUTTON_TEXT}
          </a>
        </div>

        {/* 5) ETIQUETA INICIAL + línea vertical (se va apenas empezás a bajar) */}
        <div
          ref={labelRef}
          className="absolute bottom-10 z-30 flex w-full flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-400"
          style={{ opacity: "var(--hint, 1)" }}
        >
          <span>{SCROLL_LABEL}</span>
          <div className="h-10 w-px bg-neutral-300" />
        </div>
      </div>
    </section>
  );
}