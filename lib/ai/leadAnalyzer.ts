export type AnalisisLead = {
  puntuacionLead: number;
  nivelInteres: "bajo" | "medio" | "alto";
  etiquetas: string[];
};

const REGLAS = [
  {
    puntos: 30,
    etiquetas: ["presupuesto"],
    palabras: [
      "precio",
      "presupuesto",
      "cotizacion",
      "cotización",
      "cuanto cuesta",
      "valor",
      "costo",
    ],
  },
  {
    puntos: 25,
    etiquetas: ["compra"],
    palabras: [
      "quiero",
      "necesito",
      "contratar",
      "comprar",
      "hacer",
      "adquirir",
    ],
  },
  {
    puntos: 20,
    etiquetas: ["urgente"],
    palabras: [
      "urgente",
      "hoy",
      "ahora",
      "cuanto antes",
      "rápido",
      "rapido",
    ],
  },
  {
    puntos: 15,
    etiquetas: ["contacto"],
    palabras: [
      "telefono",
      "teléfono",
      "whatsapp",
      "llamame",
      "llamar",
      "email",
    ],
  },
  {
    puntos: 10,
    etiquetas: ["empresa"],
    palabras: [
      "empresa",
      "negocio",
      "emprendimiento",
      "local",
    ],
  },
];

export function analizarLead(mensaje: string): AnalisisLead {
  const texto = mensaje.toLowerCase();

  let puntuacion = 0;
  const etiquetas = new Set<string>();

  for (const regla of REGLAS) {
    const coincide = regla.palabras.some((palabra) =>
      texto.includes(palabra)
    );

    if (coincide) {
      puntuacion += regla.puntos;
      regla.etiquetas.forEach((e) => etiquetas.add(e));
    }
  }

  puntuacion = Math.min(100, puntuacion);

  let nivel: "bajo" | "medio" | "alto" = "bajo";

  if (puntuacion >= 70) {
    nivel = "alto";
  } else if (puntuacion >= 40) {
    nivel = "medio";
  }

  return {
    puntuacionLead: puntuacion,
    nivelInteres: nivel,
    etiquetas: [...etiquetas],
  };
}