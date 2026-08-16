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
    <Card className="p-3 sm:p-5">
      <p className="text-[11px] font-medium leading-4 text-slate-600 dark:text-zinc-400 sm:text-sm sm:leading-normal">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-bold leading-none text-slate-950 dark:text-white sm:mt-2 sm:text-3xl sm:leading-normal">
        {valor}
      </p>

      {descripcion && (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-zinc-600 sm:mt-2 sm:text-sm sm:leading-normal">
          {descripcion}
        </p>
      )}
    </Card>
  );
}