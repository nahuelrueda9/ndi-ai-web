"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // Delay opcional en milisegundos si querés efecto escalonado
}

export function RevealOnScroll({ children, className = "", delay = 0 }: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // Se anima una sola vez al aparecer
        }
      },
      {
        threshold: 0.12, // Se activa apenas asoma un 12% del bloque en pantalla
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} ${isVisible ? "reveal-visible" : "reveal-hidden"}`}
    >
      {children}
    </div>
  );
}