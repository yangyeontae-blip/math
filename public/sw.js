// 베리숲 모험학교 서비스 워커: 한 번 열어 본 게임은 인터넷이 불안정해도 열려요.
// 화면(HTML)은 항상 인터넷을 먼저 확인해서 새 버전이 배포되면 바로 받고, 해시가 붙은 /assets 파일은 캐시에서 바로 꺼내요.
const CACHE = 'berry-forest-v1';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([self.registration.scope, 'manifest.webmanifest', 'favicon.svg']).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (await cache.match(self.registration.scope)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  if (request.mode === 'navigate') event.respondWith(networkFirst(request));
  else if (url.pathname.includes('/assets/')) event.respondWith(cacheFirst(request));
  else event.respondWith(networkFirst(request));
});
