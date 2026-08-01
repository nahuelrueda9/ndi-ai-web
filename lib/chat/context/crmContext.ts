export type NotaCRMContext = {
  contenido?: string;
  autor?: string;
  createdAt?: string;
};

export type ActividadCRMContext = {
  tipo?: string;
  titulo?: string;
  descripcion?: string;
  createdAt?: string;
};

export type CRMContext = {
  tags: string[];
  notas: NotaCRMContext[];
  actividades: ActividadCRMContext[];
};

const MAXIMO_TAGS = 20;
const MAXIMO_NOTAS = 8;
const MAXIMO_ACTIVIDADES = 10;
const MAXIMO_CARACTERES_NOTA = 600;
const MAXIMO_CARACTERES_ACTIVIDAD = 400;

function limpiarTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 60))
    )
  ).slice(0, MAXIMO_TAGS);
}

function limpiarNotas(notas: unknown): NotaCRMContext[] {
  if (!Array.isArray(notas)) {
    return [];
  }

  return notas
    .filter((nota): nota is Record<string, unknown> => {
      if (!nota || typeof nota !== "object") {
        return false;
      }

      const contenido =
        typeof nota.contenido === "string"
          ? nota.contenido
          : typeof nota.texto === "string"
          ? nota.texto
          : "";

      return contenido.trim().length > 0;
    })
    .map((nota) => {
      const contenido =
        typeof nota.contenido === "string"
          ? nota.contenido
          : typeof nota.texto === "string"
          ? nota.texto
          : "";

      return {
        contenido: contenido
          .trim()
          .slice(0, MAXIMO_CARACTERES_NOTA),

        autor:
          typeof nota.autor === "string" && nota.autor.trim()
            ? nota.autor.trim().slice(0, 80)
            : undefined,

        createdAt:
          typeof nota.createdAt === "string" &&
          nota.createdAt.trim()
            ? nota.createdAt.trim().slice(0, 80)
            : undefined,
      };
    })
    .slice(-MAXIMO_NOTAS);
}

function limpiarActividades(
  actividades: unknown
): ActividadCRMContext[] {
  if (!Array.isArray(actividades)) {
    return [];
  }

  return actividades
    .filter(
      (
        actividad
      ): actividad is Record<string, unknown> => {
        if (!actividad || typeof actividad !== "object") {
          return false;
        }

        return (
          (typeof actividad.titulo === "string" &&
            actividad.titulo.trim().length > 0) ||
          (typeof actividad.descripcion === "string" &&
            actividad.descripcion.trim().length > 0)
        );
      }
    )
    .map((actividad) => ({
      tipo:
        typeof actividad.tipo === "string" &&
        actividad.tipo.trim()
          ? actividad.tipo.trim().slice(0, 50)
          : undefined,

      titulo:
        typeof actividad.titulo === "string" &&
        actividad.titulo.trim()
          ? actividad.titulo
              .trim()
              .slice(0, MAXIMO_CARACTERES_ACTIVIDAD)
          : "Actividad",

      descripcion:
        typeof actividad.descripcion === "string" &&
        actividad.descripcion.trim()
          ? actividad.descripcion
              .trim()
              .slice(0, MAXIMO_CARACTERES_ACTIVIDAD)
          : undefined,

      createdAt:
        typeof actividad.createdAt === "string" &&
        actividad.createdAt.trim()
          ? actividad.createdAt.trim().slice(0, 80)
          : undefined,
    }))
    .slice(-MAXIMO_ACTIVIDADES);
}

export function obtenerCRMContext({
  tags,
  notas,
  actividades,
}: {
  tags: unknown;
  notas: unknown;
  actividades: unknown;
}): CRMContext {
  return {
    tags: limpiarTags(tags),
    notas: limpiarNotas(notas),
    actividades: limpiarActividades(actividades),
  };
}
export function construirBloquesCRM({
  tags,
  notas,
  actividades,
}: CRMContext) {
  const bloqueTags =
    tags.length > 0
      ? tags.map((tag) => `- ${tag}`).join("\n")
      : "No hay etiquetas asignadas.";

  const bloqueNotas =
    notas.length > 0
      ? notas
          .map((nota, indice) => {
            const detalles = [
              nota.autor
                ? `Autor: ${nota.autor}`
                : "",
              nota.createdAt
                ? `Fecha: ${nota.createdAt}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ");

            return [
              `${indice + 1}. ${nota.contenido || ""}`,
              detalles ? `   ${detalles}` : "",
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n")
      : "No hay notas internas.";

  const bloqueActividades =
    actividades.length > 0
      ? actividades
          .map((actividad, indice) => {
            const encabezado = [
              actividad.tipo
                ? `[${actividad.tipo}]`
                : "",
              actividad.titulo || "Actividad",
            ]
              .filter(Boolean)
              .join(" ");

            const detalles = [
              actividad.descripcion || "",
              actividad.createdAt
                ? `Fecha: ${actividad.createdAt}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ");

            return `${indice + 1}. ${encabezado}${
              detalles ? ` — ${detalles}` : ""
            }`;
          })
          .join("\n")
      : "No hay actividad reciente.";

  return {
    bloqueTags,
    bloqueNotas,
    bloqueActividades,
  };
}