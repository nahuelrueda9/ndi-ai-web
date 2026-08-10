import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { empresaTieneFuncion } from "@/lib/plans/planAccess";
import { crearNotificacion } from "@/lib/notifications/notificationService";

type BodyRequest = {
  slug?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  tipo?: "contacto" | "presupuesto";

  // Campo honeypot opcional. Debe quedar vacío.
  website?: string;
};

const MAX_NOMBRE = 100;
const MAX_EMAIL = 180;
const MAX_TELEFONO = 50;
const MAX_MENSAJE = 2_000;

function limpiarTexto(
  valor: unknown,
  maximo: number
) {
  return typeof valor === "string"
    ? valor.trim().slice(0, maximo)
    : "";
}

function emailValido(email: string) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizarTelefono(
  telefono: string
) {
  return telefono
    .replace(/[^\d+\s().-]/g, "")
    .trim()
    .slice(0, MAX_TELEFONO);
}

export async function POST(
  request: Request
) {
  try {
    let body: BodyRequest;

    try {
      body =
        (await request.json()) as BodyRequest;
    } catch {
      return NextResponse.json(
        {
          error:
            "La solicitud no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Honeypot anti-bots.
     * Un usuario real nunca debería completar este campo.
     */
    if (
      typeof body.website === "string" &&
      body.website.trim()
    ) {
      return NextResponse.json({
        ok: true,
      });
    }

    const slug = limpiarTexto(
      body.slug,
      160
    )
      .toLowerCase();

    const nombre = limpiarTexto(
      body.nombre,
      MAX_NOMBRE
    );

    const email = limpiarTexto(
      body.email,
      MAX_EMAIL
    ).toLowerCase();

    const telefono =
      normalizarTelefono(
        limpiarTexto(
          body.telefono,
          MAX_TELEFONO
        )
      );

    const mensaje = limpiarTexto(
      body.mensaje,
      MAX_MENSAJE
    );

    const esPresupuesto =
      body.tipo === "presupuesto" ||
      mensaje
        .toUpperCase()
        .startsWith(
          "SOLICITUD DE PRESUPUESTO"
        );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Falta identificar el negocio.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "Ingresá tu nombre.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email && !telefono) {
      return NextResponse.json(
        {
          error:
            "Ingresá un teléfono o email.",
        },
        {
          status: 400,
        }
      );
    }

    if (!emailValido(email)) {
      return NextResponse.json(
        {
          error:
            "Ingresá un email válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!mensaje) {
      return NextResponse.json(
        {
          error:
            "Escribí tu consulta.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Resolvemos la empresa por slug desde el servidor.
     * Así el navegador no decide en qué empresa se guarda el lead.
     */
    const empresasSnapshot =
      await adminDb
        .collection("companies")
        .where(
          "paginaPublica.slug",
          "==",
          slug
        )
        .limit(2)
        .get();

    if (empresasSnapshot.size !== 1) {
      return NextResponse.json(
        {
          error:
            empresasSnapshot.empty
              ? "No se encontró la página del negocio."
              : "La URL pública no es válida.",
        },
        {
          status: empresasSnapshot.empty
            ? 404
            : 409,
        }
      );
    }

    const empresaDocumento =
      empresasSnapshot.docs[0];

    const empresa =
      empresaDocumento.data();

    if (
      empresa?.paginaPublica?.publicada !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "La página del negocio no está disponible.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      esPresupuesto &&
      !empresaTieneFuncion(
        empresa,
        "presupuestos"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Las solicitudes de presupuesto requieren un plan Pro o Empresa.",
          upgradeRequired: true,
        },
        {
          status: 403,
        }
      );
    }

    const empresaId =
      empresaDocumento.id;

    /*
     * Guardamos el contacto como una conversación,
     * porque el CRM actual ya trabaja con:
     * companies/{empresaId}/conversations
     *
     * De esta forma aparece en Conversaciones/Leads
     * sin crear un sistema paralelo.
     */
    const conversacionRef =
      adminDb
        .collection("companies")
        .doc(empresaId)
        .collection("conversations")
        .doc();

    const visitanteId =
      `pagina-${conversacionRef.id}`;

    const etiquetas = [
      "pagina-publica",
      esPresupuesto
        ? "presupuesto-web"
        : "contacto-web",
    ];

    await adminDb.runTransaction(
      async (transaction) => {
        transaction.set(
          conversacionRef,
          {
            empresaId,
            visitanteId,

            nombre,
            email,
            telefono,

            lead: {
              nombre,
              email,
              telefono,
            },

            puntuacionLead: 60,
            nivelInteres: "medio",
            etiquetas,

            origen: "pagina_publica",
            canal: "web",
            tipoContacto:
              esPresupuesto
                ? "presupuesto_publico"
                : "formulario_publico",

            ultimoMensaje: mensaje,
            ultimoRol: "user",
            cantidadMensajes: 1,

            estado: "abierta",
            estadoComercial: "nuevo",
            atendidoPor: "ia",
            humanoActivo: false,

            requiereAtencionHumana: false,

            createdAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );

        const mensajeRef =
          conversacionRef
            .collection("messages")
            .doc();

        transaction.set(
          mensajeRef,
          {
            role: "user",
            content: mensaje,
            enviadoPor: "cliente",
            origen: "pagina_publica",
            createdAt:
              FieldValue.serverTimestamp(),
          }
        );
      }
    );

    try {
      await crearNotificacion({
        empresaId,
        tipo: "lead",
        titulo:
          esPresupuesto
            ? "Nueva solicitud de presupuesto"
            : "Nuevo contacto desde la página",
        descripcion:
          `${nombre}: ${mensaje.slice(0, 140)}`,
        chatId: conversacionRef.id,
        visitanteId,
        url:
          `/empresas/${empresaId}/conversaciones/${conversacionRef.id}`,
        metadata: {
          origen: "pagina_publica",
          tipo:
            esPresupuesto
              ? "presupuesto"
              : "contacto",
          email,
          telefono,
        },
      });
    } catch (notificationError) {
      console.error(
        "No se pudo crear la notificación del lead público:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        ok: true,
        leadId: conversacionRef.id,
        mensaje:
          esPresupuesto
            ? "Solicitud de presupuesto enviada correctamente."
            : "Consulta enviada correctamente.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error al guardar lead público:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo enviar la consulta. Intentá nuevamente.",
      },
      {
        status: 500,
      }
    );
  }
}