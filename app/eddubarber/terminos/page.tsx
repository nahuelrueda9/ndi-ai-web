import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Eddu Barber",
  description: "Términos y condiciones de uso y políticas de reserva de Eddu Barber.",
};

export default function TerminosEdduPage() {
  return (
    <main className="min-h-screen bg-[#0c0d0e] text-zinc-100 antialiased py-12 px-4 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Botón Volver */}
        <Link
          href="/eddubarber"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Eddu Barber
        </Link>

        {/* Encabezado */}
        <header className="border-b border-zinc-800 pb-6 space-y-2">
          <div className="flex items-center gap-2 text-[#ED192D]">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Aviso Legal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
            Términos y Condiciones
          </h1>
          <p className="text-xs text-zinc-400">
            Última actualización: {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </p>
        </header>

        {/* Contenido */}
        <article className="space-y-6 text-sm leading-relaxed text-zinc-300">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Reservas de Turnos</h2>
            <p>
              Al realizar una reserva en línea a través de nuestro sitio web, el cliente se compromete a asistir en el día y horario seleccionado. Agradecemos puntualidad para poder brindar una atención de calidad a todos los clientes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Política de Cancelación y Tolerancia</h2>
            <p>
              En caso de no poder asistir, solicitamos cancelar o reprogramar el turno con al menos 2 horas de anticipación. Se contempla una tolerancia máxima de 10 minutos de demora; pasado ese lapso, el turno podrá ser cancelado para no perjudicar a los siguientes clientes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Señas y Pagos</h2>
            <p>
              En caso de requerirse una seña previa para confirmar la reserva, el monto abonado se descontará del total del servicio en el local. Las señas no son reembolsables si la cancelación se realiza fuera del plazo establecido o ante la inasistencia sin aviso previo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Protección de Datos y Privacidad</h2>
            <p>
              Los datos personales solicitados (nombre, teléfono y correo electrónico) son utilizados únicamente para la gestión, confirmación y recordatorio de tus turnos. No compartimos tu información con terceros ni la utilizamos para fines no autorizados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Uso de Cookies</h2>
            <p>
              Este sitio web utiliza cookies técnicas y herramientas de análisis anónimas (como Google Analytics) para garantizar el correcto funcionamiento del sistema de reservas y medir el rendimiento del sitio. Al navegar en esta página, aceptas el uso de las mismas.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-800">
            <h2 className="text-base font-bold text-white">Contacto</h2>
            <p>
              Si tenés dudas sobre nuestros términos o necesitás asistencia con tu turno, podés comunicarte directamente a través de nuestras vías de contacto oficiales en la página principal.
            </p>
          </section>

        </article>

        {/* Footer legal discreto */}
        <footer className="pt-8 text-center text-xs text-zinc-600 border-t border-zinc-900">
          © {new Date().getFullYear()} Eddu Barber — Desarrollado por NDI AI
        </footer>

      </div>
    </main>
  );
}