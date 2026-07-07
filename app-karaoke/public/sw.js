// public/sw.js
const CACHE_NAME = 'gh-karaoke-pro-v2';

// 1. Durante a instalação, forçamos o cache da página inicial
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Isso é o suficiente para o Chrome aprovar a instalação do PWA
      return cache.addAll(['/', '/index.html']);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 2. Intercepta as requisições (Estratégia: Rede primeiro, Cache como plano B)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Tenta sempre ir na rede primeiro (Para o seu Heartbeat não travar)
    fetch(event.request).catch(() => {
      // Se a rede falhar ou no teste offline do Chrome, busca no cache
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // Se for uma rota do React Navigation e estiver offline, devolve o index
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});