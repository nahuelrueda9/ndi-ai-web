import {
  NextRequest,
  NextResponse,
} from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";
import { empresaTieneFuncion } from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type ReservaBody = {
  slug?: string;
  servicioId?: string;
  nombreCliente?: string;
  email?: string;
  telefono?: string;
  fecha?: string;
  hora?: string;
  notas?: string;
};

type CatalogoServicio = {
  tipo?: "servicio" | "producto";
  nombre?: string;
  precio?: number;
  duracionMinutos?: number;
  activo?: boolean;
};

type ConfigDiaAgenda = {
  activo?: boolean;
  apertura?: string;
  cierre?: string;
  descansoInicio?: string;
  descansoFin?: string;
};

type AgendaConfig = {
  activa?: boolean;
  intervaloMinutos?: number;
  dias?: Record<
    string,
    ConfigDiaAgenda | undefined
  >;
  diasExcepcionales?: unknown[];
  diasBloqueados?: unknown[];
};

type EmpresaPublica = {
  nombre?: string;
  plan?: "free" | "pro" | "business";
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  paginaPublica?: {
    publicada?: boolean;
    slug?: string;
  };
  agendaConfig?: AgendaConfig;
  diasExcepcionales?: unknown[];
  diasBloqueados?: unknown[];
  configuracion?: {
    diasExcepcionales?: unknown[];
  };
  fcmTokens?: string[];
};

type TurnoExistente = {
  hora?: string;
  duracionMinutos?: number;
  estado?: string;
};

const MAX_SLUG = 160;
const MAX_ID = 180;
const MAX_NOMBRE = 120;
const MAX_EMAIL = 180;
const MAX_TELEFONO = 60;
const MAX_NOTAS = 1500;

function limpiarTexto(
  valor: unknown,
  maximo: number,
) {
  return typeof valor === "string"
    ? valor
        .trim()
        .replace(/\u0000/g, "")
        .slice(0, maximo)
    : "";
}

function idFirestoreValido(
  valor: string,
) {
  return (
    valor.length > 0 &&
    valor.length <= MAX_ID &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

function ahoraArgentina() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(
      new Date(),
    );

  const obtener = (
    tipo: string,
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo,
    )?.value ?? "";

  return {
    fecha:
      `${obtener("year")}-${obtener("month")}-${obtener("day")}`,
    hora:
      `${obtener("hour")}:${obtener("minute")}`,
  };
}

function fechaHoraYaPaso(
  fecha: string,
  hora: string,
) {
  const ahora =
    ahoraArgentina();

  return (
    fecha < ahora.fecha ||
    (
      fecha === ahora.fecha &&
      hora <= ahora.hora
    )
  );
}

class TurnoNoDisponibleError extends Error {
  constructor(
    mensaje: string,
  ) {
    super(mensaje);
    this.name =
      "TurnoNoDisponibleError";
  }
}

function fechaValida(
  valor: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor,
    )
  ) {
    return false;
  }

  const [
    anioTexto,
    mesTexto,
    diaTexto,
  ] = valor.split("-");

  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  const fecha = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia,
    ),
  );

  return (
    fecha.getUTCFullYear() ===
      anio &&
    fecha.getUTCMonth() ===
      mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

function horaValida(
  valor: string,
) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    valor,
  );
}

function minutosDesdeHora(
  hora: string,
) {
  const [horas, minutos] =
    hora.split(":").map(Number);

  return horas * 60 + minutos;
}

function horaDesdeMinutos(
  minutosTotales: number,
) {
  const horas = Math.floor(
    minutosTotales / 60,
  );

  const minutos =
    minutosTotales % 60;

  return `${String(horas).padStart(
    2,
    "0",
  )}:${String(minutos).padStart(
    2,
    "0",
  )}`;
}

function seSuperponen(
  inicioA: number,
  duracionA: number,
  inicioB: number,
  duracionB: number,
) {
  const finA =
    inicioA + duracionA;

  const finB =
    inicioB + duracionB;

  return (
    inicioA < finB &&
    inicioB < finA
  );
}

