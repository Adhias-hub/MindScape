/* ================= INITIALIZE FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

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

/* ================= AUTH LISTENER (SATPAM HALAMAN) ================= */
// Cek status login secara real-time
onAuthStateChanged(auth, (user) => {
  const isHomePage = window.location.pathname.includes("home.html");
  const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname === "/";

  if (user) {
    console.log("User aktif:", user.email);
    
    // Tampilkan data ke UI jika elemennya ada di halaman saat ini
    const pEmail = document.getElementById("profileEmail");
    const pName = document.getElementById("profileName");
    
    if (pEmail) pEmail.innerText = user.email;
    if (pName) pName.innerText = user.displayName || localStorage.getItem("name") || "User";

    // Jika user sudah login tapi malah buka halaman login, lempar ke home
    if (isLoginPage) {
      window.location.href = "home.html";
    }
  } else {
    // Jika user belum login tapi nekat buka home.html, tendang ke login
    if (isHomePage) {
      alert("Akses ditolak! Silakan login terlebih dahulu.");
      window.location.href = "index.html";
    }
  }
});

/* ================= REGISTER (STRATA AMAN FIREBASE) ================= */
function register() {
  let name = document.getElementById("registerName").value.trim();
  let email = document.getElementById("registerEmail").value.trim();
  let password = document.getElementById("registerPassword").value.trim();

  if (name === "" || email === "" || password === "") {
    alert("Semua data wajib diisi!");
    return;
  }

  // Langkah A: Daftarkan email & password ke Firebase
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Langkah B: LANGSUNG PERINTAHKAN FIREBASE BUAT NGE-SET NAMA USERNYA SECARA PERMANEN
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js")
        .then(({ updateProfile }) => {
          updateProfile(user, {
            displayName: name
          })
          .then(() => {
            alert(`Akun atas nama "${name}" berhasil dibuat secara legal di Firebase! 🌸✨`);
            window.location.href = "home.html";
          })
          .catch((err) => {
            console.error("Gagal sinkron nama:", err);
            // Tetap lempar ke home meskipun nama gagal disinkron biar gak stuck
            window.location.href = "home.html";
          });
        });

    })
    .catch((error) => {
      alert("Gagal registrasi: " + error.message);
    });
}

/* ================= LOGIN EMAIL & PASSWORD ================= */
function login() {
  let email = document.getElementById("loginEmail").value.trim();
  let password = document.getElementById("loginPassword").value.trim();

  if (email === "" || password === "") {
    alert("Email dan password wajib diisi!");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Login berhasil ✨");
      window.location.href = "home.html";
    })
    .catch((error) => {
      alert("Email atau password salah! / Hubungi admin kelompok.");
    });
}

/* ================= LOGIN DENGAN GOOGLE ================= */
function loginDenganGoogle() {
  signInWithPopup(auth, googleProvider)
    .then((result) => {
      alert("Login Google Berhasil! 🌸");
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Gagal Login Google:", error);
    });
}

/* ================= LOGOUT ================= */
function logout() {
  signOut(auth).then(() => {
    alert("Logout berhasil!");
    window.location.href = "index.html";
  });
}

/* ================= FORGOT PASSWORD REAL ================= */
// Pastikan fungsi ini ditaruh di dalam file JS Module lu

function forgotPassword() {
  let inputEmail = prompt("Masukkan email akun kamu yang terdaftar:");
  
  if (!inputEmail) return; // Jika user menekan tombol Cancel

  if (inputEmail.trim() === "") {
    alert("Email tidak boleh kosong!");
    return;
  }

  // Panggil fungsi resmi Firebase untuk kirim email reset password
  import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js")
    .then(({ sendPasswordResetEmail }) => {
      sendPasswordResetEmail(auth, inputEmail)
        .then(() => {
          // JIKA BERHASIL, EMAIL RESMI DARI GOOGLE AKAN MASUK
          alert(`📩 Link reset password BERHASIL dikirim! Silakan cek kotak masuk atau folder SPAM di email: ${inputEmail}`);
        })
        .catch((error) => {
          console.error("Gagal kirim email reset:", error);
          // Firebase otomatis mengecek apakah email itu terdaftar atau formatnya salah
          if (error.code === "auth/user-not-found") {
            alert("Email tersebut belum terdaftar di sistem kita, yaa!");
          } else if (error.code === "auth/invalid-email") {
            alert("Format email yang kamu masukkan salah/tidak valid!");
          } else {
            alert("Gagal mengirim email reset: " + error.message);
          }
        });
    });
}

function changePassword() {
  const user = auth.currentUser;

  if (!user) {
    alert("Kamu harus login terlebih dahulu!");
    return;
  }

  let newPassword = prompt("Masukkan password baru kamu (Minimal 6 karakter):");
  
  if (!newPassword) return; // Jika user menekan cancel

  if (newPassword.length < 6) {
    alert("Password gagal diubah! Firebase mewajibkan password minimal 6 karakter, yaa! 🔒");
    return;
  }

  // Eksekusi perubahan password langsung ke server Google Firebase
  import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js")
    .then(({ updatePassword }) => {
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
    });
}

/* ================= PAGE ROUTING / TOGGLE DISPLAY ================= */
function showRegister() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("registerPage").style.display = "flex";
}

function showLogin() {
  document.getElementById("registerPage").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
}

