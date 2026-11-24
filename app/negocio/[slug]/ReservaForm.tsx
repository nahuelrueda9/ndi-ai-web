"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Clock3, Loader2 } from "lucide-react";

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
  tema?: "oscuro" | "claro";
  esEdduBarber?: boolean;
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

type ValidacionReservaResponse = {
  ok?: boolean;
  error?: string;
  empresaId?: string;
  servicioId?: string;
  servicio?: string;
  precioServicio?: number;
  fecha?: string;
  hora?: string;
  duracionMinutos?: number;
  cliente?: {
    nombreCliente?: string;
    email?: string;
    telefono?: string;
    notas?: string;
  };
};

export default function ReservaForm({ slug, servicios, colorPrincipal, esEdduBarber = false }: Props) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id || "");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaInicial());
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState("");
  const [configuracionPendiente, setConfiguracionPendiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [refrescarDisponibilidad, setRefrescarDisponibilidad] = useState(0);

  const horaPreseleccionadaRef = useRef("");

  useEffect(() => {
    function seleccionarTurnoRapido(event: Event) {
      const detalle = (event as CustomEvent<{ servicioId?: string; fecha?: string; hora?: string; }>).detail;
      const servicioDesdeCard = detalle?.servicioId || "";
      const existe = servicios.some((servicio) => servicio.id === servicioDesdeCard);

      if (!existe) return;

      const horaElegida = (detalle?.hora || "").replace(" hs", "").trim();
      horaPreseleccionadaRef.current = horaElegida;

      setServicioId(servicioDesdeCard);

      if (detalle?.fecha) {
        setFecha(detalle.fecha);
      }

      if (horaElegida) {
        setHora(horaElegida);
      }

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
        if (horaPreseleccionada) {
          setHora(horaPreseleccionada);
        }

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

    if (!servicioId) { setError("Seleccioná un servicio."); return; }
    if (!nombreCliente.trim()) { setError("Ingresá tu nombre."); return; }
    
    if (esEdduBarber) {
      if (!telefono.trim()) { setError("Ingresá tu teléfono de contacto."); return; }
    } else {
      if (!telefono.trim() && !email.trim()) { setError("Ingresá un teléfono o correo de contacto."); return; }
    }

    if (!fecha) { setError("Seleccioná una fecha."); return; }
    if (!hora) { setError("Seleccioná uno de los horarios disponibles."); return; }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, servicioId, nombreCliente, telefono, email, fecha, hora, notas }),
      });

      const resultado = (await respuesta.json()) as ValidacionReservaResponse;

      if (!respuesta.ok || !resultado.ok) {
        setError(resultado.error || "No se pudo validar el turno.");
        if (respuesta.status === 409) {
          setHora("");
          setRefrescarDisponibilidad((actual) => actual + 1);
        }
        setEnviando(false);
        return;
      }

      const prefRespuesta = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: resultado.empresaId,
          servicioId: resultado.servicioId,
          nombreCliente: resultado.cliente?.nombreCliente || nombreCliente,
          telefono: resultado.cliente?.telefono || telefono,
          email: resultado.cliente?.email || email,
          servicio: resultado.servicio,
          fecha: resultado.fecha || fecha,
          hora: resultado.hora || hora,
          duracionMinutos: resultado.duracionMinutos,
          precio: resultado.precioServicio,
          notas: resultado.cliente?.notas || notas,
        }),
      });

      const prefData = (await prefRespuesta.json()) as { init_point?: string; error?: string; };

      if (!prefRespuesta.ok || !prefData.init_point) {
        setError(prefData.error || "No se pudo generar la pantalla de pago de Mercado Pago.");
        setEnviando(false);
        return;
      }

      window.location.href = prefData.init_point;
    } catch (errorReserva) {
      console.error("Error enviando reserva:", errorReserva);
      setError("No se pudo conectar con el sistema de pagos.");
      setEnviando(false);
    }
  }

  if (servicios.length === 0) return null;

  const esCerrado = mensajeDisponibilidad === "HOY CERRADO" && horarios.length === 0;
  const colorBotonYEncabezado = esEdduBarber ? "#ED192D" : colorPrincipal;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-8">
      <div>
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] mb-1 text-[#ED192D]"
          style={{ color: colorBotonYEncabezado }}
        >
          — RESERVA ONLINE
        </p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-serif leading-snug">
          Pedí tu turno
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
          Elegí un servicio, una fecha y uno de los horarios disponibles.
        </p>
      </div>

      <form onSubmit={reservar} className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm">
            Servicio
          </label>
          <select
            value={servicioId}
            onChange={(event) => {
              setServicioId(event.target.value);
              setHora("");
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

        <Campo label="Nombre" value={nombreCliente} onChange={setNombreCliente} placeholder="Tu nombre" required />
        <Campo label="Teléfono" value={telefono} onChange={setTelefono} placeholder="+54 9..." type="tel" required={esEdduBarber} />

        {!esEdduBarber && (
          <Campo label="Correo" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" type="email" />
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            min={obtenerFechaLocalString(new Date())}
            onChange={(event) => {
              setFecha(event.target.value);
              setHora("");
              setError("");
            }}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:px-4 sm:py-3 sm:text-sm"
          />
        </div>

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
          ) : esCerrado ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-500 dark:text-red-400">
              <p className="text-lg font-bold tracking-wider uppercase">HOY CERRADO</p>
              <p className="text-xs mt-1 text-red-400/80">No hay atención disponible para la fecha seleccionada.</p>
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
                    }}
                    style={seleccionado ? { backgroundColor: colorBotonYEncabezado, borderColor: colorBotonYEncabezado } : undefined}
                    className={[
                      "rounded-xl border px-2 py-2 text-xs font-semibold transition sm:px-3 sm:py-3 sm:text-sm",
                      seleccionado
                        ? "text-white shadow-md scale-105"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {horario} hs
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

        {hora && !esCerrado && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 sm:col-span-2 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Horario seleccionado
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-300 sm:text-lg">
              {fecha} · {hora} hs
            </p>
          </div>
        )}

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

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 sm:col-span-2 sm:p-4 sm:text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || cargandoHorarios || !hora || esCerrado}
          style={{ backgroundColor: colorBotonYEncabezado }}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2 sm:px-6 sm:py-3.5 sm:text-base flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo a Mercado Pago...
            </>
          ) : esCerrado ? (
            "Cerrado"
          ) : hora ? (
            `Ir a pagar y reservar · ${hora} hs`
          ) : (
            "Seleccioná un horario"
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500 dark:text-zinc-600 sm:col-span-2 sm:text-xs">
          {esEdduBarber ? "Ingresá tu teléfono para el contacto. El turno se confirmará una vez completado el pago." : "Ingresá al menos un teléfono o correo. El turno se confirmará una vez completado el pago."}
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

function obtenerFechaLocalString(date: Date) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function obtenerFechaInicial() {
  const ahora = new Date();
  const horaActualStr = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  
  if (horaActualStr > "21:30") {
    ahora.setDate(ahora.getDate() + 1);
  }
  
  return obtenerFechaLocalString(ahora);
}