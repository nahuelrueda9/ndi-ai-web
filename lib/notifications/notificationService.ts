import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

export type TipoNotificacion =
  | "mensaje"
  | "humano"
  | "lead"
  | "plan"
  | "sistema";

export type CrearNotificacionParams = {
  empresaId: string;
  tipo: TipoNotificacion;
  titulo: string;
  descripcion: string;
  chatId?: string;
  visitanteId?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export async function crearNotificacion({
  empresaId,
  tipo,
  titulo,
  descripcion,
  chatId,
  visitanteId,
  url,
  metadata,
}: CrearNotificacionParams) {
  if (!empresaId.trim()) {
    throw new Error("Falta empresaId.");
  }

  if (!titulo.trim()) {
    throw new Error("Falta el título de la notificación.");
  }

  if (!descripcion.trim()) {
    throw new Error("Falta la descripción de la notificación.");
  }

  const referencia = adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("notifications")
    .doc();

  await referencia.set({
    tipo,
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    leida: false,
    empresaId,
    ...(chatId ? { chatId } : {}),
    ...(visitanteId ? { visitanteId } : {}),
    ...(url ? { url } : {}),
    ...(metadata ? { metadata } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    id: referencia.id,
  };
}

export async function marcarNotificacionComoLeida(
  empresaId: string,
  notificacionId: string
) {
  await adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("notifications")
    .doc(notificacionId)
    .set(
      {
        leida: true,
        leidaAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );
}

export async function marcarTodasComoLeidas(
  empresaId: string
) {
  const snapshot = await adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("notifications")
    .where("leida", "==", false)
    .get();

  if (snapshot.empty) {
    return {
      actualizadas: 0,
    };
  }

  const batch = adminDb.batch();

  for (const documento of snapshot.docs) {
    batch.set(
      documento.ref,
      {
        leida: true,
        leidaAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );
  }

  await batch.commit();

  return {
    actualizadas: snapshot.size,
  };
}

export async function eliminarNotificacion(
  empresaId: string,
  notificacionId: string
) {
  await adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("notifications")
    .doc(notificacionId)
    .delete();
}