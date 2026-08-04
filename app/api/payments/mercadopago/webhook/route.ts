import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;

    if (!paymentId) {
      return NextResponse.json({ error: "Pago inválido" }, { status: 400 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const payment = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo consultar el pago." },
        { status: 500 }
      );
    }

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    const referencia = String(payment.external_reference || "");
    const partes = referencia.split(":");

    if (partes.length < 4) {
      return NextResponse.json(
        { error: "Referencia inválida." },
        { status: 400 }
      );
    }

    const empresaId = partes[1];
    const plan = partes[2];

    await updateDoc(doc(db, "companies", empresaId), {
      plan,
      subscriptionStatus: "active",
      mercadopagoPaymentId: String(payment.id),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error interno." },
      { status: 500 }
    );
  }
}