import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebaseAdmin";
import {
  crearNotificacion,
} from "@/lib/notifications/notificationService";
import {
  empresaTieneFuncion,
} from "@/lib/plans/planAccess";

export const runtime =
  "nodejs";

type ItemBody = {
  id?: string;
  cantidad?: number;
};

type PedidoBody = {
  slug?: string;
  nombreCliente?: string;
  telefono?: string;
  notas?: string;
  items?: ItemBody[];
};

type CatalogoData = {
  tipo?: string;
  nombre?: string;
  precio?: number;
  activo?: boolean;
  imagenUrl?: string;
  imagenes?: string[];
};

const MAX_SLUG = 160;
const MAX_NOMBRE = 120;
const MAX_TELEFONO = 60;
const MAX_NOTAS = 1000;
const MAX_ITEMS_DISTINTOS = 30;
const MAX_CANTIDAD = 20;

function limpiarTexto(
  valor: unknown,
  maximo: number,
) {
  return typeof valor ===
    "string"
    ? valor
        .trim()
        .replace(
          /\u0000/g,
          "",
        )
        .slice(0, maximo)
    : "";
}

function esRestaurante(
  rubro: unknown,
) {
  if (
    typeof rubro !==
    "string"
  ) {
    return false;
  }

  const normalizado =
    rubro
      .trim()
      .toLowerCase();

  return (
    normalizado ===
      "restaurante" ||
    normalizado ===
      "restaurant"
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

class PedidoNoDisponibleError extends Error {
  constructor(
    mensaje: string,
  ) {
    super(mensaje);
    this.name =
      "PedidoNoDisponibleError";
  }
}

class ProductoNoDisponibleError extends Error {
  constructor() {
    super(
      "Uno de los productos ya no está disponible.",
    );
    this.name =
      "ProductoNoDisponibleError";
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    let body: PedidoBody;

    try {
      body =
        (await request.json()) as PedidoBody;
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

    const notas =
      limpiarTexto(
        body.notas,
        MAX_NOTAS,
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

    if (!telefono) {
      return NextResponse.json(
        {
          error:
            "Ingresá un teléfono de contacto.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Array.isArray(
        body.items,
      ) ||
      body.items.length === 0 ||
      body.items.length >
        MAX_ITEMS_DISTINTOS
    ) {
      return NextResponse.json(
        {
          error:
            "El pedido no contiene productos válidos.",
        },
        {
          status: 400,
        },
      );
    }

    const itemsSolicitados =
      body.items.map(
        (item) => ({
          id: limpiarTexto(
            item.id,
            160,
          ),
          cantidad:
            Number(
              item.cantidad,
            ),
        }),
      );

    if (
      itemsSolicitados.some(
        (item) =>
          !esIdFirestoreValido(
            item.id,
          ) ||
          !Number.isInteger(
            item.cantidad,
          ) ||
          item.cantidad < 1 ||
          item.cantidad >
            MAX_CANTIDAD,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Hay cantidades inválidas en el pedido.",
        },
        {
          status: 400,
        },
      );
    }

    const ids =
      new Set(
        itemsSolicitados.map(
          (item) =>
            item.id,
        ),
      );

    if (
      ids.size !==
      itemsSolicitados.length
    ) {
      return NextResponse.json(
        {
          error:
            "El pedido contiene productos repetidos.",
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
        ?.publicada !== true
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
            "Los pedidos online están disponibles solo para restaurantes.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      empresa
        ?.paginaPublica
        ?.mostrarPedidosOnline !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "El restaurante no está recibiendo pedidos online.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      !empresaTieneFuncion(
        empresa,
        "productos",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Los pedidos online requieren un plan con carta de productos activa.",
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

    const catalogoRef =
      empresaRef.collection(
        "catalog",
      );

    const pedidoRef =
      empresaRef
        .collection(
          "orders",
        )
        .doc();

    const numero =
      pedidoRef.id
        .slice(0, 6)
        .toUpperCase();

    const analyticsRef =
      empresaRef
        .collection(
          "analyticsEvents",
        )
        .doc();

    let totalPedido = 0;
    let cantidadItemsPedido = 0;

    try {
      await adminDb.runTransaction(
        async (
          transaction,
        ) => {
          /*
           * Revalidamos todo dentro de la transacción.
           * Así el pedido nunca usa un plan, toggle,
           * producto o precio que quedó viejo entre
           * la primera lectura y la escritura.
           */
          const empresaActualSnapshot =
            await transaction.get(
              empresaRef,
            );

          if (
            !empresaActualSnapshot.exists
          ) {
            throw new PedidoNoDisponibleError(
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
            throw new PedidoNoDisponibleError(
              "La página del restaurante ya no está disponible.",
            );
          }

          if (
            !esRestaurante(
              empresaActual?.rubro,
            )
          ) {
            throw new PedidoNoDisponibleError(
              "Los pedidos online están disponibles solo para restaurantes.",
            );
          }

          if (
            empresaActual
              ?.paginaPublica
              ?.mostrarPedidosOnline !==
            true
          ) {
            throw new PedidoNoDisponibleError(
              "El restaurante ya no está recibiendo pedidos online.",
            );
          }

          if (
            !empresaTieneFuncion(
              empresaActual,
              "productos",
            )
          ) {
            throw new PedidoNoDisponibleError(
              "Los pedidos online requieren Página Completa o Business IA con una suscripción activa.",
            );
          }

          const itemsPedido: Array<{
            productoId: string;
            nombre: string;
            precioUnitario: number;
            cantidad: number;
            subtotal: number;
          }> = [];

          for (
            const itemSolicitado of
            itemsSolicitados
          ) {
            const productoRef =
              catalogoRef.doc(
                itemSolicitado.id,
              );

            const productoSnapshot =
              await transaction.get(
                productoRef,
              );

            if (
              !productoSnapshot.exists
            ) {
              throw new ProductoNoDisponibleError();
            }

            const producto =
              productoSnapshot.data() as CatalogoData;

            if (
              producto.tipo !==
                "producto" ||
              producto.activo ===
                false ||
              !producto.nombre?.trim()
            ) {
              throw new ProductoNoDisponibleError();
            }

            const precio =
              typeof producto.precio ===
                "number" &&
              Number.isFinite(
                producto.precio,
              )
                ? Math.max(
                    0,
                    producto.precio,
                  )
                : 0;

            const subtotal =
              precio *
              itemSolicitado.cantidad;

            if (
              !Number.isFinite(
                subtotal,
              )
            ) {
              throw new ProductoNoDisponibleError();
            }

            itemsPedido.push({
              productoId:
                productoSnapshot.id,
              nombre:
                producto.nombre.trim(),
              precioUnitario:
                precio,
              cantidad:
                itemSolicitado.cantidad,
              subtotal,
            });
          }

          const total =
            itemsPedido.reduce(
              (suma, item) =>
                suma +
                item.subtotal,
              0,
            );

          const cantidadItems =
            itemsPedido.reduce(
              (suma, item) =>
                suma +
                item.cantidad,
              0,
            );

          if (
            !Number.isFinite(
              total,
            ) ||
            total < 0
          ) {
            throw new PedidoNoDisponibleError(
              "No se pudo calcular correctamente el total del pedido.",
            );
          }

          totalPedido = total;
          cantidadItemsPedido =
            cantidadItems;

          transaction.set(
            pedidoRef,
            {
              numero,
              nombreCliente,
              telefono,
              notas,

              items:
                itemsPedido,
              cantidadItems,
              total,

              estado:
                "nuevo",
              tipoEntrega:
                "retiro",
              origen:
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
                "order_created",
              pedidoId:
                pedidoRef.id,
              numero,
              total,
              cantidadItems,
              slug,
              origen:
                "pagina_publica",
              createdAt:
                FieldValue.serverTimestamp(),
            },
          );
        },
      );
    } catch (error) {
      if (
        error instanceof
        ProductoNoDisponibleError
      ) {
        return NextResponse.json(
          {
            error:
              "Uno de los productos ya no está disponible.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        error instanceof
        PedidoNoDisponibleError
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

    try {
      await crearNotificacion({
        empresaId:
          empresaDoc.id,
        tipo:
          "sistema",
        titulo:
          `Nuevo pedido #${numero}`,
        descripcion:
          `${nombreCliente} realizó un pedido por $${Math.round(totalPedido).toLocaleString("es-AR")}.`,
        url:
          `/empresas/${empresaDoc.id}/pedidos`,
        metadata: {
          pedidoId:
            pedidoRef.id,
          numero,
          total:
            totalPedido,
          cantidadItems:
            cantidadItemsPedido,
          telefono,
        },
      });
    } catch (
      notificationError
    ) {
      console.error(
        "No se pudo crear la notificación del pedido:",
        notificationError,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        pedidoId:
          pedidoRef.id,
        numero,
        total:
          totalPedido,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Error creando pedido público:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo enviar el pedido.",
      },
      {
        status: 500,
      },
    );
  }
}