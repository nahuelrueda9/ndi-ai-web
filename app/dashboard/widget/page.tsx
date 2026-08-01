"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import WidgetSettingsForm from "@/components/widget/WidgetSettingsForm";
import WidgetMediaSettings from "@/components/widget/WidgetMediaSettings";
import PdfUploader from "@/components/knowledge/PdfUploader";
import WebsiteImporter from "@/components/knowledge/WebsiteImporter";

export default function WidgetPage() {
  const empresaId = "ZKe3UxYTjPDIHmS5SAwT";

  const [empresa, setEmpresa] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarEmpresa() {
      try {
        const snap = await getDoc(
          doc(db, "businesses", empresaId)
        );

        if (!snap.exists()) {
          setError("No se encontró la empresa.");
          return;
        }

        setEmpresa(snap.data());
      } catch (err) {
        console.error(err);
        setError("Error al cargar la empresa.");
      }
    }

    cargarEmpresa();
  }, [empresaId]);

  const codigo = `<script
src="${
    typeof window !== "undefined"
      ? window.location.origin
      : ""
  }/widget.js"
data-empresa="${empresaId}">
</script>`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);

      setCopiado(true);

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("No se pudo copiar el código.");
    }
  }

  if (error) {
    return (
      <div className="p-8 text-red-400">
        {error}
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="p-8">
        Cargando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <WidgetSettingsForm
        empresaId={empresaId}
        widget={empresa.widget}
      />

      <WidgetMediaSettings
        empresaId={empresaId}
        widget={empresa.widget}
      />

      <PdfUploader empresaId={empresaId} />

      <WebsiteImporter empresaId={empresaId} />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">
          Código de instalación
        </h2>

        <pre className="overflow-auto rounded-lg bg-zinc-950 p-4 text-sm">
          {codigo}
        </pre>

        <button
          onClick={copiar}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2"
        >
          {copiado ? "¡Copiado!" : "Copiar código"}
        </button>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold">
          Vista previa
        </h2>

        <iframe
          src={`/embed/widget?empresaId=${empresaId}`}
          title="Vista previa del widget"
          className="h-[700px] w-full rounded-xl border border-zinc-800"
        />
      </div>
    </div>
  );
}