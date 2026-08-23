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
      <div className="flex min-h-dvh">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col md:ml-72">
          <Header />

          <main className="min-w-0 flex-1 bg-slate-50 text-slate-950 transition-colors dark:bg-zinc-950 dark:text-white">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}