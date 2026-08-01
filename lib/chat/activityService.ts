import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type ActivityType =
  | "chat"
  | "ia"
  | "humano"
  | "nota"
  | "tag"
  | "memoria"
  | "tarea"
  | "archivo"
  | "estado"
  | "sistema";

type RegistrarActividadProps = {
  empresaId: string;
  chatId: string;

  tipo: ActivityType;

  titulo: string;

  descripcion?: string;

  icono?: string;

  metadata?: Record<string, unknown>;
};

export async function registrarActividad({
  empresaId,
  chatId,
  tipo,
  titulo,
  descripcion = "",
  icono = "📝",
  metadata = {},
}: RegistrarActividadProps) {
  const referencia = collection(
    db,
    "companies",
    empresaId,
    "conversations",
    chatId,
    "activity"
  );

  await addDoc(referencia, {
    tipo,
    titulo,
    descripcion,
    icono,
    metadata,
    createdAt: serverTimestamp(),
  });
}