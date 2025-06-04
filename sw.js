// Service Worker for PWA functionality
const CACHE_NAME = 'focus-timer-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './css/themes.css',
    './js/app.js',
    './js/timer.js',
    './js/settings.js',
    './js/stats.js',
    './js/sounds.js',
    './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
            )
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline statistics
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Sync any pending statistics or settings
    console.log('Background sync completed');
}

// Push notification support
self.addEventListener('push', (event) => {
    const options = {
        body: 'Time to focus! Your Pomodoro session is starting.',
        icon: 'assets/icons/favicon.ico',
        badge: 'assets/icons/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'start',
                title: 'Start Timer',
                icon: 'assets/icons/favicon.ico'
            },
            {
                action: 'close',
                title: 'Close',
                icon: 'assets/icons/favicon.ico'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Focus Timer', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'start') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});