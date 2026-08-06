import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type DeleteConversationBody = {
  empresaId?: string;
  conversacionId?: string;
};

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
      rol: "propietario",
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
    miembro?.estado === "activo";

  return {
    permitido,
    status: permitido ? 200 : 403,
    error: permitido
      ? ""
      : "No tenés permisos para eliminar conversaciones de esta empresa.",
    rol: permitido
      ? String(
          miembro?.rol ||
            "miembro"
        )
      : "",
  };
}

export async function DELETE(
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

    let body:
      DeleteConversationBody;

    try {
      body =
        (await request.json()) as DeleteConversationBody;
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

    const conversacionId =
      body.conversacionId?.trim() ||
      "";

    if (
      !esIdFirestoreValido(
        empresaId
      ) ||
      !esIdFirestoreValido(
        conversacionId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "empresaId o conversacionId inválidos.",
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

    const empresaReferencia =
      adminDb
        .collection("companies")
        .doc(empresaId);

    const conversacionReferencia =
      empresaReferencia
        .collection("conversations")
        .doc(conversacionId);

    const conversacionSnapshot =
      await conversacionReferencia.get();

    if (
      !conversacionSnapshot.exists
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

    const datosConversacion =
      conversacionSnapshot.data() ||
      {};

    /*
     * Dejamos un registro fuera de la conversación,
     * porque recursiveDelete eliminará el documento
     * y todas sus subcolecciones.
     */
    const auditoriaReferencia =
      empresaReferencia
        .collection("auditLogs")
        .doc();

    await auditoriaReferencia.set({
      tipo:
        "conversacion_eliminada",
      conversacionId,
      canal:
        datosConversacion.canal ||
        "",
      visitanteId:
        datosConversacion
          .visitanteId ||
        "",
      eliminadoPor:
        usuario.uid,
      eliminadoPorEmail:
        usuario.email || "",
      rol:
        acceso.rol,
      createdAt:
        FieldValue.serverTimestamp(),
    });

    await adminDb.recursiveDelete(
      conversacionReferencia
    );

    return NextResponse.json({
      success: true,
      message:
        "Conversación eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando conversación:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la conversación.",
      },
      {
        status: 500,
      }
    );
  }
}