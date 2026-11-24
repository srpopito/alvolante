// Funciona sin conexión (por ejemplo, en la sala de espera del DMV). Sube VERSION cuando cambies archivos.
var VERSION="alv-v10";
var CORE=[
  "./","index.html","app.js","core.js",
  "config.js","manifest.json","privacy.html","states/registry.js",
  "ui/en.js","ui/es.js","ui/zh.js","ui/ru.js",
  "ui/ko.js","ui/bn.js","lang/en.js","lang/es.js",
  "lang/zh.js","lang/ru.js","lang/ko.js","lang/bn.js",
  "cdl/en.js","cdl/es.js","cdl/zh.js","cdl/ru.js",
  "cdl/ko.js","cdl/bn.js","games/en.js","games/es.js",
  "games/zh.js","games/ru.js","games/ko.js","games/bn.js",
  "states/nj/core.js","states/nj/lang/en.js","states/nj/lang/es.js","states/nj/lang/zh.js",
  "states/nj/lang/ru.js","states/nj/lang/ko.js","states/nj/lang/bn.js","icons/icon-192.png",
  "icons/icon-512.png","icons/icon-maskable-512.png","schools/ny.js"
];
var OFFLINE=CORE.slice();
self.addEventListener("install",function(e){e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(CORE).catch(function(){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){});}));});}).then(function(){return self.skipWaiting();}));});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==VERSION;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
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