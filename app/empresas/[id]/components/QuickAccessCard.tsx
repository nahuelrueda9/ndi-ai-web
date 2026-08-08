import Card from "@/components/Ui/Card";

type QuickAccessCardProps = {
  titulo: string;
  descripcion: string;
  onClick: () => void;
};

export default function QuickAccessCard({
  titulo,
  descripcion,
  onClick,
}: QuickAccessCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className="h-full cursor-pointer p-5 transition hover:border-blue-400 dark:hover:border-blue-500/30">
        <h3 className="font-semibold text-slate-950 dark:text-white">
          {titulo}
        </h3>

        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
          {descripcion}
        </p>
      </Card>
    </button>
  );
}