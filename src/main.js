import { initializeApp } from "firebase/app";

// ✅ 1. Import Auth yang LENGKAP
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut,
  updateProfile, sendPasswordResetEmail, updatePassword,          
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ✅ 2. Import Firestore 
import { 
  getFirestore, enableIndexedDbPersistence, doc, setDoc, getDoc, onSnapshot, deleteDoc  
} from "firebase/firestore";

// ✅ 3. Import Keamanan
import CryptoJS from 'crypto-js';

// 🚨 INI YANG HILANG: KEMBALIKAN KONFIGURASI FIREBASE-MU DI SINI
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ✅ 4. DATABASE & OFFLINE MODE
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Gagal mode offline: Ada banyak tab aplikasi yang terbuka.");
  } else if (err.code == 'unimplemented') {
    console.warn("Browser ini tidak mendukung fitur offline Firestore.");
  }
});

/* ================= LEVEL 2: DEKLARASI VARIABEL GLOBAL RAM ================= */
let schedules = [];
let tasks = [];
let wellnessData = [];

/* ================= LEVEL 3: CORE FUNCTIONS (Fungsi Autentikasi & Routing) ================= */

function register() {
  let name = document.getElementById("registerName")?.value.trim() || "";
  let email = document.getElementById("registerEmail")?.value.trim() || "";
  let password = document.getElementById("registerPassword")?.value.trim() || "";

  if (name === "" || email === "" || password === "") {
    alert("Semua data wajib diisi!");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      // ✅ CDN dihapus, langsung panggil updateProfile yang diimpor di atas
      updateProfile(user, { displayName: name })
        .then(() => {
          alert(`Akun atas nama "${name}" berhasil dibuat secara legal di Firebase! 🌸✨`);
          window.location.href = "home.html";
        })
        .catch((err) => {
          console.error("Gagal sinkron nama:", err);
          window.location.href = "home.html";
        });
    })
    .catch((error) => {
      alert("Gagal registrasi: " + error.message);
    });
}



function login() {
  let email = document.getElementById("loginEmail")?.value.trim() || "";
  let password = document.getElementById("loginPassword")?.value.trim() || "";

  if (email === "" || password === "") {
    alert("Email dan password wajib diisi!");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login berhasil ✨");
      window.location.href = "home.html";
    })
    .catch((error) => {
      alert("Email atau password salah! / Hubungi admin kelompok.");
    });
}

function loginDenganGoogle() {
  signInWithPopup(auth, googleProvider)
    .then(() => {
      alert("Login Google Berhasil! 🌸");
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Gagal Login Google:", error);
    });
}

function logout() {
  signOut(auth).then(() => {
    schedules = []; 
    tasks = []; 
    wellnessData = [];
    
    alert("Logout berhasil!");
    window.location.href = "index.html";
  }).catch((err) => {
    console.error("Gagal logout:", err);
  });
}

function forgotPassword() {
  let inputEmail = prompt("Masukkan email akun kamu yang terdaftar:");
  if (!inputEmail) return;
  if (inputEmail.trim() === "") {
    alert("Email tidak boleh kosong!");
    return;
  }

  // ✅ CDN dihapus, langsung panggil sendPasswordResetEmail
  sendPasswordResetEmail(auth, inputEmail)
    .then(() => {
      alert(`📩 Link reset password BERHASIL dikirim! Silakan cek kotak masuk atau folder SPAM di email: ${inputEmail}`);
    })
    .catch((error) => {
      console.error("Gagal kirim email reset:", error);
      if (error.code === "auth/user-not-found") {
        alert("Email tersebut belum terdaftar di sistem kita, yaa!");
      } else if (error.code === "auth/invalid-email") {
        alert("Format email yang kamu masukkan salah/tidak valid!");
      } else {
        alert("Gagal mengirim email reset: " + error.message);
      }
    });
}

function changePassword() {
  const user = auth.currentUser;
  if (!user) {
    alert("Kamu harus login terlebih dahulu!");
    return;
  }

  let newPassword = prompt("Masukkan password baru kamu (Minimal 6 karakter):");
  if (!newPassword) return;
  if (newPassword.length < 6) {
    alert("Password gagal diubah! Firebase mewajibkan password minimal 6 karakter, yaa! 🔒");
    return;
  }

  // ✅ CDN dihapus, langsung panggil updatePassword
  updatePassword(user, newPassword)
    .then(() => {
      alert("Password akun kamu berhasil diubah di server Firebase! 🔒✨");
    })
    .catch((error) => {
      console.error("Gagal ubah password:", error);
      if (error.code === "auth/requires-recent-login") {
        alert("Demi keamanan, fitur ini butuh 'Fresh Login'. Silakan logout dulu, lalu login kembali dan langsung coba lagi ubah password-nya, yaa! 🛡️");
      } else {
        alert("Gagal mengubah password: " + error.message);
      }
    });
}

function showRegister() {
  if(document.getElementById("loginPage")) document.getElementById("loginPage").style.display = "none";
  if(document.getElementById("registerPage")) document.getElementById("registerPage").style.display = "flex";
}

function showLogin() {
  if(document.getElementById("registerPage")) document.getElementById("registerPage").style.display = "none";
  if(document.getElementById("loginPage")) document.getElementById("loginPage").style.display = "flex";
}

function toggleMenu() {
  let menu = document.getElementById("profileDropdown");
  if (!menu) return;
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function openProfile() {
  const user = auth.currentUser;
  if (user) {
    alert(`👤 Profil Saya\n\nNama: ${user.displayName || "User"}\nEmail: ${user.email}`);
  }
}

function privacySecurity() {
  const user = auth.currentUser;
  if (user) {
    alert(`🛡 Privasi & Keamanan\n\nEmail login: ${user.email}\n\nPassword terenkripsi`);
  }
}

function scrollDashboard() {
  document.getElementById("dashboardSection")?.scrollIntoView({ behavior: "smooth" });
}



/* ================= SECURITY UTILITY (ENKRIPSI & FIRESTORE OFFLINE SYNC) ================= */

// Kunci AES sesungguhnya (Sebaiknya letakkan di file .env nanti: VITE_ENCRYPTION_KEY)
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "Kunci_Rahasia_MindSpace_2026";

function encryptDataAman(dataObj) {
  const jsonStr = JSON.stringify(dataObj);
  return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
}

function decryptDataAman(cipherText) {
  try {
    if (!cipherText) return null;
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  } catch (e) {
    console.warn("Gagal dekripsi. Data kosong/rusak:", e.message);
    return null;
  }
}

// ✅ Handler Simpan: Simpan ke LocalStorage (Offline) + Lempar ke Firestore (Cloud)
function simpanDataAman(key, dataObj) {
  // 1. Simpan ke memori lokal browser agar super cepat dan bisa dibaca saat offline
  const encryptedString = encryptDataAman(dataObj);
  localStorage.setItem(key, encryptedString);

  // 2. Lempar ke Firestore di latar belakang (Otomatis ditahan jika tidak ada internet)
  const user = auth.currentUser;
  if (user) {
    const docRef = doc(db, "users", user.uid, "appData", key);
    setDoc(docRef, { 
      payload: encryptedString,
      terakhirDiperbarui: new Date().toISOString()
    }, { merge: true })
    .then(() => console.log(`☁️ Data [${key}] sukses diantrekan ke Cloud!`))
    .catch(err => console.error("Gagal sinkron ke Cloud:", err));
  }
}

// ✅ Handler Ambil: Membaca langsung dari lokal agar tidak ada delay/loading screen
function ambilDataAman(key) {
  const encryptedData = localStorage.getItem(key);
  if (!encryptedData) return null;
  return decryptDataAman(encryptedData);
}

// ✅ Fungsi Pendengar Cloud (Aktif secara Real-time)
function mulaiSinkronisasiCloud() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Daftar kunci data yang mau kita pantau
  const tipeData = [`jadwalKuliah_${user.uid}`, `todoTugas_${user.uid}`, `wellnessLogs_${user.uid}`];
  
  tipeData.forEach(key => {
    const docRef = doc(db, "users", user.uid, "appData", key);
    
    // ✅ REVISI LOGIKA: Tambahkan parameter pemantau asal data (Metadata)
onSnapshot(docRef, (docSnap) => {
  // metadata.hasPendingWrites artinya data ini baru saja ditulis oleh device ini 
  // dan sedang proses otw ke server. Jika TRUE, abaikan saja (jangan timpa lokal).
  if (docSnap.metadata.hasPendingWrites) return; 

  if (docSnap.exists()) {
    const dataAwan = docSnap.data();
    if (dataAwan.payload) {
      const dataLokal = localStorage.getItem(key);
      if (dataLokal !== dataAwan.payload) {
        console.log(`🔄 [Cloud Sync] Sinkronisasi data baru dari server untuk: ${key}`);
        localStorage.setItem(key, dataAwan.payload);
        
        // Panggil mesin sinkronisasi terpusat kamu agar RAM & UI ter-update otomatis
        if (typeof window.sinkronisasiDanRender === 'function') {
          window.sinkronisasiDanRender();
        }
      }
    }
  }
  });
  });
}

