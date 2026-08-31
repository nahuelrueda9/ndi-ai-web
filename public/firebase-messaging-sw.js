importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
});

const messaging = firebase.messaging();

// 1. Manejador oficial de Firebase
messaging.onBackgroundMessage((payload) => {
  const titulo = payload.notification?.title || "NDI AI";
  const opciones = {
    body: payload.notification?.body || "Nueva actividad en tu negocio.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    tag: "ndi-" + Date.now(),
    data: {
      url: payload.data?.url || "/empresas",
    },
  };

  return self.registration.showNotification(titulo, opciones);
});

// 2. Respaldo nativo para cuando el teléfono está bloqueado / pantalla apagada
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const titulo = data.notification?.title || data.data?.title || "NDI AI";
    const cuerpo = data.notification?.body || data.data?.body || "Nueva reserva o pedido.";

    const opciones = {
      body: cuerpo,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      tag: "ndi-push-" + Date.now(),
      data: {
        url: data.data?.url || data.fcmOptions?.link || "/empresas",
      },
    };

    event.waitUntil(self.registration.showNotification(titulo, opciones));
  } catch {
    // Si no vino como JSON, se procesa texto plano
    event.waitUntil(
      self.registration.showNotification("NDI AI", {
        body: event.data.text(),
        icon: "/icons/icon-192x192.png",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
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