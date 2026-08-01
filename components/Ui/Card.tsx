"use client";

import { ReactNode } from "react";

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
        border-zinc-800
        bg-zinc-900
        shadow-lg
        shadow-black/20
        transition-all
        duration-200
        hover:border-zinc-700
        ${className}
      `}
    >
      {children}
    </div>
  );
}