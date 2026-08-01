export type NombreHerramienta =
  | "solicitar_atencion_humana"
  | "guardar_datos_contacto"
  | "crear_tarea_comercial";

export type SolicitarAtencionHumanaArgs = {
  motivo?: string;
  urgencia?: "baja" | "media" | "alta";
};

export type GuardarDatosContactoArgs = {
  nombre?: string;
  email?: string;
  telefono?: string;
  empresa?: string;
};

export type CrearTareaComercialArgs = {
  titulo: string;
  descripcion?: string;
  prioridad?: "baja" | "media" | "alta";
};

export type ArgumentosHerramienta = {
  solicitar_atencion_humana: SolicitarAtencionHumanaArgs;
  guardar_datos_contacto: GuardarDatosContactoArgs;
  crear_tarea_comercial: CrearTareaComercialArgs;
};

export type LlamadaHerramienta<
  T extends NombreHerramienta = NombreHerramienta
> = {
  nombre: T;
  argumentos: ArgumentosHerramienta[T];
};

export const herramientasIA = [
  {
    type: "function",
    function: {
      name: "solicitar_atencion_humana",
      description:
        "Solicita que un asesor humano continúe la conversación. Usar cuando el visitante lo pida expresamente, tenga una queja importante o la IA no pueda resolver su consulta.",
      parameters: {
        type: "object",
        properties: {
          motivo: {
            type: "string",
            description:
              "Motivo breve por el cual se solicita atención humana.",
          },
          urgencia: {
            type: "string",
            enum: ["baja", "media", "alta"],
            description: "Nivel de urgencia de la solicitud.",
          },
        },
        required: ["motivo"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_datos_contacto",
      description:
  "Guardar automáticamente nombre, email, teléfono y empresa cuando el visitante los mencione. Debe ejecutarse cada vez que el usuario proporcione alguno de esos datos.",
      parameters: {
        type: "object",
        properties: {
          nombre: {
            type: "string",
            description: "Nombre del visitante.",
          },
          email: {
            type: "string",
            description: "Correo electrónico del visitante.",
          },
          telefono: {
            type: "string",
            description: "Número de teléfono del visitante.",
          },
          empresa: {
            type: "string",
            description: "Empresa u organización del visitante.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_tarea_comercial",
      description:
        "Crea una tarea para que el equipo comercial realice un seguimiento del visitante.",
      parameters: {
        type: "object",
        properties: {
          titulo: {
            type: "string",
            description: "Título breve de la tarea.",
          },
          descripcion: {
            type: "string",
            description: "Información útil para el equipo comercial.",
          },
          prioridad: {
            type: "string",
            enum: ["baja", "media", "alta"],
            description: "Prioridad de la tarea.",
          },
        },
        required: ["titulo"],
        additionalProperties: false,
      },
    },
  },
] as const;

export function esNombreHerramienta(
  nombre: string
): nombre is NombreHerramienta {
  return (
    nombre === "solicitar_atencion_humana" ||
    nombre === "guardar_datos_contacto" ||
    nombre === "crear_tarea_comercial"
  );
}

export function parsearArgumentosHerramienta(
  argumentos: string | Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!argumentos) {
    return {};
  }

  if (typeof argumentos === "object") {
    return argumentos;
  }

  try {
    const resultado = JSON.parse(argumentos);

    if (
      resultado &&
      typeof resultado === "object" &&
      !Array.isArray(resultado)
    ) {
      return resultado as Record<string, unknown>;
    }

    return {};
  } catch (error) {
    console.error(
      "No se pudieron interpretar los argumentos de la herramienta:",
      error
    );

    return {};
  }
}