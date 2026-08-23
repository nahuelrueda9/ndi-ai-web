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
    <div className="min-h-dvh w-full bg-zinc-950 flex justify-center overflow-x-hidden">
      {/* El transform translate-x-0 atrapa al Sidebar para que no se escape al borde de tu monitor de 1920px */}
      <div className="flex min-h-dvh w-full max-w-[1500px] transform translate-x-0 relative bg-slate-50 dark:bg-zinc-950 lg:[zoom:0.85] shadow-2xl">
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