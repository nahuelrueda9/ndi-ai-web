// lib/knowledgeSearch.ts

import { adminDb } from "@/lib/firebaseAdmin";

interface KnowledgeChunk {
  id: string;
  content: string;
  type: string;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function searchKnowledge(
  empresaId: string,
  question: string,
  limit = 5
) {
  const snapshot = await adminDb
    .collection("businesses")
    .doc(empresaId)
    .collection("knowledge")
    .get();

  const words = normalize(question)
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: (KnowledgeChunk & { score: number })[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    const content = String(data.content ?? "");
    const normalizedContent = normalize(content);

    let score = 0;

    for (const word of words) {
      if (normalizedContent.includes(word)) {
        score++;
      }
    }

    if (score > 0) {
      results.push({
        id: doc.id,
        content,
        type: data.type ?? "text",
        score,
      });
    }
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}