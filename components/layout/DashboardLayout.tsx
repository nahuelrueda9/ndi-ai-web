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
    <div className="min-h-dvh bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
      <div className="flex min-h-dvh lg:[zoom:0.85]">
        <Sidebar />

        {/* Agregamos md:ml-72 para que el contenido respete exactamente el ancho del sidebar en laptops y tablets */}
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