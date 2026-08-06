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

type InvitacionData = {
  email?: string;
  rol?: RolEquipo;
  estado?: "pendiente" | "aceptada" | "cancelada";
  token?: string;
  expiresAt?: Timestamp;
};

function limpiarToken(valor: unknown) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim().slice(0, 1000);
}

function separarToken(token: string) {
  const partes = token.split(".");

  if (partes.length !== 3) {
    return null;
  }

  const [empresaId, invitacionId, secreto] =
    partes;

  if (
    !empresaId ||
    !invitacionId ||
    !secreto
  ) {
    return null;
  }

  return {
    empresaId,
    invitacionId,
  };
}

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

async function obtenerInvitacion(
  token: string
) {
  const identificadores =
    separarToken(token);

  if (!identificadores) {
    return null;
  }

  const empresaReferencia = adminDb
    .collection("companies")
    .doc(identificadores.empresaId);

  const invitacionReferencia =
    empresaReferencia
      .collection("invitations")
      .doc(
        identificadores.invitacionId
      );

  const [
    empresaSnapshot,
    invitacionSnapshot,
  ] = await Promise.all([
    empresaReferencia.get(),
    invitacionReferencia.get(),
  ]);

  if (
    !empresaSnapshot.exists ||
    !invitacionSnapshot.exists
  ) {
    return null;
  }

  const invitacion =
    invitacionSnapshot.data() as
      | InvitacionData
      | undefined;

  if (
    !invitacion ||
    invitacion.token !== token
  ) {
    return null;
  }

  return {
    empresaReferencia,
    invitacionReferencia,
    empresaSnapshot,
    invitacionSnapshot,
    invitacion,
  };
}

function invitacionVencida(
  invitacion: InvitacionData
) {
  return Boolean(
    invitacion.expiresAt &&
      invitacion.expiresAt.toMillis() <
        Date.now()
  );
}

export async function GET(
  request: Request
) {
  try {
    const url = new URL(request.url);

    const token = limpiarToken(
      url.searchParams.get("invitation")
    );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Falta el código de invitación.",
        },
        {
          status: 400,
        }
      );
    }

    const resultado =
      await obtenerInvitacion(token);

    if (!resultado) {
      return NextResponse.json(
        {
          error:
            "La invitación no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      resultado.invitacion.estado !==
      "pendiente"
    ) {
      return NextResponse.json(
        {
          error:
            resultado.invitacion.estado ===
            "aceptada"
              ? "Esta invitación ya fue aceptada."
              : "Esta invitación fue cancelada.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      invitacionVencida(
        resultado.invitacion
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Esta invitación venció.",
        },
        {
          status: 410,
        }
      );
    }

    const empresa =
      resultado.empresaSnapshot.data();

    return NextResponse.json({
      empresaId:
        resultado.empresaReferencia.id,
      empresaNombre:
        typeof empresa?.nombre === "string"
          ? empresa.nombre
          : "Empresa",
      email:
        resultado.invitacion.email ?? "",
      rol:
        resultado.invitacion.rol ??
        "operador",
      estado:
        resultado.invitacion.estado,
    });
  } catch (error) {
    console.error(
      "Error al consultar invitación:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo consultar la invitación.",
      },
      {
        status: 500,
      }
    );
  }
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

    const emailUsuario = (
      usuario.email ?? ""
    )
      .trim()
      .toLowerCase();

    if (!emailUsuario) {
      return NextResponse.json(
        {
          error:
            "Tu cuenta no tiene un correo válido.",
        },
        {
          status: 400,
        }
      );
    }

    const body = (await request.json()) as {
      invitation?: string;
    };

    const token = limpiarToken(
      body.invitation
    );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Falta el código de invitación.",
        },
        {
          status: 400,
        }
      );
    }

    const resultado =
      await obtenerInvitacion(token);

    if (!resultado) {
      return NextResponse.json(
        {
          error:
            "La invitación no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const nombreUsuario =
      typeof usuario.name === "string" &&
      usuario.name.trim()
        ? usuario.name.trim()
        : emailUsuario.split("@")[0];

    await adminDb.runTransaction(
      async (transaction) => {
        const invitacionSnapshot =
          await transaction.get(
            resultado.invitacionReferencia
          );

        if (
          !invitacionSnapshot.exists
        ) {
          throw new Error(
            "La invitación no existe."
          );
        }

        const invitacion =
          invitacionSnapshot.data() as
            | InvitacionData
            | undefined;

        if (
          !invitacion ||
          invitacion.token !== token
        ) {
          throw new Error(
            "La invitación no es válida."
          );
        }

        if (
          invitacion.estado !==
          "pendiente"
        ) {
          throw new Error(
            invitacion.estado ===
            "aceptada"
              ? "Esta invitación ya fue aceptada."
              : "Esta invitación fue cancelada."
          );
        }

        if (
          invitacionVencida(invitacion)
        ) {
          throw new Error(
            "Esta invitación venció."
          );
        }

        const emailInvitado = (
          invitacion.email ?? ""
        )
          .trim()
          .toLowerCase();

        if (
          !emailInvitado ||
          emailInvitado !== emailUsuario
        ) {
          throw new Error(
            "La invitación pertenece a otro correo electrónico."
          );
        }

        const rol =
          invitacion.rol ?? "operador";

        const miembroReferencia =
          resultado.empresaReferencia
            .collection("members")
            .doc(usuario.uid);

        transaction.set(
          miembroReferencia,
          {
            uid: usuario.uid,
            nombre: nombreUsuario,
            email: emailUsuario,
            rol,
            estado: "activo",
            invitationId:
              resultado
                .invitacionReferencia.id,
            createdAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        transaction.update(
          resultado.invitacionReferencia,
          {
            estado: "aceptada",
            acceptedBy: usuario.uid,
            acceptedEmail:
              emailUsuario,
            acceptedAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );
      }
    );

    const empresa =
      resultado.empresaSnapshot.data();

    return NextResponse.json({
      ok: true,
      empresaId:
        resultado.empresaReferencia.id,
      empresaNombre:
        typeof empresa?.nombre === "string"
          ? empresa.nombre
          : "Empresa",
      rol:
        resultado.invitacion.rol ??
        "operador",
    });
  } catch (error) {
    console.error(
      "Error al aceptar invitación:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo aceptar la invitación.";

    const status =
      mensaje.includes(
        "otro correo"
      )
        ? 403
        : mensaje.includes(
            "ya fue aceptada"
          ) ||
          mensaje.includes("cancelada")
        ? 409
        : mensaje.includes("venció")
        ? 410
        : 500;

    return NextResponse.json(
      {
        error: mensaje,
      },
      {
        status,
      }
    );
  }
}