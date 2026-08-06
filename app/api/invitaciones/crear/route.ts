import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

type RolEquipo =
  | "administrador"
  | "supervisor"
  | "operador";

type CrearInvitacionBody = {
  empresaId?: string;
  email?: string;
  rol?: RolEquipo;
};

const ROLES_VALIDOS = new Set<RolEquipo>([
  "administrador",
  "supervisor",
  "operador",
]);

function obtenerBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get("authorization") ?? "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return "";
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

function limpiarTexto(
  valor: unknown,
  maximo: number
) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim().slice(0, maximo);
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

async function puedeGestionarEquipo({
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
      empresaReferencia,
      empresaNombre: "",
      motivo: "La empresa no existe.",
    };
  }

  const empresa = empresaSnapshot.data();

  if (empresa?.userId === uid) {
    return {
      permitido: true,
      empresaReferencia,
      empresaNombre:
        typeof empresa.nombre === "string"
          ? empresa.nombre
          : "Empresa",
      motivo: "",
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
    miembro?.rol === "administrador";

  return {
    permitido,
    empresaReferencia,
    empresaNombre:
      typeof empresa?.nombre === "string"
        ? empresa.nombre
        : "Empresa",
    motivo: permitido
      ? ""
      : "No tenés permisos para invitar miembros.",
  };
}

export async function POST(
  request: Request
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

    const usuario =
      await adminAuth.verifyIdToken(
        idToken
      );

    const body =
      (await request.json()) as CrearInvitacionBody;

    const empresaId = limpiarTexto(
      body.empresaId,
      160
    );

    const email = limpiarTexto(
      body.email,
      320
    ).toLowerCase();

    const rol = limpiarTexto(
      body.rol,
      40
    ) as RolEquipo;

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "Falta el ID de la empresa.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email || !emailValido(email)) {
      return NextResponse.json(
        {
          error:
            "Ingresá un email válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ROLES_VALIDOS.has(rol)) {
      return NextResponse.json(
        {
          error:
            "El rol seleccionado no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const acceso =
      await puedeGestionarEquipo({
        empresaId,
        uid: usuario.uid,
      });

    if (!acceso.permitido) {
      return NextResponse.json(
        {
          error: acceso.motivo,
        },
        {
          status: 403,
        }
      );
    }

    const miembroExistente =
      await acceso.empresaReferencia
        .collection("members")
        .where("email", "==", email)
        .limit(1)
        .get();

    if (!miembroExistente.empty) {
      return NextResponse.json(
        {
          error:
            "Ese usuario ya pertenece al equipo.",
        },
        {
          status: 409,
        }
      );
    }

    const invitacionesMismoEmail =
      await acceso.empresaReferencia
        .collection("invitations")
        .where("email", "==", email)
        .get();

    const pendiente =
      invitacionesMismoEmail.docs.find(
        (documento) =>
          documento.data().estado ===
          "pendiente"
      );

    if (pendiente) {
      const datos = pendiente.data();

      return NextResponse.json(
        {
          error:
            "Ya existe una invitación pendiente para ese email.",
          invitationId: pendiente.id,
          invitationUrl:
            typeof datos.invitationUrl ===
            "string"
              ? datos.invitationUrl
              : "",
        },
        {
          status: 409,
        }
      );
    }

    const invitacionReferencia =
      acceso.empresaReferencia
        .collection("invitations")
        .doc();

    const secreto = randomBytes(32).toString(
      "base64url"
    );

    const token = [
      empresaId,
      invitacionReferencia.id,
      secreto,
    ].join(".");

    const invitationUrl = new URL(
      `/invitaciones/aceptar?invitation=${encodeURIComponent(
        token
      )}`,
      request.url
    ).toString();

    const venceEn = Timestamp.fromMillis(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    await invitacionReferencia.set({
      email,
      rol,
      estado: "pendiente",
      token,
      invitationUrl,
      expiresAt: venceEn,
      createdBy: usuario.uid,
      createdByEmail:
        usuario.email ?? "",
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      invitationId:
        invitacionReferencia.id,
      invitationUrl,
      empresaId,
      empresaNombre:
        acceso.empresaNombre,
      email,
      rol,
      expiresAt:
        venceEn.toDate().toISOString(),
    });
  } catch (error) {
    console.error(
      "Error al crear invitación:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo crear la invitación.";

    return NextResponse.json(
      {
        error: mensaje,
      },
      {
        status:
          mensaje.includes(
            "Firebase ID token"
          )
            ? 401
            : 500,
      }
    );
  }
}