function toggleMenu() {
  let menu = document.getElementById("profileDropdown");
  if (!menu) return;
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function openProfile() {
  const user = auth.currentUser;
  if (user) {
    alert(`👤 Profil Saya\n\nNama: ${user.displayName || localStorage.getItem("name") || "User"}\nEmail: ${user.email}`);
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

/* ================= MANAGEMENT DATA (JADWAL) ================= */
let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

const dayOrder = {
  "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6, "Minggu": 7
};

// FUNGSI BARU: Memastikan array schedules selalu terurut rapi di memori
function urutkanJadwalSesuaiHari() {
  schedules.sort((a, b) => {
    let orderA = dayOrder[a.day] || 99;
    let orderB = dayOrder[b.day] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.start.localeCompare(b.start);
  });
}

function displaySchedules() {
  let scheduleList = document.getElementById("scheduleList");
  if (!scheduleList) return;
  scheduleList.innerHTML = "";
  
  // Ambil data paling fresh dari localstorage
  schedules = JSON.parse(localStorage.getItem("schedules")) || [];
  urutkanJadwalSesuaiHari(); // Urutkan dulu secara internal sebelum digambar ke HTML

  schedules.forEach((schedule, index) => {
    scheduleList.innerHTML += `
      <tr>
        <!-- Accessibility Fix: td hari diubah jadi th ber-scope row agar ramah screen reader -->
        <th scope="row"><strong>${schedule.day}</strong></th>
        <td>${schedule.course}</td>
        <td>${schedule.start} - ${schedule.end}</td>
        <td>${schedule.note || "-"}</td>
        <!-- Accessibility Fix: Tombol hapus dikasih aria-label penjelas agar tidak dinilai tombol buta -->
        <td>
          <button onclick="deleteSchedule(${index})" class="btn-delete" aria-label="Hapus jadwal mata kuliah ${schedule.course}">
            Hapus
          </button>
        </td>
      </tr>`;
  });
}

function addSchedule() {
  let course = document.getElementById("courseInput").value;
  let day = document.getElementById("dayInput").value; 
  let start = document.getElementById("startTime").value;
  let end = document.getElementById("endTime").value;
  let note = document.getElementById("noteInput").value;

  if (course === "" || day === "" || start === "" || end === "") {
    alert("Isi semua data jadwal!");
    return;
  }

  schedules.push({ course, day, start, end, note });
  
  // SOLUSI BUG 1: Urutkan array-nya dulu, baru simpan ke localStorage secara permanen
  urutkanJadwalSesuaiHari();
  localStorage.setItem("schedules", JSON.stringify(schedules));
  
  displaySchedules();

  document.getElementById("courseInput").value = "";
  document.getElementById("dayInput").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("noteInput").value = "";
}

function deleteSchedule(index) {
  // Sekarang index dari HTML dan urutan array lokal sudah 100% sinkron dan aman!
  schedules.splice(index, 1);
  localStorage.setItem("schedules", JSON.stringify(schedules));
  displaySchedules();
}

let gembokJadwalH20 = {};
let gembokJadwalH5  = {};
let gembokTodoH5    = {};


function jalankanSatpamOtomatis() {
  const kamusHari = {
    "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6
  };

  setInterval(() => {
    const sekarang = new Date();
    const hariIniAngka = sekarang.getDay();
    const tanggalKunciStr = sekarang.toDateString(); // Kunci tanggal harian (Contoh: "Tue May 26 2026")
    const jamSekarangMenit = (sekarang.getHours() * 60) + sekarang.getMinutes();
    
    const jadwalAktif = JSON.parse(localStorage.getItem("schedules")) || [];

    jadwalAktif.forEach((jadwal) => {
      if (kamusHari[jadwal.day] === hariIniAngka) {
        const [jamMulai, menitMulai] = jadwal.start.split(":").map(Number);
        const menitKuliahMulai = (jamMulai * 60) + menitMulai;
        
        // HITUNG SELISIH MENIT REAL-TIME
        const selisihMenitJadwal = menitKuliahMulai - jamSekarangMenit;

        // Bikin ID unik untuk matkul ini hari ini agar minggu depan bisa bunyi lagi
        const idKunciNotif = `${tanggalKunciStr}_${jadwal.course}_${jadwal.start}`;

        // KONDISI SAKLEK H-20 MENIT
        if (selisihMenitJadwal === 20) {
          if (!gembokJadwalH20[idKunciNotif]) {
            gembokJadwalH20[idKunciNotif] = true; // Kunci detik pertama di memori RAM!

            if (Notification.permission === "granted") {
              const keyNotifJadwal = `notif_jadwal_${jadwal.course}_${jadwal.start}_20`;
              if (!sessionStorage.getItem(keyNotifJadwal)) {
                new Notification(`⏰ H-20 JADWAL: ${jadwal.course}`, {
                  body: `Ayo, ${jadwal.course} bakal mulai dalam 20 menit lagi! Jangan telat, yaa!`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                  requireInteraction: true 
                });
                sessionStorage.setItem(keyNotifJadwal, "sent");
              }
            }
          }
        }
        
        // KONDISI SAKLEK H-5 MENIT
        else if (selisihMenitJadwal === 5) {
          if (!gembokJadwalH5[idKunciNotif]) {
            gembokJadwalH5[idKunciNotif] = true; // Kunci detik pertama di memori RAM!

            if (Notification.permission === "granted") {
              const keyNotifJadwal = `notif_jadwal_${jadwal.course}_${jadwal.start}_5`;
              if (!sessionStorage.getItem(keyNotifJadwal)) {
                new Notification(`🚨 H-5 JADWAL: ${jadwal.course}`, {
                  body: `Gass masuk! 5 menit lagi kelas ${jadwal.course} dimulai! Jangan nyasar!`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                  requireInteraction: true 
                });
                sessionStorage.setItem(keyNotifJadwal, "sent");
              }
            }
          }
        }
      }
    });
  }, 1000); // Satpam keliling tiap 1 detik murni murni offline
}

// PEMICU AUTOMATIS UTAMA (SUDAH DI-REPAIR SAKLEK)
window.addEventListener("DOMContentLoaded", () => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  displaySchedules(); // SOLUSI BUG 2: Panggil ini biar tabel langsung terisi pas web dibuka!
  jalankanSatpamOtomatis();
});

/* ================= EXPOSE TO GLOBAL ================= */
window.addSchedule = addSchedule;
window.deleteSchedule = deleteSchedule;





/* ================= MANAGEMENT DATA (TODO TASKS) ================= */

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function formatTampilanTanggal(dateString) {
  if (!dateString) return "-";
  const [tanggal, jam] = dateString.split("T");
  const [tahun, bulan, hari] = tanggal.split("-");
  return `${hari}-${bulan}-${tahun} Pukul ${jam}`;
}

function displayTasks(){
  periksaDeadlineOtomatis();
  let taskList = document.getElementById("taskList");
  if(!taskList) return;
  taskList.innerHTML = "";

  tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Urutkan berdasarkan deadline terdekat
  tasks.sort((a, b) => {
    const waktuA = new Date(a.deadline).getTime() || Infinity;
    const waktuB = new Date(b.deadline).getTime() || Infinity;
    return waktuA - waktuB;
  });

  const sekarang = new Date().getTime();

  // Render HANYA tugas yang belum selesai DAN belum kelewat deadline
  tasks.forEach((task, index)=>{
    const waktuDeadline = new Date(task.deadline).getTime() || Infinity;
    
    if (!task.completed && waktuDeadline >= sekarang) {
      taskList.innerHTML += `
        <div class="task-card">
          <h3>${task.name}</h3>
          <p>📅 Deadline: <strong>${formatTampilanTanggal(task.deadline)}</strong></p>
          <p>📝 ${task.note || "-"}</p>
          <div class="task-buttons">
            <button class="done-btn" onclick="completeTask(${index})">Selesai</button>
            <button class="delete-btn" onclick="deleteTask(${index})">Hapus</button>
          </div>
        </div>`;
    }
  });
}

function addTask(){
  let taskName = document.getElementById("taskInput").value.trim();
  let dateVal = document.getElementById("deadlineDate").value; 
  let timeVal = document.getElementById("deadlineTime").value; 
  let note = document.getElementById("taskNote").value.trim();

  if(taskName === "" || dateVal === "" || timeVal === ""){
    alert("Isi nama tugas, tanggal, beserta jam deadlinenya!");
    return;
  }

  let deadlineGabungan = `${dateVal}T${timeVal}`;

  tasks.push({ name: taskName, deadline: deadlineGabungan, note: note, completed: false });
  localStorage.setItem("tasks", JSON.stringify(tasks));
  
  displayTasks();
  displayGagalHistory(); // Refresh list gagal jika ada urutan baru

  document.getElementById("taskInput").value = "";
  document.getElementById("deadlineDate").value = "";
  document.getElementById("deadlineTime").value = "";
  document.getElementById("taskNote").value = "";
}

function completeTask(index){
  tasks[index].completed = true;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  displayTasks();
  displayTodoHistory();
}

function deleteTask(index){
  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  displayTasks();
  displayTodoHistory();
  displayGagalHistory(); // Update semua jenis histori
}

// --- HISTORI 1: TUGAS SELESAI ---
window.displayTodoHistory = function() {
  const historyList = document.getElementById("todoHistoryList");
  if (!historyList) return;
  historyList.innerHTML = "";

  const tasksLokal = JSON.parse(localStorage.getItem("tasks")) || [];
  const tugasSelesai = tasksLokal.filter(task => task.completed);

  if (tugasSelesai.length === 0) {
    historyList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Belum ada riwayat tugas selesai.</p>`;
    return;
  }

  tasksLokal.forEach((task, index) => {
    if (task.completed) {
      historyList.innerHTML += `
        <div class="history-item-box" style="background: #f8fafc; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #10b981; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 700; color: #1e293b; text-decoration: line-through;">${task.name}</span>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">✅ Selesai dikerjakan</p>
          </div>
          <button onclick="deleteTask(${index})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">Hapus Jejak</button>
        </div>`;
    }
  });
}

// --- HISTORI 2: TUGAS GAGAL/OVERDUE ---
window.displayGagalHistory = function() {
  const gagalList = document.getElementById("todoGagalList");
  if (!gagalList) return;
  gagalList.innerHTML = "";

  const tasksLokal = JSON.parse(localStorage.getItem("tasks")) || [];
  const sekarang = new Date().getTime();

  const tugasGagal = tasksLokal.filter(task => !task.completed && new Date(task.deadline).getTime() < sekarang);

  if (tugasGagal.length === 0) {
    gagalList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Bersih! Tidak ada tugas yang telat. Mantap! 🔥</p>`;
    return;
  }

  tasksLokal.forEach((task, index) => {
    const waktuDeadline = new Date(task.deadline).getTime() || Infinity;
    // PERBAIKAN TYPO: Variabel 'now' yang salah ketik sudah diganti saklek menjadi 'sekarang'
    if (!task.completed && waktuDeadline < sekarang) {
      gagalList.innerHTML += `
        <div class="history-item-box" style="background: #fff5f5; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #ef4444; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 700; color: #991b1b;">❌ ${task.name}</span>
            <p style="font-size: 12px; color: #b91c1c; margin-top: 4px;">Terlewat: ${formatTampilanTanggal(task.deadline)}</p>
          </div>
          <button onclick="deleteTask(${index})" style="background: #7f1d1d; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">Ihlaskan & Hapus</button>
        </div>`;
    }
  });
}

function jalankanAlarmTodoOtomatis() {
  setInterval(() => {
    const sekarang = new Date();
    const tanggalKunciStr = sekarang.toDateString();
    const timestampSekarang = sekarang.getTime();
    
    const tugasAktif = JSON.parse(localStorage.getItem("tasks")) || [];
    periksaDeadlineOtomatis();

    tugasAktif.forEach((task) => {
      if (!task.completed && task.deadline) {
        const waktuDeadline = new Date(task.deadline);
        const selisihMilidetik = waktuDeadline.getTime() - timestampSekarang;
        
        // PERBAIKAN: Gunakan Math.round agar pembulatan menitnya pas murni (bukan loncat lewat Math.ceil)
        const selisihMenitTodo = Math.round(selisihMilidetik / (1000 * 60));
        
        const idKunciTodo = `${tanggalKunciStr}_${task.name}_${task.deadline}`;

        // TIMING H-5 MENIT SAKLEK SEBELUM DEADLINE HANGUS
        if (selisihMenitTodo === 5) {
          if (!gembokTodoH5[idKunciTodo]) {
            gembokTodoH5[idKunciTodo] = true; // Kunci detik pertama di memori RAM!

            if (Notification.permission === "granted") {
              const keyNotifTodo = `notif_todo_${task.name}_${task.deadline}`;
              
              if (!sessionStorage.getItem(keyNotifTodo)) {
                new Notification(`🚨 DEADLINE H-5 TUGAS: ${task.name}`, {
                  body: `Gawat! Sisa 5 menit lagi batas pengumpulan tugas "${task.name}" habis! Buruan submit, yaa! 😱`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
                  requireInteraction: true 
                });
                sessionStorage.setItem(keyNotifTodo, "sent");
              }
            }
          }
        }
      }
    });
  }, 1000); // Satpam Todo ngecek tiap 1 detik murni murni offline
}


window.addEventListener("DOMContentLoaded", () => {
  displayTasks(); 
  displayTodoHistory(); 
  displayGagalHistory(); 
  jalankanAlarmTodoOtomatis(); // <--- WAJIB TAMBAHKAN BARIS INI BIAR ALARMNYA JALAN!
});

/* ================= EXPOSE TO GLOBAL ================= */
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;


function periksaDeadlineOtomatis() {
  const sekarang = new Date().getTime();
  let tasksLokal = JSON.parse(localStorage.getItem("tasks")) || [];
  let adaPerubahan = false;

  tasksLokal.forEach((task, index) => {
    // Memeriksa tugas yang belum selesai ('completed' masih false)
    if (!task.completed) {
      const waktuDeadline = new Date(task.deadline).getTime();

      // JIKA DEADLINE SUDAH LEWAT ATAU MENUNJUKKAN 0
      if (waktuDeadline <= sekarang) {
        // Otomatis tandai status tugas atau manipulasi properti di local data kamu
        // Untuk sistem kamu saat ini, tugas overdue otomatis tidak akan masuk displayTasks
        // Tapi kita bisa picu notifikasinya di sini
        if (!sessionStorage.getItem(`gagal_alert_${task.name}_${task.deadline}`)) {
          triggerNotifTugasGagal(task.name);
          sessionStorage.setItem(`gagal_alert_${task.name}_${task.deadline}`, "sent");
          adaPerubahan = true;
        }
      }
    }
  });

  if (adaPerubahan) {
    displayTasks();
    displayGagalHistory();
  }
}

// Fungsi Pemicu Notifikasi Tugas Gagal
function triggerNotifTugasGagal(judulTugas) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🚨 DEADLINE LEWAT, YAA!', {
        body: `Tugas "${judulTugas}" udah melewati batas waktu pengumpulan. Tetap semangat, yuk gaspol tugas lainnya!`,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'task-failed-alert',
        vibrate: [500, 100, 500],
        requireInteraction: true
      });
    });
  }
}





