import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";
import {
  getMessaging,
} from "firebase-admin/messaging";

import {
  adminDb,
} from "@/lib/firebaseAdmin";
import {
  crearNotificacion,
} from "@/lib/notifications/notificationService";
import {
  empresaTieneFuncion,
} from "@/lib/plans/planAccess";

export const runtime = "nodejs";

type ReservaMesaBody = {
  slug?: string;
  nombreCliente?: string;
  telefono?: string;
  email?: string;
  fecha?: string;
  hora?: string;
  personas?: number;
  notas?: string;
};

const MAX_SLUG = 160;
const MAX_NOMBRE = 120;
const MAX_EMAIL = 180;
const MAX_TELEFONO = 60;
const MAX_NOTAS = 1000;

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

function horaValida(
  valor: string,
) {
  if (
    !/^\d{2}:\d{2}$/.test(
      valor,
    )
  ) {
    return false;
  }

  const [
    horas,
    minutos,
  ] = valor
    .split(":")
    .map(Number);

  return (
    Number.isInteger(horas) &&
    Number.isInteger(minutos) &&
    horas >= 0 &&
    horas <= 23 &&
    minutos >= 0 &&
    minutos <= 59
  );
}

function emailValido(
  email: string,
) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function esRestaurante(
  rubro: unknown,
) {
  if (typeof rubro !== "string") {
    return false;
  }

  const normalizado =
    rubro
      .trim()
      .toLowerCase();

  return (
    normalizado === "restaurante" ||
    normalizado === "restaurant"
  );
}

function ahoraArgentina() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(
      new Date(),
    );

  const obtener = (
    tipo: string,
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo,
    )?.value || "";

  return {
    fecha:
      `${obtener("year")}-${obtener("month")}-${obtener("day")}`,
    hora:
      `${obtener("hour")}:${obtener("minute")}`,
  };
}

