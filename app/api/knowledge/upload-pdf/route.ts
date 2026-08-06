import {
  FieldValue,
} from "firebase-admin/firestore";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  PDFParse,
} from "pdf-parse";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const MAX_PDF_BYTES =
  10 * 1024 * 1024;

const MAX_TEXT_CHARACTERS =
  300_000;

const CHUNK_SIZE = 1_500;
const MAX_CHUNKS = 250;
const MAX_FILE_NAME_LENGTH = 180;

class RequestError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400
  ) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

function obtenerBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

function esIdFirestoreValido(
  valor: string
) {
  return (
    valor.length > 0 &&
    valor.length <= 200 &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

function limpiarNombreArchivo(
  valor: string
) {
  const nombre =
    valor
      .replace(
        /[\u0000-\u001f\u007f]/g,
        ""
      )
      .replace(/[\\/]/g, "_")
      .trim()
      .slice(
        0,
        MAX_FILE_NAME_LENGTH
      );

  return nombre ||
    "documento.pdf";
}

function parecePdf(
  buffer: Uint8Array
) {
  if (buffer.length < 5) {
    return false;
  }

  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

function normalizarTexto(
  texto: string
) {
  return texto
    .replace(/\r\n?/g, "\n")
    .replace(
      /[ \t\f\v]+/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim()
    .slice(
      0,
      MAX_TEXT_CHARACTERS
    );
}

function dividirTexto(
  texto: string
) {
  const chunks:
    string[] = [];

  let restante =
    texto.trim();

  while (
    restante.length > 0 &&
    chunks.length < MAX_CHUNKS
  ) {
    if (
      restante.length <=
      CHUNK_SIZE
    ) {
      if (
        restante.length > 20
      ) {
        chunks.push(
          restante
        );
      }

      break;
    }

    const fragmento =
      restante.slice(
        0,
        CHUNK_SIZE
      );

    const ultimoSalto =
      fragmento.lastIndexOf(
        "\n"
      );

    const ultimoPunto =
      fragmento.lastIndexOf(
        ". "
      );

    const ultimoEspacio =
      fragmento.lastIndexOf(
        " "
      );

    const minimoCorte =
      Math.floor(
        CHUNK_SIZE * 0.6
      );

    const posiblesCortes = [
      ultimoSalto,
      ultimoPunto >= 0
        ? ultimoPunto + 1
        : -1,
      ultimoEspacio,
    ].filter(
      (valor) =>
        valor >= minimoCorte
    );

    const corte =
      posiblesCortes.length > 0
        ? Math.max(
            ...posiblesCortes
          )
        : CHUNK_SIZE;

    const chunk =
      restante
        .slice(0, corte)
        .trim();

    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    restante =
      restante
        .slice(corte)
        .trim();
  }

  return chunks;
}

async function verificarPermiso({
  empresaId,
  uid,
}: {
  empresaId: string;
  uid: string;
}) {
  const empresaReferencia =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnapshot =
    await empresaReferencia.get();

  if (!empresaSnapshot.exists) {
    return {
      permitido: false,
      status: 404,
      error:
        "La empresa no existe.",
    };
  }

  const empresa =
    empresaSnapshot.data();

  if (
    empresa?.userId === uid
  ) {
    return {
      permitido: true,
      status: 200,
      error: "",
    };
  }

  const miembroSnapshot =
    await empresaReferencia
      .collection("members")
      .doc(uid)
      .get();

  const miembro =
    miembroSnapshot.data();

  const permitido =
    miembroSnapshot.exists &&
    miembro?.estado ===
      "activo" &&
    (
      miembro?.rol ===
        "administrador" ||
      miembro?.rol ===
        "supervisor"
    );

  return {
    permitido,
    status:
      permitido ? 200 : 403,
    error:
      permitido
        ? ""
        : "No tenés permisos para subir conocimiento.",
  };
}

export async function POST(
  request: NextRequest
) {
  let parser:
    PDFParse | null = null;

  try {
    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType
        .toLowerCase()
        .startsWith(
          "multipart/form-data"
        )
    ) {
      throw new RequestError(
        "La solicitud debe enviar un formulario con un PDF."
      );
    }

    const idToken =
      obtenerBearerToken(
        request
      );

    if (!idToken) {
      throw new RequestError(
        "Tenés que iniciar sesión.",
        401
      );
    }

    let usuario;

    try {
      usuario =
        await adminAuth
          .verifyIdToken(
            idToken
          );
    } catch {
      throw new RequestError(
        "La sesión no es válida o venció.",
        401
      );
    }

    let formData:
      FormData;

    try {
      formData =
        await request.formData();
    } catch {
      throw new RequestError(
        "No se pudo leer el formulario."
      );
    }

    const empresaId =
      formData
        .get("empresaId")
        ?.toString()
        .trim() || "";

    if (
      !esIdFirestoreValido(
        empresaId
      )
    ) {
      throw new RequestError(
        "empresaId inválido."
      );
    }

    const permiso =
      await verificarPermiso({
        empresaId,
        uid: usuario.uid,
      });

    if (!permiso.permitido) {
      throw new RequestError(
        permiso.error,
        permiso.status
      );
    }

    const archivo =
      formData.get("pdf");

    if (
      !(archivo instanceof File)
    ) {
      throw new RequestError(
        "PDF requerido."
      );
    }

    if (
      archivo.size <= 0
    ) {
      throw new RequestError(
        "El PDF está vacío."
      );
    }

    if (
      archivo.size >
      MAX_PDF_BYTES
    ) {
      throw new RequestError(
        "El PDF no puede superar los 10 MB.",
        413
      );
    }

    const nombreArchivo =
      limpiarNombreArchivo(
        archivo.name
      );

    if (
      !nombreArchivo
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      throw new RequestError(
        "El archivo debe tener extensión PDF."
      );
    }

    const arrayBuffer =
      await archivo.arrayBuffer();

    const datos =
      new Uint8Array(
        arrayBuffer
      );

    if (
      !parecePdf(datos)
    ) {
      throw new RequestError(
        "El archivo no contiene un PDF válido."
      );
    }

    parser =
      new PDFParse({
        data: datos,
      });

    const resultado =
      await parser.getText();

    const texto =
      normalizarTexto(
        resultado.text || ""
      );

    if (!texto) {
      throw new RequestError(
        "No se pudo extraer texto del PDF. Puede ser un documento escaneado."
      );
    }

    const chunks =
      dividirTexto(texto);

    if (
      chunks.length === 0
    ) {
      throw new RequestError(
        "El PDF no contiene suficiente texto para procesar."
      );
    }

    const knowledgeRef =
      adminDb
        .collection("companies")
        .doc(empresaId)
        .collection("knowledge");

    const importId =
      knowledgeRef.doc().id;

    const titulo =
      nombreArchivo.replace(
        /\.pdf$/i,
        ""
      );

    const batch =
      adminDb.batch();

    chunks.forEach(
      (
        contenido,
        index
      ) => {
        const referencia =
          knowledgeRef.doc();

        batch.set(
          referencia,
          {
            tipo: "pdf",
            type: "pdf",
            titulo,
            title: titulo,
            contenido,
            content: contenido,
            archivoNombre:
              nombreArchivo,
            fileName:
              nombreArchivo,
            archivoTipo:
              "application/pdf",
            importId,
            chunkIndex:
              index,
            totalChunks:
              chunks.length,
            createdBy:
              usuario.uid,
            createdAt:
              FieldValue
                .serverTimestamp(),
            updatedAt:
              FieldValue
                .serverTimestamp(),
          }
        );
      }
    );

    await batch.commit();

    return NextResponse.json({
      success: true,
      fileName:
        nombreArchivo,
      chunks:
        chunks.length,
      importId,
      truncated:
        texto.length >=
        MAX_TEXT_CHARACTERS,
    });
  } catch (error) {
    if (
      error instanceof
      RequestError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            error.status,
        }
      );
    }

    console.error(
      "Error procesando PDF:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo procesar el PDF.",
      },
      {
        status: 500,
      }
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (
        destroyError
      ) {
        console.error(
          "No se pudo liberar el parser PDF:",
          destroyError
        );
      }
    }
  }
}