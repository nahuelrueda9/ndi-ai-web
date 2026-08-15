import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  FieldValue,
  type Timestamp,
} from "firebase-admin/firestore";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type Params = {
  empresaId: string;
};

type EmpresaData = {
  userId?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
};

type MiembroData = {
  rol?:
    | "administrador"
    | "supervisor"
    | "operador";
  estado?: "activo" | "inactivo";
};

type EstadoPresupuesto =
  | "nuevo"
  | "contactado"
  | "cerrado";

type PresupuestoData = {
  nombre?: string;
  email?: string;
  telefono?: string;
  ultimoMensaje?: string;
  tipoContacto?: string;
  estadoPresupuesto?: EstadoPresupuesto;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

const ESTADOS_VALIDOS =
  new Set<EstadoPresupuesto>([
    "nuevo",
    "contactado",
    "cerrado",
  ]);

function idFirestoreValido(
  valor: unknown,
): valor is string {
  return (
    typeof valor === "string" &&
    valor.length > 0 &&
    valor.length <= 160 &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

function fechaIso(
  valor: unknown,
) {
  if (
    valor &&
    typeof valor === "object" &&
    "toDate" in valor &&
    typeof (
      valor as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      return (
        valor as {
          toDate: () => Date;
        }
      )
        .toDate()
        .toISOString();
    } catch {
      return null;
    }
  }

  return null;
}

async function autenticar(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      "authorization",
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(
      token,
      true,
    );
  } catch {
    return null;
  }
}

async function validarAcceso(
  uid: string,
  empresaId: string,
) {
  const empresaRef =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnapshot =
    await empresaRef.get();

  if (!empresaSnapshot.exists) {
    return {
      ok: false as const,
      status: 404,
      error:
        "No se encontró la empresa.",
    };
  }

  const empresa =
    empresaSnapshot.data() as EmpresaData;

  let tieneAcceso =
    empresa.userId === uid;

  if (!tieneAcceso) {
    const miembroSnapshot =
      await empresaRef
        .collection("members")
        .doc(uid)
        .get();

    if (!miembroSnapshot.exists) {
      return {
        ok: false as const,
        status: 403,
        error:
          "No tenés acceso a esta empresa.",
      };
    }

    const miembro =
      miembroSnapshot.data() as MiembroData;

    tieneAcceso =
      miembro.estado === "activo" &&
      (
        miembro.rol ===
          "administrador" ||
        miembro.rol ===
          "supervisor" ||
        miembro.rol ===
          "operador"
      );
  }

  if (!tieneAcceso) {
    return {
      ok: false as const,
      status: 403,
      error:
        "No tenés acceso a esta empresa.",
    };
  }

  if (
    !empresaTieneFuncion(
      empresa,
      "presupuestos",
    )
  ) {
    return {
      ok: false as const,
      status: 403,
      error:
        "Presupuestos requiere Página Completa o Business IA con una suscripción activa.",
    };
  }

  return {
    ok: true as const,
    empresaRef,
  };
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const usuario =
      await autenticar(request);

    if (!usuario) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const {
      empresaId,
    } = await context.params;

    if (
      !idFirestoreValido(
        empresaId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Empresa inválida.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const acceso =
      await validarAcceso(
        usuario.uid,
        empresaId,
      );

    if (!acceso.ok) {
      return NextResponse.json(
        {
          error: acceso.error,
        },
        {
          status: acceso.status,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    /*
     * Esta API NO devuelve todas las conversaciones.
     * Página Completa puede leer únicamente solicitudes
     * públicas de presupuesto.
     */
    const snapshot =
      await acceso.empresaRef
        .collection(
          "conversations",
        )
        .where(
          "tipoContacto",
          "==",
          "presupuesto_publico",
        )
        .limit(200)
        .get();

    const presupuestos =
      snapshot.docs
        .map((documento) => {
          const datos =
            documento.data() as PresupuestoData;

          return {
            id:
              documento.id,
            nombre:
              typeof datos.nombre ===
              "string"
                ? datos.nombre
                    .trim()
                    .slice(
                      0,
                      100,
                    )
                : "",
            email:
              typeof datos.email ===
              "string"
                ? datos.email
                    .trim()
                    .slice(
                      0,
                      180,
                    )
                : "",
            telefono:
              typeof datos.telefono ===
              "string"
                ? datos.telefono
                    .trim()
                    .slice(
                      0,
                      50,
                    )
                : "",
            mensaje:
              typeof datos.ultimoMensaje ===
              "string"
                ? datos.ultimoMensaje
                    .trim()
                    .slice(
                      0,
                      2000,
                    )
                : "",
            estado:
              ESTADOS_VALIDOS.has(
                datos.estadoPresupuesto ||
                  "nuevo",
              )
                ? (
                    datos.estadoPresupuesto ||
                    "nuevo"
                  )
                : "nuevo",
            createdAt:
              fechaIso(
                datos.createdAt,
              ),
            updatedAt:
              fechaIso(
                datos.updatedAt,
              ),
          };
        })
        .sort((a, b) => {
          const fechaA =
            a.createdAt
              ? new Date(
                  a.createdAt,
                ).getTime()
              : 0;

          const fechaB =
            b.createdAt
              ? new Date(
                  b.createdAt,
                ).getTime()
              : 0;

          return fechaB - fechaA;
        });

    return NextResponse.json(
      {
        presupuestos,
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
      "Error cargando presupuestos:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los presupuestos.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const usuario =
      await autenticar(request);

    if (!usuario) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const {
      empresaId,
    } = await context.params;

    if (
      !idFirestoreValido(
        empresaId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Empresa inválida.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    let body: {
      presupuestoId?: string;
      estado?: EstadoPresupuesto;
    };

    try {
      body =
        (await request.json()) as {
          presupuestoId?: string;
          estado?: EstadoPresupuesto;
        };
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    if (
      !idFirestoreValido(
        body.presupuestoId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Presupuesto inválido.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    if (
      !body.estado ||
      !ESTADOS_VALIDOS.has(
        body.estado,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Estado inválido.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const acceso =
      await validarAcceso(
        usuario.uid,
        empresaId,
      );

    if (!acceso.ok) {
      return NextResponse.json(
        {
          error: acceso.error,
        },
        {
          status: acceso.status,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const presupuestoRef =
      acceso.empresaRef
        .collection(
          "conversations",
        )
        .doc(
          body.presupuestoId,
        );

    await adminDb.runTransaction(
      async (transaction) => {
        /*
         * Revalidamos empresa + feature dentro
         * de la transacción antes de modificar.
         */
        const empresaActualSnapshot =
          await transaction.get(
            acceso.empresaRef,
          );

        const empresaActual =
          empresaActualSnapshot.data() as
            | EmpresaData
            | undefined;

        if (
          !empresaActualSnapshot.exists ||
          !empresaActual ||
          !empresaTieneFuncion(
            empresaActual,
            "presupuestos",
          )
        ) {
          throw new Error(
            "PRESUPUESTOS_NO_DISPONIBLES",
          );
        }

        const presupuestoSnapshot =
          await transaction.get(
            presupuestoRef,
          );

        if (
          !presupuestoSnapshot.exists
        ) {
          throw new Error(
            "PRESUPUESTO_NO_ENCONTRADO",
          );
        }

        const presupuestoActual =
          presupuestoSnapshot.data();

        if (
          presupuestoActual
            ?.tipoContacto !==
          "presupuesto_publico"
        ) {
          throw new Error(
            "PRESUPUESTO_NO_ENCONTRADO",
          );
        }

        transaction.update(
          presupuestoRef,
          {
            estadoPresupuesto:
              body.estado,
            updatedAt:
              FieldValue.serverTimestamp(),
          },
        );
      },
    );

    return NextResponse.json(
      {
        ok: true,
        estado: body.estado,
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
    if (
      error instanceof Error &&
      error.message ===
        "PRESUPUESTO_NO_ENCONTRADO"
    ) {
      return NextResponse.json(
        {
          error:
            "No se encontró el presupuesto.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "PRESUPUESTOS_NO_DISPONIBLES"
    ) {
      return NextResponse.json(
        {
          error:
            "Presupuestos ya no está disponible para esta empresa.",
        },
        {
          status: 403,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    console.error(
      "Error actualizando presupuesto:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el presupuesto.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}