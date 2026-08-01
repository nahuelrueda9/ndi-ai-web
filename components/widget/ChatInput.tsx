"use client";

import { KeyboardEvent } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  mensaje: string;
  setMensaje: (value: string) => void;
  onEnviar: () => void;
  cargando?: boolean;
};

export default function ChatInput({
  mensaje,
  setMensaje,
  onEnviar,
  cargando = false,
}: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (!cargando && mensaje.trim()) {
        onEnviar();
      }
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu mensaje..."
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition focus:border-blue-600"
        />

        <button
          onClick={onEnviar}
          disabled={cargando || !mensaje.trim()}
          className="rounded-xl bg-blue-600 p-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}