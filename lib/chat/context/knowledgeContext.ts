import { searchKnowledge } from "@/lib/knowledgeSearch";

export type KnowledgeItem = {
  id: string;
  titulo: string;
  contenido: string;
  tipo: string;
};

export async function obtenerKnowledgeContext(
  empresaId: string,
  mensaje: string,
  limite = 6
): Promise<KnowledgeItem[]> {
  if (!empresaId || !mensaje.trim()) {
    return [];
  }

  const resultados = await searchKnowledge(
    empresaId,
    mensaje,
    limite
  );

  return resultados.map((item) => ({
    id: item.id,
    titulo:
      item.type === "pdf"
        ? "Documento PDF"
        : item.type === "website"
        ? "Página web"
        : "Información",

    contenido: item.content,
    tipo: item.type,
  }));
}