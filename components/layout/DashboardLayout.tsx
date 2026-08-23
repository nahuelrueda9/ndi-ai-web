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
    <div className="min-h-dvh w-full bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
      <div className="flex min-h-dvh w-full lg:[zoom:0.85]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col md:ml-72 w-full">
          <Header />

          <main className="min-w-0 flex-1 w-full bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}