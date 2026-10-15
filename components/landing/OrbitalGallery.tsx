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

// Grilla limpia con patrón de ladrillo
const ITEMS_GRID_PC = [
  // Fila Y = -2
  { x: -6, y: -2 }, { x: -4, y: -2 }, { x: -2, y: -2 }, { x: 0, y: -2 }, { x: 2, y: -2 }, { x: 4, y: -2 }, { x: 6, y: -2 },
  // Fila Y = -1
  { x: -7, y: -1 }, { x: -5, y: -1 }, { x: -3, y: -1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 3, y: -1 }, { x: 5, y: -1 }, { x: 7, y: -1 },
  // Fila Y = 0 (Ecuador)
  { x: -6, y: 0 }, { x: -4, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 },
  // Fila Y = 1
  { x: -7, y: 1 }, { x: -5, y: 1 }, { x: -3, y: 1 }, { x: -1, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 },
  // Fila Y = 2
  { x: -6, y: 2 }, { x: -4, y: 2 }, { x: -2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 6, y: 2 },
];

const ITEMS_GRID_MOBILE = [
  // 3 filas limpias y densas sin solapamiento
  { x: -4, y: -1 }, { x: -2, y: -1 }, { x: 0, y: -1 }, { x: 2, y: -1 }, { x: 4, y: -1 },
  { x: -5, y: 0 }, { x: -3, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 5, y: 0 },
  { x: -4, y: 1 }, { x: -2, y: 1 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 4, y: 1 },
];

export function OrbitalGallery() {
  const sphereRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imagenEnlarged, setImagenEnlarged] = useState<string | null>(null);
  const [enlarging, setEnlarging] = useState(false);
  const [esMobile, setEsMobile] = useState(false);

  const stateRef = useRef({
    rotation: { x: 0, y: 0 },
    startRotation: { x: 0, y: 0 },
    isDragging: false,
    startX: 0,
    startY: 0,
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

  // Proporciones matemáticas para que las fotos sean grandes y tupidas
  const RADIUS_PX = esMobile ? 700 : 1300;
  const STEP_DEG_X = esMobile ? 6.2 : 5.1;
  const STEP_DEG_Y = esMobile ? 6.2 : 5.1;
  const itemsActuales = esMobile ? ITEMS_GRID_MOBILE : ITEMS_GRID_PC;

  useEffect(() => {
    const sphere = sphereRef.current;
    const container = containerRef.current;
    if (!sphere || !container) return;

    const MAX_POLAR_ROT_DEG = 3;
    const PAN_SENSITIVITY = esMobile ? 12 : 15;

    const applyTransform = () => {
      sphere.style.transform = `translateZ(-${RADIUS_PX}px) rotateX(${stateRef.current.rotation.x}deg) rotateY(${stateRef.current.rotation.y}deg)`;
    };

    applyTransform();

    const stopInertia = () => {
      if (stateRef.current.inertiaFrame) {
        cancelAnimationFrame(stateRef.current.inertiaFrame);
        stateRef.current.inertiaFrame = null;
      }
    };

    const startInertia = (velocityX: number, velocityY: number) => {
      let vx = velocityX * 70;
      let vy = velocityY * 70;
      const friction = 0.92;
      const minVelocity = 0.08;
      const maxFrames = 120;
      let frameCount = 0;

      const step = () => {
        vx *= friction;
        vy *= friction;

        if (Math.abs(vx) < minVelocity && Math.abs(vy) < minVelocity) {
          stateRef.current.inertiaFrame = null;
          return;
        }

        const proposedX = stateRef.current.rotation.x - vy / 200;
        stateRef.current.rotation.x = Math.min(Math.max(proposedX, -MAX_POLAR_ROT_DEG), MAX_POLAR_ROT_DEG);
        stateRef.current.rotation.y += vx / 200;

        applyTransform();

        frameCount++;
        if (frameCount > maxFrames) {
          stateRef.current.inertiaFrame = null;
          return;
        }
        stateRef.current.inertiaFrame = requestAnimationFrame(step);
      };

      stopInertia();
      stateRef.current.inertiaFrame = requestAnimationFrame(step);
    };

    let lastTime = 0;
    let lastX = 0;
    let lastY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.cancelTap = false;
      stopInertia();
      stateRef.current.startX = e.clientX;
      stateRef.current.startY = e.clientY;
      stateRef.current.startRotation.x = stateRef.current.rotation.x;
      stateRef.current.startRotation.y = stateRef.current.rotation.y;
      lastTime = Date.now();
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!stateRef.current.isDragging) return;
      const deltaX = e.clientX - stateRef.current.startX;
      const deltaY = e.clientY - stateRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 6) {
        stateRef.current.cancelTap = true;
      }

      const proposedX = stateRef.current.startRotation.x - deltaY / PAN_SENSITIVITY;
      stateRef.current.rotation.y = stateRef.current.startRotation.y + deltaX / PAN_SENSITIVITY;
      stateRef.current.rotation.x = Math.min(Math.max(proposedX, -MAX_POLAR_ROT_DEG), MAX_POLAR_ROT_DEG);

      applyTransform();

      lastTime = Date.now();
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!stateRef.current.isDragging) return;
      stateRef.current.isDragging = false;
      const now = Date.now();
      const dt = Math.max(now - lastTime, 16);
      const velocityX = (e.clientX - lastX) / dt;
      const velocityY = (e.clientY - lastY) / dt;

      startInertia(velocityX, velocityY);
      setTimeout(() => {
        stateRef.current.cancelTap = false;
      }, 120);
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
  }, [RADIUS_PX, esMobile]);

  const handleImageClick = (src: string, e: React.MouseEvent) => {
    if (stateRef.current.cancelTap) return;
    e.stopPropagation();
    setImagenEnlarged(src);
    setTimeout(() => setEnlarging(true), 40);
  };

  const handleCloseViewer = () => {
    setEnlarging(false);
    setTimeout(() => setImagenEnlarged(null), 280);
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[560px] md:h-[620px] flex items-center justify-center select-none overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center touch-none [perspective:2400px] cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div
          ref={sphereRef}
          className="absolute w-0 h-0 [transform-style:preserve-3d] transition-transform duration-75"
          style={{
            transform: `translateZ(-${RADIUS_PX}px) rotateX(0deg) rotateY(0deg)`,
          }}
        >
          {itemsActuales.map((coord, idx) => {
            const imgSrc = IMAGENES_PORTFOLIO[idx % IMAGENES_PORTFOLIO.length];
            return (
              <div
                key={idx}
                onClick={(e) => handleImageClick(imgSrc, e)}
                // Tarjetas grandes: 135px en celular y 225px en PC
                className="absolute -top-[999px] -bottom-[999px] -left-[999px] -right-[999px] m-auto w-[135px] h-[135px] sm:w-[190px] sm:h-[190px] md:w-[225px] md:h-[225px] cursor-pointer transition-transform duration-200 hover:scale-[1.05] hover:z-20"
                style={{
                  transform: `rotateY(${coord.x * STEP_DEG_X}deg) rotateX(${coord.y * STEP_DEG_Y}deg) translateZ(${RADIUS_PX}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Contenedor sin backface-hidden para eliminar los cortes triangulares en esquinas */}
                <div
                  className="absolute inset-1 sm:inset-1.5 rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-md border border-black/5 dark:border-white/10"
                  style={{
                    transform: "translate3d(0,0,0)",
                    WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                  }}
                >
                  <img
                    src={imgSrc}
                    alt={`Trabajo de diseño gráfico ${idx + 1}`}
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none"
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