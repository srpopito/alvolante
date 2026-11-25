// Funciona sin conexión (por ejemplo, en la sala de espera del DMV). Sube VERSION cuando cambies archivos.
var VERSION="alv-v26";
var CORE=[
  "./","index.html","app.js","core.js",
  "config.js","manifest.json","img/portada.webp","img/portada-480.webp","privacy.html","states/registry.js",
  "ui/en.js","ui/es.js","ui/zh.js","ui/ru.js",
  "ui/ko.js","ui/bn.js","lang/en.js","lang/es.js",
  "lang/zh.js","lang/ru.js","lang/ko.js","lang/bn.js",
  "cdl/en.js","cdl/es.js","cdl/zh.js","cdl/ru.js",
  "cdl/ko.js","cdl/bn.js","games/en.js","games/es.js",
  "games/zh.js","games/ru.js","games/ko.js","games/bn.js",
  "states/nj/core.js","states/nj/lang/en.js","states/nj/lang/es.js","states/nj/lang/zh.js",
  "states/nj/lang/ru.js","states/nj/lang/ko.js","states/nj/lang/bn.js",
  "states/ct/core.js","states/ct/lang/en.js","states/ct/lang/es.js","states/ct/lang/zh.js","states/ct/lang/ru.js","states/ct/lang/ko.js","states/ct/lang/bn.js","states/ma/core.js","states/ma/lang/en.js","states/ma/lang/es.js","states/ma/lang/zh.js","states/ma/lang/ru.js","states/ma/lang/ko.js","states/ma/lang/bn.js","states/fl/core.js","states/fl/lang/en.js","states/fl/lang/es.js","states/fl/lang/zh.js","states/fl/lang/ru.js","states/fl/lang/ko.js","states/fl/lang/bn.js","states/pa/core.js","states/pa/lang/en.js","states/pa/lang/es.js","states/pa/lang/zh.js",
  "states/pa/lang/ru.js","states/pa/lang/ko.js","states/pa/lang/bn.js",
  "cdl/course/bn.js","cdl/course/en.js","cdl/course/es.js","cdl/course/ko.js","cdl/course/ru.js","cdl/course/zh.js","fonts/Barlow-400.woff2","fonts/Barlow-500.woff2","fonts/Barlow-600.woff2","fonts/BarlowCondensed-600.woff2","fonts/BarlowCondensed-700.woff2","kit/en.js","kit/es.js","kit/zh.js","kit/ru.js","kit/ko.js","kit/bn.js","icons/icon-192.png",
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