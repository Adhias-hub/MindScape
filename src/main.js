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

let schedules = [];
let tasks = [];
let wellnessData = [];

let dataJadwal = [];
let dataTodo = [];
let dataWellness = [];

/* ================= FIND & UPDATE THIS BLOCK ================= */
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;
  const isHomePage = path.includes("home.html");
  const isSchedulePage = path.includes("jadwal.html");
  const isTodoPage = path.includes("todo.html");
  const isWellnessPage = path.includes("wellness.html");
  const isFocusPage = path.includes("focus.html");
  const isLoginPage = path.includes("index.html") || path === "/";

  if (user) {
    console.log("Satpam Auth: User aktif ->", user.email);

    // =========================================================================
    // STEP 1: AMBIL DATA SEKALI SAJA DI AWAL MENGGUNAKAN KUNCI LAVENDER PREMIUM
    // =========================================================================
    const jadwalLokal = JSON.parse(localStorage.getItem(`jadwalKuliah_${user.uid}`)) || [];
    const todoLokal = JSON.parse(localStorage.getItem(`todoTugas_${user.uid}`)) || [];
    const wellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${user.uid}`)) || [];

    // Isi sistem lama agar fungsi-fungsi lama tidak error/broken
    schedules = jadwalLokal;
    tasks = todoLokal;
    wellnessData = wellnessLokal;

    // Isi sistem Lavender Premium agar sinkron di dashboard dan halaman internal
    dataJadwal = jadwalLokal;
    dataTodo = todoLokal;
    dataWellness = wellnessLokal;

    // =========================================================================
    // STEP 2: ROUTING & RENDER VISUAL HALAMAN (KUNCI SUDAH AMAN DAN SERAGAM)
    // =========================================================================
    
    // 1. ROUTING HALAMAN JADWAL INTERNAL
    if (isSchedulePage) {
      if (typeof displaySchedules === "function") displaySchedules();
      if (typeof tampilkanJadwalDashboard === "function") tampilkanJadwalDashboard(); // Jaga-jaga jika fungsi Lavender dipakai di halaman ini
    }
    
    // 2. ROUTING HALAMAN TO-DO LIST INTERNAL
    if (isTodoPage) {
      if (typeof displayTasks === "function") displayTasks();
      if (typeof displayTodoHistory === "function") displayTodoHistory();
      if (typeof displayGagalHistory === "function") displayGagalHistory();
      if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard(); // Jaga-jaga jika fungsi Lavender dipakai di halaman ini
    }
    
    // 3. ROUTING HALAMAN WELLNESS INTERNAL
    if (isWellnessPage) {
      if (typeof displayWellness === "function") displayWellness();
      if (typeof displayWellnessHistory === "function") displayWellnessHistory();
      if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard(); // Jaga-jaga jika fungsi Lavender dipakai di halaman ini
    }
    
    // 4. ROUTING HALAMAN FOCUS MODE
    if (isFocusPage) {
      if (typeof displayFocusHistory === "function") displayFocusHistory();
      if (typeof cekSesiTimerPasRefresh === "function") cekSesiTimerPasRefresh();
    }
    
    // 5. ROUTING HALAMAN DASHBOARD UTAMA (HOME)
    if (isHomePage || path.includes("dashboard")) {
      if (typeof tampilkanJadwalDashboard === "function") tampilkanJadwalDashboard();
      if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();
      if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard();
    }

    if (isLoginPage) window.location.href = "home.html";

  } else {
    // Tendang balik ke login jika coba mengakses halaman dalam tanpa akun
    if (isHomePage || isSchedulePage || isTodoPage || isWellnessPage || isFocusPage || path.includes("dashboard")) {
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

/* ================= FIND AND UPDATE THIS LOGOUT FUNCTION ================= */
function logout() {
  signOut(auth).then(() => {
    // Bersihkan seluruh sisa array di RAM browser agar tidak bocor antar akun
    schedules = [];
    tasks = [];
    wellnessData = [];
    
    dataJadwal = [];
    dataTodo = [];
    dataWellness = [];
    
    alert("Logout berhasil!");
    window.location.href = "index.html";
  }).catch((err) => {
    console.error("Gagal logout:", err);
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
schedules = [];

const dayOrder = {
  "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6, "Minggu": 7
};

// FUNGSI: Memastikan array schedules selalu terurut rapi di memori
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
  
  if (!auth.currentUser) return;

  // Ambil data paling fresh dari localStorage sesuai UID user aktif
  schedules = JSON.parse(localStorage.getItem(`schedules_${auth.currentUser.uid}`)) || [];
  urutkanJadwalSesuaiHari(); // Urutkan dulu secara internal sebelum digambar ke HTML

  if (schedules.length === 0) {
    scheduleList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Belum ada jadwal kuliah.</td></tr>`;
    return;
  }

  schedules.forEach((schedule, index) => {
    scheduleList.innerHTML += `
      <tr>
        <th scope="row"><strong>${schedule.day}</strong></th>
        <td>${schedule.course}</td>
        <td>${schedule.start} - ${schedule.end}</td>
        <td>${schedule.note || "-"}</td>
        <td>
          <button onclick="deleteSchedule(${index})" class="btn-delete" aria-label="Hapus jadwal mata kuliah ${schedule.course}">
            Hapus
          </button>
        </td>
      </tr>`;
  });
}

function addSchedule() {
  let course = document.getElementById("courseInput").value.trim();
  let day = document.getElementById("dayInput").value; 
  let start = document.getElementById("startTime").value;
  let end = document.getElementById("endTime").value;
  let note = document.getElementById("noteInput").value.trim();

  if (course === "" || day === "" || start === "" || end === "") {
    alert("Isi semua data jadwal!");
    return;
  }

  if (!auth.currentUser) return;

  // SINKRONISASI KRITIS: Tarik data fresh dari UID aktif dulu sebelum di-push agar tidak menimpa data user lain
  schedules = JSON.parse(localStorage.getItem(`schedules_${auth.currentUser.uid}`)) || [];
  
  schedules.push({ course, day, start, end, note });
  
  // Urutkan array-nya dulu, baru simpan ke localStorage secara permanen berdasarkan UID
  urutkanJadwalSesuaiHari();
  localStorage.setItem(`schedules_${auth.currentUser.uid}`, JSON.stringify(schedules));
  
  displaySchedules();

  // Reset Input Form
  document.getElementById("courseInput").value = "";
  document.getElementById("dayInput").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("noteInput").value = "";
}

