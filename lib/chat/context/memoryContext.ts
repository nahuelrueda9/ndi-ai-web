import { obtenerMemoriaCliente } from "@/lib/ai/memoryService";

export type MemoryContext = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  intereses?: string;
  ultimoTema?: string;
  presupuesto?: string;
  ultimaActualizacion?: string;
};

export async function obtenerMemoryContext(
  empresaId: string,
  chatId: string
): Promise<MemoryContext> {
  if (!empresaId || !chatId) {
    return {};
  }

  const memoria = await obtenerMemoriaCliente(
    empresaId,
    chatId
  );

  return memoria ?? {};
}