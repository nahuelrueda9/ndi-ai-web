import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

import { extraerMemoriaConIA } from "@/lib/ai/memoryExtractor";
import {
  guardarMemoriaCliente,
} from "@/lib/ai/memoryService";
import { guardarLead } from "@/lib/leadService";
import { analizarLead } from "@/lib/ai/leadAnalyzer";
import { herramientasIA } from "@/lib/ai/tools";
import { ejecutarHerramienta } from "@/lib/ai/toolExecutor";
import { detectarIntencion } from "@/lib/ai/intentClassifier";
import { obtenerContexto } from "@/lib/chat/context/contextService";
import { construirBloquesCRM } from "@/lib/chat/context/crmContext";
import { construirSystemPrompt } from "@/lib/ai/systemPrompt";
import {
  generarRespuestaOpenRouter,
  OpenRouterError,
} from "@/lib/ai/openrouter/chatClient";

type RolMensaje = "system" | "user" | "assistant";

type MensajeHistorial = {
  role: RolMensaje;
  content: string;
};

type Empresa = {
  userId?: string;
  nombre?: string;
  descripcion?: string;
  personalidad?: string;
  objetivo?: string;
  instrucciones?: string;
  restricciones?: string;
  idioma?: string;
telefono?: string;
whatsapp?: string;
email?: string;
direccion?: string;
horario?: string;
sitioWeb?: string;
formasPago?: string;

  agente?: {
    nombre?: string;
    rol?: string;
    personalidad?: string;
    instrucciones?: string;
  };

  widget?: {
    nombreBot?: string;
  };
};

type Conocimiento = {
  id?: string;
  titulo?: string;
  contenido?: string;
};

type MemoriaCliente = {
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

type NotaCRM = {
  contenido?: string;
  texto?: string;
  autor?: string;
  createdAt?: string;
};

type ActividadCRM = {
  tipo?: string;
  titulo?: string;
  descripcion?: string;
  createdAt?: string;
};

type ConocimientoSeleccionado = {
  titulo: string;
  contenido: string;
  puntuacion: number;
};

type BodyRequest = {
  mensaje?: string;
  historial?: MensajeHistorial[];
  empresa?: Empresa;
  conocimientos?: Conocimiento[];
  memoria?: MemoriaCliente;
  tags?: string[];
  notas?: NotaCRM[];
  actividades?: ActividadCRM[];
  empresaId?: string;
  chatId?: string;
};

const MAXIMO_HISTORIAL = 20;
const MAXIMO_CARACTERES_MENSAJE = 4_000;
const MAXIMO_CARACTERES_HISTORIAL = 6_000;
const MAXIMO_ID_FIRESTORE = 200;
const MAXIMO_CONOCIMIENTOS = 6;
const MAXIMO_CARACTERES_CONTEXTO = 18_000;
const MAXIMO_CARACTERES_POR_DOCUMENTO = 6_000;

const PALABRAS_VACIAS = new Set([
  "a",
  "al",
  "algo",
  "algun",
  "alguna",
  "algunas",
  "alguno",
  "algunos",
  "ante",
  "como",
  "con",
  "contra",
  "cual",
  "cuando",
  "de",
  "del",
  "desde",
  "donde",
  "el",
  "ella",
  "ellas",
  "ellos",
  "en",
  "entre",
  "era",
  "es",
  "esa",
  "esas",
  "ese",
  "eso",
  "esos",
  "esta",
  "estas",
  "este",
  "esto",
  "estos",
  "fue",
  "ha",
  "hay",
  "la",
  "las",
  "le",
  "les",
  "lo",
  "los",
  "mas",
  "me",
  "mi",
  "mis",
  "muy",
  "no",
  "nos",
  "o",
  "para",
  "pero",
  "por",
  "porque",
  "que",
  "se",
  "si",
  "sin",
  "sobre",
  "su",
  "sus",
  "te",
  "tiene",
  "tu",
  "tus",
  "un",
  "una",
  "unas",
  "uno",
  "unos",
  "y",
  "ya",
]);

function limpiarHistorial(historial: unknown): MensajeHistorial[] {
  if (!Array.isArray(historial)) {
    return [];
  }

  return historial
    .filter((item): item is MensajeHistorial => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const mensaje = item as Partial<MensajeHistorial>;

      return (
        (mensaje.role === "user" ||
          mensaje.role === "assistant") &&
        typeof mensaje.content === "string" &&
        mensaje.content.trim().length > 0
      );
    })
    .map((item) => ({
      role: item.role,
      content: item.content
        .trim()
        .slice(
          0,
          MAXIMO_CARACTERES_HISTORIAL
        ),
    }))
    .slice(-MAXIMO_HISTORIAL);
}

