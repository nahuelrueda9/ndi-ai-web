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
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
        shadow-slate-200/40
        transition-all
        duration-200
        hover:border-slate-300

        sm:rounded-2xl
        sm:shadow-lg
        sm:shadow-slate-200/50

        dark:border-zinc-800
        dark:bg-zinc-900
        dark:shadow-black/15
        dark:hover:border-zinc-700

        sm:dark:shadow-black/20

        ${className}
      `}
    >
      {children}
    </div>
  );
}