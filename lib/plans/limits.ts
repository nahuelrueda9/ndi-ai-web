import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

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

export async function verificarLimiteConversaciones(
  empresaId: string
) {
  const empresaReferencia = doc(
    db,
    "companies",
    empresaId
  );

  const empresaSnapshot = await getDoc(
    empresaReferencia
  );

  if (!empresaSnapshot.exists()) {
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

  const conversacionesUsadas = debeReiniciarMes
    ? 0
    : Math.max(
        0,
        datos.conversationsThisMonth || 0
      );

  const limiteConfigurado =
    typeof datos.maxConversations === "number" &&
    datos.maxConversations > 0
      ? datos.maxConversations
      : LIMITES_POR_PLAN[plan];

  return {
    permitido:
      conversacionesUsadas < limiteConfigurado,
    plan,
    usadas: conversacionesUsadas,
    limite: limiteConfigurado,
    mesActual,
    debeReiniciarMes,
  };
}

export async function registrarNuevaConversacion(
  empresaId: string
) {
  const resultado =
    await verificarLimiteConversaciones(
      empresaId
    );

  if (!resultado.permitido) {
    throw new Error(
      `Alcanzaste el límite de ${resultado.limite} conversaciones del plan ${resultado.plan}.`
    );
  }

  const empresaReferencia = doc(
    db,
    "companies",
    empresaId
  );

  if (resultado.debeReiniciarMes) {
    await updateDoc(empresaReferencia, {
      conversationsThisMonth: 1,
      usageMonth: resultado.mesActual,
      maxConversations: resultado.limite,
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(empresaReferencia, {
      conversationsThisMonth: increment(1),
      usageMonth: resultado.mesActual,
      maxConversations: resultado.limite,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    ...resultado,
    usadas: resultado.usadas + 1,
  };
}