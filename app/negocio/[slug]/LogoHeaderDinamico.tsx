"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

export default function LogoHeaderDinamico({
  logoClaro,
  logoOscuro,
  nombre,
}: {
  logoClaro?: string;
  logoOscuro?: string;
  nombre: string;
}) {
  const { theme } = useTheme();

  // Si está en modo oscuro usa el logo claro (blanco), si está en modo claro usa el logo oscuro (negro)
  const esModoOscuro = theme === "dark";
  const urlFinal = esModoOscuro
    ? (logoClaro || logoOscuro)
    : (logoOscuro || logoClaro);

  if (!urlFinal) return null;

  return (
    <img
      src={urlFinal}
      alt={`Logo de ${nombre}`}
      className="h-9 w-auto max-w-[100px] shrink-0 object-contain sm:h-11 sm:max-w-[140px] transition-opacity duration-200"
    />
  );
}