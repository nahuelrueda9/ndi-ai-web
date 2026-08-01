import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Prioridad = "alta" | "media" | "baja";

type CrearTarea = {
  empresaId: string;
  chatId: string;
  titulo: string;
  descripcion?: string;
  prioridad?: Prioridad;
  responsable?: string;
  fechaVencimiento?: string;
};

export async function crearTarea({
  empresaId,
  chatId,
  titulo,
  descripcion,
  prioridad = "media",
  responsable = "",
  fechaVencimiento = "",
}: CrearTarea) {
  return addDoc(
    collection(db, "companies", empresaId, "tasks"),
    {
      chatId,
      titulo,
      descripcion: descripcion ?? "",
      estado: "pendiente",
      prioridad,
      responsable,
      fechaVencimiento,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
}