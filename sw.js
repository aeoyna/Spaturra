const CACHE_NAME = 'gradius-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/game.js',
    './js/player.js',
    './js/enemy.js',
    './js/bullet.js',
    './js/input.js',
    './js/audio.js',
    './js/obstacle.js',
    './js/gate.js',
    './js/barrel.js',
    './js/background.js',
    './js/particle.js',
    './js/option.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