/* ================= MANAGEMENT DATA (WELLNESS) ================= */
let wellnessData = JSON.parse(localStorage.getItem("wellnessData")) || [];

function displayWellness(){
  let wellnessList = document.getElementById("wellnessList");
  if(!wellnessList) return;
  wellnessList.innerHTML = "";

  // 1. Tarik data paling fresh dari localstorage
  wellnessData = JSON.parse(localStorage.getItem("wellnessData")) || [];

  // 2. URUTKAN BERDASARKAN JAM PALING AWAL (Pagi ke Malam)
  wellnessData.sort((a, b) => a.time.localeCompare(b.time));

  // 3. Render HANYA aktivitas yang BELUM selesai (item.completed === false)
  wellnessData.forEach((item, index)=>{
    if (!item.completed) {
      wellnessList.innerHTML += `
        <div class="wellness-card">
          <h3>${item.type}</h3>
          <p>⏰ Waktu: <strong>${item.time}</strong></p>
          <p>🌸 Catatan: ${item.note || "-"}</p>
          <div class="wellness-buttons">
            <button class="done-btn" onclick="completeWellness(${index})">Selesai</button>
            <button class="delete-btn" onclick="deleteWellness(${index})">Hapus</button>
          </div>
        </div>`;
    }
  });
}

function addWellness(){
  let type = document.getElementById("wellnessType").value;
  let time = document.getElementById("wellnessTime").value; 
  let note = document.getElementById("wellnessNote").value;

  if(type === "" || time === ""){
    alert("Isi reminder & waktu!");
    return;
  }

  wellnessData.push({ type: type, time: time, note: note, completed: false });
  localStorage.setItem("wellnessData", JSON.stringify(wellnessData));
  displayWellness();
  displayWellnessHistory(); // Ikut refresh jika ada data baru masuk
  
  if (typeof sendNotification === "function") {
    sendNotification("💧 Wellness Reminder", "Reminder berhasil ditambahkan!");
  }

  document.getElementById("wellnessType").value = "";
  document.getElementById("wellnessTime").value = "";
  document.getElementById("wellnessNote").value = "";
}

// SEKARANG REFRESH OTOMATIS SAAT DIKLIK SELESAI
function completeWellness(index){
  // Mengubah status completed data wellness
  wellnessData[index].completed = true; 
  localStorage.setItem("wellnessData", JSON.stringify(wellnessData));
  
  displayWellness();         // Update daftar atas (aktivitas hilang)
  displayWellnessHistory();  // Update daftar histori (aktivitas muncul di bawah)
}

function deleteWellness(index){
  wellnessData.splice(index, 1);
  localStorage.setItem("wellnessData", JSON.stringify(wellnessData));
  displayWellness();
  displayWellnessHistory();  // Menghapus histori jika index yang dihapus berupa item selesai
}

