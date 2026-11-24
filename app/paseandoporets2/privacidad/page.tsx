"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-6 md:px-12 flex flex-col justify-between selection:bg-[#75AADB] selection:text-white">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
        <div>
          <Link href="/paseandoporets2" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-black bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-2xl transition-all">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>

        <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#75AADB]/10 text-[#75AADB] px-3.5 py-1.5 rounded-full text-xs font-bold w-fit border border-[#75AADB]/20">
            <Lock className="w-4 h-4" /> Privacidad de Datos
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight">Política de Privacidad</h1>
          <p className="text-xs text-slate-500">Paseando por ETS 2 — Actualizado a Noviembre de 2026</p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-slate-600 leading-relaxed">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-black">1. Datos Recopilados</h2>
            <p>Al utilizar la boletería interactiva y confirmar tu viaje para unirte a la fila comunitaria, únicamente registramos de forma temporal los datos elegidos (origen, destino, empresa de transporte seleccionada) en nuestra base de datos conectada a Firebase.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-black">2. Uso de la Información</h2>
            <p>Los datos ingresados se emplean exclusivamente con fines estadísticos y recreativos dentro de la web (mostrar los pasajes recientes de la comunidad y actualizar el ranking dinámico de empresas preferidas).</p>
          </section>
        </div>
      </div>

      <footer className="mt-16 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
        <p>© 2026 Paseando por ETS 2 — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}