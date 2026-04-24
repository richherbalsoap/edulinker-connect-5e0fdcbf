import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const rootElement = document.getElementById("root")!;

const mountApp = () => {
  createRoot(rootElement).render(<App />);
};

// Cleanup: unregister any previously installed service workers and clear caches
// so old auto-reload behavior doesn't interfere with PIN setup or other flows.
const cleanupServiceWorkers = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => undefined)));
    }
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
};

mountApp();
cleanupServiceWorkers();
