import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  FieldValue,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

type MensajeHistorial = {
  role: "user" | "assistant";
  content: string;
};

type BodyWidgetChat = {
  empresaId?: string;
  conversacionId?: string;
  accessToken?: string;
  visitanteId?: string;
  mensaje?: string;
};

type TipoDisparadorAutomatizacion =
  | "palabra_clave"
  | "pide_humano"
  | "sin_respuesta"
  | "fuera_horario";

type TipoAccionAutomatizacion =
  | "responder_mensaje"
  | "asignar_humano"
  | "agregar_etiqueta"
  | "cerrar_conversacion";

type AutomatizacionData = {
  activa?: boolean;
  disparador?: {
    tipo?: TipoDisparadorAutomatizacion;
    valor?: string;
    minutos?: number;
  };
  accion?: {
    tipo?: TipoAccionAutomatizacion;
    valor?: string;
  };
};

type ResultadoAutomatizacion = {
  respuesta: string | null;
  humanoActivo: boolean;
  conversacionCerrada: boolean;
  ejecutada: boolean;
};

type EmpresaPublica = {
  nombre?: string;
  descripcion?: string;
  personalidad?: string;
  objetivo?: string;
  instrucciones?: string;
  restricciones?: string;
  idioma?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  horario?: string;
  sitioWeb?: string;
  formasPago?: string;
  agente?: {
    nombre?: string;
    rol?: string;
    personalidad?: string;
    instrucciones?: string;
  };
  widget?: {
    nombreBot?: string;
    mensajeBienvenida?: string;
    colorPrincipal?: string;
    tema?: "oscuro" | "claro";
    posicion?: "derecha" | "izquierda";
    formaBoton?: "redondo" | "cuadrado";
    textoPlaceholder?: string;
    mostrarMarca?: boolean;
  };
};

const MAXIMO_MENSAJE = 2_000;
const MAXIMO_VISITANTE_ID = 160;
const MAXIMO_HISTORIAL = 20;
const MAXIMO_MENSAJES_DEVUELTOS = 200;

function limpiarTexto(valor: unknown, maximo: number) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim().slice(0, maximo);
}

function obtenerEmpresaPublica(datos: DocumentData): EmpresaPublica {
  return {
    nombre: typeof datos.nombre === "string" ? datos.nombre : undefined,
    descripcion:
      typeof datos.descripcion === "string" ? datos.descripcion : undefined,
    personalidad:
      typeof datos.personalidad === "string" ? datos.personalidad : undefined,
    objetivo:
      typeof datos.objetivo === "string" ? datos.objetivo : undefined,
    instrucciones:
      typeof datos.instrucciones === "string" ? datos.instrucciones : undefined,
    restricciones:
      typeof datos.restricciones === "string" ? datos.restricciones : undefined,
    idioma: typeof datos.idioma === "string" ? datos.idioma : undefined,
    telefono:
      typeof datos.telefono === "string" ? datos.telefono : undefined,
    whatsapp:
      typeof datos.whatsapp === "string" ? datos.whatsapp : undefined,
    email: typeof datos.email === "string" ? datos.email : undefined,
    direccion:
      typeof datos.direccion === "string" ? datos.direccion : undefined,
    horario:
      typeof datos.horario === "string" ? datos.horario : undefined,
    sitioWeb:
      typeof datos.sitioWeb === "string" ? datos.sitioWeb : undefined,
    formasPago:
      typeof datos.formasPago === "string" ? datos.formasPago : undefined,
    agente:
      datos.agente && typeof datos.agente === "object"
        ? {
            nombre:
              typeof datos.agente.nombre === "string"
                ? datos.agente.nombre
                : undefined,
            rol:
              typeof datos.agente.rol === "string"
                ? datos.agente.rol
                : undefined,
            personalidad:
              typeof datos.agente.personalidad === "string"
                ? datos.agente.personalidad
                : undefined,
            instrucciones:
              typeof datos.agente.instrucciones === "string"
                ? datos.agente.instrucciones
                : undefined,
          }
        : undefined,
    widget:
      datos.widget && typeof datos.widget === "object"
        ? {
            nombreBot:
              typeof datos.widget.nombreBot === "string"
                ? datos.widget.nombreBot
                : undefined,
            mensajeBienvenida:
              typeof datos.widget.mensajeBienvenida === "string"
                ? datos.widget.mensajeBienvenida
                : undefined,
            colorPrincipal:
              typeof datos.widget.colorPrincipal === "string"
                ? datos.widget.colorPrincipal
                : undefined,
            tema:
              datos.widget.tema === "claro" || datos.widget.tema === "oscuro"
                ? datos.widget.tema
                : undefined,
            posicion:
              datos.widget.posicion === "izquierda" ||
              datos.widget.posicion === "derecha"
                ? datos.widget.posicion
                : undefined,
            formaBoton:
              datos.widget.formaBoton === "cuadrado" ||
              datos.widget.formaBoton === "redondo"
                ? datos.widget.formaBoton
                : undefined,
            textoPlaceholder:
              typeof datos.widget.textoPlaceholder === "string"
                ? datos.widget.textoPlaceholder
                : undefined,
            mostrarMarca:
              typeof datos.widget.mostrarMarca === "boolean"
                ? datos.widget.mostrarMarca
                : undefined,
          }
        : undefined,
  };
}

