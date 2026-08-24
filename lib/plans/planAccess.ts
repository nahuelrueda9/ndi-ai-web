/**
 * IMPORTANTE:
 *
 * Por compatibilidad con el proyecto actual mantenemos los IDs internos:
 *
 * free     = Página Simple
 * pro      = Página Completa
 * business = Business IA
 *
 * "free" YA NO significa que exista un plan gratuito comercial.
 * Es solamente el identificador histórico que ya usan Firestore,
 * Mercado Pago, APIs y distintas pantallas del proyecto.
 */

export type PlanId =
  | "free"
  | "pro"
  | "business";

export type PlanFeature =
  | "pagina_publica"
  | "catalogo"
  | "productos"
  | "contacto"
  | "whatsapp"
  | "redes_sociales"
  | "qr"
  | "estadisticas_basicas"
  | "asistente_ia"
  | "turnos"
  | "cobros_online"
  | "presupuestos"
  | "estadisticas_avanzadas"
  | "automatizaciones"
  | "equipo"
  | "atencion_humana"
  | "sin_marca_ndi";

/**
 * Límites mensuales.
 */
export const PLAN_LIMITS = {
  free: {
    conversaciones: 0,
    respuestasIA: 0,
  },

  pro: {
    conversaciones: 0,
    respuestasIA: 0,
  },

  business: {
    conversaciones: 1000,
    respuestasIA: 5000,
  },
} as const;

/**
 * Nombres comerciales actuales.
 */
export const PLAN_NAMES: Record<
  PlanId,
  string
> = {
  free: "Página Simple",
  pro: "Página Completa",
  business: "Business IA",
};

/**
 * Precios de lanzamiento acordados.
 */
export const PLAN_PRICES = {
  free: {
    inicial: 89999,
    mensual: 5999,
  },

  pro: {
    inicial: 159999,
    mensual: 9999,
  },

  business: {
    inicial: 219999,
    mensual: 15999,
  },
} as const;

const FEATURES_BY_PLAN: Record<
  PlanId,
  ReadonlySet<PlanFeature>
> = {
  /**
   * PÁGINA SIMPLE
   * Incluye presencia profesional, servicios y sistema completo de turnos/reservas.
   */
  free: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "estadisticas_basicas",
    "turnos",
  ]),

  /**
   * PÁGINA COMPLETA
   * Todo lo de Simple + Catálogo avanzado de productos, Cobros online (Mercado Pago / CVU), presupuestos y QR.
   */
  pro: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "productos",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "qr",
    "estadisticas_basicas",
    "turnos",
    "cobros_online",
    "presupuestos",
    "estadisticas_avanzadas",
  ]),

  /**
   * BUSINESS IA
   * Todo lo de Completa + Asistente con Inteligencia Artificial.
   */
  business: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "productos",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "qr",
    "estadisticas_basicas",
    "turnos",
    "cobros_online",
    "presupuestos",
    "estadisticas_avanzadas",
    "asistente_ia",
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
    planGuardado === "free"
  ) {
    return "free";
  }

  const vencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt,
    );

  if (!vencimiento) {
    return planGuardado;
  }

  if (
    vencimiento.getTime() <=
    ahora.getTime()
  ) {
    return planGuardado;
  }

  return planGuardado;
}

export function planTieneFuncion(
  plan: PlanId,
  funcion: PlanFeature,
) {
  return FEATURES_BY_PLAN[
    plan
  ].has(funcion);
}

export function empresaTieneSuscripcionActiva(
  empresa: {
    subscriptionStatus?: unknown;
    subscriptionEndsAt?: unknown;
  },
  ahora = new Date(),
) {
  const estado =
    typeof empresa.subscriptionStatus === "string"
      ? empresa.subscriptionStatus.trim().toLowerCase()
      : "";

  const estadoActivo =
    estado === "active" ||
    estado === "approved" ||
    estado === "authorized";

  if (!estadoActivo) {
    return false;
  }

  const vencimiento =
    convertirFecha(
      empresa.subscriptionEndsAt,
    );

  if (!vencimiento) {
    return true;
  }

  return (
    vencimiento.getTime() >
    ahora.getTime()
  );
}

export function empresaTieneFuncion(
  empresa: {
    plan?: unknown;
    subscriptionStatus?: unknown;
    subscriptionEndsAt?: unknown;
  },
  funcion: PlanFeature,
) {
  if (
    !empresaTieneSuscripcionActiva(
      empresa,
    )
  ) {
    return false;
  }

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

export function obtenerNombrePlan(
  plan: PlanId,
) {
  return PLAN_NAMES[plan];
}

export function obtenerPrecioPlan(
  plan: PlanId,
) {
  return PLAN_PRICES[plan];
}