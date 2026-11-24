"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

export default function ReservaExitoPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="max-w-md text-center p-6 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
          ¡Pago acreditado!
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Tu reserva fue registrada y confirmada correctamente en la agenda. ¡Te esperamos!
        </p>

        <div className="mt-6">
          <Link href="/">
            <Button type="button" className="w-full">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}