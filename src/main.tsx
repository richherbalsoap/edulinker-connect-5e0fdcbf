import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

const rootElement = document.getElementById("root")!;

const unregisterAllServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return false;
  await Promise.all(registrations.map((registration) => registration.unregister()));
  return true;
};

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
    </ClerkProvider>
  );
};

const clearRuntimeCaches = async () => {
  if (!("caches" in window)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
};

const bootstrapApp = async () => {
  // Self-destruct any leftover service workers from previous deployments.
  // We do NOT add a `controllerchange` reload listener — that creates
  // infinite reload loops when the SW unregisters itself.
  const hadServiceWorker = await unregisterAllServiceWorkers();
  await clearRuntimeCaches();

  // If we just killed an old service worker, do ONE forced reload so the
  // user immediately gets the latest deployed assets (no more stale cache).
  // Use a sessionStorage flag to avoid loops.
  if (hadServiceWorker && !sessionStorage.getItem("__sw_purged__")) {
    sessionStorage.setItem("__sw_purged__", "1");
    window.location.reload();
    return;
  }

  mountApp();
};

bootstrapApp().catch((error) => {
  console.error("Bootstrap error:", error);
  mountApp();
});
