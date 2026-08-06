import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type ProbarWhatsAppBody = {
  empresaId?: string;
  phoneNumberId?: string;
  accessToken?: string;
};

type IntegracionWhatsApp = {
  phoneNumberId?: string;
  accessToken?: string;
};

type RespuestaMeta = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

const META_API_VERSION =
  process.env.META_GRAPH_API_VERSION?.trim() ||
  "v23.0";

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
      (await request.json()) as ProbarWhatsAppBody;

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
        .doc("whatsapp");

    const integracionSnapshot =
      await integracionReferencia.get();

    const configuracionGuardada =
      (
        integracionSnapshot.data() ||
        {}
      ) as IntegracionWhatsApp;

    const phoneNumberId =
      body.phoneNumberId?.trim() ||
      configuracionGuardada
        .phoneNumberId
        ?.trim();

    const accessToken =
      body.accessToken?.trim() ||
      configuracionGuardada
        .accessToken
        ?.trim();

    if (
      !phoneNumberId ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "Completá Phone Number ID y Access Token.",
        },
        {
          status: 400,
        }
      );
    }

    const url = new URL(
      `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(
        phoneNumberId
      )}`
    );

    url.searchParams.set(
      "fields",
      "id,display_phone_number,verified_name,quality_rating"
    );

    const respuesta =
      await fetch(url, {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
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
        "Meta rechazó la conexión.";

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

    if (
      data.id &&
      data.id !== phoneNumberId
    ) {
      return NextResponse.json(
        {
          error:
            "Meta devolvió un Phone Number ID diferente.",
        },
        {
          status: 400,
        }
      );
    }

    await integracionReferencia.set(
      {
        phoneNumberId,
        estado: "conectado",
        displayPhoneNumber:
          data.display_phone_number ||
          "",
        verifiedName:
          data.verified_name || "",
        qualityRating:
          data.quality_rating || "",
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
        "Conexión con WhatsApp verificada correctamente.",
      numero:
        data.display_phone_number ||
        "",
      nombreVerificado:
        data.verified_name || "",
      calidad:
        data.quality_rating || "",
    });
  } catch (error) {
    console.error(
      "Error probando WhatsApp:",
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