// Smart versioning — har deploy pe naya cache name
self.skipWaiting();

const CACHE_NAME = "app-v" + Date.now();

self.addEventListener("install", (event) => {
  // Naya SW turant waiting state se nikle
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purane caches delete karo
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      // Sabhi open tabs ko turant control karo
      await self.clients.claim();
    })(),
  );
});

// Network-first fetch: hamesha latest try karo, fallback cache
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(fetch(request, { cache: "no-store" }));
});

// Page se SKIP_WAITING message aaye to turant activate
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});