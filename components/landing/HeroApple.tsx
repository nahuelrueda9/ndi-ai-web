"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  MessageCircle,
  Plus,
  QrCode,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";

interface HeroAppleProps {
  whatsappNumero: string;
}

const PASOS_SEC = [
  {
    id: 1,
    tag: "Paso 01",
    titulo: "Tu catálogo o carta digital",
    detalle:
      "Tus productos, fotos y precios actualizados las 24 hs. El cliente entra desde tu link o escaneando el QR.",
    badge: "Catálogo Online",
  },
  {
    id: 2,
    tag: "Paso 02",
    titulo: "El cliente arma su pedido",
    detalle:
      "Elige gustos, talles, variantes y ve el total calculado al instante sin tener que preguntarte precio por precio.",
    badge: "Carrito en vivo",
  },
  {
    id: 3,
    tag: "Paso 03",
    titulo: "Llega armado a tu WhatsApp",
    detalle:
      "Recibís un mensaje ordenado con el detalle del pedido, dirección o mesa, y método de pago listo para cobrar.",
    badge: "WhatsApp Directo",
  },
  {
    id: 4,
    tag: "Paso 04",
    titulo: "QR físico para tu negocio",
    detalle:
      "Un código QR exclusivo para tu mostrador, vidriera o mesas. Tu cliente escanea y compra en segundos.",
    badge: "QR Listo para Imprimir",
  },
];