function jalankanSatpamWellnessOtomatis() {
  setInterval(() => {
    const sekarang = new Date();
    const jamMenitSekarangStr = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;
    const pengingatWellness = JSON.parse(localStorage.getItem("wellnessData")) || [];

    pengingatWellness.forEach((item) => {
      if (!item.completed && item.time === jamMenitSekarangStr) {
        if (Notification.permission === "granted") {
          const keyNotifWellness = `notif_well_${item.type}_${item.time}`;
          
          if (!sessionStorage.getItem(keyNotifWellness)) {
            new Notification(`💧 TIME FOR WELLNESS: ${item.type}`, {
              body: `yaa, udah jam ${item.time}! Waktunya aktivitas "${item.type}". Catatan: ${item.note || 'Tetap sehat, yaa!'}`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3011/3011285.png',
              requireInteraction: true 
            });
            sessionStorage.setItem(keyNotifWellness, "sent");
          }
        }
      }
    });
  }, 30000); 
}

/**
 * C. WELLNESS HISTORY HANDLER (Histori Harian + Tombol Hapus Jejak)
 */
window.displayWellnessHistory = function() {
  const historyList = document.getElementById("wellnessHistoryList");
  if (!historyList) return;
  historyList.innerHTML = "";

  const wellnessLokal = JSON.parse(localStorage.getItem("wellnessData")) || [];
  const wellnessSelesai = wellnessLokal.filter(item => item.completed);

  if (wellnessSelesai.length === 0) {
    historyList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Belum ada aktivitas kesehatan yang tercatat hari ini.</p>`;
    return;
  }

  // Gunakan data mentah agar tombol 'Hapus Jejak' menembak index yang tepat ke localStorage
  wellnessLokal.forEach((item, index) => {
    if (item.completed) {
      historyList.innerHTML += `
        <div class="history-item-box" style="background: #faf5ff; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #8b5cf6; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 700; color: #1e293b;">${item.type} (${item.time})</span>
            <p style="font-size: 12px; color: #7c3aed; margin-top: 4px;">💙 Sudah terpenuhi hari ini</p>
          </div>
          <!-- TOMBOL HAPUS JEJAK HISTORI WELLNESS -->
          <button onclick="deleteWellness(${index})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">
            Hapus Jejak
          </button>
        </div>`;
    }
  });
}

// TRIGGER LOAD UTAMA (Pasang di DOMContentLoaded halaman Wellness)
window.addEventListener("DOMContentLoaded", () => {
  jalankanSatpamWellnessOtomatis();
  displayWellness();
  displayWellnessHistory();
});

/* ================= EXPOSE TO GLOBAL ================= */
window.addWellness = addWellness;
window.completeWellness = completeWellness;
window.deleteWellness = deleteWellness;


 /* ================= MANAGEMENT DATA (FOCUS TIMER) ================= */

// 1. PENGAMAN VARIABEL GLOBAL (Agar tidak reset/hilang saat refresh)
if (typeof focusInterval === 'undefined') {
  var focusInterval; 
}

function startFocusTimer() {
  const startBtn = document.getElementById("btnMulaiFocus");
  if (startBtn && startBtn.innerText === "Selesai") {
    hentikanTimerTengahJalanManual();
    return;
  }

  let minutesInput = document.getElementById("focusMinutes");
  let targetInput = document.getElementById("focusTarget");
  let noteInput = document.getElementById("focusNote");
  if (!minutesInput) return;

  let focusValue = minutesInput.value;
  if (focusValue === "") {
    alert("Masukkan durasi belajar!");
    return;
  }

  // 1. LOCK INPUT
  minutesInput.disabled = true;
  if (targetInput) targetInput.disabled = true;
  if (noteInput) noteInput.disabled = true;

  // 2. KALKULASI TIMESTAMP
  const sekarang = new Date().getTime();
  const durasiMilidetik = focusValue * 60 * 1000;
  const waktuSelesai = sekarang + durasiMilidetik;

  // 3. SIMPAN PAKET DATA TIMER KE LOCALSTORAGE
  const dataTimer = {
    endTime: waktuSelesai,
    initialDuration: focusValue,
    target: targetInput ? targetInput.value : "",
    note: noteInput ? noteInput.value : ""
  };
  localStorage.setItem("activeFocusTimer", JSON.stringify(dataTimer));

  // 4. JALANKAN MESIN COUNTDOWN
  jalankanHitungMundur(waktuSelesai, dataTimer.target, dataTimer.note, dataTimer.initialDuration);
}

function jalankanHitungMundur(endTime, targetText, noteText, initialDuration) {
  let targetDisplay = document.getElementById("targetDisplay");
  let noteDisplay = document.getElementById("noteDisplay");
  
  if (targetDisplay) targetDisplay.innerText = targetText || "Belajar";
  if (noteDisplay) noteDisplay.innerText = noteText || "-";

  let minutesInput = document.getElementById("focusMinutes");
  let targetInput = document.getElementById("focusTarget");
  let noteInput = document.getElementById("focusNote");
  if (minutesInput) minutesInput.disabled = true;
  if (targetInput) targetInput.disabled = true;
  if (noteInput) noteInput.disabled = true;

  // REQ USER: Ubah teks menjadi "Selesai" warna hijau, tapi JANGAN DI-DISABLED biar bisa diklik!
  const startBtn = document.getElementById("btnMulaiFocus");
  if (startBtn) {
    startBtn.innerText = "Selesai";
    startBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    startBtn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
    startBtn.disabled = false; // PASTIKAN FALSE BIAR BISA DIKLIK USER
  }

  clearInterval(focusInterval);
  
  focusInterval = setInterval(() => {
    const sekarang = new Date().getTime();
    const selisihMilidetik = endTime - sekarang;
    let sisaDetikTotal = Math.ceil(selisihMilidetik / 1000);
    
    // KONDISI 1: JIKA WAKTU HABIS ALAMI (00:00)
    if (sisaDetikTotal <= 0) {
      clearInterval(focusInterval);
      localStorage.removeItem("activeFocusTimer");

      let timerDisplay = document.getElementById("timerDisplay");
      if (timerDisplay) timerDisplay.innerText = "00:00";

      bukaGembokFormInputDanKembalikanTombol();

      // Masuk jejak riwayat otomatis
      catatHistoryFocusKeLokal(targetText, initialDuration);

      if (Notification.permission === "granted") {
        new Notification("⏰ Focus Mode Selesai!", {
          body: `🎉 Sesi belajar "${targetText || 'Fokus'}" sudah kelar, yaa! Hebattt kamu sudah produktif hari ini 🌸`,
          icon: 'https://cdn-icons-png.flaticon.com/512/9043/9043516.png',
          requireInteraction: true
        });
      }

      alert(`🎉 Focus session selesai!\nHebattt kamu sudah belajar: ${targetText || 'Fokus'} 🌸`);
      return;
    }

    let minutes = Math.floor(sisaDetikTotal / 60);
    let seconds = sisaDetikTotal % 60;
    
    let timerDisplay = document.getElementById("timerDisplay");
    if (timerDisplay) {
      timerDisplay.innerText = String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
    }
  }, 1000);
}

// KONDISI 2: USER KLIK TOMBOL "SELESAI" SEBELUM WAKTU HABIS (MANUAL STOP)
function hentikanTimerTengahJalanManual() {
  clearInterval(focusInterval);
  
  const simpananTimer = localStorage.getItem("activeFocusTimer");
  if (simpananTimer) {
    const dataTimer = JSON.parse(simpananTimer);
    
    // Tetap catat ke riwayat karena user menganggapnya sudah "Selesai"
    catatHistoryFocusKeLokal(dataTimer.target, dataTimer.initialDuration);
  }

  localStorage.removeItem("activeFocusTimer");
  
  let timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) timerDisplay.innerText = "00:00";

  bukaGembokFormInputDanKembalikanTombol();
  alert("Sesi fokus telah diselesaikan secara manual dan dicatat ke jurnal! 🌸");
}

function resetFocusTimer() {
  clearInterval(focusInterval);
  localStorage.removeItem("activeFocusTimer");
  
  let timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) timerDisplay.innerText = "00:00";
  
  let targetDisplay = document.getElementById("targetDisplay");
  let noteDisplay = document.getElementById("noteDisplay");
  if (targetDisplay) targetDisplay.innerText = "Belum ada target belajar.";
  if (noteDisplay) noteDisplay.innerText = "Belum ada catatan.";

  bukaGembokFormInputDanKembalikanTombol();

  let minutesInput = document.getElementById("focusMinutes");
  let targetInput = document.getElementById("focusTarget");
  let noteInput = document.getElementById("focusNote");
  if (minutesInput) minutesInput.value = "";
  if (targetInput) targetInput.value = "";
  if (noteInput) noteInput.value = "";
}


function bukaGembokFormInputDanKembalikanTombol() {
  let minutesInput = document.getElementById("focusMinutes");
  let targetInput = document.getElementById("focusTarget");
  let noteInput = document.getElementById("focusNote");
  
  if (minutesInput) minutesInput.disabled = false;
  if (targetInput) targetInput.disabled = false;
  if (noteInput) noteInput.disabled = false;

  const startBtn = document.getElementById("btnMulaiFocus");
  if (startBtn) {
    startBtn.innerText = "Mulai";
    startBtn.style.background = "#4b5cff"; // Balik ke warna biru utama lo
    startBtn.style.boxShadow = "0 4px 12px rgba(75, 92, 255, 0.18)";
    startBtn.disabled = false;
  }
}

function catatHistoryFocusKeLokal(targetText, durasiMenit) {
  let focusHistory = JSON.parse(localStorage.getItem("focusHistoryData")) || [];
  const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  focusHistory.push({
    target: targetText || "Fokus Belajar",
    duration: durasiMenit || 25,
    timestamp: waktuSekarang
  });
  
  localStorage.setItem("focusHistoryData", JSON.stringify(focusHistory));
  displayFocusHistory();
}


function deleteFocusHistory(index) {
  let focusHistory = JSON.parse(localStorage.getItem("focusHistoryData")) || [];
  focusHistory.splice(index, 1);
  localStorage.setItem("focusHistoryData", JSON.stringify(focusHistory));
  displayFocusHistory();
}

function cekSesiTimerPasRefresh() {
  const simpananTimer = localStorage.getItem("activeFocusTimer");
  if (simpananTimer) {
    const dataTimer = JSON.parse(simpananTimer);
    const sekarang = new Date().getTime();

    if (dataTimer.endTime > sekarang) {
      // Mesin dihidupkan ulang dengan data dari localStorage
      jalankanHitungMundur(dataTimer.endTime, dataTimer.target, dataTimer.note, dataTimer.initialDuration);
    } else {
      localStorage.removeItem("activeFocusTimer");
    }
  }
}

/**
 * D. FOCUS TIMER HISTORY HANDLER (Permanen Tracker dengan Tombol Hapus)
 */
window.displayFocusHistory = function() {
  const historyList = document.getElementById("focusHistoryList");
  if (!historyList) return;
  historyList.innerHTML = "";

  let focusHistory = JSON.parse(localStorage.getItem("focusHistoryData")) || [];

  if (focusHistory.length === 0) {
    historyList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Belum ada riwayat sesi fokus.</p>`;
    return;
  }

  focusHistory.forEach((log, index) => {
    historyList.innerHTML += `
      <div class="history-item-box" style="background: #eff6ff; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #4b5cff; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-weight: 700; color: #1e293b;">🎯 Sesi: ${log.target}</span>
          <p style="font-size: 12px; color: #4b5cff; margin-top: 4px;">⏱️ Durasi: ${log.duration} Menit | Waktu: ${log.timestamp}</p>
        </div>
        <button onclick="deleteFocusHistory(${index})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">
          Hapus Jejak
        </button>
      </div>`;
  });
}

