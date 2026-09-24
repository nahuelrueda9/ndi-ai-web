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
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (!imagenes || imagenes.length <= 1) return;

    const timer = setInterval(() => {
      setIndice((prev) => (prev + 1) % imagenes.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [imagenes]);

  if (!imagenes || imagenes.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {imagenes.map((url, i) => (
        <div
          key={`${url}-${i}`}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            i === indice ? "opacity-100 scale-105" : "opacity-0 scale-100"
          }`}
          style={{
            backgroundImage: `url("${url}")`,
            transitionProperty: "opacity, transform",
            transitionDuration: "1200ms",
          }}
        />
      ))}

      {/* Capas oscuras para garantizar legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/50" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${colorPrincipal}66, transparent 60%)`,
        }}
      />
    </div>
  );
}