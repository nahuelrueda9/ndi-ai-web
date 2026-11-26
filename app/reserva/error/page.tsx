"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

export default function ReservaErrorPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          <XCircle className="h-10 w-10" />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
          No se pudo completar el pago
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          El pago no fue aprobado o se canceló la operación. El turno no fue reservado.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/#reservar" className="block w-full">
            <Button type="button" className="w-full">
              Volver a intentar la reserva
            </Button>
          </Link>

          <Link
            href="/"
            className="block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Volver al inicio
          </Link>
        </div>
      </Card>
    </main>
  );
}