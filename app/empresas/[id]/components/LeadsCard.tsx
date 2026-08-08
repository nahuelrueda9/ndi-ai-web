import Card from "@/components/Ui/Card";

type Props = {
  total: number;
  calientes: number;
  medios: number;
  frios: number;
};

export default function LeadsCard({
  total,
  calientes,
  medios,
  frios,
}: Props) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        Leads
      </h2>

      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
        Clasificación automática.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-zinc-400">
            Total
          </span>

          <span className="font-bold text-slate-950 dark:text-white">
            {total}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-red-600 dark:text-red-400">
            🔥 Calientes
          </span>

          <span className="font-bold text-slate-950 dark:text-white">
            {calientes}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-amber-600 dark:text-yellow-400">
            🟡 Medios
          </span>

          <span className="font-bold text-slate-950 dark:text-white">
            {medios}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">
            🔵 Fríos
          </span>

          <span className="font-bold text-slate-950 dark:text-white">
            {frios}
          </span>
        </div>
      </div>
    </Card>
  );
}