"use client";

import { useEffect, useState, ReactNode } from "react";

interface HeaderFlotanteProps {
  children: ReactNode;
  slug?: string;
}

export default function HeaderFlotante({ children, slug }: HeaderFlotanteProps) {
  const [scrolled, setScrolled] = useState(false);
  const esEdduBarber = slug === "eddu-barber";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 h-16 transition-all duration-300 ${
        scrolled
          ? `translate-y-0 opacity-100 pointer-events-auto ${
              esEdduBarber
                ? "bg-black border-0 shadow-none"
                : "bg-[#f8f9fa]/90 backdrop-blur-xl dark:bg-[#0c0d0e]/90 border-b border-slate-200/40 dark:border-zinc-800/40"
            }`
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className={`h-full w-full ${esEdduBarber ? "bg-black" : ""}`}>
        {children}
      </div>
    </header>
  );
}