function estadoBloqueaHorario(
  estado?: string,
) {
  return (
    estado !== "cancelado" &&
    estado !== "no_asistio"
  );
}

function obtenerDiaSemana(
  fecha: string,
) {
  const [anio, mes, dia] =
    fecha.split("-").map(Number);

  return new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia,
    ),
  ).getUTCDay();
}

function obtenerConfigDiaAgenda(
  agenda: AgendaConfig | undefined,
  fecha: string,
): ConfigDiaAgenda | undefined {
  if (!agenda?.dias) return undefined;

  // getUTCDay(): 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb
  const diaJs = obtenerDiaSemana(fecha);
  const claveExacta = String(diaJs);

  if (
    Object.prototype.hasOwnProperty.call(
      agenda.dias,
      claveExacta,
    ) &&
    agenda.dias[claveExacta] !== undefined
  ) {
    return agenda.dias[claveExacta];
  }

  // Fallback si algún panel guardó los días indexados de Lunes (0) a Domingo (6)
  const claveLun0 = String((diaJs + 6) % 7);
  if (
    Object.prototype.hasOwnProperty.call(
      agenda.dias,
      claveLun0,
    ) &&
    agenda.dias[claveLun0] !== undefined
  ) {
    return agenda.dias[claveLun0];
  }

  return undefined;
}

function obtenerDuracionServicio(
  servicio: CatalogoServicio,
) {
  return Math.min(
    1440,
    Math.max(
      5,
      Number(
        servicio.duracionMinutos,
      ) || 60,
    ),
  );
}

function obtenerIntervaloAgenda(
  agenda?: AgendaConfig,
) {
  return Math.min(
    240,
    Math.max(
      5,
      Number(
        agenda?.intervaloMinutos,
      ) || 30,
    ),
  );
}

function obtenerRangoDescansoValido(
  dia: ConfigDiaAgenda,
  apertura: number,
  cierre: number,
): { inicio: number; fin: number } | null {
  const inicioStr = (dia.descansoInicio || "").trim();
  const finStr = (dia.descansoFin || "").trim();

  if (
    !inicioStr ||
    !finStr ||
    (inicioStr === "00:00" && finStr === "00:00")
  ) {
    return null;
  }

  if (!horaValida(inicioStr) || !horaValida(finStr)) {
    return null;
  }

  const descansoInicio = minutosDesdeHora(inicioStr);
  const descansoFin = minutosDesdeHora(finStr);

  if (
    descansoInicio >= descansoFin ||
    descansoInicio < apertura ||
    descansoFin > cierre
  ) {
    return null;
  }

  return { inicio: descansoInicio, fin: descansoFin };
}

function horarioAgendaValido(
  dia: ConfigDiaAgenda,
) {
  if (
    !dia.apertura ||
    !dia.cierre ||
    !horaValida(dia.apertura) ||
    !horaValida(dia.cierre)
  ) {
    return false;
  }

  const apertura =
    minutosDesdeHora(
      dia.apertura,
    );

  const cierre =
    minutosDesdeHora(
      dia.cierre,
    );

  return apertura < cierre;
}

function horarioDentroDeAgenda({
  hora,
  duracionMinutos,
  dia,
  intervaloMinutos,
}: {
  hora: string;
  duracionMinutos: number;
  dia: ConfigDiaAgenda;
  intervaloMinutos: number;
}) {
  if (
    !horarioAgendaValido(dia)
  ) {
    return false;
  }

  const apertura =
    minutosDesdeHora(
      dia.apertura!,
    );

  const cierre =
    minutosDesdeHora(
      dia.cierre!,
    );

  const inicio =
    minutosDesdeHora(hora);

  const fin =
    inicio + duracionMinutos;

  if (
    inicio < apertura ||
    fin > cierre
  ) {
    return false;
  }

  if (
    (inicio - apertura) %
      intervaloMinutos !==
    0
  ) {
    return false;
  }

  const descanso = obtenerRangoDescansoValido(dia, apertura, cierre);
  if (descanso && inicio < descanso.fin && descanso.inicio < fin) {
    return false;
  }

  return true;
}

