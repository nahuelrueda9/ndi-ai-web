import { getUploadAuthParams } from "@imagekit/next/server";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

import {
  empresaTieneSuscripcionActiva,
  type PlanId,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type Empresa = {
  userId?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
};

type RolConSubida =
  | "propietario"
  | "administrador"
  | "supervisor";

function obtenerBearerToken(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

function esIdFirestoreValido(
  valor: string,
) {
  return (
    valor.length > 0 &&
    valor.length <= 200 &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

async function verificarAccesoSubida({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}): Promise<{
  permitido: boolean;
  status: number;
  error: string;
  empresa: Empresa | null;
  rol: RolConSubida | null;
}> {
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
      empresa: null,
      rol: null,
    };
  }

  const empresa =
    empresaSnapshot.data() as Empresa;

  if (
    !empresaTieneSuscripcionActiva(
      empresa,
    )
  ) {
    return {
      permitido: false,
      status: 403,
      error:
        "Necesitás una suscripción activa para subir imágenes.",
      empresa,
      rol: null,
    };
  }

  if (
    empresa.userId === uid
  ) {
    return {
      permitido: true,
      status: 200,
      error: "",
      empresa,
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
      permitido: false,
      status: 403,
      error:
        "No tenés permiso para subir imágenes de esta empresa.",
      empresa: null,
      rol: null,
    };
  }

  const miembro =
    miembroSnapshot.data();

  const rol =
    miembro?.rol;

  const permitido =
    miembro?.estado === "activo" &&
    (
      rol === "administrador" ||
      rol === "supervisor"
    );

  if (!permitido) {
    return {
      permitido: false,
      status: 403,
      error:
        "No tenés permiso para subir imágenes de esta empresa.",
      empresa: null,
      rol: null,
    };
  }

  return {
    permitido: true,
    status: 200,
    error: "",
    empresa,
    rol,
  };
}

export async function GET(
  request: NextRequest,
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
        },
      );
    }

    let usuario;

    try {
      usuario =
        await adminAuth.verifyIdToken(
          idToken,
          true,
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o venció.",
        },
        {
          status: 401,
        },
      );
    }

    const empresaId =
      request.nextUrl.searchParams
        .get("empresaId")
        ?.trim() || "";

    if (
      !esIdFirestoreValido(
        empresaId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "empresaId inválido.",
        },
        {
          status: 400,
        },
      );
    }

    const acceso =
      await verificarAccesoSubida({
        empresaId,
        uid: usuario.uid,
      });

    if (!acceso.permitido) {
      return NextResponse.json(
        {
          error:
            acceso.error,
        },
        {
          status:
            acceso.status,
        },
      );
    }

    const publicKey =
      process.env
        .IMAGEKIT_PUBLIC_KEY
        ?.trim() || "";

    const privateKey =
      process.env
        .IMAGEKIT_PRIVATE_KEY
        ?.trim() || "";

    const urlEndpoint =
      process.env
        .IMAGEKIT_URL_ENDPOINT
        ?.trim() || "";

    if (
      !publicKey ||
      !privateKey ||
      !urlEndpoint
    ) {
      console.error(
        "Faltan variables de entorno de ImageKit.",
      );

      return NextResponse.json(
        {
          error:
            "ImageKit todavía no está configurado en el servidor.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * La private key nunca sale del servidor.
     * La firma de subida es temporal y solamente
     * se entrega después de validar:
     * - sesión,
     * - acceso a la empresa,
     * - rol,
     * - suscripción activa.
     */
    const {
      token,
      expire,
      signature,
    } = getUploadAuthParams({
      privateKey,
      publicKey,
    });

    return NextResponse.json(
      {
        token,
        expire,
        signature,
        publicKey,
        urlEndpoint,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Error generando autorización de ImageKit:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo preparar la subida de la imagen.",
      },
      {
        status: 500,
      },
    );
  }
}