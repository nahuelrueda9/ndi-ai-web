"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// EL SECRETO ESTÁ EN ESTA LÍNEA (tiene que decir "export default function")
export default function BotonTema({ temaInicial = "oscuro" }: { temaInicial?: string }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const temaGuardado = localStorage.getItem("tema-cliente");
    
    const esOscuro = temaGuardado ? temaGuardado === "oscuro" : temaInicial !== "claro";
    
    setIsDark(esOscuro);
    if (esOscuro) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [temaInicial]);

  const toggle = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema-cliente", "claro");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema-cliente", "oscuro");
      setIsDark(true);
    }
  };

  if (!mounted) return <div className="h-9 w-9 sm:h-10 sm:w-10"></div>;

  return (
    <button
      onClick={toggle}
      aria-label="Alternar modo oscuro"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white sm:h-10 sm:w-10"
    >
      {isDark ? <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
    </button>
  );
}