// 2. PEMICU AMAN (Menjamin HTML ter-render sempurna saat web dimuat)
document.addEventListener("DOMContentLoaded", () => {
  cekSesiTimerPasRefresh();
  displayFocusHistory();
});

/* ================= EXPOSE TO GLOBAL ================= */
window.startFocusTimer = startFocusTimer;
window.resetFocusTimer = resetFocusTimer;
window.deleteFocusHistory = deleteFocusHistory;





/* ================= SYSTEM UTILITY (NOTIFIKASI & SUARA) ================= */
if(Notification.permission !== "granted"){
  Notification.requestPermission();
}


let alarmSound = new Audio("alarm.mp3");

function sendNotification(title, message){
  if(Notification.permission === "granted"){
    new Notification(title, {
      body: message,
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
    });
  }
  alarmSound.play().catch(e => console.log("Audio play ditangguhkan yaawser"));
}

/* ================= INITIAL LOAD DATA ON STARTUP ================= */
// Panggil penayangan data otomatis saat file diload pertama kali
displaySchedules();
displayTasks();
displayWellness();

/* ================= JALUR EKSPOR WINDOW GLOBAL ================= */
//
window.showRegister = showRegister;
window.showLogin = showLogin;
window.register = register;
window.login = login;
window.loginDenganGoogle = loginDenganGoogle;
window.logout = logout;
window.forgotPassword = forgotPassword;
window.toggleMenu = toggleMenu;
window.openProfile = openProfile;
window.privacySecurity = privacySecurity;
window.scrollDashboard = scrollDashboard;
window.addSchedule = addSchedule;
window.deleteSchedule = deleteSchedule;
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.addWellness = addWellness;
window.completeWellness = completeWellness;
window.deleteWellness = deleteWellness;
window.startFocusTimer = startFocusTimer;
window.resetFocusTimer = resetFocusTimer;
window.changePassword = changePassword;
window.aktifkanNotificationFCM = aktifkanNotificationFCM;




const messaging = getMessaging(app);


function aktifkanNotificationFCM() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Izin notifikasi diberikan.');
      
      // Ambil token perangkat dari Google
      getToken(messaging, { 
        vapidKey: 'BPyZbomuMFw7K1C7RbAKX7-0R2crOwKSCD7txHAD5Z8xVeoOCzzLL3AZo58bGLw7SBhgwCQ_WmoKaCekkROhhp0' 
      })
      .then((currentToken) => {
        if (currentToken) {
          // Token ini adalah "alamat rumah" laptop/HP user. 
          console.log("TOKEN FCM LU (Copas ini buat ngetes):", currentToken);
          // Kalau di industri, token ini bakal disimpan ke database biar bisa ditembak massal
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

// 4. Jika aplikasi kebetulan LAGI DIBUKA, tangkap notifnya lewat sini agar gak bentrok
onMessage(messaging, (payload) => {
  console.log('Notif masuk pas aplikasi kebuka:', payload);
  alert(`📢 ${payload.notification.title}\n\n${payload.notification.body}`);
});




window.addEventListener("DOMContentLoaded", () => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  
  jalankanSatpamOtomatis();          // Jaga Jadwal & To-Do
  jalankanSatpamWellnessOtomatis();  // Jaga Wellness (On Time)
  cekSesiTimerPasRefresh();          // <-- JAGA TIMER GAK HILANG PAS REFRESH (Pilar Baru!)

  // Render sisa data
  displayTasks();
  displaySchedules();
  displayWellness();
});

window.addEventListener("DOMContentLoaded", () => {
  // Cek dan bersihkan riwayat Wellness jika sudah ganti hari sebelum dirender
  bersihkanWellnessGantiHariOtomatis();

  // Render komponen history secara kondisional tergantung elemen halaman yang aktif
  if (document.getElementById("todoHistoryList")) displayTodoHistory();
  if (document.getElementById("wellnessHistoryList")) displayWellnessHistory();
  if (document.getElementById("focusHistoryList")) displayFocusHistory();
});

/**
 * A. UTILITY: SATPAM PENJAGA WAKTU GANTI HARI (Khusus Wellness 1 Hari Saklek)
 */
function bersihkanWellnessGantiHariOtomatis() {
  const tanggalHariIni = new Date().toDateString(); 
  const tanggalTerakhirSimpan = localStorage.getItem("lastWellnessDate");

  if (tanggalTerakhirSimpan !== tanggalHariIni) {
    let wellnessLokal = JSON.parse(localStorage.getItem("wellnessData")) || [];
    wellnessLokal.forEach(item => item.completed = false);
    
    localStorage.setItem("wellnessData", JSON.stringify(wellnessLokal));
    localStorage.removeItem("wellnessHistoryData"); 
    localStorage.setItem("lastWellnessDate", tanggalHariIni);
  }
}


// Jalankan otomatis fungsi pembersih ganti hari dan render semua histori saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  bersihkanWellnessGantiHariOtomatis();
  displayTodoHistory();
  displayWellnessHistory();
  displayFocusHistory();
});


