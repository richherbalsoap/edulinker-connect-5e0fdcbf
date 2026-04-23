import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

const rootElement = document.getElementById("root")!;

const mountApp = () => {
  createRoot(rootElement).render(
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/login"
      appearance={{
        variables: {
          colorPrimary: "hsl(51, 100%, 50%)",
          colorBackground: "hsl(0, 0%, 7%)",
          colorText: "hsl(0, 0%, 95%)",
          colorInputBackground: "hsl(0, 0%, 10%)",
          colorInputText: "hsl(0, 0%, 95%)",
          borderRadius: "0.75rem",
          fontFamily: "inherit",
        },
      }}
    >
      <App />
    </ClerkProvider>,
  );
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
