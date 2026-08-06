import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type WhatsAppConfig = {
  empresaId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  verifyToken?: string;
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
        .doc("whatsapp")
        .get();

    if (!documento.exists) {
      return NextResponse.json({
        config: null,
      });
    }

    const data =
      documento.data();

    return NextResponse.json({
      config: {
        phoneNumberId:
          data?.phoneNumberId ?? "",
        businessAccountId:
          data?.businessAccountId ??
          "",
        verifyToken:
          data?.verifyToken ?? "",
        estado:
          data?.estado ??
          "configurado",
        displayPhoneNumber:
          data?.displayPhoneNumber ??
          "",
        verifiedName:
          data?.verifiedName ?? "",
      },
    });
  } catch (error) {
    console.error(
      "Error cargando WhatsApp:",
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
      (await request.json()) as WhatsAppConfig;

    const empresaId =
      body.empresaId?.trim();

    const phoneNumberId =
      body.phoneNumberId?.trim();

    const businessAccountId =
      body.businessAccountId?.trim();

    const accessToken =
      body.accessToken?.trim();

    const verifyToken =
      body.verifyToken?.trim();

    if (
      !empresaId ||
      !phoneNumberId ||
      !businessAccountId ||
      !accessToken ||
      !verifyToken
    ) {
      return NextResponse.json(
        {
          error:
            "Completá todos los campos.",
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

    await adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("integrations")
      .doc("whatsapp")
      .set(
        {
          phoneNumberId,
          businessAccountId,
          accessToken,
          verifyToken,
          estado: "configurado",
          updatedAt: new Date(),
          updatedBy: usuario.uid,
        },
        {
          merge: true,
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Configuración de WhatsApp guardada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error guardando WhatsApp:",
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