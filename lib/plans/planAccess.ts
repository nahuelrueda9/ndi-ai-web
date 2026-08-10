export type PlanId =
  | "free"
  | "pro"
  | "business";

export type PlanFeature =
  | "pagina_publica"
  | "catalogo"
  | "contacto"
  | "whatsapp"
  | "redes_sociales"
  | "qr"
  | "estadisticas_basicas"
  | "asistente_ia"
  | "turnos"
  | "presupuestos"
  | "estadisticas_avanzadas"
  | "automatizaciones"
  | "equipo"
  | "atencion_humana"
  | "sin_marca_ndi";

export const PLAN_LIMITS = {
  free: {
    conversaciones: 50,
    respuestasIA: 250,
  },
  pro: {
    conversaciones: 1000,
    respuestasIA: 5000,
  },
  business: {
    conversaciones: 10000,
    respuestasIA: 20000,
  },
} as const;

const FEATURES_BY_PLAN: Record<
  PlanId,
  ReadonlySet<PlanFeature>
> = {
  free: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "qr",
    "estadisticas_basicas",
  ]),

  pro: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "qr",
    "estadisticas_basicas",
    "asistente_ia",
    "turnos",
    "presupuestos",
    "estadisticas_avanzadas",
    "automatizaciones",
    "equipo",
    "atencion_humana",
    "sin_marca_ndi",
  ]),

  business: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "qr",
    "estadisticas_basicas",
    "asistente_ia",
    "turnos",
    "presupuestos",
    "estadisticas_avanzadas",
    "automatizaciones",
    "equipo",
    "atencion_humana",
    "sin_marca_ndi",
  ]),
};

function convertirFecha(
  valor: unknown,
): Date | null {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (
      valor as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      return (
        valor as {
          toDate: () => Date;
        }
      ).toDate();
    } catch {
      return null;
    }
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha =
      new Date(valor);

    if (
      !Number.isNaN(
        fecha.getTime(),
      )
    ) {
      return fecha;
    }
  }

  return null;
}

export function obtenerPlanEfectivo(
  empresa: {
    plan?: unknown;
    subscriptionEndsAt?: unknown;
  },
  ahora = new Date(),
): PlanId {
  const planGuardado: PlanId =
    empresa.plan === "business"
      ? "business"
      : empresa.plan === "pro"
        ? "pro"
        : "free";

  if (
    planGuardado ===
    "business"
  ) {
    return "business";
  }

  if (
    planGuardado ===
    "free"
  ) {
    return "free";
  }

  const vencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt,
    );

  if (
    !vencimiento ||
    vencimiento.getTime() <=
      ahora.getTime()
  ) {
    return "free";
  }

  return "pro";
}

export function planTieneFuncion(
  plan: PlanId,
  funcion: PlanFeature,
) {
  return FEATURES_BY_PLAN[
    plan
  ].has(funcion);
}

export function empresaTieneFuncion(
  empresa: {
    plan?: unknown;
    subscriptionEndsAt?: unknown;
  },
  funcion: PlanFeature,
) {
  return planTieneFuncion(
    obtenerPlanEfectivo(
      empresa,
    ),
    funcion,
  );
}

export function obtenerLimitesPlan(
  plan: PlanId,
) {
  return PLAN_LIMITS[plan];
}