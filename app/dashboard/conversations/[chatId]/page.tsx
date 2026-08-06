import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    chatId: string;
  }>;
  searchParams: Promise<{
    empresaId?: string | string[];
  }>;
};

export default async function ConversationPage({
  params,
  searchParams,
}: PageProps) {
  const { chatId } = await params;
  const consulta = await searchParams;

  const empresaId = Array.isArray(consulta.empresaId)
    ? consulta.empresaId[0]
    : consulta.empresaId;

  if (!empresaId || !chatId) {
    redirect("/empresas");
  }

  redirect(
    `/empresas/${encodeURIComponent(
      empresaId
    )}/conversaciones/${encodeURIComponent(chatId)}`
  );
}