import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

export type PlanEmpresa = "free" | "pro" | "business";

type EmpresaPlanData = {
  plan?: PlanEmpresa;
  conversationsThisMonth?: number;
  maxConversations?: number;
  usageMonth?: string;
};

const LIMITES_POR_PLAN: Record<PlanEmpresa, number> = {
  free: 100,
  pro: 2000,
  business: 10000,
};

function obtenerMesActual() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");

  return `${anio}-${mes}`;
}

export async function registrarNuevaConversacionAdmin(
  empresaId: string
) {
  const empresaReferencia = adminDb
    .collection("companies")
    .doc(empresaId);

  return adminDb.runTransaction(async (transaction) => {
    const empresaSnapshot = await transaction.get(
      empresaReferencia
    );

    if (!empresaSnapshot.exists) {
      throw new Error("La empresa no existe.");
    }

    const datos =
      empresaSnapshot.data() as EmpresaPlanData;

    const plan: PlanEmpresa =
      datos.plan === "pro" ||
      datos.plan === "business"
        ? datos.plan
        : "free";

    const mesActual = obtenerMesActual();

    const debeReiniciarMes =
      datos.usageMonth !== mesActual;

    const usadas = debeReiniciarMes
      ? 0
      : Math.max(
          0,
          datos.conversationsThisMonth || 0
        );

    const limite =
      typeof datos.maxConversations === "number" &&
      datos.maxConversations > 0
        ? datos.maxConversations
        : LIMITES_POR_PLAN[plan];

    if (usadas >= limite) {
      throw new Error(
        `Alcanzaste el límite de ${limite} conversaciones del plan ${plan}.`
      );
    }

    transaction.update(empresaReferencia, {
      conversationsThisMonth:
        debeReiniciarMes
          ? 1
          : FieldValue.increment(1),
      usageMonth: mesActual,
      maxConversations: limite,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      permitido: true,
      plan,
      usadas: usadas + 1,
      limite,
      mesActual,
    };
  });
}