function horarioOcupado(
  hora: string,
  duracionMinutos: number,
  turnos: TurnoExistente[],
) {
  const inicio =
    minutosDesdeHora(hora);

  return turnos.some(
    (turno) => {
      if (
        !turno.hora ||
        !horaValida(
          turno.hora,
        ) ||
        !estadoBloqueaHorario(
          turno.estado,
        )
      ) {
        return false;
      }

      const inicioExistente =
        minutosDesdeHora(
          turno.hora,
        );

      const duracionExistente =
        Math.min(
          1440,
          Math.max(
            5,
            Number(
              turno.duracionMinutos,
            ) || 60,
          ),
        );

      return seSuperponen(
        inicio,
        duracionMinutos,
        inicioExistente,
        duracionExistente,
      );
    },
  );
}

function generarHorarios({
  dia,
  intervaloMinutos,
  duracionMinutos,
  turnos,
}: {
  dia: ConfigDiaAgenda;
  intervaloMinutos: number;
  duracionMinutos: number;
  turnos: TurnoExistente[];
}) {
  if (
    !horarioAgendaValido(dia)
  ) {
    return [];
  }

  const apertura =
    minutosDesdeHora(
      dia.apertura!,
    );

  const cierre =
    minutosDesdeHora(
      dia.cierre!,
    );

  const horarios: string[] = [];

  for (
    let inicio = apertura;
    inicio + duracionMinutos <=
      cierre;
    inicio += intervaloMinutos
  ) {
    const hora =
      horaDesdeMinutos(inicio);

    if (
      !horarioDentroDeAgenda({
        hora,
        duracionMinutos,
        dia,
        intervaloMinutos,
      })
    ) {
      continue;
    }

    if (
      horarioOcupado(
        hora,
        duracionMinutos,
        turnos,
      )
    ) {
      continue;
    }

    horarios.push(hora);
  }

  return horarios;
}

async function resolverEmpresaPublica(
  slug: string,
) {
  const empresasSnapshot =
    await adminDb
      .collection("companies")
      .where(
        "paginaPublica.slug",
        "==",
        slug,
      )
      .limit(2)
      .get();

  if (
    empresasSnapshot.size !== 1
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            empresasSnapshot.empty
              ? "El negocio no existe."
              : "La URL pública no es válida.",
        },
        {
          status:
            empresasSnapshot.empty
              ? 404
              : 409,
        },
      ),
    };
  }

  const empresaDoc =
    empresasSnapshot.docs[0];

  const empresa =
    empresaDoc.data() as EmpresaPublica;

  if (
    empresa.paginaPublica
      ?.publicada !== true
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "La página del negocio no está publicada.",
        },
        {
          status: 404,
        },
      ),
    };
  }

  if (
    !empresaTieneFuncion(
      empresa,
      "turnos",
    )
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Las reservas online requieren un plan Pro o Empresa.",
          upgradeRequired: true,
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    empresaDoc,
    empresa,
  };
}

async function obtenerServicio(
  empresaId: string,
  servicioId: string,
) {
  const servicioDoc =
    await adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("catalog")
      .doc(servicioId)
      .get();

  if (!servicioDoc.exists) {
    return {
      error: NextResponse.json(
        {
          error:
            "El servicio no existe.",
        },
        {
          status: 404,
        },
      ),
    };
  }

  const servicio =
    servicioDoc.data() as CatalogoServicio;

  if (
    servicio.tipo !==
      "servicio" ||
    servicio.activo === false ||
    !servicio.nombre
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "El servicio no está disponible para reservar.",
        },
        {
          status: 400,
        },
      ),
    };
  }

  return {
    servicioDoc,
    servicio,
  };
}