// ✅ Picu Sinkronisasi saat aplikasi baru dibuka atau user login
onAuthStateChanged(auth, (user) => {
  if (user) {
    mulaiSinkronisasiCloud();
  }
});

/* ================= SYSTEM UTILITY (NOTIFIKASI & SUARA) ================= */
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
  Notification.requestPermission();
}

// ✅ Cukup deklarasikan SATU instance audio global di atas agar hemat memori RAM
const alarmSound = new Audio("./alarm.mp3"); 
alarmSound.volume = 1.0;

// ✅ Fungsi Pintar Pemutar Audio (Kebal Blokir Autoplay Browser)
function putarSuaraAlarm() {
  alarmSound.play()
    .then(() => {
      console.log("🔊 Alarm berhasil berbunyi!");
    })
    .catch((error) => {
      console.warn("⚠️ Suara ditangguhkan browser (Autoplay Policy). User harus berinteraksi dulu dengan halaman.");
      
      // Membuat toast/notifikasi kecil di pojok layar jika suara tersendat
      const pengingatKlik = document.createElement("div");
      pengingatKlik.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; bg-color: #ef4444; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; cursor: pointer; font-family: sans-serif; font-size: 14px;" onclick="this.remove()">
          🚨 <b>MindSpace:</b> Ketuk layar ini untuk mengaktifkan suara alarm pengingat kuliah & tugas! 🌸
        </div>
      `;
      document.body.appendChild(pengingatKlik);
    });
}

function sendNotification(title, message) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/flower.png"
    });
  }
  putarSuaraAlarm(); // ✅ Panggil fungsi pintar
}

/* ================= INITIALIZE FCM MESSAGING ================= */
const messaging = getMessaging(app);

function aktifkanNotificationFCM() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Izin notifikasi diberikan.');
      
      getToken(messaging, { 
        vapidKey: 'BPyZbomuMFw7K1C7RbAKX7-0R2crOwKSCD7txHAD5Z8xVeoOCzzLL3AZo58bGLw7SBhgwCQ_WmoKaCekkROhhp0' 
      })
      .then((currentToken) => {
        if (currentToken) {
          console.log("TOKEN FCM LU (Copas ini buat ngetes):", currentToken);
        } else {
          console.log('Gagal dapet token, cek setelan Firebase lu.');
        }
      }).catch((err) => {
        console.error('Error saat mengambil token: ', err);
      });
    } else {
      console.log('User menolak izin notifikasi.');
    }
  });
}

onMessage(messaging, (payload) => {
  console.log('Notif masuk pas aplikasi kebuka:', payload);
  alert(`📢 ${payload.notification.title}\n\n${payload.notification.body}`);
});

/* ================= AUTOMATION AUTOMATIC CLEANER ================= */
window.bersihkanWellnessGantiHariOtomatis = function() {
  if (!auth.currentUser) {
    console.log("Satpam Wellness: Firebase belum siap, pembersihan ditunda.");
    return; 
  }
  
  const uidAman = auth.currentUser.uid; 
  const tanggalHariIni = new Date().toDateString(); 
  
  // ✅ PERBAIKAN: Baca tanggal menggunakan enkripsi aman agar tidak bisa dimanipulasi dari DevTools
  const tanggalTerakhirSimpan = ambilDataAman(`lastWellnessDate_${uidAman}`);
  
  if (tanggalTerakhirSimpan !== tanggalHariIni) {
    simpanDataAman(`wellnessLogs_${uidAman}`, []);
    if (typeof wellnessData !== 'undefined') wellnessData = [];
    
    // ✅ PERBAIKAN: Simpan dengan enkripsi aman
    simpanDataAman(`lastWellnessDate_${uidAman}`, tanggalHariIni);
    console.log("Satpam Wellness: Hari baru terdeteksi, logs berhasil dibersihkan secara aman!");
  }
}

/* ================= PROGRESSIVE WEB APPS (PWA) UTILITY ================= */
let deferredPrompt; 

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const tombolInstal = document.getElementById('btnInstalPWA');
  if (tombolInstal) {
    tombolInstal.style.display = 'inline-block'; 
    
    const tombolBaru = tombolInstal.cloneNode(true);
    tombolInstal.parentNode.replaceChild(tombolBaru, tombolInstal);
    
    tombolBaru.addEventListener('click', () => {
      tombolBaru.style.display = 'none';
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User gokil, sukses instal MindSpace! 🌸');
        } else {
          console.log('User nolak instal.');
          tombolBaru.style.display = 'inline-block';
        }
        deferredPrompt = null;
      });
    });
  }
});

window.addEventListener('appinstalled', () => {
  console.log('Aplikasi resmi terpasang di perangkat, yaa!');
  const tombolInstal = document.getElementById('btnInstalPWA');
  if (tombolInstal) tombolInstal.style.display = 'none';
});

/* ================= 1. STRUKTUR UTAMA SEGMENT JADWAL KULIAH ================= */
window.tambahJadwalKuliah = function() {
  if (!auth.currentUser) {
    alert("Maaf, silakan login terlebih dahulu untuk menambah jadwal!");
    return;
  }

  let course = document.getElementById("courseInput")?.value.trim() || "";
  let day = document.getElementById("dayInput")?.value || ""; 
  let start = document.getElementById("startTime")?.value || "";
  let end = document.getElementById("endTime")?.value || "";
  let note = document.getElementById("noteInput")?.value.trim() || "-";

  if (course === "" || day === "" || start === "") {
    alert("Isi setidaknya Nama Mata Kuliah, Hari, dan Jam Mulai!");
    return;
  }

  const uidAman = auth.currentUser.uid; 
  const dataJadwalLokal = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
  
  const jadwalBaru = {
    id: 'jadwal_' + Date.now(),
    matkul: course,
    hari: day, 
    jam: start, 
    end: end,
    note: note
  };
  
  dataJadwalLokal.push(jadwalBaru);
  simpanDataAman(`jadwalKuliah_${uidAman}`, dataJadwalLokal);
  
  schedules = dataJadwalLokal;
  console.log('Jadwal baru berhasil disimpan! 📚');

  ["courseInput", "dayInput", "startTime", "endTime", "noteInput"].forEach(id => {
    if(document.getElementById(id)) document.getElementById(id).value = "";
  });

  if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
}

window.tampilkanJadwalDashboard = function() {
  const isiTabelJadwal = document.getElementById('scheduleList'); 
  const containerDashboard = document.getElementById('containerListJadwal');
  
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;
  const dataJadwalMurni = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
  
  // URUTAN RENDER 1: Halaman jadwal.html (Tabel)
  if (isiTabelJadwal) {
    isiTabelJadwal.innerHTML = ''; 
    if (dataJadwalMurni.length === 0) {
      isiTabelJadwal.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Belum ada jadwal kuliah yang diinput.</td></tr>';
    } else {
      dataJadwalMurni.sort((a, b) => a.jam.localeCompare(b.jam));
      dataJadwalMurni.forEach(j => {
        isiTabelJadwal.innerHTML += `
          <tr>
            <td><b>${j.hari}</b></td>
            <td>${j.matkul}</td>
            <td>${j.jam} ${j.end ? ' - ' + j.end : ''} WIB</td>
            <td>${j.note}</td>
            <td>
              <button class="btn-hapus-jadwal" data-id="${j.id}" style="background-color: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Hapus</button>
            </td>
          </tr>
        `;
      });
    }
  }
  
  // URUTAN RENDER 2: Halaman home.html (Card)
  if (containerDashboard) {
    containerDashboard.innerHTML = '';
    if (dataJadwalMurni.length === 0) {
      containerDashboard.innerHTML = '<p style="color: #94a3b8; text-align: center; font-style: italic;">Belum ada jadwal hari ini.</p>';
    } else {
      dataJadwalMurni.forEach(j => {
        containerDashboard.innerHTML += `
          <div class="wellness-card" id="${j.id}">
            <h3>🪻 ${j.matkul}</h3>
            <p><strong>Hari:</strong> ${j.hari}</p>
            <p><strong>Jam:</strong> ${j.jam} WIB</p>
            <div class="wellness-buttons" style="margin-top: 10px;">
              <button class="btn-hapus-jadwal" data-id="${j.id}">Hapus</button>
            </div>
          </div>
        `;
      });
    }
  }

  // ✅ KENDALI BARU: Mengikat fungsi Hapus tanpa onclick HTML
  document.querySelectorAll('.btn-hapus-jadwal').forEach(tombol => {
    tombol.addEventListener('click', (e) => {
      const idJadwal = e.target.getAttribute('data-id');
      if (typeof window.hapusJadwal === 'function') window.hapusJadwal(idJadwal);
    });
  });
}

window.hapusJadwal = function(idJadwal) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;

  const dataJadwalLokal = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
  const hasilFilter = dataJadwalLokal.filter(j => j.id !== idJadwal);
  
  // ✅ PERBAIKAN: Masukkan variabel hasilFilter
  simpanDataAman(`jadwalKuliah_${uidAman}`, hasilFilter);
  schedules = hasilFilter;
  
  console.log("Jadwal sukses dihapus dari storage! 🧼");
  
  if (typeof window.sinkronisasiDanRender === "function") {
    window.sinkronisasiDanRender();
  } else {
    if (typeof tampilkanJadwalDashboard === "function") tampilkanJadwalDashboard();
  }
}

/* ================= 2. SATPAM JADWAL H-20 & H-5 ================= */
let rentangWaktuTerakhir = ""; 

setInterval(() => {
  if (!auth.currentUser) return;
  
  const uidAman = auth.currentUser.uid;
  const sekarang = new Date();
  
  // LOGIKA VARIABEL YANG TADI HILANG KITA BUAT DI SINI
  const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = daftarHari[sekarang.getDay()];
  const totalMenitSekarang = (sekarang.getHours() * 60) + sekarang.getMinutes();
  const kunciMenit = `${hariIni}_${totalMenitSekarang}`;

  if (rentangWaktuTerakhir === kunciMenit) return;

  const ambilDataJadwalLokal = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];

  ambilDataJadwalLokal.forEach(jadwal => {
    if (jadwal.hari === hariIni) {
      const [jamJadwal, menitJadwal] = jadwal.jam.split(':').map(Number);
      const totalMenitJadwal = (jamJadwal * 60) + menitJadwal;
      const selisihMenit = totalMenitJadwal - totalMenitSekarang;

      if (selisihMenit === 20) {
        rentangWaktuTerakhir = kunciMenit;
        sendNotification(`🚨 Kelas ${jadwal.matkul}`, "20 menit lagi masuk, yaa! Siap-siap otw kelas.");
      } else if (selisihMenit === 5) {
        rentangWaktuTerakhir = kunciMenit;
        sendNotification(`🚨 Kelas ${jadwal.matkul}`, "5 menit lagi kelas dimulai! Jangan nyasar, gass masuk.");
      }
    }
  });
}, 30000); 

/* ================= 3. STRUKTUR UTAMA SEGMENT TO DO TASKS ================= */
window.tambahTodoTugas = function() {
  if (!auth.currentUser) {
    alert("Maaf, silakan login terlebih dahulu untuk mencatat tugas!");
    return;
  }

  const inputNama = document.getElementById("taskInput");
  const inputTanggal = document.getElementById("deadlineDate");
  const inputJam = document.getElementById("deadlineTime");
  const inputCatatan = document.getElementById("taskNote");

  const namaTugas = inputNama?.value.trim() || "";
  let tanggalDeadline = inputTanggal?.value || ""; 
  const jamDeadline = inputJam?.value || "";
  const catatanTugas = inputCatatan?.value.trim() || "-";

  if (namaTugas === "" || tanggalDeadline === "" || jamDeadline === "") {
    alert("Wajib isi Nama Tugas, Tanggal, dan Jam Deadline!");
    return;
  }

  const uidAman = auth.currentUser.uid; 
  // ✅ PERBAIKAN 1: Membaca secara aman terenkripsi
  const dataTodoLokal = ambilDataAman(`todoTugas_${uidAman}`) || [];
  
  const tugasBaru = {
    id: 'todo_' + Date.now(),
    tugas: namaTugas,
    tanggal: tanggalDeadline, 
    jam: jamDeadline,
    catatan: catatanTugas,
    completed: false 
  };
  
  dataTodoLokal.push(tugasBaru);
  
  // ✅ PERBAIKAN 2: Menyimpan secara aman terenkripsi (tidak perlu JSON.stringify manual)
  simpanDataAman(`todoTugas_${uidAman}`, dataTodoLokal);
  tasks = dataTodoLokal; 

  console.log('Tugas baru sukses disimpan ke storage aman! 📝🔒');

  if (inputNama) inputNama.value = "";
  if (inputTanggal) inputTanggal.value = "";
  if (inputJam) inputJam.value = "";
  if (inputCatatan) inputCatatan.value = "";

  if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
}

window.tampilkanTodoDashboard = function() {
  const containerTodo = document.getElementById('taskList'); 
  if (!containerTodo || !auth.currentUser) return;
  
  const uidAman = auth.currentUser.uid;
  const dataTodoMurni = ambilDataAman(`todoTugas_${uidAman}`) || [];
  containerTodo.innerHTML = '';
  
  const sekarang = new Date().getTime();

  // PERBAIKAN FILTER: Tugas aktif adalah yang BELUM selesai DAN BELUM melewati jam deadline murni
  const todoAktif = dataTodoMurni.filter(t => {
    if (t.completed) return false; // Jika sudah selesai, buang dari dashboard
    
    // Periksa apakah waktu deadline sudah lewat atau belum
    if (t.tanggal && t.jam) {
      const waktuDeadline = parsingTanggalAman(t.tanggal, t.jam);
      const timeDeadline = waktuDeadline.getTime();
      if (!isNaN(timeDeadline) && sekarang > timeDeadline) {
        return false; // Jika waktu sekarang sudah melewati deadline (hangus), buang dari dashboard aktif!
      }
    }
    return true; // Sisanya adalah tugas yang benar-benar aktif murni
  });

  if (todoAktif.length === 0) {
    containerTodo.innerHTML = '<p style="color: #94a3b8; text-align: center; font-style: italic; font-size: 14px;">Belum ada rencana tugas aktif atau semua tugas telah melewati deadline. Yuk tambah tugas baru!</p>';
    return;
  }
  
  // Urutkan berdasarkan tanggal deadline terdekat
  todoAktif.sort((a, b) => new Date(a.tanggal + 'T' + a.jam) - new Date(b.tanggal + 'T' + b.jam));

  todoAktif.forEach(t => {
    containerTodo.innerHTML += `
      <div class="wellness-card" id="${t.id}" style="border-left: 4px solid #4b5cff; margin-bottom: 15px; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <h3>📝 ${t.tugas}</h3>
        <p><strong>Batas Waktu:</strong> ${t.tanggal} - Jam ${t.jam} WIB</p>
        <p style="color: #64748b; font-size: 14px;"><i>Catatan: ${t.catatan}</i></p>
        <div class="wellness-buttons" style="margin-top: 10px;">
          <button class="btn-selesai-todo" data-id="${t.id}" style="background-color: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">Selesai</button>
        </div>
      </div>
    `;
  });

  // Ikat fungsi Klik Tombol Selesai secara dinamis
  document.querySelectorAll('.btn-selesai-todo').forEach(tombol => {
    tombol.removeEventListener('click', penangananKlikSelesaiTodo); // Hindari duplikasi pengikatan event
    tombol.addEventListener('click', penangananKlikSelesaiTodo);
  });
}

// Fungsi pembantu independen untuk menangani aksi klik selesai
function penangananKlikSelesaiTodo(e) {
  const idTodo = e.target.getAttribute('data-id');
  if (typeof window.hapusTodo === 'function') window.hapusTodo(idTodo);
}


window.hapusTodoPermanen = function(idTodo) {
  if (!auth.currentUser) return alert("Silakan login terlebih dahulu!");
  
  if (!confirm("Apakah Anda yakin ingin menghapus tugas ini dari riwayat secara permanen?")) return;

  const uidAman = auth.currentUser.uid;
  // 1. Ambil array tugas terenkripsi yang ada saat ini
  let dataTodoLokal = ambilDataAman(`todoTugas_${uidAman}`) || [];
  
  // 2. Buang tugas yang ID-nya cocok dengan target hapus
  const dataTerfilter = dataTodoLokal.filter(t => {
    // Fallback: Jika ID tugas lama tidak ada, kita cocokkan berdasarkan nama tugasnya
    const idPembanding = t.id || t.tugas; 
    return idPembanding !== idTodo;
  });
  
  // 3. Simpan kembali array bersih yang baru ke LocalStorage & Cloud via Enkripsi
  simpanDataAman(`todoTugas_${uidAman}`, dataTerfilter);
  
  alert("Riwayat berhasil dihapus!");

  // 4. Segarkan langsung tampilan di layar tanpa perlu reload browser
  if (typeof window.displayTodoHistory === "function") window.displayTodoHistory();
  if (typeof window.displayGagalHistory === "function") window.displayGagalHistory();
  if (typeof window.renderTasks === "function") window.renderTasks(); // update halaman utama jika ada
};

window.hapusTodo = function(idTodo) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;

  let dataTodoLokal = ambilDataAman(`todoTugas_${uidAman}`) || [];
  const index = dataTodoLokal.findIndex(t => t.id === idTodo);
  
  if (index !== -1) {
    dataTodoLokal[index].completed = true; // Tandai selesai, bukan dihapus permanen
    simpanDataAman(`todoTugas_${uidAman}`, dataTodoLokal);
    tasks = dataTodoLokal;
    console.log("Tugas ditandai selesai! ✅");
  }
  
  if (typeof window.sinkronisasiDanRender === "function") {
    window.sinkronisasiDanRender();
  }
};

function parsingTanggalAman(tanggalStr, jamStr) {
  // Proteksi jika tanggalStr atau jamStr tidak ada/undefined
  if (!tanggalStr || !jamStr) {
    console.warn("Satpam Validasi: Menemukan data tanggal atau jam kosong!", { tanggalStr, jamStr });
    return new Date(NaN); // Mengembalikan Date objek yang tidak valid secara aman
  }
  
  let tanggalNormal = tanggalStr.replace(/\//g, "-");
  return new Date(`${tanggalNormal}T${jamStr}:00`);
}


window.displayTodoHistory = function() {
  const containerSelesai = document.getElementById('todoHistoryList');
  if (!containerSelesai || !auth.currentUser) return;

  const uidAman = auth.currentUser.uid;
  const dataTodo = ambilDataAman(`todoTugas_${uidAman}`) || [];
  containerSelesai.innerHTML = '';

  const selesai = dataTodo.filter(t => t.completed);
  if (selesai.length === 0) {
    containerSelesai.innerHTML = '<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Belum ada riwayat tugas selesai.</p>';
    return;
  }

  // ✅ PERBAIKAN: Gunakan variabel 'selesai', bukan 'hangus'
  selesai.forEach(t => {
    const idTargetHapus = t.id || t.tugas; 

    // ✅ PERBAIKAN: Gunakan 'containerSelesai', bukan 'containerHangus'
    containerSelesai.innerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #ecfdf5; border-left: 4px solid #10b981; margin-bottom: 8px; border-radius: 6px; font-size: 14px;">
        <div>
          ✅ <b>${t.tugas}</b> (Selesai) <br>
          <small style="color: #64748b;">Batas: ${t.tanggal} - ${t.jam} WIB</small>
        </div>
        <button onclick="window.hapusTodoPermanen('${idTargetHapus}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 5px;">
          🗑️
        </button>
      </div>
    `;
  });
}

