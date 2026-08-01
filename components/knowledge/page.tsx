"use client";

import PdfUploader from "@/components/knowledge/PdfUploader";
import WebsiteImporter from "@/components/knowledge/WebsiteImporter";

export default function KnowledgePage() {
  const empresaId = "ZKe3UxYTjPDIHmS5SAwT";

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">
          Base de conocimiento
        </h1>

        <p className="mt-2 text-zinc-400">
          Agregá documentos o páginas web para entrenar al agente.
        </p>
      </div>

      <PdfUploader empresaId={empresaId} />

      <WebsiteImporter empresaId={empresaId} />
    </div>
  );
}