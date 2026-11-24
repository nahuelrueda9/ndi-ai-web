"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificamos si el usuario ya aceptó las cookies previamente
    const cookieAccepted = localStorage.getItem("cookies_accepted");
    if (!cookieAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 sm:p-5 flex flex-col gap-3 animate-fadeIn">
      <div className="flex flex-col gap-1">
        <h4 className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">Aviso de Privacidad y Cookies</h4>
        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
          Utilizamos cookies y almacenamiento local para garantizar el funcionamiento de la boletería interactiva y mejorar tu experiencia de navegación. Conocé más en nuestra{" "}
          <Link href="/paseandoporets2/privacidad.html" className="text-black font-bold underline hover:text-[#75AADB]">
            Política de Privacidad
          </Link>.
        </p>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={handleAccept}
          className="w-full bg-black hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
        >
          Aceptar y continuar
        </button>
      </div>
    </div>
  );
}