function deleteSchedule(index) {
  if (!auth.currentUser) return;

  // SINKRONISASI KRITIS: Pastikan array di memori sinkron dengan data asli di localstorage sebelum di-splice
  schedules = JSON.parse(localStorage.getItem(`schedules_${auth.currentUser.uid}`)) || [];
  urutkanJadwalSesuaiHari();

  // Sekarang index dari HTML dan urutan array lokal dijamin 100% sinkron dan aman!
  schedules.splice(index, 1);
  localStorage.setItem(`schedules_${auth.currentUser.uid}`, JSON.stringify(schedules));
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
    if (!auth.currentUser) return; // Proteksi jika belum login

    const sekarang = new Date();
    const hariIniAngka = sekarang.getDay();
    const tanggalKunciStr = sekarang.toDateString(); 
    const jamSekarangMenit = (sekarang.getHours() * 60) + sekarang.getMinutes();
    
    // Ambil data terjaga murni berdasarkan UID user aktif
    const jadwalAktif = JSON.parse(localStorage.getItem(`schedules_${auth.currentUser.uid}`)) || [];

    jadwalAktif.forEach((jadwal) => {
      if (kamusHari[jadwal.day] === hariIniAngka) {
        const [jamMulai, menitMulai] = jadwal.start.split(":").map(Number);
        const menitKuliahMulai = (jamMulai * 60) + menitMulai;
        const selisihMenitJadwal = menitKuliahMulai - jamSekarangMenit;
        const idKunciNotif = `${tanggalKunciStr}_${jadwal.course}_${jadwal.start}`;

        // PERBAIKAN LOGIKA: Menggunakan rentang toleransi agar notifikasi tidak terlewat jika interval 30 detik bergeser
        if (selisihMenitJadwal <= 20 && selisihMenitJadwal > 18) {
          if (!gembokJadwalH20[idKunciNotif]) {
            gembokJadwalH20[idKunciNotif] = true;
            if (Notification.permission === "granted") {
              const keyNotifJadwal = `notif_jadwal_${auth.currentUser.uid}_${jadwal.course}_20`;
              if (!sessionStorage.getItem(keyNotifJadwal)) {
                new Notification(`⏰ H-20 JADWAL: ${jadwal.course}`, {
                  body: `Ayo, ${jadwal.course} bakal mulai dalam sekitar 20 menit lagi! Jangan telat, yaa!`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                  requireInteraction: true 
                });
                sessionStorage.setItem(keyNotifJadwal, "sent");
              }
            }
          }
        }
        else if (selisihMenitJadwal <= 5 && selisihMenitJadwal > 0) {
          if (!gembokJadwalH5[idKunciNotif]) {
            gembokJadwalH5[idKunciNotif] = true;
            if (Notification.permission === "granted") {
              const keyNotifJadwal = `notif_jadwal_${auth.currentUser.uid}_${jadwal.course}_5`;
              if (!sessionStorage.getItem(keyNotifJadwal)) {
                new Notification(`🚨 H-5 JADWAL: ${jadwal.course}`, {
                  body: `Gass masuk! Kurang dari 5 menit lagi kelas ${jadwal.course} dimulai! Jangan nyasar!`,
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
  }, 30000); // Interval 30 detik aman karena logika pencocokan menggunakan rentang waktu (bukan '===')
}

/* ================= EXPOSE TO GLOBAL ================= */
window.addSchedule = addSchedule;
window.deleteSchedule = deleteSchedule;


/* ================= MANAGEMENT DATA (TODO TASKS) ================= */

// 1. INISIALISASI VARIABEL GLOBAL (Murni Array Kosong, Tidak Mencampur Key Polosan)
tasks = [];

function formatTampilanTanggal(dateString) {
  if (!dateString) return "-";
  const [tanggal, jam] = dateString.split("T");
  const [tahun, bulan, hari] = tanggal.split("-");
  return `${hari}-${bulan}-${tahun} Pukul ${jam}`;
}

function displayTasks() {  
  let taskList = document.getElementById("taskList"); 
  if (!taskList) return;
  taskList.innerHTML = "";

  if (!auth.currentUser) return;

  tasks = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];

  const sekarang = new Date().getTime();

  if (tasks.length === 0) {
    taskList.innerHTML = `<p style="color: #94a3b8; font-style: italic;">Tenang, belum ada tugas yang numpuk. 🔥</p>`;
    return;
  }

  tasks.forEach((item) => {
    const waktuDeadline = new Date(item.deadline).getTime();
    if (!item.completed && waktuDeadline >= sekarang) {
      taskList.innerHTML += `
        <div class="task-card" id="${item.id}" style="padding: 16px; margin-bottom: 12px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="margin: 0; font-size: 18px; color: #1e293b;">🌸 ${item.name}</h3>
          <p style="margin: 6px 0; font-size: 14px; color: #64748b;"><strong>Deadline:</strong> ${formatTampilanTanggal(item.deadline)} WIB</p>
          
          <div class="task-buttons" style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="done-btn" onclick="completeTask('${item.id}')" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">Selesai</button>
            <button class="delete-btn" onclick="deleteTask('${item.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">Hapus</button>
          </div>
        </div>
      `;
    }
  });
}

function addTask() {
  let taskInput = document.getElementById("taskInput");
  let dateInput = document.getElementById("deadlineDate");
  let timeInput = document.getElementById("deadlineTime");

  if (!taskInput || !dateInput || !timeInput) return;

  let taskName = taskInput.value.trim();
  let dateVal = dateInput.value; 
  let timeVal = timeInput.value; 

  if (taskName === "" || dateVal === "" || timeVal === "") {
    alert("Isi nama tugas, tanggal, beserta jam deadlinenya!");
    return;
  }

  if (!auth.currentUser) return;

  // Ambil data lama langsung pakai standar auth.currentUser.uid
  tasks = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];

  // Gabungkan tanggal dan jam menjadi format ISO standar untuk mempermudah manipulasi Date
  const fullDeadlineString = `${dateVal}T${timeVal}`;

  // Masukkan objek dengan struktur properti yang seragam (name dan deadline)
  tasks.push({
    id: 'todo_' + Date.now(),
    name: taskName,
    deadline: fullDeadlineString,
    completed: false        
  });

  // Simpan ke localStorage berdasarkan UID aktif
  localStorage.setItem(`tasks_${auth.currentUser.uid}`, JSON.stringify(tasks));
  
  // Refresh tampilan halaman dan dashboard sekaligus
  displayTasks();
  if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();

  // Reset Input Form secara aman
  taskInput.value = "";
  dateInput.value = "";
  timeInput.value = "";
}

// Terbuka penuh ke window scope agar terbebas dari belenggu modul isolasi JavaScript
window.completeTask = function(taskId) {
  if (!auth.currentUser) return;

  tasks = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];
  const targetIndex = tasks.findIndex(task => task.id === taskId);
  
  if (targetIndex !== -1) {
    tasks[targetIndex].completed = true;
    localStorage.setItem(`tasks_${auth.currentUser.uid}`, JSON.stringify(tasks));
    
    displayTasks();
    if (typeof displayTodoHistory === "function") displayTodoHistory();
    if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();
  }
}

// Terbuka penuh ke window scope agar terbebas dari belenggu modul isolasi JavaScript
window.deleteTask = function(taskId) {
  if (!auth.currentUser) return;

  tasks = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];
  const targetIndex = tasks.findIndex(task => task.id === taskId);
  
  if (targetIndex !== -1) {
    tasks.splice(targetIndex, 1);
    localStorage.setItem(`tasks_${auth.currentUser.uid}`, JSON.stringify(tasks));
    
    displayTasks();
    if (typeof displayTodoHistory === "function") displayTodoHistory();
    if (typeof displayGagalHistory === "function") displayGagalHistory(); 
    if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();
  }
}

// --- HISTORI 1: TUGAS SELESAI ---
window.displayTodoHistory = function() {
  const historyList = document.getElementById("todoHistoryList");
  if (!historyList) return;
  historyList.innerHTML = "";

  if (!auth.currentUser) return;

  const tasksLokal = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];
  const tugasSelesai = tasksLokal.filter(task => task.completed);

  if (tugasSelesai.length === 0) {
    historyList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Belum ada riwayat tugas selesai.</p>`;
    return;
  }

  tasksLokal.forEach((task) => {
    if (task.completed) {
      historyList.innerHTML += `
        <div class="history-item-box" style="background: #f8fafc; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #10b981; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 700; color: #1e293b; text-decoration: line-through;">${task.name}</span>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">✅ Selesai dikerjakan</p>
          </div>
          <button onclick="deleteTask('${task.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">Hapus Jejak</button>
        </div>`;
    }
  });
}

// --- HISTORI 2: TUGAS GAGAL/OVERDUE ---
window.displayGagalHistory = function() {
  const gagalList = document.getElementById("todoGagalList");
  if (!gagalList) return;
  gagalList.innerHTML = "";

  if (!auth.currentUser) return;

  const tasksLokal = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];
  const sekarang = new Date().getTime();

  const tugasGagal = tasksLokal.filter(task => !task.completed && new Date(task.deadline).getTime() < sekarang);

  if (tugasGagal.length === 0) {
    gagalList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Bersih! Tidak ada tugas yang telat. Mantap! 🔥</p>`;
    return;
  }

  tasksLokal.forEach((task) => {
    const waktuDeadline = new Date(task.deadline).getTime() || Infinity;
    if (!task.completed && waktuDeadline < sekarang) {
      gagalList.innerHTML += `
        <div class="history-item-box" style="background: #fff5f5; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #ef4444; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 700; color: #991b1b;">❌ ${task.name}</span>
            <p style="font-size: 12px; color: #b91c1c; margin-top: 4px;">Terlewat: ${formatTampilanTanggal(task.deadline)}</p>
          </div>
          <button onclick="deleteTask('${task.id}')" style="background: #7f1d1d; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">Ihlaskan & Hapus</button>
        </div>`;
    }
  });
}

function jalankanAlarmTodoOtomatis() {
  setInterval(() => {
    if (!auth.currentUser) return;
    const sekarang = new Date();
    const tanggalKunciStr = sekarang.toDateString(); // PERBAIKAN TYPO: Kata 'Bird =' pengacau sudah dibuang total ✨
    const timestampSekarang = sekarang.getTime();
    
    const tugasAktif = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];
    periksaDeadlineOtomatis();

    tugasAktif.forEach((task) => {
      if (!task.completed && task.deadline) {
        const waktuDeadline = new Date(task.deadline);
        const selisihMilidetik = waktuDeadline.getTime() - timestampSekarang;
        
        const selisihMenitTodo = Math.round(selisihMilidetik / (1000 * 60));
        const idKunciTodo = `${tanggalKunciStr}_${task.id}`;

        if (selisihMenitTodo === 5) {
          if (!gembokTodoH5[idKunciTodo]) {
            gembokTodoH5[idKunciTodo] = true; 

            if (Notification.permission === "granted") {
              const keyNotifTodo = `notif_todo_${task.id}_5`;
              
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
  }, 20000); 
}

function periksaDeadlineOtomatis() {
  if (!auth.currentUser) return;
  const sekarang = new Date().getTime();
  let tasksLokal = JSON.parse(localStorage.getItem(`tasks_${auth.currentUser.uid}`)) || [];
  let adaPerubahan = false;

  tasksLokal.forEach((task) => {
    if (!task.completed) {
      const waktuDeadline = new Date(task.deadline).getTime();

      if (waktuDeadline <= sekarang) {
        if (!sessionStorage.getItem(`gagal_alert_${task.id}`)) {
          triggerNotifTugasGagal(task.name);
          sessionStorage.setItem(`gagal_alert_${task.id}`, "sent");
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

function triggerNotifTugasGagal(judulTugas) {
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
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
    } else {
      new Notification('🚨 DEADLINE LEWAT, YAA!', {
        body: `Tugas "${judulTugas}" udah melewati batas waktu pengumpulan. Tetap semangat, yuk gaspol tugas lainnya!`,
        requireInteraction: true
      });
    }
  }
}

/* ================= EXPOSE TO GLOBAL ================= */
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;





/* ================= MANAGEMENT DATA (WELLNESS) ================= */
// Hapus inisialisasi global tanpa UID di atas agar tidak memicu kebocoran data

window.displayWellness = function() {
  const wellnessList = document.getElementById("wellnessList");
  if (!wellnessList) return;
  wellnessList.innerHTML = "";

  if (!auth.currentUser) return;

  // Ambil data dari kamar log yang benar
  let dataWellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${auth.currentUser.uid}`)) || [];

  // Urutkan berdasarkan waktu
  dataWellnessLokal.sort((a, b) => a.time.localeCompare(b.time));

  dataWellnessLokal.forEach((item) => {
    if (!item.completed) {
      wellnessList.innerHTML += `
        <div class="wellness-card">
          <h3>💧 ${item.type}</h3>
          <p>⏰ Waktu: <strong>${item.time} WIB</strong></p>
          <p>🌸 Catatan: ${item.note || "-"}</p>
          <div class="wellness-buttons" style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="done-btn" onclick="completeWellness('${item.id}')">Selesai</button>
            <button class="delete-btn" onclick="deleteWellness('${item.id}')">Hapus</button>
          </div>
        </div>`;
    }
  });
}

window.addWellness = function() {
  if (!auth.currentUser) {
    alert("Lu harus login dulu, yaa!");
    return;
  }

  const uidAman = auth.currentUser.uid;
  const type = document.getElementById("wellnessType")?.value;
  const time = document.getElementById("wellnessTime")?.value;
  const note = document.getElementById("wellnessNote")?.value || "";

  if (!type || !time) {
    alert("Aktivitas dan Jam wajib diisi!");
    return;
  }

  let dataWellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];

  dataWellnessLokal.push({
    id: Date.now(),
    type: type,
    time: time,
    note: note,
    completed: false
  });

  localStorage.setItem(`wellnessLogs_${uidAman}`, JSON.stringify(dataWellnessLokal));
  
  // Reset Form
  if(document.getElementById("wellnessType")) document.getElementById("wellnessType").value = "";
  if(document.getElementById("wellnessTime")) document.getElementById("wellnessTime").value = "";
  if(document.getElementById("wellnessNote")) document.getElementById("wellnessNote").value = "";

  displayWellness();
  if (typeof displayWellnessHistory === "function") displayWellnessHistory();
}

window.completeWellness = function(id) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;
  let dataWellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];

  // PERBAIKAN: Gunakan '==' agar tipe data Number/String dari HTML tetap bisa dicocokkan secara fleksibel
  const index = dataWellnessLokal.findIndex(item => item.id == id);
  if (index !== -1) {
    dataWellnessLokal[index].completed = true;
    localStorage.setItem(`wellnessLogs_${uidAman}`, JSON.stringify(dataWellnessLokal));
    displayWellness();
    if (typeof displayWellnessHistory === "function") displayWellnessHistory();
  }
}

window.deleteWellness = function(id) {
  if (!auth.currentUser) return;
  const uidAman = auth.currentUser.uid;
  let dataWellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];

  // PERBAIKAN: Gunakan '==' untuk mengantisipasi ketidakcocokan tipe data primitive (string vs number)
  const index = dataWellnessLokal.findIndex(item => item.id == id);
  if (index !== -1) {
    dataWellnessLokal.splice(index, 1);
    localStorage.setItem(`wellnessLogs_${uidAman}`, JSON.stringify(dataWellnessLokal));
    displayWellness();
    if (typeof displayWellnessHistory === "function") displayWellnessHistory();
  }
}

function jalankanSatpamWellnessOtomatis() {
  // PERBAIKAN OPTIMASI: Interval diset ke 60000ms (1 menit sekali) agar pas dengan rotasi perubahan jamMenitSekarangStr 
  // Langkah ini sekaligus mencegah double trigger notifikasi berondong di menit yang sama
  setInterval(() => {
    if (!auth.currentUser) return; 

    const sekarang = new Date();
    const jamMenitSekarangStr = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;
    
    const pengingatWellness = JSON.parse(localStorage.getItem(`wellnessLogs_${auth.currentUser.uid}`)) || [];

    pengingatWellness.forEach((item) => {
      if (!item.completed && item.time === jamMenitSekarangStr) {
        if (Notification.permission === "granted") {
          const keyNotifWellness = `notif_well_${auth.currentUser.uid}_${item.id}_${item.time}`;
          
          if (!sessionStorage.getItem(keyNotifWellness)) {
            new Notification(`💧 TIME FOR WELLNESS`, {
              body: `Waktunya aktivitas: "${item.type}"`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3011/3011285.png',
              requireInteraction: true 
            });
            sessionStorage.setItem(keyNotifWellness, "sent");
          }
        }
      }
    });
  }, 60000); 
}

/**
 * C. WELLNESS HISTORY HANDLER
 */
window.displayWellnessHistory = function() {
  const historyList = document.getElementById("wellnessHistoryList");
  if (!historyList) return;
  historyList.innerHTML = "";
  if (!auth.currentUser) return;

  const uidAman = auth.currentUser.uid;
  const wellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];
  const wellnessSelesai = wellnessLokal.filter(item => item.completed);

  if (wellnessSelesai.length === 0) {
    historyList.innerHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 14px;">Belum ada aktivitas kesehatan yang tercatat hari ini.</p>`;
    return;
  }

  wellnessLokal.forEach((item) => {
    if (item.completed) {
      historyList.innerHTML += `
        <div class="history-item-box" style="background: #faf5ff; padding: 14px 18px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #8b5cf6; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 700; color: #1e293b;">${item.type} (${item.time})</span>
            <p style="font-size: 12px; color: #7c3aed; margin-top: 4px;">💙 Sudah terpenuhi hari ini</p>
          </div>
          <button onclick="deleteWellness('${item.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">
            Hapus Jejak
          </button>
        </div>`;
    }
  });
}

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

  // 3. SIMPAN PAKET DATA TIMER KE LOCALSTORAGE (SUDAH DIGEMBOK PAKE UID USER 🔥)
  const dataTimer = {
    endTime: waktuSelesai,
    initialDuration: focusValue,
    target: targetInput ? targetInput.value : "",
    note: noteInput ? noteInput.value : ""
  };
  
  localStorage.setItem(`activeFocusTimer_${auth.currentUser.uid}`, JSON.stringify(dataTimer));

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

  const startBtn = document.getElementById("btnMulaiFocus");
  if (startBtn) {
    startBtn.innerText = "Selesai";
    startBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    startBtn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
    startBtn.disabled = false; // PASTIKAN FALSE BIAR BISA DIKLIK USER
  }

  clearInterval(focusInterval);
  
  focusInterval = setInterval(() => {
    if (!auth.currentUser) return;
    const sekarang = new Date().getTime();
    const selisihMilidetik = endTime - sekarang;
    let sisaDetikTotal = Math.ceil(selisihMilidetik / 1000);
    
    // KONDISI 1: JIKA WAKTU HABIS ALAMI (00:00)
    if (sisaDetikTotal <= 0) {
      clearInterval(focusInterval);
      localStorage.removeItem(`activeFocusTimer_${auth.currentUser.uid}`);

      let timerDisplay = document.getElementById("timerDisplay");
      if (timerDisplay) timerDisplay.innerText = "00:00";

      bukaGembokFormInputDanKembalikanTombol();

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
  
  if (!auth.currentUser) return;

  // PERBAIKAN: Ambil data menggunakan UID user aktif agar target dan durasi aslinya terbaca
  const simpananTimer = localStorage.getItem(`activeFocusTimer_${auth.currentUser.uid}`);
  if (simpananTimer) {
    const dataTimer = JSON.parse(simpananTimer);
    catatHistoryFocusKeLokal(dataTimer.target, dataTimer.initialDuration);
  }

  localStorage.removeItem(`activeFocusTimer_${auth.currentUser.uid}`);
  
  let timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) timerDisplay.innerText = "00:00";

  bukaGembokFormInputDanKembalikanTombol();
  alert("Sesi fokus telah diselesaikan secara manual dan dicatat ke jurnal! 🌸");
}

function resetFocusTimer() {
  if (!auth.currentUser) return;
  clearInterval(focusInterval);
  localStorage.removeItem(`activeFocusTimer_${auth.currentUser.uid}`);
  
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
    startBtn.style.background = "#4b5cff"; 
    startBtn.style.boxShadow = "0 4px 12px rgba(75, 92, 255, 0.18)";
    startBtn.disabled = false;
  }
}

function catatHistoryFocusKeLokal(targetText, durasiMenit) {
  if (!auth.currentUser) return;
  let focusHistory = JSON.parse(localStorage.getItem(`focusHistoryData_${auth.currentUser.uid}`)) || [];
  
  focusHistory.push({
    target: targetText || "Fokus Belajar",
    duration: durasiMenit || 25,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  });
  
  localStorage.setItem(`focusHistoryData_${auth.currentUser.uid}`, JSON.stringify(focusHistory));
  displayFocusHistory();
}


function deleteFocusHistory(index) {
  if (!auth.currentUser) return;

  // PERBAIKAN: Ambil dan simpan kembali ke key ber-UID agar sinkron dengan fungsi penampil riwayat
  let focusHistory = JSON.parse(localStorage.getItem(`focusHistoryData_${auth.currentUser.uid}`)) || [];
  focusHistory.splice(index, 1);
  localStorage.setItem(`focusHistoryData_${auth.currentUser.uid}`, JSON.stringify(focusHistory));
  displayFocusHistory();
}

function cekSesiTimerPasRefresh() {
  if (!auth.currentUser) return;

  // PERBAIKAN: Membaca sesi aktif menggunakan UID user yang login agar tidak bernilai null saat reload
  const simpananTimer = localStorage.getItem(`activeFocusTimer_${auth.currentUser.uid}`);
  if (simpananTimer) {
    const dataTimer = JSON.parse(simpananTimer);
    const sekarang = new Date().getTime();

    if (dataTimer.endTime > sekarang) {
      jalankanHitungMundur(dataTimer.endTime, dataTimer.target, dataTimer.note, dataTimer.initialDuration);
    } else {
      localStorage.removeItem(`activeFocusTimer_${auth.currentUser.uid}`);
    }
  }
}

/**
 * D. FOCUS TIMER HISTORY HANDLER (Permanen Tracker dengan Tombol Hapus)
 */
window.displayFocusHistory = function() {
  const historyList = document.getElementById("focusHistoryList");
  if (!historyList || !auth.currentUser) return;
  historyList.innerHTML = "";

  let focusHistory = JSON.parse(localStorage.getItem(`focusHistoryData_${auth.currentUser.uid}`)) || [];

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
  alarmSound.play().catch(e => console.log("Audio play ditangguhkan oleh kebijakan autoplay browser"));
}

/* ================= INITIAL LOAD DATA ON STARTUP ================= */
// Panggil penayangan data otomatis saat file diload pertama kali
//tampilkanJadwalDashboard();
//tampilkanTodoDashboard();
//tampilkanWellnessDashboard();

/* ================= JALUR EKSPOR WINDOW GLOBAL ================= */
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

// Fungsi Fitur Baru Lavender (Sudah terdaftar aman ✅)
window.tambahJadwalKuliah = tambahJadwalKuliah;
window.tampilkanJadwalDashboard = tampilkanJadwalDashboard;
window.hapusJadwal = hapusJadwal;

window.tambahTodoTugas = tambahTodoTugas;
window.tampilkanTodoDashboard = tampilkanTodoDashboard;
window.hapusTodo = hapusTodo;

window.tambahWellnessLog = tambahWellnessLog;
window.tampilkanWellnessDashboard = tampilkanWellnessDashboard;
window.hapusWellness = hapusWellness;

window.mulaiFocusMode = mulaiFocusMode;
window.stopFocusMode = stopFocusMode;




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

// 4. Jika aplikasi kebetulan LAGI DIBUKA, tangkap notifnya lewat sini agar gak bentrok
onMessage(messaging, (payload) => {
  console.log('Notif masuk pas aplikasi kebuka:', payload);
  alert(`📢 ${payload.notification.title}\n\n${payload.notification.body}`);
});

function bersihkanWellnessGantiHariOtomatis() {
  // 1. TAMBAHKAN PAGAR PENGAMAN: Jika auth belum siap atau user null, langsung keluar dari fungsi
  if (!auth.currentUser) {
    console.log("Satpam Wellness: Firebase belum siap, pembersihan ditunda.");
    return; 
  }

  const tanggalHariIni = new Date().toDateString(); 
  const tanggalTerakhirSimpan = localStorage.getItem("lastWellnessDate");

  if (tanggalTerakhirSimpan !== tanggalHariIni) {
    // Sekarang baris ini 100% aman karena auth.currentUser dijamin tidak null
    localStorage.removeItem(`wellnessLogs_${auth.currentUser.uid}`);
    dataWellness = [];
    localStorage.setItem("lastWellnessDate", tanggalHariIni);
    console.log("Satpam Wellness: Hari baru terdeteksi, logs berhasil dibersihkan!");
  }
}


// Jalankan otomatis fungsi pembersih ganti hari dan render semua histori saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  bersihkanWellnessGantiHariOtomatis();
  displayTodoHistory();
  displayWellnessHistory();
  displayFocusHistory();
});

// Dan jangan lupa ekspos ke global jika tombol HTML mau ikutan manggil
window.aktifkanNotificationFCM = aktifkanNotificationFCM;

let deferredPrompt; // Variabel penampung pemicu instalasi

// Biarkan Chrome yang memutuskan kapan tombol ini layak muncul
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const tombolInstal = document.getElementById('btnInstalPWA');
  if (tombolInstal) {
    tombolInstal.style.display = 'inline-block'; 
    
    tombolInstal.addEventListener('click', () => {
      tombolInstal.style.display = 'none';
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User gokil, sukses instal MindSpace! 🌸');
        } else {
          console.log('User nolak instal.');
          tombolInstal.style.display = 'inline-block';
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



// 1. STRUKTUR UTAMA SEGMENT JADWAL KULIAH 

function tambahJadwalKuliah() {
  let course = document.getElementById("courseInput")?.value || "";
  let day = document.getElementById("dayInput")?.value || ""; 
  let start = document.getElementById("startTime")?.value || "";

  if (course === "" || day === "" || start === "") {
    alert("Isi semua data jadwal kuliah!");
    return;
  }

  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  const dataJadwal = JSON.parse(localStorage.getItem(`jadwalKuliah_${uidAman}`)) || [];
  
  const jadwalBaru = {
    id: 'jadwal_' + Date.now(),
    matkul: course,
    hari: day, 
    jam: start      
  };
  
  dataJadwal.push(jadwalBaru);
  localStorage.setItem(`jadwalKuliah_${uidAman}`, JSON.stringify(dataJadwal));
  
  console.log('Jadwal berhasil disimpen di memori lokal! 🪻');
  tampilkanJadwalDashboard(); 

  if (document.getElementById("courseInput")) document.getElementById("courseInput").value = "";
  if (document.getElementById("dayInput")) document.getElementById("dayInput").value = "";
  if (document.getElementById("startTime")) document.getElementById("startTime").value = "";
}


function tampilkanJadwalDashboard() {
  const containerJadwal = document.getElementById('containerListJadwal'); 
  if (!containerJadwal) return;
  
  dataJadwal = JSON.parse(localStorage.getItem(`jadwalKuliah_${auth.currentUser.uid}`)) || [];
  containerJadwal.innerHTML = ''; 
  
  if (dataJadwal.length === 0) {
    containerJadwal.innerHTML = '<p style="color: #666; text-align: center;">Belum ada jadwal kuliah yang diinput.</p>';
    return;
  }
  
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

function hapusJadwal(idJadwal) {
  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  if (!uidAman) return;

  const dataJadwalLokal = JSON.parse(localStorage.getItem(`jadwalKuliah_${uidAman}`)) || [];
  const hasilFilter = dataJadwalLokal.filter(j => j.id !== idJadwal);
  
  localStorage.setItem(`jadwalKuliah_${uidAman}`, JSON.stringify(hasilFilter));
  tampilkanJadwalDashboard();
}
window.hapusJadwal = hapusJadwal;


// =========================================================================
// 2. SISTEM SATPAM OTOMATIS: PENGAWAS JADWAL H-20 & H-5 (CEK TIAP MENIT)
// =========================================================================
let rentangWaktuTerakhir = ""; 

setInterval(() => {
  if (!auth.currentUser) return;
  const sekarang = new Date();
  
  const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hariIni = daftarHari[sekarang.getDay()]; 
  
  const totalMenitSekarang = (sekarang.getHours() * 60) + sekarang.getMinutes();
  
  const kunciMenit = `${sekarang.getHours()}:${sekarang.getMinutes()}`;
  if (rentangWaktuTerakhir === kunciMenit) return;

  const ambilDataJadwalLokal = JSON.parse(localStorage.getItem(`jadwalKuliah_${auth.currentUser.uid}`)) || [];

  ambilDataJadwalLokal.forEach(jadwal => {
    if (jadwal.hari === hariIni) {
      
      const [jamJadwal, menitJadwal] = jadwal.jam.split(':').map(Number);
      const totalMenitJadwal = (jamJadwal * 60) + menitJadwal;
      
      const selisihMenit = totalMenitJadwal - totalMenitSekarang;

      // PERBAIKAN LOGIKA: Dikembalikan murni ke target H-20 menit asli
      if (selisihMenit === 20) {
        rentangWaktuTerakhir = kunciMenit;
        triggerNotifJadwalOffline(jadwal.matkul, "20 menit lagi masuk, yaa! Siap-siap otw kelas.");
      }
      
      // PERBAIKAN LOGIKA: Dikembalikan murni ke target H-5 menit asli
      else if (selisihMenit === 5) {
        rentangWaktuTerakhir = kunciMenit;
        triggerNotifJadwalOffline(jadwal.matkul, "5 menit lagi kelas dimulai! Jangan nyasar, gass masuk.");
      }
    }
  });

}, 30000); 


function triggerNotifJadwalOffline(namaMatkul, pesanKustom) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(`🪻 PENGINGAT JADWAL: ${namaMatkul}`, {
        body: pesanKustom, 
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', 
        vibrate: [300, 100, 300], 
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'jadwal-alert-' + namaMatkul + '-' + (pesanKustom.includes('20') ? '20' : '5'),
        requireInteraction: true 
      });
    });
  }
}


// =========================================================================
// 1. STRUKTUR UTAMA SEGMENT TO-DO LIST (LAVENDER PREMIUM) WITH OFFLINE NOTIF
// =========================================================================

function tambahTodoTugas(namaTugas, tanggalDeadline, jamDeadline) {
  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  const dataTodo = JSON.parse(localStorage.getItem(`todoTugas_${uidAman}`)) || [];
  
  const tugasBaru = {
    id: 'todo_' + Date.now(),
    tugas: namaTugas,
    tanggal: tanggalDeadline, 
    jam: jamDeadline         
  };
  
  dataTodo.push(tugasBaru);
  localStorage.setItem(`todoTugas_${auth.currentUser.uid}`, JSON.stringify(dataTodo));

  console.log('Tugas baru sukses dikunci di memori lokal, yaa! 🪻');
  tampilkanTodoDashboard(); 
}

function tampilkanTodoDashboard() {
  const containerTodo = document.getElementById('containerListTodo'); 
  if (!containerTodo) return;
  
  dataTodo = JSON.parse(localStorage.getItem(`todoTugas_${auth.currentUser.uid}`)) || [];
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

function hapusTodo(idTodo) {
  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  if (!uidAman) return;
  
  const dataTodoLokal = JSON.parse(localStorage.getItem(`todoTugas_${uidAman}`)) || []; 
  const hasilFilterTodo = dataTodoLokal.filter(t => t.id !== idTodo); 
  
  localStorage.setItem(`todoTugas_${uidAman}`, JSON.stringify(hasilFilterTodo));
  tampilkanTodoDashboard();
}
window.hapusTodo = hapusTodo;


// =========================================================================
// 2. SATPAM TO-DO: PENGHITUNG SELISIH DEADLINE H-5 MENIT (OFFLINE TOTAL)
// =========================================================================
let gembokTodoTerakhir = ""; 

setInterval(() => {
  if (!auth.currentUser) return;
  const sekarang = new Date();
  const timestampSekarang = sekarang.getTime();
  
  const kunciMenitTodo = `${sekarang.getDate()}-${sekarang.getHours()}:${sekarang.getMinutes()}`;
  if (gembokTodoTerakhir === kunciMenitTodo) return;

  const dataTodo = JSON.parse(localStorage.getItem(`todoTugas_${auth.currentUser.uid}`)) || [];

  dataTodo.forEach(item => {
    const stringDeadline = `${item.tanggal}T${item.jam}:00`;
    const waktuDeadline = new Date(stringDeadline);
    
    if (!isNaN(waktuDeadline.getTime())) {
      const timestampDeadline = waktuDeadline.getTime();
      const selisihMenitTodo = Math.round((timestampDeadline - timestampSekarang) / 1000 / 60);

      // PERBAIKAN LOGIKA: Kembalikan murni ke target H-5 menit asli
      if (selisihMenitTodo === 5) {
        gembokTodoTerakhir = kunciMenitTodo; 
        triggerNotifTodoOffline(item.tugas); 
      }
    }
  });

}, 30000); 


function triggerNotifTodoOffline(namaTugas) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🚨 DEADLINE DEPAN MATA, yaa!', {
        body: `Tugas "${namaTugas}" kamu sisa 5 menit lagi! Ayoo buruan submit ke sistem!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', 
        vibrate: [500, 100, 500, 100, 500], 
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'todo-alert-' + namaTugas,
        requireInteraction: true 
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  tampilkanTodoDashboard();
});


// =========================================================================
// 1. STRUKTUR UTAMA SEGMENT WELLNESS LOG (LAVENDER PREMIUM) WITH OFFLINE NOTIF
// =========================================================================

function tambahWellnessLog(namaAktivitas, jamMenitTarget) {
  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  const dataWellness = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];
  
  const logBaru = {
    id: 'well_' + Date.now(),
    aktivitas: namaAktivitas, 
    jam: jamMenitTarget       
  };
  
  dataWellness.push(logBaru);
  localStorage.setItem(`wellnessLogs_${auth.currentUser.uid}`, JSON.stringify(dataWellness));

  console.log('Log kesehatan on-time berhasil dikunci di memori lokal, yaa! 🪻');
  tampilkanWellnessDashboard(); 
}

function tampilkanWellnessDashboard() {
  const containerWellness = document.getElementById('containerListWellness'); 
  if (!containerWellness) return;
  
  dataWellness = JSON.parse(localStorage.getItem(`wellnessLogs_${auth.currentUser.uid}`)) || [];
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

function hapusWellness(idWellness) {
  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  if (!uidAman) return;

  const dataWellnessLokal = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];
  const hasilFilterWellness = dataWellnessLokal.filter(w => w.id !== idWellness);
  
  localStorage.setItem(`wellnessLogs_${uidAman}`, JSON.stringify(hasilFilterWellness));
  tampilkanWellnessDashboard();
}
window.hapusWellness = hapusWellness;


// 2. SATPAM WELLNESS: PENGAWAS DETIK ON-TIME (CEK TIAP MENIT)
let gembokWellnessTerakhir = ""; 

setInterval(() => {
  if (!auth.currentUser) return;
  const sekarang = new Date();
  
  const jamSekarang = String(sekarang.getHours()).padStart(2, '0');
  const menitSekarang = String(sekarang.getMinutes()).padStart(2, '0');
  const waktuSekarang = `${jamSekarang}:${menitSekarang}`;

  if (gembokWellnessTerakhir === waktuSekarang) return;

  const uidAman = auth.currentUser ? auth.currentUser.uid : "";
  const dataWellness = JSON.parse(localStorage.getItem(`wellnessLogs_${uidAman}`)) || [];

  const logCocok = dataWellness.find(w => w.jam === waktuSekarang);

  if (logCocok) {
    gembokWellnessTerakhir = waktuSekarang; 
    triggerNotifWellnessOffline(logCocok.aktivitas); 
  }
}, 30000); 


function triggerNotifWellnessOffline(namaAktivitas) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🪻 WELLNESS CHECK-IN, yaa!', {
        body: `Waktunya on-time untuk: "${namaAktivitas}". Jaga kesehatan jiwa dan fisik lu, gass eksekusi!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', 
        vibrate: [200, 100, 200, 100, 400], 
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'wellness-alert-' + namaAktivitas,
        requireInteraction: true 
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  tampilkanWellnessDashboard();
});


// 1. STRUKTUR UTAMA SEGMEN FOCUS MODE (POMODORO LAVENDER) WITH OFFLINE NOTIF
let timerFokus;
let sisaDetikFokus = 0;
let sedangBerjalan = false;

function mulaiFocusMode(menitDurasi) {
  if (sedangBerjalan) return; 
  
  sisaDetikFokus = menitDurasi * 60;
  sedangBerjalan = true;
  
  console.log(`Focus Mode aktif selama ${menitDurasi} menit, yaa! Pintu offline dikunci. 🪻`);
  
  timerFokus = setInterval(() => {
    if (!auth.currentUser) return;
    if (sisaDetikFokus <= 0) {
      clearInterval(timerFokus);
      sedangBerjalan = false;
      updateVisualTimer(0, 0);
      
      triggerNotifFocusOffline(); 
    } else {
      sisaDetikFokus--;
      
      const m = Math.floor(sisaDetikFokus / 60);
      const s = sisaDetikFokus % 60;
      updateVisualTimer(m, s);
    }
  }, 1000); 
}

function stopFocusMode() {
  clearInterval(timerFokus);
  sedangBerjalan = false;
  sisaDetikFokus = 0;
  updateVisualTimer(0, 0);
  console.log('Focus Mode dihentikan paksa, yaa.');
}

function updateVisualTimer(menit, detik) {
  const elemenTimer = document.getElementById('displayTimerFokus'); 
  if (!elemenTimer) return;
  
  const formatMenit = String(menit).padStart(2, '0');
  const formatDetik = String(detik).padStart(2, '0');
  elemenTimer.innerText = `${formatMenit}:${formatDetik}`;
}


function triggerNotifFocusOffline() {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('🪻 SESSION FOCUS SELESAI, yaa!', {
        body: 'Sesi belajar/ngoding lu udah kelar. Berdiri dulu, regangkan fisik, dan ambil minum air! Sukses besar!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png', 
        vibrate: [400, 200, 400, 200, 400], 
        badge: 'https://cdn-icons-png.flaticon.com/512/3221/3221191.png',
        tag: 'focus-alert-done',
        requireInteraction: true 
      });
    });
  }
}

// PERBAIKAN: Registrasi Service Worker duplikat polosan di sini telah dihapus sepenuhnya 
// agar tidak bentrok dengan registrasi berparameter konfigurasi yang ada di bawah.


window.addEventListener("DOMContentLoaded", () => {
  // 1. MINTA IZIN NOTIFIKASI
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // 2. BERSIHKAN DATA EXPIRED SEBELUM DI-RENDER
  if (typeof bersihkanWellnessGantiHariOtomatis === "function") {
    bersihkanWellnessGantiHariOtomatis();
  }

  // 3. AKTIFKAN SEGERA ALARM & SATPAM BACKING-PROCESS
  if (typeof jalankanSatpamOtomatis === "function") jalankanSatpamOtomatis();
  if (typeof jalankanSatpamWellnessOtomatis === "function") jalankanSatpamWellnessOtomatis();
  if (typeof jalankanAlarmTodoOtomatis === "function") jalankanAlarmTodoOtomatis();
  if (typeof cekSesiTimerPasRefresh === "function") cekSesiTimerPasRefresh();
  if (typeof aktifkanNotificationFCM === "function") aktifkanNotificationFCM();

  // 4. DAFTARKAN SERVICE WORKER SECARA AMAN
  if ('serviceWorker' in navigator) {
  // 1. Buat string parameter URL dari env
  const configParams = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }).toString();

  // 2. Daftarkan file SW dengan parameter query URL
  navigator.serviceWorker.register(`/firebase-messaging-sw.js?${configParams}`)
    .then((reg) => {
      console.log('Service Worker berhasil didaftarkan dengan scope:', reg.scope);
      if (typeof aktifkanNotificationFCM === "function") {
        aktifkanNotificationFCM();
      }
    })
    .catch((err) => {
      console.error('Service Worker gagal didaftarkan:', err);
    });
}

  // 5. INITIAL RENDER DATA (Saat pertama kali web dibuka)
  const jalankanRenderAwalSemuaData = () => {
    if (!auth.currentUser) return;
    
    // PERBAIKAN SINKRONISASI: Menghubungkan ke fungsi baru bertema Lavender Premium
    if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();
    if (typeof tampilkanJadwalDashboard === "function") tampilkanJadwalDashboard();
    if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard();
    
    if (document.getElementById("todoHistoryList") && typeof displayTodoHistory === "function") displayTodoHistory();
    if (typeof displayGagalHistory === "function") displayGagalHistory();
    if (document.getElementById("wellnessHistoryList") && typeof displayWellnessHistory === "function") displayWellnessHistory();
    if (document.getElementById("focusHistoryList") && typeof displayFocusHistory === "function") displayFocusHistory();
  };

  setTimeout(jalankanRenderAwalSemuaData, 250);

  // 6. SOLUSI JITU PINDAH HALAMAN (ANTI-DATA-HILANG)
  document.querySelectorAll('nav a, .sidebar-menu a, [data-page], .menu-link, .nav-item').forEach(tombol => {
    tombol.addEventListener("click", () => {
      const targetPage = tombol.getAttribute("href")?.replace("#", "") || tombol.getAttribute("data-page");
      if (!targetPage) return;

      setTimeout(() => {
        if (!auth.currentUser) return;

        console.log(`Menuju halaman: ${targetPage}. Merender ulang data...`);
        
        // PERBAIKAN SINKRONISASI: Menghubungkan navigasi ke fungsi render visual Lavender Premium
        if (targetPage === "wellness") {
          if (typeof tampilkanWellnessDashboard === "function") tampilkanWellnessDashboard();
          if (typeof displayWellnessHistory === "function") displayWellnessHistory();
        } else if (targetPage === "scheduler" || targetPage === "dashboard") {
          if (typeof tampilkanJadwalDashboard === "function") tampilkanJadwalDashboard();
          if (typeof tampilkanTodoDashboard === "function") tampilkanTodoDashboard();
          if (typeof displayTodoHistory === "function") displayTodoHistory();
          if (typeof displayGagalHistory === "function") displayGagalHistory();
        } else if (targetPage === "focus") {
          if (typeof displayFocusHistory === "function") displayFocusHistory();
        }
      }, 70); 
    });
  });
});