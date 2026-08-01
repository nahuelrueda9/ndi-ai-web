"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  empresaId: string;
  empresa: any;
}

export default function CompanyInfoForm({
  empresaId,
  empresa,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    telefono: empresa?.telefono || "",
    whatsapp: empresa?.whatsapp || "",
    email: empresa?.email || "",
    direccion: empresa?.direccion || "",
    horario: empresa?.horario || "",
    sitioWeb: empresa?.sitioWeb || "",
    formasPago: empresa?.formasPago || "",
  });

  async function guardar() {
    setLoading(true);

    await updateDoc(doc(db, "companies", empresaId), form);

    setLoading(false);

    alert("Información guardada");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <h2 className="text-xl font-bold">Información de la empresa</h2>

      {[
        ["telefono", "Teléfono"],
        ["whatsapp", "WhatsApp"],
        ["email", "Email"],
        ["direccion", "Dirección"],
        ["horario", "Horario"],
        ["sitioWeb", "Sitio Web"],
        ["formasPago", "Formas de pago"],
      ].map(([key, label]) => (
        <div key={key}>
          <label className="text-sm text-zinc-400">{label}</label>

          <input
            value={(form as any)[key]}
            onChange={(e) =>
              setForm({
                ...form,
                [key]: e.target.value,
              })
            }
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </div>
      ))}

      <button
        onClick={guardar}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-2"
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}