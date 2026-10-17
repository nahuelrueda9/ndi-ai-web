"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import Header from "./Header";
import Sidebar from "./Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const params = useParams();
  const parametroEmpresa = params.id ?? params.empresaId;
  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
      <div className="flex min-h-dvh">
        <Sidebar />

        {/* Solo aplica el margen izquierdo de 288px (md:ml-72) si estás dentro de una empresa */}
        <div
          className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
            empresaId ? "md:ml-72" : "ml-0"
          }`}
        >
          <Header />

          <main className="w-full min-w-0 flex-1 bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}