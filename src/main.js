import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  updateProfile,            
  sendPasswordResetEmail,   
  updatePassword            
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// ✅ TAMBAHKAN INI: Modul Firestore untuk database cloud
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; 

// Mengambil data dari file .env secara aman di Vite
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
const db = getFirestore(app); // ✅ TAMBAHKAN INI: Jalur database cloud siap digunakan!

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



/* ================= SECURITY UTILITY (ENKRIPSI STORAGE) ================= */

// Fungsi untuk mengacak string (enkripsi ringan berbasis Base64 + Custom Salt)
function encryptData(text) {
  // Tambahkan salt rahasia agar tidak bisa di-decode instan pakai generator Base64 biasa
  const salt = "MindSpace_Secure_Salt_2026_"; 
  const saltedText = salt + text;
  // Ubah ke format Base64 yang aman dari mata telanjang
  return btoa(unescape(encodeURIComponent(saltedText)));
}

// Fungsi untuk mengembalikan string asli (dekripsi)
function decryptData(cipherText) {
  try {
    if (!cipherText) return null;
    const decoded = decodeURIComponent(escape(atob(cipherText)));
    const salt = "MindSpace_Secure_Salt_2026_";
    if (decoded.startsWith(salt)) {
      return decoded.replace(salt, "");
    }
    return null; // Data rusak atau dimanipulasi orang lain
  } catch (e) {
    console.error("Gagal mendekripsi data. Kemungkinan data telah dimanipulasi lewat DevTools.");
    return null;
  }
}

// Handler Baru untuk Simpan Data ke LocalStorage secara Terenkripsi
function simpanDataAman(key, dataObj) {
  const jsonString = JSON.stringify(dataObj);
  const encryptedString = encryptData(jsonString);
  localStorage.setItem(key, encryptedString);
}

// Handler Baru untuk Ambil Data dari LocalStorage secara Aman
function ambilDataAman(key) {
  const encryptedData = localStorage.getItem(key);
  if (!encryptedData) return null;
  const decryptedString = decryptData(encryptedData);
  if (!decryptedString) return null;
  return JSON.parse(decryptedString);
}

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
  const tanggalTerakhirSimpan = ambilDataAman(`lastWellnessDate_${uidAman}`);
  
  if (tanggalTerakhirSimpan !== tanggalHariIni) {
    // ✅ PERBAIKAN JALUR GANDA: Bersihkan log di lokal dan sinkronkan pengosongan ke cloud saat ganti hari
    window.sinkronisasiKeCloudDanLokal(uidAman, `wellnessLogs_${uidAman}`, "wellnessLogs", []);
    if (typeof wellnessData !== 'undefined') wellnessData = [];
    
    simpanDataAman(`lastWellnessDate_${uidAman}`, tanggalHariIni);
    console.log("Satpam Wellness: Hari baru terdeteksi, logs berhasil dibersihkan dari cloud & lokal!");
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
    alert("Maaf, silakan login terlebih dahulu untuk mencatat jadwal kuliah!");
    return;
  }

  const inputNamaMK = document.getElementById("scheduleInput");
  const inputHari = document.getElementById("scheduleDay");
  const inputJam = document.getElementById("scheduleTime");

  const namaMK = inputNamaMK?.value.trim() || "";
  const hariMK = inputHari?.value || "";
  const jamMK = inputJam?.value || "";

  if (namaMK === "" || hariMK === "" || jamMK === "") {
    alert("Wajib isi Nama Mata Kuliah, Hari, dan Jam Kuliah!");
    return;
  }

  const uidAman = auth.currentUser.uid; 
  const dataJadwalLokal = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
  
  const jadwalBaru = {
    id: 'sched_' + Date.now(),
    matakuliah: namaMK,
    hari: hariMK,
    jam: jamMK
  };
  
  dataJadwalLokal.push(jadwalBaru);
  
  // ✅ GANTI KODE LAMA DENGAN JALUR GANDA INI
  window.sinkronisasiKeCloudDanLokal(uidAman, `jadwalKuliah_${uidAman}`, "jadwalKuliah", dataJadwalLokal);
  schedules = dataJadwalLokal; 

  if (inputNamaMK) inputNamaMK.value = "";
  if (inputHari) inputHari.value = "";
  if (inputJam) inputJam.value = "";

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
  
  // ✅ GANTI KODE LAMA DENGAN JALUR GANDA INI
  window.sinkronisasiKeCloudDanLokal(uidAman, `jadwalKuliah_${uidAman}`, "jadwalKuliah", hasilFilter);
  schedules = hasilFilter;
  
  console.log("Jadwal sukses diperbarui di cloud & lokal! 🧼 Cloud+Lokal");
  
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
  
  // ✅ PERBAIKAN JALUR GANDA: Amankan ke lokal dan kirim ke Firebase Cloud
  window.sinkronisasiKeCloudDanLokal(uidAman, `todoTugas_${uidAman}`, "todoTugas", dataTodoLokal);
  tasks = dataTodoLokal; 

  console.log('Tugas baru sukses disinkronkan ke cloud & lokal! 📝☁️🔒');

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


