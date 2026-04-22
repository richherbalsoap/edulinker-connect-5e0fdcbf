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
    </ClerkProvider>
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

const showUpdateToast = (registration: ServiceWorkerRegistration) => {
  // Agar pehle se popup hai to skip
  if (document.getElementById("__app_update_toast__")) return;

  const toast = document.createElement("div");
  toast.id = "__app_update_toast__";
  toast.setAttribute("role", "alert");
  toast.style.cssText = [
    "position:fixed",
    "bottom:20px",
    "left:50%",
    "transform:translateX(-50%)",
    "z-index:2147483647",
    "background:hsl(0,0%,10%)",
    "color:hsl(51,100%,50%)",
    "border:1px solid hsl(51,100%,50%)",
    "border-radius:12px",
    "padding:12px 16px",
    "font-family:inherit",
    "font-size:14px",
    "box-shadow:0 10px 30px rgba(0,0,0,0.4)",
    "display:flex",
    "gap:12px",
    "align-items:center",
    "max-width:92vw",
  ].join(";");

  const text = document.createElement("span");
  text.textContent = "New update available";
  text.style.color = "hsl(0,0%,95%)";

  const btn = document.createElement("button");
  btn.textContent = "Refresh";
  btn.style.cssText = [
    "background:hsl(51,100%,50%)",
    "color:hsl(0,0%,7%)",
    "border:none",
    "border-radius:8px",
    "padding:6px 12px",
    "font-weight:600",
    "cursor:pointer",
  ].join(";");
  btn.onclick = () => {
    const waiting = registration.waiting;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  toast.appendChild(text);
  toast.appendChild(btn);
  document.body.appendChild(toast);
};

const clearAllCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));
};

const bustOncePerBuild = () => {
  const lastBuild = localStorage.getItem(BUILD_STORAGE_KEY);
  const url = new URL(window.location.href);
  const hasBuildParam = url.searchParams.get("build") === APP_BUILD_ID;

  if (lastBuild !== APP_BUILD_ID) {
    localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID);

    if (!hasBuildParam && !document.hidden) {
      url.searchParams.set("build", APP_BUILD_ID);
      window.location.replace(url.toString());
      return true;
    }
  }

  if (hasBuildParam) {
    url.searchParams.delete("build");
    window.history.replaceState({}, "", url.toString());
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

  if (bustOncePerBuild()) return;

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  clearAllCaches()
    .catch(() => {})
    .then(() => navigator.serviceWorker.getRegistrations())
    .then((regs) => Promise.all(regs.map((r) => r.update().catch(() => undefined))))
    .then(() =>
      navigator.serviceWorker.register(`/sw.js?build=${APP_BUILD_ID}`, {
        updateViaCache: "none",
      }),
    )
    .then((registration) => {
      // Agar already waiting SW hai to popup dikhao
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateToast(registration);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New version ready — popup
            showUpdateToast(registration);
          }
        });
      });

      const forceUpdateCheck = () => {
        registration.update().catch(() => {});
      };

      window.addEventListener("focus", forceUpdateCheck);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          forceUpdateCheck();
        }
      });

      setInterval(forceUpdateCheck, 20_000);
    })
    .catch((err) => {
      console.error("SW registration failed:", err);
    });
};

mountApp();
setupServiceWorker();
