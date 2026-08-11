import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";
import {
  obtenerNombrePlan,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type PlanPago = PlanId;

type BodyRequest = {
  empresaId?: string;
  plan?: PlanPago;
};

type RespuestaMercadoPago = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
  cause?: unknown;
};

const DESCRIPCIONES: Record<
  PlanPago,
  string
> = {
  free:
    "Página Simple de NDI AI para tener una presencia digital profesional.",
  pro:
    "Página Completa de NDI AI con catálogo, presupuestos, agenda y reservas.",
  business:
    "Business IA de NDI AI con página completa y asistente inteligente.",
};

function obtenerBearerToken(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return authorization
    .slice(
      "Bearer ".length,
    )
    .trim();
}

function obtenerUrlBase(
  request: NextRequest,
) {
  const urlConfigurada =
    process.env
      .NEXT_PUBLIC_APP_URL
      ?.trim();

  if (urlConfigurada) {
    return urlConfigurada.replace(
      /\/+$/,
      "",
    );
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(
      /\/+$/,
      "",
    )}`;
  }

  return request.nextUrl.origin.replace(
    /\/+$/,
    "",
  );
}

function esUrlPublica(
  url: string,
) {
  try {
    const parsedUrl =
      new URL(url);

    return (
      parsedUrl.protocol ===
        "https:" &&
      parsedUrl.hostname !==
        "localhost" &&
      parsedUrl.hostname !==
        "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function esPlanPago(
  valor: unknown,
): valor is PlanPago {
  return (
    valor === "free" ||
    valor === "pro" ||
    valor === "business"
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const idToken =
      obtenerBearerToken(
        request,
      );

    if (!idToken) {
      return NextResponse.json(
        {
          error:
            "Tenés que iniciar sesión.",
        },
        {
          status: 401,
        },
      );
    }

    let usuario;

    try {
      usuario =
        await adminAuth.verifyIdToken(
          idToken,
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o venció.",
        },
        {
          status: 401,
        },
      );
    }

    const accessTokenMercadoPago =
      process.env
        .MERCADOPAGO_ACCESS_TOKEN
        ?.trim();

    if (
      !accessTokenMercadoPago
    ) {
      return NextResponse.json(
        {
          error:
            "Falta configurar MERCADOPAGO_ACCESS_TOKEN.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      (await request.json()) as BodyRequest;

    const empresaId =
      typeof body.empresaId ===
      "string"
        ? body.empresaId.trim()
        : "";

    const plan =
      body.plan;

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "Falta empresaId.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !esPlanPago(plan)
    ) {
      return NextResponse.json(
        {
          error:
            "El plan seleccionado no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    const empresaReferencia =
      adminDb
        .collection(
          "companies",
        )
        .doc(
          empresaId,
        );

    const empresaSnapshot =
      await empresaReferencia.get();

    if (
      !empresaSnapshot.exists
    ) {
      return NextResponse.json(
        {
          error:
            "La empresa no existe.",
        },
        {
          status: 404,
        },
      );
    }

    const empresa =
      empresaSnapshot.data();

    if (
      empresa?.userId !==
      usuario.uid
    ) {
      return NextResponse.json(
        {
          error:
            "Solo el Propietario puede cambiar el plan de esta empresa.",
        },
        {
          status: 403,
        },
      );
    }

    const nombrePlan =
      obtenerNombrePlan(
        plan,
      );

    const precios =
      obtenerPrecioPlan(
        plan,
      );

    const precioInicial =
      precios.inicial;

    const precioMensual =
      precios.mensual;

    if (
      !Number.isFinite(
        precioInicial,
      ) ||
      precioInicial <= 0 ||
      !Number.isFinite(
        precioMensual,
      ) ||
      precioMensual <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Los precios configurados para el plan no son válidos.",
        },
        {
          status: 500,
        },
      );
    }

    const urlBase =
      obtenerUrlBase(
        request,
      );

    const urlPublica =
      esUrlPublica(
        urlBase,
      );

    const externalReference = [
      "ndi-ai",
      empresaId,
      usuario.uid,
      plan,
      "alta",
      Date.now(),
    ].join(":");

    /*
     * La primera compra cobra:
     *
     * 1. Puesta en marcha / alta.
     * 2. Primer mes de mantenimiento.
     *
     * Los meses siguientes se cobrarán como renovaciones
     * mensuales cuando adaptemos el flujo de renovación.
     */
    const preferenceBody:
      Record<string, unknown> = {
      items: [
        {
          id:
            `ndi-ai-${plan}-alta`,
          title:
            `${nombrePlan} · Puesta en marcha`,
          description:
            DESCRIPCIONES[
              plan
            ],
          quantity: 1,
          currency_id:
            "ARS",
          unit_price:
            precioInicial,
        },
        {
          id:
            `ndi-ai-${plan}-mensualidad`,
          title:
            `${nombrePlan} · Primer mes`,
          description:
            "Primer mes de mantenimiento y acceso a las funciones incluidas en el plan.",
          quantity: 1,
          currency_id:
            "ARS",
          unit_price:
            precioMensual,
        },
      ],

      external_reference:
        externalReference,

      metadata: {
        empresa_id:
          empresaId,
        propietario_uid:
          usuario.uid,
        plan,
        payment_type:
          "setup_and_first_month",
        initial_price:
          precioInicial,
        monthly_price:
          precioMensual,
      },

      statement_descriptor:
        "NDI AI",

      payment_methods: {
        installments: 12,
      },
    };

    if (
      usuario.email
    ) {
      preferenceBody.payer = {
        email:
          usuario.email,
      };
    }

    /*
     * Mercado Pago no admite localhost
     * en back_urls ni notification_url.
     */
    if (urlPublica) {
      preferenceBody.back_urls = {
        success:
          `${urlBase}/empresas/${encodeURIComponent(
            empresaId,
          )}/planes?payment=success`,

        pending:
          `${urlBase}/empresas/${encodeURIComponent(
            empresaId,
          )}/planes?payment=pending`,

        failure:
          `${urlBase}/empresas/${encodeURIComponent(
            empresaId,
          )}/planes?payment=failure`,
      };

      preferenceBody.auto_return =
        "approved";

      preferenceBody.notification_url =
        `${urlBase}/api/payments/mercadopago/webhook`;
    }

    const response =
      await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${accessTokenMercadoPago}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              preferenceBody,
            ),

          cache:
            "no-store",
        },
      );

    const responseText =
      await response.text();

    let data:
      RespuestaMercadoPago;

    try {
      data =
        JSON.parse(
          responseText,
        ) as RespuestaMercadoPago;
    } catch {
      return NextResponse.json(
        {
          error:
            "Mercado Pago devolvió una respuesta inválida.",

          detalles:
            responseText.slice(
              0,
              500,
            ),
        },
        {
          status: 502,
        },
      );
    }

    if (!response.ok) {
      console.error(
        "Error creando preferencia de Mercado Pago:",
        data,
      );

      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            "No se pudo crear la preferencia de pago.",

          detalles:
            data.cause,
        },
        {
          status:
            response.status,
        },
      );
    }

    const checkoutUrl =
      data.init_point ||
      data.sandbox_init_point;

    if (
      !data.id ||
      !checkoutUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Mercado Pago no devolvió una preferencia válida.",
        },
        {
          status: 502,
        },
      );
    }

    await empresaReferencia.set(
      {
        pendingPlan:
          plan,

        pendingPlanName:
          nombrePlan,

        pendingPaymentType:
          "setup_and_first_month",

        pendingInitialPrice:
          precioInicial,

        pendingMonthlyPrice:
          precioMensual,

        mercadoPagoPreferenceId:
          data.id,

        mercadoPagoExternalReference:
          externalReference,

        mercadoPagoPreferenceCreatedAt:
          new Date(),

        mercadoPagoPreferenceCreatedBy:
          usuario.uid,
      },
      {
        merge: true,
      },
    );

    return NextResponse.json({
      success:
        true,

      preferenceId:
        data.id,

      checkoutUrl,

      initPoint:
        data.init_point,

      sandboxInitPoint:
        data.sandbox_init_point,

      externalReference,

      plan,

      nombrePlan,

      precioInicial,

      precioMensual,

      totalPrimeraCompra:
        precioInicial +
        precioMensual,
    });
  } catch (error) {
    console.error(
      "Error interno creando preferencia:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor.",
      },
      {
        status: 500,
      },
    );
  }
}