window.hapusTodo = function(idTodo) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid; 

  let dataTodoLokal = ambilDataAman(`todoTugas_${uidAman}`) || [];
  const index = dataTodoLokal.findIndex(t => t.id === idTodo);
  if (index !== -1) {
    dataTodoLokal[index].completed = true;
    
    // ✅ PERBAIKAN JALUR GANDA: Perbarui status selesai ke lokal dan cloud
    window.sinkronisasiKeCloudDanLokal(uidAman, `todoTugas_${uidAman}`, "todoTugas", dataTodoLokal);
    tasks = dataTodoLokal; 
    console.log("Tugas ditandai selesai di cloud & lokal! ✅☁️🔒");
  }
  
  if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
}

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

  selesai.forEach(t => {
    containerSelesai.innerHTML += `
      <div style="padding: 10px; background: #f0fdf4; border-left: 4px solid #10b981; margin-bottom: 8px; border-radius: 6px; font-size: 14px; text-align: left;">
        ✅ <b>${t.tugas}</b> (Selesai dilakukan) <br>
        <small style="color: #64748b;">Batas waktu asli: ${t.tanggal} jam ${t.jam} WIB</small>
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
    // Pastikan properti tanggal dan jam ada sebelum di-parsing
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
    containerHangus.innerHTML += `
      <div style="padding: 10px; background: #fef2f2; border-left: 4px solid #ef4444; margin-bottom: 8px; border-radius: 6px; font-size: 14px; text-align: left;">
        ⚠️ <b>${t.tugas}</b> (Melewati batas deadline) <br>
        <small style="color: #64748b;">Hangus pada: ${t.tanggal} jam ${t.jam} WIB</small>
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
  
  // ✅ PERBAIKAN JALUR GANDA: Kirim ke penyimpanan lokal dan Firebase Cloud
  window.sinkronisasiKeCloudDanLokal(uidAman, `wellnessLogs_${uidAman}`, "wellnessLogs", dataWellnessLokal);
  wellnessData = dataWellnessLokal;

  console.log('Log kesehatan on-time berhasil dikunci ke cloud & lokal! 🪻☁️🔒');

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

  let dataWellnessLokal = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
  const index = dataWellnessLokal.findIndex(w => w.id === idWellness);
  if (index !== -1) {
    dataWellnessLokal[index].completed = true;
    
    // ✅ PERBAIKAN JALUR GANDA: Perbarui status log selesai ke lokal dan cloud
    window.sinkronisasiKeCloudDanLokal(uidAman, `wellnessLogs_${uidAman}`, "wellnessLogs", dataWellnessLokal);
    wellnessData = dataWellnessLokal;
    console.log("Log wellness ditandai selesai di cloud & lokal! ✅☁️🔒");
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

window.displayFocusHistory = function() {
  const containerFocus = document.getElementById('containerFocusHistory') || document.getElementById('listFocusHistory');
  if (!containerFocus || !auth.currentUser) return;

  const uidAman = auth.currentUser.uid;
  // ✅ PERBAIKAN: Membaca riwayat fokus secara aman terenkripsi
  const historyFocus = ambilDataAman(`focusHistory_${uidAman}`) || [];
  containerFocus.innerHTML = '';

  if (historyFocus.length === 0) {
    containerFocus.innerHTML = '<p style="color: #94a3b8; font-style: italic; text-align:center;">Jurnal fokus masih kosong. Yuk mulai belajar!</p>';
    return;
  }

  historyFocus.forEach(f => {
    containerFocus.innerHTML += `
      <div style="padding: 10px; background: #f8fafc; border-left: 4px solid #a855f7; margin-bottom: 8px; border-radius: 4px;">
        📅 <b>${f.tanggal}</b> - ${f.jam}<br>
        🎯 ${f.target} selama <b>${f.durasi} menit</b> secara penuh.
      </div>
    `;
  });
}

/* ================= 7. STRUKTUR UTAMA SEGMEN FOCUS MODE (POMODORO) ================= */
let timerFokus;
let sisaDetikFokus = 0;
let sedangBerjalan = false;

function catatRiwayatFocusSelesai(durasiMenit, targetNama) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;
  
  // ✅ PERBAIKAN JALUR GANDA: Membaca riwayat lama secara terenkripsi
  const riwayatLama = ambilDataAman(`focusHistory_${uidAman}`) || [];
  
  const waktuSekarang = new Date();
  const opsiTanggal = { year: 'numeric', month: 'long', day: 'numeric' };
  const formatTanggal = waktuSekarang.toLocaleDateString('id-ID', opsiTanggal);
  const formatJam = String(waktuSekarang.getHours()).padStart(2, '0') + ":" + String(waktuSekarang.getMinutes()).padStart(2, '0') + " WIB";

  const dataBaru = {
    tanggal: formatTanggal,
    jam: formatJam,
    target: targetNama,
    durasi: durasiMenit
  };

  riwayatLama.unshift(dataBaru); 
  
  // ✅ PERBAIKAN JALUR GANDA: Simpan ke lokal browser AND kirim ke database cloud Firebase Firestore!
  window.sinkronisasiKeCloudDanLokal(uidAman, `focusHistory_${uidAman}`, "focusHistory", riwayatLama);
  
  console.log("Satpam Jurnal: Sesi fokus berhasil di-backup ke Cloud & Lokal! 📝🏆☁️🔒");
  
  // Memicu render ulang visual riwayat secara instan jika user sedang di halaman focus
  if (typeof window.sinkronisasiDanRender === "function") window.sinkronisasiDanRender();
}

window.mulaiFocusMode = function(menitDurasi, targetTeks = "Sesi Fokus Belajar", catatanTeks = "-") {
  if (sedangBerjalan) return; 
  
  if (!auth.currentUser) {
    alert("Silakan login terlebih dahulu untuk memulai sesi fokus!");
    return;
  }

  sisaDetikFokus = menitDurasi * 60;
  sedangBerjalan = true;
  
  const uidAman = auth.currentUser.uid; 
  const targetWaktuSelesai = Date.now() + (sisaDetikFokus * 1000);
  
  simpanDataAman(`focusTargetEnd_${uidAman}`, targetWaktuSelesai);
  simpanDataAman(`focusStatus_${uidAman}`, "running");
  simpanDataAman(`focusTargetText_${uidAman}`, targetTeks);
  simpanDataAman(`focusNoteText_${uidAman}`, catatanTeks);

  console.log(`Focus Mode aktif selama ${menitDurasi} menit untuk: ${targetTeks}`);
  
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
      
      // ✅ PERBAIKAN BALIKAN COST: Gunakan NULL aman daripada merusak token local storage bawaan browser
      simpanDataAman(`focusTargetEnd_${uidAman}`, null);
      simpanDataAman(`focusStatus_${uidAman}`, "stopped");
      simpanDataAman(`focusTargetText_${uidAman}`, "");
      simpanDataAman(`focusNoteText_${uidAman}`, "");
      
      catatRiwayatFocusSelesai(menitDurasi, targetTeks);
      triggerNotifFocusOffline(); 

      HubungkanVisualFocusDanKunci(false, "Belum ada target belajar.", "Belum ada catatan.");
    } else {
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
  
  if (statusTimer === "running" && targetEnd) {
    // ✅ PERBAIKAN COST: Amankan parsing data agar kebal dari nilai string kosong / NaN
    const targetWaktuMili = Number(targetEnd);
    const sisaWaktuMili = targetWaktuMili - Date.now();
    
    if (sisaWaktuMili > 0) {
      const sisaMenitKonversi = Math.ceil(sisaWaktuMili / 1000 / 60);
      
      sedangBerjalan = false; 
      window.mulaiFocusMode(sisaMenitKonversi, teksTargetCadangan, teksCatatanCadangan);
    } else {
      simpanDataAman(`focusTargetEnd_${uidAman}`, null);
      simpanDataAman(`focusStatus_${uidAman}`, "stopped");
      simpanDataAman(`focusTargetText_${uidAman}`, "");
      simpanDataAman(`focusNoteText_${uidAman}`, "");
    }
  }
}

window.stopFocusMode = function() {
  clearInterval(timerFokus);
  sedangBerjalan = false;
  sisaDetikFokus = 0;
  updateVisualTimer(0, 0);
  
  if (auth.currentUser) {
    const uidAman = auth.currentUser.uid;
    // ✅ PERBAIKAN: Stabilkan pengosongan data lewat simpanDataAman, bukan removeItem mentah
    simpanDataAman(`focusTargetEnd_${uidAman}`, null);
    simpanDataAman(`focusStatus_${uidAman}`, "stopped");
    simpanDataAman(`focusTargetText_${uidAman}`, "");
    simpanDataAman(`focusNoteText_${uidAman}`, "");
  }
  
  HubungkanVisualFocusDanKunci(false, "Belum ada target belajar.", "Belum ada catatan.");
  console.log('Focus Mode dihentikan paksa, yaa.');
}

// FUNGSI UTILITAS BARU: Mengatur status UI (Kunci input & Teks Papan Display)
function HubungkanVisualFocusDanKunci(apakahKunci, teksTarget, teksCatatan) {
  const inputMenit = document.getElementById('focusMinutes');
  const inputTarget = document.getElementById('focusTarget');
  const inputNote = document.getElementById('focusNote');
  const targetDisplay = document.getElementById('targetDisplay');
  const noteDisplay = document.getElementById('noteDisplay');

  if (inputMenit) inputMenit.disabled = apakahKunci;
  if (inputTarget) inputTarget.disabled = apakahKunci;
  if (inputNote) inputNote.disabled = apakahKunci;

  if (targetDisplay) targetDisplay.innerText = teksTarget;
  if (noteDisplay) noteDisplay.innerText = teksCatatan;
  
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
          body: 'Sesi belajar/ngoding lu udah kelar. Berdiri dulu, regangkan fisik, dan ambil minum air! Sukses besar! 🌸',
          icon: '/flower.png', 
          vibrate: [400, 200, 400, 200, 400], 
          badge: '/flower.png',
          tag: 'focus-alert-done',
          requireInteraction: true 
        });
      }).catch(() => {
        new Notification('🪻 SESSION FOCUS SELESAI, yaa!', { 
          body: 'Sesi belajar/ngoding lu udah kelar. Rehat sejenak, yuk! 🌸', 
          icon: '/flower.png' 
        });
      });
    } else {
      new Notification('🪻 SESSION FOCUS SELESAI, yaa!', { 
        body: 'Sesi belajar/ngoding lu udah kelar. Rehat sejenak, yuk! 🌸', 
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

onAuthStateChanged(auth, async (user) => {
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

    // ✅ JALUR GANDA: Ambil data dari Firebase Cloud dulu, jika gagal/offline langsung pakai lokal
    const uidAman = user.uid;
    let jadwalLokal = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
    let todoLokal = ambilDataAman(`todoTugas_${uidAman}`) || []; 
    let wellnessLokal = ambilDataAman(`wellnessLogs_${uidAman}`) || [];
    let focusLokal = ambilDataAman(`focusHistory_${uidAman}`) || []; // 👈 Tambah inisialisasi lokal

    try {
      console.log("☁️ Mencoba mengunduh data terbaru dari Firebase Cloud...");
      const userDocRef = doc(db, "users", uidAman);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const cloudData = userDocSnap.data();
        
        // Jika data di cloud ada, gunakan data cloud dan perbarui cache lokal browser
        if (cloudData.jadwalKuliah) {
          jadwalLokal = cloudData.jadwalKuliah;
          simpanDataAman(`jadwalKuliah_${uidAman}`, jadwalLokal);
        }
        if (cloudData.todoTugas) {
          todoLokal = cloudData.todoTugas;
          simpanDataAman(`todoTugas_${uidAman}`, todoLokal);
        }
        if (cloudData.wellnessLogs) {
          wellnessLokal = cloudData.wellnessLogs;
          simpanDataAman(`wellnessLogs_${uidAman}`, wellnessLokal);
        }
        // 👇 Sinkronisasi otomatis data Riwayat Sesi Fokus dari Cloud
        if (cloudData.focusHistory) {
          focusLokal = cloudData.focusHistory;
          simpanDataAman(`focusHistory_${uidAman}`, focusLokal);
        }
        console.log("☁️ Sinkronisasi Cloud ke Lokal berhasil diselaraskan!");
      } else {
        console.log("ℹ️ Pengguna baru terdeteksi di Cloud Firestore. Menggunakan penyimpanan lokal awal.");
      }
    } catch (error) {
      console.warn("⚠️ Gagal terhubung ke Cloud Firebase (Mode Offline aktif). Menggunakan data lokal terenkripsi:", error.message);
    }

    // Masukkan data final (baik hasil cloud maupun lokal) ke variabel RAM global
    schedules = jadwalLokal;
    tasks = todoLokal;
    wellnessData = wellnessLokal;
    // Catatan: riwayat fokus diakses dinamis lewat storage terenkripsi saat render

    // Mesin Sinkronisasi Terpusat untuk Render UI
    window.sinkronisasiDanRender = () => {
      if (!auth.currentUser) return;

      if (typeof window.bersihkanWellnessGantiHariOtomatis === "function") {
        window.bersihkanWellnessGantiHariOtomatis();
      }

      // Selaraskan ulang variabel RAM dari storage terenkripsi lokal saat ada manipulasi data halaman
      schedules = ambilDataAman(`jadwalKuliah_${uidAman}`) || [];
      tasks = ambilDataAman(`todoTugas_${uidAman}`) || [];
      wellnessData = ambilDataAman(`wellnessLogs_${uidAman}`) || [];

      // Jalankan fungsi render bawaan visual halaman kamu
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

      console.log("Mesin Sinkronisasi Terpusat: Render Visual Selesai! ✅");
    };

    // Jalankan render awal secara instan setelah data terisi
    window.sinkronisasiDanRender();

    // Pasang listener navigasi agar perpindahan halaman tetap sinkron
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

// ✅ Fungsi Sinkronisasi Cloud + Lokal Terpusat
window.sinkronisasiKeCloudDanLokal = async function(uidAman, keyStorage, namaFieldFirebase, dataArray) {
  // 1. Amankan ke Lokal Browser dulu (Terenkripsi - Mode Offline)
  simpanDataAman(keyStorage, dataArray);
  
  // 2. Kirim ke Cloud Firebase jika ada koneksi internet
  try {
    // Menyimpan data murni ke dokumen user masing-masing di database Firestore
    await setDoc(doc(db, "users", uidAman), {
      [namaFieldFirebase]: dataArray
    }, { merge: true }); // merge: true agar data field lain tidak saling menimpa
    console.log(`☁️ Berhasil sinkronisasi field [${namaFieldFirebase}] ke Firebase Cloud!`);
  } catch (error) {
    console.warn(`⚠️ Gagal kirim ke cloud (Mungkin offline), data tetap aman di lokal:`, error.message);
  }
}

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

/* ================= LOGIKA BARU: PENGENDALI INTERFASE (LEBIH AMAN & ANTI-MOGOK) ================= */
document.addEventListener("DOMContentLoaded", () => {
  
  // --- TOMBOL STRUKTUR FORM UTAMA ---
  document.getElementById('btnTambahJadwal')?.addEventListener('click', () => {
    if (typeof window.tambahJadwalKuliah === 'function') window.tambahJadwalKuliah();
  });

  document.getElementById('btnTambahTugas')?.addEventListener('click', () => {
    if (typeof window.tambahTodoTugas === 'function') window.tambahTodoTugas();
  });

  document.getElementById('btnTambahWellness')?.addEventListener('click', () => {
    if (typeof window.tambahWellnessLog === 'function') window.tambahWellnessLog();
  });

  // --- TOMBOL STRUKTUR AUTH (index.html) ---
  document.getElementById("btnKirimLogin")?.addEventListener("click", () => {
    if (typeof window.login === "function") window.login();
  });

  document.getElementById("btnGoogleLogin")?.addEventListener("click", () => {
    if (typeof window.loginDenganGoogle === "function") window.loginDenganGoogle();
  });

  document.getElementById("btnKeHalamanRegister")?.addEventListener("click", () => {
    if (typeof window.showRegister === "function") window.showRegister();
  });

  document.getElementById("btnKirimRegister")?.addEventListener("click", () => {
    if (typeof window.register === "function") window.register();
  });

  document.getElementById("btnKeHalamanLogin")?.addEventListener("click", () => {
    if (typeof window.showLogin === "function") window.showLogin();
  });

  document.getElementById("btnLupaPassword")?.addEventListener("click", () => {
    if (typeof window.forgotPassword === "function") window.forgotPassword();
  });

  // --- TOMBOL MENU & PROFIL (Navigasi Atas) ---
  document.getElementById("btnAvatarProfil")?.addEventListener("click", () => {
    if (typeof window.toggleMenu === "function") window.toggleMenu();
  });

  document.getElementById("btnLihatProfil")?.addEventListener("click", () => {
    if (typeof window.openProfile === "function") window.openProfile();
  });

  document.getElementById("btnGantiPassword")?.addEventListener("click", () => {
    if (typeof window.changePassword === "function") window.changePassword();
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


