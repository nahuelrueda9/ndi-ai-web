"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type NavItemProps = {
  label: string;
  href: string;
  icon: LucideIcon;
  activo: boolean;
};

export default function NavItem({
  label,
  href,
  icon: Icon,
  activo,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={
        activo
          ? "flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-blue-950/20 transition dark:shadow-blue-950/40"
          : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      }
    >
      <Icon className="h-5 w-5 shrink-0" />

      <span>{label}</span>
    </Link>
  );
}