function limpiarMemoria(memoria: unknown): MemoriaCliente {
  if (!memoria || typeof memoria !== "object") {
    return {};
  }

  const datos = memoria as Partial<MemoriaCliente>;
  const memoriaLimpia: MemoriaCliente = {};

  const campos: Array<keyof MemoriaCliente> = [
    "nombre",
    "empresa",
    "email",
    "telefono",
    "ciudad",
    "intereses",
    "ultimoTema",
    "presupuesto",
    "ultimaActualizacion",
  ];

  for (const campo of campos) {
    const valor = datos[campo];

    if (typeof valor === "string" && valor.trim()) {
      memoriaLimpia[campo] = valor.trim();
    }
  }

  return memoriaLimpia;
}

function memoriasSonDistintas(
  memoriaAnterior: MemoriaCliente,
  memoriaNueva: MemoriaCliente
) {
  const campos: Array<keyof MemoriaCliente> = [
    "nombre",
    "empresa",
    "email",
    "telefono",
    "ciudad",
    "intereses",
    "ultimoTema",
    "presupuesto",
  ];

  return campos.some(
    (campo) =>
      (memoriaAnterior[campo] || "") !==
      (memoriaNueva[campo] || "")
  );
}

function construirMemoriaCliente(memoria: MemoriaCliente) {
  const datos: string[] = [];

  if (memoria.nombre) {
    datos.push(`Nombre del visitante: ${memoria.nombre}`);
  }

  if (memoria.empresa) {
    datos.push(`Empresa o negocio: ${memoria.empresa}`);
  }

  if (memoria.email) {
    datos.push(`Email: ${memoria.email}`);
  }

  if (memoria.telefono) {
    datos.push(`Teléfono: ${memoria.telefono}`);
  }

  if (memoria.ciudad) {
    datos.push(`Ciudad: ${memoria.ciudad}`);
  }

  if (memoria.intereses) {
    datos.push(`Intereses: ${memoria.intereses}`);
  }

  if (memoria.ultimoTema) {
    datos.push(`Último tema: ${memoria.ultimoTema}`);
  }

  if (memoria.presupuesto) {
    datos.push(`Presupuesto mencionado: ${memoria.presupuesto}`);
  }

  if (datos.length === 0) {
    return "Todavía no hay información recordada del visitante.";
  }

  return datos.join("\n");
}

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerPalabrasImportantes(texto: string) {
  const palabras = normalizarTexto(texto)
    .split(" ")
    .filter(
      (palabra) =>
        palabra.length >= 3 &&
        !PALABRAS_VACIAS.has(palabra)
    );

  return Array.from(new Set(palabras));
}

function obtenerUltimosMensajesUsuario(
  historial: MensajeHistorial[]
) {
  return historial
    .filter((item) => item.role === "user")
    .slice(-3)
    .map((item) => item.content)
    .join(" ");
}

function calcularPuntuacion(
  consulta: string,
  conocimiento: Conocimiento
) {
  const titulo = normalizarTexto(
    conocimiento.titulo || ""
  );

  const contenido = normalizarTexto(
    conocimiento.contenido || ""
  );

  const palabrasConsulta =
    obtenerPalabrasImportantes(consulta);

  if (palabrasConsulta.length === 0) {
    return 0;
  }

  let puntuacion = 0;

  for (const palabra of palabrasConsulta) {
    if (titulo.includes(palabra)) {
      puntuacion += 6;
    }

    if (contenido.includes(palabra)) {
      puntuacion += 2;
    }

    const coincidenciasContenido =
      contenido.split(palabra).length - 1;

    puntuacion += Math.min(coincidenciasContenido, 5);
  }

  const consultaNormalizada = normalizarTexto(consulta);

  if (
    consultaNormalizada.length >= 5 &&
    titulo.includes(consultaNormalizada)
  ) {
    puntuacion += 15;
  }

  if (
    consultaNormalizada.length >= 8 &&
    contenido.includes(consultaNormalizada)
  ) {
    puntuacion += 10;
  }

  return puntuacion;
}

