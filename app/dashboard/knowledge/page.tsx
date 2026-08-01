"use client";

import PdfUploader from "@/components/knowledge/PdfUploader";
import WebsiteImporter from "@/components/knowledge/WebsiteImporter";

export default function KnowledgePage() {
  const empresaId = "ZKe3UxYTjPDIHmS5SAwT";

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-8">
      <h1 className="text-3xl font-bold">Base de conocimiento</h1>

      <PdfUploader empresaId={empresaId} />

      <WebsiteImporter empresaId={empresaId} />
    </div>
  );
}