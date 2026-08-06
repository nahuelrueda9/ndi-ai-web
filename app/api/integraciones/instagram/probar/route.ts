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
  pageId?: string;
  accessToken?: string;
};

type IntegracionInstagram = {
  instagramAccountId?: string;
  pageId?: string;
  accessToken?: string;
};

type RespuestaMeta = {
  id?: string;
  name?: string;
  username?: string;
  instagram_business_account?: {
    id?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

const META_API_VERSION =
  process.env.META_GRAPH_API_VERSION?.trim() ||
  "v25.0";

function obtenerBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
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
  const empresaReferencia = adminDb
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

  const empresa = empresaSnapshot.data();

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

  const miembro = miembroSnapshot.data();

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

async function consultarMeta(
  url: URL
): Promise<RespuestaMeta> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data =
    (await response.json()) as RespuestaMeta;

  if (
    !response.ok ||
    data.error
  ) {
    const mensaje =
      data.error?.message ||
      "Meta rechazó la solicitud.";

    throw new Error(mensaje);
  }

  return data;
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

    let decodedToken;

    try {
      decodedToken =
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
        uid: decodedToken.uid,
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

    const pageId =
      body.pageId?.trim() ||
      configuracionGuardada.pageId?.trim();

    const accessToken =
      body.accessToken?.trim() ||
      configuracionGuardada
        .accessToken
        ?.trim();

    if (
      !instagramAccountId ||
      !pageId ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan Instagram Account ID, Facebook Page ID o Access Token.",
        },
        {
          status: 400,
        }
      );
    }

    const paginaUrl = new URL(
      `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(
        pageId
      )}`
    );

    paginaUrl.searchParams.set(
      "fields",
      "id,name,instagram_business_account"
    );

    paginaUrl.searchParams.set(
      "access_token",
      accessToken
    );

    const pagina =
      await consultarMeta(paginaUrl);

    const cuentaVinculadaId =
      pagina.instagram_business_account
        ?.id;

    if (!cuentaVinculadaId) {
      return NextResponse.json(
        {
          error:
            "La página de Facebook no tiene una cuenta profesional de Instagram vinculada.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      cuentaVinculadaId !==
      instagramAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "El Instagram Account ID no coincide con la cuenta vinculada a esta página.",
        },
        {
          status: 400,
        }
      );
    }

    const instagramUrl = new URL(
      `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(
        instagramAccountId
      )}`
    );

    instagramUrl.searchParams.set(
      "fields",
      "id,username,name"
    );

    instagramUrl.searchParams.set(
      "access_token",
      accessToken
    );

    const instagram =
      await consultarMeta(instagramUrl);

    if (
      instagram.id !==
      instagramAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "Meta devolvió una cuenta de Instagram diferente.",
        },
        {
          status: 400,
        }
      );
    }

    await integracionReferencia.set(
      {
        instagramAccountId,
        pageId,
        estado: "conectado",
        pageName:
          pagina.name || "",
        instagramUsername:
          instagram.username || "",
        connectedAt:
          new Date(),
        updatedAt:
          new Date(),
        lastConnectionError: null,
      },
      {
        merge: true,
      }
    );

    const nombreVisible =
      instagram.username
        ? `@${instagram.username}`
        : instagramAccountId;

    return NextResponse.json({
      success: true,
      message:
        `Conexión verificada correctamente con ${nombreVisible}.`,
      account: {
        id: instagramAccountId,
        username:
          instagram.username || "",
        pageId,
        pageName:
          pagina.name || "",
      },
    });
  } catch (error) {
    console.error(
      "Error probando Instagram:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo probar la conexión.";

    return NextResponse.json(
      {
        error: mensaje,
      },
      {
        status: 400,
      }
    );
  }
}