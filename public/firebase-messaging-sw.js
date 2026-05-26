// Import SDK Firebase khusus di dalam Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Inisialisasi Firebase di dalam SW (Gunakan config yang sama)
firebase.initializeApp({
  apiKey: "AIzaSyAiNuZ8SZVyC3s-y472W_iGPJJHEUEdaHg",
  authDomain: "mind-space---08.firebaseapp.com",
  projectId: "mind-space---08",
  storageBucket: "mind-space---08.firebasestorage.app",
  messagingSenderId: "924984879858",
  appId: "1:924984879858:web:2c1e3bdcfccd2e044abe6b"
});

const messaging = firebase.messaging();

// SATPAM LATAR BELAKANG: Menangkap notif saat tab/browser ditutup
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notif Background Masuk: ', payload);

  const notificationTitle = payload.notification.title || "Mind Space Update!";
  const notificationOptions = {
    body: payload.notification.body || "Ada pesan baru untukmu.",
    icon: payload.notification.icon || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    data: payload.data // Menyimpan payload data tambahan jika diperlukan
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Taruh di main.js lu, King!
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
      .then((reg) => {
        console.log('Service Worker PWA sukses terdaftar, King! ✅', reg.scope);
      })
      .catch((err) => {
        console.error('Service Worker gagal terdaftar: ❌', err);
      });
  });
}