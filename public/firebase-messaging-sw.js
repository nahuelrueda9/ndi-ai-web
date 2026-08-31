importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Configuración básica de Firebase (mismos datos que tu cliente)
firebase.initializeApp({
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
});

const messaging = firebase.messaging();

// Manejador en segundo plano cuando la app está cerrada o el celular bloqueado
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Nueva notificación";
  const notificationOptions = {
    body: payload.notification?.body || "Tenés una nueva actividad en tu negocio.",
    icon: payload.notification?.icon || "/icons/icon-192x192.png", // Logo de tu plataforma
    badge: "/icons/badge-72x72.png",
    data: {
      url: payload.data?.url || "/empresas",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Abrir la pantalla correspondiente cuando el dueño toca la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});