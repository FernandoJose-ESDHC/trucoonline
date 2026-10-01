/* Service worker: guarda os arquivos para o jogo abrir sem internet.
   Estratégia "stale-while-revalidate": abre na hora o que está guardado e
   atualiza em segundo plano. Mude a versão para forçar limpeza. */
const VERSION = 'central-v3';
const CORE = ['./', './index.html', './manifest.json', './shared/core.css', './shared/core.js', './shared/mesa.js', './shared/melds.js', './games/registry.js',
  './games/truco.html', './games/canastra.html', './games/pife.html', './games/21.html', './games/paciencia.html', './games/xadrez.html', './games/damas.html',
  './docs/img/icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || url.hostname === 'unpkg.com';
  if(!cacheable) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, {ignoreSearch: url.origin === location.origin});
    const net = fetch(req).then(r => { if(r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response('Sem conexão', {status:503});
  }));
});