function seleccionarConocimientosRelevantes(
  mensaje: string,
  historial: MensajeHistorial[],
  conocimientos: Conocimiento[]
): ConocimientoSeleccionado[] {
  const contextoConversacion =
    obtenerUltimosMensajesUsuario(historial);

  const consultaCompleta = [
    contextoConversacion,
    mensaje,
  ]
    .filter(Boolean)
    .join(" ");

  const conocimientosValidos = conocimientos.filter(
    (item) =>
      typeof item?.contenido === "string" &&
      item.contenido.trim().length > 0
  );

  if (conocimientosValidos.length === 0) {
    return [];
  }

  const puntuados = conocimientosValidos
    .map((item) => ({
      titulo:
        typeof item.titulo === "string" &&
        item.titulo.trim()
          ? item.titulo.trim()
          : "Información",
      contenido: item.contenido!.trim(),
      puntuacion: calcularPuntuacion(
        consultaCompleta,
        item
      ),
    }))
    .sort((a, b) => b.puntuacion - a.puntuacion);

  const relevantes = puntuados.filter(
    (item) => item.puntuacion > 0
  );

  const seleccionBase =
    relevantes.length > 0
      ? relevantes
      : puntuados.slice(0, 3);

  return seleccionBase.slice(0, MAXIMO_CONOCIMIENTOS);
}

function limitarTexto(
  texto: string,
  maximoCaracteres: number
) {
  if (texto.length <= maximoCaracteres) {
    return texto;
  }

  return `${texto.slice(
    0,
    maximoCaracteres
  )}\n\n[Contenido recortado por longitud]`;
}

function construirBaseDeConocimiento(
  seleccionados: ConocimientoSeleccionado[]
) {
  if (seleccionados.length === 0) {
    return "No hay información cargada para esta consulta.";
  }

  let totalCaracteres = 0;
  const bloques: string[] = [];

  for (const item of seleccionados) {
    const espacioDisponible =
      MAXIMO_CARACTERES_CONTEXTO - totalCaracteres;

    if (espacioDisponible <= 0) {
      break;
    }

    const contenidoLimitado = limitarTexto(
      item.contenido,
      Math.min(
        MAXIMO_CARACTERES_POR_DOCUMENTO,
        espacioDisponible
      )
    );

    const bloque = [
      `FUENTE: ${item.titulo}`,
      contenidoLimitado,
    ].join("\n");

    bloques.push(bloque);
    totalCaracteres += bloque.length;
  }

  return bloques.join(
    "\n\n==========================================\n\n"
  );
}

function limpiarConocimientos(
  conocimientos: unknown
): Conocimiento[] {
  if (!Array.isArray(conocimientos)) {
    return [];
  }

  return conocimientos.filter(
    (item): item is Conocimiento => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const conocimiento =
        item as Partial<Conocimiento>;

      return (
        typeof conocimiento.contenido === "string" &&
        conocimiento.contenido.trim().length > 0
      );
    }
  );
}


type AccesoApi =
  | {
      tipo: "firebase";
      uid: string;
    }
  | {
      tipo: "interno";
    };

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

function compararSecretos(
  recibido: string,
  esperado: string
) {
  const hashRecibido =
    createHash("sha256")
      .update(recibido)
      .digest();

  const hashEsperado =
    createHash("sha256")
      .update(esperado)
      .digest();

  return timingSafeEqual(
    hashRecibido,
    hashEsperado
  );
}

