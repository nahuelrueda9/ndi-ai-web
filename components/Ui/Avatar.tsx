"use client";

import type { HTMLAttributes } from "react";

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function initials(name: string) {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Avatar({
  name,
  src,
  size = "md",
  className = "",
  ...props
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={[
        sizes[size],
        "flex items-center justify-center rounded-full",
        "bg-gradient-to-br from-blue-600 to-violet-600",
        "font-semibold text-white select-none",
        className,
      ].join(" ")}
      {...props}
    >
      {initials(name)}
    </div>
  );
}