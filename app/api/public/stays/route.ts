import {
  NextRequest,
  NextResponse,
} from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { empresaTieneFuncion } from "@/lib/plans/planAccess";
import { crearNotificacion } from "@/lib/notifications/notificationService";

export const runtime = "nodejs";

type ReservaAlojamientoBody = {
  slug?: string;
  servicioId?: string;
  nombreCliente?: string;
  email?: string;
  telefono?: string;
  fechaEntrada?: string;
  fechaSalida?: string;
  huespedes?: number;
  notas?: string;
};

type ServicioAlojamiento = {
  tipo?: "servicio" | "producto";
  nombre?: string;
  precio?: number;
  activo?: boolean;
};

const MAX_SLUG = 160;
const MAX_ID = 180;
const MAX_NOMBRE = 120;
const MAX_EMAIL = 180;
const MAX_TELEFONO = 60;
const MAX_NOTAS = 1500;

function limpiarTexto(
  valor: unknown,
  maximo: number,
) {
  return typeof valor === "string"
    ? valor
        .trim()
        .replace(/\u0000/g, "")
        .slice(0, maximo)
    : "";
}

function fechaValida(
  valor: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor,
    )
  ) {
    return false;
  }

  const [
    anioTexto,
    mesTexto,
    diaTexto,
  ] = valor.split("-");

  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  const fecha = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia,
    ),
  );

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

