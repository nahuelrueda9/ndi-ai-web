// components/knowledge/PdfUploader.tsx

"use client";

import { useRef, useState } from "react";

interface Props {
  empresaId: string;
}

export default function PdfUploader({ empresaId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function subir() {
    const file = inputRef.current?.files?.[0];

    if (!file) {
      alert("Seleccioná un PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("empresaId", empresaId);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/knowledge/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error");
      }

      setMessage(
        `✅ PDF procesado correctamente. ${data.chunks ?? 0} fragmentos agregados a la base de conocimiento.`
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold">
          Entrenar IA con PDF
        </h2>

        <p className="text-sm text-zinc-400 mt-1">
          Subí un catálogo, manual, preguntas frecuentes o cualquier documento
          para que el chatbot aprenda automáticamente.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="block w-full text-sm"
      />

      <button
        onClick={subir}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-2 disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Subir PDF"}
      </button>

      {message && (
        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}