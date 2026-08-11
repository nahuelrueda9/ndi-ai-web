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

type DeleteCompanyBody = {
  empresaId?: string;
  confirmacion?: string;
};

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

export async function DELETE(
  request: NextRequest,
) {
  try {
    const idToken =
      obtenerBearerToken(
        request,
      );

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

    let body: DeleteCompanyBody;

    try {
      body =
        (await request.json()) as DeleteCompanyBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    const empresaId =
      body.empresaId?.trim() || "";

    const confirmacion =
      body.confirmacion?.trim() || "";

    if (
      !esIdFirestoreValido(
        empresaId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El ID de la empresa no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    const empresaReferencia =
      adminDb
        .collection("companies")
        .doc(empresaId);

    const empresaSnapshot =
      await empresaReferencia.get();

    if (
      !empresaSnapshot.exists
    ) {
      return NextResponse.json(
        {
          error:
            "La empresa no existe.",
        },
        {
          status: 404,
        },
      );
    }

    const empresa =
      empresaSnapshot.data();

    if (
      empresa?.userId !==
      usuario.uid
    ) {
      return NextResponse.json(
        {
          error:
            "Solo el propietario puede eliminar esta empresa.",
        },
        {
          status: 403,
        },
      );
    }

    const nombreEmpresa =
      typeof empresa?.nombre ===
        "string" &&
      empresa.nombre.trim()
        ? empresa.nombre.trim()
        : "Empresa";

    if (
      confirmacion !==
      nombreEmpresa
    ) {
      return NextResponse.json(
        {
          error:
            "La confirmación no coincide con el nombre de la empresa.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Conservamos un registro técnico mínimo fuera del árbol
     * de la empresa antes de borrarlo.
     *
     * No incluye teléfono, correo, catálogo, conversaciones
     * ni información de clientes.
     */
    await adminDb
      .collection(
        "companyDeletionAudit",
      )
      .doc(empresaId)
      .set({
        empresaId,
        nombre:
          nombreEmpresa,
        ownerUid:
          usuario.uid,
        plan:
          empresa?.plan ??
          null,
        subscriptionStatus:
          empresa
            ?.subscriptionStatus ??
          null,
        mercadopagoPaymentId:
          empresa
            ?.mercadopagoPaymentId ??
          null,
        deletedAt:
          FieldValue.serverTimestamp(),
      });

    /*
     * Borra el documento de la empresa y todos sus descendientes
     * de Firestore: catálogo, turnos, conversaciones, pagos,
     * analytics, conocimiento, notificaciones, integraciones, etc.
     */
    await adminDb.recursiveDelete(
      empresaReferencia,
    );

    return NextResponse.json({
      ok: true,
      empresaId,
    });
  } catch (error) {
    console.error(
      "Error al eliminar empresa:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la empresa. Intentá nuevamente.",
      },
      {
        status: 500,
      },
    );
  }
}