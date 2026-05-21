/*
 * Минимальный service worker: кэширует shell (HTML + бандл + иконка) через
 * install/activate и отдаёт его в офлайне/медленной сети. Запросы к /api/*
 * НЕ кэшируются — всегда идём в сеть. HTML и bundle берём network-first,
 * чтобы после матча пользователь не оставался на старом JS из PWA-кэша.
 */

const CACHE_VERSION = 'tanks-shell-v2';
const SHELL_URLS = ['/', '/index.html', '/src/js/bundle.js', '/src/img/icon.png', '/manifest.webmanifest'];

async function networkFirst(req, fallbackUrl) {
    const cache = await caches.open(CACHE_VERSION);
    try {
        const resp = await fetch(req);
        if (resp && resp.ok) {
            await cache.put(req, resp.clone());
        }
        return resp;
    } catch {
        return (await cache.match(req)) || (fallbackUrl ? caches.match(fallbackUrl) : undefined);
    }
}

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

    // Bundle должен обновляться сразу; иначе UI может жить на старом коде.
    if (url.pathname === '/src/js/bundle.js') {
        event.respondWith(networkFirst(req));
        return;
    }

    // Stale-while-revalidate только для статичных медиа из /src/.
    if (url.pathname.startsWith('/src/')) {
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

    // Shell: сеть сначала, кэш только как offline fallback.
    if (req.mode === 'navigate' || SHELL_URLS.includes(url.pathname)) {
        event.respondWith(networkFirst(req, '/index.html'));
    }
});
