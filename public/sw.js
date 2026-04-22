// Build ID Vite se inject hoga — har deploy pe naya
declare const __APP_BUILD_ID__: string;
const BUILD_ID = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : Date.now().toString();
const CACHE_NAME = "edulinker-v-" + BUILD_ID;

// Turant waiting skip karo — koi ruko mat
self.skipWaiting();

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // Sabhi purane caches delete karo install pe hi
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      // Turant activate ho jao
      await (self as ServiceWorkerGlobalScope).skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // Purane caches phir se clean karo activate pe
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      // Sabhi open tabs ko turant control karo — reload trigger hoga
      await (self as ServiceWorkerGlobalScope).clients.claim();
    })()
  );
});

// Pure network-first — koi bhi cheez cache se mat do
self.addEventListener("fetch", (event: FetchEvent) => {
  const request = event.request;

  // Only GET requests handle karo
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Sirf apna origin handle karo
  if (url.origin !== (self as ServiceWorkerGlobalScope).location.origin) return;

  // HTML pages ke liye — hamesha network se, cache bilkul nahi
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.match(request).then((cached) => cached || fetch(request))
      )
    );
    return;
  }

  // Baaki sab bhi network-first, no-store
  event.respondWith(fetch(request, { cache: "no-store" }));
});

// SKIP_WAITING message handle karo (backup)
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    (self as ServiceWorkerGlobalScope).skipWaiting();
  }
});