window.displayGagalHistory = function() {
  const containerHangus = document.getElementById('todoGagalList');
  if (!containerHangus || !auth.currentUser) return;

  const uidAman = auth.currentUser.uid;
  const dataTodo = ambilDataAman(`todoTugas_${uidAman}`) || [];
  containerHangus.innerHTML = '';

  const sekarang = new Date().getTime();
  const hangus = dataTodo.filter(t => {
    if (t.completed) return false;
    if (!t.tanggal || !t.jam) return false; 
    
    const waktuDeadline = parsingTanggalAman(t.tanggal, t.jam);
    const timeDeadline = waktuDeadline.getTime();
    return isNaN(timeDeadline) ? false : sekarang > timeDeadline;
  });

  if (hangus.length === 0) {
    containerHangus.innerHTML = '<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Mantap! Tidak ada tugas hangus.</p>';
    return;
  }

  hangus.forEach(t => {
  // Gunakan ID unik, jika tidak ada (tugas lama) pakai teks namanya sebagai pengenal
  const idTargetHapus = t.id || t.tugas; 

  containerHangus.innerHTML += `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #fef2f2; border-left: 4px solid #ef4444; margin-bottom: 8px; border-radius: 6px; font-size: 14px;">
      <div>
        ⚠️ <b>${t.tugas}</b> (Melewati deadline) <br>
        <small style="color: #64748b;">Batas: ${t.tanggal} - ${t.jam} WIB</small>
      </div>
      <button onclick="window.hapusTodoPermanen('${idTargetHapus}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 5px;">
        🗑️
      </button>
    </div>
  `;
});
}

