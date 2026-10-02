/* Service worker: guarda os arquivos para o jogo abrir sem internet.
   Estratégia "rede primeiro": online sempre pega a versão nova; offline usa
   a cópia guardada. Mude a versão para forçar limpeza. */
const VERSION = 'central-v5';
const CORE = ['./', './index.html', './manifest.json', './shared/core.css', './shared/core.js', './shared/mesa.js', './shared/melds.js', './games/registry.js',
  './games/truco.html', './games/canastra.html', './games/pife.html', './games/21.html', './games/paciencia.html', './games/xadrez.html', './games/xadrez-ai.js', './games/damas.html', './games/damas-ai.js',
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
  // rede primeiro (sempre a versão mais nova); sem internet, usa o que está guardado
  e.respondWith(caches.open(VERSION).then(async c => {
    try{
      const r = await fetch(req, {cache:'no-cache'});
      if(r && r.ok) c.put(req, r.clone());
      return r;
    }catch(_){
      const hit = await c.match(req, {ignoreSearch: url.origin === location.origin});
      return hit || new Response('Sem conexão', {status:503});
    }
  }));
});
