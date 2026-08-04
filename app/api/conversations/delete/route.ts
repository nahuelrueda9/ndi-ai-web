import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type DeleteConversationBody = {
  empresaId?: string;
  conversacionId?: string;
};

export async function DELETE(request: NextRequest) {
  try {
    const body =
      (await request.json()) as DeleteConversationBody;

    const empresaId = body.empresaId?.trim();
    const conversacionId =
      body.conversacionId?.trim();

    if (!empresaId || !conversacionId) {
      return NextResponse.json(
        {
          error:
            "Faltan empresaId o conversacionId.",
        },
        {
          status: 400,
        }
      );
    }

    const conversacionReferencia = adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("conversations")
      .doc(conversacionId);

    const conversacionSnapshot =
      await conversacionReferencia.get();

    if (!conversacionSnapshot.exists) {
      return NextResponse.json(
        {
          error: "La conversación no existe.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * recursiveDelete elimina:
     * - el documento de la conversación;
     * - todos los mensajes;
     * - cualquier otra subcolección interna.
     */
    await adminDb.recursiveDelete(
      conversacionReferencia
    );

    console.log(
      `Conversación ${conversacionId} eliminada de la empresa ${empresaId}.`
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