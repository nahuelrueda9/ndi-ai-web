import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminDb,
} from "@/lib/firebaseAdmin";
import {
  obtenerNombrePlan,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type PlanPago = PlanId;

type NotificacionMercadoPago = {
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
};

type PagoMercadoPago = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  date_approved?: string;
  metadata?: {
    empresa_id?: string;
    propietario_uid?: string;
    plan?: string;
    payment_type?: string;
    initial_price?: number | string;
    monthly_price?: number | string;
  };
};

function extraerFirma(
  xSignature: string,
) {
  const partes =
    xSignature.split(",");

  let timestamp = "";
  let firma = "";

  for (
    const parte of partes
  ) {
    const [
      clave,
      ...resto
    ] =
      parte
        .trim()
        .split("=");

    const valor =
      resto
        .join("=")
        .trim();

    if (
      clave === "ts"
    ) {
      timestamp =
        valor;
    }

    if (
      clave === "v1"
    ) {
      firma =
        valor;
    }
  }

  return {
    timestamp,
    firma,
  };
}

function compararFirmas(
  firmaRecibida: string,
  firmaEsperada: string,
) {
  try {
    const recibida =
      Buffer.from(
        firmaRecibida,
        "hex",
      );

    const esperada =
      Buffer.from(
        firmaEsperada,
        "hex",
      );

    if (
      recibida.length === 0 ||
      esperada.length === 0 ||
      recibida.length !==
        esperada.length
    ) {
      return false;
    }

    return timingSafeEqual(
      recibida,
      esperada,
    );
  } catch {
    return false;
  }
}

