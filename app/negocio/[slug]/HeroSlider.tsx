"use client";

import { useEffect, useState } from "react";

export default function HeroSlider({
  imagenes,
  nombre,
  colorPrincipal,
  onChangeSlide,
}: {
  imagenes: string[];
  nombre: string;
  colorPrincipal: string;
  onChangeSlide?: (indice: number) => void;
}) {
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    if (!imagenes || imagenes.length <= 1) return;

    const timer = setInterval(() => {
      setIndiceActual((prev) => {
        const siguiente = (prev + 1) % imagenes.length;
        onChangeSlide?.(siguiente);
        return siguiente;
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [imagenes, onChangeSlide]);

  if (!imagenes || imagenes.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Imágenes en transición suave */}
      {imagenes.map((url, i) => (
        <div
          key={`${url}-${i}`}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
            i === indiceActual ? "opacity-100 scale-105" : "opacity-0 scale-100"
          }`}
          style={{
            backgroundImage: `url("${url}")`,
          }}
        />
      ))}

      {/* Degradado para legibilidad del texto en la izquierda e inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 sm:bg-gradient-to-r sm:from-black/85 sm:via-black/50 sm:to-transparent" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${colorPrincipal}55, transparent 70%)`,
        }}
      />

      {/* Puntos de paginación inferiores (dots) */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-2 pointer-events-auto z-20">
          {imagenes.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              onClick={() => {
                setIndiceActual(i);
                onChangeSlide?.(i);
              }}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === indiceActual
                  ? "w-7 bg-white shadow-md"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}