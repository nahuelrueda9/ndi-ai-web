"use client";

import { useState } from "react";

export default function PruebaPage() {
  const [mensaje, setMensaje] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setCargando(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje,
        }),
      });

      const data = await res.json();

      if (data.respuesta) {
        setRespuesta(data.respuesta);
      } else {
        setRespuesta(data.error);
      }
    } catch {
      setRespuesta("Error al conectar con la API.");
    }

    setCargando(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-4">
      <h1 className="text-3xl font-bold">
        Prueba de Gemini
      </h1>

      <textarea
        className="border p-3 w-full rounded"
        rows={6}
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Escribí un mensaje..."
      />

      <button
        onClick={enviar}
        className="bg-blue-600 text-white px-5 py-2 rounded"
      >
        {cargando ? "Consultando..." : "Enviar"}
      </button>

      <div className="border rounded p-4 whitespace-pre-wrap">
        {respuesta}
      </div>
    </main>
  );
}