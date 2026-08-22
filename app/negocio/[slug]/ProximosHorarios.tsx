"use client";

import { Loader2 } from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

type Props = {
  slug: string;
  servicioId: string;
  colorPrincipal: string;
  tema?: "oscuro" | "claro";
};

type HorarioRapido = {
  fecha: string;
  hora: string;
};

type DisponibilidadResponse = {
  horarios?: string[];
};

function aFechaISO(
  fecha: Date,
) {
  const anio =
    fecha.getFullYear();
  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");
  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function sumarDias(
  fecha: Date,
  cantidad: number,
) {
  const resultado =
    new Date(fecha);

  resultado.setDate(
    resultado.getDate() +
      cantidad,
  );

  return resultado;
}

function obtenerHoraActual() {
  const ahora =
    new Date();

  return `${String(
    ahora.getHours(),
  ).padStart(2, "0")}:${String(
    ahora.getMinutes(),
  ).padStart(2, "0")}`;
}

function etiquetaFecha(
  valor: string,
) {
  const hoy =
    new Date();

  if (
    valor ===
    aFechaISO(hoy)
  ) {
    return "Hoy";
  }

  if (
    valor ===
    aFechaISO(
      sumarDias(hoy, 1),
    )
  ) {
    return "Mañ";
  }

  const [
    anio,
    mes,
    dia,
  ] = valor
    .split("-")
    .map(Number);

  return new Date(
    anio,
    mes - 1,
    dia,
  )
    .toLocaleDateString(
      "es-AR",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      },
    )
    .replace(".", "");
}

function abrirReserva({
  servicioId,
  fecha,
  hora,
}: {
  servicioId: string;
  fecha?: string;
  hora?: string;
}) {
  window.dispatchEvent(
    new CustomEvent(
      "ndi:seleccionar-turno",
      {
        detail: {
          servicioId,
          fecha,
          hora,
        },
      },
    ),
  );

  requestAnimationFrame(
    () => {
      document
        .getElementById(
          "reservar",
        )
        ?.scrollIntoView({
          behavior:
            "smooth",
          block:
            "start",
        });
    },
  );
}

export default function ProximosHorarios({
  slug,
  servicioId,
  colorPrincipal,
  tema = "oscuro",
}: Props) {
  // Detección dinámica del tema claro u oscuro del documento en tiempo real
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

  const [
    horarios,
    setHorarios,
  ] = useState<
    HorarioRapido[]
  >([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  useEffect(() => {
    let cancelado =
      false;

    async function cargar() {
      setCargando(true);

      const encontrados:
        HorarioRapido[] = [];

      const hoy =
        new Date();

      const hoyISO =
        aFechaISO(hoy);

      const horaActual =
        obtenerHoraActual();

      for (
        let i = 0;
        i < 7 &&
        encontrados.length < 3;
        i += 1
      ) {
        if (cancelado) {
          return;
        }

        const fecha =
          aFechaISO(
            sumarDias(
              hoy,
              i,
            ),
          );

        try {
          const params =
            new URLSearchParams({
              slug,
              servicioId,
              fecha,
            });

          const response =
            await fetch(
              `/api/public/appointments?${params.toString()}`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
              },
            );

          const data =
            (await response.json()) as DisponibilidadResponse;

          if (
            cancelado
          ) {
            return;
          }

          if (
            !response.ok
          ) {
            continue;
          }

          const disponibles =
            Array.isArray(
              data.horarios,
            )
              ? data.horarios
              : [];

          for (
            const hora of
              disponibles
          ) {
            if (
              fecha ===
                hoyISO &&
              hora <=
                horaActual
            ) {
              continue;
            }

            encontrados.push(
              {
                fecha,
                hora,
              },
            );

            if (
              encontrados.length >=
              3
            ) {
              break;
            }
          }
        } catch {
          // Continuar si falla un día
        }
      }

      if (
        !cancelado
      ) {
        setHorarios(
          encontrados.slice(
            0,
            3,
          ),
        );

        setCargando(
          false,
        );
      }
    }

    void cargar();

    return () => {
      cancelado =
        true;
    };
  }, [
    slug,
    servicioId,
  ]);

  const primero =
    horarios[0];

  return (
    <div
      className={`mt-3 border-t pt-3 ${
        esClaro
          ? "border-slate-200"
          : "border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-xs ${
            esClaro
              ? "text-slate-500"
              : "text-zinc-500"
          }`}
        >
          Próximos horarios
        </p>

        {cargando && (
          <Loader2
            className="h-3.5 w-3.5 animate-spin"
            style={{
              color:
                colorPrincipal,
            }}
          />
        )}
      </div>

      {!cargando &&
        horarios.length >
          0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {horarios.map(
              (horario) => (
                <button
                  key={`${horario.fecha}-${horario.hora}`}
                  type="button"
                  onClick={() =>
                    abrirReserva(
                      {
                        servicioId,
                        fecha:
                          horario.fecha,
                        hora:
                          horario.hora,
                      },
                    )
                  }
                  className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition hover:-translate-y-0.5 sm:text-xs ${
                    esClaro
                      ? "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
                      : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <span
                    className="mr-1"
                    style={{
                      color:
                        colorPrincipal,
                    }}
                  >
                    {etiquetaFecha(
                      horario.fecha,
                    )}
                  </span>
                  {horario.hora}
                </button>
              ),
            )}
          </div>
        )}

      {!cargando && (
        <button
          type="button"
          onClick={() =>
            abrirReserva({
              servicioId,
              fecha:
                primero
                  ?.fecha,
            })
          }
          className="mt-2 text-[11px] font-semibold transition hover:opacity-75 sm:text-xs"
          style={{
            color:
              colorPrincipal,
          }}
        >
          {horarios.length >
          0
            ? "Ver más horarios →"
            : "Ver disponibilidad →"}
        </button>
      )}
    </div>
  );
}