// =============================================
// SERVICE WORKER — игра работает без интернета (офлайн)
// =============================================
// Регистрируется из index.html адресом sw.js?v=0.25 — номер версии из version.js.
// Новая версия игры → новый адрес sw.js → браузер ставит новый service worker:
// он заново сохраняет все файлы игры в новый кэш «filipp-0.25», а старый кэш удаляет.
// Все пути относительные: игра лежит не в корне сайта, а в папке /Filipp_family/.

const TAG = new URL(self.location).searchParams.get('v') || 'dev';   // '0.25'
const CACHE = 'filipp-' + TAG;

// Что сохранить сразу при установке. Файлы игры — с той же меткой ?v=, что и в index.html
const FILES = [
  './',
  './index.html',
  './version.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './style.css?v=' + TAG,
  './intro.css?v=' + TAG,
  './font.js?v=' + TAG,
  './sprites.js?v=' + TAG,
  './scenes.js?v=' + TAG,
  './levels.js?v=' + TAG,
  './game.js?v=' + TAG,
  './intro.js?v=' + TAG,
  './art/intro.jpg?v=' + TAG,
];

// Установка: скачиваем и сохраняем все файлы (мимо обычного кэша браузера — всегда свежие)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())            // новая версия включается сразу, не ждёт
  );
});

// Включение: удаляем кэши старых версий игры
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('filipp-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Запросы игры
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);

  // Страница и version.js: сначала интернет (там может быть новая версия), без интернета — из кэша.
  // version.js index.html грузит с ?t=время — в кэше он один, поэтому ищем без учёта ?t=
  if (req.mode === 'navigate' || url.pathname.endsWith('/version.js')) {
    const key = req.mode === 'navigate' ? './index.html' : './version.js';
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
          return res;
        })
        .catch(() => caches.match(key, { ignoreSearch: true }))
    );
    return;
  }

  // Остальное (game.js?v=0.25, картинки...): сначала кэш, если нет — интернет и сохранить.
  // Метка ?v= в адресе меняется с каждой версией, поэтому старый файл не перепутается с новым
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
