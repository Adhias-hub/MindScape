// ISI FILE firebase-messaging-sw.js (Taruh importScripts di sini!)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const urlParams = new URL(self.location.href).searchParams;

const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};

if (firebaseConfig.messagingSenderId && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Notif Background Masuk: ', payload);
    const notificationTitle = payload.notification?.title || "Mind Space Update!";
    const notificationOptions = {
      body: payload.notification?.body || "Ada pesan baru untukmu.",
      icon: payload.notification?.icon || '/icon.png',
      badge: '/icon.png',
      data: payload.data
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}