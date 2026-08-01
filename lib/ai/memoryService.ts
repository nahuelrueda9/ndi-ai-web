import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type MemoriaCliente = {
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

export async function obtenerMemoriaCliente(
  empresaId: string,
  chatId: string
): Promise<MemoriaCliente> {
  try {
    const ref = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return {};
    }

    return (snap.data().memoriaCliente ?? {}) as MemoriaCliente;
  } catch (error) {
    console.error("Error obteniendo memoria:", error);
    return {};
  }
}

export async function guardarMemoriaCliente(
  empresaId: string,
  chatId: string,
  memoria: MemoriaCliente
) {
  try {
    const ref = doc(
      db,
      "companies",
      empresaId,
      "conversations",
      chatId
    );

    await updateDoc(ref, {
      memoriaCliente: {
        ...memoria,
        ultimaActualizacion: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error guardando memoria:", error);
  }
}