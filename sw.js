const CACHE = "masri-ru-v1";
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./course-data.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  ...Array.from({ length: 12 }, (_, index) => `./assets/images/module-${String(index + 1).padStart(2, "0")}.svg`),
  "./assets/videos/01-first-phrases.mp4",
  "./assets/videos/02-cafe.mp4",
  "./assets/videos/03-directions.mp4",
  "./assets/captions/01-first-phrases.vtt",
  "./assets/captions/02-cafe.vtt",
  "./assets/captions/03-directions.vtt"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});
