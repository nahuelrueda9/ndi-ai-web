// components/widget/WidgetMediaSettings.tsx

"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  empresaId: string;
  widget: any;
}

export default function WidgetMediaSettings({
  empresaId,
  widget,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    logo: widget?.logo || "",
    avatar: widget?.avatar || "",
  });

  async function guardar() {
    setLoading(true);

    await updateDoc(doc(db, "companies", empresaId), {
      "widget.logo": form.logo,
      "widget.avatar": form.avatar,
    });

    setLoading(false);

    alert("Imágenes actualizadas");
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-bold">
        Logo y avatar
      </h2>

      <div>
        <label className="text-sm text-zinc-400">
          URL del logo
        </label>

        <input
          value={form.logo}
          onChange={(e) =>
            setForm({
              ...form,
              logo: e.target.value,
            })
          }
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm text-zinc-400">
          URL del avatar
        </label>

        <input
          value={form.avatar}
          onChange={(e) =>
            setForm({
              ...form,
              avatar: e.target.value,
            })
          }
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
        />
      </div>

      <div className="flex gap-4">
        {form.logo && (
          <div>
            <p className="mb-2 text-xs text-zinc-500">
              Logo
            </p>

            <img
              src={form.logo}
              alt="Logo"
              className="h-16 w-16 rounded-xl object-cover"
            />
          </div>
        )}

        {form.avatar && (
          <div>
            <p className="mb-2 text-xs text-zinc-500">
              Avatar
            </p>

            <img
              src={form.avatar}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
        )}
      </div>

      <button
        onClick={guardar}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-2 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar imágenes"}
      </button>
    </div>
  );
}