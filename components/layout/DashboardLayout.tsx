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
    <div className="min-h-dvh w-full bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white flex justify-center">
      {/* Contenedor general centrado que limita el ancho máximo en pantallas grandes y deja márgenes iguales */}
      <div className="relative flex min-h-dvh w-full max-w-[1440px] mx-auto bg-slate-50 dark:bg-zinc-950 shadow-2xl">
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