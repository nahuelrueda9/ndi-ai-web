import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type WidgetConfig = {
  nombre?: unknown;
  nombreBot?: unknown;
  logo?: unknown;
  color?: unknown;
  saludo?: unknown;
  posicion?: unknown;
  avatar?: unknown;
  horario?: unknown;
  online?: unknown;
  enabled?: unknown;
  activo?: unknown;
};

function esEmpresaIdValido(
  empresaId: string
) {
  return (
    empresaId.length > 0 &&
    empresaId.length <= 200 &&
    !empresaId.includes("/") &&
    !empresaId.includes("\0")
  );
}

function textoSeguro(
  valor: unknown,
  maximo: number
) {
  return typeof valor === "string"
    ? valor.trim().slice(0, maximo)
    : "";
}

function colorSeguro(
  valor: unknown
) {
  const color =
    textoSeguro(valor, 20);

  return /^#[0-9a-f]{6}$/i.test(
    color
  )
    ? color
    : "#2563eb";
}

function posicionSegura(
  valor: unknown
) {
  return valor === "left"
    ? "left"
    : "right";
}

function horarioSeguro(
  valor: unknown
) {
  if (
    typeof valor === "string"
  ) {
    return valor
      .trim()
      .slice(0, 500);
  }

  if (
    valor &&
    typeof valor === "object" &&
    !Array.isArray(valor)
  ) {
    return valor;
  }

  return null;
}

export async function GET(
  request: NextRequest
) {
  try {
    const empresaId =
      request.nextUrl.searchParams
        .get("empresaId")
        ?.trim() || "";

    if (
      !esEmpresaIdValido(
        empresaId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "empresaId inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaSnapshot =
      await adminDb
        .collection("companies")
        .doc(empresaId)
        .get();

    if (
      !empresaSnapshot.exists
    ) {
      return NextResponse.json(
        {
          error:
            "Empresa no encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const empresa =
      empresaSnapshot.data() || {};

    const widget =
      empresa.widget &&
      typeof empresa.widget ===
        "object" &&
      !Array.isArray(
        empresa.widget
      )
        ? (empresa.widget as WidgetConfig)
        : {};

    const widgetActivo =
      widget.enabled !== false &&
      widget.activo !== false &&
      empresa.widgetEnabled !==
        false;

    if (!widgetActivo) {
      return NextResponse.json(
        {
          error:
            "El widget no está disponible.",
        },
        {
          status: 404,
        }
      );
    }

    const nombre =
      textoSeguro(
        widget.nombreBot,
        80
      ) ||
      textoSeguro(
        widget.nombre,
        80
      ) ||
      textoSeguro(
        empresa.nombre,
        80
      ) ||
      textoSeguro(
        empresa.name,
        80
      );

    const logo =
      textoSeguro(
        widget.logo,
        1000
      ) ||
      textoSeguro(
        empresa.logo,
        1000
      );

    const avatar =
      textoSeguro(
        widget.avatar,
        1000
      ) ||
      textoSeguro(
        empresa.avatar,
        1000
      );

    const saludo =
      textoSeguro(
        widget.saludo,
        300
      ) ||
      textoSeguro(
        empresa.saludo,
        300
      ) ||
      "¡Hola! ¿En qué podemos ayudarte?";

    const color =
      colorSeguro(
        widget.color ??
          empresa.color
      );

    const posicion =
      posicionSegura(
        widget.posicion ??
          empresa.posicion
      );

    const horario =
      horarioSeguro(
        widget.horario ??
          empresa.horario
      );

    const online =
      typeof widget.online ===
      "boolean"
        ? widget.online
        : typeof empresa.online ===
            "boolean"
          ? empresa.online
          : true;

    return NextResponse.json(
      {
        id: empresaSnapshot.id,
        nombre,
        logo,
        color,
        saludo,
        posicion,
        avatar,
        horario,
        online,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error cargando configuración pública del widget:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar el widget.",
      },
      {
        status: 500,
      }
    );
  }
}