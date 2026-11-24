"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function TerminosPage() {
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
            <ShieldCheck className="w-4 h-4" /> Comunidad y Uso
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight">Términos y Condiciones</h1>
          <p className="text-xs text-slate-500">Paseando por ETS 2 — Actualizado a Noviembre de 2026</p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-slate-600 leading-relaxed">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-black">1. Naturaleza del Sitio</h2>
            <p><strong>Paseando por ETS 2</strong> es una plataforma lúdica, informativa y de comunidad orientada a los fanáticos del simulador Euro Truck Simulator 2, la compartición de rutas de larga distancia en Argentina (como Mapa Ceibo y Argenmap), skins y contenido multimedia propio del canal.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-black">2. Simulador de Boletería y Participación</h2>
            <p>La herramienta de selección de orígenes, destinos y empresas de transporte ("Boletería Interactiva") es un juego de simulación para unir a la comunidad en directos y publicaciones. No constituye la venta real de pasajes ni posee vinculación legal o comercial directa con las líneas de ómnibus reales que se mencionan a modo ilustrativo.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-black">3. Propiedad Intelectual y Mods</h2>
            <p>Los mods, marcas comerciales, nombres de empresas de colectivos y texturas pertenecen a sus respectivos creadores y dueños legales. El desarrollo de este sitio web y su interfaz comunitaria son propiedad exclusiva del canal.</p>
          </section>
        </div>
      </div>

      <footer className="mt-16 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
        <p>© 2026 Paseando por ETS 2 — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}