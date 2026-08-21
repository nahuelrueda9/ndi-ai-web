"use client";

import { CalendarDays, CheckCircle2, Hotel, Loader2, Users } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type Habitacion = {
  id: string;
  nombre: string;
  precio?: number;
};

type Props = {
  slug: string;
  habitaciones: Habitacion[];
  colorPrincipal: string;
  tema?: "oscuro" | "claro"; // Lo dejamos por compatibilidad de la interfaz original
};

type RespuestaReserva = {
  ok?: boolean;
  reservaId?: string;
  habitacion?: string;
  fechaEntrada?: string;
  fechaSalida?: string;
  huespedes?: number;
  error?: string;
};

export default function ReservaAlojamientoForm({ slug, habitaciones, colorPrincipal }: Props) {
  const [habitacionId, setHabitacionId] = useState(habitaciones[0]?.id || "");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [huespedes, setHuespedes] = useState("2");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    function seleccionarHabitacionDesdeHash() {
      const hash = window.location.hash || "";
      const prefijo = "#reservar-servicio-";

      if (!hash.startsWith(prefijo)) return;

      const id = decodeURIComponent(hash.slice(prefijo.length));

      if (habitaciones.some((habitacion) => habitacion.id === id)) {
        setHabitacionId(id);
      }

      requestAnimationFrame(() => {
        document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    seleccionarHabitacionDesdeHash();
    window.addEventListener("hashchange", seleccionarHabitacionDesdeHash);

    return () => window.removeEventListener("hashchange", seleccionarHabitacionDesdeHash);
  }, [habitaciones]);

  useEffect(() => {
    if (habitaciones.length > 0 && !habitaciones.some((habitacion) => habitacion.id === habitacionId)) {
      setHabitacionId(habitaciones[0].id);
    }
  }, [habitaciones, habitacionId]);

  const habitacionSeleccionada = useMemo(
    () => habitaciones.find((habitacion) => habitacion.id === habitacionId),
    [habitaciones, habitacionId]
  );

  const noches = useMemo(() => {
    if (!fechaEntrada || !fechaSalida) return 0;

    const entrada = new Date(`${fechaEntrada}T12:00:00`);
    const salida = new Date(`${fechaSalida}T12:00:00`);
    const diferencia = salida.getTime() - entrada.getTime();

    return diferencia > 0 ? Math.round(diferencia / (1000 * 60 * 60 * 24)) : 0;
  }, [fechaEntrada, fechaSalida]);

  const totalEstimado = noches > 0 && habitacionSeleccionada?.precio ? noches * habitacionSeleccionada.precio : 0;

  async function reservar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setError("");
    setExito("");

    if (!habitacionId) { setError("Seleccioná una habitación."); return; }
    if (!nombreCliente.trim()) { setError("Ingresá tu nombre."); return; }
    if (!telefono.trim() && !email.trim()) { setError("Ingresá un teléfono o correo de contacto."); return; }
    if (!fechaEntrada) { setError("Seleccioná la fecha de entrada."); return; }
    if (!fechaSalida) { setError("Seleccioná la fecha de salida."); return; }
    if (fechaSalida <= fechaEntrada) { setError("La fecha de salida debe ser posterior a la entrada."); return; }

    const cantidadHuespedes = Number(huespedes);
    if (!Number.isInteger(cantidadHuespedes) || cantidadHuespedes < 1 || cantidadHuespedes > 20) {
      setError("Ingresá una cantidad de huéspedes válida.");
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/public/stays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          servicioId: habitacionId,
          nombreCliente: nombreCliente.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          fechaEntrada,
          fechaSalida,
          huespedes: cantidadHuespedes,
          notas: notas.trim(),
        }),
      });

      const resultado = (await respuesta.json()) as RespuestaReserva;

      if (!respuesta.ok) {
        setError(resultado.error || "No se pudo solicitar la reserva.");
        return;
      }

      setExito(`Solicitud enviada para ${resultado.habitacion || habitacionSeleccionada?.nombre || "la habitación"} del ${resultado.fechaEntrada || fechaEntrada} al ${resultado.fechaSalida || fechaSalida}.`);

      setNombreCliente("");
      setTelefono("");
      setEmail("");
      setFechaEntrada("");
      setFechaSalida("");
      setHuespedes("2");
      setNotas("");
    } catch (errorReserva) {
      console.error("Error enviando reserva de alojamiento:", errorReserva);
      setError("No se pudo conectar con el sistema de reservas.");
    } finally {
      setEnviando(false);
    }
  }

  if (habitaciones.length === 0) return null;

  const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 sm:h-auto sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm";
  const labelClass = "mb-1 block text-[11px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-2xl"
          style={{ backgroundColor: `${colorPrincipal}20`, color: colorPrincipal }}
        >
          <Hotel className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div>
          <p className="text-xs font-medium sm:text-sm" style={{ color: colorPrincipal }}>
            Reserva de alojamiento
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-2xl">
            Reservá tu estadía
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
            Elegí habitación, entrada, salida y cantidad de huéspedes.
          </p>
        </div>
      </div>

      <form onSubmit={reservar} className="mt-4 grid gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <label className={labelClass}>Habitación</label>
          <select
            value={habitacionId}
            onChange={(event) => {
              setHabitacionId(event.target.value);
              setError("");
              setExito("");
            }}
            required
            className={inputClass}
          >
            {habitaciones.map((habitacion) => (
              <option key={habitacion.id} value={habitacion.id}>
                {habitacion.nombre}
                {habitacion.precio ? ` · $${habitacion.precio.toLocaleString("es-AR")} por noche` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Nombre</label>
          <input
            value={nombreCliente}
            onChange={(event) => setNombreCliente(event.target.value)}
            placeholder="Tu nombre"
            maxLength={120}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Cantidad de huéspedes</label>
          <input
            type="number"
            min="1"
            max="20"
            value={huespedes}
            onChange={(event) => setHuespedes(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            placeholder="+54 9..."
            maxLength={60}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Correo</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            maxLength={180}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Fecha de entrada</label>
          <input
            type="date"
            value={fechaEntrada}
            min={obtenerHoy()}
            onChange={(event) => {
              const nuevaEntrada = event.target.value;
              setFechaEntrada(nuevaEntrada);
              if (fechaSalida && fechaSalida <= nuevaEntrada) setFechaSalida("");
              setError("");
              setExito("");
            }}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Fecha de salida</label>
          <input
            type="date"
            value={fechaSalida}
            min={fechaEntrada ? sumarDias(fechaEntrada, 1) : sumarDias(obtenerHoy(), 1)}
            onChange={(event) => {
              setFechaSalida(event.target.value);
              setError("");
              setExito("");
            }}
            required
            className={inputClass}
          />
        </div>

        {(noches > 0 || totalEstimado > 0) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 sm:col-span-2 sm:p-4 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {noches} {noches === 1 ? "noche" : "noches"}
            </span>

            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {huespedes || "0"} huéspedes
            </span>

            {totalEstimado > 0 && (
              <strong className="text-slate-950 dark:text-white">
                Estimado: ${totalEstimado.toLocaleString("es-AR")}
              </strong>
            )}
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={labelClass}>Nota opcional</label>
          <textarea
            rows={2}
            maxLength={1500}
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Alguna preferencia o consulta..."
            className={`${inputClass} h-20 resize-none sm:h-auto`}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 sm:col-span-2 sm:p-4 sm:text-sm">
            {error}
          </div>
        )}

        {exito && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 sm:col-span-2 sm:p-4 sm:text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Reserva solicitada</p>
              <p className="mt-1">{exito}</p>
              <p className="mt-1.5 text-[11px] text-emerald-400/80 sm:text-xs">
                El alojamiento podrá confirmar la solicitud desde su agenda.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          style={{ backgroundColor: colorPrincipal }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:h-auto sm:rounded-xl sm:px-5 sm:py-3.5 sm:text-sm"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <CalendarDays className="h-4 w-4" /> Solicitar reserva
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function obtenerHoy() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function sumarDias(fecha: string, dias: number) {
  const date = new Date(`${fecha}T12:00:00`);
  date.setDate(date.getDate() + dias);
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}