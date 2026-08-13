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
          !item.id ||
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

    const catalogoRef =
      adminDb
        .collection(
          "companies",
        )
        .doc(
          empresaDoc.id,
        )
        .collection(
          "catalog",
        );

    const documentos =
      await Promise.all(
        itemsSolicitados.map(
          (item) =>
            catalogoRef
              .doc(item.id)
              .get(),
        ),
      );

    const itemsPedido =
      documentos.map(
        (
          documento,
          indice,
        ) => {
          if (
            !documento.exists
          ) {
            throw new Error(
              "PRODUCTO_INVALIDO",
            );
          }

          const producto =
            documento.data() as CatalogoData;

          if (
            producto.tipo !==
              "producto" ||
            producto.activo ===
              false ||
            !producto.nombre
              ?.trim()
          ) {
            throw new Error(
              "PRODUCTO_INVALIDO",
            );
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

          const cantidad =
            itemsSolicitados[
              indice
            ].cantidad;

          return {
            productoId:
              documento.id,
            nombre:
              producto.nombre.trim(),
            precioUnitario:
              precio,
            cantidad,
            subtotal:
              precio *
              cantidad,
          };
        },
      );

    const total =
      itemsPedido.reduce(
        (suma, item) =>
          suma +
          item.subtotal,
        0,
      );

    const empresaRef =
      adminDb
        .collection(
          "companies",
        )
        .doc(
          empresaDoc.id,
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

    await adminDb.runTransaction(
      async (
        transaction,
      ) => {
        transaction.set(
          pedidoRef,
          {
            numero,
            nombreCliente,
            telefono,
            notas,

            items:
              itemsPedido,
            cantidadItems:
              itemsPedido.reduce(
                (
                  suma,
                  item,
                ) =>
                  suma +
                  item.cantidad,
                0,
              ),
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
            cantidadItems:
              itemsPedido.reduce(
                (
                  suma,
                  item,
                ) =>
                  suma +
                  item.cantidad,
                0,
              ),
            slug,
            origen:
              "pagina_publica",
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
        tipo:
          "sistema",
        titulo:
          `Nuevo pedido #${numero}`,
        descripcion:
          `${nombreCliente} realizó un pedido por $${Math.round(total).toLocaleString("es-AR")}.`,
        url:
          `/empresas/${empresaDoc.id}/pedidos`,
        metadata: {
          pedidoId:
            pedidoRef.id,
          numero,
          total,
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
        total,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "PRODUCTO_INVALIDO"
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