"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export default function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={[
          "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5",
          "text-sm text-slate-900 placeholder:text-slate-400",
          "transition-colors duration-200",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          "dark:border-zinc-700 dark:bg-zinc-900",
          "dark:text-white dark:placeholder:text-zinc-500",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
            : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}