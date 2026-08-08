"use client";

import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-lg
        shadow-slate-200/50
        transition-all
        duration-200
        hover:border-slate-300

        dark:border-zinc-800
        dark:bg-zinc-900
        dark:shadow-black/20
        dark:hover:border-zinc-700

        ${className}
      `}
    >
      {children}
    </div>
  );
}