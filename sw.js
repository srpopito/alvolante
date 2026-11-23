// Funciona sin conexión (por ejemplo, en la sala de espera del DMV). Sube VERSION cuando cambies archivos.
var VERSION="alv-v7";
var CORE=["./","index.html","app.js","core.js","config.js","manifest.json","privacy.html","icons/icon-192.png","schools/ny.js"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(CORE);}));self.skipWaiting();});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==VERSION;}).map(function(k){return caches.delete(k);}));}));self.clients.claim();});
self.addEventListener("fetch",function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return;           // anuncios y fuentes: siempre de la red
  if(/\.mp4$/.test(u.pathname)) return;                                      // videos: streaming normal, sin cache
  if(e.request.mode==="navigate"){                                           // páginas: red primero
    e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(VERSION).then(function(x){x.put(e.request,c);});return r;}).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match("index.html");});}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request).then(function(n){if(n.ok){var c=n.clone();caches.open(VERSION).then(function(x){x.put(e.request,c);});}return n;});}));
});
