"use client";

import React, { useEffect, useRef, useState } from "react";

const IMAGENES_PORTFOLIO = [
  "/portfolio/imagen1.jpg",
  "/portfolio/imagen2.jpg",
  "/portfolio/imagen3.jpg",
  "/portfolio/imagen4.jpg",
  "/portfolio/imagen5.jpg",
  "/portfolio/imagen6.jpg",
  "/portfolio/imagen7.jpg",
  "/portfolio/imagen8.jpg",
  "/portfolio/imagen9.jpg",
  "/portfolio/imagen10.jpg",
  "/portfolio/imagen11.jpg",
  "/portfolio/imagen12.jpg",
  "/portfolio/imagen13.jpg",
  "/portfolio/imagen14.jpg",
  "/portfolio/imagen15.jpg",
  "/portfolio/imagen16.jpg",
  "/portfolio/imagen17.jpg",
  "/portfolio/imagen18.png",
  "/portfolio/imagen19.png",
  "/portfolio/imagen20.png",
];

// Distribución cilíndrica pura: sin rotateX para evitar colisiones 3D
const ITEMS_GRID_PC = [
  // Fila superior (-2)
  { col: -6, row: -2 }, { col: -4, row: -2 }, { col: -2, row: -2 }, { col: 0, row: -2 }, { col: 2, row: -2 }, { col: 4, row: -2 }, { col: 6, row: -2 },
  // Fila intermedia alta (-1)
  { col: -7, row: -1 }, { col: -5, row: -1 }, { col: -3, row: -1 }, { col: -1, row: -1 }, { col: 1, row: -1 }, { col: 3, row: -1 }, { col: 5, row: -1 }, { col: 7, row: -1 },
  // Fila central (0 - Ecuador)
  { col: -6, row: 0 }, { col: -4, row: 0 }, { col: -2, row: 0 }, { col: 0, row: 0 }, { col: 2, row: 0 }, { col: 4, row: 0 }, { col: 6, row: 0 },
  // Fila intermedia baja (1)
  { col: -7, row: 1 }, { col: -5, row: 1 }, { col: -3, row: 1 }, { col: -1, row: 1 }, { col: 1, row: 1 }, { col: 3, row: 1 }, { col: 5, row: 1 }, { col: 7, row: 1 },
  // Fila inferior (2)
  { col: -6, row: 2 }, { col: -4, row: 2 }, { col: -2, row: 2 }, { col: 0, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 2 }, { col: 6, row: 2 },
];

const ITEMS_GRID_MOBILE = [
  // 3 filas tupidas para celular
  { col: -4, row: -1 }, { col: -2, row: -1 }, { col: 0, row: -1 }, { col: 2, row: -1 }, { col: 4, row: -1 },
  { col: -5, row: 0 }, { col: -3, row: 0 }, { col: -1, row: 0 }, { col: 1, row: 0 }, { col: 3, row: 0 }, { col: 5, row: 0 },
  { col: -4, row: 1 }, { col: -2, row: 1 }, { col: 0, row: 1 }, { col: 2, row: 1 }, { col: 4, row: 1 },
];

