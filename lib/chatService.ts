import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type Conversacion = {
  id: string;
  empresaId: string;
  userId: string;
  titulo?: string;
};

export async function crearConversacion(
  empresaId: string,
  userId: string
) {
  const docRef = await addDoc(collection(db, "chats"), {
    empresaId,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function obtenerConversaciones(
  empresaId: string,
  userId: string
) {
  const chatsQuery = query(
    collection(db, "chats"),
    where("empresaId", "==", empresaId),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(chatsQuery);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  })) as Conversacion[];
}

export async function actualizarConversacion(chatId: string) {
  const chatRef = doc(db, "chats", chatId);

  await updateDoc(chatRef, {
    updatedAt: serverTimestamp(),
  });
}

export async function actualizarTituloConversacion(
  chatId: string,
  titulo: string
) {
  const chatRef = doc(db, "chats", chatId);

  await updateDoc(chatRef, {
    titulo,
    updatedAt: serverTimestamp(),
  });
}