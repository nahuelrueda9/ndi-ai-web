import { adminDb } from "@/lib/firebaseAdmin";

export async function getConversationHistory(chatId: string) {
  const snapshot = await adminDb
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(20)
    .get();

  return snapshot.docs.map((doc) => doc.data());
}