export function OrbitalGallery() {
  const sphereRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imagenEnlarged, setImagenEnlarged] = useState<string | null>(null);
  const [enlarging, setEnlarging] = useState(false);
  const [esMobile, setEsMobile] = useState(false);

  const stateRef = useRef({
    rotationY: 0,
    startRotationY: 0,
    isDragging: false,
    startX: 0,
    inertiaFrame: null as number | null,
    cancelTap: false,
  });

  useEffect(() => {
    const checkMobile = () => {
      setEsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Radio y proporciones
  const RADIUS_PX = esMobile ? 740 : 1320;
  const STEP_DEG = esMobile ? 6.2 : 5.1;
  const ROW_HEIGHT = esMobile ? 142 : 210;

  // LÍMITES ESTRICTOS: no deja rotar más allá de esto
  const MAX_PAN_X = esMobile ? 12 : 18;
  const itemsActuales = esMobile ? ITEMS_GRID_MOBILE : ITEMS_GRID_PC;

  useEffect(() => {
    const sphere = sphereRef.current;
    const container = containerRef.current;
    if (!sphere || !container) return;

    const applyTransform = () => {
      sphere.style.transform = `translateZ(-${RADIUS_PX}px) rotateY(${stateRef.current.rotationY}deg)`;
    };

    applyTransform();

    const stopInertia = () => {
      if (stateRef.current.inertiaFrame) {
        cancelAnimationFrame(stateRef.current.inertiaFrame);
        stateRef.current.inertiaFrame = null;
      }
    };

    const startInertia = (velocityX: number) => {
      let vx = velocityX * 45;
      const friction = 0.88;
      const minVelocity = 0.08;

      const step = () => {
        vx *= friction;

        if (Math.abs(vx) < minVelocity) {
          stateRef.current.inertiaFrame = null;
          return;
        }

        const nuevoY = stateRef.current.rotationY + vx / 200;
        if (nuevoY > MAX_PAN_X) {
          stateRef.current.rotationY = MAX_PAN_X;
          applyTransform();
          stateRef.current.inertiaFrame = null;
          return;
        } else if (nuevoY < -MAX_PAN_X) {
          stateRef.current.rotationY = -MAX_PAN_X;
          applyTransform();
          stateRef.current.inertiaFrame = null;
          return;
        }

        stateRef.current.rotationY = nuevoY;
        applyTransform();
        stateRef.current.inertiaFrame = requestAnimationFrame(step);
      };

      stopInertia();
      stateRef.current.inertiaFrame = requestAnimationFrame(step);
    };

    let lastTime = 0;
    let lastX = 0;

    const handlePointerDown = (e: PointerEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.cancelTap = false;
      stopInertia();
      stateRef.current.startX = e.clientX;
      stateRef.current.startRotationY = stateRef.current.rotationY;
      lastTime = Date.now();
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!stateRef.current.isDragging) return;
      const deltaX = e.clientX - stateRef.current.startX;

      if (Math.abs(deltaX) > 6) {
        stateRef.current.cancelTap = true;
      }

      const propuesto = stateRef.current.startRotationY + deltaX / (esMobile ? 12 : 16);
      stateRef.current.rotationY = Math.min(Math.max(propuesto, -MAX_PAN_X), MAX_PAN_X);
      applyTransform();

      lastTime = Date.now();
      lastX = e.clientX;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!stateRef.current.isDragging) return;
      stateRef.current.isDragging = false;
      const now = Date.now();
      const dt = Math.max(now - lastTime, 16);
      const velocityX = (e.clientX - lastX) / dt;

      startInertia(velocityX);
      setTimeout(() => {
        stateRef.current.cancelTap = false;
      }, 100);
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      stopInertia();
    };
  }, [RADIUS_PX, MAX_PAN_X, esMobile]);

  const handleImageClick = (src: string, e: React.MouseEvent) => {
    if (stateRef.current.cancelTap) return;
    e.stopPropagation();
    setImagenEnlarged(src);
    setTimeout(() => setEnlarging(true), 40);
  };

  const handleCloseViewer = () => {
    setEnlarging(false);
    setTimeout(() => setImagenEnlarged(null), 250);
  };

  return (
    // Altura amplia para que la primera fila no choque con nada
    <div className="relative w-full h-[410px] sm:h-[620px] md:h-[680px] flex items-center justify-center select-none overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center touch-none [perspective:2200px] cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div
          ref={sphereRef}
          className="absolute w-0 h-0 [transform-style:preserve-3d] transition-transform duration-75"
          style={{
            transform: `translateZ(-${RADIUS_PX}px) rotateY(0deg)`,
          }}
        >
          {itemsActuales.map((coord, idx) => {
            const imgSrc = IMAGENES_PORTFOLIO[idx % IMAGENES_PORTFOLIO.length];
            return (
              <div
                key={idx}
                onClick={(e) => handleImageClick(imgSrc, e)}
                // Tarjetas grandes: 152px en celular y 225px en PC
                className="absolute -top-[999px] -bottom-[999px] -left-[999px] -right-[999px] m-auto w-[152px] h-[152px] sm:w-[195px] sm:h-[195px] md:w-[225px] md:h-[225px] cursor-pointer transition-transform duration-200 hover:scale-[1.05] hover:z-20"
                style={{
                  transform: `rotateY(${coord.col * STEP_DEG}deg) translateY(${coord.row * ROW_HEIGHT}px) translateZ(${RADIUS_PX}px)`,
                }}
              >
                <div className="w-full h-full p-1 sm:p-1.5">
                  <img
                    src={imgSrc}
                    alt={`Trabajo de diseño gráfico ${idx + 1}`}
                    draggable={false}
                    className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-md border border-black/5 dark:border-white/10 pointer-events-none bg-zinc-200 dark:bg-zinc-800"
                    onError={(e) => {
                      e.currentTarget.src = "/portfolio/imagen1.jpg";
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL ZOOM */}
      {imagenEnlarged && (
        <div
          onClick={handleCloseViewer}
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-10 transition-opacity duration-300 ${
            enlarging ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />

          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-2xl sm:max-w-3xl max-h-[82vh] w-auto h-auto rounded-3xl sm:rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300 ${
              enlarging ? "scale-100 translate-y-0" : "scale-95 translate-y-3"
            }`}
          >
            <button
              onClick={handleCloseViewer}
              aria-label="Cerrar vista"
              className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
            >
              ✕
            </button>
            <img
              src={imagenEnlarged}
              alt="Detalle de diseño gráfico ampliado"
              className="max-h-[78vh] sm:max-h-[80vh] w-auto object-contain rounded-3xl sm:rounded-[32px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}