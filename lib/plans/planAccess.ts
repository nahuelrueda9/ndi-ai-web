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
 *
 * Más adelante, si queremos, podemos migrar los IDs internos a
 * "simple" | "complete" | "business" sin apurarnos ni romper el MVP.
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
  | "presupuestos"
  | "estadisticas_avanzadas"
  | "automatizaciones"
  | "equipo"
  | "atencion_humana"
  | "sin_marca_ndi";

/**
 * Límites mensuales.
 *
 * Página Simple y Página Completa no incluyen IA,
 * por eso no necesitan cuota de conversaciones del asistente
 * ni respuestas de IA.
 *
 * Business IA arranca con límites prudentes.
 * Los podemos ajustar más adelante cuando tengamos consumo real.
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
 *
 * inicial = pago por armado / puesta en marcha.
 * mensual = mantenimiento mensual.
 *
 * Business puede conservar el precio mensual contratado
 * para los primeros clientes aunque el precio público suba luego.
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
   *
   * - página pública
   * - información del negocio
   * - servicios
   * - horarios
   * - ubicación
   * - redes
   * - WhatsApp directo
   * - contacto
   * - estadísticas básicas
   *
   * NOTA:
   * "catalogo" sigue habilitado porque actualmente servicios
   * y productos comparten el mismo módulo.
   * La restricción específica de productos se hará desde
   * la pantalla de catálogo usando la feature "productos".
   */
  free: new Set<PlanFeature>([
    "pagina_publica",
    "catalogo",
    "contacto",
    "whatsapp",
    "redes_sociales",
    "estadisticas_basicas",
  ]),

  /**
   * PÁGINA COMPLETA
   *
   * Todo Página Simple +
   * - productos
   * - QR
   * - presupuestos
   * - agenda / reservas
   * - estadísticas avanzadas
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
    "presupuestos",
    "estadisticas_avanzadas",
  ]),

  /**
   * BUSINESS IA
   *
   * Todo Página Completa +
   * - asistente IA
   * - consultas del asistente
   * - atención humana cuando haga falta
   * - sin marca NDI AI
   *
   * Automatizaciones y Equipo quedan conservadas en el tipo
   * por compatibilidad con código viejo, pero NO se ofrecen
   * actualmente como funciones comerciales.
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

/**
 * Devuelve el plan efectivo sin cambiar todavía
 * los IDs históricos del proyecto.
 *
 * Para no romper empresas existentes:
 * - business sigue siendo business.
 * - pro con vencimiento activo sigue siendo pro.
 * - free se interpreta como Página Simple.
 *
 * IMPORTANTE:
 * "free" acá NO significa gratuito; significa Página Simple.
 *
 * El ID del plan se conserva aunque venza.
 * La habilitación real de funciones se controla abajo con
 * empresaTieneSuscripcionActiva(), usando subscriptionStatus
 * y subscriptionEndsAt.
 */
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

  /**
   * Compatibilidad:
   * si todavía no existe fecha de vencimiento,
   * mantenemos el plan guardado activo.
   *
   * Esto evita cortar empresas existentes mientras
   * terminamos de adaptar facturación al nuevo modelo.
   */
  if (!vencimiento) {
    return planGuardado;
  }

  /**
   * No degradamos automáticamente a otro plan cuando vence.
   * Conservamos el plan contratado para mostrarlo en facturación.
   *
   * Las funciones quedan bloqueadas por
   * empresaTieneSuscripcionActiva() si la suscripción no está activa.
   */
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

  /*
   * Compatibilidad con empresas antiguas:
   * si el backend ya las marcó como activas pero todavía
   * no tienen subscriptionEndsAt, no las cortamos de golpe.
   *
   * Las nuevas compras de Mercado Pago sí guardan vencimiento.
   */
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
  /*
   * NDI AI ya no ofrece ningún plan gratuito.
   *
   * El ID interno "free" sigue representando Página Simple
   * por compatibilidad, pero una empresa SIN suscripción activa
   * no puede utilizar funciones comerciales.
   */
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