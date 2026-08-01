export type NivelInteresLead = "bajo" | "medio" | "alto";
export type PrioridadTareaCRM = "baja" | "media" | "alta";

export type ResultadoAutomatizacionCRM = {
  etiquetas: string[];
  puntuacionLead: number;
  nivelInteres: NivelInteresLead;

  crearTarea: boolean;
  tituloTarea?: string;
  descripcionTarea?: string;
  prioridadTarea?: PrioridadTareaCRM;
  fechaVencimientoTarea?: string;

  emailDetectado?: string;
  telefonoDetectado?: string;

  motivos: string[];
};

const PALABRAS_COMPRA = [
  "quiero comprar",
  "quiero contratar",
  "me interesa",
  "estoy interesado",
  "estoy interesada",
  "como compro",
  "como contrato",
  "quiero avanzar",
  "quiero hacerlo",
  "lo necesito",
  "quiero el servicio",
  "quiero el producto",
  "quiero empezar",
  "quiero arrancar",
];

const PALABRAS_PRESUPUESTO = [
  "presupuesto",
  "cotizacion",
  "cuanto sale",
  "cuanto cuesta",
  "precio",
  "precios",
  "valor",
  "tarifa",
  "planes",
  "pasame un precio",
  "mandame un presupuesto",
  "enviame un presupuesto",
];

const PALABRAS_URGENCIA = [
  "urgente",
  "lo necesito hoy",
  "lo necesito manana",
  "cuanto antes",
  "lo antes posible",
  "ahora mismo",
  "esta semana",
  "rapido",
  "lo antes que puedan",
  "necesito una respuesta",
];

const PALABRAS_MOLESTIA = [
  "estoy enojado",
  "estoy enojada",
  "estoy molesto",
  "estoy molesta",
  "mal servicio",
  "pesimo",
  "una verguenza",
  "no funciona",
  "nadie responde",
  "quiero reclamar",
  "reclamo",
  "estafa",
  "decepcion",
  "quiero hacer una queja",
];

const PALABRAS_SEGUIMIENTO = [
  "me pueden llamar",
  "podes llamarme",
  "llamame",
  "contactame",
  "escribime",
  "mandame informacion",
  "enviame informacion",
  "quiero que me contacten",
  "quiero hablar con alguien",
  "que me llame un asesor",
  "que me contacte un asesor",
  "comuniquense conmigo",
  "comunicate conmigo",
];

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!,.;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contieneAlgunaFrase(
  textoNormalizado: string,
  frases: string[]
): boolean {
  return frases.some((frase) =>
    textoNormalizado.includes(normalizarTexto(frase))
  );
}

function detectarEmail(texto: string): string | undefined {
  const coincidencia = texto.match(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  );

  return coincidencia?.[0];
}

function detectarTelefono(texto: string): string | undefined {
  const posiblesTelefonos = texto.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/g
  );

  if (!posiblesTelefonos?.length) {
    return undefined;
  }

  const telefonoValido = posiblesTelefonos.find((telefono) => {
    const soloNumeros = telefono.replace(/\D/g, "");

    return soloNumeros.length >= 8 && soloNumeros.length <= 15;
  });

  return telefonoValido?.trim();
}

function formatearFechaISO(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);

  return nuevaFecha;
}

function obtenerProximoDiaSemana(
  fechaActual: Date,
  diaObjetivo: number
): Date {
  const fecha = new Date(fechaActual);
  const diaActual = fecha.getDay();

  let diferencia = diaObjetivo - diaActual;

  if (diferencia <= 0) {
    diferencia += 7;
  }

  fecha.setDate(fecha.getDate() + diferencia);

  return fecha;
}

function detectarFechaVencimiento(
  textoNormalizado: string
): string | undefined {
  const hoy = new Date();

  if (
    textoNormalizado.includes("hoy") ||
    textoNormalizado.includes("ahora mismo")
  ) {
    return formatearFechaISO(hoy);
  }

  if (
    textoNormalizado.includes("manana") ||
    textoNormalizado.includes("el dia siguiente")
  ) {
    return formatearFechaISO(sumarDias(hoy, 1));
  }

  if (textoNormalizado.includes("pasado manana")) {
    return formatearFechaISO(sumarDias(hoy, 2));
  }

  const diasSemana: Array<{
    nombres: string[];
    numero: number;
  }> = [
    {
      nombres: ["domingo"],
      numero: 0,
    },
    {
      nombres: ["lunes"],
      numero: 1,
    },
    {
      nombres: ["martes"],
      numero: 2,
    },
    {
      nombres: ["miercoles"],
      numero: 3,
    },
    {
      nombres: ["jueves"],
      numero: 4,
    },
    {
      nombres: ["viernes"],
      numero: 5,
    },
    {
      nombres: ["sabado"],
      numero: 6,
    },
  ];

  for (const dia of diasSemana) {
    const aparece = dia.nombres.some((nombre) =>
      textoNormalizado.includes(nombre)
    );

    if (aparece) {
      const fechaDia = obtenerProximoDiaSemana(hoy, dia.numero);

      return formatearFechaISO(fechaDia);
    }
  }

  if (textoNormalizado.includes("esta semana")) {
    return formatearFechaISO(sumarDias(hoy, 3));
  }

  if (textoNormalizado.includes("la semana que viene")) {
    return formatearFechaISO(sumarDias(hoy, 7));
  }

  return undefined;
}

