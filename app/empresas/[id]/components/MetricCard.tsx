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
    <Card className="p-6">
      <p className="text-sm text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {valor}
      </p>

      {descripcion && (
        <p className="mt-2 text-sm text-zinc-600">
          {descripcion}
        </p>
      )}
    </Card>
  );
}