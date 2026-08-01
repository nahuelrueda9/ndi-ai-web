"use client";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";

type TipoActividad =
  | "todos"
  | "chat"
  | "ia"
  | "humano"
  | "nota"
  | "tag"
  | "memoria"
  | "archivo"
  | "estado"
  | "sistema";

type Actividad = {
  id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion?: string;
  icono?: string;
  createdAt?: Timestamp;
};

type CustomerActivityPanelProps = {
  empresaId: string;
  chatId: string;
};

const FILTROS: Array<{
  valor: TipoActividad;
  etiqueta: string;
}> = [
  {
    valor: "todos",
    etiqueta: "Todo",
  },
  {
    valor: "chat",
    etiqueta: "Mensajes",
  },
  {
    valor: "nota",
    etiqueta: "Notas",
  },
  {
    valor: "tag",
    etiqueta: "Etiquetas",
  },
  {
    valor: "memoria",
    etiqueta: "Cliente",
  },
  {
    valor: "humano",
    etiqueta: "Operador",
  },
  {
    valor: "ia",
    etiqueta: "IA",
  },
  {
    valor: "estado",
    etiqueta: "Estado",
  },
];

export default function CustomerActivityPanel({
  empresaId,
  chatId,
}: CustomerActivityPanelProps) {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] =
    useState<TipoActividad>("todos");

  useEffect(() => {
    setActividades([]);
    setCargando(true);
    setError("");
    setBusqueda("");
    setFiltroActivo("todos");

    if (!empresaId || !chatId) {
      setError("No se encontró la conversación.");
      setCargando(false);
      return;
    }

    const actividadesReferencia = collection(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId,
      "activity"
    );

    const actividadesQuery = query(
      actividadesReferencia,
      orderBy("createdAt", "desc")
    );

    const cancelarSuscripcion = onSnapshot(
      actividadesQuery,
      (snapshot) => {
        const lista: Actividad[] = snapshot.docs.map(
          (documento) => {
            const datos = documento.data();

            return {
              id: documento.id,
              tipo: normalizarTipo(datos.tipo),
              titulo: datos.titulo || "Actividad",
              descripcion: datos.descripcion || "",
              icono: datos.icono || "",
              createdAt: datos.createdAt,
            };
          }
        );

        setActividades(lista);
        setCargando(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar el historial de actividad:",
          firebaseError
        );

        setError("No se pudo cargar el historial.");
        setCargando(false);
      }
    );

    return () => {
      cancelarSuscripcion();
    };
  }, [empresaId, chatId]);

  const actividadesFiltradas = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return actividades.filter((actividad) => {
      const coincideFiltro =
        filtroActivo === "todos" ||
        actividad.tipo === filtroActivo;

      const coincideBusqueda =
        !textoBusqueda ||
        actividad.titulo
          .toLowerCase()
          .includes(textoBusqueda) ||
        actividad.descripcion
          ?.toLowerCase()
          .includes(textoBusqueda);

      return coincideFiltro && coincideBusqueda;
    });
  }, [actividades, busqueda, filtroActivo]);

  const actividadesAgrupadas = useMemo(() => {
    const grupos: Record<string, Actividad[]> = {};

    actividadesFiltradas.forEach((actividad) => {
      const grupo = obtenerGrupoFecha(actividad.createdAt);

      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }

      grupos[grupo].push(actividad);
    });

    return Object.entries(grupos);
  }, [actividadesFiltradas]);

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Actividad
            </h3>

            <p className="mt-0.5 text-xs text-zinc-500">
              Historial completo de la conversación
            </p>
          </div>

          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">
            {actividades.length}
          </span>
        </div>
      </div>

      <div className="space-y-4 border-b border-zinc-800 p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-600">
            🔎
          </span>

          <input
            type="text"
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
            placeholder="Buscar en el historial..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((filtro) => {
            const activo = filtroActivo === filtro.valor;

            return (
              <button
                key={filtro.valor}
                type="button"
                onClick={() =>
                  setFiltroActivo(filtro.valor)
                }
                className={[
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  activo
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
                ].join(" ")}
              >
                {filtro.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-[560px] overflow-y-auto p-4">
        {cargando ? (
          <EstadoCargando />
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        ) : actividades.length === 0 ? (
          <EstadoVacio />
        ) : actividadesFiltradas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-400">
              No encontramos resultados
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Probá con otro filtro o búsqueda.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {actividadesAgrupadas.map(
              ([grupo, actividadesGrupo]) => (
                <div key={grupo}>
                  <div className="mb-4 flex items-center gap-3">
                    <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {grupo}
                    </p>

                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>

                  <div className="space-y-1">
                    {actividadesGrupo.map(
                      (actividad, indice) => (
                        <ActividadItem
                          key={actividad.id}
                          actividad={actividad}
                          mostrarLinea={
                            indice <
                            actividadesGrupo.length - 1
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ActividadItem({
  actividad,
  mostrarLinea,
}: {
  actividad: Actividad;
  mostrarLinea: boolean;
}) {
  const estilo = obtenerEstiloActividad(actividad.tipo);

  return (
    <article className="relative flex gap-3 pb-5">
      {mostrarLinea && (
        <div className="absolute left-[17px] top-10 h-[calc(100%-24px)] w-px bg-zinc-800" />
      )}

      <div
        className={[
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm",
          estilo.icono,
        ].join(" ")}
      >
        {actividad.icono || estilo.emoji}
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="break-words text-sm font-medium text-zinc-200">
              {actividad.titulo}
            </p>

            {actividad.descripcion && (
              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-500">
                {actividad.descripcion}
              </p>
            )}
          </div>

          <span className="shrink-0 text-[11px] text-zinc-600">
            {formatearTiempoRelativo(
              actividad.createdAt
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-800 pt-2">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              estilo.etiqueta,
            ].join(" ")}
          >
            {obtenerNombreTipo(actividad.tipo)}
          </span>

          <span className="text-[10px] text-zinc-600">
            {formatearHoraCompleta(
              actividad.createdAt
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

function EstadoCargando() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
    </div>
  );
}

function EstadoVacio() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-xl">
        🕘
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-400">
        Todavía no hay actividad
      </p>

      <p className="mt-1 text-xs leading-5 text-zinc-600">
        Las acciones importantes de esta conversación
        aparecerán acá.
      </p>
    </div>
  );
}

function obtenerEstiloActividad(tipo: TipoActividad) {
  switch (tipo) {
    case "chat":
      return {
        emoji: "💬",
        icono:
          "border-blue-500/30 bg-blue-500/10 text-blue-300",
        etiqueta:
          "bg-blue-500/10 text-blue-300",
      };

    case "nota":
      return {
        emoji: "📝",
        icono:
          "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
        etiqueta:
          "bg-yellow-500/10 text-yellow-300",
      };

    case "tag":
      return {
        emoji: "🏷️",
        icono:
          "border-purple-500/30 bg-purple-500/10 text-purple-300",
        etiqueta:
          "bg-purple-500/10 text-purple-300",
      };

    case "memoria":
      return {
        emoji: "🧠",
        icono:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        etiqueta:
          "bg-cyan-500/10 text-cyan-300",
      };

    case "humano":
      return {
        emoji: "👤",
        icono:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        etiqueta:
          "bg-emerald-500/10 text-emerald-300",
      };

    case "ia":
      return {
        emoji: "🤖",
        icono:
          "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
        etiqueta:
          "bg-indigo-500/10 text-indigo-300",
      };

    case "estado":
      return {
        emoji: "🔒",
        icono:
          "border-orange-500/30 bg-orange-500/10 text-orange-300",
        etiqueta:
          "bg-orange-500/10 text-orange-300",
      };

    case "archivo":
      return {
        emoji: "📎",
        icono:
          "border-pink-500/30 bg-pink-500/10 text-pink-300",
        etiqueta:
          "bg-pink-500/10 text-pink-300",
      };

    default:
      return {
        emoji: "⚙️",
        icono:
          "border-zinc-700 bg-zinc-900 text-zinc-300",
        etiqueta:
          "bg-zinc-800 text-zinc-400",
      };
  }
}

function obtenerNombreTipo(tipo: TipoActividad) {
  switch (tipo) {
    case "chat":
      return "Mensaje";

    case "nota":
      return "Nota";

    case "tag":
      return "Etiqueta";

    case "memoria":
      return "Cliente";

    case "humano":
      return "Operador";

    case "ia":
      return "IA";

    case "estado":
      return "Estado";

    case "archivo":
      return "Archivo";

    default:
      return "Sistema";
  }
}

function normalizarTipo(tipo: unknown): TipoActividad {
  const tiposPermitidos: TipoActividad[] = [
    "chat",
    "ia",
    "humano",
    "nota",
    "tag",
    "memoria",
    "archivo",
    "estado",
    "sistema",
  ];

  if (
    typeof tipo === "string" &&
    tiposPermitidos.includes(tipo as TipoActividad)
  ) {
    return tipo as TipoActividad;
  }

  return "sistema";
}

function obtenerGrupoFecha(fecha?: Timestamp) {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaActividad = fecha.toDate();
  const hoy = new Date();

  const inicioHoy = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate()
  );

  const inicioActividad = new Date(
    fechaActividad.getFullYear(),
    fechaActividad.getMonth(),
    fechaActividad.getDate()
  );

  const diferenciaDias = Math.round(
    (inicioHoy.getTime() - inicioActividad.getTime()) /
      86_400_000
  );

  if (diferenciaDias === 0) {
    return "Hoy";
  }

  if (diferenciaDias === 1) {
    return "Ayer";
  }

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year:
      fechaActividad.getFullYear() !==
      hoy.getFullYear()
        ? "numeric"
        : undefined,
  }).format(fechaActividad);
}

function formatearTiempoRelativo(fecha?: Timestamp) {
  if (!fecha) {
    return "Ahora";
  }

  const diferencia =
    Date.now() - fecha.toDate().getTime();

  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 15) {
    return "Ahora";
  }

  if (segundos < 60) {
    return `Hace ${segundos} s`;
  }

  if (minutos < 60) {
    return `Hace ${minutos} ${
      minutos === 1 ? "minuto" : "minutos"
    }`;
  }

  if (horas < 24) {
    return `Hace ${horas} ${
      horas === 1 ? "hora" : "horas"
    }`;
  }

  if (dias < 7) {
    return `Hace ${dias} ${
      dias === 1 ? "día" : "días"
    }`;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(fecha.toDate());
}

function formatearHoraCompleta(fecha?: Timestamp) {
  if (!fecha) {
    return "Guardando...";
  }

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha.toDate());
}