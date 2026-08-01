import { adminDb } from "./firebaseAdmin";

type DatosLead = {
  nombre?: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  puntuacionLead?: number;
  nivelInteres?: "bajo" | "medio" | "alto";
  etiquetas?: string[];
  estado?: "nuevo" | "contactado" | "negociacion" | "cliente" | "perdido";
};

export async function guardarLead(
  empresaId: string,
  chatId: string,
  datos: DatosLead
) {
  const datosLimpios = Object.fromEntries(
    Object.entries(datos).filter(
      ([, valor]) =>
        valor !== undefined &&
        valor !== null &&
        !(Array.isArray(valor) && valor.length === 0)
    )
  );

  const ahora = new Date();

  await adminDb
    .collection("companies")
    .doc(empresaId)
    .collection("leads")
    .doc(chatId)
    .set(
      {
        chatId,
        empresaId,

        nombre: "",
        email: "",
        telefono: "",
        empresa: "",

        puntuacionLead: 0,
        nivelInteres: "bajo",
        etiquetas: [],
        estado: "nuevo",

        createdAt: ahora,
        updatedAt: ahora,

        ...datosLimpios,
      },
      { merge: true }
    );
}