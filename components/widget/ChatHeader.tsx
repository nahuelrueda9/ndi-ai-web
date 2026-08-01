type ChatHeaderProps = {
  nombre: string;
  online?: boolean;
  onClose: () => void;
};

import { X } from "lucide-react";

export default function ChatHeader({
  nombre,
  online = true,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-blue-600 px-5 py-4 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-bold text-blue-600">
          {nombre.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            {nombre}
          </h2>

          <div className="flex items-center gap-2 text-sm text-blue-100">
            <div
              className={`h-2 w-2 rounded-full ${
                online ? "bg-green-400" : "bg-red-400"
              }`}
            />

            {online ? "En línea" : "Desconectado"}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-white/20"
      >
        <X size={22} />
      </button>
    </div>
  );
}