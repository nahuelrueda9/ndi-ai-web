// app/api/knowledge/upload-pdf/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function chunkText(text: string, size = 1000) {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += size) {
    const chunk = text.slice(i, i + size).trim();

    if (chunk.length > 20) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

export async function POST(req: NextRequest) {
  let parser: PDFParse | null = null;

  try {
    const formData = await req.formData();

    const empresaId = formData
      .get("empresaId")
      ?.toString()
      .trim();

    const file = formData.get("pdf");

    if (!empresaId) {
      return NextResponse.json(
        {
          error: "empresaId requerido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "PDF requerido.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "El archivo debe ser un PDF.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "El PDF está vacío.",
        },
        {
          status: 400,
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    parser = new PDFParse({
      data,
    });

    const result = await parser.getText();
    const text = result.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json(
        {
          error:
            "No se pudo extraer texto del PDF. Puede ser un documento escaneado.",
        },
        {
          status: 400,
        }
      );
    }

    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "El PDF no contiene suficiente texto para procesar.",
        },
        {
          status: 400,
        }
      );
    }

    const knowledgeRef = adminDb
      .collection("businesses")
      .doc(empresaId)
      .collection("knowledge");

    const batch = adminDb.batch();

    chunks.forEach((content, index) => {
      const reference = knowledgeRef.doc();

      batch.set(reference, {
        type: "pdf",
        content,
        fileName: file.name,
        chunkIndex: index,
        totalChunks: chunks.length,
        createdAt: new Date(),
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error("Error procesando PDF:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error procesando el PDF.",
      },
      {
        status: 500,
      }
    );
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}