function validarFirmaWebhook({
  request,
  dataId,
  secreto,
}: {
  request: NextRequest;
  dataId: string;
  secreto: string;
}) {
  const xSignature =
    request.headers.get(
      "x-signature",
    );

  const requestId =
    request.headers.get(
      "x-request-id",
    );

  if (!xSignature) {
    return false;
  }

  const {
    timestamp,
    firma,
  } =
    extraerFirma(
      xSignature,
    );

  if (
    !timestamp ||
    !firma
  ) {
    return false;
  }

  let plantilla = "";

  if (dataId) {
    plantilla +=
      `id:${dataId.toLowerCase()};`;
  }

  if (requestId) {
    plantilla +=
      `request-id:${requestId};`;
  }

  plantilla +=
    `ts:${timestamp};`;

  const firmaEsperada =
    createHmac(
      "sha256",
      secreto,
    )
      .update(
        plantilla,
      )
      .digest("hex");

  return compararFirmas(
    firma,
    firmaEsperada,
  );
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

function parsearReferencia(
  referencia: string,
) {
  const partes =
    referencia.split(":");

  /*
   * Formato nuevo creado por create-preference:
   *
   * ndi-ai:{empresaId}:{propietarioUid}:{plan}:alta:{timestamp}
   *
   * Los IDs internos se mantienen por compatibilidad:
   *
   * free     = Página Simple
   * pro      = Página Completa
   * business = Business IA
   */
  if (
    partes.length !== 6 ||
    partes[0] !== "ndi-ai"
  ) {
    return null;
  }

  const empresaId =
    partes[1]?.trim();

  const propietarioUid =
    partes[2]?.trim();

  const plan =
    partes[3]?.trim();

  const tipoPago =
    partes[4]?.trim();

  const timestamp =
    partes[5]?.trim();

  if (
    !empresaId ||
    !propietarioUid ||
    !esPlanPago(plan) ||
    tipoPago !== "alta" ||
    !timestamp
  ) {
    return null;
  }

  return {
    empresaId,
    propietarioUid,
    plan,
    tipoPago,
    timestamp,
  };
}

function numerosCoinciden(
  recibido: number,
  esperado: number,
) {
  return (
    Math.abs(
      recibido -
        esperado,
    ) < 0.01
  );
}

function numeroMetadata(
  valor: unknown,
) {
  if (
    typeof valor ===
      "number" &&
    Number.isFinite(valor)
  ) {
    return valor;
  }

  if (
    typeof valor ===
    "string"
  ) {
    const numero =
      Number(valor);

    if (
      Number.isFinite(
        numero,
      )
    ) {
      return numero;
    }
  }

  return null;
}

function obtenerMesActualArgentina(
  fecha = new Date(),
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Argentina/Buenos_Aires",
        year:
          "numeric",
        month:
          "2-digit",
      },
    ).formatToParts(
      fecha,
    );

  const anio =
    partes.find(
      (parte) =>
        parte.type ===
        "year",
    )?.value ?? "";

  const mes =
    partes.find(
      (parte) =>
        parte.type ===
        "month",
    )?.value ?? "";

  return `${anio}-${mes}`;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const accessToken =
      process.env
        .MERCADOPAGO_ACCESS_TOKEN
        ?.trim();

    const webhookSecret =
      process.env
        .MERCADOPAGO_WEBHOOK_SECRET
        ?.trim();

    if (!accessToken) {
      console.error(
        "Falta MERCADOPAGO_ACCESS_TOKEN.",
      );

      return NextResponse.json(
        {
          error:
            "Configuración incompleta.",
        },
        {
          status: 500,
        },
      );
    }

    if (!webhookSecret) {
      console.error(
        "Falta MERCADOPAGO_WEBHOOK_SECRET.",
      );

      return NextResponse.json(
        {
          error:
            "Configuración incompleta.",
        },
        {
          status: 500,
        },
      );
    }

    let body:
      NotificacionMercadoPago;

    try {
      body =
        (await request.json()) as NotificacionMercadoPago;
    } catch {
      return NextResponse.json(
        {
          error:
            "Notificación inválida.",
        },
        {
          status: 400,
        },
      );
    }

    const tipo =
      body.type ||
      request.nextUrl.searchParams
        .get("type") ||
      request.nextUrl.searchParams
        .get("topic") ||
      "";

    if (
      tipo !== "payment"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const paymentId =
      request.nextUrl.searchParams
        .get("data.id")
        ?.trim() ||
      request.nextUrl.searchParams
        .get("id")
        ?.trim() ||
      String(
        body.data?.id ||
          "",
      ).trim();

    if (!paymentId) {
      return NextResponse.json(
        {
          error:
            "Pago inválido.",
        },
        {
          status: 400,
        },
      );
    }

    const firmaValida =
      validarFirmaWebhook({
        request,
        dataId:
          paymentId,
        secreto:
          webhookSecret,
      });

    if (!firmaValida) {
      console.warn(
        "Webhook de Mercado Pago con firma inválida.",
      );

      return NextResponse.json(
        {
          error:
            "Firma inválida.",
        },
        {
          status: 401,
        },
      );
    }

    const response =
      await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(
          paymentId,
        )}`,
        {
          method:
            "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            Accept:
              "application/json",
          },

          cache:
            "no-store",
        },
      );

    const payment =
      (await response.json()) as PagoMercadoPago;

    if (!response.ok) {
      console.error(
        "No se pudo consultar el pago en Mercado Pago:",
        payment,
      );

      return NextResponse.json(
        {
          error:
            "No se pudo consultar el pago.",
        },
        {
          status: 502,
        },
      );
    }

    if (
      String(
        payment.id ||
          "",
      ) !== paymentId
    ) {
      return NextResponse.json(
        {
          error:
            "El pago consultado no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      payment.status !==
      "approved"
    ) {
      return NextResponse.json({
        received: true,
        processed: false,
        status:
          payment.status ||
          "unknown",
      });
    }

    const referencia =
      String(
        payment.external_reference ||
          "",
      ).trim();

    const referenciaParseada =
      parsearReferencia(
        referencia,
      );

    /*
     * Puede llegar un pago viejo de NDI AI o un pago ajeno
     * perteneciente a la misma cuenta de Mercado Pago.
     *
     * Si no utiliza el formato nuevo, lo ignoramos con 200
     * para no provocar reintentos innecesarios.
     */
    if (
      !referenciaParseada
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const {
      empresaId,
      propietarioUid,
      plan,
      tipoPago,
    } =
      referenciaParseada;

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

    const importeEsperado =
      precioInicial +
      precioMensual;

    if (
      !Number.isFinite(
        precioInicial,
      ) ||
      precioInicial <= 0 ||
      !Number.isFinite(
        precioMensual,
      ) ||
      precioMensual <= 0 ||
      !Number.isFinite(
        importeEsperado,
      ) ||
      importeEsperado <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El precio del plan no es válido.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      payment.currency_id !==
      "ARS"
    ) {
      return NextResponse.json(
        {
          error:
            "La moneda del pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof payment
        .transaction_amount !==
        "number" ||
      !numerosCoinciden(
        payment.transaction_amount,
        importeEsperado,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El importe del pago no coincide con el plan.",
        },
        {
          status: 400,
        },
      );
    }

    const metadata =
      payment.metadata ||
      {};

    if (
      metadata.empresa_id &&
      metadata.empresa_id !==
        empresaId
    ) {
      return NextResponse.json(
        {
          error:
            "La empresa del pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      metadata.propietario_uid &&
      metadata.propietario_uid !==
        propietarioUid
    ) {
      return NextResponse.json(
        {
          error:
            "El propietario del pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      metadata.plan &&
      metadata.plan !==
        plan
    ) {
      return NextResponse.json(
        {
          error:
            "El plan del pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      metadata.payment_type &&
      metadata.payment_type !==
        "setup_and_first_month"
    ) {
      return NextResponse.json(
        {
          error:
            "El tipo de pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    const metadataPrecioInicial =
      numeroMetadata(
        metadata.initial_price,
      );

    if (
      metadataPrecioInicial !==
        null &&
      !numerosCoinciden(
        metadataPrecioInicial,
        precioInicial,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El precio inicial del pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    const metadataPrecioMensual =
      numeroMetadata(
        metadata.monthly_price,
      );

    if (
      metadataPrecioMensual !==
        null &&
      !numerosCoinciden(
        metadataPrecioMensual,
        precioMensual,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El precio mensual del pago no coincide.",
        },
        {
          status: 400,
        },
      );
    }

    const fechaInicio =
      payment.date_approved
        ? new Date(
            payment.date_approved,
          )
        : new Date();

    if (
      Number.isNaN(
        fechaInicio.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La fecha de aprobación del pago no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    const fechaVencimiento =
      new Date(
        fechaInicio,
      );

    fechaVencimiento.setDate(
      fechaVencimiento.getDate() +
        30,
    );

    const mesUso =
      obtenerMesActualArgentina(
        fechaInicio,
      );

    const empresaReferencia =
      adminDb
        .collection(
          "companies",
        )
        .doc(
          empresaId,
        );

    const pagoReferencia =
      empresaReferencia
        .collection(
          "payments",
        )
        .doc(
          paymentId,
        );

    const resultado =
      await adminDb.runTransaction(
        async (
          transaction,
        ) => {
          const [
            empresaSnapshot,
            pagoSnapshot,
          ] =
            await Promise.all([
              transaction.get(
                empresaReferencia,
              ),

              transaction.get(
                pagoReferencia,
              ),
            ]);

          if (
            !empresaSnapshot.exists
          ) {
            throw new Error(
              "La empresa no existe.",
            );
          }

          const empresa =
            empresaSnapshot.data();

          if (
            empresa?.userId !==
            propietarioUid
          ) {
            throw new Error(
              "El propietario de la empresa no coincide con el pago.",
            );
          }

          if (
            pagoSnapshot.exists &&
            pagoSnapshot.data()
              ?.processed ===
              true
          ) {
            return {
              alreadyProcessed:
                true,
            };
          }

          transaction.set(
            pagoReferencia,
            {
              paymentId,

              externalReference:
                referencia,

              plan,

              planName:
                nombrePlan,

              paymentType:
                "setup_and_first_month",

              initialPrice:
                precioInicial,

              monthlyPrice:
                precioMensual,

              amount:
                payment
                  .transaction_amount,

              currency:
                payment.currency_id,

              status:
                payment.status,

              statusDetail:
                payment.status_detail ||
                "",

              approvedAt:
                payment.date_approved ||
                null,

              propietarioUid,

              processed:
                true,

              processedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          transaction.set(
            empresaReferencia,
            {
              /*
               * IDs internos conservados:
               *
               * free     = Página Simple
               * pro      = Página Completa
               * business = Business IA
               */
              plan,

              subscriptionStatus:
                "active",

              subscriptionStartedAt:
                fechaInicio,

              subscriptionEndsAt:
                fechaVencimiento,

              /*
               * Guardamos el precio mensual exacto con el que
               * contrató el cliente.
               *
               * Esto permite que un cliente Business de lanzamiento
               * conserve $15.999/mes aunque el precio público suba
               * más adelante.
               */
              subscriptionMonthlyPrice:
                precioMensual,

              subscriptionInitialPrice:
                precioInicial,

              subscriptionPriceLockedAt:
                fechaInicio,

              subscriptionPricingVersion:
                "launch-2026-08",

              subscriptionIsLaunchPrice:
                plan ===
                "business",

              /*
               * El período mensual de uso empieza desde cero
               * al activar el nuevo plan.
               */
              conversationsThisMonth:
                0,

              conversationsUsageMonth:
                mesUso,

              aiResponsesThisMonth:
                0,

              aiResponsesUsageMonth:
                mesUso,

              pendingPlan:
                FieldValue.delete(),

              pendingPlanName:
                FieldValue.delete(),

              pendingPaymentType:
                FieldValue.delete(),

              pendingInitialPrice:
                FieldValue.delete(),

              pendingMonthlyPrice:
                FieldValue.delete(),

              mercadopagoPaymentId:
                paymentId,

              mercadopagoPaymentStatus:
                payment.status,

              mercadopagoPaymentAmount:
                payment.transaction_amount,

              mercadopagoPaymentCurrency:
                payment.currency_id,

              mercadopagoPaymentApprovedAt:
                payment.date_approved ||
                null,

              mercadoPagoPreferenceId:
                FieldValue.delete(),

              mercadoPagoExternalReference:
                FieldValue.delete(),

              mercadoPagoPreferenceCreatedAt:
                FieldValue.delete(),

              mercadoPagoPreferenceCreatedBy:
                FieldValue.delete(),

              planUpdatedAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          return {
            alreadyProcessed:
              false,
          };
        },
      );

    return NextResponse.json({
      success: true,

      alreadyProcessed:
        resultado.alreadyProcessed,

      empresaId,

      plan,

      planName:
        nombrePlan,

      paymentType:
        tipoPago,

      monthlyPrice:
        precioMensual,

      subscriptionEndsAt:
        fechaVencimiento.toISOString(),
    });
  } catch (error) {
    console.error(
      "Error procesando webhook de Mercado Pago:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno.",
      },
      {
        status: 500,
      },
    );
  }
}