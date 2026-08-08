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
      <Card className="p-5 transition hover:border-blue-400 dark:hover:border-blue-500/30">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate font-semibold text-slate-950 dark:text-white">
            {nombre}
          </h3>

          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              estado === "cerrada"
                ? "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-green-600/20 dark:text-green-400"
            }`}
          >
            {estado === "cerrada"
              ? "Cerrada"
              : "Abierta"}
          </span>
        </div>

        <p className="mt-3 truncate text-sm text-slate-600 dark:text-zinc-400">
          {mensaje}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-zinc-500">
            Lead Score
          </span>

          <span className="font-bold text-slate-950 dark:text-white">
            {puntuacion}/100
          </span>
        </div>
      </Card>
    </button>
  );
}