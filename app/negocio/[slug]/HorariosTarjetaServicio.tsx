"use client";

import { useEffect, useState } from "react";
import { Clock3, Loader2 } from "lucide-react";

interface Props {
  slug: string;
  servicioId: string;
  colorPrincipal: string;
}

// Función auxiliar para obtener la fecha local exacta (YYYY-MM-DD) sin desfasaje UTC
function obtenerFechaLocalString(date: Date) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export default function HorariosTarjetaServicio({ slug, servicioId, colorPrincipal }: Props) {
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esManana, setEsManana] = useState(false);
  const [fechaStr, setFechaStr] = useState("");

  useEffect(() => {
    async function obtenerHorariosDinamicos() {
      setCargando(true);
      try {
        const ahora = new Date();
        const horaActualStr = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
        
        let fechaConsulta = new Date();
        
        // Si ya son más de las 21:30 o se terminaron los horarios de hoy, consultamos mañana
        if (horaActualStr > "21:30") {
          fechaConsulta.setDate(fechaConsulta.getDate() + 1);
          setEsManana(true);
        }

        const fechaFormateada = obtenerFechaLocalString(fechaConsulta);
        setFechaStr(fechaFormateada);

        // Fetch a la API pública de disponibilidad que consulta Firestore
        const res = await fetch(
          `/api/public/appointments?slug=${slug}&servicioId=${servicioId}&fecha=${fechaFormateada}`
        );

        if (res.ok) {
          const data = await res.json();
          // Si la API devuelve los slots configurados por el dueño
          if (Array.isArray(data.horariosDisponibles)) {
            setHorarios(data.horariosDisponibles);
          } else {
            setHorarios(data.horarios || []);
          }
        }
      } catch (error) {
        console.error("Error al obtener horarios del negocio:", error);
      } finally {
        setCargando(false);
      }
    }

    obtenerHorariosDinamicos();
  }, [slug, servicioId]);

  if (cargando) {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 py-2 text-xs text-zinc-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ED192D]" /> Cargando turnos...
      </div>
    );
  }

  if (horarios.length === 0) {
    return (
      <div className="mt-3 text-center text-[11px] text-zinc-500">
        Sin horarios disponibles {esManana ? "para mañana" : "para hoy"}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        <Clock3 className="h-3 w-3 text-[#ED192D]" /> {esManana ? "Turnos para mañana" : "Turnos para hoy"}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {horarios.map((hora) => (
          <button
            key={hora}
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("ndi:seleccionar-turno", {
                  detail: { servicioId, fecha: fechaStr, hora },
                })
              );
              document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-lg border border-zinc-700/60 bg-zinc-800/80 py-1.5 text-center text-xs font-bold text-zinc-200 transition duration-200 hover:scale-105 hover:border-[#ED192D] hover:bg-[#ED192D] hover:text-white"
          >
            {hora}
          </button>
        ))}
      </div>
    </div>
  );
}