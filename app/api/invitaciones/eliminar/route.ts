import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type EliminarInvitacionBody = {
  empresaId?: string;
  invitacionId?: string;
};

function obtenerBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }
  return authorization.slice("Bearer ".length).trim();
}

function limpiarTexto(valor: unknown, maximo: number) {
  if (typeof valor !== "string") {
    return "";
  }
  return valor.trim().slice(0, maximo);
}

async function puedeGestionarEquipo({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}) {
  const empresaReferencia = adminDb.collection("companies").doc(empresaId);
  const empresaSnapshot = await empresaReferencia.get();

  if (!empresaSnapshot.exists) {
    return {
      permitido: false,
      empresaReferencia,
      motivo: "La empresa no existe.",
    };
  }

  const empresa = empresaSnapshot.data();
  if (empresa?.userId === uid) {
    return {
      permitido: true,
      empresaReferencia,
      motivo: "",
    };
  }

  const miembroSnapshot = await empresaReferencia
    .collection("members")
    .doc(uid)
    .get();

  const miembro = miembroSnapshot.data();
  const permitido =
    miembroSnapshot.exists &&
    miembro?.estado === "activo" &&
    miembro?.rol === "administrador";

  return {
    permitido,
    empresaReferencia,
    motivo: permitido ? "" : "No tenés permisos para eliminar invitaciones.",
  };
}

export async function POST(request: Request) {
  try {
    const idToken = obtenerBearerToken(request);
    if (!idToken) {
      return NextResponse.json(
        { error: "Tenés que iniciar sesión." },
        { status: 401 },
      );
    }

    const usuario = await adminAuth.verifyIdToken(idToken);
    const body = (await request.json()) as EliminarInvitacionBody;

    const empresaId = limpiarTexto(body.empresaId, 160);
    const invitacionId = limpiarTexto(body.invitacionId, 160);

    if (!empresaId || !invitacionId) {
      return NextResponse.json(
        { error: "Faltan datos para eliminar la invitación." },
        { status: 400 },
      );
    }

    const acceso = await puedeGestionarEquipo({
      empresaId,
      uid: usuario.uid,
    });

    if (!acceso.permitido) {
      return NextResponse.json(
        { error: acceso.motivo },
        { status: 403 },
      );
    }

    await acceso.empresaReferencia
      .collection("invitations")
      .doc(invitacionId)
      .delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar invitación:", error);
    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo eliminar la invitación.";

    return NextResponse.json(
      { error: mensaje },
      {
        status: mensaje.includes("Firebase ID token") ? 401 : 500,
      },
    );
  }
}