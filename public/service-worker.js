/* Replaced with the same release ID as the app during the production build. */
const BUILD_ID = '__PWA_BUILD_ID__';
const CACHE_PREFIX = 'retreat-public-offline-';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const OFFLINE_URL = new URL('/offline.html', self.location.origin).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Only this fixed public document is stored. Never cache app pages or data.
      const response = await fetch(OFFLINE_URL, {
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
      });
      if (
        !response.ok ||
        !response.headers.get('content-type')?.toLowerCase().startsWith('text/html')
      ) {
        throw new Error('The public offline page could not be prepared.');
      }
      const cache = await caches.open(CACHE_NAME);
      await cache.put(OFFLINE_URL, response);
    })(),
  );
  // Keep a new release waiting until existing app windows have closed.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    })(),
  );
  // No clients.claim(): a running checklist keeps its current release.
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_BUILD_ID') {
    event.ports[0]?.postMessage({ type: 'BUILD_ID', buildId: BUILD_ID });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    request.mode !== 'navigate' ||
    url.origin !== self.location.origin ||
    url.pathname === '/api' ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(request, {
          cache: 'no-store',
          credentials: 'same-origin',
        });
      } catch {
        // The requested URL, its fragment, and responses are never stored.
        const offline = await caches.match(OFFLINE_URL, { cacheName: CACHE_NAME });
        return (
          offline ||
          new Response('인터넷 연결을 확인한 후 다시 시도해 주세요.', {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          })
        );
      }
    })(),
  );
});
