/*
 * Минимальный service worker: кэширует shell (HTML + бандл + иконка) через
 * install/activate и отдаёт его в офлайне/медленной сети. Запросы к /api/*
 * НЕ кэшируются — всегда идём в сеть. Ассеты /src/* кэшируем по принципу
 * stale-while-revalidate, чтобы не тормозить повторный вход, но получать
 * обновления картинок в фоне.
 *
 * Важно: в dev-режиме с рекомпиляцией бандла sw может отдать устаревший JS.
 * Поэтому имя кэша версионируем (CACHE_VERSION) — меняем при релизе.
 */

const CACHE_VERSION = 'tanks-shell-v1';
const SHELL_URLS = ['/', '/index.html', '/src/js/bundle.js', '/src/img/icon.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) =>
            cache.addAll(SHELL_URLS).catch(() => {
                /* toleriraem отдельные 404 в dev */
            })
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const names = await caches.keys();
            await Promise.all(
                names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Не кэшируем API и WS рукопожатия
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Stale-while-revalidate для медиа/JS/CSS из /src/
    if (url.pathname.startsWith('/src/') || url.pathname === '/src/js/bundle.js') {
        event.respondWith(
            caches.open(CACHE_VERSION).then(async (cache) => {
                const cached = await cache.match(req);
                const networkPromise = fetch(req)
                    .then((resp) => {
                        if (resp && resp.ok) cache.put(req, resp.clone());
                        return resp;
                    })
                    .catch(() => cached);
                return cached || networkPromise;
            })
        );
        return;
    }

    // Shell: сначала кэш, потом сеть
    if (req.mode === 'navigate' || SHELL_URLS.includes(url.pathname)) {
        event.respondWith(
            caches.match(req).then((cached) =>
                cached ||
                fetch(req).catch(() => caches.match('/index.html'))
            )
        );
    }
});
