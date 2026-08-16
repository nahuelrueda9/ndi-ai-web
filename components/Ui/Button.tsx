"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  };

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500",

  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500",

  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",

  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-400 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-zinc-500",
};

const sizeClasses: Record<
  ButtonSize,
  string
> = {
  sm: "h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-sm",
  md: "h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm",
  lg: "h-10 px-4 text-sm sm:h-12 sm:px-5 sm:text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium sm:gap-2 sm:rounded-xl",
        "transition duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}