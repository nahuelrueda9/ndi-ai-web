import Card from "@/components/Ui/Card";

type MetricCardProps = {
  titulo: string;
  valor: number;
  descripcion?: string;
};

export default function MetricCard({
  titulo,
  valor,
  descripcion,
}: MetricCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
        {valor}
      </p>

      {descripcion && (
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-600">
          {descripcion}
        </p>
      )}
    </Card>
  );
}