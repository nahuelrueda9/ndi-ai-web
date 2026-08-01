import Card from "@/components/Ui/Card";

type Props = {
  nombre: string;
  mensaje: string;
  estado: string;
  puntuacion: number;
  onClick: () => void;
};

export default function RecentConversationCard({
  nombre,
  mensaje,
  estado,
  puntuacion,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className="p-5 transition hover:border-blue-500">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white truncate">
            {nombre}
          </h3>

          <span
            className={`rounded-full px-2 py-1 text-xs ${
              estado === "cerrada"
                ? "bg-zinc-700 text-zinc-300"
                : "bg-green-600/20 text-green-400"
            }`}
          >
            {estado === "cerrada"
              ? "Cerrada"
              : "Abierta"}
          </span>
        </div>

        <p className="mt-3 truncate text-sm text-zinc-400">
          {mensaje}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Lead Score
          </span>

          <span className="font-bold text-white">
            {puntuacion}/100
          </span>
        </div>
      </Card>
    </button>
  );
}