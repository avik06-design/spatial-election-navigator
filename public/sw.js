/**
 * Service Worker — Eluide Voter Portal
 * Implements a NetworkFirst caching strategy for the app shell.
 */

const CACHE_NAME = 'eluide-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

/**
 * Install event — pre-caches the app shell for offline support.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/**
 * Activate event — cleans up old caches from previous versions.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/**
 * Fetch event — NetworkFirst strategy.
 * Attempts network request first; falls back to cache on failure.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
