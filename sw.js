const CACHE = "masri-ru-v3";
const PAID_MEDIA = [
  "/assets/videos/02-",
  "/assets/videos/03-",
  "/assets/videos/04-",
  "/assets/captions/02-",
  "/assets/captions/03-",
  "/assets/captions/04-"
];
const TEXTBOOK_FREE = [
  "/assets/textbook/chapters/chapter-introduction.pdf",
  "/assets/textbook/chapters/chapter-alphabet.pdf",
  "/assets/textbook/chapters/chapter-unit-01.pdf",
  "/assets/textbook/audio/alphabet.mp3",
  "/assets/textbook/audio/lesson-m1l1.mp3",
  "/assets/textbook/audio/lesson-m1l2.mp3",
  "/assets/textbook/audio/lesson-m1l3.mp3"
];
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
  "./assets/captions/01-first-phrases.vtt"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (PAID_MEDIA.some((prefix) => url.pathname.includes(prefix))) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.startsWith("/assets/textbook/") && !TEXTBOOK_FREE.includes(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});