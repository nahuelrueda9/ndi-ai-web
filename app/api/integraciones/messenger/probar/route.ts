import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type ProbarMessengerBody = {
  empresaId?: string;
  pageId?: string;
  accessToken?: string;
};

type IntegracionMessenger = {
  pageId?: string;
  accessToken?: string;
};

type RespuestaMeta = {
  data?: Array<{
    id?: string;
    name?: string;
    subscribed_fields?: string[];
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

const META_API_VERSION =
  process.env
    .MESSENGER_API_VERSION
    ?.trim() ||
  "v26.0";

function obtenerBearerToken(
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
    .slice("Bearer ".length)
    .trim();
}

async function verificarAccesoEmpresa({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}) {
  const empresaReferencia =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnapshot =
    await empresaReferencia.get();

  if (!empresaSnapshot.exists) {
    return {
      permitido: false,
      status: 404,
      error:
        "La empresa no existe.",
    };
  }

  const empresa =
    empresaSnapshot.data();

  if (empresa?.userId === uid) {
    return {
      permitido: true,
      status: 200,
      error: "",
    };
  }

  const miembroSnapshot =
    await empresaReferencia
      .collection("members")
      .doc(uid)
      .get();

  const miembro =
    miembroSnapshot.data();

  const permitido =
    miembroSnapshot.exists &&
    miembro?.estado ===
      "activo" &&
    (
      miembro?.rol ===
        "administrador" ||
      miembro?.rol ===
        "supervisor"
    );

  return {
    permitido,
    status:
      permitido ? 200 : 403,
    error:
      permitido
        ? ""
        : "No tenés permisos para probar esta integración.",
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    const idToken =
      obtenerBearerToken(
        request
      );

    if (!idToken) {
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
            idToken
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
      (await request.json()) as
        ProbarMessengerBody;

    const empresaId =
      body.empresaId?.trim();

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "No se encontró la empresa.",
        },
        {
          status: 400,
        }
      );
    }

    const acceso =
      await verificarAccesoEmpresa(
        {
          empresaId,
          uid: usuario.uid,
        }
      );

    if (!acceso.permitido) {
      return NextResponse.json(
        {
          error: acceso.error,
        },
        {
          status: acceso.status,
        }
      );
    }

    const integracionReferencia =
      adminDb
        .collection("companies")
        .doc(empresaId)
        .collection(
          "integrations"
        )
        .doc("messenger");

    const integracionSnapshot =
      await integracionReferencia
        .get();

    const configuracionGuardada =
      (
        integracionSnapshot.data() ||
        {}
      ) as IntegracionMessenger;

    const pageId =
      body.pageId?.trim() ||
      configuracionGuardada
        .pageId
        ?.trim();

    const accessToken =
      body.accessToken?.trim() ||
      configuracionGuardada
        .accessToken
        ?.trim();

    if (
      !pageId ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "Completá Facebook Page ID y Page Access Token.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Para comprobar Messenger no necesitamos leer
     * los datos públicos de la Página.
     *
     * Consultamos subscribed_apps porque este endpoint
     * usa pages_manage_metadata, permiso necesario para
     * los webhooks de la Página.
     */
    const url =
      new URL(
        `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(
          pageId
        )}/subscribed_apps`
      );

    url.searchParams.set(
      "access_token",
      accessToken
    );

    const respuesta =
      await fetch(url, {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
        cache: "no-store",
      });

    const responseText =
      await respuesta.text();

    let data:
      RespuestaMeta;

    try {
      data =
        JSON.parse(
          responseText
        ) as RespuestaMeta;
    } catch {
      throw new Error(
        `Meta devolvió una respuesta inválida. Estado ${respuesta.status}.`
      );
    }

    if (
      !respuesta.ok ||
      data.error
    ) {
      const mensaje =
        data.error?.message ||
        "Meta rechazó la conexión con Messenger.";

      await integracionReferencia
        .set(
          {
            estado:
              "configurado",
            lastConnectionError:
              mensaje,
            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );

      return NextResponse.json(
        {
          error: mensaje,
        },
        {
          status:
            respuesta.status >= 400
              ? respuesta.status
              : 400,
        }
      );
    }

    const suscripciones =
      Array.isArray(data.data)
        ? data.data
        : [];

    const camposSuscritos =
      suscripciones
        .flatMap(
          (item) =>
            Array.isArray(
              item.subscribed_fields
            )
              ? item.subscribed_fields
              : []
        );

    const messagesSuscrito =
      camposSuscritos.includes(
        "messages"
      );

    await integracionReferencia
      .set(
        {
          pageId,
          estado:
            "conectado",
          messengerWebhookSubscribed:
            suscripciones.length > 0,
          messagesSubscribed:
            messagesSuscrito,
          connectedAt:
            new Date(),
          updatedAt:
            new Date(),
          lastConnectionError:
            null,
        },
        {
          merge: true,
        }
      );

    return NextResponse.json({
      conectado: true,
      message:
        messagesSuscrito
          ? "Conexión con Facebook Messenger verificada correctamente."
          : suscripciones.length > 0
            ? "La Página está conectada, pero Meta no informó el campo messages en la suscripción."
            : "El Page Access Token es válido para la Página. Revisá que la Página esté suscrita al webhook de Messenger.",
      pageId,
      pageName: "",
      webhookSubscribed:
        suscripciones.length > 0,
      messagesSubscribed:
        messagesSuscrito,
    });
  } catch (error) {
    console.error(
      "Error probando Messenger:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo probar la conexión.",
      },
      {
        status: 500,
      }
    );
  }
}