function obtenerHoyISO() {
  const ahora = new Date();

  const anio =
    ahora.getFullYear();
  const mes = String(
    ahora.getMonth() + 1,
  ).padStart(2, "0");
  const dia = String(
    ahora.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function emailValido(
  email: string,
) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function esAlojamiento(
  rubro: unknown,
) {
  if (typeof rubro !== "string") {
    return false;
  }

  const normalizado =
    rubro.trim().toLowerCase();

  return (
    normalizado === "hotel" ||
    normalizado === "hostal"
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    let body: ReservaAlojamientoBody;

    try {
      body =
        (await request.json()) as ReservaAlojamientoBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    const slug =
      limpiarTexto(
        body.slug,
        MAX_SLUG,
      ).toLowerCase();

    const servicioId =
      limpiarTexto(
        body.servicioId,
        MAX_ID,
      );

    const nombreCliente =
      limpiarTexto(
        body.nombreCliente,
        MAX_NOMBRE,
      );

    const email =
      limpiarTexto(
        body.email,
        MAX_EMAIL,
      ).toLowerCase();

    const telefono =
      limpiarTexto(
        body.telefono,
        MAX_TELEFONO,
      );

    const fechaEntrada =
      limpiarTexto(
        body.fechaEntrada,
        10,
      );

    const fechaSalida =
      limpiarTexto(
        body.fechaSalida,
        10,
      );

    const notas =
      limpiarTexto(
        body.notas,
        MAX_NOTAS,
      );

    const huespedes =
      Number(body.huespedes);

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta la página del alojamiento.",
        },
        {
          status: 400,
        },
      );
    }

    if (!servicioId) {
      return NextResponse.json(
        {
          error:
            "Seleccioná una habitación.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nombreCliente) {
      return NextResponse.json(
        {
          error:
            "Ingresá tu nombre.",
        },
        {
          status: 400,
        },
      );
    }

    if (!email && !telefono) {
      return NextResponse.json(
        {
          error:
            "Ingresá un teléfono o correo de contacto.",
        },
        {
          status: 400,
        },
      );
    }

    if (!emailValido(email)) {
      return NextResponse.json(
        {
          error:
            "Ingresá un correo válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !fechaValida(fechaEntrada) ||
      !fechaValida(fechaSalida)
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná fechas válidas.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fechaEntrada < obtenerHoyISO()
    ) {
      return NextResponse.json(
        {
          error:
            "La fecha de entrada no puede ser anterior a hoy.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fechaSalida <= fechaEntrada
    ) {
      return NextResponse.json(
        {
          error:
            "La fecha de salida debe ser posterior a la entrada.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(huespedes) ||
      huespedes < 1 ||
      huespedes > 20
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá una cantidad de huéspedes válida.",
        },
        {
          status: 400,
        },
      );
    }

    const empresasSnapshot =
      await adminDb
        .collection("companies")
        .where(
          "paginaPublica.slug",
          "==",
          slug,
        )
        .limit(2)
        .get();

    if (
      empresasSnapshot.size !== 1
    ) {
      return NextResponse.json(
        {
          error:
            empresasSnapshot.empty
              ? "No se encontró el alojamiento."
              : "La página pública no es válida.",
        },
        {
          status:
            empresasSnapshot.empty
              ? 404
              : 409,
        },
      );
    }

    const empresaDoc =
      empresasSnapshot.docs[0];

    const empresa =
      empresaDoc.data();

    if (
      empresa?.paginaPublica?.publicada !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "La página del alojamiento no está disponible.",
        },
        {
          status: 404,
        },
      );
    }

    if (!esAlojamiento(empresa.rubro)) {
      return NextResponse.json(
        {
          error:
            "Este formulario está disponible solo para hoteles y hostales.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !empresaTieneFuncion(
        empresa,
        "turnos",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Las reservas requieren un plan con agenda activa.",
        },
        {
          status: 403,
        },
      );
    }

    const servicioDoc =
      await adminDb
        .collection("companies")
        .doc(empresaDoc.id)
        .collection("catalog")
        .doc(servicioId)
        .get();

    if (!servicioDoc.exists) {
      return NextResponse.json(
        {
          error:
            "La habitación seleccionada no existe.",
        },
        {
          status: 404,
        },
      );
    }

    const servicio =
      servicioDoc.data() as ServicioAlojamiento;

    if (
      servicio.activo === false ||
      servicio.tipo !== "servicio" ||
      !servicio.nombre?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "La habitación seleccionada no está disponible.",
        },
        {
          status: 409,
        },
      );
    }

    const nombreHabitacion: string =
      servicio.nombre.trim();

    const empresaRef =
      adminDb
        .collection("companies")
        .doc(empresaDoc.id);

    const reservaRef =
      empresaRef
        .collection("appointments")
        .doc();

    const analyticsRef =
      empresaRef
        .collection("analyticsEvents")
        .doc();

    await adminDb.runTransaction(
      async (transaction) => {
        transaction.set(
          reservaRef,
          {
            nombreCliente,
            email,
            telefono,
            servicio:
              nombreHabitacion,
            servicioId:
              servicioDoc.id,
            precioServicio:
              Number(
                servicio.precio,
              ) || 0,

            /*
             * "fecha" mantiene compatibilidad con
             * la agenda existente. Para alojamiento
             * representa el día de ingreso.
             */
            fecha: fechaEntrada,
            hora: "14:00",
            duracionMinutos: 0,

            tipoReserva:
              "alojamiento",
            fechaEntrada,
            fechaSalida,
            huespedes,

            estado: "pendiente",
            notas,
            origen: "web",
            canalReserva:
              "pagina_publica",
            createdAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp(),
          },
        );

        transaction.set(
          analyticsRef,
          {
            tipo:
              "appointment_created",
            subtipo:
              "alojamiento",
            visitanteId:
              `reserva-${reservaRef.id}`,
            slug,
            origen:
              "pagina_publica",
            turnoId:
              reservaRef.id,
            servicioId:
              servicioDoc.id,
            fechaEntrada,
            fechaSalida,
            huespedes,
            createdAt:
              FieldValue.serverTimestamp(),
          },
        );
      },
    );

    try {
      await crearNotificacion({
        empresaId:
          empresaDoc.id,
        tipo: "sistema",
        titulo:
          "Nueva reserva de alojamiento",
        descripcion:
          `${nombreCliente} solicitó ${nombreHabitacion} del ${fechaEntrada} al ${fechaSalida} para ${huespedes} huésped${huespedes === 1 ? "" : "es"}.`,
        url:
          `/empresas/${empresaDoc.id}/agenda`,
        metadata: {
          origen:
            "pagina_publica",
          turnoId:
            reservaRef.id,
          servicioId:
            servicioDoc.id,
          fecha:
            fechaEntrada,
          fechaEntrada,
          fechaSalida,
          huespedes,
          email,
          telefono,
        },
      });
    } catch (notificationError) {
      console.error(
        "No se pudo crear la notificación de alojamiento:",
        notificationError,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        reservaId:
          reservaRef.id,
        habitacion:
          nombreHabitacion,
        fechaEntrada,
        fechaSalida,
        huespedes,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Error creando reserva de alojamiento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo solicitar la reserva.",
      },
      {
        status: 500,
      },
    );
  }
}