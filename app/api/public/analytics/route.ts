import {
  NextRequest,
  NextResponse,
} from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type TipoEvento =
  | "page_view"
  | "whatsapp_click"
  | "lead_submit";

type AnalyticsBody = {
  slug?: string;
  tipo?: TipoEvento;
  visitanteId?: string;
};

const EVENTOS_VALIDOS =
  new Set<TipoEvento>([
    "page_view",
    "whatsapp_click",
    "lead_submit",
  ]);

function limpiarTexto(
  valor: unknown,
  maximo: number,
) {
  return typeof valor === "string"
    ? valor
        .trim()
        .replace(/\u0000/g, "")
        .slice(0, maximo)
    : "";
}

export async function POST(
  request: NextRequest,
) {
  try {
    let body: AnalyticsBody;

    try {
      body =
        (await request.json()) as AnalyticsBody;
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

    const slug = limpiarTexto(
      body.slug,
      160,
    ).toLowerCase();

    const tipo =
      limpiarTexto(
        body.tipo,
        40,
      ) as TipoEvento;

    const visitanteId = limpiarTexto(
      body.visitanteId,
      180,
    );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta identificar el negocio.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !EVENTOS_VALIDOS.has(tipo)
    ) {
      return NextResponse.json(
        {
          error:
            "El tipo de evento no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (!visitanteId) {
      return NextResponse.json(
        {
          error:
            "Falta identificar al visitante.",
        },
        {
          status: 400,
        },
      );
    }

    const empresasSnapshot =
      await adminDb
        .collection("companies")
        .where(
          "paginaPublica.slug",
          "==",
          slug,
        )
        .limit(2)
        .get();

    if (empresasSnapshot.size !== 1) {
      return NextResponse.json(
        {
          error:
            empresasSnapshot.empty
              ? "No se encontró la página del negocio."
              : "La URL pública no es válida.",
        },
        {
          status: empresasSnapshot.empty
            ? 404
            : 409,
        },
      );
    }

    const empresaDocumento =
      empresasSnapshot.docs[0];

    const empresa =
      empresaDocumento.data();

    if (
      empresa?.paginaPublica
        ?.publicada !== true
    ) {
      return NextResponse.json(
        {
          error:
            "La página del negocio no está disponible.",
        },
        {
          status: 404,
        },
      );
    }

    const userAgent =
      limpiarTexto(
        request.headers.get(
          "user-agent",
        ),
        500,
      );

    const referer =
      limpiarTexto(
        request.headers.get(
          "referer",
        ),
        500,
      );

    await adminDb
      .collection("companies")
      .doc(empresaDocumento.id)
      .collection("analyticsEvents")
      .add({
        tipo,
        visitanteId,
        slug,

        origen:
          "pagina_publica",

        userAgent,
        referer,

        createdAt:
          FieldValue.serverTimestamp(),
      });

    return NextResponse.json(
      {
        ok: true,
      },
      {
        status: 201,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Error registrando analytics público:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo registrar el evento.",
      },
      {
        status: 500,
      },
    );
  }
}