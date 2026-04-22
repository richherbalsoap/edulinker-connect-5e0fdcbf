import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const APP_BUILD_ID = __APP_BUILD_ID__;
const BUILD_STORAGE_KEY = "edulinker_build_id";

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

// Detect preview/iframe — vahan SW register na karein
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname === "localhost");

const clearAllCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));
};

// Build ID change hone pe ek baar redirect karo — loop safe hai
const bustOncePerBuild = (): boolean => {
  try {
    const lastBuild = localStorage.getItem(BUILD_STORAGE_KEY);
    const url = new URL(window.location.href);
    const hasBuildParam = url.searchParams.get("build") === APP_BUILD_ID;

    if (lastBuild !== APP_BUILD_ID) {
      localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID);

      if (!hasBuildParam && !document.hidden) {
        url.searchParams.set("build", APP_BUILD_ID);
        window.location.replace(url.toString());
        return true; // Redirect ho raha hai, app mount mat karo abhi
      }
    }

    // ?build param URL se clean karo
    if (hasBuildParam) {
      url.searchParams.delete("build");
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    // localStorage block ho toh ignore
  }

  return false;
};

const setupServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;

  // Preview/iframe me purane SW unregister karo, register mat karo
  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    clearAllCaches().catch(() => {});
    return;
  }

  // Build change detect hone pe hard refresh
  if (bustOncePerBuild()) return;

  let reloading = false;

  // Jab bhi new SW activate ho aur control le — turant auto reload
  // User se poochne ki zarurat nahi, silently update ho jao
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  // Pehle caches clear karo, phir SW register karo
  clearAllCaches()
    .catch(() => {})
    .then(() => navigator.serviceWorker.getRegistrations())
    .then((regs) => Promise.all(regs.map((r) => r.update().catch(() => undefined))))
    .then(() =>
      navigator.serviceWorker.register(`/sw.js?build=${APP_BUILD_ID}`, {
        updateViaCache: "none", // SW file kabhi cache mat karo
      }),
    )
    .then((registration) => {
      // Agar pehle se waiting SW hai — turant skip karo (auto reload trigger hoga)
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New version installed — turant activate karo, no popup
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Har baar app focus aaye ya visible ho — update check karo
      const forceUpdateCheck = () => {
        registration.update().catch(() => {});
      };

      window.addEventListener("focus", forceUpdateCheck);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          forceUpdateCheck();
        }
      });

      // Har 20 second mein bhi check karo
      setInterval(forceUpdateCheck, 20_000);
    })
    .catch((err) => {
      console.error("SW registration failed:", err);
    });
};

mountApp();
setupServiceWorker();
