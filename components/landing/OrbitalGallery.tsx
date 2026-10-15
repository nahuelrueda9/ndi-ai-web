"use client";

import React, { useEffect, useRef, useState } from "react";

// Las 20 imágenes reales del portfolio de Nahuel
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

// Coordenadas esféricas distribuidas en la malla (similar al código original)
const COORDINADAS_ESFERA = [
  { x: -37, y: -4 }, { x: -37, y: -2 }, { x: -37, y: 0 }, { x: -37, y: 2 }, { x: -37, y: 4 },
  { x: -35, y: -3 }, { x: -35, y: -1 }, { x: -35, y: 1 }, { x: -35, y: 3 }, { x: -35, y: 5 },
  { x: -33, y: -4 }, { x: -33, y: -2 }, { x: -33, y: 0 }, { x: -33, y: 2 }, { x: -33, y: 4 },
  { x: -31, y: -3 }, { x: -31, y: -1 }, { x: -31, y: 1 }, { x: -31, y: 3 }, { x: -31, y: 5 },
];

export function OrbitalGallery() {
  const sphereRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  const [imagenEnlarged, setImagenEnlarged] = useState<string | null>(null);
  const [enlarging, setEnlarging] = useState(false);

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
    const sphere = sphereRef.current;
    const main = mainRef.current;
    if (!sphere || !main) return;

    const MAX_POLAR_ROT_DEG = 3;
    const PAN_SENSITIVITY = 18;

    const applyTransform = () => {
      sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${stateRef.current.rotation.x}deg) rotateY(${stateRef.current.rotation.y}deg)`;
    };

    const stopInertia = () => {
      if (stateRef.current.inertiaFrame) {
        cancelAnimationFrame(stateRef.current.inertiaFrame);
        stateRef.current.inertiaFrame = null;
      }
    };

    const startInertia = (velocityX: number, velocityY: number) => {
      let vx = velocityX * 80;
      let vy = velocityY * 80;
      const friction = 0.92;
      const minVelocity = 0.1;
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

    // Manejo de eventos Pointer nativos (mouse y touch unificados)
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

      if (Math.hypot(deltaX, deltaY) > 5) {
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
      }, 150);
    };

    main.addEventListener("pointerdown", handlePointerDown);
    main.addEventListener("pointermove", handlePointerMove);
    main.addEventListener("pointerup", handlePointerUp);

    return () => {
      main.removeEventListener("pointerdown", handlePointerDown);
      main.removeEventListener("pointermove", handlePointerMove);
      main.removeEventListener("pointerup", handlePointerUp);
      stopInertia();
    };
  }, []);

  const handleImageClick = (src: string, e: React.MouseEvent) => {
    if (stateRef.current.cancelTap) return;
    e.stopPropagation();
    setImagenEnlarged(src);
    setTimeout(() => setEnlarging(true), 50);
  };

  const handleCloseViewer = () => {
    setEnlarging(false);
    setTimeout(() => setImagenEnlarged(null), 300);
  };

  return (
    <div className="relative w-full h-[650px] md:h-[750px] overflow-hidden rounded-3xl bg-zinc-950 flex items-center justify-center select-none">
      <main ref={mainRef} className="absolute inset-0 flex items-center justify-center overflow-hidden touch-none [perspective:2600px]">
        {/* ESFERA 3D */}
        <div
          ref={sphereRef}
          className="absolute w-0 h-0 [transform-style:preserve-3d]"
          style={{
            transform: "translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(0deg)",
          }}
        >
          {COORDINADAS_ESFERA.map((coord, idx) => {
            const imgSrc = IMAGENES_PORTFOLIO[idx % IMAGENES_PORTFOLIO.length];
            return (
              <div
                key={idx}
                onClick={(e) => handleImageClick(imgSrc, e)}
                className="item absolute -top-[999px] -bottom-[999px] -left-[999px] -right-[999px] m-auto w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] cursor-pointer backface-hidden [transform-style:preserve-3d] transition-transform duration-300 hover:scale-105"
                style={
                  {
                    "--offset-x": coord.x,
                    "--offset-y": coord.y,
                    "--item-size-x": 2,
                    "--item-size-y": 2,
                    transform: `rotateY(calc(10deg * ${coord.x})) rotateX(calc(10deg * ${coord.y})) translateZ(1200px)`,
                  } as React.CSSProperties
                }
              >
                <div className="absolute inset-[10px] rounded-[28px] overflow-hidden bg-zinc-900 border border-white/10 shadow-lg backface-hidden">
                  <img
                    src={imgSrc}
                    alt={`Trabajo NDI ${idx + 1}`}
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none backface-hidden"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* GRADIENTES Y MÁSCARAS DE VIÑETA */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_40%,rgba(10,10,10,0.85)_90%)] pointer-events-none z-10" />
      </main>

      {/* VIEWER DE ZOOM EN PRIMER PLANO (SIN BORDES BLANCOS) */}
      {imagenEnlarged && (
        <div
          ref={viewerRef}
          onClick={handleCloseViewer}
          className={`absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-12 transition-opacity duration-300 ${
            enlarging ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Scrim con blur */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Marco de imagen flotante puramente redondeado */}
          <div
            ref={frameRef}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-4xl max-h-[85vh] w-full aspect-[16/10] sm:aspect-[16/9] rounded-[32px] overflow-hidden bg-zinc-900 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-300 ${
              enlarging ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            }`}
          >
            <button
              onClick={handleCloseViewer}
              aria-label="Cerrar vista"
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/90 transition"
            >
              ✕
            </button>
            <img
              src={imagenEnlarged}
              alt="Proyecto ampliado en detalle"
              className="w-full h-full object-cover bg-zinc-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}