export default function HeroApple({ whatsappNumero }: HeroAppleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pasoActivo, setPasoActivo] = useState(0);
  const [rotacionMouse, setRotacionMouse] = useState({ x: 0, y: 0 });
  const [progresoScroll, setProgresoScroll] = useState(0);

  // Escucha del scroll dentro de la sección pinneada (sticky)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalDist = containerRef.current.offsetHeight - window.innerHeight;
      if (totalDist <= 0) return;

      // Progreso normalizado entre 0 y 1 dentro del bloque
      const scrollActual = -rect.top;
      const progreso = Math.min(Math.max(scrollActual / totalDist, 0), 1);
      setProgresoScroll(progreso);

      // Calculamos qué paso mostrar (0 a 3)
      if (progreso < 0.28) {
        setPasoActivo(0);
      } else if (progreso < 0.58) {
        setPasoActivo(1);
      } else if (progreso < 0.88) {
        setPasoActivo(2);
      } else {
        setPasoActivo(3);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Leve efecto de inclinación 3D con el cursor (solo desktop)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    const { clientX, clientY } = e;
    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;
    const rotX = -((clientY - centroY) / centroY) * 5;
    const rotY = ((clientX - centroX) / centroX) * 5;
    setRotacionMouse({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setRotacionMouse({ x: 0, y: 0 });
  };

  // Dinámica 3D combinando scroll e inclinación
  const rotacionXFinal = rotacionMouse.x - progresoScroll * 4;
  const rotacionYFinal =
    rotacionMouse.y + (pasoActivo === 1 ? -4 : pasoActivo === 2 ? 4 : 0);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[320vh] sm:h-[360vh] bg-zinc-50 dark:bg-[#0c0d0e] transition-colors"
    >
      {/* CONTENEDOR STICKY: QUEDA FIJO MIENTRAS SCROLLEÁS */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between pt-14 pb-6 sm:pt-16 sm:pb-8 px-4 sm:px-8">
        {/* LUZ TRASERA SUAVE (BACKLIGHT CINEMATOGRÁFICO) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] sm:h-[650px] sm:w-[650px] rounded-full bg-[var(--brand)]/15 dark:bg-[var(--brand)]/10 blur-[140px] -z-10" />

        {/* 1. TITULAR Y COPYS (HERO HEADER CENTRADO Y CONTUNDENTE) */}
        <div className="mx-auto max-w-4xl text-center z-10 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 mb-3 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span>ND · Diseño Gráfico & Desarrollo Web</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.12]">
            Tené la página web de tu negocio{" "}
            <span className="relative inline-block whitespace-nowrap">
              lista para vender.
              <svg
                aria-hidden="true"
                viewBox="0 0 280 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute -bottom-2 left-0 w-full text-[var(--brand)] overflow-visible"
              >
                <path
                  d="M3 14C60 6 180 4 277 12C210 16 90 18 12 16"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
            Diseño tu identidad visual y tu web a medida. Atención directa de persona a persona desde Jujuy.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] hover:opacity-90 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition active:scale-95"
            >
              Quiero mi página
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={`https://wa.me/${whatsappNumero}?text=${encodeURIComponent("¡Hola Nahuel! Me gustaría consultar por el diseño de una página web para mi negocio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white/80 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-zinc-800 shadow-xs backdrop-blur-md transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              Hablar con Nahuel
            </a>
          </div>
        </div>

        {/* 2. ESCENARIO CENTRAL 3D: CELULAR PROTAGONISTA + INFORMACIÓN LATERAL */}
        <div className="relative flex-1 flex items-center justify-center my-auto w-full max-w-5xl mx-auto">
          {/* TARJETA EXPLICATIVA LATERAL IZQUIERDA (DESKTOP) */}
          <div className="hidden lg:flex flex-col justify-center w-64 pr-6 text-left transition-all duration-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-contrast)] dark:text-[var(--brand)]">
              {PASOS_SEC[pasoActivo].tag}
            </span>
            <h3 className="mt-1 text-lg font-bold text-zinc-950 dark:text-white leading-snug">
              {PASOS_SEC[pasoActivo].titulo}
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {PASOS_SEC[pasoActivo].detalle}
            </p>
          </div>

          {/* CELULAR PROTAGONISTA EN CSS 3D */}
          <div
            className="hero-scene relative flex items-center justify-center"
            style={{ perspective: "1400px" }}
          >
            <div
              className="hero-card-3d relative w-[280px] sm:w-[320px] rounded-[2.8rem] border-[5px] border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${rotacionXFinal}deg) rotateY(${rotacionYFinal}deg)`,
              }}
            >
              {/* Notch superior */}
              <div className="mx-auto h-4 w-24 rounded-full bg-zinc-800 mb-2 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 ml-auto mr-3" />
              </div>

              {/* PANTALLA INTERNA CON LOS 4 ESTADOS SECUENCIALES */}
              <div className="relative rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px] sm:h-[420px] flex flex-col justify-between text-left p-3.5">
                
                {/* CABECERA COMÚN DE LA TIENDA DE EJEMPLO */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-[10px] font-bold">
                      ND
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-950 dark:text-white leading-none">
                        Café & Sabores
                      </p>
                      <p className="text-[9px] text-zinc-500">Ledesma, Jujuy</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                    Abierto
                  </span>
                </div>

                {/* CONTENIDO MUTABLE SEGÚN EL ESTADO DE SCROLL */}
                <div className="flex-1 flex flex-col justify-center py-2">
                  
                  {/* ESTADO 1: CATÁLOGO / CARTA CON PRECIOS */}
                  {pasoActivo === 0 && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        <span>Recomendados de hoy</span>
                        <UtensilsCrossed className="h-3.5 w-3.5 text-[var(--brand)]" />
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">Café Filtrado Especial</p>
                          <p className="text-[10px] text-zinc-500">$ 2.800</p>
                        </div>
                        <span className="h-6 w-6 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
                          +
                        </span>
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">Tostón con Palta & Huevo</p>
                          <p className="text-[10px] text-zinc-500">$ 4.200</p>
                        </div>
                        <span className="h-6 w-6 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
                          +
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ESTADO 2: EL CLIENTE SELECCIONA Y ARMA SU PEDIDO */}
                  {pasoActivo === 1 && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2.5 border border-blue-500/20">
                        <p className="text-[10px] font-bold text-[var(--brand-contrast)] dark:text-blue-300">
                          Tu pedido en curso
                        </p>
                        <div className="mt-1 flex justify-between text-xs font-semibold text-zinc-900 dark:text-white">
                          <span>1x Tostón con Palta</span>
                          <span>$ 4.200</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-zinc-900 dark:text-white">
                          <span>1x Café Filtrado</span>
                          <span>$ 2.800</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-500/20 flex justify-between text-xs font-bold text-zinc-950 dark:text-white">
                          <span>Total</span>
                          <span className="text-[var(--brand-contrast)] dark:text-[var(--brand)]">$ 7.000</span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2 text-[10px] text-zinc-600 dark:text-zinc-400">
                        📍 Mesa 4 / Para consumir acá
                      </div>
                    </div>
                  )}

                  {/* ESTADO 3: MENSAJE ARMADO DIRECTO A WHATSAPP */}
                  {pasoActivo === 2 && (
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 p-3 text-left space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        <MessageCircle className="h-4 w-4" />
                        <span>Mensaje listo de WhatsApp</span>
                      </div>
                      <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono leading-tight bg-white dark:bg-zinc-900 p-2 rounded-lg border border-emerald-500/20">
                        ¡Hola! Quiero hacer este pedido:<br />
                        • 1x Tostón con Palta ($ 4.200)<br />
                        • 1x Café Filtrado ($ 2.800)<br />
                        <strong>Total: $ 7.000</strong><br />
                        Mesa: 4 (Pago con Transferencia)
                      </p>
                    </div>
                  )}

                  {/* ESTADO 4: CÓDIGO QR FÍSICO Y CIERRE */}
                  {pasoActivo === 3 && (
                    <div className="text-center space-y-2 animate-fadeIn flex flex-col items-center justify-center">
                      <div className="p-3 rounded-2xl bg-white border border-zinc-300 dark:border-zinc-700 shadow-md">
                        <QrCode className="h-16 w-16 text-zinc-900" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-950 dark:text-white">
                          QR para mesa o mostrador
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Tu cliente escanea y pide sin demoras
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* BOTÓN INFERIOR DE ACCIÓN DE LA PANTALLA */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="w-full rounded-xl bg-[var(--brand)] py-2 text-center text-white text-[11px] font-bold shadow-xs">
                    {pasoActivo === 2
                      ? "Enviar por WhatsApp →"
                      : pasoActivo === 3
                      ? "Listo para usar en tu negocio"
                      : "Ver pedido ($ 7.000)"}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* TARJETA LATERAL DERECHA (DESKTOP) */}
          <div className="hidden lg:flex flex-col justify-center w-64 pl-6 text-left transition-all duration-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-500/20 px-3 py-1 text-[11px] font-bold text-[var(--brand-contrast)] dark:text-[var(--brand)] w-fit">
              <Sparkles className="h-3 w-3" />
              {PASOS_SEC[pasoActivo].badge}
            </span>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Deslizá hacia abajo para ver la secuencia completa de cómo compran tus clientes.
            </p>
          </div>
        </div>

        {/* 3. BARRA INFERIOR DE PASOS (VISIBLE EN MOBILE Y DESKTOP) */}
        <div className="mx-auto max-w-xl w-full z-10 shrink-0">
          <div className="flex items-center justify-between gap-1.5 rounded-2xl border border-zinc-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
            {PASOS_SEC.map((paso, idx) => (
              <div
                key={paso.id}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
                  pasoActivo === idx
                    ? "bg-[var(--brand)] text-white shadow-xs font-bold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <p className="text-[10px] leading-none uppercase tracking-wider">
                  0{idx + 1}
                </p>
                <p className="hidden sm:block text-[11px] truncate mt-0.5">
                  {paso.badge}
                </p>
              </div>
            ))}
          </div>

          {/* TEXTO EXPLICATIVO SOLO MOBILE (DEBAJO DE LOS INDICADORES) */}
          <div className="mt-2 block lg:hidden text-center">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white">
              {PASOS_SEC[pasoActivo].titulo}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {PASOS_SEC[pasoActivo].detalle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}