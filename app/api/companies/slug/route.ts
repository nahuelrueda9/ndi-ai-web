import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type Body = {
  empresaId?: string;
  slug?: string;
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

    const body =
      (await request.json()) as Body;

    const empresaId =
      body.empresaId?.trim() || "";

    const slug =
      normalizarSlug(
        body.slug || "",
      );

    if (!empresaId || !slug) {
      return NextResponse.json(
        {
          error:
            "Falta la empresa o la URL pública.",
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

    const empresaSnapshot =
      await empresaRef.get();

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
            "No tenés permiso para modificar esta empresa.",
        },
        {
          status: 403,
        },
      );
    }

    const coincidencias =
      await adminDb
        .collection("companies")
        .where(
          "paginaPublica.slug",
          "==",
          slug,
        )
        .limit(2)
        .get();

    const usadaPorOtraEmpresa =
      coincidencias.docs.some(
        (documento) =>
          documento.id !==
          empresaId,
      );

    if (
      usadaPorOtraEmpresa
    ) {
      return NextResponse.json(
        {
          disponible: false,
          slug,
          error:
            "Esa URL ya está siendo usada por otro negocio.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        disponible: true,
        slug,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Error verificando slug público:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo verificar la URL pública.",
      },
      {
        status: 500,
      },
    );
  }
}