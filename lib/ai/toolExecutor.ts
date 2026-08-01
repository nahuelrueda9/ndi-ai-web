import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
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

    default:
      return herramientaNoDisponible(nombre);
  }
}

type ParametrosHerramienta = {
  empresaId: string;
  chatId: string;
  argumentos: Record<string, unknown>;
};

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

  const conversacionRef = doc(
    db,
    "companies",
    empresaId,
    "conversations",
    chatId
  );

  await updateDoc(conversacionRef, {
    atendidoPor: "humano",
    humanoActivo: true,
    requiereAtencionHumana: true,
    motivoAtencionHumana: motivo,
    urgenciaAtencionHumana: urgencia,
    solicitadoAtencionHumanaAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    updatedAt: serverTimestamp(),
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

  const conversacionRef = doc(
    db,
    "companies",
    empresaId,
    "conversations",
    chatId
  );

  await updateDoc(conversacionRef, datosActualizados);

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

function obtenerTexto(valor: unknown): string {
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
    mensaje: `La herramienta "${nombre}" no está disponible.`,
  };
}