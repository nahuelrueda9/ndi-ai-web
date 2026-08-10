import {
  NextRequest,
  NextResponse,
} from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { empresaTieneFuncion } from "@/lib/plans/planAccess";
import { crearNotificacion } from "@/lib/notifications/notificationService";

type ReservaBody = {
  slug?: string;
  servicioId?: string;
  nombreCliente?: string;
  email?: string;
  telefono?: string;
  fecha?: string;
  hora?: string;
  notas?: string;
};

type CatalogoServicio = {
  tipo?: "servicio" | "producto";
  nombre?: string;
  precio?: number;
  duracionMinutos?: number;
  activo?: boolean;
};

type EmpresaPublica = {
  nombre?: string;
  plan?: "free" | "pro" | "business";
  subscriptionEndsAt?: unknown;
  paginaPublica?: {
    publicada?: boolean;
    slug?: string;
  };
};

function fechaValida(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function horaValida(valor: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

function minutosDesdeHora(hora: string) {
  const [horas, minutos] = hora
    .split(":")
    .map(Number);

  return horas * 60 + minutos;
}

function seSuperponen(
  inicioA: number,
  duracionA: number,
  inicioB: number,
  duracionB: number,
) {
  const finA = inicioA + duracionA;
  const finB = inicioB + duracionB;

  return (
    inicioA < finB &&
    inicioB < finA
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      (await request.json()) as ReservaBody;

    const slug =
      body.slug?.trim() || "";

    const servicioId =
      body.servicioId?.trim() || "";

    const nombreCliente =
      body.nombreCliente?.trim() || "";

    const email =
      body.email?.trim() || "";

    const telefono =
      body.telefono?.trim() || "";

    const fecha =
      body.fecha?.trim() || "";

    const hora =
      body.hora?.trim() || "";

    const notas =
      body.notas?.trim() || "";

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta la página del negocio.",
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
            "Seleccioná un servicio.",
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

    if (!telefono && !email) {
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

    if (!fechaValida(fecha)) {
      return NextResponse.json(
        {
          error:
            "La fecha no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    if (!horaValida(hora)) {
      return NextResponse.json(
        {
          error:
            "La hora no es válida.",
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

    if (empresasSnapshot.size !== 1) {
      return NextResponse.json(
        {
          error:
            empresasSnapshot.empty
              ? "El negocio no existe."
              : "La URL pública no es válida.",
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
      empresaDoc.data() as EmpresaPublica;

    if (
      !empresa.paginaPublica
        ?.publicada
    ) {
      return NextResponse.json(
        {
          error:
            "La página del negocio no está publicada.",
        },
        {
          status: 404,
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
            "Las reservas online requieren un plan Pro o Empresa.",
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
            "El servicio no existe.",
        },
        {
          status: 404,
        },
      );
    }

    const servicio =
      servicioDoc.data() as CatalogoServicio;

    if (
      servicio.tipo !== "servicio" ||
      servicio.activo === false ||
      !servicio.nombre
    ) {
      return NextResponse.json(
        {
          error:
            "El servicio no está disponible para reservar.",
        },
        {
          status: 400,
        },
      );
    }

    const duracionMinutos =
      Math.max(
        5,
        Number(
          servicio.duracionMinutos,
        ) || 60,
      );

    const turnosDelDia =
      await adminDb
        .collection("companies")
        .doc(empresaDoc.id)
        .collection("appointments")
        .where(
          "fecha",
          "==",
          fecha,
        )
        .get();

    const nuevoInicio =
      minutosDesdeHora(hora);

    const ocupado =
      turnosDelDia.docs.some(
        (turnoDoc) => {
          const turno =
            turnoDoc.data() as {
              hora?: string;
              duracionMinutos?: number;
              estado?: string;
            };

          if (
            !turno.hora ||
            turno.estado ===
              "cancelado"
          ) {
            return false;
          }

          if (
            !horaValida(
              turno.hora,
            )
          ) {
            return false;
          }

          const inicioExistente =
            minutosDesdeHora(
              turno.hora,
            );

          const duracionExistente =
            Math.max(
              5,
              Number(
                turno.duracionMinutos,
              ) || 60,
            );

          return seSuperponen(
            nuevoInicio,
            duracionMinutos,
            inicioExistente,
            duracionExistente,
          );
        },
      );

    if (ocupado) {
      return NextResponse.json(
        {
          error:
            "Ese horario ya no está disponible. Elegí otro horario.",
        },
        {
          status: 409,
        },
      );
    }

    const empresaRef =
      adminDb
        .collection("companies")
        .doc(empresaDoc.id);

    const turnoRef =
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

    const batch =
      adminDb.batch();

    batch.set(
      turnoRef,
      {
        nombreCliente,
        email,
        telefono,
        servicio:
          servicio.nombre,
        servicioId:
          servicioDoc.id,
        precioServicio:
          Number(
            servicio.precio,
          ) || 0,
        fecha,
        hora,
        duracionMinutos,
        estado: "pendiente",
        notas,
        origen: "web",
        createdAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp(),
      },
    );

    batch.set(
      analyticsRef,
      {
        tipo:
          "appointment_created",
        visitanteId:
          `reserva-${turnoRef.id}`,
        slug,
        origen:
          "pagina_publica",
        turnoId:
          turnoRef.id,
        servicioId:
          servicioDoc.id,
        createdAt:
          FieldValue.serverTimestamp(),
      },
    );

    await batch.commit();

    try {
      await crearNotificacion({
        empresaId: empresaDoc.id,
        tipo: "sistema",
        titulo:
          "Nuevo turno reservado",
        descripcion:
          `${nombreCliente} reservó ${servicio.nombre} para el ${fecha} a las ${hora}.`,
        url:
          `/empresas/${empresaDoc.id}/agenda`,
        metadata: {
          origen: "pagina_publica",
          turnoId: turnoRef.id,
          servicioId: servicioDoc.id,
          fecha,
          hora,
          email,
          telefono,
        },
      });
    } catch (notificationError) {
      console.error(
        "No se pudo crear la notificación del turno público:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        ok: true,
        turnoId:
          turnoRef.id,
        negocio:
          empresa.nombre ||
          "Negocio",
        servicio:
          servicio.nombre,
        fecha,
        hora,
        duracionMinutos,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Error creando turno público:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el turno.",
      },
      {
        status: 500,
      },
    );
  }
}