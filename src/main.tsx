import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
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

const bootstrapApp = async () => {
  if (shouldDisablePwa) {
    await unregisterAllServiceWorkers();
    mountApp();
    return;
  }

  if ("serviceWorker" in navigator) {
    let isRefreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (isRefreshing) return;
      isRefreshing = true;
      window.location.reload();
    });

    registerSW({ immediate: true });
  }

  mountApp();
};

bootstrapApp().catch((error) => {
  console.error("Bootstrap error:", error);
  mountApp();
});
