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

  var scriptUrl = new URL(script.src, window.location.href);
  var origen = scriptUrl.origin;

  var widgetUrl =
    origen +
    "/widget/" +
    encodeURIComponent(empresaId) +
    "?embed=1";

  var iframe = document.createElement("iframe");

  var anchoSolicitado = 320;
  var altoSolicitado = 118;

  iframe.src = widgetUrl;
  iframe.title = "Asistente virtual NDI AI";
  iframe.id = "ndi-ai-widget";

  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("loading", "eager");
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
    var esMobile = window.innerWidth <= 520;

    var esChatCompleto =
      anchoSolicitado > 350 &&
      altoSolicitado > 300;

    iframe.style.maxWidth = "100vw";
    iframe.style.maxHeight = "100dvh";

    if (esMobile && !esChatCompleto) {
      iframe.style.bottom =
        "calc(84px + env(safe-area-inset-bottom, 0px))";
    } else {
      iframe.style.bottom = "0";
    }

    if (esChatCompleto && esMobile) {
      iframe.style.width = "100vw";
      iframe.style.height = "100dvh";
      return;
    }

    iframe.style.width =
      Math.min(
        Math.max(anchoSolicitado, 64),
        Math.max(window.innerWidth, 64)
      ) + "px";

    iframe.style.height =
      Math.min(
        Math.max(altoSolicitado, 64),
        Math.max(window.innerHeight, 64)
      ) + "px";
  }

  aplicarTamano();

  window.addEventListener("resize", aplicarTamano);

  document.body.appendChild(iframe);

  window.addEventListener("message", function (event) {
    if (event.origin !== origen) {
      return;
    }

    if (
      !event.data ||
      event.data.source !== "ndi-ai-widget"
    ) {
      return;
    }

    if (event.data.type === "widget:position") {
      var posicion =
        event.data.position === "left"
          ? "left"
          : "right";

      iframe.style.left =
        posicion === "left" ? "0" : "auto";

      iframe.style.right =
        posicion === "right" ? "0" : "auto";
    }

    if (event.data.type === "widget:resize") {
      var width = Number(event.data.width);
      var height = Number(event.data.height);

      if (Number.isFinite(width)) {
        anchoSolicitado = width;
      }

      if (Number.isFinite(height)) {
        altoSolicitado = height;
      }

      aplicarTamano();
    }
  });
})();