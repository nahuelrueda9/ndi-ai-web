"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, Loader2, Store, Wallet } from "lucide-react";

type Servicio = {
  id: string;
  nombre: string;
  precio?: number;
  duracionMinutos?: number;
};

type ConfigSenaEddu = {
  habilitada?: boolean;
  monto?: number;
  linkMercadoPago?: string;
};

type Props = {
  slug: string;
  empresaId?: string;
  servicios: Servicio[];
  colorPrincipal?: string;
  configSena?: ConfigSenaEddu;
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

type MetodoPagoElegido = "mp" | "local";

export default function ReservaFormEddu({
  slug,
  empresaId = "",
  servicios,
  colorPrincipal = "#ED192D",
  configSena,
}: Props) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id || "");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaInicial());
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState("");
  const [configuracionPendiente, setConfiguracionPendiente] = useState(false);
  const [mostrarOpcionesPago, setMostrarOpcionesPago] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [refrescarDisponibilidad, setRefrescarDisponibilidad] = useState(0);

  const horaPreseleccionadaRef = useRef("");

  const senaActiva = Boolean(
    configSena?.habilitada !== false && Number(configSena?.monto || 0) > 0
  );
  const montoSena = Number(configSena?.monto || 0);
  const linkMp = (configSena?.linkMercadoPago || "").trim();

  useEffect(() => {
    function seleccionarTurnoRapido(event: Event) {
      const detalle = (
        event as CustomEvent<{ servicioId?: string; fecha?: string; hora?: string }>
      ).detail;
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

      setMostrarOpcionesPago(false);
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
      setMostrarOpcionesPago(false);
      setExito("");
      setError("");

      requestAnimationFrame(() => {
        document
          .getElementById("reservar")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          setMensajeDisponibilidad(
            resultado.error || "No se pudo consultar la disponibilidad."
          );
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
    return () => {
      cancelado = true;
    };
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
      setMostrarOpcionesPago(false);
    }
  }, [servicios, servicioId]);

  function validarCampos(): boolean {
    setError("");
    setExito("");

    if (!servicioId) {
      setError("Seleccioná un servicio.");
      return false;
    }
    if (!nombreCliente.trim()) {
      setError("Ingresá tu nombre.");
      return false;
    }
    if (!telefono.trim()) {
      setError("Ingresá tu teléfono de contacto.");
      return false;
    }
    if (!fecha) {
      setError("Seleccioná una fecha.");
      return false;
    }
    if (!hora) {
      setError("Seleccioná uno de los horarios disponibles.");
      return false;
    }

    return true;
  }

  function manejarClickSolicitarTurno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    if (!validarCampos()) return;

    if (senaActiva) {
      setMostrarOpcionesPago(true);
      return;
    }

    void confirmarReserva("local");
  }

  async function confirmarReserva(metodoPago: MetodoPagoElegido) {
    if (enviando) return;
    if (!validarCampos()) return;

    setEnviando(true);

    const servicioObj = servicios.find((s) => s.id === servicioId);
    const nombreServicio = servicioObj?.nombre || "Servicio";
    const duracionMinutos = servicioObj?.duracionMinutos || 30;
    const precioCobro =
      metodoPago === "mp"
        ? montoSena > 0
          ? montoSena
          : Number(servicioObj?.precio || 0)
        : 0;

    try {
      // Si el cliente paga por Mercado Pago, NO creamos el turno en Firestore todavía:
      // generamos la preferencia y redirigimos a Mercado Pago. El turno se crea en el webhook al aprobarse el pago.
      if (metodoPago === "mp") {
        const resPref = await fetch("/api/mercadopago/preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresaId: empresaId || slug,
            slug,
            servicioId,
            servicio: nombreServicio,
            nombreCliente: nombreCliente.trim(),
            telefono: telefono.trim(),
            email: "",
            fecha,
            hora,
            duracionMinutos,
            notas: notas.trim(),
            precio: precioCobro,
          }),
        });

        const dataPref = (await resPref.json()) as {
          init_point?: string;
          error?: string;
        };

        if (!resPref.ok || !dataPref.init_point) {
          if (linkMp) {
            window.location.href = linkMp;
            return;
          }
          setError(dataPref.error || "No se pudo iniciar el pago con Mercado Pago.");
          setEnviando(false);
          return;
        }

        window.location.href = dataPref.init_point;
        return;
      }

      const notasConPago = [notas.trim(), "[Pagar en local]"].filter(Boolean).join(" · ");

      const respuesta = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          servicioId,
          nombreCliente: nombreCliente.trim(),
          telefono: telefono.trim(),
          email: "",
          fecha,
          hora,
          notas: notasConPago,
          metodoPago: "local",
          montoSena: 0,
        }),
      });

      const resultado = (await respuesta.json()) as {
        error?: string;
        servicio?: string;
        fecha?: string;
        hora?: string;
      };

      if (!respuesta.ok) {
        setError(resultado.error || "No se pudo reservar el turno.");
        if (respuesta.status === 409) {
          setHora("");
          setMostrarOpcionesPago(false);
          setRefrescarDisponibilidad((actual) => actual + 1);
        }
        return;
      }

      const servicioTexto = resultado.servicio || nombreServicio;
      const fechaTexto = resultado.fecha || fecha;
      const horaTexto = resultado.hora || hora;

      setNombreCliente("");
      setTelefono("");
      setHora("");
      setNotas("");
      setMostrarOpcionesPago(false);
      setRefrescarDisponibilidad((actual) => actual + 1);

      setExito(
        `Turno solicitado para ${servicioTexto} el ${fechaTexto} a las ${horaTexto} para abonar en el local.`
      );
    } catch (errorReserva) {
      console.error("Error enviando reserva:", errorReserva);
      setError("No se pudo conectar con el sistema de turnos.");
    } finally {
      setEnviando(false);
    }
  }

  if (servicios.length === 0) return null;

  const esCerrado = mensajeDisponibilidad === "HOY CERRADO" && horarios.length === 0;
  const acento = colorPrincipal || "#ED192D";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
      <div>
        <p
          className="mb-1 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: acento }}
        >
          — RESERVA ONLINE
        </p>
        <h2 className="font-serif text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
          Pedí tu turno
        </h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          Elegí un servicio, una fecha y uno de los horarios disponibles.
        </p>
      </div>

      <form onSubmit={manejarClickSolicitarTurno} className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
        {/* SERVICIO */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 sm:mb-2 sm:text-sm">
            Servicio
          </label>
          <select
            value={servicioId}
            onChange={(event) => {
              setServicioId(event.target.value);
              setHora("");
              setMostrarOpcionesPago(false);
              setExito("");
              setError("");
            }}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none transition focus:border-slate-500 sm:px-4 sm:py-3 sm:text-sm"
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
        <Campo
          label="Nombre"
          value={nombreCliente}
          onChange={setNombreCliente}
          placeholder="Tu nombre"
          required
        />
        <Campo
          label="Teléfono"
          value={telefono}
          onChange={setTelefono}
          placeholder="+54 9..."
          type="tel"
          required
        />

        {/* FECHA */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 sm:mb-2 sm:text-sm">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            min={obtenerFechaLocalString(new Date())}
            onChange={(event) => {
              setFecha(event.target.value);
              setHora("");
              setMostrarOpcionesPago(false);
              setExito("");
              setError("");
            }}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none transition focus:border-slate-500 sm:px-4 sm:py-3 sm:text-sm"
          />
        </div>

        {/* HORARIOS */}
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center gap-2 sm:mb-3">
            <Clock3 className="h-4 w-4 text-slate-400" />
            <label className="text-xs font-medium text-slate-700 sm:text-sm">
              Horarios disponibles
            </label>
          </div>

          {!fecha ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 sm:p-5 sm:text-sm">
              Seleccioná una fecha para ver los horarios disponibles.
            </div>
          ) : cargandoHorarios ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:gap-3 sm:p-6 sm:text-sm">
              <Loader2 className="h-5 w-5 animate-spin" /> Consultando horarios...
            </div>
          ) : esCerrado ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-600">
              <p className="text-lg font-bold uppercase tracking-wider">HOY CERRADO</p>
              <p className="mt-1 text-xs text-red-500/90">
                No hay atención disponible para la fecha seleccionada.
              </p>
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
                      setMostrarOpcionesPago(false);
                      setError("");
                      setExito("");
                    }}
                    style={
                      seleccionado
                        ? { backgroundColor: acento, borderColor: acento }
                        : undefined
                    }
                    className={[
                      "rounded-xl border px-2 py-2 text-xs font-semibold transition sm:px-3 sm:py-3 sm:text-sm",
                      seleccionado
                        ? "scale-105 text-white shadow-md"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
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
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              ].join(" ")}
            >
              {mensajeDisponibilidad || "No hay horarios disponibles para esta fecha."}
            </div>
          )}
        </div>

        {/* TURNO ELEGIDO */}
        {hora && !esCerrado && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:col-span-2 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Horario seleccionado
            </p>
            <p className="mt-1 text-base font-bold text-emerald-800 sm:text-lg">
              {fecha} · {hora} hs
            </p>
          </div>
        )}

        {/* NOTAS */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 sm:mb-2 sm:text-sm">
            Nota opcional
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Algo que quieras aclarar..."
            className="h-20 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 sm:h-auto sm:px-4 sm:py-3 sm:text-sm"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-700 sm:col-span-2 sm:p-4 sm:text-sm">
            {error}
          </div>
        )}

        {/* ÉXITO */}
        {exito && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 sm:col-span-2 sm:gap-3 sm:p-4 sm:text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Turno registrado</p>
              <p className="mt-1">{exito}</p>
            </div>
          </div>
        )}

        {/* BOTÓN PRINCIPAL O DOS BOTONES DESPLEGADOS AL SOLICITAR */}
        {!mostrarOpcionesPago ? (
          <button
            type="submit"
            disabled={enviando || cargandoHorarios || !hora || esCerrado}
            style={{ backgroundColor: acento }}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2 sm:px-6 sm:py-3.5 sm:text-base"
          >
            {enviando
              ? "Reservando..."
              : esCerrado
                ? "Cerrado"
                : hora
                  ? `Solicitar turno · ${hora} hs`
                  : "Seleccioná un horario"}
          </button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ¿Cómo querés confirmar el turno de las {hora} hs?
              </p>
              <button
                type="button"
                onClick={() => setMostrarOpcionesPago(false)}
                className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
              >
                Volver
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={enviando}
                onClick={() => void confirmarReserva("mp")}
                style={{ backgroundColor: acento }}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:text-sm"
              >
                <Wallet className="h-4 w-4 shrink-0" />
                <span>
                  {enviando
                    ? "Redirigiendo a MP..."
                    : `Pagar anticipo por MP · $${montoSena.toLocaleString("es-AR")}`}
                </span>
              </button>

              <button
                type="button"
                disabled={enviando}
                onClick={() => void confirmarReserva("local")}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
              >
                <Store className="h-4 w-4 shrink-0" />
                <span>{enviando ? "Reservando..." : "Pagar en local"}</span>
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-500 sm:col-span-2 sm:text-xs">
          Ingresá tu teléfono para que el negocio pueda contactarte. Al solicitar el turno, aceptás
          nuestros{" "}
          <a
            href="/eddubarber/terminos"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:text-slate-800"
          >
            Términos y Condiciones
          </a>
          .
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
      <label className="mb-1.5 block text-xs font-medium text-slate-700 sm:mb-2 sm:text-sm">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 sm:px-4 sm:py-3 sm:text-sm"
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