function diaEstaCerradoExcepcionalmente(
  datos: EmpresaPublica | undefined,
  fechaConsulta: string,
) {
  if (!datos) return false;

  const posiblesArrays = [
    datos.diasExcepcionales,
    datos.agendaConfig?.diasExcepcionales,
    datos.configuracion?.diasExcepcionales,
    datos.diasBloqueados,
    datos.agendaConfig?.diasBloqueados,
  ];

  for (const arr of posiblesArrays) {
    if (Array.isArray(arr)) {
      const encontrado = arr.some((item) => {
        const fechaItem =
          typeof item === "string"
            ? item
            : item && typeof item === "object" && "fecha" in item
              ? String((item as { fecha?: unknown }).fecha || "")
              : "";
        return fechaItem === fechaConsulta;
      });
      if (encontrado) return true;
    }
  }

  return false;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const slug =
      limpiarTexto(
        request.nextUrl.searchParams.get(
          "slug",
        ),
        MAX_SLUG,
      ).toLowerCase();

    const servicioId =
      limpiarTexto(
        request.nextUrl.searchParams.get(
          "servicioId",
        ),
        MAX_ID,
      );

    const fecha =
      limpiarTexto(
        request.nextUrl.searchParams.get(
          "fecha",
        ),
        10,
      );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta la página del negocio.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !idFirestoreValido(
        servicioId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná un servicio válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (!fechaValida(fecha)) {
      return NextResponse.json(
        {
          error:
            "La fecha no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    const ahora =
      ahoraArgentina();

    if (
      fecha < ahora.fecha
    ) {
      return NextResponse.json(
        {
          disponible: false,
          configuracionPendiente:
            false,
          horarios: [],
          mensaje:
            "La fecha seleccionada ya pasó.",
        },
        {
          status: 200,
        },
      );
    }

    const empresaResultado =
      await resolverEmpresaPublica(
        slug,
      );

    if (
      "error" in
      empresaResultado
    ) {
      return empresaResultado.error;
    }

    const {
      empresaDoc,
      empresa,
    } = empresaResultado;

    const estaCerradoExcepcional = diaEstaCerradoExcepcionalmente(
      empresa,
      fecha,
    );
    if (estaCerradoExcepcional) {
      return NextResponse.json(
        {
          disponible: false,
          configuracionPendiente: false,
          horarios: [],
          mensaje: "HOY CERRADO",
        },
        {
          status: 200,
        },
      );
    }

    const servicioResultado =
      await obtenerServicio(
        empresaDoc.id,
        servicioId,
      );

    if (
      "error" in
      servicioResultado
    ) {
      return servicioResultado.error;
    }

    const {
      servicio,
    } = servicioResultado;

    const duracionMinutos =
      obtenerDuracionServicio(
        servicio,
      );

    const agenda = empresa.agendaConfig;
    const diaConfig = obtenerConfigDiaAgenda(agenda, fecha);
    const diaActivo =
      agenda?.activa === true &&
      diaConfig?.activo === true &&
      horarioAgendaValido(diaConfig);

    const horarios =
      diaActivo && diaConfig
        ? generarHorarios({
            dia: diaConfig,
            intervaloMinutos: obtenerIntervaloAgenda(agenda),
            duracionMinutos,
            turnos: (
              await adminDb
                .collection("companies")
                .doc(empresaDoc.id)
                .collection("appointments")
                .where("fecha", "==", fecha)
                .get()
            ).docs.map((d) => d.data() as TurnoExistente),
          }).filter((horario) => !fechaHoraYaPaso(fecha, horario))
        : [];

    let mensajeDisponibilidad = "";
    if (!diaActivo) {
      mensajeDisponibilidad = "HOY CERRADO";
    } else if (horarios.length === 0) {
      mensajeDisponibilidad =
        "No quedan horarios disponibles para lo que resta del día.";
    }

    return NextResponse.json(
      {
        disponible: horarios.length > 0,
        configuracionPendiente: false,
        horarios,
        duracionMinutos,
        servicio: servicio.nombre,
        mensaje: mensajeDisponibilidad,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Error consultando disponibilidad pública:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo consultar la disponibilidad.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    let body: ReservaBody;

    try {
      body =
        (await request.json()) as ReservaBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    const slug =
      limpiarTexto(
        body.slug,
        MAX_SLUG,
      ).toLowerCase();

    const servicioId =
      limpiarTexto(
        body.servicioId,
        MAX_ID,
      );

    const nombreCliente =
      limpiarTexto(
        body.nombreCliente,
        MAX_NOMBRE,
      );

    const email =
      limpiarTexto(
        body.email,
        MAX_EMAIL,
      );

    const telefono =
      limpiarTexto(
        body.telefono,
        MAX_TELEFONO,
      );

    const fecha =
      limpiarTexto(
        body.fecha,
        10,
      );

    const hora =
      limpiarTexto(
        body.hora,
        5,
      );

    const notas =
      limpiarTexto(
        body.notas,
        MAX_NOTAS,
      );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta la página del negocio.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !idFirestoreValido(
        servicioId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná un servicio válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nombreCliente) {
      return NextResponse.json(
        {
          error:
            "Ingresá tu nombre.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !telefono &&
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá un teléfono o correo de contacto.",
        },
        {
          status: 400,
        },
      );
    }

    if (!fechaValida(fecha)) {
      return NextResponse.json(
        {
          error:
            "La fecha no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    if (!horaValida(hora)) {
      return NextResponse.json(
        {
          error:
            "La hora no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fechaHoraYaPaso(
        fecha,
        hora,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ese horario ya pasó.",
        },
        {
          status: 409,
        },
      );
    }

    const empresaResultado =
      await resolverEmpresaPublica(
        slug,
      );

    if (
      "error" in
      empresaResultado
    ) {
      return empresaResultado.error;
    }

    const {
      empresaDoc,
      empresa,
    } = empresaResultado;

    const estaCerradoExcepcional = diaEstaCerradoExcepcionalmente(
      empresa,
      fecha,
    );
    if (estaCerradoExcepcional) {
      return NextResponse.json(
        {
          error: "HOY CERRADO",
        },
        {
          status: 409,
        },
      );
    }

    const servicioResultado =
      await obtenerServicio(
        empresaDoc.id,
        servicioId,
      );

    if (
      "error" in
      servicioResultado
    ) {
      return servicioResultado.error;
    }

    const {
      servicioDoc,
      servicio,
    } = servicioResultado;

    const agenda =
      empresa.agendaConfig;

    if (
      agenda?.activa !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Las reservas online no están habilitadas.",
        },
        {
          status: 409,
        },
      );
    }

    const dia = obtenerConfigDiaAgenda(agenda, fecha);

    if (
      !dia ||
      dia.activo !== true ||
      !horarioAgendaValido(dia)
    ) {
      return NextResponse.json(
        {
          error:
            "Ese día no está disponible para reservas.",
        },
        {
          status: 409,
        },
      );
    }

    const intervaloMinutos =
      obtenerIntervaloAgenda(
        agenda,
      );

    const duracionMinutos =
      obtenerDuracionServicio(
        servicio,
      );

    if (
      !horarioDentroDeAgenda({
        hora,
        duracionMinutos,
        dia,
        intervaloMinutos,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "Ese horario no está disponible para reservas.",
        },
        {
          status: 409,
        },
      );
    }

    const empresaRef =
      adminDb
        .collection("companies")
        .doc(empresaDoc.id);

    let duracionFinal = duracionMinutos;
    let precioFinal =
      typeof servicio.precio === "number" && Number.isFinite(servicio.precio)
        ? Math.max(0, servicio.precio)
        : 0;
    let nombreServicioFinal = servicio.nombre!.trim();

    try {
      await adminDb.runTransaction(
        async (transaction) => {
          const empresaSnapshot =
            await transaction.get(
              empresaRef,
            );

          if (
            !empresaSnapshot.exists
          ) {
            throw new TurnoNoDisponibleError(
              "El negocio ya no está disponible.",
            );
          }

          const empresaActual =
            empresaSnapshot.data() as EmpresaPublica;

          if (
            empresaActual
              .paginaPublica
              ?.publicada !== true ||
            !empresaTieneFuncion(
              empresaActual,
              "turnos",
            )
          ) {
            throw new TurnoNoDisponibleError(
              "Las reservas online ya no están disponibles.",
            );
          }

          if (
            diaEstaCerradoExcepcionalmente(
              empresaActual,
              fecha,
            )
          ) {
            throw new TurnoNoDisponibleError(
              "Ese día no está disponible para reservas.",
            );
          }

          const servicioRef =
            empresaRef
              .collection(
                "catalog",
              )
              .doc(
                servicioId,
              );

          const servicioSnapshot =
            await transaction.get(
              servicioRef,
            );

          if (
            !servicioSnapshot.exists
          ) {
            throw new TurnoNoDisponibleError(
              "El servicio ya no está disponible.",
            );
          }

          const servicioActual =
            servicioSnapshot.data() as CatalogoServicio;

          if (
            servicioActual.tipo !==
              "servicio" ||
            servicioActual.activo ===
              false ||
            !servicioActual.nombre
              ?.trim()
          ) {
            throw new TurnoNoDisponibleError(
              "El servicio ya no está disponible.",
            );
          }

          const agendaActual =
            empresaActual.agendaConfig;

          if (
            agendaActual?.activa !==
            true
          ) {
            throw new TurnoNoDisponibleError(
              "Las reservas online no están habilitadas.",
            );
          }

          const diaActual = obtenerConfigDiaAgenda(
            agendaActual,
            fecha,
          );

          if (
            !diaActual ||
            diaActual.activo !==
              true ||
            !horarioAgendaValido(
              diaActual,
            )
          ) {
            throw new TurnoNoDisponibleError(
              "Ese día ya no está disponible para reservas.",
            );
          }

          const intervaloActual =
            obtenerIntervaloAgenda(
              agendaActual,
            );

          const duracionActual =
            obtenerDuracionServicio(
              servicioActual,
            );

          if (
            fechaHoraYaPaso(
              fecha,
              hora,
            ) ||
            !horarioDentroDeAgenda({
              hora,
              duracionMinutos:
                duracionActual,
              dia:
                diaActual,
              intervaloMinutos:
                intervaloActual,
            })
          ) {
            throw new TurnoNoDisponibleError(
              "Ese horario ya no está disponible para reservas.",
            );
          }

          const turnosQuery =
            empresaRef
              .collection(
                "appointments",
              )
              .where(
                "fecha",
                "==",
                fecha,
              );

          const turnosSnapshot =
            await transaction.get(
              turnosQuery,
            );

          const turnos =
            turnosSnapshot.docs.map(
              (turnoDoc) =>
                turnoDoc.data() as TurnoExistente,
            );

          if (
            horarioOcupado(
              hora,
              duracionActual,
              turnos,
            )
          ) {
            throw new Error(
              "HORARIO_OCUPADO",
            );
          }

          duracionFinal = duracionActual;
          nombreServicioFinal = servicioActual.nombre.trim();
          precioFinal =
            typeof servicioActual.precio === "number" &&
            Number.isFinite(servicioActual.precio)
              ? Math.max(0, servicioActual.precio)
              : 0;
        },
      );
    } catch (transactionError) {
      if (
        transactionError instanceof
        TurnoNoDisponibleError
      ) {
        return NextResponse.json(
          {
            error:
              transactionError.message,
          },
          {
            status: 409,
          },
        );
      }

      if (
        transactionError instanceof
          Error &&
        transactionError.message ===
          "HORARIO_OCUPADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Ese horario ya no está disponible. Elegí otro horario.",
          },
          {
            status: 409,
          },
        );
      }

      throw transactionError;
    }

    return NextResponse.json(
      {
        ok: true,
        requierePago: true,
        negocio:
          empresa.nombre ||
          "Negocio",
        empresaId:
          empresaDoc.id,
        servicioId:
          servicioDoc.id,
        servicio:
          nombreServicioFinal,
        precioServicio:
          precioFinal,
        fecha,
        hora,
        duracionMinutos:
          duracionFinal,
        cliente: {
          nombreCliente,
          email,
          telefono,
          notas,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Error validando reserva pública:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo validar el turno.",
      },
      {
        status: 500,
      },
    );
  }
}