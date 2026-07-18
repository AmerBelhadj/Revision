const CACHE_NAME = "revision-pwa-v7";

// App shell : fichiers essentiels au fonctionnement de l'app
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles.css",
  "./src/app.js",
  "./src/db.js",
  "./data/index.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);

      // Récupère l'index des contenus et met en cache tous les fichiers
      // de tous les cours listés (resume.json, flashcards.json, source.pdf)
      try {
        const res = await fetch("./data/index.json");
        const index = await res.json();
        const filesToCache = [];
        for (const groupe of index.groupes || []) {
          for (const module of groupe.modules || []) {
            for (const cours of module.cours || []) {
              const base = cours.chemin;
              filesToCache.push(
                `${base}/resume.json`,
                `${base}/flashcards.json`,
                `${base}/source.pdf`
              );
            }
          }
        }
        await cache.addAll(filesToCache);
      } catch (err) {
        console.error("Erreur de mise en cache des contenus:", err);
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
      self.clients.claim();
    })()
  );
});

// Stratégie cache-first : on sert depuis le cache, sinon on va sur le réseau
// et on met en cache la réponse pour la prochaine fois (utile pour les CDN
// React/PDF.js chargés à l'exécution).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        // Hors ligne et pas en cache : on ne peut rien faire de plus ici
        throw err;
      }
    })()
  );
});