/* ================= 4. SATPAM TO-DO DEADLINE H-5 MIN ================= */
let gembokTodoTerakhir = ""; 

setInterval(() => {
  if (!auth.currentUser) return;
  
  const uidAman = auth.currentUser.uid;
  const sekarang = new Date();
  const timestampSekarang = sekarang.getTime();
  
  // ✅ PERBAIKAN 5: Membaca secara aman terenkripsi
  const dataTodo = ambilDataAman(`todoTugas_${uidAman}`) || [];
  
  let adaPerubahan = false;

  dataTodo.forEach(item => {
    if (item.completed) return;

    const waktuDeadline = parsingTanggalAman(item.tanggal, item.jam);
    if (!isNaN(waktuDeadline.getTime())) {
      const timestampDeadline = waktuDeadline.getTime();
      
      const selisihMenit = Math.floor((timestampDeadline - timestampSekarang) / 1000 / 60);
      if (selisihMenit === 5) {
        triggerNotifTodoOffline(item.tugas);
      }

      if (timestampSekarang > timestampDeadline && !item.gagal) {
        item.gagal = true; 
        adaPerubahan = true;
        triggerNotifTodoGagal(item.tugas);
      }
    }
  });

  if (adaPerubahan) {
    // ✅ PERBAIKAN 6: Menyimpan status tugas gagal/hangus secara terenkripsi
    simpanDataAman(`todoTugas_${uidAman}`, dataTodo);
    
    if (typeof window.tampilkanTodoDashboard === 'function') {
      window.tampilkanTodoDashboard();
    }
  }
}, 30000);

function triggerNotifTodoOffline(namaTugas) {
  // ✅ Panggil fungsi pemutar audio terpusat
  putarSuaraAlarm();

  // 2. Tampilkan Pop-up Visual (Service Worker / Desktop Notification)
  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('🚨 DEADLINE DEPAN MATA, yaa!', {
          body: `Tugas "${namaTugas}" kamu sisa 5 menit lagi! Ayoo buruan submit ke sistem! 🌸`,
          icon: '/flower.png', 
          vibrate: [500, 100, 500, 100, 500], 
          badge: '/flower.png',
          tag: 'todo-alert-' + namaTugas,
          requireInteraction: true 
        });
      }).catch(() => {
        new Notification('🚨 DEADLINE DEPAN MATA, yaa!', { 
          body: `Tugas "${namaTugas}" kamu sisa 5 menit lagi! Ayoo buruan submit! 🌸`, 
          icon: '/flower.png' 
        });
      });
    } else {
      new Notification('🚨 DEADLINE DEPAN MATA, yaa!', { 
        body: `Tugas "${namaTugas}" kamu sisa 5 menit lagi! Ayoo buruan submit! 🌸`, 
        icon: '/flower.png' 
      });
    }
  }
}

function triggerNotifTodoGagal(namaTugas) {
  if (Notification.permission === 'granted') {
    new Notification('⚠️ TUGAS HANGUS!', {
      body: `Yah, tugas "${namaTugas}" sudah melewati batas waktu. Yuk, jangan berkecil hati, segera cek daftar tugas gagal untuk evaluasi!`,
      icon: '/flower.png',
      tag: 'todo-gagal-' + namaTugas,
      requireInteraction: true
    });
  }
}

// Fungsi hapus item Todo dari Firestore
window.hapusTodoHistori = async function(todoId) {
  const user = auth.currentUser;
  if (!user) return alert("Silakan login terlebih dahulu!");

  if (confirm("Apakah Anda yakin ingin menghapus riwayat tugas ini?")) {
    try {
      const docRef = doc(db, "users", user.uid, "todos", todoId);
      await deleteDoc(docRef);
      alert("Riwayat tugas berhasil dihapus!");
    } catch (error) {
      console.error("Gagal menghapus todo:", error);
    }
  }
};

/* ================= 5. STRUKTUR UTAMA SEGMENT WELLNESS LOG ================= */
window.tambahWellnessLog = function() {
  if (!auth.currentUser) {
    alert("Maaf, silakan login terlebih dahulu untuk mencatat rutinitas kesehatan!");
    return;
  }

  const inputAktivitas = document.getElementById("wellnessInput") || document.getElementById("activityInput") || document.getElementById("wellnessType");
  const inputJamTarget = document.getElementById("wellnessTime") || document.getElementById("activityTime");
  const inputCatatan = document.getElementById("wellnessNote") || document.getElementById("activityNote");

  const namaAktivitas = inputAktivitas?.value || "";
  const jamMenitTarget = inputJamTarget?.value || "";
  const catatanWellness = inputCatatan?.value || "";

  if (namaAktivitas === "" || jamMenitTarget === "") {
    alert("Wajib isi nama rutinitas dan target jam operasional!");
    return;
  }

  const uidAman = auth.currentUser.uid; 
  // ✅ PERBAIKAN: Membaca secara aman terenkripsi
  const dataWellnessLokal = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
  
  const logBaru = {
    id: 'well_' + Date.now(),
    aktivitas: namaAktivitas, 
    jam: jamMenitTarget,
    type: namaAktivitas,
    time: jamMenitTarget,
    note: catatanWellness || "-",
    completed: false 
  };
  
  dataWellnessLokal.push(logBaru);
  // ✅ PERBAIKAN: Menyimpan secara aman terenkripsi tanpa JSON.stringify manual
  simpanDataAman(`wellnessLogs_${uidAman}`, dataWellnessLokal);
  wellnessData = dataWellnessLokal;

  console.log('Log kesehatan on-time berhasil dikunci secara terenkripsi! 🪻🔒');

  if (inputAktivitas) inputAktivitas.value = "";
  if (inputJamTarget) inputJamTarget.value = "";
  if (inputCatatan) inputCatatan.value = "";

  if (typeof window.sinkronisasiDanRender === "function") {
    window.sinkronisasiDanRender();
  } else {
    if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard();
  }
}