function serializarMensaje(
  documento: QueryDocumentSnapshot<DocumentData>
) {
  const datos = documento.data();
  const fecha = datos.createdAt;

  return {
    id: documento.id,
    role: datos.role === "assistant" ? "assistant" : "user",
    content: typeof datos.content === "string" ? datos.content : "",
    enviadoPor:
      typeof datos.enviadoPor === "string"
        ? datos.enviadoPor
        : datos.role === "assistant"
          ? "ia"
          : "cliente",
    createdAt:
      fecha && typeof fecha.toDate === "function"
        ? fecha.toDate().toISOString()
        : null,
  };
}

async function verificarConversacion({
  empresaId,
  conversacionId,
  accessToken,
}: {
  empresaId: string;
  conversacionId: string;
  accessToken: string;
}) {
  const referencia = adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("conversations")
    .doc(conversacionId);

  const snapshot = await referencia.get();

  if (!snapshot.exists) {
    return null;
  }

  const datos = snapshot.data();

  if (!datos || datos.widgetAccessToken !== accessToken) {
    return null;
  }

  return {
    referencia,
    datos,
  };
}

async function crearConversacion({
  empresaId,
  visitanteId,
  mensajeInicial,
}: {
  empresaId: string;
  visitanteId: string;
  mensajeInicial: string;
}) {
  const accessToken = randomUUID();

  const referencia = adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("conversations")
    .doc();

  await referencia.set({
    empresaId,
    visitanteId,
    canal: "web",
    estado: "abierta",
    estadoComercial: "nuevo",
    atendidoPor: "ia",
    humanoActivo: false,
    ultimoMensaje: mensajeInicial,
    ultimoRol: "user",
    cantidadMensajes: 0,
    widgetAccessToken: accessToken,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    referencia,
    accessToken,
  };
}

async function obtenerHistorial(
  referencia: DocumentReference<DocumentData>
): Promise<MensajeHistorial[]> {
  const snapshot = await referencia
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(MAXIMO_HISTORIAL)
    .get();

  return snapshot.docs
    .reverse()
    .map((documento) => {
      const datos = documento.data();

      return {
        role: datos.role === "assistant" ? "assistant" : "user",
        content: typeof datos.content === "string" ? datos.content : "",
      } satisfies MensajeHistorial;
    })
    .filter((mensaje) => mensaje.content.trim().length > 0);
}

async function obtenerMensajes(
  referencia: DocumentReference<DocumentData>
) {
  const snapshot = await referencia
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(MAXIMO_MENSAJES_DEVUELTOS)
    .get();

  return snapshot.docs.map(serializarMensaje);
}

function normalizarComparacion(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mensajePideHumano(mensaje: string) {
  const texto = normalizarComparacion(mensaje);

  const frases = [
    "hablar con una persona",
    "hablar con alguien",
    "hablar con un asesor",
    "quiero un asesor",
    "necesito un asesor",
    "atencion humana",
    "atención humana",
    "operador humano",
    "persona real",
  ];

  return frases.some((frase) =>
    texto.includes(normalizarComparacion(frase))
  );
}

function coincideAutomatizacion(
  automatizacion: AutomatizacionData,
  mensaje: string
) {
  const tipo = automatizacion.disparador?.tipo;

  if (tipo === "palabra_clave") {
    const palabra = normalizarComparacion(
      automatizacion.disparador?.valor ?? ""
    );

    if (!palabra) {
      return false;
    }

    return normalizarComparacion(mensaje).includes(palabra);
  }

  if (tipo === "pide_humano") {
    return mensajePideHumano(mensaje);
  }

  /*
   * "sin_respuesta" necesita una tarea programada.
   * "fuera_horario" necesita horarios estructurados.
   * No se ejecutan desde este endpoint para evitar falsos positivos.
   */
  return false;
}

async function marcarAutomatizacionEjecutada(
  referencia: DocumentReference<DocumentData>
) {
  await referencia.update({
    ejecuciones: FieldValue.increment(1),
    ultimaEjecucionAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function ejecutarAutomatizaciones({
  empresaId,
  mensaje,
  referenciaConversacion,
}: {
  empresaId: string;
  mensaje: string;
  referenciaConversacion: DocumentReference<DocumentData>;
}): Promise<ResultadoAutomatizacion> {
  const snapshot = await adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("automations")
    .where("activa", "==", true)
    .limit(50)
    .get();

  const coincidentes = snapshot.docs.filter((documento) =>
    coincideAutomatizacion(
      documento.data() as AutomatizacionData,
      mensaje
    )
  );

  for (const documento of coincidentes) {
    const automatizacion =
      documento.data() as AutomatizacionData;

    const tipoAccion = automatizacion.accion?.tipo;
    const valorAccion = limpiarTexto(
      automatizacion.accion?.valor,
      10_000
    );

    if (tipoAccion === "agregar_etiqueta") {
      if (!valorAccion) {
        continue;
      }

      await referenciaConversacion.update({
        etiquetas: FieldValue.arrayUnion(valorAccion),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await marcarAutomatizacionEjecutada(
        documento.ref
      );

      continue;
    }

    if (tipoAccion === "responder_mensaje") {
      if (!valorAccion) {
        continue;
      }

      await referenciaConversacion
        .collection("messages")
        .add({
          role: "assistant",
          content: valorAccion,
          enviadoPor: "automatizacion",
          canal: "web",
          estadoEnvio: "enviado",
          createdAt: FieldValue.serverTimestamp(),
        });

      await referenciaConversacion.update({
        ultimoMensaje: valorAccion,
        ultimoRol: "assistant",
        cantidadMensajes: FieldValue.increment(1),
        atendidoPor: "ia",
        humanoActivo: false,
        estado: "abierta",
        updatedAt: FieldValue.serverTimestamp(),
      });

      await marcarAutomatizacionEjecutada(
        documento.ref
      );

      return {
        respuesta: valorAccion,
        humanoActivo: false,
        conversacionCerrada: false,
        ejecutada: true,
      };
    }

    if (tipoAccion === "asignar_humano") {
      await referenciaConversacion.update({
        atendidoPor: "humano",
        humanoActivo: true,
        estado: "abierta",
        updatedAt: FieldValue.serverTimestamp(),
      });

      await marcarAutomatizacionEjecutada(
        documento.ref
      );

      return {
        respuesta: null,
        humanoActivo: true,
        conversacionCerrada: false,
        ejecutada: true,
      };
    }

    if (tipoAccion === "cerrar_conversacion") {
      await referenciaConversacion.update({
        estado: "cerrada",
        updatedAt: FieldValue.serverTimestamp(),
      });

      await marcarAutomatizacionEjecutada(
        documento.ref
      );

      return {
        respuesta: null,
        humanoActivo: false,
        conversacionCerrada: true,
        ejecutada: true,
      };
    }
  }

  return {
    respuesta: null,
    humanoActivo: false,
    conversacionCerrada: false,
    ejecutada: false,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const empresaId = limpiarTexto(
      url.searchParams.get("empresaId"),
      160
    );

    if (!empresaId) {
      return NextResponse.json(
        { error: "El ID de la empresa es obligatorio." },
        { status: 400 }
      );
    }

    const empresaReferencia = adminDb.collection("companies").doc(empresaId);
    const empresaSnapshot = await empresaReferencia.get();

    if (!empresaSnapshot.exists) {
      return NextResponse.json(
        { error: "Este asistente no está disponible." },
        { status: 404 }
      );
    }

    const empresa = obtenerEmpresaPublica(
      empresaSnapshot.data() ?? {}
    );

    const conversacionId = limpiarTexto(
      url.searchParams.get("conversacionId"),
      160
    );

    const accessToken = limpiarTexto(
      url.searchParams.get("accessToken"),
      200
    );

    if (!conversacionId || !accessToken) {
      return NextResponse.json({
        empresa,
        conversacion: null,
        mensajes: [],
      });
    }

    const resultado = await verificarConversacion({
      empresaId,
      conversacionId,
      accessToken,
    });

    if (!resultado) {
      return NextResponse.json(
        {
          error:
            "La conversación no existe o el acceso venció.",
        },
        { status: 403 }
      );
    }

    const mensajes = await obtenerMensajes(
      resultado.referencia
    );

    return NextResponse.json({
      empresa,
      conversacion: {
        id: resultado.referencia.id,
        estado: resultado.datos.estado ?? "abierta",
        atendidoPor: resultado.datos.atendidoPor ?? "ia",
        humanoActivo: resultado.datos.humanoActivo === true,
      },
      mensajes,
    });
  } catch (error) {
    console.error(
      "Error en GET /api/widget/chat:",
      error
    );

    return NextResponse.json(
      { error: "No se pudo cargar el asistente." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BodyWidgetChat;

    const empresaId = limpiarTexto(body.empresaId, 160);
    const mensaje = limpiarTexto(body.mensaje, MAXIMO_MENSAJE);

    const visitanteId =
      limpiarTexto(body.visitanteId, MAXIMO_VISITANTE_ID) ||
      `visitante-${randomUUID()}`;

    if (!empresaId || !mensaje) {
      return NextResponse.json(
        { error: "Faltan la empresa o el mensaje." },
        { status: 400 }
      );
    }

    const empresaReferencia = adminDb.collection("companies").doc(empresaId);
    const empresaSnapshot = await empresaReferencia.get();

    if (!empresaSnapshot.exists) {
      return NextResponse.json(
        { error: "Este asistente no está disponible." },
        { status: 404 }
      );
    }

    const empresa = obtenerEmpresaPublica(
      empresaSnapshot.data() ?? {}
    );

    let referenciaConversacion: DocumentReference<DocumentData>;
    let accessToken = limpiarTexto(body.accessToken, 200);
    const conversacionId = limpiarTexto(body.conversacionId, 160);
    let datosConversacion: DocumentData | undefined;

    if (conversacionId && accessToken) {
      const resultado = await verificarConversacion({
        empresaId,
        conversacionId,
        accessToken,
      });

      if (!resultado) {
        return NextResponse.json(
          {
            error:
              "La conversación no existe o el acceso venció.",
          },
          { status: 403 }
        );
      }

      referenciaConversacion = resultado.referencia;
      datosConversacion = resultado.datos;
    } else {
      const nueva = await crearConversacion({
        empresaId,
        visitanteId,
        mensajeInicial: mensaje,
      });

      referenciaConversacion = nueva.referencia;
      accessToken = nueva.accessToken;
      datosConversacion = {
        atendidoPor: "ia",
        humanoActivo: false,
        estado: "abierta",
      };
    }

    const historial = await obtenerHistorial(
      referenciaConversacion
    );

    await referenciaConversacion.collection("messages").add({
      role: "user",
      content: mensaje,
      enviadoPor: "cliente",
      canal: "web",
      estadoEnvio: "enviado",
      createdAt: FieldValue.serverTimestamp(),
    });

    await referenciaConversacion.update({
      ultimoMensaje: mensaje,
      ultimoRol: "user",
      cantidadMensajes: FieldValue.increment(1),
      estado: "abierta",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const humanoActivo =
      datosConversacion?.humanoActivo === true ||
      datosConversacion?.atendidoPor === "humano";

    if (humanoActivo) {
      return NextResponse.json({
        conversacionId: referenciaConversacion.id,
        accessToken,
        respuesta: null,
        humanoActivo: true,
      });
    }

    const resultadoAutomatizacion =
      await ejecutarAutomatizaciones({
        empresaId,
        mensaje,
        referenciaConversacion,
      });

    if (resultadoAutomatizacion.ejecutada) {
      return NextResponse.json({
        conversacionId: referenciaConversacion.id,
        accessToken,
        respuesta: resultadoAutomatizacion.respuesta,
        humanoActivo:
          resultadoAutomatizacion.humanoActivo,
        estado: resultadoAutomatizacion
          .conversacionCerrada
          ? "cerrada"
          : "abierta",
        automatizacionEjecutada: true,
      });
    }

    const secretoInterno =
      process.env
        .INTERNAL_API_SECRET
        ?.trim();

    if (!secretoInterno) {
      throw new Error(
        "Falta configurar INTERNAL_API_SECRET."
      );
    }

    const respuestaApi = await fetch(
      new URL("/api/gemini", request.url),
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          "x-ndi-internal-secret":
            secretoInterno,
        },
        body: JSON.stringify({
          mensaje,
          historial,
          empresa,
          empresaId,
          chatId: referenciaConversacion.id,
        }),
        cache: "no-store",
      }
    );

    const textoRespuesta = await respuestaApi.text();

    let datosRespuesta: {
      respuesta?: string;
      error?: string;
    };

    try {
      datosRespuesta = JSON.parse(textoRespuesta);
    } catch {
      throw new Error(
        `La API de IA respondió con un formato inválido. Estado ${respuestaApi.status}.`
      );
    }

    if (!respuestaApi.ok) {
      throw new Error(
        datosRespuesta.error ||
          "No se pudo generar la respuesta."
      );
    }

    const respuesta = limpiarTexto(
      datosRespuesta.respuesta,
      10_000
    );

    if (!respuesta) {
      throw new Error(
        "La IA devolvió una respuesta vacía."
      );
    }

    const estadoActual = await referenciaConversacion.get();
    const datosActuales = estadoActual.data();

    const humanoTomoControl =
      datosActuales?.humanoActivo === true ||
      datosActuales?.atendidoPor === "humano";

    if (!humanoTomoControl) {
      await referenciaConversacion.collection("messages").add({
        role: "assistant",
        content: respuesta,
        enviadoPor: "ia",
        canal: "web",
        estadoEnvio: "enviado",
        createdAt: FieldValue.serverTimestamp(),
      });

      await referenciaConversacion.update({
        ultimoMensaje: respuesta,
        ultimoRol: "assistant",
        cantidadMensajes: FieldValue.increment(1),
        atendidoPor: "ia",
        humanoActivo: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      conversacionId: referenciaConversacion.id,
      accessToken,
      respuesta: humanoTomoControl ? null : respuesta,
      humanoActivo: humanoTomoControl,
    });
  } catch (error) {
    console.error(
      "Error en POST /api/widget/chat:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el mensaje.",
      },
      { status: 500 }
    );
  }
}