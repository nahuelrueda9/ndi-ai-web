import {
  FieldValue,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { crearTarea } from "@/lib/crm/taskService";

import {
  esNombreHerramienta,
  parsearArgumentosHerramienta,
  type NombreHerramienta,
} from "@/lib/ai/tools";

export type ResultadoHerramienta = {
  exito: boolean;
  nombre: string;
  mensaje: string;
  datos?: Record<string, unknown>;
};

type EjecutarHerramientaParams = {
  empresaId: string;
  chatId: string;
  nombre: string;
  argumentos?: string | Record<string, unknown>;
};

type ParametrosHerramienta = {
  empresaId: string;
  chatId: string;
  argumentos: Record<string, unknown>;
};

type CatalogoServicio = {
  id: string;
  tipo?: "servicio" | "producto";
  nombre: string;
  descripcion?: string;
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
  dias?: Record<string, ConfigDiaAgenda>;
};

type EmpresaAgenda = {
  nombre?: string;
  agendaConfig?: AgendaConfig;
};

type TurnoExistente = {
  hora?: string;
  duracionMinutos?: number;
  estado?: string;
};

type ResultadoServicio =
  | {
      exito: true;
      servicio: CatalogoServicio;
    }
  | {
      exito: false;
      mensaje: string;
      servicios?: Array<{
        id: string;
        nombre: string;
      }>;
    };

export async function ejecutarHerramienta({
  empresaId,
  chatId,
  nombre,
  argumentos,
}: EjecutarHerramientaParams): Promise<ResultadoHerramienta> {
  if (!empresaId.trim()) {
    throw new Error("Falta el empresaId.");
  }

  if (!chatId.trim()) {
    throw new Error("Falta el chatId.");
  }

  if (!esNombreHerramienta(nombre)) {
    return {
      exito: false,
      nombre,
      mensaje: `La herramienta "${nombre}" no existe.`,
    };
  }

  const argumentosParseados =
    parsearArgumentosHerramienta(argumentos);

  switch (nombre) {
    case "solicitar_atencion_humana":
      return solicitarAtencionHumana({
        empresaId,
        chatId,
        argumentos: argumentosParseados,
      });

    case "guardar_datos_contacto":
      return guardarDatosContacto({
        empresaId,
        chatId,
        argumentos: argumentosParseados,
      });

    case "crear_tarea_comercial":
      return crearTareaComercial({
        empresaId,
        chatId,
        argumentos: argumentosParseados,
      });

    case "consultar_disponibilidad_turnos":
      return consultarDisponibilidadTurnos({
        empresaId,
        chatId,
        argumentos: argumentosParseados,
      });

    case "crear_turno":
      return crearTurno({
        empresaId,
        chatId,
        argumentos: argumentosParseados,
      });

    default:
      return herramientaNoDisponible(nombre);
  }
}

async function solicitarAtencionHumana({
  empresaId,
  chatId,
  argumentos,
}: ParametrosHerramienta): Promise<ResultadoHerramienta> {
  const motivo =
    typeof argumentos.motivo === "string" &&
    argumentos.motivo.trim()
      ? argumentos.motivo.trim()
      : "El visitante solicitó atención humana.";

  const urgencia =
    argumentos.urgencia === "alta" ||
    argumentos.urgencia === "media" ||
    argumentos.urgencia === "baja"
      ? argumentos.urgencia
      : "media";

  const conversacionRef = adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("conversations")
    .doc(chatId);

  await conversacionRef.update({
    atendidoPor: "humano",
    humanoActivo: true,
    requiereAtencionHumana: true,
    motivoAtencionHumana: motivo,
    urgenciaAtencionHumana: urgencia,
    solicitadoAtencionHumanaAt:
      FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    exito: true,
    nombre: "solicitar_atencion_humana",
    mensaje:
      "La conversación fue transferida al equipo humano.",
    datos: {
      motivo,
      urgencia,
    },
  };
}

async function guardarDatosContacto({
  empresaId,
  chatId,
  argumentos,
}: ParametrosHerramienta): Promise<ResultadoHerramienta> {
  const nombre = obtenerTexto(argumentos.nombre);
  const email = obtenerTexto(argumentos.email);
  const telefono = obtenerTexto(argumentos.telefono);
  const empresa = obtenerTexto(argumentos.empresa);

  const datosActualizados: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  const datosGuardados: Record<string, string> = {};

  if (nombre) {
    datosActualizados["lead.nombre"] = nombre;
    datosGuardados.nombre = nombre;
  }

  if (email) {
    datosActualizados["lead.email"] = email;
    datosGuardados.email = email;
  }

  if (telefono) {
    datosActualizados["lead.telefono"] = telefono;
    datosGuardados.telefono = telefono;
  }

  if (empresa) {
    datosActualizados["lead.empresa"] = empresa;
    datosGuardados.empresa = empresa;
  }

  if (Object.keys(datosGuardados).length === 0) {
    return {
      exito: false,
      nombre: "guardar_datos_contacto",
      mensaje:
        "No se recibió ningún dato de contacto válido.",
    };
  }

  const conversacionRef = adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("conversations")
    .doc(chatId);

  await conversacionRef.update(datosActualizados);

  return {
    exito: true,
    nombre: "guardar_datos_contacto",
    mensaje:
      "Los datos de contacto fueron guardados correctamente.",
    datos: datosGuardados,
  };
}

async function crearTareaComercial({
  empresaId,
  chatId,
  argumentos,
}: ParametrosHerramienta): Promise<ResultadoHerramienta> {
  const titulo =
    typeof argumentos.titulo === "string" &&
    argumentos.titulo.trim().length > 0
      ? argumentos.titulo.trim()
      : "Seguimiento comercial";

  const descripcion =
    typeof argumentos.descripcion === "string"
      ? argumentos.descripcion.trim()
      : "";

  const prioridad =
    argumentos.prioridad === "alta" ||
    argumentos.prioridad === "media" ||
    argumentos.prioridad === "baja"
      ? argumentos.prioridad
      : "media";

  const tareaCreada = await crearTarea({
    empresaId,
    chatId,
    titulo,
    descripcion,
    prioridad,
  });

  return {
    exito: true,
    nombre: "crear_tarea_comercial",
    mensaje:
      "La tarea comercial fue creada correctamente.",
    datos: {
      tareaId: tareaCreada.id,
      titulo,
      descripcion,
      prioridad,
    },
  };
}

async function consultarDisponibilidadTurnos({
  empresaId,
  argumentos,
}: ParametrosHerramienta): Promise<ResultadoHerramienta> {
  const fecha = obtenerTexto(argumentos.fecha);

  if (!fechaValida(fecha)) {
    return {
      exito: false,
      nombre: "consultar_disponibilidad_turnos",
      mensaje:
        "La fecha debe estar en formato YYYY-MM-DD.",
    };
  }

  const empresaRef = adminDb
    .collection("companies")
    .doc(empresaId);

  const empresaSnapshot =
    await empresaRef.get();

  if (!empresaSnapshot.exists) {
    return {
      exito: false,
      nombre: "consultar_disponibilidad_turnos",
      mensaje:
        "La empresa no existe.",
    };
  }

  const empresa =
    empresaSnapshot.data() as EmpresaAgenda;

  const agenda = empresa.agendaConfig;

  if (!agenda?.activa) {
    return {
      exito: false,
      nombre: "consultar_disponibilidad_turnos",
      mensaje:
        "Las reservas online no están activadas para este negocio.",
    };
  }

  const resultadoServicio =
    await resolverServicio({
      empresaId,
      servicioId:
        obtenerTexto(argumentos.servicioId),
      nombreServicio:
        obtenerTexto(argumentos.servicio),
    });

  if (!resultadoServicio.exito) {
    return {
      exito: false,
      nombre: "consultar_disponibilidad_turnos",
      mensaje:
        resultadoServicio.mensaje,
      datos: resultadoServicio.servicios
        ? {
            servicios:
              resultadoServicio.servicios,
          }
        : undefined,
    };
  }

  const servicio =
    resultadoServicio.servicio;

  const configDia =
    obtenerConfigDia(
      agenda,
      fecha
    );

  if (
    !configDia ||
    configDia.activo === false
  ) {
    return {
      exito: true,
      nombre: "consultar_disponibilidad_turnos",
      mensaje:
        "El negocio no atiende ese día.",
      datos: {
        servicioId: servicio.id,
        servicio: servicio.nombre,
        fecha,
        horarios: [],
      },
    };
  }

  if (
    !configDia.apertura ||
    !configDia.cierre ||
    !horaValida(configDia.apertura) ||
    !horaValida(configDia.cierre)
  ) {
    return {
      exito: false,
      nombre: "consultar_disponibilidad_turnos",
      mensaje:
        "Los horarios de atención de ese día no están configurados correctamente.",
    };
  }

  const duracionMinutos =
    Math.max(
      5,
      Number(
        servicio.duracionMinutos
      ) || 60
    );

  const intervaloMinutos =
    Math.max(
      5,
      Number(
        agenda.intervaloMinutos
      ) || 30
    );

  const turnosSnapshot =
    await empresaRef
      .collection("appointments")
      .where("fecha", "==", fecha)
      .get();

  const turnos =
    turnosSnapshot.docs.map(
      obtenerTurnoDesdeDocumento
    );

  const horarios =
    calcularHorariosDisponibles({
      fecha,
      configDia,
      duracionMinutos,
      intervaloMinutos,
      turnos,
    });

  return {
    exito: true,
    nombre: "consultar_disponibilidad_turnos",
    mensaje:
      horarios.length > 0
        ? `Hay ${horarios.length} horarios disponibles para ${servicio.nombre} el ${fecha}.`
        : `No quedan horarios disponibles para ${servicio.nombre} el ${fecha}.`,
    datos: {
      servicioId: servicio.id,
      servicio: servicio.nombre,
      precio:
        Number(servicio.precio) || 0,
      fecha,
      duracionMinutos,
      horarios,
    },
  };
}

async function crearTurno({
  empresaId,
  chatId,
  argumentos,
}: ParametrosHerramienta): Promise<ResultadoHerramienta> {
  const fecha =
    obtenerTexto(argumentos.fecha);

  const hora =
    obtenerTexto(argumentos.hora);

  const nombreCliente =
    obtenerTexto(
      argumentos.nombreCliente
    );

  const email =
    obtenerTexto(argumentos.email);

  const telefono =
    obtenerTexto(
      argumentos.telefono
    );

  const notas =
    obtenerTexto(argumentos.notas);

  if (!fechaValida(fecha)) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "La fecha debe estar en formato YYYY-MM-DD.",
    };
  }

  if (!horaValida(hora)) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "La hora debe estar en formato HH:mm.",
    };
  }

  if (!nombreCliente) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Falta el nombre del cliente.",
    };
  }

  if (!email && !telefono) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Para reservar hace falta al menos un teléfono o correo de contacto.",
    };
  }

  if (
    fechaHoraYaPasoArgentina(
      fecha,
      hora
    )
  ) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "No se puede reservar un horario que ya pasó.",
    };
  }

  const empresaRef = adminDb
    .collection("companies")
    .doc(empresaId);

  const empresaSnapshot =
    await empresaRef.get();

  if (!empresaSnapshot.exists) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "La empresa no existe.",
    };
  }

  const empresa =
    empresaSnapshot.data() as EmpresaAgenda;

  const agenda =
    empresa.agendaConfig;

  if (!agenda?.activa) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Las reservas online no están activadas para este negocio.",
    };
  }

  const resultadoServicio =
    await resolverServicio({
      empresaId,
      servicioId:
        obtenerTexto(argumentos.servicioId),
      nombreServicio:
        obtenerTexto(argumentos.servicio),
    });

  if (!resultadoServicio.exito) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        resultadoServicio.mensaje,
      datos: resultadoServicio.servicios
        ? {
            servicios:
              resultadoServicio.servicios,
          }
        : undefined,
    };
  }

  const servicio =
    resultadoServicio.servicio;

  const configDia =
    obtenerConfigDia(
      agenda,
      fecha
    );

  if (
    !configDia ||
    configDia.activo === false
  ) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "El negocio no atiende ese día.",
    };
  }

  if (
    !configDia.apertura ||
    !configDia.cierre ||
    !horaValida(configDia.apertura) ||
    !horaValida(configDia.cierre)
  ) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Los horarios de atención de ese día no están configurados correctamente.",
    };
  }

  const duracionMinutos =
    Math.max(
      5,
      Number(
        servicio.duracionMinutos
      ) || 60
    );

  const intervaloMinutos =
    Math.max(
      5,
      Number(
        agenda.intervaloMinutos
      ) || 30
    );

  const inicio =
    minutosDesdeHora(hora);

  const apertura =
    minutosDesdeHora(
      configDia.apertura
    );

  const cierre =
    minutosDesdeHora(
      configDia.cierre
    );

  if (
    inicio < apertura ||
    inicio + duracionMinutos >
      cierre
  ) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Ese horario está fuera del horario de atención.",
    };
  }

  if (
    (inicio - apertura) %
      intervaloMinutos !==
    0
  ) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Ese horario no pertenece a los turnos ofrecidos por el negocio.",
    };
  }

  if (
    estaEnDescanso(
      inicio,
      duracionMinutos,
      configDia
    )
  ) {
    return {
      exito: false,
      nombre: "crear_turno",
      mensaje:
        "Ese horario corresponde al descanso del negocio.",
    };
  }

  const turnoRef =
    empresaRef
      .collection("appointments")
      .doc();

  const conversacionRef =
    empresaRef
      .collection("conversations")
      .doc(chatId);

  try {
    await adminDb.runTransaction(
      async (transaccion) => {
        const turnosQuery =
          empresaRef
            .collection("appointments")
            .where(
              "fecha",
              "==",
              fecha
            );

        const turnosSnapshot =
          await transaccion.get(
            turnosQuery
          );

        const turnos =
          turnosSnapshot.docs.map(
            obtenerTurnoDesdeDocumento
          );

        if (
          turnoOcupaHorario(
            turnos,
            hora,
            duracionMinutos
          )
        ) {
          throw new HorarioOcupadoError();
        }

        transaccion.set(
          turnoRef,
          {
            nombreCliente,
            email,
            telefono,
            servicio:
              servicio.nombre,
            servicioId:
              servicio.id,
            precioServicio:
              Number(
                servicio.precio
              ) || 0,
            fecha,
            hora,
            duracionMinutos,
            estado: "pendiente",
            notas,
            origen: "web",
            canalReserva: "chat",
            chatId,
            createdAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );

        transaccion.set(
          conversacionRef,
          {
            ultimoTurnoId:
              turnoRef.id,
            ultimoTurnoFecha:
              fecha,
            ultimoTurnoHora:
              hora,
            ultimoTurnoServicio:
              servicio.nombre,
            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }
    );
  } catch (error) {
    if (
      error instanceof
      HorarioOcupadoError
    ) {
      return {
        exito: false,
        nombre: "crear_turno",
        mensaje:
          "Ese horario acaba de ocuparse. Hay que elegir otro horario disponible.",
      };
    }

    throw error;
  }

  return {
    exito: true,
    nombre: "crear_turno",
    mensaje:
      `Turno solicitado correctamente para ${servicio.nombre} el ${fecha} a las ${hora}.`,
    datos: {
      turnoId: turnoRef.id,
      servicioId:
        servicio.id,
      servicio:
        servicio.nombre,
      precio:
        Number(
          servicio.precio
        ) || 0,
      fecha,
      hora,
      duracionMinutos,
      estado: "pendiente",
      nombreCliente,
      email,
      telefono,
    },
  };
}

class HorarioOcupadoError extends Error {
  constructor() {
    super("El horario ya está ocupado.");
    this.name =
      "HorarioOcupadoError";
  }
}

async function resolverServicio({
  empresaId,
  servicioId,
  nombreServicio,
}: {
  empresaId: string;
  servicioId: string;
  nombreServicio: string;
}): Promise<ResultadoServicio> {
  const catalogoRef = adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("catalog");

  if (servicioId) {
    const snapshot =
      await catalogoRef
        .doc(servicioId)
        .get();

    if (!snapshot.exists) {
      return {
        exito: false,
        mensaje:
          "El servicio indicado no existe.",
      };
    }

    const servicio =
      convertirServicio(
        snapshot.id,
        snapshot.data() ?? {}
      );

    if (
      servicio.tipo !==
        "servicio" ||
      servicio.activo === false ||
      !servicio.nombre
    ) {
      return {
        exito: false,
        mensaje:
          "Ese servicio no está disponible para reservar.",
      };
    }

    return {
      exito: true,
      servicio,
    };
  }

  const snapshot =
    await catalogoRef.get();

  const servicios =
    snapshot.docs
      .map((documento) =>
        convertirServicio(
          documento.id,
          documento.data()
        )
      )
      .filter(
        (servicio) =>
          servicio.tipo ===
            "servicio" &&
          servicio.activo !== false &&
          Boolean(servicio.nombre)
      );

  if (!nombreServicio) {
    return {
      exito: false,
      mensaje:
        "Primero hay que elegir qué servicio quiere reservar el cliente.",
      servicios:
        servicios.map(
          (servicio) => ({
            id: servicio.id,
            nombre:
              servicio.nombre,
          })
        ),
    };
  }

  const buscado =
    normalizarTexto(
      nombreServicio
    );

  const exactos =
    servicios.filter(
      (servicio) =>
        normalizarTexto(
          servicio.nombre
        ) === buscado
    );

  if (exactos.length === 1) {
    return {
      exito: true,
      servicio: exactos[0],
    };
  }

  const parciales =
    servicios.filter(
      (servicio) => {
        const nombre =
          normalizarTexto(
            servicio.nombre
          );

        return (
          nombre.includes(
            buscado
          ) ||
          buscado.includes(
            nombre
          )
        );
      }
    );

  if (parciales.length === 1) {
    return {
      exito: true,
      servicio: parciales[0],
    };
  }

  if (parciales.length > 1) {
    return {
      exito: false,
      mensaje:
        "Hay más de un servicio que coincide. Pedile al cliente que elija uno.",
      servicios:
        parciales.map(
          (servicio) => ({
            id: servicio.id,
            nombre:
              servicio.nombre,
          })
        ),
    };
  }

  return {
    exito: false,
    mensaje:
      `No encontré un servicio activo llamado "${nombreServicio}".`,
    servicios:
      servicios.map(
        (servicio) => ({
          id: servicio.id,
          nombre:
            servicio.nombre,
        })
      ),
  };
}

function convertirServicio(
  id: string,
  datos: DocumentData
): CatalogoServicio {
  const tipo =
    datos.tipo === "servicio" ||
    datos.tipo === "producto"
      ? datos.tipo
      : undefined;

  const nombre =
    typeof datos.nombre === "string"
      ? datos.nombre.trim()
      : "";

  const descripcion =
    typeof datos.descripcion ===
    "string"
      ? datos.descripcion.trim()
      : undefined;

  const precioNumero =
    Number(datos.precio);

  const duracionNumero =
    Number(
      datos.duracionMinutos
    );

  return {
    id,
    tipo,
    nombre,
    descripcion,
    precio:
      Number.isFinite(
        precioNumero
      )
        ? precioNumero
        : undefined,
    duracionMinutos:
      Number.isFinite(
        duracionNumero
      )
        ? duracionNumero
        : undefined,
    activo:
      typeof datos.activo ===
      "boolean"
        ? datos.activo
        : true,
  };
}

function obtenerConfigDia(
  agenda: AgendaConfig,
  fecha: string
) {
  const diaSemana =
    obtenerDiaSemana(fecha);

  return agenda.dias?.[
    diaSemana
  ];
}

function calcularHorariosDisponibles({
  fecha,
  configDia,
  duracionMinutos,
  intervaloMinutos,
  turnos,
}: {
  fecha: string;
  configDia: ConfigDiaAgenda;
  duracionMinutos: number;
  intervaloMinutos: number;
  turnos: TurnoExistente[];
}) {
  if (
    !configDia.apertura ||
    !configDia.cierre ||
    !horaValida(
      configDia.apertura
    ) ||
    !horaValida(
      configDia.cierre
    )
  ) {
    return [];
  }

  const apertura =
    minutosDesdeHora(
      configDia.apertura
    );

  const cierre =
    minutosDesdeHora(
      configDia.cierre
    );

  const horarios: string[] =
    [];

  for (
    let inicio = apertura;
    inicio + duracionMinutos <=
    cierre;
    inicio += intervaloMinutos
  ) {
    const hora =
      horaDesdeMinutos(
        inicio
      );

    if (
      fechaHoraYaPasoArgentina(
        fecha,
        hora
      )
    ) {
      continue;
    }

    if (
      estaEnDescanso(
        inicio,
        duracionMinutos,
        configDia
      )
    ) {
      continue;
    }

    if (
      turnoOcupaHorario(
        turnos,
        hora,
        duracionMinutos
      )
    ) {
      continue;
    }

    horarios.push(hora);
  }

  return horarios;
}

function turnoOcupaHorario(
  turnos: TurnoExistente[],
  hora: string,
  duracionMinutos: number
) {
  const nuevoInicio =
    minutosDesdeHora(hora);

  return turnos.some(
    (turno) => {
      if (
        !turno.hora ||
        turno.estado ===
          "cancelado" ||
        !horaValida(
          turno.hora
        )
      ) {
        return false;
      }

      const inicioExistente =
        minutosDesdeHora(
          turno.hora
        );

      const duracionExistente =
        Math.max(
          5,
          Number(
            turno.duracionMinutos
          ) || 60
        );

      return seSuperponen(
        nuevoInicio,
        duracionMinutos,
        inicioExistente,
        duracionExistente
      );
    }
  );
}

function obtenerTurnoDesdeDocumento(
  documento:
    QueryDocumentSnapshot<DocumentData>
): TurnoExistente {
  const datos =
    documento.data();

  return {
    hora:
      typeof datos.hora ===
      "string"
        ? datos.hora
        : undefined,
    duracionMinutos:
      Number.isFinite(
        Number(
          datos.duracionMinutos
        )
      )
        ? Number(
            datos.duracionMinutos
          )
        : undefined,
    estado:
      typeof datos.estado ===
      "string"
        ? datos.estado
        : undefined,
  };
}

function estaEnDescanso(
  inicio: number,
  duracionMinutos: number,
  configDia: ConfigDiaAgenda
) {
  if (
    !configDia.descansoInicio ||
    !configDia.descansoFin ||
    !horaValida(
      configDia.descansoInicio
    ) ||
    !horaValida(
      configDia.descansoFin
    )
  ) {
    return false;
  }

  const descansoInicio =
    minutosDesdeHora(
      configDia.descansoInicio
    );

  const descansoFin =
    minutosDesdeHora(
      configDia.descansoFin
    );

  if (
    descansoFin <=
    descansoInicio
  ) {
    return false;
  }

  return seSuperponen(
    inicio,
    duracionMinutos,
    descansoInicio,
    descansoFin -
      descansoInicio
  );
}

function seSuperponen(
  inicioA: number,
  duracionA: number,
  inicioB: number,
  duracionB: number
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

function minutosDesdeHora(
  hora: string
) {
  const [horas, minutos] =
    hora
      .split(":")
      .map(Number);

  return (
    horas * 60 +
    minutos
  );
}

function horaDesdeMinutos(
  total: number
) {
  const horas =
    Math.floor(total / 60);

  const minutos =
    total % 60;

  return `${String(
    horas
  ).padStart(
    2,
    "0"
  )}:${String(
    minutos
  ).padStart(
    2,
    "0"
  )}`;
}

function fechaValida(
  valor: string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    valor
  );
}

function horaValida(
  valor: string
) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    valor
  );
}

function obtenerDiaSemana(
  fecha: string
) {
  const fechaUTC =
    new Date(
      `${fecha}T12:00:00Z`
    );

  return String(
    fechaUTC.getUTCDay()
  );
}

function fechaHoraYaPasoArgentina(
  fecha: string,
  hora: string
) {
  const momento =
    new Date(
      `${fecha}T${hora}:00-03:00`
    );

  if (
    Number.isNaN(
      momento.getTime()
    )
  ) {
    return true;
  }

  return (
    momento.getTime() <=
    Date.now()
  );
}

function normalizarTexto(
  valor: string
) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function obtenerTexto(
  valor: unknown
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function herramientaNoDisponible(
  nombre: NombreHerramienta
): ResultadoHerramienta {
  return {
    exito: false,
    nombre,
    mensaje:
      `La herramienta "${nombre}" no está disponible.`,
  };
}