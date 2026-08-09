import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { crearNotificacion } from "@/lib/notifications/notificationService";

export const runtime = "nodejs";

type RolMensaje = "user" | "assistant";

type MensajeHistorial = {
  role: RolMensaje;
  content: string;
};

type WhatsAppMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;

  text?: {
    body?: string;
  };

  button?: {
    text?: string;
  };

  interactive?: {
    button_reply?: {
      title?: string;
    };

    list_reply?: {
      title?: string;
    };
  };
};

type WhatsAppValue = {
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };

  contacts?: Array<{
    profile?: {
      name?: string;
    };

    wa_id?: string;
  }>;

  messages?: WhatsAppMessage[];
};

type WhatsAppWebhookBody = {
  object?: string;

  entry?: Array<{
    id?: string;

    changes?: Array<{
      field?: string;
      value?: WhatsAppValue;
    }>;
  }>;
};

type GeminiResponse = {
  respuesta?: string;
  error?: string;
};

function obtenerAppSecret() {
  return (
    process.env.WHATSAPP_APP_SECRET?.trim() ||
    process.env.META_APP_SECRET?.trim() ||
    ""
  );
}

function verificarFirmaMeta({
  cuerpoCrudo,
  firmaRecibida,
  appSecret,
}: {
  cuerpoCrudo: string;
  firmaRecibida: string | null;
  appSecret: string;
}) {
  if (
    !firmaRecibida ||
    !firmaRecibida.startsWith("sha256=")
  ) {
    return false;
  }

  const firmaHex = firmaRecibida
    .slice("sha256=".length)
    .trim()
    .toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(firmaHex)) {
    return false;
  }

  const firmaEsperadaHex = createHmac(
    "sha256",
    appSecret
  )
    .update(Buffer.from(cuerpoCrudo, "utf8"))
    .digest("hex");

  const firmaBuffer = Buffer.from(
    firmaHex,
    "hex"
  );

  const firmaEsperadaBuffer = Buffer.from(
    firmaEsperadaHex,
    "hex"
  );

  if (
    firmaBuffer.length !==
    firmaEsperadaBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firmaBuffer,
    firmaEsperadaBuffer
  );
}

const LIMITES_CONVERSACIONES = {
  free: 50,
  pro: 1000,
  business: 10000,
} as const;

const LIMITES_RESPUESTAS_IA = {
  free: 250,
  pro: 5000,
  business: 20000,
} as const;

type PlanEmpresa =
  keyof typeof LIMITES_CONVERSACIONES;

function obtenerMesActualArgentina() {
  const partes =
    new Intl.DateTimeFormat("en-US", {
      timeZone:
        "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());

  const anio =
    partes.find(
      (parte) => parte.type === "year"
    )?.value ?? "";

  const mes =
    partes.find(
      (parte) => parte.type === "month"
    )?.value ?? "";

  return `${anio}-${mes}`;
}

function convertirFecha(valor: unknown) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (
      valor as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      valor as {
        toDate: () => Date;
      }
    ).toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha = new Date(valor);

    if (!Number.isNaN(fecha.getTime())) {
      return fecha;
    }
  }

  return null;
}

function obtenerPlanEfectivo(
  empresa: FirebaseFirestore.DocumentData
): PlanEmpresa {
  const planGuardado: PlanEmpresa =
    empresa.plan === "pro"
      ? "pro"
      : empresa.plan === "business"
        ? "business"
        : "free";

  if (planGuardado === "free") {
    return "free";
  }

  if (planGuardado === "business") {
    return "business";
  }

  const fechaVencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt
    );

  if (
    !fechaVencimiento ||
    fechaVencimiento.getTime() <=
      Date.now()
  ) {
    return "free";
  }

  return "pro";
}

class LimiteConversacionesError extends Error {
  constructor() {
    super(
      "Se alcanzó el límite mensual de conversaciones."
    );

    this.name =
      "LimiteConversacionesError";
  }
}

class LimiteRespuestasIAError extends Error {
  constructor() {
    super(
      "Se alcanzó el límite mensual de respuestas de IA."
    );

    this.name =
      "LimiteRespuestasIAError";
  }
}

