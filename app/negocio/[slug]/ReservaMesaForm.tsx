"use client";

import { CalendarDays, CheckCircle2, Clock3, Loader2, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

type Props = {
  slug: string;
  colorPrincipal: string;
  tema?: "oscuro" | "claro"; // Lo dejamos por compatibilidad de tipos
};

type ReservaResponse = {
  ok?: boolean;
  reservaId?: string;
  fecha?: string;
  hora?: string;
  personas?: number;
  error?: string;
};

function hoyISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export default function ReservaMesaForm({ slug, colorPrincipal }: Props) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [personas, setPersonas] = useState("2");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function enviarReserva(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setError("");
    setExito("");

    if (!nombreCliente.trim()) { setError("Ingresá tu nombre."); return; }
    if (!telefono.trim() && !email.trim()) { setError("Ingresá un teléfono o correo de contacto."); return; }
    if (!fecha) { setError("Seleccioná una fecha."); return; }
    if (!hora) { setError("Seleccioná un horario."); return; }

    const cantidad = Number(personas);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 30) {
      setError("Ingresá una cantidad de personas válida.");
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/public/table-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, nombreCliente, telefono, email, fecha, hora, personas: cantidad, notas }),
      });

      const resultado = (await respuesta.json()) as ReservaResponse;

      if (!respuesta.ok) {
        setError(resultado.error || "No se pudo enviar la reserva.");
        return;
      }

      setExito(`Solicitud enviada para el ${resultado.fecha || fecha} a las ${resultado.hora || hora} para ${resultado.personas || cantidad} persona${(resultado.personas || cantidad) === 1 ? "" : "s"}. El restaurante deberá confirmarla.`);

      setNombreCliente("");
      setTelefono("");
      setEmail("");
      setFecha("");
      setHora("");
      setPersonas("2");
      setNotas("");
    } catch (errorReserva) {
      console.error("Error enviando reserva de mesa:", errorReserva);
      setError("No se pudo conectar con el sistema de reservas.");
    } finally {
      setEnviando(false);
    }
  }

  const claseInput = "border border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 sm:px-4 sm:py-3 sm:text-sm";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-2xl"
          style={{ backgroundColor: `${colorPrincipal}20`, color: colorPrincipal }}
        >
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div>
          <p className="text-xs font-semibold sm:text-sm" style={{ color: colorPrincipal }}>
            Reserva de mesa
          </p>

          <h2 className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-2xl">
            Reservá tu mesa
          </h2>

          <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
            Enviá tu solicitud y el restaurante podrá confirmarla desde su agenda.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 sm:mt-5">
        La solicitud queda pendiente hasta que el restaurante la confirme.
      </div>

      <form onSubmit={enviarReserva} className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="reservaMesaNombre" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Nombre
          </label>
          <input
            id="reservaMesaNombre"
            value={nombreCliente}
            onChange={(event) => setNombreCliente(event.target.value)}
            maxLength={120}
            autoComplete="name"
            placeholder="Tu nombre"
            className={`h-10 w-full rounded-lg px-3 text-[13px] outline-none transition sm:h-auto sm:rounded-xl sm:py-2.5 ${claseInput}`}
          />
        </div>

        <div>
          <label htmlFor="reservaMesaFecha" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Fecha
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              id="reservaMesaFecha"
              type="date"
              min={hoyISO()}
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className={`h-10 w-full rounded-lg pl-9 pr-3 text-[13px] outline-none transition sm:h-auto sm:rounded-xl sm:py-2.5 ${claseInput}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reservaMesaHora" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Horario
          </label>
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              id="reservaMesaHora"
              type="time"
              step={1800}
              value={hora}
              onChange={(event) => setHora(event.target.value)}
              className={`h-10 w-full rounded-lg pl-9 pr-3 text-[13px] outline-none transition sm:h-auto sm:rounded-xl sm:py-2.5 ${claseInput}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reservaMesaPersonas" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Personas
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              id="reservaMesaPersonas"
              type="number"
              min="1"
              max="30"
              value={personas}
              onChange={(event) => setPersonas(event.target.value)}
              className={`h-10 w-full rounded-lg pl-9 pr-3 text-[13px] outline-none transition sm:h-auto sm:rounded-xl sm:py-2.5 ${claseInput}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reservaMesaTelefono" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Teléfono
          </label>
          <input
            id="reservaMesaTelefono"
            type="tel"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            maxLength={60}
            autoComplete="tel"
            placeholder="+54..."
            className={`h-10 w-full rounded-lg px-3 text-[13px] outline-none transition sm:h-auto sm:rounded-xl sm:py-2.5 ${claseInput}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="reservaMesaEmail" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Correo
            <span className="ml-1 font-normal text-slate-400 dark:text-zinc-500">
              (opcional si dejás teléfono)
            </span>
          </label>
          <input
            id="reservaMesaEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={180}
            autoComplete="email"
            placeholder="tu@email.com"
            className={`h-10 w-full rounded-lg px-3 text-[13px] outline-none transition sm:h-auto sm:rounded-xl sm:py-2.5 ${claseInput}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="reservaMesaNotas" className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-1.5 sm:text-sm">
            Nota
            <span className="ml-1 font-normal text-slate-400 dark:text-zinc-500">
              (opcional)
            </span>
          </label>
          <textarea
            id="reservaMesaNotas"
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Ej.: mesa cerca de la ventana, cumpleaños, silla para bebé..."
            className={`w-full resize-none rounded-lg px-3 py-2 text-[13px] outline-none transition sm:rounded-xl sm:py-2.5 ${claseInput}`}
          />
        </div>

        {error && (
          <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {exito && (
          <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{exito}</span>
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:w-auto sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm"
            style={{ backgroundColor: colorPrincipal }}
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CalendarDays className="h-4 w-4" />
                Solicitar reserva
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}