/* PWA Netcomp RF: modo estrictamente online. Sin interceptar ni almacenar solicitudes. */
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