window.tampilkanWellnessDashboard = function() {
  const containerWellness = document.getElementById('containerListWellness'); 
  if (!containerWellness || !auth.currentUser) return;
  
  const uidAman = auth.currentUser.uid;
  // ✅ PERBAIKAN: Membaca secara aman terenkripsi
  const dataWellnessMurni = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
  containerWellness.innerHTML = '';
  
  const wellnessAktif = dataWellnessMurni.filter(w => !w.completed);

  if (wellnessAktif.length === 0) {
    containerWellness.innerHTML = '<p style="color: #94a3b8; text-align: center; font-style: italic; font-size: 14px;">Belum ada target log kesehatan harian, yaa.</p>';
    return;
  }
  
  wellnessAktif.sort((a, b) => a.jam.localeCompare(b.jam));

  wellnessAktif.forEach(w => {
    containerWellness.innerHTML += `
      <div class="wellness-card" id="${w.id}">
        <h3>💧 ${w.aktivitas}</h3>
        <p><strong>Waktu Rutin:</strong> Setiap Hari jam ${w.jam} WIB</p>
        <div class="wellness-buttons" style="margin-top: 10px;">
          <button class="btn-selesai-wellness" data-id="${w.id}">Selesai</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll('.btn-selesai-wellness').forEach(tombol => {
    tombol.addEventListener('click', (e) => {
      const idWellness = e.target.getAttribute('data-id');
      if (typeof window.hapusWellness === 'function') window.hapusWellness(idWellness);
    });
  });
}

window.hapusWellness = function(idWellness) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;

  // ✅ PERBAIKAN: Membaca secara aman terenkripsi
  let dataWellnessLokal = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
  const index = dataWellnessLokal.findIndex(w => w.id === idWellness);
  if (index !== -1) {
    dataWellnessLokal[index].completed = true;
    // ✅ PERBAIKAN: Menyimpan kembali hasil update secara terenkripsi
    simpanDataAman(`wellnessLogs_${uidAman}`, dataWellnessLokal);
    wellnessData = dataWellnessLokal;
    console.log("Log wellness ditandai selesai dan dienkripsi! ✅🔒");
  }
  
  if (typeof window.sinkronisasiDanRender === "function") {
    window.sinkronisasiDanRender();
  } else {
    if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard();
  }
}

/* ================= 6. SATPAM WELLNESS ON-TIME ================= */
let gembokWellnessTerakhir = ""; 

setInterval(() => {
  if (!auth.currentUser) return;
  const sekarang = new Date();
  
  const jamSekarang = String(sekarang.getHours()).padStart(2, '0');
  const menitSekarang = String(sekarang.getMinutes()).padStart(2, '0');
  const waktuSekarang = `${jamSekarang}:${menitSekarang}`;

  if (gembokWellnessTerakhir === waktuSekarang) return;

  const uidAman = auth.currentUser.uid; 
  
  // ✅ PERBAIKAN: Membaca secara aman terenkripsi
  const dataWellness = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
  let adaNotifikasiWellnessDipicu = false;

  dataWellness.forEach(w => {
    const jamReminder = w.jam || w.time;
    const namaAktivitas = w.aktivitas || w.type || "Reminder Kesehatan";

    if (jamReminder === waktuSekarang && !w.completed) {
      if (typeof window.triggerNotifWellnessOffline === 'function') {
        window.triggerNotifWellnessOffline(namaAktivitas);
      }
      adaNotifikasiWellnessDipicu = true;
    }
  });

  if (adaNotifikasiWellnessDipicu) {
    gembokWellnessTerakhir = waktuSekarang; 
  }
}, 30000);

function triggerNotifWellnessOffline(namaAktivitas) {
  console.log(`Memicu alarm wellness untuk: ${namaAktivitas} 🪻`);

  // ✅ Panggil fungsi pemutar audio terpusat
  putarSuaraAlarm();

  // 2. Tampilkan Pop-up Visual
  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('🪻 WELLNESS CHECK-IN, yaa!', {
          body: `Waktunya on-time untuk: "${namaAktivitas}". Jaga kesehatan jiwa dan fisik lu, gass eksekusi! 🌸`,
          icon: 'flower.png', 
          badge: 'flower.png',
          vibrate: [200, 100, 200, 100, 400], 
          tag: 'wellness-alert-' + namaAktivitas,
          requireInteraction: true 
        });
      }).catch(() => {
        new Notification('🪻 WELLNESS CHECK-IN, yaa!', { 
          body: `Waktunya on-time untuk: "${namaAktivitas}". Jaga kesehatan jiwa dan fisik lu! 🌸`, 
          icon: 'flower.png' 
        });
      });
    } else {
      new Notification('🪻 WELLNESS CHECK-IN, yaa!', { 
        body: `Waktunya on-time untuk: "${namaAktivitas}". Jaga kesehatan jiwa dan fisik lu! 🌸`, 
        icon: 'flower.png' 
      });
    }
  }
}

window.displayWellnessHistory = function() {
  const containerHistory = document.getElementById('containerWellnessHistory') || document.getElementById('listWellnessHistory');
  if (!containerHistory || !auth.currentUser) return;

  const uidAman = auth.currentUser.uid;
  // ✅ PERBAIKAN: Membaca secara aman terenkripsi
  const dataWellness = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
  containerHistory.innerHTML = '';

  const selesai = dataWellness.filter(w => w.completed);
  if (selesai.length === 0) {
    containerHistory.innerHTML = '<p style="color: #94a3b8; font-style: italic; text-align:center;">Belum ada rutinitas yang di-check-in hari ini.</p>';
    return;
  }

  selesai.forEach(w => {
    containerHistory.innerHTML += `
      <div style="padding: 8px; border-bottom: 1px dashed #cbd5e1; font-size: 14px;">
        🌟 <b>${w.aktivitas}</b> sukses diselesaikan pada target jam ${w.jam} WIB.
      </div>
    `;
  });
}

// ================= KENDALI DATA RIWAYAT FOKUS =================

// 1. Fungsi Menampilkan Riwayat Fokus ke HTML
window.displayFocusHistory = function() {
  const containerFocus = document.getElementById('containerFocusHistory');
  if (!containerFocus || !auth.currentUser) return;

  const uidAman = auth.currentUser.uid;
  const historyFocus = ambilDataAman(`focusHistory_${uidAman}`) || [];
  containerFocus.innerHTML = '';

  if (historyFocus.length === 0) {
    containerFocus.innerHTML = '<p style="color: #94a3b8; font-style: italic; text-align:center; font-size: 14px; margin-top: 15px;">Jurnal fokus masih kosong. Yuk mulai belajar!</p>';
    return;
  }

  historyFocus.forEach(f => {
    // Membuat fallback ID menggunakan tanggal & jam jika ID unik belum ada
    const matchId = f.id || `${f.tanggal}_${f.jam}`;
    
    containerFocus.innerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border-left: 4px solid #a855f7; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: left;">
        <div>
          <span style="font-size: 11px; color: #a855f7; font-weight: bold; background: #f3e8ff; padding: 2px 8px; border-radius: 12px;">📅 ${f.tanggal} - ${f.jam}</span>
          <p style="margin: 6px 0 2px 0; font-weight: bold; color: #1e293b;">🎯 Target: ${f.target}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">📝 Catatan: ${f.catatan || f.note || '-'}</p>
          <span style="font-size: 12px; font-weight: bold; color: #6b21a8;">⏱️ Berhasil: ${f.durasi} Menit</span>
        </div>
        
        <button onclick="window.hapusFocusHistoryPermanen('${matchId}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px; padding: 5px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
          🗑️
        </button>
      </div>
    `;
  });
}

