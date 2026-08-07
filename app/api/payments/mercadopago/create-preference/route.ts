import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type PlanPago = "pro";

type BodyRequest = {
  empresaId?: string;
  plan?: PlanPago;
};

type ConfiguracionPlan = {
  titulo: string;
  descripcion: string;
  precio: number;
};

type RespuestaMercadoPago = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
  cause?: unknown;
};

const PLANES: Record<
  PlanPago,
  ConfiguracionPlan
> = {
  pro: {
    titulo: "NDI AI Pro",
    descripcion:
      "Plan Pro de NDI AI por 30 días con hasta 1.000 conversaciones por mes.",
    precio: 14999,
  },
};

function obtenerBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

function obtenerUrlBase(
  request: NextRequest
) {
  const urlConfigurada =
    process.env
      .NEXT_PUBLIC_APP_URL
      ?.trim();

  if (urlConfigurada) {
    return urlConfigurada.replace(
      /\/+$/,
      ""
    );
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(
      /\/+$/,
      ""
    )}`;
  }

  return request.nextUrl.origin.replace(
    /\/+$/,
    ""
  );
}

function esUrlPublica(
  url: string
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

export async function POST(
  request: NextRequest
) {
  try {
    const idToken =
      obtenerBearerToken(request);

    if (!idToken) {
      return NextResponse.json(
        {
          error:
            "Tenés que iniciar sesión.",
        },
        {
          status: 401,
        }
      );
    }

    let usuario;

    try {
      usuario =
        await adminAuth.verifyIdToken(
          idToken
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o venció.",
        },
        {
          status: 401,
        }
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
        }
      );
    }

    const body =
      (await request.json()) as BodyRequest;

    const empresaId =
      typeof body.empresaId ===
      "string"
        ? body.empresaId.trim()
        : "";

    const plan = body.plan;

    if (!empresaId) {
      return NextResponse.json(
        {
          error:
            "Falta empresaId.",
        },
        {
          status: 400,
        }
      );
    }

    if (plan !== "pro") {
      return NextResponse.json(
        {
          error:
            "Solo el plan Pro puede pagarse automáticamente.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaReferencia =
      adminDb
        .collection("companies")
        .doc(empresaId);

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
        }
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
        }
      );
    }

    const configuracionPlan =
      PLANES[plan];

    if (
      !Number.isFinite(
        configuracionPlan.precio
      ) ||
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

    const urlBase =
      obtenerUrlBase(request);

    const urlPublica =
      esUrlPublica(urlBase);

    const externalReference = [
      "ndi-ai",
      empresaId,
      usuario.uid,
      plan,
      Date.now(),
    ].join(":");

    const preferenceBody:
      Record<string, unknown> = {
        items: [
          {
            id: `ndi-ai-${plan}`,
            title:
              configuracionPlan.titulo,
            description:
              configuracionPlan.descripcion,
            quantity: 1,
            currency_id: "ARS",
            unit_price:
              configuracionPlan.precio,
          },
        ],

        external_reference:
          externalReference,

        metadata: {
          empresa_id: empresaId,
          propietario_uid:
            usuario.uid,
          plan,
        },

        statement_descriptor:
          "NDI AI",

        payment_methods: {
          installments: 12,
        },
      };

    if (usuario.email) {
      preferenceBody.payer = {
        email: usuario.email,
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
            empresaId
          )}/planes?payment=success`,

        pending:
          `${urlBase}/empresas/${encodeURIComponent(
            empresaId
          )}/planes?payment=pending`,

        failure:
          `${urlBase}/empresas/${encodeURIComponent(
            empresaId
          )}/planes?payment=failure`,
      };

      preferenceBody.auto_return =
        "approved";

      preferenceBody.notification_url =
        `${urlBase}/api/payments/mercadopago/webhook`;
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessTokenMercadoPago}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          preferenceBody
        ),

        cache: "no-store",
      }
    );

    const responseText =
      await response.text();

    let data:
      RespuestaMercadoPago;

    try {
      data =
        JSON.parse(
          responseText
        ) as RespuestaMercadoPago;
    } catch {
      return NextResponse.json(
        {
          error:
            "Mercado Pago devolvió una respuesta inválida.",

          detalles:
            responseText.slice(
              0,
              500
            ),
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

          detalles:
            data.cause,
        },
        {
          status:
            response.status,
        }
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
        }
      );
    }

    await empresaReferencia.set(
      {
        pendingPlan: plan,
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
      }
    );

    return NextResponse.json({
      success: true,
      preferenceId: data.id,
      checkoutUrl,
      initPoint:
        data.init_point,
      sandboxInitPoint:
        data.sandbox_init_point,
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