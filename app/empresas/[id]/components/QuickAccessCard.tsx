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
      className="text-left"
    >
      <Card className="h-full cursor-pointer p-6 transition hover:border-blue-500">
        <h3 className="text-lg font-semibold text-white">
          {titulo}
        </h3>

        <p className="mt-2 text-sm text-zinc-500">
          {descripcion}
        </p>
      </Card>
    </button>
  );
}