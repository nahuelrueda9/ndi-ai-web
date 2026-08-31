"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePushNotifications(empresaId?: string) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const suscribirNotificaciones = async () => {
    if (!empresaId) return;

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
        alert("Permiso de notificaciones denegado.");
        return;
      }

      const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const messaging = getMessaging();

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      });

      if (currentToken) {
        // Guardamos el token en la empresa para poder notificar a este dispositivo
        const empresaRef = doc(db, "companies", empresaId);
        await updateDoc(empresaRef, {
          fcmTokens: arrayUnion(currentToken),
        });
        alert("¡Notificaciones activadas con éxito en este teléfono!");
      }
    } catch (err) {
      console.error("Error al activar notificaciones:", err);
      alert("Hubo un error activando las notificaciones.");
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