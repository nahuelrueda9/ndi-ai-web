type StatCardProps = {
  titulo: string;
  valor: string | number;
  descripcion?: string;
};

export default function StatCard({
  titulo,
  valor,
  descripcion,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
        {titulo}
      </p>

      <h2 className="mt-3 text-4xl font-bold text-slate-950 dark:text-white">
        {valor}
      </h2>

      {descripcion && (
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
          {descripcion}
        </p>
      )}
    </div>
  );
}