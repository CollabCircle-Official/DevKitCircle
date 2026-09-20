const CACHE = "devkitcircle-v2";
const CORE = ["/manifest.webmanifest", "/devkitcircle-logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== location.origin ||
    event.request.headers.has("range")
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        const cacheControl = response.headers.get("cache-control") || "";
        if (
          response.ok &&
          response.type === "basic" &&
          event.request.mode !== "navigate" &&
          !cacheControl.includes("no-store")
        ) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return Response.error();
      }),
  );
});
