"use client";

import ChatWidget from "@/components/widget/ChatWidget";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WidgetLoader() {
  const params = useSearchParams();

  const empresaId = params.get("empresaId");

  if (!empresaId) {
    return (
      <div className="p-10">
        Falta el parámetro empresaId
      </div>
    );
  }

  return <ChatWidget empresaId={empresaId} />;
}

export default function EmbedWidgetPage() {
  return (
    <Suspense fallback={null}>
      <WidgetLoader />
    </Suspense>
  );
}