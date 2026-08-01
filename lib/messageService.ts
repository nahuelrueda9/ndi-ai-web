import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type MensajeGuardado = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export async function guardarMensaje(
  chatId: string,
  role: "user" | "assistant",
  content: string
) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    role,
    content,
    createdAt: serverTimestamp(),
  });
}

export async function obtenerMensajes(chatId: string) {
  const mensajesQuery = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(mensajesQuery);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  })) as MensajeGuardado[];
}