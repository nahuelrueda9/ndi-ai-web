import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  FieldValue,
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

type Body = {
  empresaId?: string;
  slug?: string;
};

type Empresa = {
  userId?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  paginaPublica?: {
    slug?: string;
  };
};

type Miembro = {
  estado?: "activo" | "inactivo";
  rol?:
    | "administrador"
    | "supervisor"
    | "operador";
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

function normalizarSlug(
  valor: string,
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .slice(0, 80);
}

class SlugNoDisponibleError extends Error {
  constructor() {
    super(
      "Esa URL ya está siendo usada por otro negocio.",
    );
    this.name =
      "SlugNoDisponibleError";
  }
}

class AccesoSlugError extends Error {
  constructor(
    mensaje: string,
  ) {
    super(mensaje);
    this.name =
      "AccesoSlugError";
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const token =
      obtenerBearerToken(
        request,
      );

    if (!token) {
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
          token,
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

    let body: Body;

    try {
      body =
        (await request.json()) as Body;
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

    const slug =
      normalizarSlug(
        body.slug || "",
      );

    if (
      !esIdFirestoreValido(
        empresaId,
      ) ||
      !slug
    ) {
      return NextResponse.json(
        {
          error:
            "Falta la empresa o la URL pública es inválida.",
        },
        {
          status: 400,
        },
      );
    }

    const empresaRef =
      adminDb
        .collection("companies")
        .doc(empresaId);

    const miembroRef =
      empresaRef
        .collection("members")
        .doc(usuario.uid);

    const slugRef =
      adminDb
        .collection("publicSlugs")
        .doc(slug);

    try {
      await adminDb.runTransaction(
        async (transaction) => {
          const empresaSnapshot =
            await transaction.get(
              empresaRef,
            );

          if (
            !empresaSnapshot.exists
          ) {
            throw new AccesoSlugError(
              "La empresa no existe.",
            );
          }

          const empresa =
            empresaSnapshot.data() as Empresa;

          let permitido =
            empresa.userId ===
            usuario.uid;

          if (!permitido) {
            const miembroSnapshot =
              await transaction.get(
                miembroRef,
              );

            const miembro =
              miembroSnapshot.exists
                ? (
                    miembroSnapshot.data() as Miembro
                  )
                : null;

            permitido =
              miembro?.estado ===
                "activo" &&
              miembro?.rol ===
                "administrador";
          }

          if (!permitido) {
            throw new AccesoSlugError(
              "No tenés permiso para modificar esta empresa.",
            );
          }

          if (
            !empresaTieneFuncion(
              empresa,
              "pagina_publica",
            )
          ) {
            throw new AccesoSlugError(
              "Necesitás una suscripción activa para configurar la página pública.",
            );
          }

          const slugActual =
            typeof empresa
              .paginaPublica?.slug ===
              "string"
              ? normalizarSlug(
                  empresa
                    .paginaPublica
                    .slug,
                )
              : "";

          const slugActualRef =
            slugActual &&
            slugActual !== slug
              ? adminDb
                  .collection(
                    "publicSlugs",
                  )
                  .doc(
                    slugActual,
                  )
              : null;

          const slugSnapshot =
            await transaction.get(
              slugRef,
            );

          let slugActualSnapshot:
            | FirebaseFirestore.DocumentSnapshot
            | null = null;

          if (slugActualRef) {
            slugActualSnapshot =
              await transaction.get(
                slugActualRef,
              );
          }

          const coincidenciasQuery =
            adminDb
              .collection("companies")
              .where(
                "paginaPublica.slug",
                "==",
                slug,
              )
              .limit(2);

          const coincidencias =
            await transaction.get(
              coincidenciasQuery,
            );

          // Verificar si otra empresa distinta está usando este slug en companies
          const usadaPorOtraEmpresa =
            coincidencias.docs.some(
              (documento) =>
                documento.id !==
                empresaId,
            );

          if (
            usadaPorOtraEmpresa
          ) {
            throw new SlugNoDisponibleError();
          }

          // Si el slug ya existe en publicSlugs, nos aseguramos de que sea de esta misma empresa o de su dueño
          if (
            slugSnapshot.exists
          ) {
            const reserva =
              slugSnapshot.data();

            const perteneceAEstaEmpresa =
              reserva?.empresaId === empresaId ||
              reserva?.propietarioUid === usuario.uid;

            if (!perteneceAEstaEmpresa) {
              throw new SlugNoDisponibleError();
            }
          }

          transaction.set(
            slugRef,
            {
              slug,
              empresaId,
              propietarioUid:
                empresa.userId || usuario.uid,
              updatedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          if (
            slugActualRef &&
            slugActualSnapshot?.exists &&
            (slugActualSnapshot.data()?.empresaId === empresaId ||
             slugActualSnapshot.data()?.propietarioUid === usuario.uid)
          ) {
            transaction.delete(
              slugActualRef,
            );
          }

          transaction.update(
            empresaRef,
            {
              "paginaPublica.slug":
                slug,
              updatedAt:
                FieldValue.serverTimestamp(),
            },
          );
        },
      );
    } catch (error) {
      if (
        error instanceof
        SlugNoDisponibleError
      ) {
        return NextResponse.json(
          {
            disponible: false,
            slug,
            error:
              error.message,
          },
          {
            status: 409,
          },
        );
      }

      if (
        error instanceof
        AccesoSlugError
      ) {
        const status =
          error.message ===
          "La empresa no existe."
            ? 404
            : error.message.includes(
                "suscripción activa",
              )
              ? 403
              : 403;

        return NextResponse.json(
          {
            error:
              error.message,
            upgradeRequired:
              error.message.includes(
                "suscripción activa",
              ),
          },
          {
            status,
          },
        );
      }

      throw error;
    }

    return NextResponse.json(
      {
        disponible: true,
        reservado: true,
        slug,
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
      "Error reservando slug público:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar la URL pública.",
      },
      {
        status: 500,
      },
    );
  }
}