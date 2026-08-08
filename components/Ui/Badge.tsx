"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

type BadgeProps =
  HTMLAttributes<HTMLSpanElement> & {
    children: ReactNode;
    variant?: BadgeVariant;
  };

const variantClasses: Record<
  BadgeVariant,
  string
> = {
  default:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",

  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",

  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",

  danger:
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",

  info:
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",

  purple:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-xs font-medium leading-none",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}