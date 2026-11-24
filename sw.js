const CACHE = "masri-ru-v14";
const LESSON_TRACKS = Array.from({ length: 12 }, (_, month) =>
  Array.from({ length: 3 }, (__, index) => `./assets/audio/lessons/lesson-m${month + 1}l${index + 1}.mp3`),
).flat();
const CHAPTERS = Array.from(
  { length: 12 },
  (_, index) => `./assets/textbook/chapters/chapter-unit-${String(index + 1).padStart(2, "0")}.pdf`,
);
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./quranpedia.css",
  "./app.js",
  "./course-data.js",
  "./extra-data.js",
  "./verb-data.js",
  "./textbook-data.js",
  "./word-audio.js",
  "./colors-data.js",
  "./academy-data.js",
  "./library-data.js",
  "./audio-db.js",
  "./maru-data.js",
  "./maru-core.js",
  "./maru-views.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  ...Array.from({ length: 12 }, (_, index) => `./assets/images/module-${String(index + 1).padStart(2, "0")}.svg`),
  "./assets/videos/01-first-phrases.mp4",
  "./assets/videos/02-cafe.mp4",
  "./assets/videos/03-directions.mp4",
  "./assets/videos/04-buying.mp4",
  "./assets/captions/01-first-phrases.vtt",
  "./assets/captions/02-cafe.vtt",
  "./assets/captions/03-directions.vtt",
  "./assets/captions/04-buying.vtt",
  "./assets/audio/foundations/alphabet.mp3",
  "./assets/audio/foundations/survival.mp3",
  ...LESSON_TRACKS,
  ...CHAPTERS,
  "./assets/textbook/chapters/chapter-introduction.pdf",
  "./assets/textbook/chapters/chapter-alphabet.pdf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Сообщения от приложения: статус офлайн-контента и принудительное докачивание.
self.addEventListener("message", (event) => {
  const reply = (data) => event.source?.postMessage(data);
  if (event.data?.type === "CACHE_STATUS") {
    event.waitUntil(
      caches.open(CACHE)
        .then((cache) => cache.keys())
        .then((keys) => {
          const paths = new Set(keys.map((request) => new URL(request.url).pathname));
          const missing = CORE.filter((path) => !paths.has(new URL(path, self.location.href).pathname));
          reply({
            type: "CACHE_STATUS",
            total: CORE.length,
            cached: CORE.length - missing.length,
            missing: missing.slice(0, 8),
            ready: missing.length === 0,
          });
        })
        .catch(() => reply({ type: "CACHE_STATUS", total: CORE.length, cached: 0, missing: [], ready: false })),
    );
    return;
  }
  if (event.data?.type === "CACHE_ALL") {
    event.waitUntil(
      caches.open(CACHE)
        .then((cache) => Promise.allSettled(CORE.map((path) => cache.add(path))))
        .then((results) => reply({
          type: "CACHE_DONE",
          ok: results.filter((item) => item.status === "fulfilled").length,
          total: CORE.length,
        })),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && response.status === 200 && new URL(request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        });
    }),
  );
});
