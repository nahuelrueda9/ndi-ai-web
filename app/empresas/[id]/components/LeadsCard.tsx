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
      <h2 className="text-lg font-semibold text-white">
        Leads
      </h2>

      <p className="mt-1 text-sm text-zinc-500">
        Clasificación automática.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-zinc-400">
            Total
          </span>

          <span className="font-bold text-white">
            {total}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-red-400">
            🔥 Calientes
          </span>

          <span className="font-bold text-white">
            {calientes}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-yellow-400">
            🟡 Medios
          </span>

          <span className="font-bold text-white">
            {medios}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-blue-400">
            🔵 Fríos
          </span>

          <span className="font-bold text-white">
            {frios}
          </span>
        </div>
      </div>
    </Card>
  );
}