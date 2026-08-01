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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">{titulo}</p>

      <h2 className="mt-3 text-4xl font-bold text-white">
        {valor}
      </h2>

      {descripcion && (
        <p className="mt-2 text-sm text-zinc-500">
          {descripcion}
        </p>
      )}
    </div>
  );
}