// 2. Fungsi Eksekusi Hapus Catatan Fokus Permanen (Lokal & Cloud)
window.hapusFocusHistoryPermanen = function(matchId) {
  if (!auth.currentUser) return;
  if (!confirm("Apakah Anda yakin ingin menghapus catatan riwayat fokus ini secara permanen?")) return;

  const uidAman = auth.currentUser.uid;
  let historyFocus = ambilDataAman(`focusHistory_${uidAman}`) || [];
  
  // Memfilter dan membuang item yang dipilih
  historyFocus = historyFocus.filter(f => {
    const idUnik = f.id || `${f.tanggal}_${f.jam}`;
    return idUnik !== matchId;
  });

  // Simpan kembali data terbaru ke penyimpanan lokal terenkripsi & Cloud
  simpanDataAman(`focusHistory_${uidAman}`, historyFocus);
  
  // Segarkan tampilan jurnal di halaman saat itu juga
  window.displayFocusHistory();
  
  // Picu sinkronisasi background Firebase jika ada
  if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
}

window.cekDanBersihkanWellnessOtomatis = async function(snapshotDocs, uid) {
  const SEHARI_MS = 24 * 60 * 60 * 1000; // 24 Jam dalam milidetik
  const sekarang = new Date().getTime();

  snapshotDocs.forEach(async (document) => {
    const data = document.data();
    // Pastikan saat menyimpan wellness, kamu menyimpan field 'createdAt' atau 'timestamp' dalam bentuk angka (ms/Timestamp)
    const waktuDibuat = data.createdAt ? data.createdAt.toMillis() : null; 

    if (waktuDibuat && (sekarang - waktuDibuat > SEHARI_MS)) {
      // Jika umur data sudah lebih dari 24 jam, hapus otomatis dari Cloud & Lokal
      const docRef = doc(db, "users", uid, "wellness", document.id);
      await deleteDoc(docRef);
      console.log(`Log Wellness ${document.id} otomatis dihapus karena sudah 1 hari.`);
    }
  });
};

/* ================= 7. STRUKTUR UTAMA SEGMEN FOCUS MODE (POMODORO) ================= */
let timerFokus;
let sisaDetikFokus = 0;
let sedangBerjalan = false;

function catatRiwayatFocusSelesai(durasiMenit, targetNama, catatanTeks = "-") {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;
  
  const riwayatLama = ambilDataAman(`focusHistory_${uidAman}`) || [];
  const sekarang = new Date();

  const formatTanggal = sekarang.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-'); 

  const formatJam = sekarang.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const dataBaru = {
    id: 'focus_' + Date.now() + '_' + Math.floor(Math.random() * 1000), 
    tanggal: formatTanggal,
    jam: formatJam,
    target: targetNama, 
    catatan: catatanTeks, // 🔥 PERBAIKAN: Sekarang pakai data asli, bukan hardcode "-"
    durasi: durasiMenit
  };

  riwayatLama.unshift(dataBaru); 
  
  simpanDataAman(`focusHistory_${uidAman}`, riwayatLama);
  console.log("Satpam Jurnal: Sesi fokus berhasil ditulis ke riwayat! 📝🏆");
}

window.mulaiFocusMode = function(menitDurasi, targetTeks = "Sesi Fokus Belajar", catatanTeks = "-", isResume = false, targetSelesaiResume = null) {
  if (sedangBerjalan) return; 
  
  if (!auth.currentUser) {
    alert("Silakan login terlebih dahulu untuk memulai sesi fokus!");
    return;
  }

  const uidAman = auth.currentUser.uid; 
  
  // LOGIKA BARU: Jika ini resume dari reload, gunakan target selesai lama. Jika baru, buat target baru.
  const targetWaktuSelesai = (isResume && targetSelesaiResume) 
    ? targetSelesaiResume 
    : Date.now() + (menitDurasi * 60 * 1000);
  
  if (!isResume) {
    simpanDataAman(`focusTargetEnd_${uidAman}`, targetWaktuSelesai);
    simpanDataAman(`focusStatus_${uidAman}`, "running");
    simpanDataAman(`focusTargetText_${uidAman}`, targetTeks);
    simpanDataAman(`focusNoteText_${uidAman}`, catatanTeks);
    
    // Simpan durasi asli biar pas selesai catatannya akurat
    simpanDataAman(`focusOriginalDuration_${uidAman}`, menitDurasi);
  }

  // Ambil durasi asli untuk dicatat di histori nanti
  const durasiAsli = ambilDataAman(`focusOriginalDuration_${uidAman}`) || menitDurasi;

  sedangBerjalan = true;
  console.log(`Focus Mode aktif untuk: ${targetTeks}`);
  
  HubungkanVisualFocusDanKunci(true, targetTeks, catatanTeks);
  
  timerFokus = setInterval(() => {
    if (!auth.currentUser) {
      clearInterval(timerFokus);
      return;
    }
    
    const timestampSekarang = Date.now();
    const sisaWaktuAsli = Math.max(0, Math.round((targetWaktuSelesai - timestampSekarang) / 1000));
    sisaDetikFokus = sisaWaktuAsli;

    if (sisaDetikFokus <= 0) {
      clearInterval(timerFokus);
      sedangBerjalan = false;
      updateVisualTimer(0, 0);
      
      const teksCatatanAkhir = ambilDataAman(`focusNoteText_${uidAman}`) || catatanTeks || "-";

      simpanDataAman(`focusTargetEnd_${uidAman}`, null);
      simpanDataAman(`focusStatus_${uidAman}`, "stopped");
      simpanDataAman(`focusTargetText_${uidAman}`, "");
      simpanDataAman(`focusNoteText_${uidAman}`, "");
      simpanDataAman(`focusOriginalDuration_${uidAman}`, null);
      
      catatRiwayatFocusSelesai(durasiAsli, targetTeks, teksCatatanAkhir);
      
      triggerNotifFocusOffline(); 

      if (typeof window.displayFocusHistory === "function") window.displayFocusHistory();

      HubungkanVisualFocusDanKunci(false, "Belum ada target belajar.", "Belum ada catatan.");
    } else {
      // 🔥 INI DIA YANG SEMPAT HILANG: Perintah untuk update angka di layar!
      const m = Math.floor(sisaDetikFokus / 60);
      const s = sisaDetikFokus % 60;
      updateVisualTimer(m, s);
    }
  }, 1000); 
}

window.cekSesiTimerPasRefresh = function() {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid; 

  const statusTimer = ambilDataAman(`focusStatus_${uidAman}`);
  const targetEnd = ambilDataAman(`focusTargetEnd_${uidAman}`);
  
  const teksTargetCadangan = ambilDataAman(`focusTargetText_${uidAman}`) || "Sesi Fokus Belajar";
  const teksCatatanCadangan = ambilDataAman(`focusNoteText_${uidAman}`) || "-";
  const durasiAsli = ambilDataAman(`focusOriginalDuration_${uidAman}`) || 25; 
  
  if (statusTimer === "running" && targetEnd) {
    const targetWaktuMili = Number(targetEnd);
    const sisaWaktuMili = targetWaktuMili - Date.now();
    
    if (sisaWaktuMili > 0) {
      // 1. Kasus jika kamu balik dan waktu MASIH ADA -> Lanjutkan timer!
      sedangBerjalan = false; 
      window.mulaiFocusMode(durasiAsli, teksTargetCadangan, teksCatatanCadangan, true, targetWaktuMili);
    } else {
      // 2. 🔥 KASUS BARU: Jika waktu habis saat kamu buka halaman lain / tutup tab
      
      // Bersihkan state di memori biar tidak nyangkut
      simpanDataAman(`focusTargetEnd_${uidAman}`, null);
      simpanDataAman(`focusStatus_${uidAman}`, "stopped");
      simpanDataAman(`focusTargetText_${uidAman}`, "");
      simpanDataAman(`focusNoteText_${uidAman}`, "");
      simpanDataAman(`focusOriginalDuration_${uidAman}`, null);
      
      // Kunci datanya ke dalam buku jurnal riwayat!
      if (typeof catatRiwayatFocusSelesai === "function") {
        catatRiwayatFocusSelesai(durasiAsli, teksTargetCadangan, teksCatatanCadangan);
      }
      
      // Bunyikan notifikasi "Selesai" sesaat setelah kamu balik ke halaman ini
      if (typeof triggerNotifFocusOffline === "function") {
        triggerNotifFocusOffline();
      }

      // Refresh tabel riwayat supaya langsung muncul
      if (typeof window.displayFocusHistory === "function") {
        window.displayFocusHistory();
      }
      
      console.log("Kamu melewatkan momen timer habis karena berada di halaman lain, tapi riwayat aman tersimpan! 🏆");
    }
  }
}

