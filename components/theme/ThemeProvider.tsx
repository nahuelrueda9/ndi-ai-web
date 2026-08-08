"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "system" | "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const guardado = localStorage.getItem(
      "ndi-theme"
    ) as Theme | null;

    if (
      guardado === "light" ||
      guardado === "dark" ||
      guardado === "system"
    ) {
      setThemeState(guardado);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function aplicarTema() {
      const usarOscuro =
        theme === "dark" ||
        (theme === "system" && media.matches);

      document.documentElement.classList.toggle(
        "dark",
        usarOscuro
      );

      document.documentElement.dataset.theme =
        usarOscuro ? "dark" : "light";
    }

    aplicarTema();

    if (theme === "system") {
      media.addEventListener("change", aplicarTema);
    }

    return () => {
      media.removeEventListener("change", aplicarTema);
    };
  }, [theme]);

  function setTheme(nuevoTema: Theme) {
    setThemeState(nuevoTema);
    localStorage.setItem("ndi-theme", nuevoTema);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const contexto = useContext(ThemeContext);

  if (!contexto) {
    throw new Error(
      "useTheme debe utilizarse dentro de ThemeProvider"
    );
  }

  return contexto;
}