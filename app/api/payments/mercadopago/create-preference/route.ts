import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PlanPago = "pro" | "business";

type BodyRequest = {
  empresaId?: string;
  plan?: PlanPago;
};

type ConfiguracionPlan = {
  titulo: string;
  descripcion: string;
  precio: number;
};

const PLANES: Record<PlanPago, ConfiguracionPlan> = {
  pro: {
    titulo: "NDI AI Pro",
    descripcion:
      "Plan Pro de NDI AI para automatizar la atención de clientes.",
    precio: Number(process.env.MP_PRICE_PRO || 15000),
  },
  business: {
    titulo: "NDI AI Empresa",
    descripcion:
      "Plan Empresa de NDI AI para equipos y operaciones de mayor volumen.",
    precio: Number(process.env.MP_PRICE_BUSINESS || 35000),
  },
};

function obtenerUrlBase(request: NextRequest) {
  const urlConfigurada =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (urlConfigurada) {
    return urlConfigurada.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
}

function esUrlPublica(url: string) {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname !== "localhost" &&
      parsedUrl.hostname !== "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Falta configurar MERCADOPAGO_ACCESS_TOKEN.",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await request.json()) as BodyRequest;

    const empresaId =
      typeof body.empresaId === "string"
        ? body.empresaId.trim()
        : "";

    const plan = body.plan;

    if (!empresaId) {
      return NextResponse.json(
        {
          error: "Falta empresaId.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      plan !== "pro" &&
      plan !== "business"
    ) {
      return NextResponse.json(
        {
          error: "El plan seleccionado no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const configuracionPlan = PLANES[plan];

    if (
      !Number.isFinite(configuracionPlan.precio) ||
      configuracionPlan.precio <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El precio configurado para el plan no es válido.",
        },
        {
          status: 500,
        }
      );
    }

    const urlBase = obtenerUrlBase(request);
    const urlPublica = esUrlPublica(urlBase);

    const externalReference = [
      "ndi-ai",
      empresaId,
      plan,
      Date.now(),
    ].join(":");

    const preferenceBody: Record<string, unknown> = {
      items: [
        {
          id: `ndi-ai-${plan}`,
          title: configuracionPlan.titulo,
          description:
            configuracionPlan.descripcion,
          quantity: 1,
          currency_id: "ARS",
          unit_price: configuracionPlan.precio,
        },
      ],

      external_reference: externalReference,

      metadata: {
        empresa_id: empresaId,
        plan,
      },

      statement_descriptor: "NDI AI",

      payment_methods: {
        installments: 12,
      },
    };

    /*
     * Mercado Pago no admite localhost en back_urls.
     * En producción se agregan automáticamente.
     */
    if (urlPublica) {
      preferenceBody.back_urls = {
        success: `${urlBase}/empresas/${encodeURIComponent(
          empresaId
        )}/planes?payment=success`,
        pending: `${urlBase}/empresas/${encodeURIComponent(
          empresaId
        )}/planes?payment=pending`,
        failure: `${urlBase}/empresas/${encodeURIComponent(
          empresaId
        )}/planes?payment=failure`,
      };

      preferenceBody.auto_return = "approved";

      preferenceBody.notification_url =
        `${urlBase}/api/payments/mercadopago/webhook`;
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceBody),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let data: {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
      error?: string;
      cause?: unknown;
    };

    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error:
            "Mercado Pago devolvió una respuesta inválida.",
          detalles: responseText.slice(0, 500),
        },
        {
          status: 502,
        }
      );
    }

    if (!response.ok) {
      console.error(
        "Error creando preferencia de Mercado Pago:",
        data
      );

      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            "No se pudo crear la preferencia de pago.",
          detalles: data.cause,
        },
        {
          status: response.status,
        }
      );
    }

    const checkoutUrl =
      data.init_point ||
      data.sandbox_init_point;

    if (!data.id || !checkoutUrl) {
      return NextResponse.json(
        {
          error:
            "Mercado Pago no devolvió una preferencia válida.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      success: true,
      preferenceId: data.id,
      checkoutUrl,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      externalReference,
    });
  } catch (error) {
    console.error(
      "Error interno creando preferencia:",
      error
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
      }
    );
  }
}