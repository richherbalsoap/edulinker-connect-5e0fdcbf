import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root")!;

const bootstrapApp = async () => {
  // Step 1: Unregister OLD/stale service workers (non-VitePWA ones)
  // VitePWA apna SW khud manage karta hai, hume manually unregister nahi karna
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const staleRegs = registrations.filter(
      (r) => r.active?.scriptURL && !r.active.scriptURL.includes("sw.js")
    );
    if (staleRegs.length > 0) {
      await Promise.all(staleRegs.map((r) => r.unregister()));
    }
  }

  // Step 2: App render karo
  createRoot(rootElement).render(<App />);
};

bootstrapApp().catch((error) => {
  console.error("Bootstrap error:", error);
  createRoot(rootElement).render(<App />);
});
