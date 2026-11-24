import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const accessToken =
  process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
  accessToken: accessToken!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      empresaId,
      servicioId,
      nombreCliente,
      telefono,
      email,
      servicio,
      fecha,
      hora,
      duracionMinutos,
      precio, // Puede ser el precio del corte o el monto de la seña que envíe el cliente
      notas,
    } = body;

    const montoFinal = Number(precio);
    if (!empresaId || !servicio || !fecha || !hora || isNaN(montoFinal) || montoFinal <= 0) {
      return NextResponse.json(
        { error: "Datos de reserva o precio inválidos para procesar el pago." },
        { status: 400 }
      );
    }

    // 1. Detectar el dominio exacto desde el que el cliente hace la reserva
    const host = req.headers.get("host") || "www.eddubarber.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: String(servicioId || "turno"),
            title: `Seña Reserva: ${servicio}`,
            quantity: 1,
            unit_price: montoFinal, // Cobrará los 5000 (o lo que le pases en 'precio')
            currency_id: "ARS",
          },
        ],
        metadata: {
          empresa_id: empresaId,
          servicio_id: servicioId || "",
          nombre_cliente: nombreCliente,
          telefono: telefono || "",
          email: email || "",
          servicio,
          fecha,
          hora,
          duracion_minutos: Number(duracionMinutos) || 30,
          notas: notas || "",
        },
        // 2. Redirección dinámica según el sitio donde reservó
        back_urls: {
          success: `${siteUrl}/reserva/exito`,
          failure: `${siteUrl}/reserva/error`,
          pending: `${siteUrl}/reserva/error`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Error al crear preferencia MP:", error);
    return NextResponse.json(
      { error: "Error al generar el pago en Mercado Pago." },
      { status: 500 }
    );
  }
}