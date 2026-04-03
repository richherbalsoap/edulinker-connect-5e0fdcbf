import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root")!;
const CACHE_RESET_FLAG = "edulinker-cache-reset-done";

const buildReloadUrl = () => {
  const url = new URL(window.location.href);
  const isPreviewHost =
    url.hostname.includes("id-preview--") ||
    url.hostname.includes("preview--") ||
    url.hostname.endsWith("lovable.app");

  if (isPreviewHost) {
    url.searchParams.set("_fresh", Date.now().toString());
  }

  return url.toString();
};

const unregisterAllServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return false;

  await Promise.all(registrations.map((registration) => registration.unregister()));
  return true;
};

const clearAllBrowserCaches = async () => {
  if (!("caches" in window)) return false;

  const cacheKeys = await caches.keys();
  if (cacheKeys.length === 0) return false;

  await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  return true;
};

const bootstrapApp = async () => {
  const [hadServiceWorkers, hadCaches] = await Promise.all([
    unregisterAllServiceWorkers(),
    clearAllBrowserCaches(),
  ]);

  if ((hadServiceWorkers || hadCaches) && sessionStorage.getItem(CACHE_RESET_FLAG) !== "true") {
    sessionStorage.setItem(CACHE_RESET_FLAG, "true");
    window.location.replace(buildReloadUrl());
    return;
  }

  sessionStorage.removeItem(CACHE_RESET_FLAG);
  createRoot(rootElement).render(<App />);
};

bootstrapApp().catch((error) => {
  console.error("Bootstrap error:", error);
  createRoot(rootElement).render(<App />);
});
