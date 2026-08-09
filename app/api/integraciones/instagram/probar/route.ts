import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type ProbarInstagramBody = {
  empresaId?: string;
  instagramAccountId?: string;
  accessToken?: string;
};

type IntegracionInstagram = {
  instagramAccountId?: string;
  accessToken?: string;
};

type RespuestaMeta = {
  user_id?: string;
  username?: string;
  id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

const META_API_VERSION =
  process.env
    .INSTAGRAM_API_VERSION
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
      error: "La empresa no existe.",
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
    miembro?.estado === "activo" &&
    (
      miembro?.rol ===
        "administrador" ||
      miembro?.rol ===
        "supervisor"
    );

  return {
    permitido,
    status: permitido ? 200 : 403,
    error: permitido
      ? ""
      : "No tenés permisos para probar esta integración.",
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    const idToken =
      obtenerBearerToken(request);

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
        await adminAuth.verifyIdToken(
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
      (await request.json()) as ProbarInstagramBody;

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
      await verificarAccesoEmpresa({
        empresaId,
        uid: usuario.uid,
      });

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
        .collection("integrations")
        .doc("instagram");

    const integracionSnapshot =
      await integracionReferencia.get();

    const configuracionGuardada =
      (
        integracionSnapshot.data() ||
        {}
      ) as IntegracionInstagram;

    const instagramAccountId =
      body.instagramAccountId?.trim() ||
      configuracionGuardada
        .instagramAccountId
        ?.trim();

    const accessToken =
      body.accessToken?.trim() ||
      configuracionGuardada
        .accessToken
        ?.trim();

    if (
      !instagramAccountId ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "Completá Instagram Account ID y Access Token.",
        },
        {
          status: 400,
        }
      );
    }

    const url = new URL(
      `https://graph.instagram.com/${META_API_VERSION}/me`
    );

    url.searchParams.set(
      "fields",
      "user_id,username"
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

    const data =
      (await respuesta.json()) as RespuestaMeta;

    if (
      !respuesta.ok ||
      data.error
    ) {
      const mensaje =
        data.error?.message ||
        "Meta rechazó la conexión con Instagram.";

      await integracionReferencia.set(
        {
          estado: "configurado",
          lastConnectionError:
            mensaje,
          updatedAt: new Date(),
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

    const accountIdMeta =
      data.user_id?.trim() ||
      data.id?.trim() ||
      "";

    if (!accountIdMeta) {
      return NextResponse.json(
        {
          error:
            "Meta no devolvió el Instagram Account ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      accountIdMeta !==
      instagramAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "El Instagram Account ID no coincide con la cuenta autorizada por el token.",
        },
        {
          status: 400,
        }
      );
    }

    await integracionReferencia.set(
      {
        instagramAccountId:
          accountIdMeta,
        username:
          data.username || "",
        estado:
          "conectado",
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
        "Conexión con Instagram verificada correctamente.",
      instagramAccountId:
        accountIdMeta,
      username:
        data.username || "",
    });
  } catch (error) {
    console.error(
      "Error probando Instagram:",
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