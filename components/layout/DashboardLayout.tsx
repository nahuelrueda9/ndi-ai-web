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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <div className="min-h-screen md:pl-72">
        <Header />

        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}