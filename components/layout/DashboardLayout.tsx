"use client";

import type { ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    /* Contenedor que centra toda la app y maneja el fondo oscuro */
    <div className="min-h-dvh w-full bg-zinc-950 flex justify-center overflow-x-hidden">
      
      /* 
         1. transform translate-x-0: Obliga al Sidebar fijo a quedarse anclado a esta caja y no a la pantalla (elimina el hueco).
         2. lg:[zoom:0.85]: Recupera la escala perfecta para que las tarjetas tengan espacio y los botones no se rompan.
         3. w-full max-w-[1920px]: Da un ancho total amplio pero contenido, dejando márgenes negros simétricos y mínimos.
      */
      <div className="flex min-h-dvh w-full max-w-[1920px] transform translate-x-0 relative bg-slate-50 dark:bg-zinc-950 lg:[zoom:0.85] shadow-2xl">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col md:ml-72">
          <Header />

          <main className="min-w-0 flex-1 bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}