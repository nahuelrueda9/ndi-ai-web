"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Pegá acá tu clave pública VAPID copiada de Firebase si no la tenés en .env
const VAPID_KEY_FALLBACK = "BOg7GGV_t2HmcCMJA7CCBdl4BQOfwHgkhJdhd9HKbGiSwkTqqSPnIcHryd0_Qlgt2iQ8eifj31U1ffqlAhj4PFw";

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

      const supported = await isSupported();
      if (!supported) {
        alert("Tu navegador no soporta notificaciones push en segundo plano.");
        return;
      }

      const resPermission = await Notification.requestPermission();
      setPermission(resPermission);

      if (resPermission !== "granted") {
        alert("Permiso denegado. Activá los permisos de notificación en los ajustes de tu navegador.");
        return;
      }

      // Registro y espera del Service Worker
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const registration = await navigator.serviceWorker.ready;

      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || VAPID_KEY_FALLBACK;

      if (!vapidKey || vapidKey.startsWith("PEGAR_ACA")) {
        alert("Falta configurar la Clave VAPID pública de Firebase.");
        return;
      }

      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!currentToken) {
        alert("No se pudo obtener el identificador de notificación del teléfono.");
        return;
      }

      // Guardar token en el documento de la empresa
      const empresaRef = doc(db, "companies", empresaId);
      await setDoc(
        empresaRef,
        {
          fcmTokens: arrayUnion(currentToken),
        },
        { merge: true }
      );

      alert("✅ ¡Notificaciones push activadas con éxito en este celular!");
    } catch (err) {
      console.error("Error al activar notificaciones:", err);
      const mensajeError = err instanceof Error ? err.message : String(err);
      alert(`Hubo un error al activar: ${mensajeError}`);
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