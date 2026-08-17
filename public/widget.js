(function () {
  "use strict";

  if (window.NDI_AI_WIDGET_LOADED) {
    return;
  }

  window.NDI_AI_WIDGET_LOADED = true;

  var script = document.currentScript;

  if (!script) {
    var scripts = document.getElementsByTagName("script");
    script = scripts[scripts.length - 1];
  }

  var empresaId =
    script.getAttribute("data-empresa-id") ||
    script.getAttribute("data-company-id");

  if (!empresaId) {
    console.error(
      "[NDI AI] Falta data-empresa-id en el código de instalación."
    );
    return;
  }

  var usarDockMobile =
    script.getAttribute("data-mobile-dock") === "true";

  var scriptUrl = new URL(
    script.src,
    window.location.href
  );

  var origen = scriptUrl.origin;

  var widgetUrl =
    origen +
    "/widget/" +
    encodeURIComponent(empresaId) +
    "?embed=1";

  var iframe =
    document.createElement("iframe");

  var anchoSolicitado = 320;
  var altoSolicitado = 118;

  iframe.src = widgetUrl;
  iframe.title = "Asistente virtual NDI AI";
  iframe.id = "ndi-ai-widget";

  iframe.setAttribute(
    "allow",
    "clipboard-write"
  );

  iframe.setAttribute(
    "loading",
    "eager"
  );

  iframe.setAttribute(
    "referrerpolicy",
    "strict-origin-when-cross-origin"
  );

  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "320px",
    height: "118px",
    maxWidth: "100vw",
    maxHeight: "100dvh",
    border: "0",
    background: "transparent",
    zIndex: "2147483647",
    colorScheme: "normal",
  });

  function aplicarTamano() {
    var esMobile =
      window.innerWidth <= 520;

    var esChatCompleto =
      anchoSolicitado > 350 &&
      altoSolicitado > 300;

    iframe.style.maxWidth = "100vw";
    iframe.style.maxHeight = "100dvh";

    /*
     * En la página pública mobile,
     * el asistente compacto ocupa
     * el lugar del botón de WhatsApp
     * dentro de la barra inferior.
     */
    if (
      usarDockMobile &&
      esMobile &&
      !esChatCompleto
    ) {
      iframe.style.left = "auto";
      iframe.style.right = "4px";
      iframe.style.bottom =
        "calc(4px + env(safe-area-inset-bottom, 0px))";
      iframe.style.width = "72px";
      iframe.style.height = "72px";

      return;
    }

    /*
     * Al abrir el chat en celular,
     * vuelve a ocupar toda la pantalla.
     */
    if (
      esChatCompleto &&
      esMobile
    ) {
      iframe.style.left = "0";
      iframe.style.right = "0";
      iframe.style.bottom = "0";

      iframe.style.width = "100vw";
      iframe.style.height = "100dvh";

      return;
    }

    /*
     * Escritorio / funcionamiento normal.
     */
    iframe.style.bottom = "0";

    iframe.style.width =
      Math.min(
        Math.max(
          anchoSolicitado,
          64
        ),
        Math.max(
          window.innerWidth,
          64
        )
      ) + "px";

    iframe.style.height =
      Math.min(
        Math.max(
          altoSolicitado,
          64
        ),
        Math.max(
          window.innerHeight,
          64
        )
      ) + "px";
  }

  aplicarTamano();

  window.addEventListener(
    "resize",
    aplicarTamano
  );

  document.body.appendChild(
    iframe
  );

  window.addEventListener(
    "message",
    function (event) {
      if (
        event.origin !== origen
      ) {
        return;
      }

      if (
        !event.data ||
        event.data.source !==
          "ndi-ai-widget"
      ) {
        return;
      }

      if (
        event.data.type ===
        "widget:position"
      ) {
        var posicion =
          event.data.position === "left"
            ? "left"
            : "right";

        /*
         * En mobile con dock,
         * siempre queda a la derecha.
         */
        if (
          usarDockMobile &&
          window.innerWidth <= 520
        ) {
          iframe.style.left =
            "auto";

          iframe.style.right =
            "8px";
        } else {
          iframe.style.left =
            posicion === "left"
              ? "0"
              : "auto";

          iframe.style.right =
            posicion === "right"
              ? "0"
              : "auto";
        }
      }

      if (
        event.data.type ===
        "widget:resize"
      ) {
        var width =
          Number(
            event.data.width
          );

        var height =
          Number(
            event.data.height
          );

        if (
          Number.isFinite(width)
        ) {
          anchoSolicitado =
            width;
        }

        if (
          Number.isFinite(height)
        ) {
          altoSolicitado =
            height;
        }

        aplicarTamano();
      }
    }
  );
})();