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

async function verificarAcceso({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}): Promise<{
  permitido: boolean;
  rol: RolEmpresa;
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
    };
  }

  const empresa =
    empresaSnap.data();

  if (empresa?.userId === uid) {
    return {
      permitido: true,
      rol: "propietario",
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
    };
  }

  return {
    permitido: false,
    rol: null,
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

  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(
      phoneNumberId
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
        messaging_product:
          "whatsapp",
        recipient_type:
          "individual",
        to: numeroCliente,
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

  let data: {
    messages?: Array<{
      id?: string;
    }>;
    error?: {
      message?: string;
      code?: number;
    };
  } = {};

  try {
    data = JSON.parse(
      responseText
    );
  } catch {
    throw new Error(
      `Meta devolvió una respuesta inválida (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        `Meta rechazó el mensaje (${response.status}).`
    );
  }

  const whatsappMessageId =
    data.messages?.[0]?.id?.trim();

  if (!whatsappMessageId) {
    throw new Error(
      "Meta no devolvió el ID del mensaje."
    );
  }

  return whatsappMessageId;
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
          token
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

    const body =
      (await request.json()) as Body;

    const empresaId =
      body.empresaId?.trim() || "";

    const chatId =
      body.chatId?.trim() || "";

    const texto =
      body.texto?.trim() || "";

    if (
      !empresaId ||
      !chatId ||
      !texto
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan datos para enviar el mensaje.",
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

    if (!acceso.permitido) {
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