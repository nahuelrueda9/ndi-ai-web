import Link from "next/link";
import { CheckCircle2, Calendar, Clock, Scissors, Home } from "lucide-react";

export default function ConfirmacionTurnoPage({
  searchParams,
}: {
  searchParams: { status?: string; payment_id?: string; external_reference?: string };
}) {
  const pagado = searchParams.status === "approved" || searchParams.status === "success";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4 selection:bg-[#ED192D]">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ED192D]">
          — RESERVA CONFIRMADA
        </p>
        <h1 className="mt-2 text-2xl font-extrabold font-serif text-white sm:text-3xl">
          ¡Tu turno está agendado!
        </h1>

        <p className="mt-3 text-xs text-zinc-400 sm:text-sm leading-relaxed">
          {pagado
            ? "Recibimos tu pago del adelanto por Mercado Pago. Te esperamos en la barbería en la fecha y hora seleccionadas."
            : "Tu reserva fue registrada correctamente para abonar en el local."}
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left space-y-3">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-300">
            <Scissors className="h-4 w-4 text-[#ED192D] shrink-0" />
            <span>Eddu Barber Studio</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-300">
            <Calendar className="h-4 w-4 text-[#ED192D] shrink-0" />
            <span>Jujuy 44, Libertador General San Martín</span>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-800">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ED192D] px-5 py-3.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95 sm:text-sm"
          >
            <Home className="h-4 w-4" />
            Volver a inicio
          </Link>
        </div>
      </div>
    </main>
  );
}