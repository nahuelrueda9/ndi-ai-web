"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Clock3, Loader2 } from "lucide-react";

type Servicio = {
  id: string;
  nombre: string;
  precio?: number;
  duracionMinutos?: number;
};

type Props = {
  slug: string;
  servicios: Servicio[];
  colorPrincipal: string;
  tema?: "oscuro" | "claro"; // Lo dejamos por compatibilidad
};

type DisponibilidadResponse = {
  disponible?: boolean;
  configuracionPendiente?: boolean;
  horarios?: string[];
  mensaje?: string;
  error?: string;
  duracionMinutos?: number;
  servicio?: string;
};

export default function ReservaForm({ slug, servicios, colorPrincipal }: Props) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id || "");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState("");
  const [configuracionPendiente, setConfiguracionPendiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [refrescarDisponibilidad, setRefrescarDisponibilidad] = useState(0);

  const horaPreseleccionadaRef = useRef("");

  useEffect(() => {
    function seleccionarTurnoRapido(event: Event) {
      const detalle = (event as CustomEvent<{ servicioId?: string; fecha?: string; hora?: string; }>).detail;
      const servicioDesdeCard = detalle?.servicioId || "";
      const existe = servicios.some((servicio) => servicio.id === servicioDesdeCard);

      if (!existe) return;

      horaPreseleccionadaRef.current = detalle?.hora || "";
      setServicioId(servicioDesdeCard);

      if (detalle?.fecha) {
        setFecha(detalle.fecha);
      }

      setHora("");
      setExito("");
      setError("");
    }

    window.addEventListener("ndi:seleccionar-turno", seleccionarTurnoRapido);
    return () => window.removeEventListener("ndi:seleccionar-turno", seleccionarTurnoRapido);
  }, [servicios]);

  useEffect(() => {
    function seleccionarServicioDesdeHash() {
      const hash = window.location.hash || "";
      const prefijo = "#reservar-servicio-";

      if (!hash.startsWith(prefijo)) return;

      const servicioDesdeHash = decodeURIComponent(hash.slice(prefijo.length));
      const existe = servicios.some((servicio) => servicio.id === servicioDesdeHash);

      if (!existe) return;

      horaPreseleccionadaRef.current = "";
      setServicioId(servicioDesdeHash);
      setHora("");
      setExito("");
      setError("");

      requestAnimationFrame(() => {
        document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    seleccionarServicioDesdeHash();
    window.addEventListener("hashchange", seleccionarServicioDesdeHash);
    return () => window.removeEventListener("hashchange", seleccionarServicioDesdeHash);
  }, [servicios]);

  useEffect(() => {
    setHora("");
    setHorarios([]);
    setMensajeDisponibilidad("");
    setConfiguracionPendiente(false);

    if (!slug || !servicioId || !fecha) return;

    let cancelado = false;

    async function cargarDisponibilidad() {
      setCargandoHorarios(true);

      try {
        const parametros = new URLSearchParams({ slug, servicioId, fecha });
        const respuesta = await fetch(`/api/public/appointments?${parametros.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const resultado = (await respuesta.json()) as DisponibilidadResponse;

        if (cancelado) return;

        if (!respuesta.ok) {
          setHorarios([]);
          setMensajeDisponibilidad(resultado.error || "No se pudo consultar la disponibilidad.");
          return;
        }

        const nuevosHorarios = Array.isArray(resultado.horarios) ? resultado.horarios : [];
        setHorarios(nuevosHorarios);

        const horaPreseleccionada = horaPreseleccionadaRef.current;
        if (horaPreseleccionada && nuevosHorarios.includes(horaPreseleccionada)) {
          setHora(horaPreseleccionada);
        }

        horaPreseleccionadaRef.current = "";
        setConfiguracionPendiente(resultado.configuracionPendiente === true);

        if (resultado.mensaje) {
          setMensajeDisponibilidad(resultado.mensaje);
        } else if (nuevosHorarios.length === 0) {
          setMensajeDisponibilidad("No quedan horarios disponibles para este día.");
        }
      } catch (errorDisponibilidad) {
        console.error("Error consultando horarios:", errorDisponibilidad);
        if (!cancelado) {
          setHorarios([]);
          setMensajeDisponibilidad("No se pudieron cargar los horarios.");
        }
      } finally {
        if (!cancelado) setCargandoHorarios(false);
      }
    }

    void cargarDisponibilidad();
    return () => { cancelado = true; };
  }, [slug, servicioId, fecha, refrescarDisponibilidad]);

  useEffect(() => {
    if (servicios.length === 0) {
      if (servicioId) setServicioId("");
      return;
    }

    const sigueDisponible = servicios.some((servicio) => servicio.id === servicioId);
    if (!sigueDisponible) {
      setServicioId(servicios[0].id);
      setHora("");
      setHorarios([]);
    }
  }, [servicios, servicioId]);

  async function reservar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setError("");
    setExito("");

    if (!servicioId) { setError("Seleccioná un servicio."); return; }
    if (!nombreCliente.trim()) { setError("Ingresá tu nombre."); return; }
    if (!telefono.trim() && !email.trim()) { setError("Ingresá un teléfono o correo de contacto."); return; }
    if (!fecha) { setError("Seleccioná una fecha."); return; }
    if (!hora) { setError("Seleccioná uno de los horarios disponibles."); return; }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, servicioId, nombreCliente, telefono, email, fecha, hora, notas }),
      });

      const resultado = (await respuesta.json()) as { error?: string; servicio?: string; fecha?: string; hora?: string; };

      if (!respuesta.ok) {
        setError(resultado.error || "No se pudo reservar el turno.");
        if (respuesta.status === 409) {
          setHora("");
          setRefrescarDisponibilidad((actual) => actual + 1);
        }
        return;
      }

      setExito(`Turno solicitado para ${resultado.servicio || "el servicio seleccionado"} el ${resultado.fecha || fecha} a las ${resultado.hora || hora}.`);
      setNombreCliente("");
      setTelefono("");
      setEmail("");
      setHora("");
      setNotas("");
      setRefrescarDisponibilidad((actual) => actual + 1);
    } catch (errorReserva) {
      console.error("Error enviando reserva:", errorReserva);
      setError("No se pudo conectar con el sistema de turnos.");
    } finally {
      setEnviando(false);
    }
  }

  if (servicios.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl"
          style={{ backgroundColor: `${colorPrincipal}20`, color: colorPrincipal }}
        >
          <CalendarDays className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>

        <div>
          <p className="text-xs font-medium sm:text-sm" style={{ color: colorPrincipal }}>
            Reserva online
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
            Pedí tu turno
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
            Elegí un servicio, una fecha y uno de los horarios disponibles.
          </p>
        </div>
      </div>

      <form onSubmit={reservar} className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
        {/* SERVICIO */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm">
            Servicio
          </label>
          <select
            value={servicioId}
            onChange={(event) => {
              setServicioId(event.target.value);
              setHora("");
              setExito("");
              setError("");
            }}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:px-4 sm:py-3 sm:text-sm"
          >
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.nombre}
                {servicio.precio ? ` · $${servicio.precio.toLocaleString("es-AR")}` : ""}
                {servicio.duracionMinutos ? ` · ${servicio.duracionMinutos} min` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* DATOS */}
        <Campo label="Nombre" value={nombreCliente} onChange={setNombreCliente} placeholder="Tu nombre" required />
        <Campo label="Teléfono" value={telefono} onChange={setTelefono} placeholder="+54 9..." type="tel" />
        <Campo label="Correo" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" type="email" />

        {/* FECHA */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            min={obtenerHoy()}
            onChange={(event) => {
              setFecha(event.target.value);
              setHora("");
              setExito("");
              setError("");
            }}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:px-4 sm:py-3 sm:text-sm"
          />
        </div>

        {/* HORARIOS */}
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center gap-2 sm:mb-3">
            <Clock3 className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
              Horarios disponibles
            </label>
          </div>

          {!fecha ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500 sm:p-5 sm:text-sm">
              Seleccioná una fecha para ver los horarios disponibles.
            </div>
          ) : cargandoHorarios ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 sm:gap-3 sm:p-6 sm:text-sm">
              <Loader2 className="h-5 w-5 animate-spin" /> Consultando horarios...
            </div>
          ) : horarios.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {horarios.map((horario) => {
                const seleccionado = hora === horario;
                return (
                  <button
                    key={horario}
                    type="button"
                    onClick={() => {
                      setHora(horario);
                      setError("");
                      setExito("");
                    }}
                    style={seleccionado ? { backgroundColor: colorPrincipal, borderColor: colorPrincipal } : undefined}
                    className={[
                      "rounded-xl border px-2 py-2 text-xs font-semibold transition sm:px-3 sm:py-3 sm:text-sm",
                      seleccionado
                        ? "text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {horario}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className={[
                "rounded-xl border p-5 text-sm",
                configuracionPendiente
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
              ].join(" ")}
            >
              {mensajeDisponibilidad || "No hay horarios disponibles para esta fecha."}
            </div>
          )}
        </div>

        {/* TURNO ELEGIDO */}
        {hora && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 sm:col-span-2 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Horario seleccionado
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-300 sm:text-lg">
              {fecha} · {hora}
            </p>
          </div>
        )}

        {/* NOTAS */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm">
            Nota opcional
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Algo que quieras aclarar..."
            className="h-20 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 sm:h-auto sm:px-4 sm:py-3 sm:text-sm"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 sm:col-span-2 sm:p-4 sm:text-sm">
            {error}
          </div>
        )}

        {/* ÉXITO */}
        {exito && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 sm:col-span-2 sm:gap-3 sm:p-4 sm:text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Turno solicitado</p>
              <p className="mt-1">{exito}</p>
              <p className="mt-2 text-xs text-emerald-400/80">
                El negocio podrá confirmar tu turno desde su agenda.
              </p>
            </div>
          </div>
        )}

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={enviando || cargandoHorarios || !hora}
          style={{ backgroundColor: colorPrincipal }}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2 sm:px-6 sm:py-3.5 sm:text-base"
        >
          {enviando ? "Reservando..." : hora ? `Solicitar turno · ${hora}` : "Seleccioná un horario"}
        </button>

        <p className="text-center text-[11px] text-slate-500 dark:text-zinc-600 sm:col-span-2 sm:text-xs">
          Ingresá al menos un teléfono o correo para que el negocio pueda contactarte.
        </p>
      </form>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 sm:px-4 sm:py-3 sm:text-sm"
      />
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