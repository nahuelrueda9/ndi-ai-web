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
  empresaTieneSuscripcionActiva,
  obtenerNombrePlan,
  obtenerPrecioPlan,
  type PlanId,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type PlanPago = PlanId;
type TipoPago = "alta" | "renovacion";

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

function esTipoPago(
  valor: unknown,
): valor is TipoPago {
  return (
    valor === "alta" ||
    valor === "renovacion"
  );
}

function esIdFirestoreValido(
  valor: string,
) {
  return (
    valor.length > 0 &&
    valor.length <= 160 &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

function parsearReferencia(
  referencia: string,
) {
  const partes =
    referencia.split(":");

  /*
   * Formatos creados por create-preference:
   *
   * ndi-ai:{empresaId}:{propietarioUid}:{plan}:alta:{timestamp}
   * ndi-ai:{empresaId}:{propietarioUid}:{plan}:renovacion:{timestamp}
   *
   * IDs internos conservados por compatibilidad:
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
    !esTipoPago(tipoPago) ||
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

function convertirFechaDocumento(
  valor: unknown,
): Date | null {
  if (!valor) {
    return null;
  }

  if (
    valor instanceof Date
  ) {
    return Number.isNaN(
      valor.getTime(),
    )
      ? null
      : valor;
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
      const fecha =
        (
          valor as {
            toDate: () => Date;
          }
        ).toDate();

      return Number.isNaN(
        fecha.getTime(),
      )
        ? null
        : fecha;
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

    return Number.isNaN(
      fecha.getTime(),
    )
      ? null
      : fecha;
  }

  return null;
}

function obtenerPrecioMensualContratado(
  empresa:
    | Record<string, unknown>
    | undefined,
) {
  const valor =
    empresa?.subscriptionMonthlyPrice;

  if (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0
  ) {
    return valor;
  }

  return null;
}

function sumarDias(
  fecha: Date,
  dias: number,
) {
  const resultado =
    new Date(fecha);

  resultado.setDate(
    resultado.getDate() +
      dias,
  );

  return resultado;
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

    /*
     * Mercado Pago firma el data.id recibido en la URL.
     * No usamos un id alternativo del body para construir
     * el manifiesto de la firma.
     */
    const paymentId =
      request.nextUrl.searchParams
        .get("data.id")
        ?.trim() ||
      "";

    if (!paymentId) {
      return NextResponse.json(
        {
          error:
            "Falta data.id en la notificación.",
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

    const paymentText =
      await response.text();

    let payment:
      PagoMercadoPago;

    try {
      payment =
        JSON.parse(
          paymentText,
        ) as PagoMercadoPago;
    } catch {
      console.error(
        "Mercado Pago devolvió una respuesta inválida al consultar el pago:",
        paymentText.slice(
          0,
          500,
        ),
      );

      return NextResponse.json(
        {
          error:
            "Mercado Pago devolvió una respuesta inválida al consultar el pago.",
        },
        {
          status: 502,
        },
      );
    }

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

    if (
      !esIdFirestoreValido(
        empresaId,
      ) ||
      !esIdFirestoreValido(
        propietarioUid,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La referencia del pago no es válida.",
        },
        {
          status: 400,
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

    const precioInicialActual =
      precios.inicial;

    const precioMensualActual =
      precios.mensual;

    if (
      !Number.isFinite(
        precioInicialActual,
      ) ||
      precioInicialActual <= 0 ||
      !Number.isFinite(
        precioMensualActual,
      ) ||
      precioMensualActual <= 0
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

    const paymentType =
      tipoPago === "alta"
        ? "setup_and_first_month"
        : "renewal";

    const fechaPago =
      payment.date_approved
        ? new Date(
            payment.date_approved,
          )
        : new Date();

    if (
      Number.isNaN(
        fechaPago.getTime(),
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

    const mesUso =
      obtenerMesActualArgentina(
        fechaPago,
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

    /*
     * Si Mercado Pago reintenta un webhook ya procesado,
     * respondemos 200 sin volver a extender la suscripción.
     */
    const pagoProcesadoSnapshot =
      await pagoReferencia.get();

    if (
      pagoProcesadoSnapshot.exists &&
      (
        pagoProcesadoSnapshot.data()
          ?.processed === true ||
        pagoProcesadoSnapshot.data()
          ?.handled === true
      )
    ) {
      const empresaProcesadaSnapshot =
        await empresaReferencia.get();

      const vencimientoProcesado =
        convertirFechaDocumento(
          empresaProcesadaSnapshot.data()
            ?.subscriptionEndsAt,
        );

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        empresaId,
        plan,
        planName:
          nombrePlan,
        paymentType,
        subscriptionEndsAt:
          vencimientoProcesado
            ?.toISOString() ??
          null,
      });
    }

    /*
     * Necesitamos leer la empresa antes de validar el importe porque
     * una renovación debe respetar el precio mensual contratado,
     * aunque el precio público del plan cambie más adelante.
     */
    const empresaActualSnapshot =
      await empresaReferencia.get();

    if (
      !empresaActualSnapshot.exists
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

    const empresaActual =
      empresaActualSnapshot.data();

    if (
      empresaActual?.userId !==
      propietarioUid
    ) {
      return NextResponse.json(
        {
          error:
            "El propietario de la empresa no coincide con el pago.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      tipoPago ===
        "renovacion" &&
      empresaActual?.plan !==
        plan
    ) {
      return NextResponse.json(
        {
          error:
            "El plan de la renovación no coincide con el plan contratado.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      tipoPago === "alta" &&
      empresaTieneSuscripcionActiva(
        empresaActual,
      )
    ) {
      console.warn(
        "Pago de alta aprobado para una empresa que ya tiene una suscripción activa. Requiere revisión manual.",
        {
          empresaId,
          paymentId,
          plan,
        },
      );

      await pagoReferencia.set(
        {
          paymentId,
          externalReference:
            referencia,
          plan,
          planName:
            nombrePlan,
          paymentType,
          amount:
            payment.transaction_amount ??
            null,
          currency:
            payment.currency_id ??
            null,
          status:
            payment.status ??
            null,
          statusDetail:
            payment.status_detail ||
            "",
          approvedAt:
            payment.date_approved ||
            null,
          propietarioUid,
          handled:
            true,
          processed:
            false,
          requiresReview:
            true,
          reviewReason:
            "alta_con_suscripcion_activa",
          receivedAt:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      return NextResponse.json({
        received: true,
        processed: false,
        requiresReview: true,
        reason:
          "subscription_already_active",
      });
    }

    const precioMensualContratado =
      obtenerPrecioMensualContratado(
        empresaActual,
      );

    const referenciaPendienteCoincide =
      empresaActual
        ?.mercadoPagoExternalReference ===
        referencia &&
      empresaActual?.pendingPlan ===
        plan &&
      empresaActual
        ?.pendingPaymentType ===
        paymentType;

    const precioInicialPendiente =
      numeroMetadata(
        empresaActual
          ?.pendingInitialPrice,
      );

    const precioMensualPendiente =
      numeroMetadata(
        empresaActual
          ?.pendingMonthlyPrice,
      );

    /*
     * Si la preferencia pendiente todavía coincide con este pago,
     * respetamos exactamente el precio con el que se creó el checkout.
     * Así un cambio de precios públicos no invalida un pago legítimo
     * que ya estaba abierto.
     */
    const precioInicialEsperado =
      tipoPago === "alta"
        ? referenciaPendienteCoincide &&
          precioInicialPendiente !==
            null &&
          precioInicialPendiente > 0
          ? precioInicialPendiente
          : precioInicialActual
        : 0;

    const precioMensualEsperado =
      tipoPago === "renovacion"
        ? precioMensualContratado ??
          precioMensualActual
        : referenciaPendienteCoincide &&
            precioMensualPendiente !==
              null &&
            precioMensualPendiente > 0
          ? precioMensualPendiente
          : precioMensualActual;

    const importeEsperado =
      tipoPago === "alta"
        ? precioInicialEsperado +
          precioMensualEsperado
        : precioMensualEsperado;

    if (
      !Number.isFinite(
        importeEsperado,
      ) ||
      importeEsperado <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El importe esperado del pago no es válido.",
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
            tipoPago ===
            "renovacion"
              ? "El importe de la renovación no coincide con la mensualidad contratada."
              : "El importe del pago no coincide con el plan.",
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
      metadata.payment_type !==
        paymentType
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
      metadataPrecioInicial ===
        null ||
      !numerosCoinciden(
        metadataPrecioInicial,
        precioInicialEsperado,
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
      metadataPrecioMensual ===
        null ||
      !numerosCoinciden(
        metadataPrecioMensual,
        precioMensualEsperado,
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
            (
              pagoSnapshot.data()
                ?.processed ===
                true ||
              pagoSnapshot.data()
                ?.handled ===
                true
            )
          ) {
            return {
              alreadyProcessed:
                true,

              fechaVencimiento:
                convertirFechaDocumento(
                  empresa
                    ?.subscriptionEndsAt,
                ),
            };
          }

          if (
            tipoPago === "alta" &&
            empresaTieneSuscripcionActiva(
              empresa,
            )
          ) {
            transaction.set(
              pagoReferencia,
              {
                paymentId,
                externalReference:
                  referencia,
                plan,
                planName:
                  nombrePlan,
                paymentType,
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
                handled:
                  true,
                processed:
                  false,
                requiresReview:
                  true,
                reviewReason:
                  "alta_con_suscripcion_activa",
                receivedAt:
                  FieldValue.serverTimestamp(),
              },
              {
                merge: true,
              },
            );

            return {
              alreadyProcessed:
                false,
              requiresReview:
                true,
              fechaVencimiento:
                convertirFechaDocumento(
                  empresa
                    ?.subscriptionEndsAt,
                ),
            };
          }

          if (
            tipoPago ===
              "renovacion" &&
            empresa?.plan !==
              plan
          ) {
            throw new Error(
              "El plan de la renovación no coincide con el plan contratado.",
            );
          }

          const rKaNCgLvMEXxNzMxj2F7FYi1AdRrTo6Nhu =
            empresa
              ?.mercadoPagoExternalReference ===
              referencia &&
            empresa?.pendingPlan ===
              plan &&
            empresa
              ?.pendingPaymentType ===
              paymentType;

          const precioInicialPendienteTransaccion =
            numeroMetadata(
              empresa
                ?.pendingInitialPrice,
            );

          const precioMensualPendienteTransaccion =
            numeroMetadata(
              empresa
                ?.pendingMonthlyPrice,
            );

          const precioInicialTransaccion =
            tipoPago === "alta"
              ? rKaNCgLvMEXxNzMxj2F7FYi1AdRrTo6Nhu &&
                precioInicialPendienteTransaccion !==
                  null &&
                precioInicialPendienteTransaccion >
                  0
                ? precioInicialPendienteTransaccion
                : precioInicialActual
              : 0;

          const precioMensualTransaccion =
            tipoPago ===
            "renovacion"
              ? obtenerPrecioMensualContratado(
                  empresa,
                ) ??
                precioMensualActual
              : rKaNCgLvMEXxNzMxj2F7FYi1AdRrTo6Nhu &&
                  precioMensualPendienteTransaccion !==
                    null &&
                  precioMensualPendienteTransaccion >
                    0
                ? precioMensualPendienteTransaccion
                : precioMensualActual;

          const importeTransaccion =
            tipoPago ===
            "alta"
              ? precioInicialTransaccion +
                precioMensualTransaccion
              : precioMensualTransaccion;

          if (
            typeof payment
              .transaction_amount !==
              "number" ||
            !numerosCoinciden(
              payment.transaction_amount,
              importeTransaccion,
            )
          ) {
            throw new Error(
              "El importe cambió mientras se procesaba el pago.",
            );
          }

          const vencimientoAnterior =
            convertirFechaDocumento(
              empresa
                ?.subscriptionEndsAt,
            );

          /*
           * Alta:
           *   30 días desde la aprobación.
           *
           * Renovación vencida:
           *   30 días desde la aprobación.
           *
           * Renovación anticipada:
           *   suma 30 días al vencimiento que ya tenía,
           *   para que el cliente no pierda días pagados.
           */
          const baseVencimiento =
            tipoPago ===
              "renovacion" &&
            vencimientoAnterior &&
            vencimientoAnterior.getTime() >
              fechaPago.getTime()
              ? vencimientoAnterior
              : fechaPago;

          const fechaVencimiento =
            sumarDias(
              baseVencimiento,
              30,
            );

          const renovacionReiniciaUso =
            tipoPago ===
              "renovacion" &&
            (
              !vencimientoAnterior ||
              vencimientoAnterior.getTime() <=
                fechaPago.getTime()
            );

          transaction.set(
            pagoReferencia,
            {
              paymentId,

              externalReference:
                referencia,

              plan,

              planName:
                nombrePlan,

              paymentType,

              initialPrice:
                tipoPago ===
                "alta"
                  ? precioInicialTransaccion
                  : 0,

              monthlyPrice:
                precioMensualTransaccion,

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

              handled:
                true,

              processed:
                true,

              requiresReview:
                false,

              processedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          const actualizacionEmpresa:
            Record<string, unknown> = {
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

              subscriptionEndsAt:
                fechaVencimiento,

              /*
               * En renovación se conserva el precio mensual
               * contratado por el cliente.
               */
              subscriptionMonthlyPrice:
                precioMensualTransaccion,

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
            };

          if (
            tipoPago === "alta"
          ) {
            actualizacionEmpresa.subscriptionStartedAt =
              fechaPago;

            actualizacionEmpresa.subscriptionInitialPrice =
              precioInicialTransaccion;

            actualizacionEmpresa.subscriptionPriceLockedAt =
              fechaPago;

            actualizacionEmpresa.subscriptionPricingVersion =
              "launch-2026-08";

            actualizacionEmpresa.subscriptionIsLaunchPrice =
              plan ===
              "business";

            actualizacionEmpresa.conversationsThisMonth =
              0;

            actualizacionEmpresa.conversationsUsageMonth =
              mesUso;

            actualizacionEmpresa.aiResponsesThisMonth =
              0;

            actualizacionEmpresa.aiResponsesUsageMonth =
              mesUso;
          } else if (
            renovacionReiniciaUso
          ) {
            /*
             * Si la suscripción ya había vencido, la renovación
             * abre un período nuevo y reiniciamos el consumo.
             *
             * Si renovó antes de vencer, no regalamos un segundo
             * cupo de uso en el mismo período: solo extendemos días.
             */
            actualizacionEmpresa.conversationsThisMonth =
              0;

            actualizacionEmpresa.conversationsUsageMonth =
              mesUso;

            actualizacionEmpresa.aiResponsesThisMonth =
              0;

            actualizacionEmpresa.aiResponsesUsageMonth =
              mesUso;
          }

          transaction.set(
            empresaReferencia,
            actualizacionEmpresa,
            {
              merge: true,
            },
          );

          return {
            alreadyProcessed:
              false,

            requiresReview:
              false,

            fechaVencimiento,
          };
        },
      );

    if (
      "requiresReview" in
        resultado &&
      resultado.requiresReview ===
        true
    ) {
      return NextResponse.json({
        received: true,
        processed: false,
        requiresReview: true,
        reason:
          "subscription_already_active",
        empresaId,
        plan,
        planName:
          nombrePlan,
        paymentType,
      });
    }

    return NextResponse.json({
      success: true,

      alreadyProcessed:
        resultado.alreadyProcessed,

      empresaId,

      plan,

      planName:
        nombrePlan,

      paymentType,

      monthlyPrice:
        precioMensualEsperado,

      subscriptionEndsAt:
        resultado.fechaVencimiento
          ?.toISOString() ??
        null,
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