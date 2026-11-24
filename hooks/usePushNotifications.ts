"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Pegá acá tu clave pública VAPID copiada de Firebase si no la tenés en .env
const VAPID_KEY_FALLBACK = "BOg7GGV_t2HmcCMJA7CCBdl4BQOfwHgkhJdhd9HKbGiSwkTqqSPnIcHryd0_Qlgt2iQ8eifj31U1ffqlAhj4PFw";

function esDispositivoIOS() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function estaInstaladaComoPWA() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function usePushNotifications(empresaId?: string) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const suscribirNotificaciones = async () => {
    if (!empresaId) {
      alert("Error: Falta identificar la empresa.");
      return;
    }

    try {
      setLoading(true);

      const enIOS = esDispositivoIOS();
      const enPWA = estaInstaladaComoPWA();

      if (enIOS && !enPWA) {
        alert(
          "En iPhone, para recibir notificaciones en el celular tenés que abrir la página en Safari, tocar Compartir -> 'Agregar a inicio' y abrirla desde el ícono de tu pantalla principal."
        );
        return;
      }

      const supported = await isSupported();
      if (!supported) {
        alert(
          enIOS
            ? "En iPhone (iOS 16.4+), asegurate de tener la app abierta desde la pantalla de inicio para activar las notificaciones."
            : "Tu navegador no soporta notificaciones push."
        );
        return;
      }

      const resPermission = await Notification.requestPermission();
      setPermission(resPermission);

      if (resPermission !== "granted") {
        alert("Permiso denegado en el navegador.");
        return;
      }

      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const registration = await navigator.serviceWorker.ready;

      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || VAPID_KEY_FALLBACK;

      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!currentToken) {
        alert("No se pudo generar el token del teléfono.");
        return;
      }

      // Enviamos el token al endpoint de servidor
      const res = await fetch("/api/notificaciones/registrar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId, token: currentToken }),
      });

      if (!res.ok) {
        throw new Error("El servidor no pudo guardar el dispositivo.");
      }

      alert("✅ ¡Teléfono vinculado correctamente a las alertas!");
    } catch (err) {
      console.error("Error al activar notificaciones:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    loading,
    suscribirNotificaciones,
  };
}