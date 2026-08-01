(function () {
  "use strict";

  if (window.__NDI_AI_WIDGET_LOADED__) {
    return;
  }

  window.__NDI_AI_WIDGET_LOADED__ = true;

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

  var widgetAbierto = true;
  var anchoSolicitado = 430;
  var altoSolicitado = 700;

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
    width: "430px",
    height: "700px",
    maxWidth: "100vw",
    maxHeight: "100dvh",
    border: "0",
    background: "transparent",
    zIndex: "2147483647",
    colorScheme: "normal",
  });

  function aplicarTamano() {
    if (!widgetAbierto) {
      iframe.style.width = "88px";
      iframe.style.height = "88px";
      iframe.style.maxWidth = "88px";
      iframe.style.maxHeight = "88px";
      return;
    }

    iframe.style.maxWidth = "100vw";
    iframe.style.maxHeight = "100dvh";

    if (window.innerWidth <= 520) {
      iframe.style.width = "100vw";
      iframe.style.height = "100dvh";
      return;
    }

    iframe.style.width =
      Math.min(Math.max(anchoSolicitado, 80), 520) + "px";

    iframe.style.height =
      Math.min(Math.max(altoSolicitado, 80), 760) + "px";
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

      widgetAbierto =
        anchoSolicitado > 100 &&
        altoSolicitado > 100;

      aplicarTamano();
    }
  });
})();