window.addEventListener("DOMContentLoaded", () => {
  aktifkanNotificationFCM(); // <--- WAJIB DIPANGGIL DI SINI
});
window.addEventListener("DOMContentLoaded", () => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  
  // --- DAFTARKAN SERVICE WORKER & KIRIM CONFIG AMAN ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((reg) => {
      console.log('Service Worker berhasil didaftarkan dengan scope:', reg.scope);

      // Fungsi untuk mengirimkan config dari .env secara aman
      const kirimConfigKeSW = () => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SET_FIREBASE_CONFIG',
            config: {
              apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
              authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
              messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
              appId: import.meta.env.VITE_FIREBASE_APP_ID
            }
          });
        }
      };

      // Jika Service Worker sudah langsung aktif, kirim config-nya
      if (reg.active) {
        kirimConfigKeSW();
      } else {
        // Jika sedang menginstal atau memperbarui, tunggu sampai statusnya aktif (activated)
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              kirimConfigKeSW();
            }
          });
        });
      }

    })
    .catch((err) => {
      console.error('Service Worker gagal didaftarkan:', err);
    });
}

  jalankanSatpamOtomatis();          
  jalankanSatpamWellnessOtomatis();  
  cekSesiTimerPasRefresh();          

  displayTasks();
  displaySchedules();
  displayWellness();
});

// Dan jangan lupa ekspos ke global jika tombol HTML mau ikutan manggil
window.aktifkanNotificationFCM = aktifkanNotificationFCM;




let deferredPrompt; // 1. Variabel penampung pemicu instalasi

// 2. Biarkan Chrome yang memutuskan kapan tombol ini layak muncul
window.addEventListener('beforeinstallprompt', (e) => {
  // Cegah pop-up bawaan yaawser yang mengganggu
  e.preventDefault();
  
  // Kunci event instalasinya ke dalam variabel kita
  deferredPrompt = e;
  
 
  // Artinya tombol HANYA MUNCUL kalau Chrome udah siap 100% buat instal
  const tombolInstal = document.getElementById('btnInstalPWA');
  if (tombolInstal) {
    tombolInstal.style.display = 'inline-block'; 
    
    // 3. Pasang fungsi klik yang valid
    tombolInstal.addEventListener('click', () => {
      // Sembunyikan tombolnya biar gak di-klik dua kali
      tombolInstal.style.display = 'none';
      
      // Tembak pop-up instalasi Chrome yang asli!
      deferredPrompt.prompt();
      
      // Pantau keputusan user
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User gokil, sukses instal MindSpace! 🌸');
        } else {
          console.log('User nolak instal.');
          tombolInstal.style.display = 'inline-block'; // Munculkan lagi kalau ditolak
        }
        deferredPrompt = null;
      });
    });
  }
});

// 4. Logika penutup: Kalau aplikasi udah terinstal di laptop, sembunyikan tombol selamanya
window.addEventListener('appinstalled', () => {
  console.log('Aplikasi resmi terpasang di perangkat, yaa!');
  const tombolInstal = document.getElementById('btnInstalPWA');
  if (tombolInstal) tombolInstal.style.display = 'none';
});



// 1. STRUKTUR UTAMA SEGMENT JADWAL KULIAH 

// Fungsi untuk menyimpan Jadwal baru dari Form HTML ke LocalStorage
function tambahJadwalKuliah(namaMatkul, hariTerpilih, jamMenit) {
  // Ambil data lama atau bikin array baru kalau masih kosong
  const dataJadwal = JSON.parse(localStorage.getItem('jadwalKuliah')) || [];
  
  // Bikin object jadwal baru (Cuma simpan Hari dan Jam murni, )
  const jadwalBaru = {
    id: 'jadwal_' + Date.now(),
    matkul: namaMatkul,
    hari: hariTerpilih, 
    jam: jamMenit      
  };
  
  dataJadwal.push(jadwalBaru);
  localStorage.setItem('jadwalKuliah', JSON.stringify(dataJadwal));
  
  console.log('Jadwal berhasil disimpen di memori lokal, ! 🪻');
  tampilkanJadwalDashboard(); // Refresh tampilan list di layar
}

// Fungsi untuk merender daftar jadwal ke HTML biar kelihatan gagah
function tampilkanJadwalDashboard() {
  const containerJadwal = document.getElementById('containerListJadwal'); // Sesuaikan ID container HTML lu
  if (!containerJadwal) return;
  
  const dataJadwal = JSON.parse(localStorage.getItem('jadwalKuliah')) || [];
  containerJadwal.innerHTML = ''; // Bersihin isi lama
  
  if (dataJadwal.length === 0) {
    containerJadwal.innerHTML = '<p style="color: #666; text-align: center;">Belum ada jadwal kuliah yang diinput.</p>';
    return;
  }
  
  // Render satu-persatu dalam bentuk card Lavender Premium
  dataJadwal.forEach(j => {
    containerJadwal.innerHTML += `
      <div class="wellness-card" id="${j.id}">
        <h3>🪻 ${j.matkul}</h3>
        <p><strong>Hari:</strong> ${j.hari}</p>
        <p><strong>Jam Masuk:</strong> ${j.jam} WIB</p>
        <div class="wellness-buttons">
          <button class="delete-btn" onclick="hapusJadwal('${j.id}')">Hapus</button>
        </div>
      </div>
    `;
  });
}

// Fungsi hapus jadwal jika kuliahnya udah lulus atau libur
function hapusJadwal(idJadwal) {
  let dataJadwal = JSON.parse(localStorage.getItem('jadwalKuliah')) || [];
  dataJadwal = dataJadwal.filter(j => j.id !== idJadwal);
  localStorage.setItem('jadwalKuliah', JSON.stringify(dataJadwal));
  tampilkanJadwalDashboard();
}


// =========================================================================
// 2. SISTEM SATPAM OTOMATIS: PENGAWAS JADWAL H-20 & H-5 (CEK TIAP MENIT)
// =========================================================================
let rentangWaktuTerakhir = ""; // Gembok biar gak spam notif di menit yang sama

