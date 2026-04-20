import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root")!;

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

const bootstrapApp = async () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }

  await unregisterAllServiceWorkers();
  await clearRuntimeCaches();
  mountApp();
};

bootstrapApp().catch((error) => {
  console.error("Bootstrap error:", error);
  mountApp();
});
