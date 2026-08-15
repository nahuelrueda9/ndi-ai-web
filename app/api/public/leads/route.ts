import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import {
  empresaTieneFuncion,
} from "@/lib/plans/planAccess";
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

const MAX_SLUG = 160;
const MAX_NOMBRE = 100;
const MAX_EMAIL = 180;
const MAX_TELEFONO = 50;
const MAX_MENSAJE = 2_000;

function limpiarTexto(
  valor: unknown,
  maximo: number
) {
  return typeof valor === "string"
    ? valor
        .trim()
        .replace(/\u0000/g, "")
        .slice(0, maximo)
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

class LeadPublicoNoDisponibleError extends Error {
  constructor(
    mensaje: string
  ) {
    super(mensaje);
    this.name =
      "LeadPublicoNoDisponibleError";
  }
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

    if (
      body.tipo !== undefined &&
      body.tipo !== "contacto" &&
      body.tipo !== "presupuesto"
    ) {
      return NextResponse.json(
        {
          error:
            "El tipo de solicitud no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const slug = limpiarTexto(
      body.slug,
      MAX_SLUG
    ).toLowerCase();

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

    /*
     * No inferimos privilegios a partir del texto del mensaje.
     * El formulario de presupuesto ya envía tipo: "presupuesto".
     * Si no viene tipo, mantenemos compatibilidad tratándolo
     * como un contacto normal.
     */
    const esPresupuesto =
      body.tipo === "presupuesto";

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

    /*
     * También bloqueamos llamadas directas a la API cuando
     * la página ya no tiene una suscripción activa.
     */
    if (
      !empresaTieneFuncion(
        empresa,
        "pagina_publica"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La página del negocio no está disponible.",
        },
        {
          status: 403,
        }
      );
    }

    if (esPresupuesto) {
      if (
        empresa?.paginaPublica
          ?.mostrarPresupuesto !== true
      ) {
        return NextResponse.json(
          {
            error:
              "El negocio no está recibiendo solicitudes de presupuesto desde su página.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        !empresaTieneFuncion(
          empresa,
          "presupuestos"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Las solicitudes de presupuesto requieren Página Completa o Business IA con una suscripción activa.",
            upgradeRequired: true,
          },
          {
            status: 403,
          }
        );
      }
    } else {
      if (
        empresa?.paginaPublica
          ?.mostrarContacto === false
      ) {
        return NextResponse.json(
          {
            error:
              "El negocio no está recibiendo consultas desde su página.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        !empresaTieneFuncion(
          empresa,
          "contacto"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "El formulario de contacto no está disponible.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const empresaId =
      empresaDocumento.id;

    const empresaRef =
      adminDb
        .collection("companies")
        .doc(empresaId);

    /*
     * Guardamos el contacto como una conversación porque
     * el CRM actual ya trabaja con:
     * companies/{empresaId}/conversations
     *
     * Más adelante podemos separar presupuestos en una
     * bandeja propia sin romper los datos existentes.
     */
    const conversacionRef =
      empresaRef
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

    try {
      await adminDb.runTransaction(
        async (transaction) => {
          /*
           * Revalidamos dentro de la transacción para que
           * un vencimiento, una baja de la página o un cambio
           * del toggle no pueda colarse antes de guardar.
           */
          const empresaActualSnapshot =
            await transaction.get(
              empresaRef
            );

          if (
            !empresaActualSnapshot.exists
          ) {
            throw new LeadPublicoNoDisponibleError(
              "La página del negocio ya no está disponible."
            );
          }

          const empresaActual =
            empresaActualSnapshot.data();

          if (
            empresaActual
              ?.paginaPublica
              ?.publicada !== true ||
            !empresaTieneFuncion(
              empresaActual,
              "pagina_publica"
            )
          ) {
            throw new LeadPublicoNoDisponibleError(
              "La página del negocio ya no está disponible."
            );
          }

          if (esPresupuesto) {
            if (
              empresaActual
                ?.paginaPublica
                ?.mostrarPresupuesto !== true ||
              !empresaTieneFuncion(
                empresaActual,
                "presupuestos"
              )
            ) {
              throw new LeadPublicoNoDisponibleError(
                "El negocio ya no está recibiendo solicitudes de presupuesto."
              );
            }
          } else {
            if (
              empresaActual
                ?.paginaPublica
                ?.mostrarContacto === false ||
              !empresaTieneFuncion(
                empresaActual,
                "contacto"
              )
            ) {
              throw new LeadPublicoNoDisponibleError(
                "El negocio ya no está recibiendo consultas desde su página."
              );
            }
          }

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
    } catch (error) {
      if (
        error instanceof
        LeadPublicoNoDisponibleError
      ) {
        return NextResponse.json(
          {
            error: error.message,
          },
          {
            status: 409,
          }
        );
      }

      throw error;
    }

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
        headers: {
          "Cache-Control":
            "no-store",
        },
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