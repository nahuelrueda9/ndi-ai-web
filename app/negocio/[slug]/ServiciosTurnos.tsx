"use client";

import { Calendar, Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";

type Servicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracionMinutos?: number;
  imagenUrl?: string;
  imagenes?: string[];
};

type SlotHorario = {
  fecha: string;
  hora: string;
  etiquetaFecha?: string;
};

type Props = {
  slug: string;
  servicios: Servicio[];
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
  puedeReservar?: boolean;
};

function precioARS(valor?: number) {
  const numero = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return `$${numero.toLocaleString("es-AR")}`;
}

function obtenerImagenes(servicio: Servicio) {
  const imagenes = Array.isArray(servicio.imagenes)
    ? servicio.imagenes.filter((url): url is string => typeof url === "string" && url.trim().length > 0).map((url) => url.trim()).slice(0, 3)
    : [];

  if (imagenes.length === 0 && servicio.imagenUrl?.trim()) {
    imagenes.push(servicio.imagenUrl.trim());
  }

  return imagenes;
}

export default function ServiciosTurnos({
  slug,
  servicios,
  colorPrincipal,
  tema = "oscuro",
  puedeReservar = false,
}: Props) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [slotsEjemplo, setSlotsEjemplo] = useState<SlotHorario[]>([]);

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
  const estiloCard = claro
    ? "border-slate-200 bg-white text-slate-950 shadow-sm"
    : "border-zinc-800 bg-zinc-900 text-white shadow-none";

  const estiloHorarioChip = claro
    ? "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
    : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800";

  const claseSecundario = claro ? "text-slate-500" : "text-zinc-400";

  useEffect(() => {
    // Generar 3 horarios de ejemplo simulados para las tarjetas
    const ahora = new Date();
    const slots: SlotHorario[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(ahora.getTime() + i * 3600000 * 24);
      slots.push({
        fecha: d.toISOString().split("T")[0],
        hora: i === 1 ? "09:00" : i === 2 ? "09:30" : "10:00",
        etiquetaFecha: `lun ${d.getDate()}-${d.getMonth() + 1}`,
      });
    }
    setSlotsEjemplo(slots);
  }, []);

  return (
    <>
      <div className="mt-10 space-y-12">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                Lo que ofrecemos
              </p>
              <h3 className={`text-xl font-bold tracking-tight sm:text-2xl ${claro ? "text-slate-950" : "text-white"}`}>Servicios</h3>
            </div>
            <span className={`text-xs ${claseSecundario}`}>
              {servicios.length} {servicios.length === 1 ? "opción" : "opciones"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map((servicio) => {
              const imagenes = obtenerImagenes(servicio);

              return (
                <article key={servicio.id} className={`group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-md ${estiloCard}`}>
                  {imagenes.length > 0 && (
                    <div className={`relative aspect-[16/10] overflow-hidden border-b ${claro ? "border-slate-100 bg-slate-50" : "border-zinc-800 bg-zinc-950"}`}>
                      <img src={imagenes[0]} alt={servicio.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <h4 className={`text-base font-bold sm:text-lg ${claro ? "text-slate-900" : "text-white"}`}>{servicio.nombre}</h4>

                    {servicio.descripcion && (
                      <p className={`mt-1.5 line-clamp-2 text-xs leading-5 sm:text-sm ${claseSecundario}`}>
                        {servicio.descripcion}
                      </p>
                    )}

                    <div className={`mt-4 flex items-center justify-between border-t pt-3 ${claro ? "border-slate-100" : "border-zinc-800"}`}>
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider ${claseSecundario}`}>Precio</p>
                        <p className="mt-0.5 text-base font-bold sm:text-lg" style={{ color: colorPrincipal }}>
                          {precioARS(servicio.precio)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] uppercase tracking-wider ${claseSecundario}`}>Duración</p>
                        <p className={`mt-0.5 text-xs font-semibold sm:text-sm ${claro ? "text-slate-700" : "text-zinc-300"}`}>
                          {servicio.duracionMinutos || 30} min
                        </p>
                      </div>
                    </div>

                    <div className={`mt-4 border-t pt-3 ${claro ? "border-slate-100" : "border-zinc-800"}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${claseSecundario}`}>Próximos horarios</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {slotsEjemplo.slice(0, 3).map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setServicioSeleccionado(servicio)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${estiloHorarioChip}`}
                          >
                            <span style={{ color: colorPrincipal }}>{slot.etiquetaFecha || "hoy"}</span> {slot.hora}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setServicioSeleccionado(servicio)}
                        className="mt-2 text-xs font-semibold hover:underline"
                        style={{ color: colorPrincipal }}
                      >
                        Ver más horarios →
                      </button>
                    </div>

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => setServicioSeleccionado(servicio)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white transition hover:brightness-110 sm:text-sm"
                        style={{ backgroundColor: colorPrincipal }}
                      >
                        <Clock3 className="h-4 w-4" /> Reservar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE RESERVA DE TURNO */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Cerrar" className="absolute inset-0" onClick={() => setServicioSeleccionado(null)} />

          <div className={`relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl sm:p-8 ${claro ? "border-slate-200 bg-white text-slate-950" : "border-zinc-700 bg-zinc-900 text-white"}`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colorPrincipal }}>
                  Seleccionar turno
                </p>
                <h3 className="text-lg font-bold sm:text-xl">{servicioSeleccionado.nombre}</h3>
              </div>
              <button
                type="button"
                onClick={() => setServicioSeleccionado(null)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${claro ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border p-4 border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colorPrincipal }}>Detalle del servicio</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold">{precioARS(servicioSeleccionado.precio)}</span>
                  <span className={`text-xs ${claseSecundario}`}>Duración: {servicioSeleccionado.duracionMinutos || 30} min</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">Elegí fecha y hora</label>
                <input
                  type="datetime-local"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${claro ? "border-slate-300 bg-white text-slate-950" : "border-zinc-700 bg-zinc-950 text-white [&::-webkit-calendar-picker-indicator]:invert"}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">Tu nombre</label>
                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${claro ? "border-slate-300 bg-white text-slate-950" : "border-zinc-700 bg-zinc-950 text-white"}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+54..."
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${claro ? "border-slate-300 bg-white text-slate-950" : "border-zinc-700 bg-zinc-950 text-white"}`}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  alert("Turno solicitado con éxito. El negocio se pondrá en contacto.");
                  setServicioSeleccionado(null);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: colorPrincipal }}
              >
                <Calendar className="h-4 w-4" /> Confirmar reserva de turno
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}