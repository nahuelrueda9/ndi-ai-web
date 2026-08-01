import {
  obtenerKnowledgeContext,
  type KnowledgeItem,
} from "@/lib/chat/context/knowledgeContext";

import {
  obtenerMemoryContext,
  type MemoryContext,
} from "@/lib/chat/context/memoryContext";

import {
  obtenerCRMContext,
  type NotaCRMContext,
  type ActividadCRMContext,
} from "@/lib/chat/context/crmContext";

export type ChatContext = {
  memoria: MemoryContext;
  conocimientos: KnowledgeItem[];
  tags: string[];
  notas: NotaCRMContext[];
  actividades: ActividadCRMContext[];
};

type ObtenerContextoParams = {
  empresaId: string;
  chatId: string;
  mensaje: string;
  tags?: unknown;
  notas?: unknown;
  actividades?: unknown;
  limiteConocimientos?: number;
};

export async function obtenerContexto({
  empresaId,
  chatId,
  mensaje,
  tags,
  notas,
  actividades,
  limiteConocimientos = 6,
}: ObtenerContextoParams): Promise<ChatContext> {
  const [memoria, conocimientos] = await Promise.all([
    obtenerMemoryContext(empresaId, chatId),

    obtenerKnowledgeContext(
      empresaId,
      mensaje,
      limiteConocimientos
    ),
  ]);

  const contextoCRM = obtenerCRMContext({
    tags,
    notas,
    actividades,
  });

  return {
    memoria,
    conocimientos,
    tags: contextoCRM.tags,
    notas: contextoCRM.notas,
    actividades: contextoCRM.actividades,
  };
}