window.stopFocusMode = function() {
  clearInterval(timerFokus);
  sedangBerjalan = false;
  
  if (auth.currentUser) {
    const uidAman = auth.currentUser.uid;
    
    // Ambil data sebelum dihapus
    const durasiAsli = ambilDataAman(`focusOriginalDuration_${uidAman}`);
    const targetEnd = ambilDataAman(`focusTargetEnd_${uidAman}`);
    const teksTarget = ambilDataAman(`focusTargetText_${uidAman}`) || "Sesi Fokus";
    const teksCatatan = ambilDataAman(`focusNoteText_${uidAman}`) || "-"; // 🔥 PERBAIKAN: Ambil catatannya!

    let menitTerlewati = durasiAsli || 0;
    if (targetEnd && durasiAsli) {
      const sisaMenit = Math.ceil((targetEnd - Date.now()) / 60000);
      menitTerlewati = Math.max(1, durasiAsli - sisaMenit); 
    }

    if (menitTerlewati > 0) {
      // 🔥 PERBAIKAN: Masukkan teksCatatan ke parameter ketiga
      catatRiwayatFocusSelesai(menitTerlewati, teksTarget, teksCatatan); 
    }

    simpanDataAman(`focusTargetEnd_${uidAman}`, null);
    simpanDataAman(`focusStatus_${uidAman}`, "stopped");
    simpanDataAman(`focusTargetText_${uidAman}`, "");
    simpanDataAman(`focusNoteText_${uidAman}`, "");
    simpanDataAman(`focusOriginalDuration_${uidAman}`, null);
  }
  
  sisaDetikFokus = 0;
  updateVisualTimer(0, 0);
  HubungkanVisualFocusDanKunci(false, "Belum ada target belajar.", "Belum ada catatan.");
  
  if (typeof window.displayFocusHistory === "function") window.displayFocusHistory();
  
  console.log('Focus Mode dihentikan paksa, progress berhasil disimpan ke jurnal! 📝');
}

function HubungkanVisualFocusDanKunci(apakahKunci, teksTarget, teksCatatan) {
  const inputMenit = document.getElementById('focusMinutes');
  const inputTarget = document.getElementById('focusTarget');
  const inputNote = document.getElementById('focusNote');
  const targetDisplay = document.getElementById('targetDisplay');
  const noteDisplay = document.getElementById('noteDisplay');

  // Ambil tombol Berhenti (Asumsi ID tombol berhentimu adalah btnBerhentiFokus)
  const btnBerhenti = document.getElementById('btnBerhentiFokus');

  if (inputMenit) inputMenit.disabled = apakahKunci;
  if (inputTarget) inputTarget.disabled = apakahKunci;
  if (inputNote) inputNote.disabled = apakahKunci;

  if (targetDisplay) targetDisplay.innerText = teksTarget;
  if (noteDisplay) noteDisplay.innerText = teksCatatan;

  // 🔥 PERBAIKAN 4: Logika ubah teks tombol Stop/Selesai
  if (btnBerhenti) {
    btnBerhenti.innerText = apakahKunci ? "Selesai (Akhiri)" : "Berhenti";
    // Biar makin keren, bisa ubah warnanya (Opsional)
    btnBerhenti.style.backgroundColor = apakahKunci ? "#ef4444" : ""; 
  }

  // Kunci/Matikan tombol pilihan menit (.btn-opsi-durasi) biar gak dobel klik saat timer jalan
  document.querySelectorAll('.btn-opsi-durasi').forEach(btn => {
    btn.disabled = apakahKunci;
    btn.style.opacity = apakahKunci ? "0.5" : "1";
    btn.style.cursor = apakahKunci ? "not-allowed" : "pointer";
  });
  
  // Jika sedang reset/berhenti, kosongkan isi form ketikan
  if (!apakahKunci) {
    if (inputMenit) inputMenit.value = "";
    if (inputTarget) inputTarget.value = "";
    if (inputNote) inputNote.value = "";
  }
}

