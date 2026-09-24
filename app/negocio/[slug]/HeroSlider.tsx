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
      {/* Imágenes nítidas sin opacidad ni filtros oscuros */}
      {imagenes.map((url, i) => (
        <div
          key={`${url}-${i}`}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
            i === indiceActual ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{
            backgroundImage: `url("${url}")`,
          }}
        />
      ))}

      {/* Puntos de paginación inferiores (dots estilo Veluno) */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-5 inset-x-0 flex justify-center items-center gap-2 pointer-events-auto z-20">
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
                  ? "w-6 bg-white shadow"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}