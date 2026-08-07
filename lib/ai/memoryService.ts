import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebaseAdmin";

export type MemoriaCliente = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  intereses?: string;
  ultimoTema?: string;
  presupuesto?: string;
  ultimaActualizacion?: string;
};

function limpiarTexto(
  valor: unknown,
  maximo: number
) {
  if (
    typeof valor !== "string"
  ) {
    return undefined;
  }

  const limpio =
    valor.trim().slice(
      0,
      maximo
    );

  return limpio ||
    undefined;
}

function limpiarMemoria(
  memoria: unknown
): MemoriaCliente {
  if (
    !memoria ||
    typeof memoria !== "object"
  ) {
    return {};
  }

  const datos =
    memoria as Record<
      string,
      unknown
    >;

  return {
    nombre:
      limpiarTexto(
        datos.nombre,
        80
      ),
    empresa:
      limpiarTexto(
        datos.empresa,
        120
      ),
    email:
      limpiarTexto(
        datos.email,
        150
      ),
    telefono:
      limpiarTexto(
        datos.telefono,
        50
      ),
    ciudad:
      limpiarTexto(
        datos.ciudad,
        80
      ),
    intereses:
      limpiarTexto(
        datos.intereses,
        500
      ),
    ultimoTema:
      limpiarTexto(
        datos.ultimoTema,
        500
      ),
    presupuesto:
      limpiarTexto(
        datos.presupuesto,
        120
      ),
    ultimaActualizacion:
      limpiarTexto(
        datos.ultimaActualizacion,
        80
      ),
  };
}

function referenciaConversacion(
  empresaId: string,
  chatId: string
) {
  return adminDb
    .collection("companies")
    .doc(empresaId)
    .collection(
      "conversations"
    )
    .doc(chatId);
}

export async function obtenerMemoriaCliente(
  empresaId: string,
  chatId: string
): Promise<MemoriaCliente> {
  if (
    !empresaId?.trim() ||
    !chatId?.trim()
  ) {
    return {};
  }

  const snapshot =
    await referenciaConversacion(
      empresaId.trim(),
      chatId.trim()
    ).get();

  if (!snapshot.exists) {
    return {};
  }

  return limpiarMemoria(
    snapshot.data()
      ?.memoriaCliente
  );
}

export async function guardarMemoriaCliente(
  empresaId: string,
  chatId: string,
  memoria: MemoriaCliente
) {
  if (
    !empresaId?.trim() ||
    !chatId?.trim()
  ) {
    return;
  }

  const memoriaLimpia =
    limpiarMemoria(memoria);

  await referenciaConversacion(
    empresaId.trim(),
    chatId.trim()
  ).set(
    {
      memoriaCliente:
        memoriaLimpia,
      updatedAt:
        FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}