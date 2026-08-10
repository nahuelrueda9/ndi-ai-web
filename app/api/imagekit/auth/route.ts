import {
  createHmac,
  randomUUID,
} from "node:crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

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

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "Falta identificar la empresa.",
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

    if (!empresaSnapshot.exists) {
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
      empresa?.userId !== usuario.uid
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para subir imágenes de esta empresa.",
        },
        {
          status: 403,
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
     * ImageKit requiere para uploads desde navegador:
     * - token único
     * - expire en Unix seconds (< 1 hora)
     * - signature HMAC-SHA1(token + expire)
     *
     * La private key queda solamente en el servidor.
     */
    const token = randomUUID();

    const expire =
      Math.floor(Date.now() / 1000) +
      30 * 60;

    const signature =
      createHmac(
        "sha1",
        privateKey,
      )
        .update(
          `${token}${expire}`,
        )
        .digest("hex");

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