async function validarAccesoApi(
  request: NextRequest
): Promise<AccesoApi | null> {
  const idToken =
    obtenerBearerToken(request);

  if (idToken) {
    try {
      const usuario =
        await adminAuth.verifyIdToken(
          idToken
        );

      return {
        tipo: "firebase",
        uid: usuario.uid,
      };
    } catch {
      return null;
    }
  }

  const secretoConfigurado =
    process.env
      .INTERNAL_API_SECRET
      ?.trim();

  const secretoRecibido =
    request.headers
      .get(
        "x-ndi-internal-secret"
      )
      ?.trim();

  if (
    secretoConfigurado &&
    secretoRecibido &&
    compararSecretos(
      secretoRecibido,
      secretoConfigurado
    )
  ) {
    return {
      tipo: "interno",
    };
  }

  return null;
}

function esIdFirestoreValido(
  valor: string
) {
  return (
    valor.length > 0 &&
    valor.length <=
      MAXIMO_ID_FIRESTORE &&
    !valor.includes("/") &&
    !valor.includes("\0")
  );
}

async function verificarAccesoEmpresa({
  empresaId,
  acceso,
}: {
  empresaId: string;
  acceso: AccesoApi;
}) {
  const empresaReferencia =
    adminDb
      .collection("companies")
      .doc(empresaId);

  const empresaSnapshot =
    await empresaReferencia.get();

  if (!empresaSnapshot.exists) {
    return {
      empresa: null,
      status: 404,
      error:
        "La empresa no existe.",
    };
  }

  const empresa =
    empresaSnapshot.data() as Empresa;

  if (acceso.tipo === "interno") {
    return {
      empresa,
      status: 200,
      error: "",
    };
  }

  if (
    empresa.userId === acceso.uid
  ) {
    return {
      empresa,
      status: 200,
      error: "",
    };
  }

  const miembroSnapshot =
    await empresaReferencia
      .collection("members")
      .doc(acceso.uid)
      .get();

  const miembro =
    miembroSnapshot.data();

  const permitido =
    miembroSnapshot.exists &&
    miembro?.estado === "activo";

  if (!permitido) {
    return {
      empresa: null,
      status: 403,
      error:
        "No tenés acceso a esta empresa.",
    };
  }

  return {
    empresa,
    status: 200,
    error: "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const acceso =
      await validarAccesoApi(request);

    if (!acceso) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    let body: BodyRequest;

    try {
      body =
        (await request.json()) as BodyRequest;
    } catch {
      return NextResponse.json(
        {
          error:
            "El cuerpo de la solicitud no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const mensaje =
      typeof body.mensaje === "string"
        ? body.mensaje
            .trim()
            .slice(
              0,
              MAXIMO_CARACTERES_MENSAJE
            )
        : "";

    if (!mensaje) {
      return NextResponse.json(
        {
          error:
            "El mensaje es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaId =
      typeof body.empresaId === "string"
        ? body.empresaId.trim()
        : "";

    const chatId =
      typeof body.chatId === "string"
        ? body.chatId.trim()
        : "";

    if (
      !empresaId ||
      !esIdFirestoreValido(
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

    if (
      chatId &&
      !esIdFirestoreValido(chatId)
    ) {
      return NextResponse.json(
        {
          error:
            "chatId inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const accesoEmpresa =
      await verificarAccesoEmpresa({
        empresaId,
        acceso,
      });

    if (!accesoEmpresa.empresa) {
      return NextResponse.json(
        {
          error:
            accesoEmpresa.error,
        },
        {
          status:
            accesoEmpresa.status,
        }
      );
    }

    const empresa =
      accesoEmpresa.empresa;

    const intencion =
      detectarIntencion(mensaje);

    const solicitarHumano =
      intencion === "humano";

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No se encontró OPENROUTER_API_KEY.",
        },
        {
          status: 500,
        }
      );
    }

    const historial =
      limpiarHistorial(
        body.historial
      );

    /*
     * El navegador no puede inyectar
     * empresa, conocimiento, memoria o CRM.
     * Todo se carga desde el servidor.
     */
    let conocimientos:
      Conocimiento[] = [];

    const contexto =
      await obtenerContexto({
        empresaId,
        chatId,
        mensaje,
        limiteConocimientos:
          MAXIMO_CONOCIMIENTOS,
      });

    const knowledgeSnapshot = await adminDb
      .collection("companies")
      .doc(empresaId)
      .collection("knowledge")
      .limit(100)
      .get();

    conocimientos = knowledgeSnapshot.docs
      .map((documento) => {
        const datos = documento.data();

        return {
          id: documento.id,
          titulo: String(
            datos.titulo ??
              datos.title ??
              datos.nombre ??
              "Información"
          ).trim(),
          contenido: String(
            datos.contenido ??
              datos.content ??
              datos.texto ??
              ""
          ).trim(),
        };
      })
      .filter(
        (item) => item.contenido.length > 0
      );

    const memoriaRecibida:
      MemoriaCliente = {};

const memoriaGuardada: MemoriaCliente =
  limpiarMemoria(contexto.memoria);

const tags = contexto.tags;
const notas = contexto.notas;
const actividades = contexto.actividades;

    const memoriaActual = limpiarMemoria({
      ...memoriaGuardada,
      ...memoriaRecibida,
    });

    const memoriaExtraida = limpiarMemoria(
      await extraerMemoriaConIA(
        mensaje,
        memoriaActual
      )
    );

    const memoria = memoriaExtraida;

if (
  empresaId &&
  chatId &&
  memoriasSonDistintas(
    memoriaActual,
    memoriaExtraida
  )
) {
  await guardarMemoriaCliente(
    empresaId,
    chatId,
    memoriaExtraida
  );
}

if (empresaId && chatId) {
  const tieneDatosDeLead =
    memoriaExtraida.nombre ||
    memoriaExtraida.email ||
    memoriaExtraida.telefono ||
    memoriaExtraida.empresa;

  if (tieneDatosDeLead) {
    const analisisLead = analizarLead(mensaje);

    await guardarLead(empresaId, chatId, {
      nombre: memoriaExtraida.nombre,
      email: memoriaExtraida.email,
      telefono: memoriaExtraida.telefono,
      empresa: memoriaExtraida.empresa,
      puntuacionLead: analisisLead.puntuacionLead,
      nivelInteres: analisisLead.nivelInteres,
      etiquetas: analisisLead.etiquetas,
    });

    console.log("Lead guardado:", chatId);
  }
}

    const usarConocimiento = [
  "compra",
  "precio",
  "soporte",
  "general",
].includes(intencion);

const conocimientosSeleccionados = usarConocimiento
  ? seleccionarConocimientosRelevantes(
      mensaje,
      historial,
      conocimientos
    )
  : [];

    const baseDeConocimiento =
      construirBaseDeConocimiento(
        conocimientosSeleccionados
      );

    const memoriaDelVisitante =
      construirMemoriaCliente(memoria);

const {
  bloqueTags,
  bloqueNotas,
  bloqueActividades,
} = construirBloquesCRM({
  tags,
  notas,
  actividades,
});

      const instruccionesDelSistema =
  construirSystemPrompt({
    empresa,
    intencion,
    memoriaDelVisitante,
    bloqueTags,
    bloqueNotas,
    bloqueActividades,
    baseDeConocimiento,
  });

  let mensajeIA;

try {
  const respuestaIA =
    await generarRespuestaOpenRouter({
      apiKey,
      mensajes: [
        {
          role: "system",
          content: instruccionesDelSistema,
        },
        ...historial,
        {
          role: "user",
          content: mensaje,
        },
      ],
      herramientas: herramientasIA,
      permitirHerramientas: true,
    });

  mensajeIA = respuestaIA.mensaje;
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(
      "Error de OpenRouter:",
      error.detalles
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  throw error;
}

let llamadasHerramienta = Array.isArray(
  mensajeIA?.tool_calls
)
  ? [...mensajeIA.tool_calls]
  : [];

let respuestaFinal =
  typeof mensajeIA?.content === "string"
    ? mensajeIA.content.trim()
    : "";

const herramientasEjecutadas: Array<{
  nombre: string;
  exito: boolean;
}> = [];

if (
  solicitarHumano &&
  !llamadasHerramienta.some(
    (t) => t.function?.name === "solicitar_atencion_humana"
  )
) {
  llamadasHerramienta.push({
    id: "auto_humano",
    type: "function",
    function: {
      name: "solicitar_atencion_humana",
      arguments: JSON.stringify({
        motivo: "Solicitud automática detectada por intención.",
      }),
    },
  });
}

if (llamadasHerramienta.length > 0) {
  if (!empresaId || !chatId) {
    return NextResponse.json(
      {
        error:
          "La IA intentó ejecutar una acción, pero faltan empresaId o chatId.",
      },
      {
        status: 400,
      }
    );
  }

  const mensajesConHerramientas = [
    {
      role: "system",
      content: instruccionesDelSistema,
    },
    ...historial,
    {
      role: "user",
      content: mensaje,
    },
    mensajeIA,
  ];

  for (const llamada of llamadasHerramienta) {
    const nombreHerramienta =
      typeof llamada?.function?.name === "string"
        ? llamada.function.name
        : "";

    const argumentosHerramienta =
      llamada?.function?.arguments;

    try {
      const resultadoHerramienta =
        await ejecutarHerramienta({
          empresaId,
          chatId,
          nombre: nombreHerramienta,
          argumentos: argumentosHerramienta,
        });

      herramientasEjecutadas.push({
        nombre: nombreHerramienta,
        exito: resultadoHerramienta.exito,
      });

      mensajesConHerramientas.push({
        role: "tool",
        tool_call_id: llamada.id,
        content: JSON.stringify(resultadoHerramienta),
      });
    } catch (errorHerramienta) {
      console.error(
        `Error al ejecutar ${nombreHerramienta}:`,
        errorHerramienta
      );

      herramientasEjecutadas.push({
        nombre: nombreHerramienta,
        exito: false,
      });

      mensajesConHerramientas.push({
        role: "tool",
        tool_call_id: llamada.id,
        content: JSON.stringify({
          exito: false,
          mensaje:
            errorHerramienta instanceof Error
              ? errorHerramienta.message
              : "No se pudo ejecutar la herramienta.",
        }),
      });
    }
  }

try {
  const respuestaIAFinal =
    await generarRespuestaOpenRouter({
      apiKey,
      mensajes: mensajesConHerramientas,
      herramientas: herramientasIA,
      permitirHerramientas: false,
    });

  const contenidoFinal =
    respuestaIAFinal.mensaje.content;

  respuestaFinal =
    typeof contenidoFinal === "string"
      ? contenidoFinal.trim()
      : "";
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(
      "Error de OpenRouter después de ejecutar herramientas:",
      error.detalles
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "La acción se ejecutó, pero no se pudo generar la respuesta final.",
      },
      {
        status: error.status,
      }
    );
  }

  throw error;
}
}

if (!respuestaFinal) {
  respuestaFinal =
    herramientasEjecutadas.length > 0
      ? "La solicitud fue registrada correctamente."
      : "";
}

if (!respuestaFinal) {
  return NextResponse.json(
    {
      error:
        "La IA no devolvió una respuesta válida.",
    },
    {
      status: 502,
    }
  );
}

return NextResponse.json({
  respuesta: respuestaFinal,

      metadata: {
        conocimientosDisponibles:
          conocimientos.length,

        conocimientosUtilizados:
          conocimientosSeleccionados.length,

        fuentesUtilizadas:
          conocimientosSeleccionados.map(
            (item) => item.titulo
          ),

        memoriaDisponible:
          Object.keys(memoria).length > 0,

        camposMemoria:
          Object.keys(memoria).filter(
            (campo) =>
              campo !== "ultimaActualizacion"
          ),

        contextoCRM: {
          tagsUtilizados: tags.length,
          notasUtilizadas: notas.length,
          actividadesUtilizadas: actividades.length,
        },
        herramientasEjecutadas,
      },
    });
  } catch (error) {
    console.error(
      "Error interno en /api/gemini:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno del servidor.",
      },
      {
        status: 500,
      }
    );
  }
}