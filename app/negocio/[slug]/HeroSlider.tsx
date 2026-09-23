"use client";

import { useEffect, useState } from "react";

export default function HeroSlider({
  imagenes,
  nombre,
  colorPrincipal,
}: {
  imagenes: string[];
  nombre: string;
  colorPrincipal: string;
}) {
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    if (imagenes.length <= 1) return;

    // Cambia de imagen cada 5 segundos con fade suave
    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % imagenes.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  if (imagenes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {imagenes.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={url}
          alt={`Portada ${i + 1} de ${nombre}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === indiceActual ? "opacity-100 scale-105" : "opacity-0 scale-100"
          }`}
          style={{ transitionDuration: "1200ms" }}
        />
      ))}

      {/* Capas oscuras para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${colorPrincipal}66, transparent 60%)`,
        }}
      />
    </div>
  );
}