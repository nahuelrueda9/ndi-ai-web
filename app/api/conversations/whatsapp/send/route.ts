import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type Body = {
  empresaId?: string;
  chatId?: string;
  texto?: string;
};

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador"
  | null;

type Empresa = {
  userId?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
};

function bearer(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

function esIdFirestoreValido(
  valor: string
) {
  return (
    valor.length > 0 &&
    valor.length <= 200 &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

async function verificarAcceso({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}): Promise<{
  permitido: boolean;
  rol: RolEmpresa;
  empresa: Empresa | null;
}> {
  const empresaRef =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnap =
    await empresaRef.get();

  if (!empresaSnap.exists) {
    return {
      permitido: false,
      rol: null,
      empresa: null,
    };
  }

  const empresa =
    empresaSnap.data() as Empresa;

  if (empresa.userId === uid) {
    return {
      permitido: true,
      rol: "propietario",
      empresa,
    };
  }

  const miembroSnap =
    await empresaRef
      .collection("members")
      .doc(uid)
      .get();

  if (!miembroSnap.exists) {
    return {
      permitido: false,
      rol: null,
      empresa: null,
    };
  }

  const miembro =
    miembroSnap.data();

  const rol = miembro?.rol;

  if (
    miembro?.estado === "activo" &&
    (
      rol === "administrador" ||
      rol === "supervisor" ||
      rol === "operador"
    )
  ) {
    return {
      permitido: true,
      rol,
      empresa,
    };
  }

  return {
    permitido: false,
    rol: null,
    empresa: null,
  };
}

function numeroWhatsApp(
  valor: unknown
) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor
    .replace(/^whatsapp_/i, "")
    .replace(/\D/g, "")
    .slice(0, 20);
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
   * En el entorno de prueba, la lista de destinatarios puede guardar
   * el mismo número con el formato histórico:
   * 54 + código de área + 15 + número local.
   *
   * No reemplazamos el número original: solamente probamos estas
   * variantes si Meta devuelve específicamente el error #131030.
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

async function enviarAMeta({
  phoneNumberId,
  accessToken,
  numeroCliente,
  texto,
}: {
  phoneNumberId: string;
  accessToken: string;
  numeroCliente: string;
  texto: string;
}) {
  const version =
    process.env
      .WHATSAPP_API_VERSION
      ?.trim() || "v26.0";

  const endpoint =
    `https://graph.facebook.com/${version}/${encodeURIComponent(
      phoneNumberId
    )}/messages`;

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

    const response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          messaging_product:
            "whatsapp",
          recipient_type:
            "individual",
          to: destino,
          type: "text",
          text: {
            preview_url: false,
            body: texto.slice(
              0,
              4096
            ),
          },
        }),
        cache: "no-store",
      }
    );

    const responseText =
      await response.text();

    let data: MetaWhatsAppResponse = {};

    try {
      data = JSON.parse(
        responseText
      ) as MetaWhatsAppResponse;
    } catch {
      throw new Error(
        `Meta devolvió una respuesta inválida (${response.status}).`
      );
    }

    if (response.ok) {
      const whatsappMessageId =
        data.messages?.[0]?.id?.trim();

      if (!whatsappMessageId) {
        throw new Error(
          "Meta no devolvió el ID del mensaje."
        );
      }

      if (destino !== numeroCliente) {
        console.log(
          `✅ Respuesta humana enviada usando formato argentino alternativo ${destino}.`
        );
      }

      return whatsappMessageId;
    }

    ultimoError =
      data.error?.message ||
      `Meta rechazó el mensaje (${response.status}).`;

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
      `Meta rechazó ${destino} con #131030. Probando otra representación argentina.`
    );
  }

  throw new Error(ultimoError);
}

