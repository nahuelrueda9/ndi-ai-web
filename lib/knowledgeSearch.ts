// lib/knowledgeSearch.ts

import { adminDb } from "@/lib/firebaseAdmin";

export interface KnowledgeChunk {
  id: string;
  content: string;
  type: string;
  title: string;
  score: number;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerPalabras(texto: string) {
  return Array.from(
    new Set(
      normalize(texto)
        .split(" ")
        .filter((palabra) => palabra.length > 2)
    )
  );
}

export async function searchKnowledge(
  empresaId: string,
  question: string,
  limit = 5
): Promise<KnowledgeChunk[]> {
  const empresaLimpia = empresaId.trim();
  const preguntaLimpia = question.trim();

  if (!empresaLimpia || !preguntaLimpia) {
    return [];
  }

  const limiteSeguro = Math.min(Math.max(limit, 1), 20);

  const snapshot = await adminDb
    .collection("companies")
    .doc(empresaLimpia)
    .collection("knowledge")
    .get();

  const palabras = obtenerPalabras(preguntaLimpia);
  const resultados: KnowledgeChunk[] = [];

  snapshot.forEach((documento) => {
    const data = documento.data();

    const title = String(
      data.titulo ??
        data.title ??
        data.nombre ??
        "Información"
    ).trim();

    const content = String(
      data.contenido ??
        data.content ??
        data.texto ??
        ""
    ).trim();

    const type = String(
      data.tipo ??
        data.type ??
        (data.archivoUrl ? "pdf" : "text")
    ).trim();

    if (!content) {
      return;
    }

    const tituloNormalizado = normalize(title);
    const contenidoNormalizado = normalize(content);

    let score = 0;

    for (const palabra of palabras) {
      if (tituloNormalizado.includes(palabra)) {
        score += 5;
      }

      if (contenidoNormalizado.includes(palabra)) {
        score += 2;
      }
    }

    const preguntaNormalizada = normalize(preguntaLimpia);

    if (
      preguntaNormalizada.length >= 5 &&
      contenidoNormalizado.includes(preguntaNormalizada)
    ) {
      score += 10;
    }

    resultados.push({
      id: documento.id,
      content,
      type: type || "text",
      title,
      score,
    });
  });

  const conCoincidencias = resultados
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (conCoincidencias.length > 0) {
    return conCoincidencias.slice(0, limiteSeguro);
  }

  return resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limiteSeguro, 3));
}