class ReservaMesaNoDisponibleError extends Error {
  constructor(
    mensaje: string,
  ) {
    super(mensaje);
    this.name =
      "ReservaMesaNoDisponibleError";
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    let body: ReservaMesaBody;

    try {
      body =
        (await request.json()) as ReservaMesaBody;
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

    const nombreCliente =
      limpiarTexto(
        body.nombreCliente,
        MAX_NOMBRE,
      );

    const telefono =
      limpiarTexto(
        body.telefono,
        MAX_TELEFONO,
      );

    const email =
      limpiarTexto(
        body.email,
        MAX_EMAIL,
      ).toLowerCase();

    const fecha =
      limpiarTexto(
        body.fecha,
        10,
      );

    const hora =
      limpiarTexto(
        body.hora,
        5,
      );

    const notas =
      limpiarTexto(
        body.notas,
        MAX_NOTAS,
      );

    const personas =
      Number(
        body.personas,
      );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta la página del restaurante.",
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

    if (
      !telefono &&
      !email
    ) {
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

    if (
      !emailValido(
        email,
      )
    ) {
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
      !fechaValida(
        fecha,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná una fecha válida.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !horaValida(
        hora,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná un horario válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        personas,
      ) ||
      personas < 1 ||
      personas > 30
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá una cantidad de personas válida.",
        },
        {
          status: 400,
        },
      );
    }

    const ahora =
      ahoraArgentina();

    if (
      fecha < ahora.fecha ||
      (
        fecha ===
          ahora.fecha &&
        hora <= ahora.hora
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La reserva debe ser para una fecha y horario futuros.",
        },
        {
          status: 400,
        },
      );
    }

    const empresasSnapshot =
      await adminDb
        .collection(
          "companies",
        )
        .where(
          "paginaPublica.slug",
          "==",
          slug,
        )
        .limit(2)
        .get();

    if (
      empresasSnapshot.size !==
      1
    ) {
      return NextResponse.json(
        {
          error:
            empresasSnapshot.empty
              ? "No se encontró el restaurante."
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
      empresa
        ?.paginaPublica
        ?.publicada !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "La página del restaurante no está disponible.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !esRestaurante(
        empresa.rubro,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Este formulario está disponible solo para restaurantes.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      empresa
        ?.paginaPublica
        ?.mostrarReservasMesa !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "El restaurante no está recibiendo reservas de mesa desde su página.",
        },
        {
          status: 403,
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
            "Las reservas de mesa requieren un plan con agenda activa.",
        },
        {
          status: 403,
        },
      );
    }

    const empresaRef =
      adminDb
        .collection(
          "companies",
        )
        .doc(
          empresaDoc.id,
        );

    const reservaRef =
      empresaRef
        .collection(
          "appointments",
        )
        .doc();

    const analyticsRef =
      empresaRef
        .collection(
          "analyticsEvents",
        )
        .doc();

    try {
      await adminDb.runTransaction(
        async (
          transaction,
        ) => {
          const empresaActualSnapshot =
            await transaction.get(
              empresaRef,
            );

          if (
            !empresaActualSnapshot.exists
          ) {
            throw new ReservaMesaNoDisponibleError(
              "El restaurante ya no está disponible.",
            );
          }

          const empresaActual =
            empresaActualSnapshot.data();

          if (
            empresaActual
              ?.paginaPublica
              ?.publicada !== true
          ) {
            throw new ReservaMesaNoDisponibleError(
              "La página del restaurante ya no está disponible.",
            );
          }

          if (
            !esRestaurante(
              empresaActual?.rubro,
            )
          ) {
            throw new ReservaMesaNoDisponibleError(
              "Este formulario está disponible solo para restaurantes.",
            );
          }

          if (
            empresaActual
              ?.paginaPublica
              ?.mostrarReservasMesa !==
            true
          ) {
            throw new ReservaMesaNoDisponibleError(
              "El restaurante ya no está recibiendo reservas de mesa desde su página.",
            );
          }

          if (
            !empresaTieneFuncion(
              empresaActual,
              "turnos",
            )
          ) {
            throw new ReservaMesaNoDisponibleError(
              "Las reservas de mesa requieren Página Completa o Business IA con una suscripción activa.",
            );
          }

          const ahoraActual =
            ahoraArgentina();

          if (
            fecha <
              ahoraActual.fecha ||
            (
              fecha ===
                ahoraActual.fecha &&
              hora <=
                ahoraActual.hora
            )
          ) {
            throw new ReservaMesaNoDisponibleError(
              "La reserva debe ser para una fecha y horario futuros.",
            );
          }

          transaction.set(
            reservaRef,
            {
              nombreCliente,
              telefono,
              email,
              servicio:
                "Reserva de mesa",
              servicioId: "",
              precioServicio: 0,
              fecha,
              hora,
              duracionMinutos: 0,
              tipoReserva:
                "mesa",
              personas,
              estado:
                "pendiente",
              notas,
              origen:
                "web",
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
                "mesa",
              visitanteId:
                `reserva-mesa-${reservaRef.id}`,
              slug,
              origen:
                "pagina_publica",
              turnoId:
                reservaRef.id,
              fecha,
              hora,
              personas,
              createdAt:
                FieldValue.serverTimestamp(),
            },
          );
        },
      );
    } catch (error) {
      if (
        error instanceof
        ReservaMesaNoDisponibleError
      ) {
        return NextResponse.json(
          {
            error: error.message,
          },
          {
            status: 409,
          },
        );
      }

      throw error;
    }

    // 1. Notificación interna en el panel
    try {
      await crearNotificacion({
        empresaId:
          empresaDoc.id,
        tipo:
          "sistema",
        titulo:
          "Nueva reserva de mesa",
        descripcion:
          `${nombreCliente} solicitó una mesa para ${personas} persona${personas === 1 ? "" : "s"} el ${fecha} a las ${hora}.`,
        url:
          `/empresas/${empresaDoc.id}/agenda`,
        metadata: {
          origen:
            "pagina_publica",
          turnoId:
            reservaRef.id,
          fecha,
          hora,
          personas,
          email,
          telefono,
        },
      });
    } catch (
      notificationError
    ) {
      console.error(
        "No se pudo crear la notificación de reserva de mesa:",
        notificationError,
      );
    }

    // 2. Disparo de Notificación Push Web al teléfono del dueño
    try {
      const fcmTokens: string[] = empresa?.fcmTokens || [];

      if (fcmTokens.length > 0) {
        const messaging = getMessaging();
        await messaging.sendEachForMulticast({
          tokens: fcmTokens,
          notification: {
            title: "🍽️ ¡Nueva reserva de mesa!",
            body: `${nombreCliente} reservó para ${personas} persona${personas === 1 ? "" : "s"} (${fecha} a las ${hora}).`,
          },
          data: {
            url: `/empresas/${empresaDoc.id}/agenda`,
          },
        });
      }
    } catch (pushError) {
      console.error("Error enviando push de mesa:", pushError);
    }

    return NextResponse.json(
      {
        ok: true,
        reservaId:
          reservaRef.id,
        fecha,
        hora,
        personas,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Error creando reserva de mesa:",
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