setInterval(() => {
  const sekarang = new Date();
  
  // 1. Pemetaan hari sistem JavaScript
  const daftarHari = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hariIni = daftarHari[sekarang.getDay()]; 
  
  // 2. Ambil total MENIT saat ini dari jam 00:00 (Biar gampang dikurangi)
  const totalMenitSekarang = (sekarang.getHours() * 60) + sekarang.getMinutes();
  
  // Buat gembok preventif biar gak double trigger di detik yang sama
  const kunciMenit = `${sekarang.getHours()}:${sekarang.getMinutes()}`;
  if (rentangWaktuTerakhir === kunciMenit) return;

  // 3. Tarik data jadwal kuliah dari LocalStorage
  const dataJadwal = JSON.parse(localStorage.getItem('jadwalKuliah')) || [];

  // 4. Lakukan scanning tiap jadwal kuliah yang terdaftar
  dataJadwal.forEach(jadwal => {
    // Hanya cek jadwal yang HARI-NYA cocok dengan hari ini
    if (jadwal.hari === hariIni) {
      
      // Pecah string jam jadwal (misal "08:00" jadi jam 8, menit 0)
      const [jamJadwal, menitJadwal] = jadwal.jam.split(':').map(Number);
      const totalMenitJadwal = (jamJadwal * 60) + menitJadwal;
      
      // Hitung selisih waktu: Menit Jadwal dikurangi Menit Sekarang
      const selisihMenit = totalMenitJadwal - totalMenitSekarang;

      // KONDISI 1: Tembak Peringatan H-20 Menit
      if (selisihMenit === 21) {
        rentangWaktuTerakhir = kunciMenit;
        triggerNotifJadwalOffline(jadwal.matkul, "20 menit lagi masuk, yaa! Siap-siap otw kelas.");
      }
      
      // KONDISI 2: Tembak Peringatan H-5 Menit (Mode Siaga)
      else if (selisihMenit === 6) {
        rentangWaktuTerakhir = kunciMenit;
        triggerNotifJadwalOffline(jadwal.matkul, "5 menit lagi kelas dimulai! Jangan nyasar, gass masuk.");
      }
    }
  });

}, 30000); // Cek tiap 30 detik biar sensitivitasnya tajam


// =========================================================================
// 3. FUNGSI EKSEKUSI NOTIFIKASI LOKAL yaaWSER (DIUBAH PESANNYA SECARA DINAMIS)
// =========================================================================
function triggerNotifJadwalOffline(namaMatkul, pesanKustom) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(`🪻 PENGINGAT JADWAL: ${namaMatkul}`, {
        body: pesanKustom, // Isinya bakal otomatis berubah sesuai H-20 atau H-5
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', // Logo Lavender Murni Lu ✅
        vibrate: [300, 100, 300], 
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        // Tambahin penanda di tag biar yaawser gak bingung bedain notif H-20 dan H-5
        tag: 'jadwal-alert-' + namaMatkul + '-' + (pesanKustom.includes('20') ? '20' : '5'),
        requireInteraction: true 
      });
    });
  } else {
    console.log("Izin notifikasi belum diaktifkan, yaa!");
  }
}


// =========================================================================
// 1. STRUKTUR UTAMA SEGMENT TO-DO LIST (LAVENDER PREMIUM) WITH OFFLINE NOTIF
// =========================================================================

// Fungsi untuk menyimpan Tugas baru dari Form ke LocalStorage
function tambahTodoTugas(namaTugas, tanggalDeadline, jamDeadline) {
  const dataTodo = JSON.parse(localStorage.getItem('todoTugas')) || [];
  
  const tugasBaru = {
    id: 'todo_' + Date.now(),
    tugas: namaTugas,
    tanggal: tanggalDeadline, // Format HTML input date: "YYYY-MM-DD" (Contoh: "2026-05-26")
    jam: jamDeadline         // Format HTML input time: "HH:MM" (Contoh: "23:59")
  };
  
  dataTodo.push(tugasBaru);
  localStorage.setItem('todoTugas', JSON.stringify(dataTodo));
  
  console.log('Tugas baru sukses dikunci di memori lokal, yaa! 🪻');
  tampilkanTodoDashboard(); // Refresh UI list tugas
}

// Fungsi render daftar To-Do ke HTML biar sewarna Lavender
function tampilkanTodoDashboard() {
  const containerTodo = document.getElementById('containerListTodo'); // Sesuaikan ID HTML lu, 
  if (!containerTodo) return;
  
  const dataTodo = JSON.parse(localStorage.getItem('todoTugas')) || [];
  containerTodo.innerHTML = '';
  
  if (dataTodo.length === 0) {
    containerTodo.innerHTML = '<p style="color: #666; text-align: center;">Tenang, yaa. Belum ada tugas yang numpuk.</p>';
    return;
  }
  
  dataTodo.forEach(t => {
    containerTodo.innerHTML += `
      <div class="wellness-card" id="${t.id}">
        <h3>🌸 ${t.tugas}</h3>
        <p><strong>Deadline:</strong> ${t.tanggal} | Pukul ${t.jam} WIB</p>
        <div class="wellness-buttons">
          <button class="done-btn" onclick="hapusTodo('${t.id}')">Selesai</button>
        </div>
      </div>
    `;
  });
}

// Fungsi hapus to-do jika tugas sudah selesai dikerjakan
function hapusTodo(idTodo) {
  let dataTodo = JSON.parse(localStorage.getItem('todoTugas')) || [];
  dataTodo = dataTodo.filter(t => t.id !== idTodo);
  localStorage.setItem('todoTugas', JSON.stringify(dataTodo));
  tampilkanTodoDashboard();
}


// =========================================================================
// 2. SATPAM TO-DO: PENGHITUNG SELISIH DEADLINE H-5 MENIT (OFFLINE TOTAL)
// =========================================================================
let gembokTodoTerakhir = ""; // Biar gak spam notif berulang-ulang di menit yang sama

setInterval(() => {
  const sekarang = new Date();
  
  // Ambil data waktu sekarang dalam format Timestamp Milidetik
  const timestampSekarang = sekarang.getTime();
  
  // Bikin kunci menit buat satpam preventif
  const kunciMenitTodo = `${sekarang.getDate()}-${sekarang.getHours()}:${sekarang.getMinutes()}`;
  if (gembokTodoTerakhir === kunciMenitTodo) return;

  // Tarik data tugas dari LocalStorage
  const dataTodo = JSON.parse(localStorage.getItem('todoTugas')) || [];

  dataTodo.forEach(item => {
    // Gabungkan string Tanggal dan Jam milik tugas jadi satu format standar Date
    // Contoh gabungan: "2026-05-26T23:59:00"
    const stringDeadline = `${item.tanggal}T${item.jam}:00`;
    const waktuDeadline = new Date(stringDeadline);
    
    // Validasi jika format inputan tanggalnya valid
    if (!isNaN(waktuDeadline.getTime())) {
      const timestampDeadline = waktuDeadline.getTime();
      
      // Hitung selisih waktu dalam satuan MENIT
      // (Timestamp Deadline - Timestamp Sekarang) / 1000 milidetik / 60 detik
      const selisihMenitTodo = Math.round((timestampDeadline - timestampSekarang) / 1000 / 60);

      // KUNCI UTAMA: Jika waktu sisa TEPAT 5 menit lagi sebelum deadline!
      if (selisihMenitTodo === 6) {
        gembokTodoTerakhir = kunciMenitTodo; // Kunci menit ini
        triggerNotifTodoOffline(item.tugas); // Tembak alarm darurat!
      }
    }
  });

}, 30000); // Satpam ngecek tiap 30 detik biar super akurat


