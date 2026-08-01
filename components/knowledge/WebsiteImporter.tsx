// components/knowledge/WebsiteImporter.tsx

"use client";

import { FormEvent, useState } from "react";

interface Props {
  empresaId: string;
}

export default function WebsiteImporter({ empresaId }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function importar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setMessage("❌ Ingresá una URL.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/knowledge/import-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId,
          url: cleanUrl,
        }),
      });

      const responseText = await response.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    `La API falló con estado ${response.status}. Revisá la terminal de VS Code.`
  );
}

      if (!response.ok) {
        throw new Error(data.error || "No se pudo importar el sitio web.");
      }

      setMessage(
        `✅ Sitio importado correctamente. ${
          data.chunks ?? 0
        } fragmentos agregados a la base de conocimiento.`
      );

      setUrl("");
    } catch (error) {
      setMessage(
        `❌ ${
          error instanceof Error
            ? error.message
            : "Ocurrió un error al importar el sitio web."
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={importar}
      className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div>
        <h2 className="text-xl font-bold">
          Importar página web
        </h2>

        <p className="mt-1 text-sm text-zinc-400">
          Pegá la dirección de una página para agregar su contenido a la base de
          conocimiento del chatbot.
        </p>
      </div>

      <div>
        <label
          htmlFor="website-url"
          className="text-sm text-zinc-400"
        >
          Dirección del sitio web
        </label>

        <input
          id="website-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://misitio.com"
          disabled={loading}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Importando..." : "Importar sitio web"}
      </button>

      {message && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm">
          {message}
        </div>
      )}
    </form>
  );
}