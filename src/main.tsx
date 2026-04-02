import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root")!;

const bootstrapApp = async () => {
  if ("serviceWorker" in navigator) {
    const cleanupFlag = "edulinker-sw-cleanup-reloaded";
    const registrations = await navigator.serviceWorker.getRegistrations();
    const hadExistingController = Boolean(navigator.serviceWorker.controller);
    const hadRegistrations = registrations.length > 0;

    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
    }

    if ((hadExistingController || hadRegistrations) && !sessionStorage.getItem(cleanupFlag)) {
      sessionStorage.setItem(cleanupFlag, "true");
      window.location.reload();
      return;
    }

    sessionStorage.removeItem(cleanupFlag);
  }

  createRoot(rootElement).render(<App />);
};

bootstrapApp().catch((error) => {
  console.error("Failed to clear legacy PWA state:", error);
  createRoot(rootElement).render(<App />);
});