export async function POST(
  request: NextRequest
) {
  try {
    const token = bearer(request);

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Tenés que iniciar sesión.",
        },
        {
          status: 401,
        }
      );
    }

    let usuario;

    try {
      usuario =
        await adminAuth.verifyIdToken(
          token,
          true
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o venció.",
        },
        {
          status: 401,
        }
      );
    }

    let body: Body;

    try {
      body =
        (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaId =
      body.empresaId?.trim() || "";

    const chatId =
      body.chatId?.trim() || "";

    const texto =
      body.texto?.trim() || "";

    if (
      !esIdFirestoreValido(
        empresaId
      ) ||
      !esIdFirestoreValido(
        chatId
      ) ||
      !texto
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan datos o los identificadores son inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    if (texto.length > 4096) {
      return NextResponse.json(
        {
          error:
            "El mensaje es demasiado largo.",
        },
        {
          status: 400,
        }
      );
    }

    const acceso =
      await verificarAcceso({
        empresaId,
        uid: usuario.uid,
      });

    if (
      !acceso.permitido ||
      !acceso.empresa
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permisos para responder esta conversación.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !empresaTieneFuncion(
        acceso.empresa,
        "atencion_humana"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La atención humana por WhatsApp requiere Business IA con una suscripción activa.",
          upgradeRequired: true,
        },
        {
          status: 403,
        }
      );
    }

    const empresaRef =
      adminDb
        .collection("companies")
        .doc(empresaId);

    const conversacionRef =
      empresaRef
        .collection(
          "conversations"
        )
        .doc(chatId);

    const [
      conversacionSnap,
      integracionSnap,
    ] = await Promise.all([
      conversacionRef.get(),
      empresaRef
        .collection(
          "integrations"
        )
        .doc("whatsapp")
        .get(),
    ]);

    if (
      !conversacionSnap.exists
    ) {
      return NextResponse.json(
        {
          error:
            "La conversación no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const conversacion =
      conversacionSnap.data() ?? {};

    const canal =
      String(
        conversacion.canal ??
          conversacion.channel ??
          ""
      )
        .trim()
        .toLowerCase();

    if (
      canal !== "whatsapp" &&
      canal !== "wa"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta conversación no es de WhatsApp.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      conversacion.estado ===
      "cerrada"
    ) {
      return NextResponse.json(
        {
          error:
            "La conversación está cerrada.",
        },
        {
          status: 409,
        }
      );
    }

    const humanoActivo =
      conversacion.humanoActivo ===
        true ||
      conversacion.atendidoPor ===
        "humano";

    if (!humanoActivo) {
      return NextResponse.json(
        {
          error:
            "Primero tenés que tomar la conversación.",
        },
        {
          status: 409,
        }
      );
    }

    if (!integracionSnap.exists) {
      return NextResponse.json(
        {
          error:
            "WhatsApp no está configurado para esta empresa.",
        },
        {
          status: 409,
        }
      );
    }

    const integracion =
      integracionSnap.data() ?? {};

    const phoneNumberId =
      typeof integracion
        .phoneNumberId ===
      "string"
        ? integracion.phoneNumberId.trim()
        : "";

    const accessToken =
      typeof integracion
        .accessToken ===
      "string"
        ? integracion.accessToken.trim()
        : "";

    if (
      !phoneNumberId ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "La conexión de WhatsApp está incompleta. Revisá Integraciones.",
        },
        {
          status: 409,
        }
      );
    }

    const numeroCliente =
      numeroWhatsApp(
        conversacion.telefono
      ) ||
      numeroWhatsApp(
        conversacion.visitanteId
      );

    if (!numeroCliente) {
      return NextResponse.json(
        {
          error:
            "No se encontró el número del cliente.",
        },
        {
          status: 400,
        }
      );
    }

    let whatsappMessageId:
      string;

    try {
      whatsappMessageId =
        await enviarAMeta({
          phoneNumberId,
          accessToken,
          numeroCliente,
          texto,
        });
    } catch (metaError) {
      console.error(
        "Error enviando respuesta humana por WhatsApp:",
        metaError instanceof Error
          ? metaError.message
          : "Error de Meta"
      );

      return NextResponse.json(
        {
          error:
            metaError instanceof Error
              ? metaError.message
              : "No se pudo enviar el mensaje por WhatsApp.",
        },
        {
          status: 502,
        }
      );
    }

    const mensajeRef =
      conversacionRef
        .collection("messages")
        .doc();

    const batch =
      adminDb.batch();

    batch.set(
      mensajeRef,
      {
        role: "assistant",
        content: texto,
        enviadoPor: "humano",
        canal: "whatsapp",
        estadoEnvio: "enviado",
        whatsappMessageId,
        createdAt:
          FieldValue.serverTimestamp(),
      }
    );

    batch.set(
      conversacionRef,
      {
        ultimoMensaje: texto,
        ultimoRol: "assistant",
        cantidadMensajes:
          FieldValue.increment(1),
        atendidoPor: "humano",
        humanoActivo: true,
        estado: "abierta",
        canal: "whatsapp",
        updatedAt:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    await batch.commit();

    return NextResponse.json({
      ok: true,
      message:
        "Mensaje enviado por WhatsApp.",
      whatsappMessageId,
    });
  } catch (error) {
    console.error(
      "Error en respuesta humana de WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo enviar el mensaje.",
      },
      {
        status: 500,
      }
    );
  }
}