async function reservarRespuestaIA(
  empresaReferencia: FirebaseFirestore.DocumentReference
) {
  await adminDb.runTransaction(
    async (transaction) => {
      const empresaSnapshot =
        await transaction.get(
          empresaReferencia
        );

      if (!empresaSnapshot.exists) {
        throw new Error(
          "La empresa ya no existe."
        );
      }

      const datos =
        empresaSnapshot.data() ?? {};

      const plan =
        obtenerPlanEfectivo(datos);

      const limite =
        LIMITES_RESPUESTAS_IA[
          plan
        ];

      const mesActual =
        obtenerMesActualArgentina();

      const mesGuardado =
        typeof datos.aiResponsesUsageMonth ===
        "string"
          ? datos.aiResponsesUsageMonth
          : "";

      const usadas =
        mesGuardado === mesActual
          ? Math.max(
              0,
              Number(
                datos.aiResponsesThisMonth ??
                  0
              ) || 0
            )
          : 0;

      if (usadas >= limite) {
        throw new LimiteRespuestasIAError();
      }

      transaction.update(
        empresaReferencia,
        {
          aiResponsesThisMonth:
            usadas + 1,
          aiResponsesUsageMonth:
            mesActual,
          updatedAt:
            FieldValue.serverTimestamp(),
        }
      );
    }
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new NextResponse("Forbidden", {
    status: 403,
  });
}

export async function POST(request: NextRequest) {
  try {
    const appSecret = obtenerAppSecret();

    if (!appSecret) {
      console.error(
        "Falta configurar WHATSAPP_APP_SECRET o META_APP_SECRET."
      );

      return NextResponse.json(
        {
          error:
            "La seguridad del webhook no está configurada.",
        },
        {
          status: 500,
        }
      );
    }

    const cuerpoCrudo = await request.text();

    const firmaValida = verificarFirmaMeta({
      cuerpoCrudo,
      firmaRecibida: request.headers.get(
        "x-hub-signature-256"
      ),
      appSecret,
    });

    if (!firmaValida) {
      console.warn(
        "Webhook de WhatsApp rechazado por firma inválida."
      );

      return NextResponse.json(
        {
          error: "Firma inválida.",
        },
        {
          status: 401,
        }
      );
    }

    let body: WhatsAppWebhookBody;

    try {
      body = JSON.parse(
        cuerpoCrudo
      ) as WhatsAppWebhookBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "El cuerpo del webhook no es JSON válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") {
          continue;
        }

        const value = change.value;
        const phoneNumberId =
          value?.metadata?.phone_number_id?.trim();

        if (!phoneNumberId) {
          console.warn(
            "Webhook de WhatsApp sin phone_number_id."
          );
          continue;
        }

        /*
         * Buscamos qué empresa utiliza este número de WhatsApp.
         */
        const integracionesSnapshot = await adminDb
          .collectionGroup("integrations")
          .where("phoneNumberId", "==", phoneNumberId)
          .limit(1)
          .get();

        if (integracionesSnapshot.empty) {
          console.warn(
            `No se encontró una empresa para el Phone Number ID ${phoneNumberId}.`
          );
          continue;
        }

        const integracionDocumento =
          integracionesSnapshot.docs[0];

        const integracionData =
          integracionDocumento.data();

        const accessToken =
          typeof integracionData.accessToken === "string"
            ? integracionData.accessToken.trim()
            : "";

        const empresaReferencia =
          integracionDocumento.ref.parent.parent;

        if (!empresaReferencia) {
          console.warn(
            "No se pudo obtener la empresa asociada a WhatsApp."
          );
          continue;
        }

        const empresaId = empresaReferencia.id;

        /*
         * Obtenemos los datos de la empresa para que la IA
         * conserve su personalidad e instrucciones.
         */
        const empresaSnapshot =
          await empresaReferencia.get();

        if (!empresaSnapshot.exists) {
          console.warn(
            `La empresa ${empresaId} no existe.`
          );
          continue;
        }

        const empresa = empresaSnapshot.data() ?? {};

        const planEfectivo =
          obtenerPlanEfectivo(empresa);

        if (
          planEfectivo === "free" &&
          empresa.plan === "pro"
        ) {
          await empresaReferencia.set(
            {
              plan: "free",
              subscriptionStatus: "expired",
              maxConversations: 50,
              updatedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            }
          );
        }

        for (const mensaje of value?.messages ?? []) {
          const messageId = mensaje.id?.trim();
          const numeroCliente = mensaje.from?.trim();

          if (!messageId || !numeroCliente) {
            continue;
          }

          const contenido =
            obtenerContenidoMensaje(mensaje);

          if (!contenido) {
            console.log(
              `Mensaje de WhatsApp no compatible: ${mensaje.type}`
            );
            continue;
          }

          const contacto = value?.contacts?.find(
            (item) => item.wa_id === numeroCliente
          );

          const nombreContacto =
            contacto?.profile?.name?.trim() ||
            `WhatsApp ${numeroCliente}`;

          const conversacionId =
            `whatsapp_${numeroCliente}`;

          const conversacionReferencia = adminDb
            .collection("companies")
            .doc(empresaId)
            .collection("conversations")
            .doc(conversacionId);

          const mensajeReferencia =
            conversacionReferencia
              .collection("messages")
              .doc(messageId);

          /*
           * Guardamos el mensaje de forma idempotente.
           * Si Meta vuelve a enviar el mismo webhook,
           * no generamos otra respuesta de IA.
           */
          let limiteMensualAlcanzado =
            false;

          let mensajeFueCreado = false;
          let conversacionNueva = false;

          try {
            const resultadoGuardado =
              await adminDb.runTransaction(
                async (transaction) => {
                  const [
                    mensajeExistente,
                    conversacionSnapshot,
                    empresaTransaccionSnapshot,
                  ] = await Promise.all([
                    transaction.get(
                      mensajeReferencia
                    ),
                    transaction.get(
                      conversacionReferencia
                    ),
                    transaction.get(
                      empresaReferencia
                    ),
                  ]);

                  if (
                    mensajeExistente.exists
                  ) {
                    return {
                      creado: false,
                      conversacionNueva: false,
                    };
                  }

                  if (
                    !empresaTransaccionSnapshot.exists
                  ) {
                    throw new Error(
                      `La empresa ${empresaId} ya no existe.`
                    );
                  }

                  const conversacionExistia =
                    conversacionSnapshot.exists;

                  const empresaTransaccion =
                    empresaTransaccionSnapshot.data() ??
                    {};

                  if (!conversacionExistia) {
                    const plan =
                      obtenerPlanEfectivo(
                        empresaTransaccion
                      );

                    const limiteMensual =
                      LIMITES_CONVERSACIONES[
                        plan
                      ];

                    const mesActual =
                      obtenerMesActualArgentina();

                    const mesGuardado =
                      typeof empresaTransaccion
                        .conversationsUsageMonth ===
                      "string"
                        ? empresaTransaccion
                            .conversationsUsageMonth
                        : "";

                    const usadas =
                      mesGuardado === mesActual
                        ? Math.max(
                            0,
                            Number(
                              empresaTransaccion
                                .conversationsThisMonth ??
                                0
                            ) || 0
                          )
                        : 0;

                    if (
                      usadas >=
                      limiteMensual
                    ) {
                      throw new LimiteConversacionesError();
                    }

                    const planGuardado =
                      empresaTransaccion.plan ===
                        "pro" ||
                      empresaTransaccion.plan ===
                        "business"
                        ? empresaTransaccion.plan
                        : "free";

                    const actualizacionEmpresa: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> =
                      {
                        conversationsThisMonth:
                          usadas + 1,
                        conversationsUsageMonth:
                          mesActual,
                        updatedAt:
                          FieldValue.serverTimestamp(),
                      };

                    if (
                      plan === "free" &&
                      planGuardado !== "free"
                    ) {
                      actualizacionEmpresa.plan =
                        "free";
                      actualizacionEmpresa.subscriptionStatus =
                        "expired";
                      actualizacionEmpresa.maxConversations =
                        50;
                    }

                    transaction.update(
                      empresaReferencia,
                      actualizacionEmpresa
                    );
                  }

                  transaction.set(
                    conversacionReferencia,
                    {
                      empresaId,
                      canal: "whatsapp",
                      visitanteId:
                        numeroCliente,
                      nombreContacto,
                      telefono:
                        numeroCliente,

                      whatsappPhoneNumberId:
                        phoneNumberId,

                      whatsappDisplayNumber:
                        value?.metadata
                          ?.display_phone_number ??
                        "",

                      estado: "abierta",
                      atendidoPor:
                        conversacionSnapshot.data()
                          ?.atendidoPor ??
                        "ia",

                      humanoActivo:
                        conversacionSnapshot.data()
                          ?.humanoActivo ===
                        true,

                      ultimoMensaje:
                        contenido,
                      ultimoRol: "user",

                      cantidadMensajes:
                        FieldValue.increment(
                          1
                        ),

                      updatedAt:
                        FieldValue.serverTimestamp(),

                      ...(!conversacionExistia
                        ? {
                            createdAt:
                              FieldValue.serverTimestamp(),
                          }
                        : {}),
                    },
                    {
                      merge: true,
                    }
                  );

                  transaction.set(
                    mensajeReferencia,
                    {
                      role: "user",
                      content: contenido,
                      enviadoPor: "cliente",
                      canal: "whatsapp",
                      whatsappMessageId:
                        messageId,
                      createdAt:
                        FieldValue.serverTimestamp(),
                    }
                  );

                  return {
                    creado: true,
                    conversacionNueva:
                      !conversacionExistia,
                  };
                }
              );

            mensajeFueCreado =
              resultadoGuardado.creado;
            conversacionNueva =
              resultadoGuardado.conversacionNueva;
          } catch (errorTransaccion) {
            if (
              errorTransaccion instanceof
              LimiteConversacionesError
            ) {
              limiteMensualAlcanzado =
                true;
            } else {
              throw errorTransaccion;
            }
          }

          if (limiteMensualAlcanzado) {
            console.warn(
              `La empresa ${empresaId} alcanzó el límite mensual y no se creó la conversación de WhatsApp ${conversacionId}.`
            );

            continue;
          }

          if (!mensajeFueCreado) {
            console.log(
              `Mensaje duplicado ignorado: ${messageId}`
            );
            continue;
          }

          console.log(
            `Mensaje de WhatsApp guardado para la empresa ${empresaId}.`
          );

          await crearNotificacion({
  empresaId,
  tipo: "mensaje",
  titulo: "Nuevo mensaje de WhatsApp",
  descripcion: `${nombreContacto}: ${contenido}`,
  chatId: conversacionId,
  visitanteId: numeroCliente,
  url: `/empresas/${empresaId}/conversaciones/${conversacionId}`,
  metadata: {
    canal: "whatsapp",
    whatsappMessageId: messageId,
  },
});

          /*
           * Si una persona tomó el control del chat,
           * guardamos el mensaje pero la IA no responde.
           */
          const estadoConversacion =
            await conversacionReferencia.get();

          const datosConversacion =
            estadoConversacion.data();

          const humanoActivo =
            datosConversacion?.humanoActivo === true ||
            datosConversacion?.atendidoPor === "humano";

          if (humanoActivo) {
            console.log(
              `La conversación ${conversacionId} está siendo atendida por una persona.`
            );
            continue;
          }

          if (!accessToken) {
            console.error(
              `La empresa ${empresaId} no tiene Access Token de WhatsApp.`
            );
            continue;
          }

          try {
            await reservarRespuestaIA(
              empresaReferencia
            );
          } catch (errorLimiteIA) {
            if (
              errorLimiteIA instanceof
              LimiteRespuestasIAError
            ) {
              console.warn(
                `Límite mensual de IA alcanzado para ${empresaId}.`
              );
              continue;
            }

            throw errorLimiteIA;
          }

          /*
           * Cargamos el historial anterior.
           * Excluimos el mensaje actual porque /api/gemini
           * ya lo recibe por separado como "mensaje".
           */
          const historial =
            await obtenerHistorialConversacion(
              conversacionReferencia,
              messageId
            );

          let respuestaIA: string;

          try {
            respuestaIA =
              await generarRespuestaConIA({
                request,
                mensaje: contenido,
                historial,
                empresa,
                empresaId,
                conversacionId,
              });
          } catch (errorIA) {
            console.error(
              `No se pudo generar respuesta para ${conversacionId}:`,
              errorIA
            );
            continue;
          }

          const respuestaFinal =
            planEfectivo === "free" &&
            conversacionNueva
              ? `${respuestaIA}\n\nRespondido con NDI AI`
              : respuestaIA;

          /*
           * Volvemos a revisar el estado antes de enviar.
           * Una persona podría haber tomado el chat mientras
           * la IA estaba generando su respuesta.
           */
          const estadoAntesDeEnviar =
            await conversacionReferencia.get();

          const datosAntesDeEnviar =
            estadoAntesDeEnviar.data();

          const humanoTomoControl =
            datosAntesDeEnviar?.humanoActivo === true ||
            datosAntesDeEnviar?.atendidoPor === "humano";

          if (humanoTomoControl) {
            console.log(
              `La respuesta automática se canceló porque una persona tomó ${conversacionId}.`
            );
            continue;
          }

          const respuestaReferencia =
            conversacionReferencia
              .collection("messages")
              .doc(`ai_${messageId}`);

          /*
           * Guardamos primero la respuesta con un ID determinista,
           * para no duplicarla ante posibles reintentos.
           */
          const respuestaFueCreada =
            await adminDb.runTransaction(
              async (transaction) => {
                const respuestaExistente =
                  await transaction.get(
                    respuestaReferencia
                  );

                if (respuestaExistente.exists) {
                  return false;
                }

                transaction.set(
                  respuestaReferencia,
                  {
                    role: "assistant",
                    content: respuestaFinal,
                    enviadoPor: "ia",
                    canal: "whatsapp",
                    respuestaA: messageId,
                    estadoEnvio: "pendiente",
                    createdAt:
                      FieldValue.serverTimestamp(),
                  }
                );

                transaction.set(
                  conversacionReferencia,
                  {
                    ultimoMensaje: respuestaFinal,
                    ultimoRol: "assistant",
                    cantidadMensajes:
                      FieldValue.increment(1),
                    atendidoPor: "ia",
                    humanoActivo: false,
                    updatedAt:
                      FieldValue.serverTimestamp(),
                  },
                  {
                    merge: true,
                  }
                );

                return true;
              }
            );

          if (!respuestaFueCreada) {
            console.log(
              `La respuesta para ${messageId} ya existía.`
            );
            continue;
          }

          try {
            const whatsappMessageId =
              await enviarMensajeWhatsApp({
                phoneNumberId,
                numeroCliente,
                accessToken,
                texto: respuestaFinal,
              });

            await respuestaReferencia.set(
              {
                estadoEnvio: "enviado",
                whatsappMessageId,
                enviadoAt:
                  FieldValue.serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            console.log(
              `✅ La IA respondió por WhatsApp a ${numeroCliente}.`
            );
          } catch (errorEnvio) {
            console.error(
              `No se pudo enviar la respuesta por WhatsApp a ${numeroCliente}:`,
              errorEnvio
            );

            await respuestaReferencia.set(
              {
                estadoEnvio: "error",
                errorEnvio:
                  errorEnvio instanceof Error
                    ? errorEnvio.message
                    : "Error desconocido",
                updatedAt:
                  FieldValue.serverTimestamp(),
              },
              {
                merge: true,
              }
            );
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Error procesando el webhook de WhatsApp:",
      error
    );

    /*
     * Respondemos 200 para evitar que Meta repita
     * indefinidamente un evento que no procesamos.
     */
    return NextResponse.json({
      received: true,
      processed: false,
    });
  }
}

async function obtenerHistorialConversacion(
  conversacionReferencia: FirebaseFirestore.DocumentReference,
  mensajeActualId: string
): Promise<MensajeHistorial[]> {
  const mensajesSnapshot =
    await conversacionReferencia
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(21)
      .get();

  return mensajesSnapshot.docs
    .filter(
      (documento) =>
        documento.id !== mensajeActualId
    )
    .map((documento) => {
      const data = documento.data();

      return {
        role:
          data.role === "assistant"
            ? "assistant"
            : "user",
        content:
          typeof data.content === "string"
            ? data.content.trim()
            : "",
      } as MensajeHistorial;
    })
    .filter(
      (mensaje) =>
        mensaje.content.length > 0
    )
    .reverse()
    .slice(-20);
}

async function generarRespuestaConIA({
  request,
  mensaje,
  historial,
  empresa,
  empresaId,
  conversacionId,
}: {
  request: NextRequest;
  mensaje: string;
  historial: MensajeHistorial[];
  empresa: FirebaseFirestore.DocumentData;
  empresaId: string;
  conversacionId: string;
}) {
  const urlGemini = new URL(
    "/api/gemini",
    request.nextUrl.origin
  );

  const secretoInterno =
    process.env
      .INTERNAL_API_SECRET
      ?.trim();

  if (!secretoInterno) {
    throw new Error(
      "Falta configurar INTERNAL_API_SECRET."
    );
  }

  const respuesta = await fetch(urlGemini, {
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
      chatId: conversacionId,
    }),
    cache: "no-store",
  });

  const responseText = await respuesta.text();

  let data: GeminiResponse;

  try {
    data = JSON.parse(responseText) as GeminiResponse;
  } catch {
    throw new Error(
      `La API de IA devolvió una respuesta inválida. Estado ${respuesta.status}.`
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      data.error ||
        `La IA respondió con estado ${respuesta.status}.`
    );
  }

  const texto =
    typeof data.respuesta === "string"
      ? data.respuesta.trim()
      : "";

  if (!texto) {
    throw new Error(
      "La IA devolvió una respuesta vacía."
    );
  }

  return texto;
}

type MetaWhatsAppResponse = {
  messages?: Array<{
    id?: string;
  }>;
  error?: {
    message?: string;
    code?: number;
  };
};

function obtenerDestinosAlternativosArgentina(
  numeroCliente: string
) {
  /*
   * Meta normalmente entrega celulares argentinos como:
   * 549 + código de área + número local.
   *
   * Con el NÚMERO DE PRUEBA, la lista de destinatarios puede guardar
   * ese mismo celular con el formato histórico argentino:
   * 54 + código de área + 15 + número local.
   *
   * No modificamos el número original. Estas alternativas solamente
   * se usan si Meta responde específicamente con el error #131030.
   */
  if (!/^549\d{10}$/.test(numeroCliente)) {
    return [];
  }

  const numeroNacional = numeroCliente.slice(3);

  return [2, 3, 4]
    .map((longitudCodigoArea) => {
      const codigoArea = numeroNacional.slice(
        0,
        longitudCodigoArea
      );

      const numeroLocal = numeroNacional.slice(
        longitudCodigoArea
      );

      return `54${codigoArea}15${numeroLocal}`;
    })
    .filter(
      (destino, indice, lista) =>
        destino !== numeroCliente &&
        lista.indexOf(destino) === indice
    );
}

async function enviarMensajeWhatsApp({
  phoneNumberId,
  numeroCliente,
  accessToken,
  texto,
}: {
  phoneNumberId: string;
  numeroCliente: string;
  accessToken: string;
  texto: string;
}) {
  const version =
    process.env.WHATSAPP_API_VERSION || "v26.0";

  const endpoint =
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  const destinosAIntentar = [
    numeroCliente,
    ...obtenerDestinosAlternativosArgentina(
      numeroCliente
    ),
  ];

  let ultimoError =
    "No se pudo enviar el mensaje por WhatsApp.";

  for (
    let indice = 0;
    indice < destinosAIntentar.length;
    indice += 1
  ) {
    const destino = destinosAIntentar[indice];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: destino,
        type: "text",
        text: {
          preview_url: false,
          body: texto.slice(0, 4096),
        },
      }),
    });

    const responseText =
      await response.text();

    let data: MetaWhatsAppResponse;

    try {
      data = JSON.parse(
        responseText
      ) as MetaWhatsAppResponse;
    } catch {
      throw new Error(
        `Meta devolvió una respuesta inválida. Estado ${response.status}.`
      );
    }

    if (response.ok) {
      const whatsappMessageId =
        data.messages?.[0]?.id;

      if (!whatsappMessageId) {
        throw new Error(
          "Meta no devolvió el ID del mensaje enviado."
        );
      }

      if (destino !== numeroCliente) {
        console.log(
          `✅ WhatsApp respondió usando el formato argentino alternativo ${destino}.`
        );
      }

      return whatsappMessageId;
    }

    ultimoError =
      data.error?.message ||
      `Meta respondió con estado ${response.status}.`;

    const esErrorListaPermitida =
      data.error?.code === 131030;

    const quedanAlternativas =
      indice <
      destinosAIntentar.length - 1;

    if (
      !esErrorListaPermitida ||
      !quedanAlternativas
    ) {
      throw new Error(ultimoError);
    }

    console.warn(
      `Meta rechazó el destinatario ${destino} con #131030. Probando otra representación del número argentino.`
    );
  }

  throw new Error(ultimoError);
}

function obtenerContenidoMensaje(
  mensaje: WhatsAppMessage
): string {
  if (mensaje.type === "text") {
    return mensaje.text?.body?.trim() ?? "";
  }

  if (mensaje.type === "button") {
    return mensaje.button?.text?.trim() ?? "";
  }

  if (mensaje.type === "interactive") {
    return (
      mensaje.interactive?.button_reply?.title?.trim() ||
      mensaje.interactive?.list_reply?.title?.trim() ||
      ""
    );
  }

  return "";
}