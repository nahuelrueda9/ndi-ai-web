export default function LogoHeaderDinamico({
  logoClaro,
  logoOscuro,
  nombre,
}: {
  logoClaro?: string;
  logoOscuro?: string;
  nombre: string;
}) {
  const blanco = logoClaro || logoOscuro;
  const negro = logoOscuro || logoClaro;

  if (!blanco && !negro) return null;

  return (
    <div className="relative flex items-center">
      {/* Si hay logo negro, se ve SOLO en modo claro */}
      {negro && (
        <img
          src={negro}
          alt={`Logo de ${nombre}`}
          className={`h-9 w-auto max-w-[100px] shrink-0 object-contain sm:h-11 sm:max-w-[140px] ${
            blanco ? "dark:hidden" : ""
          }`}
        />
      )}

      {/* El logo blanco se muestra automáticamente cuando se activa el modo oscuro */}
      {blanco && (
        <img
          src={blanco}
          alt={`Logo de ${nombre}`}
          className={`h-9 w-auto max-w-[100px] shrink-0 object-contain sm:h-11 sm:max-w-[140px] ${
            negro ? "hidden dark:block" : ""
          }`}
        />
      )}
    </div>
  );
}