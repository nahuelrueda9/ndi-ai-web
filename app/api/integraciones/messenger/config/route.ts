import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type MessengerConfig = {
  empresaId?: string;
  pageId?: string;
  accessToken?: string;
};

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador"
  | null;

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

async function obtenerUsuario(
  request: NextRequest
) {
  const idToken =
    obtenerBearerToken(request);

  if (!idToken) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(
      idToken
    );
  } catch {
    return null;
  }
}

async function obtenerRolEmpresa({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}): Promise<{
  existe: boolean;
  rol: RolEmpresa;
}> {
  const empresaReferencia =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnapshot =
    await empresaReferencia.get();

  if (!empresaSnapshot.exists) {
    return {
      existe: false,
      rol: null,
    };
  }

  const empresa =
    empresaSnapshot.data();

  if (empresa?.userId === uid) {
    return {
      existe: true,
      rol: "propietario",
    };
  }

  const miembroSnapshot =
    await empresaReferencia
      .collection("members")
      .doc(uid)
      .get();

  if (!miembroSnapshot.exists) {
    return {
      existe: true,
      rol: null,
    };
  }

  const miembro =
    miembroSnapshot.data();

  if (
    miembro?.estado !== "activo"
  ) {
    return {
      existe: true,
      rol: null,
    };
  }

  const rol = miembro?.rol;

  if (
    rol === "administrador" ||
    rol === "supervisor" ||
    rol === "operador"
  ) {
    return {
      existe: true,
      rol,
    };
  }

  return {
    existe: true,
    rol: null,
  };
}

function puedeVerIntegracion(
  rol: RolEmpresa
) {
  return (
    rol === "propietario" ||
    rol === "administrador" ||
    rol === "supervisor"
  );
}

function puedeEditarIntegracion(
  rol: RolEmpresa
) {
  return (
    rol === "propietario" ||
    rol === "administrador"
  );
}

function obtenerVerifyToken() {
  return (
    process.env
      .MESSENGER_VERIFY_TOKEN
      ?.trim() || ""
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const usuario =
      await obtenerUsuario(request);

    if (!usuario) {
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

    const empresaId =
      request.nextUrl.searchParams
        .get("empresaId")
        ?.trim();

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "empresaId requerido.",
        },
        {
          status: 400,
        }
      );
    }

    const acceso =
      await obtenerRolEmpresa({
        empresaId,
        uid: usuario.uid,
      });

    if (!acceso.existe) {
      return NextResponse.json(
        {
          error:
            "La empresa no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !puedeVerIntegracion(
        acceso.rol
      )
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permisos para ver esta integración.",
        },
        {
          status: 403,
        }
      );
    }

    const documento =
      await adminDb
        .collection("companies")
        .doc(empresaId)
        .collection("integrations")
        .doc("messenger")
        .get();

    const verifyToken =
      obtenerVerifyToken();

    if (!documento.exists) {
      return NextResponse.json({
        config: null,
        verifyToken,
      });
    }

    const data =
      documento.data();

    return NextResponse.json({
      config: {
        pageId:
          data?.pageId ?? "",
        pageName:
          data?.pageName ?? "",
        estado:
          data?.estado ??
          "configurado",
      },
      verifyToken,
    });
  } catch (error) {
    console.error(
      "Error cargando Messenger:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar la configuración.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const usuario =
      await obtenerUsuario(request);

    if (!usuario) {
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

    const body =
      (await request.json()) as MessengerConfig;

    const empresaId =
      body.empresaId?.trim();

    const pageId =
      body.pageId?.trim();

    const accessTokenNuevo =
      body.accessToken?.trim() || "";

    if (
      !empresaId ||
      !pageId
    ) {
      return NextResponse.json(
        {
          error:
            "Completá el Facebook Page ID.",
        },
        {
          status: 400,
        }
      );
    }

    const verifyToken =
      obtenerVerifyToken();

    if (!verifyToken) {
      return NextResponse.json(
        {
          error:
            "Falta configurar MESSENGER_VERIFY_TOKEN en el servidor.",
        },
        {
          status: 500,
        }
      );
    }

    const acceso =
      await obtenerRolEmpresa({
        empresaId,
        uid: usuario.uid,
      });

    if (!acceso.existe) {
      return NextResponse.json(
        {
          error:
            "La empresa no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !puedeEditarIntegracion(
        acceso.rol
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Solo el Propietario o un Administrador pueden modificar esta integración.",
        },
        {
          status: 403,
        }
      );
    }

    const integracionReferencia =
      adminDb
        .collection("companies")
        .doc(empresaId)
        .collection("integrations")
        .doc("messenger");

    const integracionActual =
      await integracionReferencia.get();

    const tokenGuardado =
      typeof integracionActual.data()
        ?.accessToken === "string"
        ? integracionActual
            .data()
            ?.accessToken.trim()
        : "";

    const accessToken =
      accessTokenNuevo ||
      tokenGuardado;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Ingresá el Page Access Token para conectar Messenger por primera vez.",
        },
        {
          status: 400,
        }
      );
    }

    const actualizacion: Record<
      string,
      unknown
    > = {
      pageId,
      verifyToken,
      estado:
        integracionActual.exists
          ? integracionActual.data()
              ?.estado ||
            "configurado"
          : "configurado",
      updatedAt: new Date(),
      updatedBy: usuario.uid,
    };

    if (accessTokenNuevo) {
      actualizacion.accessToken =
        accessTokenNuevo;
    } else if (
      !integracionActual.exists
    ) {
      actualizacion.accessToken =
        accessToken;
    }

    await integracionReferencia.set(
      actualizacion,
      {
        merge: true,
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Configuración de Messenger guardada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error guardando Messenger:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar la configuración.",
      },
      {
        status: 500,
      }
    );
  }
}