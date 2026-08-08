type DiaConversaciones = {
  dia: string;
  cantidad: number;
};

type DashboardChartProps = {
  datos: DiaConversaciones[];
};

export default function DashboardChart({
  datos,
}: DashboardChartProps) {
  const maximo = Math.max(
    ...datos.map((item) => item.cantidad),
    1
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Conversaciones de los últimos 7 días
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
          Actividad diaria registrada en el widget.
        </p>
      </div>

      <div className="mt-8 flex h-64 items-end gap-3">
        {datos.map((item) => {
          const altura =
            item.cantidad === 0
              ? 4
              : Math.max(
                  (item.cantidad / maximo) * 100,
                  8
                );

          return (
            <div
              key={item.dia}
              className="flex flex-1 flex-col items-center gap-3"
            >
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                {item.cantidad}
              </span>

              <div className="flex h-44 w-full items-end rounded-xl bg-slate-100 p-1 dark:bg-zinc-950">
                <div
                  className="w-full rounded-lg bg-blue-500 transition-all"
                  style={{
                    height: `${altura}%`,
                  }}
                />
              </div>

              <span className="text-xs text-slate-500 dark:text-zinc-500">
                {item.dia}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}