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
      <Card className="h-full cursor-pointer p-3 transition hover:border-blue-400 sm:p-5 dark:hover:border-blue-500/30">
        <h3 className="text-[12px] font-semibold leading-4 text-slate-950 dark:text-white sm:text-base sm:leading-normal">
          {titulo}
        </h3>

        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm sm:leading-normal">
          {descripcion}
        </p>
      </Card>
    </button>
  );
}