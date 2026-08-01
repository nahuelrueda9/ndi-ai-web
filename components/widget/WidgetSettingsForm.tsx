"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  empresaId: string;
  widget: any;
}

export default function WidgetSettingsForm({
  empresaId,
  widget,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombreBot: widget?.nombreBot || "NDI AI",
    saludo: widget?.saludo || "¡Hola! ¿En qué podemos ayudarte?",
    color: widget?.color || "#2563eb",
    posicion: widget?.posicion || "right",
    online:
      widget?.online === undefined ? true : widget.online,
  });

  async function guardar() {
    setLoading(true);

    await updateDoc(doc(db, "companies", empresaId), {
      widget: form,
    });

    setLoading(false);

    alert("Widget actualizado");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <h2 className="text-xl font-bold">
        Configuración del Widget
      </h2>

      <div>
        <label>Nombre del bot</label>

        <input
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2"
          value={form.nombreBot}
          onChange={(e) =>
            setForm({
              ...form,
              nombreBot: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Mensaje de bienvenida</label>

        <textarea
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2"
          value={form.saludo}
          onChange={(e) =>
            setForm({
              ...form,
              saludo: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Color</label>

        <input
          type="color"
          value={form.color}
          onChange={(e) =>
            setForm({
              ...form,
              color: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Posición</label>

        <select
          value={form.posicion}
          onChange={(e) =>
            setForm({
              ...form,
              posicion: e.target.value,
            })
          }
        >
          <option value="right">Derecha</option>
          <option value="left">Izquierda</option>
        </select>
      </div>

      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={form.online}
          onChange={(e) =>
            setForm({
              ...form,
              online: e.target.checked,
            })
          }
        />

        Mostrar como online
      </label>

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