"use client";

import { useEffect } from "react";

type PublicAnalyticsProps = {
  slug: string;
};

const VISITOR_KEY =
  "ndi-ai-public-page-visitor-id";

function obtenerVisitanteId() {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  const existente =
    window.localStorage.getItem(
      VISITOR_KEY,
    );

  if (existente) {
    return existente;
  }

  const nuevo =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitante-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  window.localStorage.setItem(
    VISITOR_KEY,
    nuevo,
  );

  return nuevo;
}

async function registrarEvento({
  slug,
  tipo,
  visitanteId,
}: {
  slug: string;
  tipo:
    | "page_view"
    | "whatsapp_click";
  visitanteId: string;
}) {
  try {
    await fetch(
      "/api/public/analytics",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          slug,
          tipo,
          visitanteId,
        }),
        keepalive: true,
      },
    );
  } catch (error) {
    console.error(
      "No se pudo registrar analytics:",
      error,
    );
  }
}

export default function PublicAnalytics({
  slug,
}: PublicAnalyticsProps) {
  useEffect(() => {
    if (!slug) {
      return;
    }

    const visitanteId =
      obtenerVisitanteId();

    if (!visitanteId) {
      return;
    }

    void registrarEvento({
      slug,
      tipo: "page_view",
      visitanteId,
    });

    function manejarClick(
      event: MouseEvent,
    ) {
      const elemento =
        event.target as HTMLElement | null;

      const enlace =
        elemento?.closest(
          "[data-analytics-event]",
        ) as HTMLElement | null;

      if (!enlace) {
        return;
      }

      const tipo =
        enlace.dataset
          .analyticsEvent;

      if (
        tipo !==
        "whatsapp_click"
      ) {
        return;
      }

      void registrarEvento({
        slug,
        tipo,
        visitanteId,
      });
    }

    document.addEventListener(
      "click",
      manejarClick,
    );

    return () => {
      document.removeEventListener(
        "click",
        manejarClick,
      );
    };
  }, [slug]);

  return null;
}