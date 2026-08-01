import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { empresaId, url } = await req.json();

    if (!empresaId || !url) {
      return NextResponse.json(
        { error: "empresaId y url son obligatorios." },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo acceder al sitio." },
        { status: 400 }
      );
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    $("script,style,noscript,header,footer,nav").remove();

    const title = $("title").text().trim();

    const content = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (content.length < 50) {
      return NextResponse.json(
        { error: "No se encontró contenido suficiente." },
        { status: 400 }
      );
    }

    const partes: string[] = [];

    for (let i = 0; i < content.length; i += 1000) {
      partes.push(content.slice(i, i + 1000));
    }

    const batch = adminDb.batch();

    partes.forEach((texto, index) => {
      const ref = adminDb
        .collection("businesses")
        .doc(empresaId)
        .collection("knowledge")
        .doc();

      batch.set(ref, {
        type: "website",
        title,
        sourceUrl: url,
        content: texto,
        chunkIndex: index,
        totalChunks: partes.length,
        createdAt: new Date(),
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      chunks: partes.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error interno",
      },
      { status: 500 }
    );
  }
}