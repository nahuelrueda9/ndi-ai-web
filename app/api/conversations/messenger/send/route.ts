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

type RespuestaMessenger = {
  recipient_id?: string;
  message_id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
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

async function enviarAMessenger({
  pageId,
  messengerSenderId,
  accessToken,
  texto,
}: {
  pageId: string;
  messengerSenderId: string;
  accessToken: string;
  texto: string;
}) {
  const version =
    process.env
      .MESSENGER_API_VERSION
      ?.trim() ||
    "v26.0";

  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(
      pageId
    )}/messages`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        messaging_type:
          "RESPONSE",
        recipient: {
          id: messengerSenderId,
        },
        message: {
          text: texto.slice(
            0,
            2000
          ),
        },
      }),
      cache: "no-store",
    }
  );

  const responseText =
    await response.text();

  let data:
    RespuestaMessenger;

  try {
    data = JSON.parse(
      responseText
    ) as RespuestaMessenger;
  } catch {
    throw new Error(
      `Messenger devolvió una respuesta inválida (${response.status}).`
    );
  }

  if (
    !response.ok ||
    data.error
  ) {
    throw new Error(
      data.error?.message ||
        `Messenger rechazó el mensaje (${response.status}).`
    );
  }

  const messageId =
    data.message_id?.trim();

  if (!messageId) {
    throw new Error(
      "Messenger no devolvió el ID del mensaje."
    );
  }

  return messageId;
}

export async function POST(
  request: NextRequest
) {
  try {
    const token =
      bearer(request);

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
        await adminAuth
          .verifyIdToken(
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
        (await request.json()) as
          Body;
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
      body.empresaId?.trim() ||
      "";

    const chatId =
      body.chatId?.trim() ||
      "";

    const texto =
      body.texto?.trim() ||
      "";

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

    if (texto.length > 2000) {
      return NextResponse.json(
        {
          error:
            "El mensaje de Messenger es demasiado largo.",
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
            "La atención humana por Messenger requiere Business IA con una suscripción activa.",
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
        .doc("messenger")
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
      conversacionSnap.data() ??
      {};

    const canal =
      String(
        conversacion.canal ??
          conversacion.channel ??
          ""
      )
        .trim()
        .toLowerCase();

    if (
      canal !== "messenger" &&
      canal !== "facebook" &&
      canal !==
        "facebook_messenger"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta conversación no es de Messenger.",
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
      conversacion
        .humanoActivo === true ||
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

    if (
      !integracionSnap.exists
    ) {
      return NextResponse.json(
        {
          error:
            "Messenger no está configurado para esta empresa.",
        },
        {
          status: 409,
        }
      );
    }

    const integracion =
      integracionSnap.data() ??
      {};

    const pageId =
      typeof integracion.pageId ===
      "string"
        ? integracion.pageId.trim()
        : "";

    const accessToken =
      typeof integracion
        .accessToken === "string"
        ? integracion
            .accessToken
            .trim()
        : "";

    const messengerSenderId =
      typeof conversacion
        .messengerScopedUserId ===
      "string"
        ? conversacion
            .messengerScopedUserId
            .trim()
        : typeof conversacion
            .visitanteId ===
          "string"
          ? conversacion
              .visitanteId
              .replace(
                /^messenger_/i,
                ""
              )
              .trim()
          : "";

    if (
      !pageId ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "La conexión de Messenger está incompleta. Revisá Integraciones.",
        },
        {
          status: 409,
        }
      );
    }

    if (!messengerSenderId) {
      return NextResponse.json(
        {
          error:
            "No se encontró el destinatario de Messenger.",
        },
        {
          status: 400,
        }
      );
    }

    let messengerMessageId:
      string;

    try {
      messengerMessageId =
        await enviarAMessenger({
          pageId,
          messengerSenderId,
          accessToken,
          texto,
        });
    } catch (metaError) {
      console.error(
        "Error enviando respuesta humana por Messenger:",
        metaError instanceof
          Error
          ? metaError.message
          : "Error de Meta"
      );

      return NextResponse.json(
        {
          error:
            metaError instanceof
            Error
              ? metaError.message
              : "No se pudo enviar el mensaje por Messenger.",
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
        enviadoPor:
          "humano",
        canal:
          "messenger",
        estadoEnvio:
          "enviado",
        messengerMessageId,
        createdAt:
          FieldValue
            .serverTimestamp(),
      }
    );

    batch.set(
      conversacionRef,
      {
        ultimoMensaje:
          texto,
        ultimoRol:
          "assistant",
        cantidadMensajes:
          FieldValue
            .increment(1),
        atendidoPor:
          "humano",
        humanoActivo:
          true,
        estado:
          "abierta",
        canal:
          "messenger",
        updatedAt:
          FieldValue
            .serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    await batch.commit();

    return NextResponse.json({
      ok: true,
      message:
        "Mensaje enviado por Messenger.",
      messengerMessageId,
    });
  } catch (error) {
    console.error(
      "Error en respuesta humana de Messenger:",
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