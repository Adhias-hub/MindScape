// Import SDK Firebase khusus di dalam Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Tunggu kiriman config aman dari main.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const config = event.data.config;

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      const messaging = firebase.messaging();

      // SATPAM LATAR BELAKANG: Menangkap notif saat tab/browser ditutup
      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Notif Background Masuk: ', payload);

        const notificationTitle = payload.notification.title || "Mind Space Update!";
        const notificationOptions = {
          body: payload.notification.body || "Ada pesan baru untukmu.",
          icon: payload.notification.icon || '/icon.png',
          badge: '/icon.png',
          data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});