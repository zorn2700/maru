/* Maru 2.0 — Service Worker (PWA) */
importScripts("./word-audio-manifest.js");

const CACHE = "masri-ru-v15";
const WORDS = Array.isArray(self.MARU_WORD_AUDIO) ? self.MARU_WORD_AUDIO : [];
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
  "./maru-glow.css",
  "./app.js",
  "./course-data.js",
  "./extra-data.js",
  "./verb-data.js",
  "./textbook-data.js",
  "./word-audio.js",
  "./word-audio-manifest.js",
  "./colors-data.js",
  "./academy-data.js",
  "./library-data.js",
  "./audio-db.js",
  "./maru-data.js",
  "./maru-core.js",
  "./maru-views.js",
  "./maru-quest.js",
  "./maru-quest-views.js",
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

async function cachedPaths() {
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  return new Set(keys.map((request) => new URL(request.url).pathname));
}

function missingPaths(paths, available) {
  return paths.filter((path) => !available.has(new URL(path, self.location.href).pathname));
}

// Сообщения от приложения: статус офлайн-контента и принудительная докачка.
self.addEventListener("message", (event) => {
  const reply = (data) => event.source?.postMessage(data);
  if (event.data?.type === "CACHE_STATUS") {
    event.waitUntil(
      cachedPaths()
        .then((paths) => {
          const missing = missingPaths(CORE, paths);
          const wordMissing = missingPaths(WORDS, paths);
          reply({
            type: "CACHE_STATUS",
            total: CORE.length,
            cached: CORE.length - missing.length,
            missing: missing.slice(0, 8),
            ready: missing.length === 0,
            wordTotal: WORDS.length,
            wordCached: WORDS.length - wordMissing.length,
            wordsReady: wordMissing.length === 0,
          });
        })
        .catch(() => reply({ type: "CACHE_STATUS", total: CORE.length, cached: 0, missing: [], ready: false, wordTotal: WORDS.length, wordCached: 0, wordsReady: false })),
    );
    return;
  }
  if (event.data?.type === "CACHE_ALL" || event.data?.type === "CACHE_WORDS") {
    const onlyWords = event.data.type === "CACHE_WORDS";
    const list = onlyWords ? WORDS : [...CORE, ...WORDS];
    event.waitUntil(
      caches.open(CACHE)
        .then((cache) => Promise.allSettled(list.map((path) => cache.add(path))))
        .then((results) => reply({
          type: "CACHE_DONE",
          ok: results.filter((item) => item.status === "fulfilled").length,
          total: list.length,
          scope: onlyWords ? "words" : "all",
        })),
    );
  }
});

// range-запросы аудио/видео: отдаём точный кусок из кэша, чтобы перемотка
// работала и без сети. Раньше они просто обходили кэш и падали офлайн.
async function rangeResponse(request) {
  const header = request.headers.get("range") || "";
  const parts = /bytes=(\d*)-(\d*)/.exec(header);
  const cached = await caches.match(request.url);
  let source = cached;
  if (!source) {
    try {
      source = await fetch(request.url);
    } catch {
      return Response.error();
    }
  }
  if (!source || !source.ok) return cached || Response.error();
  const buffer = await source.arrayBuffer();
  const total = buffer.byteLength;
  const base = {
    "Content-Type": source.headers.get("content-type") || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": source.headers.get("cache-control") || "public, max-age=86400",
  };
  if (!parts) return new Response(buffer, { status: 200, headers: base });
  const start = parts[1] ? Number(parts[1]) : Math.max(0, total - Number(parts[2] || total));
  const end = parts[1] && parts[2] ? Math.min(Number(parts[2]), total - 1) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${total}` } });
  }
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: { ...base, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) {
    event.respondWith(rangeResponse(request));
    return;
  }
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