// =========================================================================
// 3. FUNGSI EKSEKUSI NOTIFIKASI LOCAL TO-DO (MODE ANTI-PANIK)
// =========================================================================
function triggerNotifTodoOffline(namaTugas) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🚨 DEADLINE DEPAN MATA, yaa!', {
        body: `Tugas "${namaTugas}" kamu sisa 5 menit lagi! Ayoo buruan submit ke sistem!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', // Ikon Lavender Murni Lu ✅
        vibrate: [500, 100, 500, 100, 500], // Getaran beruntun biar panik wkwk
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'todo-alert-' + namaTugas,
        requireInteraction: true // Notif bakal nempel di layar sampai di-close murni oleh lu
      });
    });
  }
}

// Tambahkan pemicu render load data tugas saat halaman pertama kali dibuka
window.addEventListener('DOMContentLoaded', () => {
  tampilkanTodoDashboard();
});


// =========================================================================
// 1. STRUKTUR UTAMA SEGMENT WELLNESS LOG (LAVENDER PREMIUM) WITH OFFLINE NOTIF
// =========================================================================

// Fungsi menyimpan Log Wellness rutin ke LocalStorage
function tambahWellnessLog(namaAktivitas, jamMenitTarget) {
  const dataWellness = JSON.parse(localStorage.getItem('wellnessLogs')) || [];
  
  const logBaru = {
    id: 'well_' + Date.now(),
    aktivitas: namaAktivitas, // Contoh: "Minum Air Putih 500ml", "Mood Check-in"
    jam: jamMenitTarget       // Format HTML input time: "HH:MM" (Contoh: "07:00", "13:00")
  };
  
  dataWellness.push(logBaru);
  localStorage.setItem('wellnessLogs', JSON.stringify(dataWellness));
  
  console.log('Log kesehatan on-time berhasil dikunci di memori lokal, yaa! 🪻');
  tampilkanWellnessDashboard(); // Refresh list visual di layar
}

// Fungsi render list log kesehatan ke HTML biar serasi bertema Lavender
function tampilkanWellnessDashboard() {
  const containerWellness = document.getElementById('containerListWellness'); // Sesuaikan ID HTML form wellness lu, yaa
  if (!containerWellness) return;
  
  const dataWellness = JSON.parse(localStorage.getItem('wellnessLogs')) || [];
  containerWellness.innerHTML = '';
  
  if (dataWellness.length === 0) {
    containerWellness.innerHTML = '<p style="color: #666; text-align: center;">Belum ada target log kesehatan harian, yaa.</p>';
    return;
  }
  
  dataWellness.forEach(w => {
    containerWellness.innerHTML += `
      <div class="wellness-card" id="${w.id}">
        <h3>💧 ${w.aktivitas}</h3>
        <p><strong>Waktu Rutin:</strong> Setiap Hari jam ${w.jam} WIB</p>
        <div class="wellness-buttons">
          <button class="done-btn" onclick="hapusWellness('${w.id}')">Selesai</button>
        </div>
      </div>
    `;
  });
}

// Fungsi hapus log atau tandai kelar untuk hari itu
function hapusWellness(idWellness) {
  let dataWellness = JSON.parse(localStorage.getItem('wellnessLogs')) || [];
  dataWellness = dataWellness.filter(w => w.id !== idWellness);
  localStorage.setItem('wellnessLogs', JSON.stringify(dataWellness));
  tampilkanWellnessDashboard();
}



// 2. SATPAM WELLNESS: PENGAWAS DETIK ON-TIME (CEK TIAP MENIT)

let gembokWellnessTerakhir = ""; // Kunci preventif biar gak spam notif di menit yang sama

setInterval(() => {
  const sekarang = new Date();
  
  // Ambil jam dan menit lokal saat ini secara real-time (Format HH:MM)
  const jamSekarang = String(sekarang.getHours()).padStart(2, '0');
  const menitSekarang = String(sekarang.getMinutes()).padStart(2, '0');
  const waktuSekarang = `${jamSekarang}:${menitSekarang}`;

  // Gembok preventif biar gak jebol berkali-kali dalam menit yang sama
  if (gembokWellnessTerakhir === waktuSekarang) return;

  // Tarik data Wellness dari LocalStorage
  const dataWellness = JSON.parse(localStorage.getItem('wellnessLogs')) || [];

  // Cari apakah ada target aktivitas kesehatan yang jamnya SAKLEK (ON-TIME) detik ini juga
  const logCocok = dataWellness.find(w => w.jam === waktuSekarang);

  if (logCocok) {
    gembokWellnessTerakhir = waktuSekarang; // Kunci menit ini biar aman
    triggerNotifWellnessOffline(logCocok.aktivitas); // Tembak alarm pengingat!
  }
}, 30000); // Satpam keliling ngecek tiap 30 detik murni offline



// 3. FUNGSI EKSEKUSI NOTIFIKASI LOCAL WELLNESS (VIBE CALM & HEALTHY)

function triggerNotifWellnessOffline(namaAktivitas) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🪻 WELLNESS CHECK-IN, yaa!', {
        body: `Waktunya on-time untuk: "${namaAktivitas}". Jaga kesehatan jiwa dan fisik lu, gass eksekusi!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', // Logo Lavender Estetik Kebanggaan Lu ✅
        vibrate: [200, 100, 200, 100, 400], // Ritme getar soft tapi kerasa di HP
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'wellness-alert-' + namaAktivitas,
        requireInteraction: true // Tetap melayang di layar sampai di-klik biar mahasiswanya disiplin
      });
    });
  }
}

// Render data otomatis pas halaman berhasil dibuka
window.addEventListener('DOMContentLoaded', () => {
  tampilkanWellnessDashboard();
});




// 1. STRUKTUR UTAMA SEGMEN FOCUS MODE (POMODORO LAVENDER) WITH OFFLINE NOTIF

let timerFokus;
let sisaDetikFokus = 0;
let sedangBerjalan = false;

// Fungsi untuk mulai menjalankan Focus Mode (Timer)
function mulaiFocusMode(menitDurasi) {
  if (sedangBerjalan) return; // Cegah double klik bikin timernya balapan
  
  sisaDetikFokus = menitDurasi * 60;
  sedangBerjalan = true;
  
  console.log(`Focus Mode aktif selama ${menitDurasi} menit, yaa! Pintu offline dikunci. 🪻`);
  
  // Jalankan satpam hitung mundur tiap 1 detik murni lokal
  timerFokus = setInterval(() => {
    if (sisaDetikFokus <= 0) {
      // KUNCI UTAMA: Waktu habis! Hentikan timer dan tembak Notif Lokal seketika
      clearInterval(timerFokus);
      sedangBerjalan = false;
      updateVisualTimer(0, 0);
      
      triggerNotifFocusOffline(); // BOOM! Tembak alarm fokus kelar!
    } else {
      sisaDetikFokus--;
      
      // Hitung sisa menit dan detik buat di-render ke layar HTML
      const m = Math.floor(sisaDetikFokus / 60);
      const s = sisaDetikFokus % 60;
      updateVisualTimer(m, s);
    }
  }, 1000); // Jalan tiap 1 detik murni offline
}

// Fungsi stop darurat kalau tiba-tiba lu mau udahan
function stopFocusMode() {
  clearInterval(timerFokus);
  sedangBerjalan = false;
  sisaDetikFokus = 0;
  updateVisualTimer(0, 0);
  console.log('Focus Mode dihentikan paksa, yaa.');
}

// Fungsi untuk update angka timer di layar HTML lu
function updateVisualTimer(menit, detik) {
  const elemenTimer = document.getElementById('displayTimerFokus'); // Sesuaikan ID elemen teks timer lu, yaa
  if (!elemenTimer) return;
  
  const formatMenit = String(menit).padStart(2, '0');
  const formatDetik = String(detik).padStart(2, '0');
  elemenTimer.innerText = `${formatMenit}:${formatDetik}`;
}


// =========================================================================
// 2. FUNGSI EKSEKUSI NOTIFIKASI LOCAL FOCUS MODE (ANTI-AIRPLANE MODE)
// =========================================================================
function triggerNotifFocusOffline() {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🪻 SESSION FOCUS SELESAI, yaa!', {
        body: 'Sesi belajar/ngoding lu udah kelar. Berdiri dulu, regangkan fisik, dan ambil minum air! Sukses besar!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', // Logo Lavender Andalan Lu ✅
        vibrate: [400, 200, 400, 200, 400], // Ritme getar santai tapi tegas biar rileks
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'focus-alert-done',
        requireInteraction: true // Biar notifnya nangkring terus sampe di-klik buat tanda beneran udahan
      });
    });
  } else {
    console.log("Izin notifikasi yaawser belum aktif, yaa!");
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js') // Menggunakan / agar absolut ke root server
    .then((registration) => {
      console.log('Service Worker berhasil didaftarkan:', registration.scope);
    })
    .catch((err) => {
      console.error('Service Worker gagal didaftarkan:', err);
    });
}

