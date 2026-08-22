"use client";

import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  slug: string;
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
};

export default function ReservaMesaForm({ slug, colorPrincipal, tema = "oscuro" }: Props) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [personas, setPersonas] = useState("2");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  // Detección dinámica del tema claro u oscuro del documento
  const [esClaro, setEsClaro] = useState(tema === "claro");

  useEffect(() => {
    const root = document.documentElement;
    const actualizarTema = () => {
      setEsClaro(!root.classList.contains("dark") && (tema === "claro" || !root.classList.contains("dark")));
    };
    actualizarTema();
    
    const observer = new MutationObserver(actualizarTema);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [tema]);

  const claro = esClaro;
  const claseSecundario = claro ? "text-slate-400" : "text-zinc-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    setError("");

    if (!nombre.trim()) {
      setError("Por favor, ingresá tu nombre.");
      return;
    }
    if (!fecha) {
      setError("Seleccioná una fecha para la reserva.");
      return;
    }
    if (!hora) {
      setError("Seleccioná un horario.");
      return;
    }
    if (!telefono.trim()) {
      setError("Ingresá un teléfono de contacto.");
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch("/api/public/reservas-mesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nombre,
          fecha,
          hora,
          personas: Number(personas) || 2,
          telefono,
          email,
          nota,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "No se pudo registrar la reserva.");
        setEnviando(false);
        return;
      }

      setExito(true);
    } catch (err) {
      console.error("Error reserva mesa:", err);
      setError("Ocurrió un error al enviar la reserva.");
    } finally {
      setEnviando(false);
    }
  }

  const inputClase = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 ${
    claro
      ? "border-slate-300 bg-white text-slate-950 placeholder-slate-400"
      : "border-zinc-800 bg-zinc-900 text-white placeholder-zinc-500"
  }`;

  if (exito) {
    return (
      <div className={`rounded-3xl border p-8 text-center sm:p-12 ${claro ? "border-slate-200 bg-white text-slate-950" : "border-zinc-800 bg-zinc-900 text-white"}`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${colorPrincipal}18`, color: colorPrincipal }}>
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-bold">¡Reserva solicitada con éxito!</h3>
        <p className={`mt-2 text-sm leading-6 ${claro ? "text-slate-600" : "text-zinc-400"}`}>
          Te hemos enviado los detalles. El restaurante confirmará tu mesa a la brevedad.
        </p>
        <button
          type="button"
          onClick={() => {
            setExito(false);
            setNombre("");
            setFecha("");
            setHora("");
            setTelefono("");
            setEmail("");
            setNota("");
          }}
          className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: colorPrincipal }}
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border p-6 sm:p-10 ${claro ? "border-slate-200 bg-white text-slate-950" : "border-zinc-800 bg-zinc-950 text-white"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: colorPrincipal }}>
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colorPrincipal }}>
            Reserva de mesa
          </p>
          <h2 className="text-xl font-bold sm:text-2xl">Reservá tu mesa</h2>
        </div>
      </div>

      <p className={`mt-2 text-xs sm:text-sm ${claro ? "text-slate-600" : "text-zinc-400"}`}>
        Enviá tu solicitud y el restaurante podrá confirmarla desde su agenda.
      </p>

      <div className={`mt-4 rounded-xl border p-3.5 text-xs ${claro ? "border-amber-500/30 bg-amber-50 text-amber-800" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}>
        La solicitud queda pendiente hasta que el restaurante la confirme.
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className={inputClase}
            maxLength={100}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`${inputClase} [&::-webkit-calendar-picker-indicator]:filter ${claro ? "" : "[&::-webkit-calendar-picker-indicator]:invert"}`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Horario</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={`${inputClase} [&::-webkit-calendar-picker-indicator]:filter ${claro ? "" : "[&::-webkit-calendar-picker-indicator]:invert"}`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Personas</label>
            <select
              value={personas}
              onChange={(e) => setPersonas(e.target.value)}
              className={inputClase}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                <option key={num} value={num} className={claro ? "bg-white text-slate-900" : "bg-zinc-900 text-white"}>
                  {num} {num === 1 ? "persona" : "personas"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54..."
              className={inputClase}
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">Correo <span className={claseSecundario}>(opcional si dejás teléfono)</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className={inputClase}
            maxLength={120}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">Nota <span className={claseSecundario}>(opcional)</span></label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej.: mesa cerca de la ventana, cumpleaños, silla para bebé..."
            rows={3}
            className={`${inputClase} resize-none`}
            maxLength={500}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: colorPrincipal }}
        >
          {enviando ? <><Loader2 className="h-4 w-4 animate-spin" /> Solicitando...</> : <><Calendar className="h-4 w-4" /> Solicitar reserva</>}
        </button>
      </form>
    </div>
  );
}