function updateVisualTimer(menit, detik) {
  const elemenTimer = document.getElementById('displayTimerFokus'); 
  if (!elemenTimer) return;
  elemenTimer.innerText = `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;
}

function triggerNotifFocusOffline() {
  console.log("Memicu alarm suara dan notifikasi visual Focus Mode... 🔔");

  // ✅ Panggil fungsi pemutar audio terpusat
  putarSuaraAlarm();

  // 2. Tampilkan Jendela Pop-up Notifikasi Sistem
  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('🪻 SESSION FOCUS SELESAI, yaa!', {
          body: 'Sesi fokus kamu udah selesai. Berdiri dulu, regangkan fisik, dan ambil minum air! Sukses besar! 🌸',
          icon: '/flower.png', 
          vibrate: [400, 200, 400, 200, 400], 
          badge: '/flower.png',
          tag: 'focus-alert-done',
          requireInteraction: true 
        });
      }).catch(() => {
        new Notification('🪻 SESSION FOCUS SELESAI, yaa!', { 
          body: 'Sesi fokus kamu udah selesai. Rehat sejenak, yuk! 🌸', 
          icon: '/flower.png' 
        });
      });
    } else {
      new Notification('🪻 SESSION FOCUS SELESAI, yaa!', { 
        body: 'Sesi fokus kamu udah selesai. Rehat sejenak, yuk! 🌸', 
        icon: '/flower.png' 
      });
    }
  }
}

// Meminta izin akses notifikasi otomatis saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        console.log("Izin notifikasi resmi diberikan oleh pengguna! 🎉");
      }
    });
  }
});


/* ================= LEVEL 5: AUTH STATE OBSERVER & SYNC ================= */
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname.toLowerCase(); 
  const isTodoPage = path.includes("todo");
  const isWellnessPage = path.includes("wellness");
  const isFocusPage = path.includes("focus");
  const isLoginPage = path.includes("index") || path === "/" || path.endsWith("/");

  if (user && isLoginPage) {
    window.location.replace("home.html");
    return;
  }

  if (user) {
    console.log("Satpam Auth: User aktif ->", user.email);

    window.sinkronisasiDanRender = () => {
      if (!auth.currentUser) return;
      const uidAman = auth.currentUser.uid;

      if (typeof window.bersihkanWellnessGantiHariOtomatis === "function") {
        window.bersihkanWellnessGantiHariOtomatis();
      }

      // ✅ KODE LAMA DIGANTI: Membaca storage menggunakan fungsi dekripsi aman
      const jadwalLokal = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
      const todoLokal = ambilDataAman(`todoTugas_${uidAman}`) || []; 
      const wellnessLokal = ambilDataAman(`wellnessLogs_${uidAman}`) || [];

      schedules = jadwalLokal;
      tasks = todoLokal;
      wellnessData = wellnessLokal;

      console.log("🔒 Data berhasil didekripsi dan dimuat ke memori RAM.");

      // Blok render UI bawaan kodemu (dipertahankan penuh)
      if (typeof tampilkanJadwalDashboard === "function") tampilkanJadwalDashboard();
      if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();
      if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard();
      
      if (isTodoPage) {
        if (typeof displayTodoHistory === "function") displayTodoHistory();
        if (typeof displayGagalHistory === "function") displayGagalHistory();
      }
      if (isWellnessPage) {
        if (typeof displayWellnessHistory === "function") displayWellnessHistory();
      }
      if (isFocusPage) {
        if (typeof displayFocusHistory === "function") displayFocusHistory();
        if (typeof cekSesiTimerPasRefresh === "function") cekSesiTimerPasRefresh();
      }

      console.log("Mesin Sinkronisasi Terpusat: Selesai! ✅");
    };

    setTimeout(() => {
      if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
    }, 400);

    document.querySelectorAll('nav a, .sidebar-menu a, [data-page]').forEach(tombol => {
      tombol.addEventListener("click", () => {
        setTimeout(() => {
          if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
        }, 150);
      });
    });

  } else {
    if (!isLoginPage) {
      alert("Akses ditolak! Silakan login terlebih dahulu.");
      window.location.replace("index.html");
    }
  }
});

/* ================= LEVEL 4: WINDOW EXPOSE TO GLOBAL SCOPE ================= */
const globalFunctions = {
  register,
  login,
  loginDenganGoogle,
  logout,
  forgotPassword,
  changePassword,
  showRegister,
  showLogin,
  toggleMenu,
  openProfile,
  privacySecurity,
  scrollDashboard,
  aktifkanNotificationFCM,
  sendNotification,
  triggerNotifWellnessOffline,
  triggerNotifFocusOffline,
  bersihkanWellnessGantiHariOtomatis,
  displayFocusHistory,          // 👈 Tambahkan Ini jika belum ada
  hapusFocusHistoryPermanen,
  hapusTodoPermanen,
  tambahJadwalKuliah,
  tampilkanJadwalDashboard,
  hapusJadwal,
  tambahTodoTugas,
  tampilkanTodoDashboard,
  hapusTodo,
  displayTodoHistory,
  displayGagalHistory,
  tambahWellnessLog,
  tampilkanWellnessDashboard,
  hapusWellness,
  displayWellnessHistory,
  mulaiFocusMode,
  stopFocusMode,
  cekSesiTimerPasRefresh
};

Object.keys(globalFunctions).forEach((key) => {
  window[key] = globalFunctions[key];
});

// 🚨 WAJIB: Taruh kode ini di luar event listener (di kode global main.js)
// Fungsi ini berguna untuk menangkap data user SETELAH halaman ter-redirect kembali ke aplikasi
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      // Skenario jika sukses login via redirect
      console.log("User berhasil login via redirect:", result.user);
      window.location.href = "/dashboard.html"; 
    }
  })
  .catch((error) => {
    console.error("Error hasil redirect:", error);
  });

/* ================= LOGIKA BARU: PENGENDALI INTERFASE (LEBIH AMAN & ANTI-MOGOK) ================= */

// ✅ PERBAIKAN 1: Dibungkus DOMContentLoaded agar tanda "}" di akhir file seimbang & tidak bikin crash iOS
document.addEventListener("DOMContentLoaded", () => {

  // --- TOMBOL STRUKTUR FORM UTAMA ---
  document.getElementById('btnTambahJadwal')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.tambahJadwalKuliah === 'function') window.tambahJadwalKuliah();
  });

  document.getElementById('btnTambahTugas')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.tambahTodoTugas === 'function') window.tambahTodoTugas();
  });

  document.getElementById('btnTambahWellness')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.tambahWellnessLog === 'function') window.tambahWellnessLog();
  });

  // --- TOMBOL STRUKTUR AUTH (index.html) ---
  document.getElementById("btnKirimLogin")?.addEventListener("click", (e) => {
    e.preventDefault(); // ✅ Mencegah form reload otomatis di Safari
    if (typeof window.login === "function") window.login();
  });

  // Deteksi apakah user menggunakan iOS atau mode PWA Standalone
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true;

  const btnGoogleLogin = document.getElementById("btnGoogleLogin");
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener("click", (e) => {
      e.preventDefault();
      if (isIOS || isStandalone) {
        signInWithRedirect(auth, googleProvider);
      } else {
        signInWithPopup(auth, googleProvider)
          .then((result) => {
            window.location.href = "/dashboard.html"; 
          })
          .catch((error) => {
            console.error("Gagal Login Popup:", error);
          });
      }
    });
  }

  // ✅ PERBAIKAN 2: Ditambahkan (e) & e.preventDefault() agar link "Daftar" tidak memicu refresh di iOS
  document.getElementById("btnKeHalamanRegister")?.addEventListener("click", (e) => {
    e.preventDefault(); 
    if (typeof window.showRegister === "function") window.showRegister();
  });

  document.getElementById("btnKirimRegister")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.register === "function") window.register();
  });

  // ✅ PERBAIKAN 3: Ditambahkan e.preventDefault() untuk link kembali ke Login
  document.getElementById("btnKeHalamanLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.showLogin === "function") window.showLogin();
  });

  document.getElementById("btnLupaPassword")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.forgotPassword === "function") window.forgotPassword();
  });

  // --- TOMBOL MENU & PROFIL (Navigasi Atas) ---
  document.getElementById("btnAvatarProfil")?.addEventListener("click", () => {
    if (typeof window.toggleMenu === "function") window.toggleMenu();
  });

  document.getElementById("btnLihatProfil")?.addEventListener("click", () => {
    if (typeof window.openProfile === "function") window.openProfile();
  });

  document.getElementById("btnPrivasiKeamanan")?.addEventListener("click", () => {
    if (typeof window.privacySecurity === "function") window.privacySecurity();
  });

  document.getElementById("btnProsesLogout")?.addEventListener("click", () => {
    if (typeof window.logout === "function") window.logout();
  });

  document.getElementById("btnScrollDasbor")?.addEventListener("click", () => {
    if (typeof window.scrollDashboard === "function") window.scrollDashboard();
  });

  // --- TOMBOL UTILITAS SISTEM (FCM & PWA) ---
  document.getElementById("btnMintaIzinFCM")?.addEventListener("click", () => {
    if (typeof window.aktifkanNotificationFCM === "function") window.aktifkanNotificationFCM();
  });

  // --- TOMBOL KENDALI TIMER POMODORO (focus.html) ---
  const tombolDurasi = document.querySelectorAll(".btn-opsi-durasi");
  if (tombolDurasi.length > 0) {
    tombolDurasi.forEach(tombol => {
      tombol.addEventListener("click", (e) => {
        const durasiMenit = parseInt(e.target.getAttribute("data-menit"));
        if (!isNaN(durasiMenit) && typeof window.mulaiFocusMode === "function") {
          window.mulaiFocusMode(durasiMenit);
        }
      });
    });
  }
  // Trigger mulai dari tombol Mulai (untuk form manual)
  document.getElementById("btnMulaiFokus")?.addEventListener("click", (e) => {
    e.preventDefault();
    const inputMenit = parseInt(document.getElementById('focusMinutes')?.value) || 25;
    const inputTarget = document.getElementById('focusTarget')?.value || "Sesi Fokus Belajar";
    const inputNote = document.getElementById('focusNote')?.value || "-";

    if (typeof window.mulaiFocusMode === "function") {
      window.mulaiFocusMode(inputMenit, inputTarget, inputNote);
    }
  });

  document.getElementById("btnBerhentiFokus")?.addEventListener("click", () => {
    if (typeof window.stopFocusMode === "function") window.stopFocusMode();
  });

  // 1. Toggle Riwayat di Halaman focus.html
  const btnToggleFocus = document.getElementById("btnToggleFocus");
  const boxHistoriFocus = document.getElementById("pembungkusHistoriFocus");
  if (btnToggleFocus && boxHistoriFocus) {
    btnToggleFocus.addEventListener("click", () => {
      const isHidden = boxHistoriFocus.style.display === "none";
      boxHistoriFocus.style.display = isHidden ? "block" : "none";
      btnToggleFocus.innerText = isHidden ? "📜 Jurnal Riwayat Fokus (Tutup)" : "📜 Jurnal Riwayat Fokus (Buka)";
      btnToggleFocus.classList.toggle("aktif", isHidden);
    });
  }

  // 2. Toggle Riwayat di Halaman todo.html
  const btnToggleTodo = document.getElementById("btnToggleTodo");
  const boxHistoriTodo = document.getElementById("pembungkusHistoriTodo");
  if (btnToggleTodo && boxHistoriTodo) {
    btnToggleTodo.addEventListener("click", () => {
      const isHidden = boxHistoriTodo.style.display === "none";
      boxHistoriTodo.style.display = isHidden ? "block" : "none";
      btnToggleTodo.innerText = isHidden ? "📜 Riwayat Tugas (Tutup)" : "📜 Riwayat Tugas (Buka)";
      btnToggleTodo.classList.toggle("aktif", isHidden);
    });
  }

  // 3. Toggle Riwayat di Halaman wellness.html
  const btnToggleWellness = document.getElementById("btnToggleWellness");
  const boxHistoriWellness = document.getElementById("pembungkusHistoriWellness");
  if (btnToggleWellness && boxHistoriWellness) {
    btnToggleWellness.addEventListener("click", () => {
      const isHidden = boxHistoriWellness.style.display === "none";
      boxHistoriWellness.style.display = isHidden ? "block" : "none";
      btnToggleWellness.innerText = isHidden ? "📜 Log Kesehatan Hari Ini (Tutup)" : "📜 Log Kesehatan Hari Ini (Buka)";
      btnToggleWellness.classList.toggle("aktif", isHidden);
    });
  }
});

// --- FITUR INSTALL APLIKASI (PWA) ---
let promptInstallTertunda;
const btnInstallApp = document.getElementById("btnInstallApp");

// 1. Browser mendeteksi bahwa web ini bisa di-install
window.addEventListener('beforeinstallprompt', (e) => {
  // Cegah browser memunculkan pop-up install otomatis
  e.preventDefault();
  
  // Simpan event-nya supaya bisa kita panggil pas tombol diklik
  promptInstallTertunda = e;
  
  // Munculkan tombol estetik kita!
  if (btnInstallApp) {
    btnInstallApp.style.display = 'inline-block'; 
  }
});

// 2. Apa yang terjadi saat tombol diklik
if (btnInstallApp) {
  btnInstallApp.addEventListener('click', async () => {
    if (!promptInstallTertunda) {
      alert("Aplikasi sudah terinstal atau browser tidak mendukung fitur ini.");
      return;
    }
    
    // Tampilkan pop-up install bawaan browser
    promptInstallTertunda.prompt();
    
    // Tunggu pilihan user (mau install atau batal)
    const { outcome } = await promptInstallTertunda.userChoice;
    console.log(`Pilihan user: ${outcome}`);
    
    // Bersihkan data memori
    promptInstallTertunda = null;
    
    // Kalau user pilih install, hilangkan tombolnya biar rapi
    if (outcome === 'accepted') {
      btnInstallApp.style.display = 'none';
    }
  });
}