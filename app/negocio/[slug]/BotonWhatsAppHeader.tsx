"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export default function BotonWhatsAppHeader({
  whatsappUrl,
}: {
  whatsappUrl: string;
}) {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const manejarScroll = () => {
      // Aparece cuando el usuario baja más de 320px (pasa la portada)
      if (window.scrollY > 320) {
        setMostrar(true);
      } else {
        setMostrar(false);
      }
    };

    window.addEventListener("scroll", manejarScroll, { passive: true });
    return () => window.removeEventListener("scroll", manejarScroll);
  }, []);

  return (
    <a
      href={whatsappUrl}
      data-analytics-event="whatsapp_click"
      target="_blank"
      rel="noopener noreferrer"
      className={`hidden items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-emerald-500 active:scale-95 sm:inline-flex ${
        mostrar
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </a>
  );
}