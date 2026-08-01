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
          className="block text-sm font-medium text-zinc-200"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={[
          "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5",
          "text-sm text-white placeholder:text-zinc-500",
          "transition-colors duration-200",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  );
}