/* Packaged locally from the Unity build. No remote runtime scripts or analytics. */
(() => {
  "use strict";
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));
  document.documentElement.classList.toggle("mobile", mobile);
  const canvas = document.getElementById("game");
  const start = document.getElementById("start");
  const status = document.getElementById("status");
  const progress = document.getElementById("progress");
  const retry = document.getElementById("retry");
  let started = false;
  // Unity adds its mobile keyboard to the body. Keep that input separate from
  // the loading card so its confirmation stays visible on narrow screens.
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof HTMLElement) || node.parentElement !== document.body) continue;
      const input = node.querySelector("textarea,input");
      const done = node.querySelector("button");
      if (!input || !done) continue;
      node.classList.add("unity-keyboard");
      input.setAttribute("aria-label", "Anotações do caderno");
      done.textContent = "PRONTO";
      done.setAttribute("aria-label", "Concluir escrita");
    }
  }).observe(document.body, {childList: true});
  function showError() {
    const error = document.getElementById("error");
    error.textContent = "Não foi possível abrir o jogo. Verifique a conexão, feche outras abas e tente novamente no Safari ou no Chrome atualizado.";
    error.hidden = false;
    document.getElementById("download").hidden = true;
    document.getElementById("loading").hidden = false;
    retry.hidden = false;
  }
  retry.addEventListener("click", () => location.reload());
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  start.addEventListener("click", async () => {
    if (started) return;
    started = true;
    start.hidden = true;
    document.getElementById("download").hidden = false;
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "Build/Web.loader.js";
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
      // Unity measures the canvas during startup, so keep it laid out underneath
      // the loading card instead of initializing a hidden, zero-sized surface.
      canvas.hidden = false;
      const instance = await createUnityInstance(canvas, {
        dataUrl: "Build/Web.data.unityweb",
        frameworkUrl: "Build/Web.framework.js.unityweb",
        codeUrl: "Build/Web.wasm.unityweb",
        streamingAssetsUrl: "StreamingAssets",
        autoSyncPersistentDataPath: true,
        fullscreenElementID: "stage",
        companyName: "Colégio Talentos",
        productName: "Elas na Ciência",
        productVersion: "1.1.2",
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
        showBanner: (message, type) => {
          if (type === "error") { console.error(message); showError(); }
          else console.warn(message);
        }
      }, value => {
        progress.value = value;
        status.textContent = value < 0.9 ? `Carregando o jogo… ${Math.round(value * 100)}%` : "Preparando a sala…";
      });
      window.elasGame = instance;
      document.getElementById("loading").hidden = true;
      canvas.focus({preventScroll: true});
    } catch (error) {
      console.error("Falha ao iniciar Elas na Ciência", error);
      showError();
    }
  });
})();
