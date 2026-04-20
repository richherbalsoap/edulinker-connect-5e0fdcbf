import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root")!;

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("preview--") ||
  window.location.hostname.endsWith("lovable.app") ||
  window.location.hostname.includes("lovableproject.com");

const shouldDisablePwa = isInIframe || isPreviewHost;

const unregisterAllServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

const mountApp = () => {
  createRoot(rootElement).render(<App />);
};

const clearRuntimeCaches = async () => {
  if (!("caches" in window)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  let isRefreshing = false;

  const forceRefresh = async () => {
    if (isRefreshing) return;
    isRefreshing = true;
    await clearRuntimeCaches();
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void forceRefresh();
  });

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

  const triggerUpdateCheck = () => {
    void registration.update().catch(() => undefined);
  };

  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      }
    });
  });

  window.addEventListener("focus", triggerUpdateCheck);
  window.addEventListener("online", triggerUpdateCheck);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      triggerUpdateCheck();
    }
  });

  window.setInterval(triggerUpdateCheck, 60_000);
  triggerUpdateCheck();
};

const bootstrapApp = async () => {
  if (shouldDisablePwa) {
    await unregisterAllServiceWorkers();
    mountApp();
    return;
  }

  await registerServiceWorker();

  mountApp();
};

bootstrapApp().catch((error) => {
  console.error("Bootstrap error:", error);
  mountApp();
});