function calcularNivelInteres(
  puntuacionLead: number
): NivelInteresLead {
  if (puntuacionLead >= 70) {
    return "alto";
  }

  if (puntuacionLead >= 35) {
    return "medio";
  }

  return "bajo";
}

export function analizarMensajeCRM(
  mensaje: string
): ResultadoAutomatizacionCRM {
  const textoNormalizado = normalizarTexto(mensaje);

  const etiquetas = new Set<string>();
  const motivos: string[] = [];

  let puntuacionLead = 0;

  let crearTarea = false;
  let tituloTarea: string | undefined;
  let descripcionTarea: string | undefined;
  let prioridadTarea: PrioridadTareaCRM = "media";

  const tieneIntencionCompra = contieneAlgunaFrase(
    textoNormalizado,
    PALABRAS_COMPRA
  );

  const pidePresupuesto = contieneAlgunaFrase(
    textoNormalizado,
    PALABRAS_PRESUPUESTO
  );

  const tieneUrgencia = contieneAlgunaFrase(
    textoNormalizado,
    PALABRAS_URGENCIA
  );

  const estaMolesto = contieneAlgunaFrase(
    textoNormalizado,
    PALABRAS_MOLESTIA
  );

  const solicitaSeguimiento = contieneAlgunaFrase(
    textoNormalizado,
    PALABRAS_SEGUIMIENTO
  );

  const emailDetectado = detectarEmail(mensaje);
  const telefonoDetectado = detectarTelefono(mensaje);

  const fechaVencimientoTarea =
    detectarFechaVencimiento(textoNormalizado);

  if (tieneIntencionCompra) {
    etiquetas.add("Interesado");
    puntuacionLead += 40;

    motivos.push(
      "El visitante mostró una intención clara de compra o contratación."
    );
  }

  if (pidePresupuesto) {
    etiquetas.add("Pidió presupuesto");
    puntuacionLead += 30;

    crearTarea = true;
    tituloTarea = "Preparar presupuesto";
    descripcionTarea =
      "El visitante solicitó información sobre precios, planes o un presupuesto.";
    prioridadTarea = "media";

    motivos.push(
      "El visitante pidió precios, cotización o presupuesto."
    );
  }

  if (tieneUrgencia) {
    etiquetas.add("Urgente");
    puntuacionLead += 20;

    crearTarea = true;
    prioridadTarea = "alta";

    if (!tituloTarea) {
      tituloTarea = "Contactar cliente urgente";
      descripcionTarea =
        "El visitante indicó que necesita una respuesta con urgencia.";
    } else {
      descripcionTarea = `${descripcionTarea} También indicó que necesita una respuesta urgente.`;
    }

    motivos.push(
      "El visitante indicó que necesita una respuesta rápida."
    );
  }

  if (estaMolesto) {
    etiquetas.add("Cliente molesto");
    puntuacionLead += 10;

    crearTarea = true;
    tituloTarea = "Revisar reclamo del cliente";
    descripcionTarea =
      "El visitante mostró molestia, informó un problema o realizó un reclamo.";
    prioridadTarea = "alta";

    motivos.push(
      "El mensaje contiene señales de molestia, queja o reclamo."
    );
  }

  if (solicitaSeguimiento) {
    etiquetas.add("Solicita contacto");
    puntuacionLead += 20;

    crearTarea = true;

    if (!tituloTarea) {
      tituloTarea = "Contactar al visitante";
      descripcionTarea =
        "El visitante pidió que una persona del equipo se comunique con él.";
      prioridadTarea = "media";
    }

    motivos.push("El visitante pidió ser contactado.");
  }

  if (emailDetectado) {
    etiquetas.add("Email disponible");
    puntuacionLead += 10;

    motivos.push(
      "El visitante compartió su correo electrónico."
    );
  }

  if (telefonoDetectado) {
    etiquetas.add("Teléfono disponible");
    puntuacionLead += 15;

    motivos.push(
      "El visitante compartió un número de teléfono."
    );
  }

  if (fechaVencimientoTarea) {
    etiquetas.add("Seguimiento programado");

    motivos.push(
      "El visitante indicó una fecha para el seguimiento."
    );
  }

  puntuacionLead = Math.min(puntuacionLead, 100);

  const nivelInteres = calcularNivelInteres(puntuacionLead);

  if (nivelInteres === "alto") {
    etiquetas.add("Cliente caliente");
  } else if (nivelInteres === "medio") {
    etiquetas.add("Cliente potencial");
  }

  if (
    crearTarea &&
    !tituloTarea
  ) {
    tituloTarea = "Realizar seguimiento comercial";
    descripcionTarea =
      "Revisar la conversación y realizar seguimiento al visitante.";
  }

  return {
    etiquetas: Array.from(etiquetas),
    puntuacionLead,
    nivelInteres,

    crearTarea,
    tituloTarea,
    descripcionTarea,
    prioridadTarea,
    fechaVencimientoTarea,

    emailDetectado,
    telefonoDetectado,

    motivos,
  };
}