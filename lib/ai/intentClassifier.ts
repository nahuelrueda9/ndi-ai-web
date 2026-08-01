export type Intencion =
  | "saludo"
  | "compra"
  | "precio"
  | "soporte"
  | "reclamo"
  | "humano"
  | "despedida"
  | "general";

function tiene(texto: string, palabras: string[]) {
  return palabras.some((p) => texto.includes(p));
}

export function detectarIntencion(mensaje: string): Intencion {
  const t = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    tiene(t, [
      "hola",
      "buenas",
      "buen dia",
      "buenas tardes",
      "buenas noches",
    ])
  ) {
    return "saludo";
  }

  if (
    tiene(t, [
      "precio",
      "presupuesto",
      "cuanto cuesta",
      "cuanto sale",
      "cotizacion",
    ])
  ) {
    return "precio";
  }

  if (
    tiene(t, [
      "comprar",
      "contratar",
      "quiero",
      "me interesa",
    ])
  ) {
    return "compra";
  }

  if (
    tiene(t, [
      "problema",
      "error",
      "no funciona",
      "ayuda",
      "soporte",
    ])
  ) {
    return "soporte";
  }

  if (
    tiene(t, [
      "reclamo",
      "estafa",
      "pesimo",
      "vergüenza",
      "vergueza",
      "molesto",
    ])
  ) {
    return "reclamo";
  }

  if (
    tiene(t, [
      "asesor",
      "persona",
      "humano",
      "llamame",
      "contactame",
    ])
  ) {
    return "humano";
  }

  if (
    tiene(t, [
      "gracias",
      "hasta luego",
      "chau",
      "adios",
    ])
  ) {
    return "despedida";
  }

  return "general";
}