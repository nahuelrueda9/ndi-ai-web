import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    empresaId?: string | string[];
  }>;
};

export default async function EmbedWidgetPage({
  searchParams,
}: PageProps) {
  const consulta = await searchParams;

  const empresaId = Array.isArray(consulta.empresaId)
    ? consulta.empresaId[0]
    : consulta.empresaId;

  if (!empresaId) {
    redirect("/empresas");
  }

  redirect(`/widget/${encodeURIComponent(empresaId)}`);
}