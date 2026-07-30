import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings, ChevronRight, ChevronLeft, Plus, Minus, MapPin, Sun, Moon,
  Monitor, Compass, ArrowLeft, Timer, NotebookPen, BookOpen, Target,
  Activity, CheckSquare, Calendar, Bell, BellOff, Sparkles, Play, Pause,
  RotateCcw, Trash2, Smartphone, ChevronDown, GripVertical, Flame,
  Lightbulb, BarChart3, Table2, Clock, X, CheckCircle2, ArrowRight,
  Heart, FileText
} from "lucide-react";

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD8e_iDk6HefcebscK3vpI54ELK9uqx1ic",
  authDomain: "kreati-plan.firebaseapp.com",
  projectId: "kreati-plan",
  storageBucket: "kreati-plan.firebasestorage.app",
  messagingSenderId: "614967493490",
  appId: "1:614967493490:web:dca607c73429b11fead3eb",
  measurementId: "G-K7T9Z30X6K"
};

const appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId;

let app, auth, db;
if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init error", e);
  }
}

const CITY_DB = {
  jakarta: { label: "Jakarta", lat: -6.2088, lng: 106.8456, tz: 7 },
  bandung: { label: "Bandung", lat: -6.9175, lng: 107.6191, tz: 7 },
  surabaya: { label: "Surabaya", lat: -7.2575, lng: 112.7521, tz: 7 },
  yogyakarta: { label: "Yogyakarta", lat: -7.7956, lng: 110.3695, tz: 7 },
  semarang: { label: "Semarang", lat: -6.9932, lng: 110.4203, tz: 7 },
  wonosobo: { label: "Wonosobo", lat: -7.3612, lng: 109.9018, tz: 7 },
  malang: { label: "Malang", lat: -7.9666, lng: 112.6326, tz: 7 },
  medan: { label: "Medan", lat: 3.5952, lng: 98.6722, tz: 7 },
  palembang: { label: "Palembang", lat: -2.9761, lng: 104.7754, tz: 7 },
  pontianak: { label: "Pontianak", lat: -0.0263, lng: 109.3425, tz: 7 },
  "banda aceh": { label: "Banda Aceh", lat: 5.5483, lng: 95.3238, tz: 7 },
  denpasar: { label: "Denpasar", lat: -8.6705, lng: 115.2126, tz: 8 },
  makassar: { label: "Makassar", lat: -5.1477, lng: 119.4327, tz: 8 },
  balikpapan: { label: "Balikpapan", lat: -1.2379, lng: 116.8529, tz: 8 },
  banjarmasin: { label: "Banjarmasin", lat: -3.3194, lng: 114.5908, tz: 8 },
  manado: { label: "Manado", lat: 1.4748, lng: 124.8421, tz: 8 },
  jayapura: { label: "Jayapura", lat: -2.5337, lng: 140.7181, tz: 9 },
};

const METHODS = [
  { id: "kemenag", label: "Kemenag RI", fajr: 20, isha: 18 },
  { id: "ummalqura", label: "Umm al-Qura", fajr: 18.5, isha: null, ishaFixedMin: 90 },
  { id: "isna", label: "ISNA", fajr: 15, isha: 15 },
  { id: "mwl", label: "MWL", fajr: 18, isha: 17 },
  { id: "egyptian", label: "Egyptian", fajr: 19.5, isha: 17.5 },
  { id: "gulf", label: "Gulf Region", fajr: 19.5, isha: null, ishaFixedMin: 90 },
  { id: "karachi", label: "Karachi", fajr: 18, isha: 18 },
];

const HIJRI_MONTHS = ["Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal",
  "Jumadil Akhir", "Rajab", "Syaban", "Ramadhan", "Syawal", "Dzulqadah", "Dzulhijjah"];
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
  "Agustus", "September", "Oktober", "November", "Desember"];

const PRAYER_LABELS = ["Subuh", "Zuhur", "Ashar", "Maghrib", "Isya"];
const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const HADITH_LIST = [
  { ar: "اِحْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ", id: "Bersungguh-sungguhlah pada hal yang bermanfaat bagimu, mohon pertolongan kepada Allah, dan jangan merasa lemah.", src: "HR. Muslim" },
  { ar: "مَنْ صَمَتَ نَجَا", id: "Barang siapa menjaga lisannya, ia akan selamat dari banyak keburukan.", src: "HR. Tirmidzi" },
  { ar: "الدُّعَاءُ هُوَ الْعِبَادَةُ", id: "Doa adalah inti dari ibadah seorang hamba kepada Rabbnya.", src: "HR. Abu Dawud" },
  { ar: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", id: "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.", src: "HR. Ahmad" },
  { ar: "الطُّهُورُ شَطْرُ الْإِيمَانِ", id: "Menjaga kesucian diri adalah bagian penting dari keimanan.", src: "HR. Muslim" },
];

const DZIKIR_DATA = {
  pagi: {
    title: "Dzikir Pagi", subtitle: "Dibaca setelah Subuh hingga matahari tergelincir",
    items: [
      { ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", id: "Kami memasuki pagi, dan kerajaan hanya milik Allah." },
      { ar: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", id: "Mahasuci Allah, segala puji bagi-Nya. (dibaca 100x)" },
      { ar: "اللَّهُمَّ عَافِنِي فِي بَدَنِي", id: "Ya Allah, berikanlah kesehatan pada tubuhku." },
    ],
  },
  petang: {
    title: "Dzikir Petang", subtitle: "Dibaca setelah Ashar hingga pertengahan malam",
    items: [
      { ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", id: "Kami memasuki petang, dan kerajaan hanya milik Allah." },
      { ar: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ", id: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna." },
      { ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ", id: "Ya Allah, aku memohon keselamatan kepada-Mu." },
    ],
  },
  tidur: {
    title: "Sebelum Tidur", subtitle: "Penjaga tidur sunnah Nabi ﷺ sebelum berbaring",
    items: [
      { ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", id: "Dengan nama-Mu ya Allah, aku mati dan aku hidup." },
      { ar: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", id: "Ya Allah, jagalah aku dari azab-Mu di hari kebangkitan." },
    ],
  },
};

const HABIT_CATEGORY_LABEL = { ibadah: "Ibadah", kerja: "Kerja", selfdev: "Self Dev", nobad: "No Bad Habits", custom: "Custom" };

const HABIT_LIBRARY = {
  ibadah: [
    { section: "Sebelum Subuh", items: ["Tahajud", "Witir", "Sholat Taubat"] },
    { section: "Subuh", items: ["Qobliyah Subuh", "Subuh Berjamaah"] },
    { section: "Setelah Subuh", items: ["Dzikir Pagi", "Tilawah Pagi", "Syuruq", "Sodaqoh", "5 Ayat Hafalan", "Tidur Setelah Subuh"] },
    { section: "Dhuha", items: ["Dhuha", "Olahraga"] },
    { section: "Zuhur", items: ["Qobliyah Zuhur", "Zuhur Berjamaah", "Ba'diyah Zuhur", "Qoilulah/Tidur Siang"] },
    { section: "Ashar", items: ["Qobliyah Asar", "Asar Berjamaah", "Dzikir Petang"] },
    { section: "Maghrib", items: ["Qobliyah Maghrib", "Maghrib Berjamaah", "Ba'diyah Maghrib", "Tilawah Malam"] },
    { section: "Isya", items: ["Qobliyah Isya", "Isya Berjamaah", "Ba'diyah Isya", "Dzikir Tidur", "Jurnal", "Doa Tidur", "Tidur Sebelum 22:00"] },
    { section: "Lainnya", items: ["No PMO"] }
  ],
  kerja: [
    { section: "Pagi Kerja", items: ["Rencana Harian", "Deep Work 1 Jam"] },
    { section: "Siang", items: ["Cek Email Terjadwal", "Standup Tim"] },
    { section: "Sore", items: ["Review Harian", "Beres-beres Meja"] },
  ],
  selfdev: [
    { section: "Fisik", items: ["Olahraga 20 Menit", "Minum 2L Air"] },
    { section: "Mental", items: ["Baca 20 Menit", "Journaling", "Meditasi 10 Menit"] },
    { section: "Belajar", items: ["Belajar Bahasa", "Kursus Online"] },
  ],
  nobad: [
    { section: "Digital", items: ["Tanpa Medsos Berlebihan", "Tanpa Begadang"] },
    { section: "Konsumsi", items: ["Tanpa Junk Food", "Tanpa Rokok"] },
  ],
};

const SMART_GOALS = [
  "Khatam Al-Qur'an dalam 12 bulan (1 juz/bulan)",
  "Hafal 1 juz baru dalam 6 bulan",
  "Konsisten Tahajjud & Dhuha 90 hari berturut-turut",
  "Lari 5K di bawah 30 menit dalam 4 bulan",
  "Turun 5 kg dalam 6 bulan (sehat & terukur)",
  "Dana darurat 6× pengeluaran bulanan dalam 12 bulan",
  "Sedekah rutin tiap Jumat selama 6 bulan",
  "Kuasai 1 skill baru & launch 1 proyek dalam 90 hari",
  "Baca 12 buku tahun ini (1/bulan)",
  "Quality time keluarga ≥ 1 jam/hari selama 90 hari",
  "Umrah dalam 24 bulan (tabungan + manasik siap)",
  "Promosi / kenaikan jenjang dalam 12 bulan",
  "Kurangi sosmed ke ≤30 menit/hari selama 60 hari"
];

const DEFAULT_ACTIVITY_CATEGORIES = ["Personal", "Kesehatan", "Bisnis"];
const STATUS_OPTIONS = [
  { id: "todo_today", label: { ID: "To Do Today", EN: "To Do Today" } },
  { id: "on_process", label: { ID: "On Process", EN: "On Process" } },
  { id: "todo_later", label: { ID: "To Do Later", EN: "To Do Later" } },
  { id: "done", label: { ID: "Done", EN: "Done" } },
];
const STATUS_ORDER = { todo_today: 1, on_process: 2, todo_later: 3, done: 4 };

const getStatusColor = (status, isDark) => {
  const colors = {
    todo_today: isDark ? "bg-pink-900/40 text-pink-300 border-pink-800" : "bg-pink-100 text-pink-700 border-pink-200",
    on_process: isDark ? "bg-sky-900/40 text-sky-300 border-sky-800" : "bg-sky-100 text-sky-700 border-sky-200",
    todo_later: isDark ? "bg-yellow-900/40 text-yellow-300 border-yellow-800" : "bg-yellow-100 text-yellow-700 border-yellow-200",
    done: isDark ? "bg-green-900/40 text-green-300 border-green-800" : "bg-green-100 text-green-700 border-green-200",
  };
  return colors[status] || (isDark ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-white border-stone-200 text-stone-800");
};

const GRID_HOUR_START = 5;
const GRID_HOUR_END = 22;
const GRID_ROW_H = 60; 

function timeToHourFloat(t) {
  if (!t) return null;
  const parts = t.split(":").map(Number);
  const h = parts[0], m = parts[1] || 0;
  if (Number.isNaN(h)) return null;
  return h + m / 60;
}
function findFreeHourSlot(existingTimes) {
  const occupied = existingTimes.map((t) => Math.round(timeToHourFloat(t))).filter((h) => h !== null);
  for (let h = GRID_HOUR_START; h <= GRID_HOUR_END; h++) {
    if (!occupied.includes(h)) return `${String(h).padStart(2, "0")}:00`;
  }
  return `${String(GRID_HOUR_END).padStart(2, "0")}:00`;
}

const HABIT_TIPS = [
  "Sistem yang konsisten mengalahkan motivasi yang naik-turun. Target kecil yang rutin lebih kuat daripada target besar yang jarang dikerjakan.",
  "Tempelkan habit baru pada rutinitas yang sudah ada — mis. 'setelah Subuh, baca 1 halaman' — supaya lebih mudah menempel.",
  "Jangan putus rantai dua hari berturut-turut. Sekali lewat masih wajar, dua kali berturut biasanya jadi kebiasaan baru.",
  "Rayakan check-in kecil. Progres yang terasa nyata membuat otak ingin mengulanginya besok.",
  "Ubah identitas, bukan cuma target. Alih-alih 'ingin tahajud', coba 'saya orang yang bangun malam untuk sholat'.",
];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function currentStreak(habit, today) {
  let streak = 0;
  let d = new Date(today);
  while (habit.checkins && habit.checkins[dateKey(d)]) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

function longestStreak(habit) {
  if (!habit.checkins) return 0;
  const days = Object.keys(habit.checkins).filter((k) => habit.checkins[k])
    .map((k) => Math.floor(new Date(k + "T00:00:00").getTime() / 86400000))
    .sort((a, b) => a - b);
  if (days.length === 0) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) { cur++; } else { cur = 1; }
    if (cur > best) best = cur;
  }
  return best;
}

const T = {
  ID: {
    dashboard: "DASHBOARD", appTitle: "KreatiPlan", nextPrayer: "SHOLAT BERIKUTNYA",
    towards: "menuju", prayerTimes: "WAKTU SHOLAT", hadithToday: "HADITS HARI INI",
    schedule: "Schedule", noSchedule: "Belum ada Schedule. Klik untuk menambah →",
    jadwalTitle: "Jadwal & To-Do", jadwalEyebrow: "JADWAL", jadwalSub: "Semua acara & tugas dalam satu tempat.",
    noActivities: "Belum ada kegiatan. Klik slot di kalender atau tombol tambah.", openFullSchedule: "Buka Jadwal lengkap →",
    newActivityTitle: "Nama kegiatan / tugas", dragHint: "Tahan ikon ⠿ lalu seret item ke tanggal lain untuk memindahkannya.",
    dayEyebrow: "HARI INI", toDoToday: "To Do Hari Ini", doneCol: "Selesai",
    dragStatusHint: "Seret kartu ke kolom lain untuk mengubah status.", backToJadwal: "Kembali",
    goals: "Plans/Goals", noGoals: "Belum ada tujuan. Klik untuk membuat →",
    habits: "Habits", noHabits: "Belum ada habit →",
    habitHint: "Bingung mau mulai habit apa? Cek Habits Library.",
    todo: "To-Do List", active: "Aktif", done: "Selesai", allDone: "Semua selesai 🎉",
    addTask: "+ Tambah Tugas", journal: "Jurnal", journalHint: "Tulis jurnalmu: syukur, refleksi, atau apa pun yang ada di kepala. Biar AI yang rapikan.",
    noJournal: "Belum ada jurnal. Mulai tulis sekarang →", writeJournal: "Tulis jurnal hari ini",
    dzikirDaily: "Dzikir Harian", focusTimer: "Timer Fokus", start: "Mulai", pause: "Jeda", reset: "Ulang",
    lectureNotes: "Lecture Notes", lectureHint: "Catat kajian rapi tanpa repot. Ketik referensi, ayat & hadits muncul otomatis.",
    settings: "PENGATURAN", settingsTitle: "Pengaturan", active2: "Aktif", joined: "Bergabung",
    display: "Tampilan", displayHint: "Pilih bahasa dan tema antarmuka.", language: "BAHASA", theme: "TEMA",
    light: "Terang", dark: "Gelap", system: "Ikuti sistem",
    installApp: "Install Aplikasi", installHint: "Pasang KreatiPlan di iPhone, Android, atau desktop untuk akses cepat.",
    install: "Install Aplikasi",
    locationSync: "Sinkron Lokasi & Zona Waktu", locationHint: "Aktifkan agar waktu sholat presisi sesuai lokasimu.",
    syncedJust: "Sinkron terakhir: baru saja", manualPick: "ATAU PILIH KOTA MANUAL",
    cityPlaceholder: "Kota (mis. Bandung)", use: "Pakai",
    method: "Metode Perhitungan", methodHint: "Pilih sumber jadwal yang sesuai dengan lokasi/lembaga Anda.",
    methodLabel: "METODE", madhab: "MADZHAB (UNTUK ASHAR)", shafii: "Syafi'i / Standard", hanafi: "Hanafi",
    notif: "Notifikasi Sholat", notifHint: "Pengingat 5 menit sebelum waktu sholat.", status: "STATUS",
    turnOn: "Aktifkan", turnOff: "Matikan",
    manualAdjust: "Penyesuaian Manual", manualAdjustHint: "Sesuaikan waktu sholat (±30 menit) bila berbeda dengan jadwal lokal.",
    autoSaved: "Perubahan tersimpan otomatis. Satuan: menit (±30).",
    hijriAdjust: "Penyesuaian Tanggal Hijriah", hijriAdjustHint: "Geser ±1–3 hari bila tanggal Hijriah berbeda dengan rukyat lokal.",
    today: "HARI INI", back: "Kembali",
  }
};

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

function julianDay(date) {
  let Y = date.getUTCFullYear();
  let M = date.getUTCMonth() + 1;
  const D = date.getUTCDate();
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

function sunPosition(jd) {
  const n = jd - 2451545.0;
  let L = (280.46 + 0.9856474 * n) % 360; if (L < 0) L += 360;
  let g = (357.528 + 0.9856003 * n) % 360; if (g < 0) g += 360;
  const lambda = L + 1.915 * Math.sin(toRad(g)) + 0.02 * Math.sin(toRad(2 * g));
  const epsilon = 23.439 - 0.0000004 * n;
  const decl = toDeg(Math.asin(Math.sin(toRad(epsilon)) * Math.sin(toRad(lambda))));
  let alpha = toDeg(Math.atan2(Math.cos(toRad(epsilon)) * Math.sin(toRad(lambda)), Math.cos(toRad(lambda))));
  alpha = ((alpha % 360) + 360) % 360;
  let eqt = L - alpha;
  if (eqt > 180) eqt -= 360;
  if (eqt < -180) eqt += 360;
  eqt = eqt * 4;
  return { decl, eqt };
}

function hourAngleBelow(lat, decl, angle) {
  const cosH = (Math.sin(toRad(-angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(decl))) /
    (Math.cos(toRad(lat)) * Math.cos(toRad(decl)));
  return toDeg(Math.acos(Math.max(-1, Math.min(1, cosH))));
}

function asrAltitude(lat, decl, shadowFactor) {
  const Zm = Math.abs(lat - decl);
  return toDeg(Math.atan(1 / (shadowFactor + Math.tan(toRad(Zm)))));
}

function hourAngleAbove(lat, decl, altitude) {
  const cosH = (Math.sin(toRad(altitude)) - Math.sin(toRad(lat)) * Math.sin(toRad(decl))) /
    (Math.cos(toRad(lat)) * Math.cos(toRad(decl)));
  return toDeg(Math.acos(Math.max(-1, Math.min(1, cosH))));
}

function computeTimes(date, lat, lng, tz, methodId, madhab) {
  const method = METHODS.find((m) => m.id === methodId) || METHODS[0];
  const jd = julianDay(date);
  const { decl, eqt } = sunPosition(jd);
  const dhuhrUT = 12 - eqt / 60 - lng / 15;
  const fajrH = hourAngleBelow(lat, decl, method.fajr);
  const sunsetH = hourAngleBelow(lat, decl, 0.833);
  const shadowFactor = madhab === "hanafi" ? 2 : 1;
  const asrAlt = asrAltitude(lat, decl, shadowFactor);
  const asrH = hourAngleAbove(lat, decl, asrAlt);

  const fajrUT = dhuhrUT - fajrH / 15;
  const asrUT = dhuhrUT + asrH / 15;
  const maghribUT = dhuhrUT + sunsetH / 15;
  let ishaUT;
  if (method.isha == null) {
    ishaUT = maghribUT + (method.ishaFixedMin || 90) / 60;
  } else {
    const ishaH = hourAngleBelow(lat, decl, method.isha);
    ishaUT = dhuhrUT + ishaH / 15;
  }

  const toLocal = (ut) => {
    let t = ut + tz;
    t = ((t % 24) + 24) % 24;
    let h = Math.floor(t);
    let m = Math.round((t - h) * 60);
    if (m === 60) { m = 0; h += 1; }
    return { h: h % 24, m };
  };

  return { fajr: toLocal(fajrUT), dhuhr: toLocal(dhuhrUT), asr: toLocal(asrUT), maghrib: toLocal(maghribUT), isha: toLocal(ishaUT) };
}

function fmt(t) {
  if (!t) return "--:--";
  const h = String(t.h).padStart(2, "0");
  const m = String(t.m).padStart(2, "0");
  return `${h}:${m}`;
}

function applyAdjust(t, mins) {
  if (!t || !mins) return t;
  let total = t.h * 60 + t.m + mins;
  total = ((total % 1440) + 1440) % 1440;
  return { h: Math.floor(total / 60), m: total % 60 };
}

function gregorianToJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) -
    Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function islamicFromJDN(jdnIn) {
  let jdn = jdnIn - 1948440 + 10632;
  const n = Math.floor((jdn - 1) / 10631);
  jdn = jdn - 10631 * n + 354;
  const j = Math.floor((10985 - jdn) / 5316) * Math.floor((50 * jdn) / 17719) +
    Math.floor(jdn / 5670) * Math.floor((43 * jdn) / 15238);
  jdn = jdn - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const im = Math.floor((24 * jdn) / 709);
  const id = jdn - Math.floor((709 * im) / 24);
  const iy = 30 * n + j - 30;
  return { year: iy, month: im, day: id };
}

function toHijri(date, offsetDays = 0) {
  const shifted = new Date(date.getTime() + offsetDays * 86400000);
  const jdn = gregorianToJDN(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate());
  const h = islamicFromJDN(jdn);
  return h;
}

const ID_HOLIDAYS = {
  "2026-01-01": "Tahun Baru Masehi",
  "2026-02-14": "Isra Mi'raj",
  "2026-03-03": "Hari Raya Nyepi",
  "2026-03-20": "Jumat Agung / Idul Fitri",
  "2026-03-21": "Idul Fitri",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-14": "Kenaikan Isa Al Masih",
  "2026-05-27": "Idul Adha",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-06-16": "Tahun Baru Islam",
  "2026-08-17": "Hari Kemerdekaan RI",
  "2026-08-25": "Maulid Nabi Muhammad SAW",
  "2026-12-25": "Hari Raya Natal",
};

function getFastingEvents(date, hijriOffset) {
  const h = toHijri(date, hijriOffset);
  const dayOfWeek = date.getDay(); 
  let events = [];

  const isIdulFitri = h.month === 10 && h.day === 1;
  const isIdulAdha = h.month === 12 && h.day === 10;
  const isTasyriq = h.month === 12 && (h.day >= 11 && h.day <= 13);
  
  if (isIdulFitri || isIdulAdha || isTasyriq) {
    events.push({ type: 'haram', name: 'Haram Puasa' });
    return events;
  }

  if (h.month === 9) events.push({ type: 'wajib', name: 'Puasa Ramadhan' });
  if (h.month === 12 && h.day === 9) events.push({ type: 'sunnah', name: 'Puasa Arafah' });
  if (h.month === 1 && h.day === 9) events.push({ type: 'sunnah', name: 'Puasa Tasu\'a' });
  if (h.month === 1 && h.day === 10) events.push({ type: 'sunnah', name: 'Puasa Asyura' });
  if (h.month !== 9 && (h.day === 13 || h.day === 14 || h.day === 15)) events.push({ type: 'sunnah', name: 'Ayyamul Bidh' });
  if (h.month !== 9 && dayOfWeek === 1) events.push({ type: 'sunnah', name: 'Puasa Senin' });
  if (h.month !== 9 && dayOfWeek === 4) events.push({ type: 'sunnah', name: 'Puasa Kamis' });

  return events;
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, onClick, muted, isDark }) {
  return (
    <div
      className={`flex items-center justify-between px-5 pt-5 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className={`flex items-center gap-2 font-semibold text-[15px] ${isDark ? "text-stone-100" : "text-stone-900"}`}>
        {Icon && <Icon size={16} className="text-stone-500" />}
        {title}
      </div>
      {onClick && <ChevronRight size={16} className={muted ? "text-stone-300" : "text-stone-400"} />}
    </div>
  );
}

function Eyebrow({ children }) {
  return <div className="text-[11px] tracking-wider text-stone-400 font-medium">{children}</div>;
}

export default function KreatiPlanApp() {
  const [user, setUser] = useState(null);
  const isRemoteUpdate = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState([]);
  const [lang, setLang] = useState("ID");
  const [theme, setTheme] = useState("light");
  const [now, setNow] = useState(new Date());
  const [toastMessage, setToastMessage] = useState(null);

  const [locKey, setLocKey] = useState("wonosobo");
  const [cityInput, setCityInput] = useState("");
  const [syncNote, setSyncNote] = useState("baru saja");

  const [method, setMethod] = useState("kemenag");
  const [madhab, setMadhab] = useState("shafii");
  const [notifOn, setNotifOn] = useState(true);
  const [adjust, setAdjust] = useState({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
  const [hijriOffset, setHijriOffset] = useState(0);

  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState(null);
  const [activityDraft, setActivityDraft] = useState({ title: "", time: "", category: "Personal", status: "todo_today" });
  const [selectedDate, setSelectedDate] = useState(null);
  const [jadwalView, setJadwalView] = useState("hari");
  const [gridAnchorKey, setGridAnchorKey] = useState(null);
  
  const [showPrayerGrid, setShowPrayerGrid] = useState(true);
  const [showFastingGrid, setShowFastingGrid] = useState(true);
  const [showHolidayGrid, setShowHolidayGrid] = useState(true);

  const [monthPopupDateKey, setMonthPopupDateKey] = useState(null);

  const [activityCategories, setActivityCategories] = useState(DEFAULT_ACTIVITY_CATEGORIES);
  const [newCategoryDraft, setNewCategoryDraft] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [activitiesSeeded, setActivitiesSeeded] = useState(false);

  const actDragRef = useRef(null);
  const [actOverId, setActOverId] = useState(null);
  const clickTimerRef = useRef(null);

  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");

  const [habits, setHabits] = useState([]);
  const [habitDraft, setHabitDraft] = useState("");
  const [habitsTab, setHabitsTab] = useState("ibadah");
  const [habitsRange, setHabitsRange] = useState("pekan");
  const [habitsDisplay, setHabitsDisplay] = useState("tabel");
  const [tipIndex, setTipIndex] = useState(0);
  const [habitsSeeded, setHabitsSeeded] = useState(false);

  const habitDragRef = useRef(null);
  const [habitOverId, setHabitOverId] = useState(null);

  const [journalEntries, setJournalEntries] = useState([]);
  const [journalTab, setJournalTab] = useState("tulis");
  const [journalMode, setJournalMode] = useState("syukur");
  const [journalDraft, setJournalDraft] = useState("");
  const [polishing, setPolishing] = useState(false);

  const [dzikirOpen, setDzikirOpen] = useState(null);

  const [notesList, setNotesList] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");

  const [timerWork, setTimerWork] = useState(25);
  const [timerBreak, setTimerBreak] = useState(5);
  const [timerSecs, setTimerSecs] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPhase, setTimerPhase] = useState("work");
  const timerRef = useRef(null);

  const dragRef = useRef(null);
  const hoverZoneRef = useRef(null);
  const [dragVisual, setDragVisual] = useState(null);
  const [hoverZoneVisual, setHoverZoneVisual] = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editDraft, setEditDraft] = useState(null);

  // Navigasi & History
  const navigate = (toPage) => {
    if (toPage !== page) {
      setHistory(prev => [...prev, page]);
      setPage(toPage);
    }
  };

  const goBack = () => {
    setHistory(prev => {
      const newHistory = [...prev];
      const prevPage = newHistory.pop();
      if (prevPage) setPage(prevPage);
      else setPage("dashboard");
      return newHistory;
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Firebase Auth Initialization
  useEffect(() => {
    if (!auth) {
      setLoaded(true); // Fallback jika Firebase tidak tersedia
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth error", e);
        setLoaded(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Load Data
  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'main');
    
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        isRemoteUpdate.current = true;
        const s = docSnap.data();
        if (s.lang) setLang(s.lang);
        if (s.theme) setTheme(s.theme);
        if (s.locKey) setLocKey(s.locKey);
        if (s.method) setMethod(s.method);
        if (s.madhab) setMadhab(s.madhab);
        if (typeof s.notifOn === "boolean") setNotifOn(s.notifOn);
        if (s.adjust) setAdjust(s.adjust);
        if (typeof s.hijriOffset === "number") setHijriOffset(s.hijriOffset);
        if (s.activities) setActivities(s.activities);
        if (s.goals) setGoals(s.goals);
        if (s.habits) setHabits(s.habits);
        if (s.journalEntries) setJournalEntries(s.journalEntries);
        if (s.notesList) setNotesList(s.notesList);
        if (s.activityCategories) setActivityCategories(s.activityCategories);
        if (typeof s.activitiesSeeded === "boolean") setActivitiesSeeded(s.activitiesSeeded);
        if (typeof s.habitsSeeded === "boolean") setHabitsSeeded(s.habitsSeeded);
        
        // Clear the remote update flag shortly after render
        setTimeout(() => { isRemoteUpdate.current = false; }, 500);
      }
      setLoaded(true);
    }, (err) => {
      console.error("Sync error", err);
      setLoaded(true);
    });

    return () => unsub();
  }, [user]);

  // Firebase Save Data
  useEffect(() => {
    if (!loaded || !user || !db || isRemoteUpdate.current) return;
    
    const state = {
      lang, theme, locKey, method, madhab, notifOn, adjust, hijriOffset,
      activities, goals, habits, journalEntries, notesList,
      activityCategories, activitiesSeeded, habitsSeeded,
    };
    
    const t = setTimeout(() => {
      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'main'), state, { merge: true }).catch(() => {});
    }, 1000); // Debounce simpan ke cloud selama 1 detik
    
    return () => clearTimeout(t);
  }, [loaded, user, lang, theme, locKey, method, madhab, notifOn, adjust, hijriOffset,
      activities, goals, habits, journalEntries, notesList,
      activityCategories, activitiesSeeded, habitsSeeded]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current) return;
      setDragVisual((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zoneEl = el && el.closest("[data-zone-type]");
      const zone = zoneEl
        ? { type: zoneEl.getAttribute("data-zone-type"), value: zoneEl.getAttribute("data-zone-value") }
        : null;
      hoverZoneRef.current = zone;
      setHoverZoneVisual(zone);
    };
    const handleUp = () => {
      if (dragRef.current && hoverZoneRef.current) {
        applyDrop(dragRef.current, hoverZoneRef.current);
      }
      dragRef.current = null;
      hoverZoneRef.current = null;
      setDragVisual(null);
      setHoverZoneVisual(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, []);

  const startDrag = (item, e) => {
    e.preventDefault();
    dragRef.current = item.id;
    setDragVisual({ id: item.id, x: e.clientX, y: e.clientY, label: item.title });
  };

  const isZoneActive = (type, value) => hoverZoneVisual && hoverZoneVisual.type === type && String(hoverZoneVisual.value) === String(value);

  const strings = T.ID;
  const isDark = theme === "dark";

  useEffect(() => {
    (async () => {
      try {
        let resValue = null;
        if (typeof window.storage !== "undefined" && window.storage.get) {
          const res = await window.storage.get("mplus-state");
          if (res && res.value) resValue = res.value;
        } else {
          resValue = localStorage.getItem("mplus-state");
        }

        if (resValue) {
          const s = JSON.parse(resValue);
          if (s.lang) setLang(s.lang);
          if (s.theme) setTheme(s.theme);
          if (s.locKey) setLocKey(s.locKey);
          if (s.method) setMethod(s.method);
          if (s.madhab) setMadhab(s.madhab);
          if (typeof s.notifOn === "boolean") setNotifOn(s.notifOn);
          if (s.adjust) setAdjust(s.adjust);
          if (typeof s.hijriOffset === "number") setHijriOffset(s.hijriOffset);
          if (s.activities) {
            setActivities(s.activities);
          } else if (s.schedule || s.todos) {
            const t = dateKey(new Date());
            const migrated = [
              ...(s.schedule || []).map((sc) => ({ id: sc.id, title: sc.title, date: t, time: sc.time || "", done: false, category: "Personal", status: "todo_today" })),
              ...(s.todos || []).map((td) => ({ id: td.id, title: td.text, date: t, time: "", done: !!td.done, category: "Personal", status: td.done ? "done" : "todo_today" })),
            ];
            setActivities(migrated);
          }
          if (s.goals) setGoals(s.goals);
          if (s.habits) setHabits(s.habits);
          if (s.journalEntries) setJournalEntries(s.journalEntries);
          if (s.notesList) setNotesList(s.notesList);
          if (s.activityCategories) setActivityCategories(s.activityCategories);
          if (typeof s.activitiesSeeded === "boolean") setActivitiesSeeded(s.activitiesSeeded);
          if (typeof s.habitsSeeded === "boolean") setHabitsSeeded(s.habitsSeeded);
        }
      } catch (e) {
        console.error("Storage load error", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const state = {
      lang, theme, locKey, method, madhab, notifOn, adjust, hijriOffset,
      activities, goals, habits, journalEntries, notesList,
      activityCategories, activitiesSeeded, habitsSeeded,
    };
    const t = setTimeout(() => {
      try {
        const stateStr = JSON.stringify(state);
        if (typeof window.storage !== "undefined" && window.storage.set) {
          window.storage.set("mplus-state", stateStr).catch(() => {});
        } else {
          localStorage.setItem("mplus-state", stateStr);
        }
      } catch (e) {
        console.error("Storage save error", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [loaded, lang, theme, locKey, method, madhab, notifOn, adjust, hijriOffset,
      activities, goals, habits, journalEntries, notesList,
      activityCategories, activitiesSeeded, habitsSeeded]);

  useEffect(() => {
    if (!loaded || habitsSeeded) return;
    if (habits.length === 0) {
      const defaults = PRAYER_LABELS.map((name, i) => ({
        id: Date.now() + i, name, category: "ibadah", section: null, checkins: {},
      }));
      setHabits(defaults);
    }
    setHabitsSeeded(true);
  }, [loaded, habitsSeeded, habits]); 

  useEffect(() => {
    if (!loaded || activitiesSeeded) return;
    if (activities.length === 0) {
      const t = dateKey(new Date());
      setActivities([
        { id: Date.now() + 1, title: "Kegiatan 1", date: t, time: "08:00", done: false, category: "Personal", status: "todo_today", order: 1 },
        { id: Date.now() + 2, title: "Kegiatan 2", date: t, time: "10:00", done: false, category: "Personal", status: "on_process", order: 2 },
        { id: Date.now() + 3, title: "Kegiatan 3", date: t, time: "13:00", done: false, category: "Personal", status: "todo_later", order: 3 },
      ]);
    }
    setActivitiesSeeded(true);
  }, [loaded, activitiesSeeded, activities]); 

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecs((s) => {
          if (s <= 1) {
            const nextPhase = timerPhase === "work" ? "break" : "work";
            setTimerPhase(nextPhase);
            return (nextPhase === "work" ? timerWork : timerBreak) * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerPhase, timerWork, timerBreak]);

  const loc = CITY_DB[locKey] || CITY_DB.wonosobo;
  const rawTimes = computeTimes(now, loc.lat, loc.lng, loc.tz, method, madhab);
  const times = {
    fajr: applyAdjust(rawTimes.fajr, adjust.fajr),
    dhuhr: applyAdjust(rawTimes.dhuhr, adjust.dhuhr),
    asr: applyAdjust(rawTimes.asr, adjust.asr),
    maghrib: applyAdjust(rawTimes.maghrib, adjust.maghrib),
    isha: applyAdjust(rawTimes.isha, adjust.isha),
  };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerMinutesToday = PRAYER_KEYS.map((k) => times[k].h * 60 + times[k].m);
  let nextIdx = prayerMinutesToday.findIndex((m) => m > nowMinutes);
  let minsUntil;
  if (nextIdx === -1) {
    nextIdx = 0;
    minsUntil = (1440 - nowMinutes) + prayerMinutesToday[0];
  } else {
    minsUntil = prayerMinutesToday[nextIdx] - nowMinutes;
  }
  const hoursUntil = Math.floor(minsUntil / 60);
  const minsRemain = minsUntil % 60;

  const hijri = toHijri(now, hijriOffset);
  const hijriLabel = `${hijri.day} ${HIJRI_MONTHS[hijri.month - 1]} ${hijri.year} H`;
  const gregLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const hadithIdx = now.getDate() % HADITH_LIST.length;
  const hadith = HADITH_LIST[hadithIdx];

  const bg = isDark ? "bg-[#1c1917]" : "bg-stone-100";
  const cardOverride = isDark ? "bg-[#292524] border-stone-800" : "bg-white border-stone-200";
  const textMain = isDark ? "text-stone-100" : "text-stone-900";
  const textSub = isDark ? "text-stone-400" : "text-stone-500";

  const addActivity = (dateStr) => {
    if (!activityDraft.title.trim()) return;
    const status = activityDraft.status || "todo_today";
    const category = activityDraft.category || "Personal";
    let time = activityDraft.time;
    if (!time) {
      const existingTimes = activities.filter((a) => a.date === dateStr).map((a) => a.time).filter(Boolean);
      time = findFreeHourSlot(existingTimes);
    }
    setActivities((acts) => [...acts, {
      id: Date.now() + Math.random(),
      title: activityDraft.title,
      date: dateStr,
      time,
      done: status === "done",
      category,
      status,
      order: Date.now(),
    }]);
    setActivityDraft({ title: "", time: "", category, status });
    setActivityForm(null);
    setShowAddPopup(false);
  };

  const updateActivity = () => {
    if (!editDraft || !editDraft.title.trim()) return;
    setActivities((acts) => acts.map((a) => (a.id === editDraft.id ? { ...a, ...editDraft, done: editDraft.status === "done" } : a)));
    setShowEditPopup(false);
    setEditDraft(null);
  };

  const duplicateActivity = (act) => {
    setActivities((prev) => [...prev, {
      ...act,
      id: Date.now() + Math.random(),
      title: act.title + " (Copy)",
      order: Date.now()
    }]);
    showToast("Jadwal berhasil diduplikat");
  };

  const handleItemClick = (e, act) => {
    e.stopPropagation();
    if (e.detail === 1) return;
    if (e.detail === 2) {
      clickTimerRef.current = setTimeout(() => {
        setEditDraft(act);
        setShowEditPopup(true);
      }, 250); // Memberi waktu sejenak untuk mendeteksi klik ketiga
    }
    if (e.detail === 3) {
      clearTimeout(clickTimerRef.current);
      duplicateActivity(act);
    }
  };

  const toggleActivityDone = (id) => setActivities((acts) => acts.map((a) => {
    if (a.id !== id) return a;
    const nowDone = !a.done;
    return { ...a, done: nowDone, status: nowDone ? "done" : (a.status === "done" ? "todo_today" : a.status) };
  }));

  const removeActivity = (id) => {
    setActivities((acts) => acts.filter((a) => a.id !== id));
    setShowEditPopup(false);
  };
  
  const activitiesOn = (dateStr) => activities.filter((a) => a.date === dateStr).sort((a, b) => {
    const pa = STATUS_ORDER[a.status] || STATUS_ORDER.todo_today;
    const pb = STATUS_ORDER[b.status] || STATUS_ORDER.todo_today;
    if (pa !== pb) return pa - pb;
    return (a.order || 0) - (b.order || 0);
  });

  const addActivityCategory = () => {
    const c = newCategoryDraft.trim();
    if (!c) return;
    setActivityCategories((cats) => (cats.includes(c) ? cats : [...cats, c]));
    setActivityDraft((d) => ({ ...d, category: c }));
    if(editDraft) setEditDraft((d) => ({ ...d, category: c }));
    setNewCategoryDraft("");
    setShowNewCategoryInput(false);
  };

  const reorderActivities = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setActivities((prev) => {
      const from = prev.find((a) => a.id === fromId);
      const to = prev.find((a) => a.id === toId);
      if (!from || !to || from.date !== to.date || from.status !== to.status) return prev;
      const group = prev.filter((a) => a.date === from.date && a.status === from.status)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const fromIdx = group.findIndex((a) => a.id === fromId);
      const toIdx = group.findIndex((a) => a.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = group.splice(fromIdx, 1);
      group.splice(toIdx, 0, moved);
      const orderMap = {};
      group.forEach((a, i) => { orderMap[a.id] = i; });
      return prev.map((a) => (orderMap[a.id] !== undefined ? { ...a, order: orderMap[a.id] } : a));
    });
  };

  const reorderHabits = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setHabits((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((h) => h.id === fromId);
      const toIdx = arr.findIndex((h) => h.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };

  const addGoal = (text) => {
    const goalText = (text || goalDraft).trim();
    if (!goalText) return;
    setGoals([...goals, { id: Date.now() + Math.random(), text: goalText, done: false, subItems: [] }]);
    setGoalDraft("");
    setGoalForm(false);
  };

  const removeGoal = (id) => setGoals(goals.filter((g) => g.id !== id));

  const addSubItemToGoal = (goalId, itemText) => {
    if (!itemText.trim()) return;
    setGoals(goals.map((g) => g.id === goalId ? { ...g, subItems: [...(g.subItems || []), { id: Date.now() + Math.random(), text: itemText, done: false }] } : g));
  };

  const toggleGoalSubItem = (goalId, subId) => {
    setGoals(goals.map((g) => {
      if (g.id !== goalId) return g;
      const newSubItems = g.subItems.map((s) => s.id === subId ? { ...s, done: !s.done } : s);
      const allDone = newSubItems.length > 0 && newSubItems.every((s) => s.done);
      return { ...g, subItems: newSubItems, done: allDone };
    }));
  };
  
  const removeGoalSubItem = (goalId, subId) => {
    setGoals(goals.map((g) => g.id === goalId ? { ...g, subItems: g.subItems.filter((s) => s.id !== subId) } : g));
  };

  const toggleGoal = (id) => setGoals(goals.map((g) => {
    if (g.id !== id) return g;
    const nowDone = !g.done;
    return { ...g, done: nowDone, subItems: (g.subItems || []).map(s => ({ ...s, done: nowDone })) };
  }));

  const todayKey = dateKey(now);
  const todaysActivities = activitiesOn(todayKey);

  const addHabit = (name = habitDraft, category = "custom", section = null) => {
    const n = (name || "").trim();
    if (!n) return;
    setHabits([{ id: Date.now() + Math.random(), name: n, category, section, checkins: {} }, ...habits]);
    setHabitDraft("");
  };

  const removeHabit = (id) => setHabits(habits.filter((h) => h.id !== id));

  const toggleHabitOn = (id, key = todayKey) => setHabits(habits.map((h) => {
    if (h.id !== id) return h;
    const checkins = { ...(h.checkins || {}) };
    if (checkins[key]) delete checkins[key]; else checkins[key] = true;
    return { ...h, checkins };
  }));

  const isInLibrary = (category, name) => habits.some((h) => h.category === category && h.name === name);
  const toggleLibraryItem = (category, name) => {
    const existing = habits.find((h) => h.category === category && h.name === name);
    if (existing) removeHabit(existing.id);
    else addHabit(name, category);
  };

  const saveJournal = () => {
    if (!journalDraft.trim()) return;
    setJournalEntries([{ id: Date.now(), date: gregLabel, text: journalDraft }, ...journalEntries]);
    setJournalDraft("");
  };

  const polishJournal = async () => {
    if (!journalDraft.trim()) return;
    setPolishing(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Rapikan tulisan jurnal harian berikut (Bahasa Indonesia). Perbaiki ejaan, tanda baca, dan alur kalimat, pertahankan makna, nada personal, dan sudut pandang orang pertama. Jangan menambahkan informasi baru. Balas hanya dengan teks jurnal yang sudah dirapikan, tanpa komentar tambahan.\n\nJurnal:\n${journalDraft}`,
          }],
        }),
      });
      const data = await resp.json();
      const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
      if (text) setJournalDraft(text);
    } catch (e) {
      console.error("Polish failed", e);
    } finally {
      setPolishing(false);
    }
  };

  const useGps = () => {
    if (!navigator.geolocation) { setSyncNote("GPS tidak tersedia"); return; }
    navigator.geolocation.getCurrentPosition(
      () => { setSyncNote("baru saja (GPS)"); },
      () => { setSyncNote("gagal, cek izin lokasi"); },
      { timeout: 5000 }
    );
  };

  const useManualCity = () => {
    const key = cityInput.trim().toLowerCase();
    if (CITY_DB[key]) {
      setLocKey(key);
      setSyncNote("baru saja (manual)");
      setCityInput("");
    } else {
      setSyncNote(`kota "${cityInput}" tidak ditemukan`);
    }
  };

  const setAdjustFor = (key, delta) => {
    setAdjust((a) => ({ ...a, [key]: Math.max(-30, Math.min(30, (a[key] || 0) + delta)) }));
  };

  const toggleTimer = () => setTimerRunning((r) => !r);
  const resetTimer = () => { setTimerRunning(false); setTimerPhase("work"); setTimerSecs(timerWork * 60); };
  const timerMM = String(Math.floor(timerSecs / 60)).padStart(2, "0");
  const timerSS = String(timerSecs % 60).padStart(2, "0");

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Berhasil login dengan Google");
    } catch (e) {
      showToast("Gagal login: " + e.message);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      showToast("Berhasil logout");
    } catch (e) {}
  };

  const Header = ({ title, subtitle }) => (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("dashboard")} className="shrink-0 flex flex-col hover:opacity-80 transition-opacity">
          <img src="https://di9i.my.id/apps/kreatiplan/icon-192.png" alt="KreatiPlan" className="w-10 h-10 object-contain" />
        </button>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textMain}`}>{title}</h1>
          {subtitle && <div className={`text-sm mt-1 ${textSub}`}>{subtitle}</div>}
        </div>
      </div>
      <button
        onClick={() => navigate("settings")}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isDark ? "border-stone-700 bg-[#292524] text-stone-300 hover:bg-stone-800" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}
      >
        <Settings size={16} />
      </button>
    </div>
  );

  if (page === "settings") {
    return (
      <div className={`min-h-screen ${bg} font-sans transition-colors`}>
        <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("dashboard")} className="shrink-0 flex flex-col hover:opacity-80 transition-opacity">
                <img src="https://di9i.my.id/apps/kreatiplan/icon-192.png" alt="KreatiPlan" className="w-10 h-10 object-contain" />
              </button>
              <h1 className={`text-2xl font-bold tracking-tight ${textMain}`}>{strings.settingsTitle}</h1>
            </div>
            <button
              onClick={goBack}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${textSub} hover:${textMain}`}
            >
              <ArrowLeft size={16} /> {strings.back}
            </button>
          </div>

          <Card className={`p-5 flex flex-col gap-4 ${cardOverride}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg ${user && !user.isAnonymous ? "bg-stone-200" : "bg-stone-900 text-white"}`}>
                {user && !user.isAnonymous && user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user && !user.isAnonymous ? user.displayName?.charAt(0) || "U" : "K"
                )}
              </div>
              <div className="flex-1">
                <div className={`flex items-center gap-2 font-semibold ${textMain}`}>
                  {user && !user.isAnonymous ? user.displayName : "Pengguna Tamu"}
                  <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 ${user && !user.isAnonymous ? "text-green-600 bg-green-50 border-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400" : "text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"}`}>
                    {user && !user.isAnonymous ? "✓ Google Account" : "Mode Lokal"}
                  </span>
                </div>
                <div className={`text-sm ${textSub}`}>
                  {user && !user.isAnonymous ? user.email : "Data disimpan sementara di browser."}
                </div>
              </div>
            </div>
            {user && !user.isAnonymous ? (
              <button onClick={handleLogout} className={`w-full py-2.5 rounded-lg text-sm font-semibold border transition-colors ${isDark ? "border-stone-700 hover:bg-stone-800 text-stone-300" : "border-stone-200 hover:bg-stone-50 text-stone-600"}`}>
                Logout
              </button>
            ) : (
              <button onClick={handleGoogleLogin} className={`w-full py-2.5 rounded-lg text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${isDark ? "bg-white text-stone-900 hover:bg-stone-200" : "bg-stone-900 text-white hover:bg-stone-800"}`}>
                Login dengan Google (Simpan Data)
              </button>
            )}
          </Card>

          <Card className={`p-5 space-y-4 ${cardOverride}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-stone-700" : "bg-stone-100"}`}>
                <span className={`text-sm font-bold ${isDark ? "text-stone-300" : "text-stone-500"}`}>Aa</span>
              </div>
              <div>
                <div className={`font-semibold ${textMain}`}>{strings.display}</div>
                <div className={`text-sm ${textSub}`}>{strings.displayHint}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className={`text-[11px] tracking-wider ${textSub} mb-2`}>{strings.language}</div>
                <div className={`inline-flex rounded-full border overflow-hidden ${isDark ? "border-stone-700 bg-stone-800" : "border-stone-200 bg-white"}`}>
                  {["ID", "EN"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-4 py-1.5 text-sm font-medium ${lang === l ? (isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white") : `${textMain}`}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={`text-[11px] tracking-wider ${textSub} mb-2`}>{strings.theme}</div>
                <div className={`inline-flex rounded-full border overflow-hidden ${isDark ? "border-stone-700 bg-stone-800" : "border-stone-200 bg-white"}`}>
                  {[
                    { id: "light", icon: Sun, label: strings.light },
                    { id: "dark", icon: Moon, label: strings.dark },
                    { id: "system", icon: Monitor, label: strings.system },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${theme === opt.id ? (isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white") : textMain}`}
                      title={opt.label}
                    >
                      <opt.icon size={13} /> <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className={`p-5 space-y-3 ${cardOverride}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-stone-700" : "bg-stone-100"}`}>
                <Smartphone size={16} className={isDark ? "text-stone-300" : "text-stone-500"} />
              </div>
              <div>
                <div className={`font-semibold ${textMain}`}>{strings.installApp}</div>
                <div className={`text-sm ${textSub}`}>{strings.installHint}</div>
              </div>
            </div>
            <button
              onClick={() => showToast("Buka menu browser lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'.")}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}
            >
              <Smartphone size={14} /> {strings.install}
            </button>
          </Card>

          <Card className={`p-5 space-y-4 ${cardOverride}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-stone-700" : "bg-stone-100"}`}>
                  <MapPin size={16} className={isDark ? "text-stone-300" : "text-stone-500"} />
                </div>
                <div>
                  <div className={`font-semibold ${textMain}`}>{strings.locationSync}</div>
                  <div className={`text-sm ${textSub}`}>{strings.locationHint}</div>
                </div>
              </div>
              <button onClick={useGps} className={`text-[11px] font-semibold border rounded-full px-2.5 py-1 ${isDark ? "border-stone-600 text-stone-300 hover:bg-stone-700" : "border-stone-300 text-stone-500 hover:bg-stone-50"}`}>GPS</button>
            </div>
            <div>
              <span className={`text-[13px] font-medium border rounded-full px-2.5 py-1 inline-flex items-center gap-1 ${isDark ? "bg-orange-900/30 border-orange-800 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-600"}`}>
                <CheckCircle2 size={12} /> {loc.label}
              </span>
              <div className={`text-xs ${textSub} mt-2`}>{strings.syncedJust.replace("baru saja", syncNote)}</div>
            </div>
            <div className={`border-t pt-4 ${isDark ? "border-stone-700" : "border-stone-100"}`}>
              <div className={`text-[11px] tracking-wider ${textSub} mb-2`}>{strings.manualPick}</div>
              <div className="flex gap-2">
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder={strings.cityPlaceholder}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none ${isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-50 border-stone-200 text-stone-900"}`}
                />
                <button onClick={useManualCity} className={`text-sm font-medium px-4 py-2 rounded-lg ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>{strings.use}</button>
              </div>
            </div>
          </Card>

          <Card className={`p-5 space-y-4 ${cardOverride}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-stone-700" : "bg-stone-100"}`}>
                <Compass size={16} className={isDark ? "text-stone-300" : "text-stone-500"} />
              </div>
              <div>
                <div className={`font-semibold ${textMain}`}>{strings.method}</div>
                <div className={`text-sm ${textSub}`}>{strings.methodHint}</div>
              </div>
            </div>
            <div>
              <div className={`text-[11px] tracking-wider ${textSub} mb-2`}>{strings.methodLabel}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`text-sm font-medium rounded-lg px-3 py-2 border ${method === m.id ? (isDark ? "bg-stone-100 text-stone-900 border-stone-100" : "bg-stone-900 text-white border-stone-900") : `border-stone-200 ${textMain} ${isDark ? "border-stone-700" : ""}`}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={`text-[11px] tracking-wider ${textSub} mb-2`}>{strings.madhab}</div>
              <div className={`inline-flex rounded-full border overflow-hidden ${isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}`}>
                {[{ id: "shafii", label: strings.shafii }, { id: "hanafi", label: strings.hanafi }].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setMadhab(opt.id)}
                    className={`px-4 py-1.5 text-sm font-medium ${madhab === opt.id ? (isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white") : textMain}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (page === "jurnal") {
    return (
      <div className={`min-h-screen ${bg} font-sans transition-colors pb-10`}>
        <div className={`max-w-4xl mx-auto sm:my-8 sm:rounded-2xl sm:shadow-sm min-h-screen sm:min-h-0 flex flex-col overflow-hidden ${isDark ? "bg-[#1c1917] sm:border sm:border-stone-800" : "bg-white sm:border sm:border-stone-200"}`}>
          
          {/* Header */}
          <div className="px-5 sm:px-8 pt-8 pb-4 flex items-start justify-between">
            <div>
              <div className={`text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase mb-2 ${textSub}`}>JURNAL · {dateKey(now)}</div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textMain}`}>Tulis jurnal hari ini</h1>
            </div>
            <button onClick={goBack} className={`p-2 -mr-2 rounded-full transition-colors ${isDark ? "hover:bg-stone-800 text-stone-400" : "hover:bg-stone-100 text-stone-500"}`}>
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex px-5 sm:px-8 border-b overflow-x-auto no-scrollbar gap-2 sm:gap-6 ${isDark ? "border-stone-800" : "border-stone-200"}`}>
            <button onClick={() => setJournalTab("tulis")} className={`flex items-center gap-2 py-3 text-[13px] sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${journalTab === "tulis" ? (isDark ? "border-stone-100 text-stone-100" : "border-stone-900 text-stone-900") : `border-transparent ${textSub} hover:text-stone-700 dark:hover:text-stone-300`}`}>
              <FileText size={16} /> Tulis jurnal hari ini
            </button>
            <button onClick={() => setJournalTab("panduan")} className={`flex items-center gap-2 py-3 text-[13px] sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${journalTab === "panduan" ? (isDark ? "border-stone-100 text-stone-100" : "border-stone-900 text-stone-900") : `border-transparent ${textSub} hover:text-stone-700 dark:hover:text-stone-300`}`}>
              <Lightbulb size={16} /> Panduan
            </button>
            <button onClick={() => setJournalTab("riwayat")} className={`flex items-center gap-2 py-3 text-[13px] sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${journalTab === "riwayat" ? (isDark ? "border-stone-100 text-stone-100" : "border-stone-900 text-stone-900") : `border-transparent ${textSub} hover:text-stone-700 dark:hover:text-stone-300`}`}>
              <BookOpen size={16} /> Jurnal Sebelumnya
            </button>
          </div>

          {/* Content Container */}
          <div className="flex-1 px-5 sm:px-8 py-6 overflow-y-auto">
            
            {/* TAB: Tulis */}
            {journalTab === "tulis" && (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                {/* Mode Selector */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
                  <button onClick={() => setJournalMode("syukur")} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors border ${journalMode === "syukur" ? (isDark ? "bg-stone-100 text-stone-900 border-stone-100" : "bg-stone-900 text-white border-stone-900") : (isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-200 text-stone-600 hover:bg-stone-50")}`}>
                    <Heart size={14} className={journalMode === "syukur" ? "" : "text-stone-400"} /> Mode Syukur
                  </button>
                  <button onClick={() => setJournalMode("refleksi")} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors border ${journalMode === "refleksi" ? (isDark ? "bg-stone-100 text-stone-900 border-stone-100" : "bg-stone-900 text-white border-stone-900") : (isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-200 text-stone-600 hover:bg-stone-50")}`}>
                    <Lightbulb size={14} className={journalMode === "refleksi" ? "" : "text-stone-400"} /> Refleksi
                  </button>
                  <button onClick={() => setJournalMode("bebas")} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors border ${journalMode === "bebas" ? (isDark ? "bg-stone-100 text-stone-900 border-stone-100" : "bg-stone-900 text-white border-stone-900") : (isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-200 text-stone-600 hover:bg-stone-50")}`}>
                    <FileText size={14} className={journalMode === "bebas" ? "" : "text-stone-400"} /> Bebas
                  </button>
                </div>
                
                {/* Textarea */}
                <textarea
                  value={journalDraft}
                  onChange={(e) => setJournalDraft(e.target.value)}
                  placeholder={journalMode === "syukur" ? "Hari ini aku bersyukur untuk..." : journalMode === "refleksi" ? "Apa pelajaran yang kamu dapatkan hari ini?" : "Apa yang ada di pikiranmu hari ini?"}
                  className={`w-full min-h-[300px] sm:min-h-[350px] p-5 rounded-2xl text-[15px] outline-none resize-none border leading-relaxed ${isDark ? "bg-[#292524] border-stone-800 text-stone-100 placeholder:text-stone-500" : "bg-stone-50/80 border-stone-200 text-stone-900 placeholder:text-stone-500"}`}
                />
                
                {/* AI Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5">
                  <span className={`text-xs font-medium ${textSub}`}>Poles AI tersedia 1x per hari.</span>
                  <button onClick={polishJournal} disabled={polishing} className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold border rounded-full transition-colors ${isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-200 text-stone-700 hover:bg-stone-50"} disabled:opacity-50`}>
                    <Sparkles size={16} /> {polishing ? "Merapikan..." : "Poles dengan AI"}
                  </button>
                </div>
                
                {/* Save Button */}
                <button onClick={() => { saveJournal(); goBack(); }} className={`w-full mt-10 py-3.5 rounded-full flex items-center justify-center gap-2 text-[15px] font-bold transition-colors ${isDark ? "bg-stone-600 hover:bg-stone-500 text-white" : "bg-[#808080] hover:bg-[#6b6b6b] text-white"}`}>
                  <CheckCircle2 size={18} /> Simpan & Tutup
                </button>
              </div>
            )}

            {/* TAB: Panduan */}
            {journalTab === "panduan" && (
              <div className="space-y-8 animate-in fade-in duration-300 pb-10">
                <div>
                  <h3 className={`text-lg font-bold mb-3 ${textMain}`}>Kenapa Jurnal?</h3>
                  <ul className={`space-y-2.5 text-sm ${isDark ? "text-stone-300" : "text-stone-700"}`}>
                    <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span> Mengurai pikiran yang berserakan jadi lebih jernih.</li>
                    <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span> Menumbuhkan rasa syukur — terapi paling sederhana.</li>
                    <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span> Refleksi harian = bahan bakar untuk versi diri yang lebih baik.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className={`text-lg font-bold mb-3 ${textMain}`}>Contoh Jurnal Syukur (5 menit)</h3>
                  <div className={`p-5 rounded-2xl text-sm leading-relaxed border ${isDark ? "bg-[#292524] border-stone-800 text-stone-300" : "bg-stone-50/80 border-stone-200 text-stone-700"}`}>
                    Hari ini aku bersyukur untuk:<br/>
                    1. Bisa bangun sebelum subuh dan sholat tepat waktu.<br/>
                    2. Pekerjaan yang lancar walau sempat terdistraksi pagi.<br/>
                    3. Obrolan singkat dengan ibu yang menenangkan hati.<br/><br/>
                    Satu hal kecil yang membuatku tersenyum: kopi pagi rasanya pas.<br/><br/>
                    Besok aku ingin: lebih sabar saat menjawab pesan.
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-lg font-bold mb-3 ${textMain}`}>Tips</h3>
                  <ul className={`space-y-2.5 text-sm ${isDark ? "text-stone-300" : "text-stone-700"}`}>
                    <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span> Mulai kecil — 3 kalimat sudah cukup.</li>
                    <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span> Tulis tanpa filter, biarkan AI yang membantu menyusun.</li>
                    <li className="flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span> Konsisten lebih penting daripada panjang.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: Riwayat */}
            {journalTab === "riwayat" && (
              <div className="space-y-4 animate-in fade-in duration-300 pb-10">
                {journalEntries.length === 0 ? (
                  <div className={`text-center py-16 text-sm font-medium ${textSub}`}>
                    Belum ada jurnal. <span className="text-orange-500 cursor-pointer" onClick={() => setJournalTab("tulis")}>Mulai tulis sekarang →</span>
                  </div>
                ) : (
                  journalEntries.map(entry => (
                    <div key={entry.id} className={`p-5 rounded-2xl border ${isDark ? "bg-[#292524] border-stone-800" : "bg-white border-stone-200"}`}>
                      <div className={`text-[11px] font-bold tracking-wider mb-2.5 uppercase ${textSub}`}>{entry.date}</div>
                      <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${textMain}`}>{entry.text}</div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  if (page === "habits") {
    const totalHabits = habits.length;
    const doneToday = habits.filter((h) => h.checkins?.[todayKey]).length;
    const pctToday = totalHabits ? Math.round((doneToday / totalHabits) * 100) : 0;

    const startOfWeek = (d) => {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), diff);
    };
    
    const weekDates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(startOfWeek(now), i));
    const DAY_ABBR = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Ah"];
    const DAY_LETTER = { 1: "S", 2: "S", 3: "R", 4: "K", 5: "J", 6: "S", 0: "M" };

    const daysInMonthH = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthDatesH = Array.from({ length: daysInMonthH }, (_, i) => new Date(now.getFullYear(), now.getMonth(), i + 1));
    const dayDatesH = [new Date(now.getFullYear(), now.getMonth(), now.getDate())];

    const rangeDates = habitsRange === "hari" ? dayDatesH : habitsRange === "bulan" ? monthDatesH : weekDates;
    const rangeAbbr = habitsRange === "hari" ? [lang === "ID" ? "Hari Ini" : "Today"] : habitsRange === "bulan" ? monthDatesH.map((d) => String(d.getDate())) : DAY_ABBR;

    const getChartData = (dates) => {
      let data = [];
      let totalChecks = 0;
      dates.forEach((d) => {
        const k = dateKey(d);
        const v = habits.filter((h) => h.checkins?.[k]).length;
        const pct = totalHabits ? (v / totalHabits) * 100 : 0;
        totalChecks += v;
        data.push({ date: d, key: k, value: v, pct });
      });
      const avg = dates.length ? Math.round(data.reduce((sum, d) => sum + d.pct, 0) / dates.length) : 0;
      return { data, totalChecks, avg };
    };

    const chartWeek = getChartData(weekDates);
    const chartMonth = getChartData(monthDatesH);
    const activeChart = habitsRange === "bulan" ? chartMonth : chartWeek;
    
    const bestStreak = habits.length ? Math.max(...habits.map((h) => longestStreak(h))) : 0;
    const isFutureDate = (d) => dateKey(d) > todayKey;

    const renderSplineChart = (chartInfo, title) => {
      const { data, avg } = chartInfo;
      const height = 120;
      const width = 1000; 
      const padding = 20;
      const w = width - padding * 2;
      const h = height - padding * 2;
      
      const maxPct = 100;
      
      let pathD = "";
      let points = [];
      
      if (data.length > 0) {
        const stepX = w / (data.length - 1 || 1);
        points = data.map((d, i) => ({
          x: padding + i * stepX,
          y: height - padding - (d.pct / maxPct) * h
        }));

        pathD = `M ${points[0].x},${points[0].y} `;
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i === 0 ? 0 : i - 1];
          const p1 = points[i];
          const p2 = points[i + 1];
          const p3 = points[i + 2 === points.length ? i + 1 : i + 2];
          
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          
          pathD += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
        }
      }

      const gridLines = [0, 25, 50, 75, 100];

      return (
        <Card className={`p-5 w-full flex-1 min-w-[300px] border ${cardOverride}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold ${textMain}`}>{title}</h3>
            <span className={`text-xs font-medium ${textMain}`}>rata-rata {avg}%</span>
          </div>
          <div className="relative w-full h-[140px]">
            <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {gridLines.map(val => {
                const y = height - padding - (val / 100) * h;
                return (
                  <g key={val}>
                    <line x1={0} y1={y} x2={width} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className={isDark ? "text-stone-700" : "text-stone-200"} />
                    <text x={0} y={y - 4} fontSize="12" fill="currentColor" className={textSub}>{val}%</text>
                  </g>
                );
              })}
              
              {pathD && (
                <path d={pathD} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[20px]">
              {data.map((d, i) => {
                const isFirst = i === 0;
                const isLast = i === data.length - 1;
                const showLabel = data.length <= 7 || isFirst || isLast || (i % 5 === 0);
                
                if (!showLabel) return <div key={i} className="flex-1" />;
                
                let align = "text-center";
                if (data.length > 7) {
                   if (isFirst) align = "text-left";
                   else if (isLast) align = "text-right";
                }
                
                return (
                  <div key={i} className={`flex-1 ${align} text-[10px] ${textSub}`}>
                    {data.length <= 7 ? DAY_ABBR[d.date.getDay()] : d.date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      );
    };

    return (
      <div className={`min-h-screen ${bg} font-sans transition-colors`}>
        <div className="max-w-6xl mx-auto px-5 py-6">
          <Header title="Habits" subtitle="Pantau dan kelola konsistensi habit Anda." />

          <div className="space-y-5">
            <Card className={`p-5 flex gap-3 ${cardOverride}`}>
              <BookOpen size={18} className="text-orange-500 shrink-0 mt-1" />
                <div>
                  <div className={`text-right text-lg leading-relaxed ${textMain}`} dir="rtl">أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ</div>
                  <div className={`text-sm ${textMain} mt-2`}>"Amalan yang paling dicintai Allah adalah yang dikerjakan rutin, walau sedikit."</div>
                  <div className={`text-xs ${textSub} mt-1`}>HR. Bukhari &amp; Muslim</div>
                </div>
              </Card>

              <Card className={`p-5 relative ${cardOverride}`}>
                <div className="flex items-start gap-3 pr-14">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-orange-900/30" : "bg-orange-50"}`}>
                    <Lightbulb size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <div className={`text-[11px] tracking-wider font-medium ${textSub}`}>TIPS HABIT</div>
                    <div className={`text-sm mt-1 ${textMain}`}>{HABIT_TIPS[tipIndex]}</div>
                  </div>
                </div>
                <div className="absolute top-5 right-5 flex items-center gap-1">
                  <button onClick={() => setTipIndex((i) => (i - 1 + HABIT_TIPS.length) % HABIT_TIPS.length)} className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-stone-700 hover:bg-stone-700 text-stone-300" : "border-stone-200 hover:bg-stone-50 text-stone-500"}`}><ChevronLeft size={13} /></button>
                  <button onClick={() => setTipIndex((i) => (i + 1) % HABIT_TIPS.length)} className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-stone-700 hover:bg-stone-700 text-stone-300" : "border-stone-200 hover:bg-stone-50 text-stone-500"}`}><ChevronRight size={13} /></button>
                </div>
                <div className="flex gap-1.5 mt-3 ml-12">
                  {HABIT_TIPS.map((_, i) => (
                    <button key={i} onClick={() => setTipIndex(i)} className={`h-1.5 rounded-full transition-all ${i === tipIndex ? (isDark ? "w-5 bg-stone-300" : "w-5 bg-stone-900") : (isDark ? "w-1.5 bg-stone-700" : "w-1.5 bg-stone-200")}`} />
                  ))}
                </div>
              </Card>

              {habitsDisplay === "grafik" ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  {renderSplineChart(chartWeek, "7 Hari Terakhir")}
                  {renderSplineChart(chartMonth, "Bulan Ini")}
                </div>
              ) : (
                <Card className={`p-5 ${cardOverride}`}>
                  <div className="flex flex-wrap items-center gap-8">
                    <div>
                      <div className={`text-[11px] tracking-wider ${textSub} font-medium mb-2`}>HARI INI</div>
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center relative"
                        style={{ background: `conic-gradient(#f97316 ${pctToday}%, ${isDark ? '#44403c' : '#e7e5e4'} 0)` }}
                      >
                        <div className={`w-[76px] h-[76px] rounded-full flex flex-col items-center justify-center ${isDark ? "bg-[#292524]" : "bg-white"}`}>
                          <span className={`text-lg font-bold ${textMain}`}>{pctToday}%</span>
                          <span className={`text-[11px] ${textSub}`}>{doneToday}/{totalHabits}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex justify-between items-end mb-3">
                        <div className={`text-[11px] tracking-wider ${textSub} font-medium uppercase`}>{habitsRange === "bulan" ? "BULAN INI" : habitsRange === "hari" ? "HARI INI" : "PEKAN INI"}</div>
                        <div className={`text-sm ${textSub}`}>{activeChart.totalChecks} <span className="text-xs">check-in</span></div>
                      </div>
                      
                      <div className="flex items-end gap-1.5 h-16 w-full">
                        {activeChart.data.map((b, i) => {
                          const maxBar = Math.max(1, ...activeChart.data.map(d => d.value));
                          const heightPx = Math.max(4, (b.value / maxBar) * 56);
                          const isToday = b.key === todayKey;
                          
                          const isFirst = i === 0;
                          const isLast = i === activeChart.data.length - 1;
                          const showLabel = activeChart.data.length <= 7 || isFirst || isLast || (i % 5 === 0);
                          
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div
                                className={`w-full rounded-sm transition-all ${b.value > 0 ? (isDark ? "bg-stone-300" : "bg-stone-800") : (isDark ? "bg-stone-700" : "bg-stone-200")}`}
                                style={{ height: `${heightPx}px`, maxWidth: activeChart.data.length > 7 ? '8px' : '24px' }}
                                title={`${b.value} check-in`}
                              />
                              <div className={`text-[9px] mt-1 truncate w-full text-center ${isToday ? "text-orange-500 font-semibold" : textSub}`}>
                                {showLabel ? (activeChart.data.length <= 7 ? DAY_LETTER[b.date.getDay()] : b.date.getDate()) : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className={`inline-flex rounded-full border overflow-hidden shadow-sm ${isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}`}>
                  {[{ id: "hari", label: "Hari" }, { id: "pekan", label: "Pekan" }, { id: "bulan", label: "Bulan" }].map((o) => (
                    <button key={o.id} onClick={() => setHabitsRange(o.id)} className={`px-4 py-1.5 text-sm font-medium ${habitsRange === o.id ? (isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white") : textMain}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`inline-flex rounded-full border overflow-hidden shadow-sm ${isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}`}>
                    <button onClick={() => setHabitsDisplay("tabel")} className={`px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 ${habitsDisplay === "tabel" ? (isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white") : textMain}`}>
                      <Table2 size={13} /> Tabel
                    </button>
                    <button onClick={() => setHabitsDisplay("grafik")} className={`px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 ${habitsDisplay === "grafik" ? (isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white") : textMain}`}>
                      <BarChart3 size={13} /> Grafik
                    </button>
                  </div>
                  <button onClick={() => navigate("habits-edit")} className={`px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-1.5 shadow-sm ${isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-200 text-stone-900"}`}>
                    <Plus size={13} /> Edit
                  </button>
                </div>
              </div>

              {habitsDisplay === "tabel" && (
                <Card className={`p-0 overflow-x-auto ${cardOverride} shadow-sm border ${isDark ? "border-stone-700" : "border-stone-200"} relative`}>
                  {habits.length === 0 ? (
                    <div className={`p-8 text-center text-sm ${textSub}`}>
                      Belum ada habit aktif. Pilih dari Habits Library di sebelah kanan →
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: `minmax(200px, max-content) repeat(${rangeDates.length}, minmax(40px, 1fr))` }} className="w-full min-w-max">
                      <div className={`sticky left-0 z-40 border-b border-r px-4 py-3 text-[11px] tracking-wider font-medium flex items-center ${isDark ? "bg-stone-900 border-stone-700 text-stone-400" : "bg-stone-50 border-stone-100 text-stone-500"}`}>
                        HABITS
                      </div>
                      {rangeDates.map((d, i) => {
                        const isToday = dateKey(d) === todayKey;
                        const doneCount = habits.filter(h => h.checkins?.[dateKey(d)]).length;
                        return (
                          <div key={i} className={`border-b text-center py-2 flex flex-col justify-center ${isDark ? "bg-stone-900 border-stone-700" : "bg-stone-50 border-stone-100"} ${isToday ? "bg-orange-50/10" : ""}`}>
                            <div className={`text-[12px] font-medium ${isToday ? "text-orange-500" : textMain}`}>{rangeAbbr[i]}</div>
                            <div className={`text-[9px] mt-0.5 ${textSub}`}>{doneCount}/{habits.length}</div>
                          </div>
                        );
                      })}
                      
                      {habits.map((h) => (
                        <React.Fragment key={h.id}>
                          <div className={`sticky left-0 z-30 border-b border-r px-4 py-3 flex items-center justify-between group ${isDark ? "bg-[#292524] border-stone-700" : "bg-white border-stone-50"} ${habitOverId === h.id ? (isDark ? "bg-stone-800" : "bg-orange-50") : ""}`}>
                            <div className="flex items-center gap-2">
                              <GripVertical size={13} className="text-stone-400 shrink-0 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity" 
                                draggable onDragStart={() => { habitDragRef.current = h.id; }}
                                onDragOver={(e) => { e.preventDefault(); setHabitOverId(h.id); }}
                                onDrop={(e) => { e.preventDefault(); reorderHabits(habitDragRef.current, h.id); habitDragRef.current = null; setHabitOverId(null); }}
                                onDragEnd={() => { habitDragRef.current = null; setHabitOverId(null); }}
                              />
                              <div className="min-w-0">
                                <div className={`font-medium truncate ${textMain}`}>{h.name}</div>
                                <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${textSub}`}>
                                  <span className={`px-1.5 py-0.5 rounded shrink-0 ${isDark ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-500"}`}>{HABIT_CATEGORY_LABEL[h.category] || "Custom"}</span>
                                  {currentStreak(h, now) > 0 && <span className="font-medium text-orange-500">🔥{currentStreak(h, now)}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {rangeDates.map((d, i) => {
                            const key = dateKey(d);
                            const checked = !!h.checkins?.[key];
                            const future = isFutureDate(d);
                            return (
                              <div key={i} className={`border-b border-r text-center py-3 flex items-center justify-center ${isDark ? "border-stone-700" : "border-stone-50"} ${habitOverId === h.id ? (isDark ? "bg-stone-800" : "bg-orange-50") : ""}`}>
                                <button
                                  disabled={future}
                                  onClick={() => toggleHabitOn(h.id, key)}
                                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all 
                                    ${checked ? (isDark ? "bg-stone-300 border-stone-300 text-stone-900" : "bg-stone-900 border-stone-900 text-white") : key === todayKey ? "border-orange-500" : (isDark ? "border-stone-600" : "border-stone-200")} 
                                    ${future ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:scale-110 active:scale-95"}`}
                                >
                                  {checked && <CheckCircle2 size={16} />}
                                </button>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </Card>
              )}
          </div>
        </div>
      </div>
    );
  }

  if (page === "habits-edit") {
    return (
      <div className={`min-h-screen ${bg} font-sans transition-colors`}>
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("dashboard")} className="shrink-0 flex flex-col hover:opacity-80 transition-opacity">
                <img src="https://di9i.my.id/apps/kreatiplan/icon-192.png" alt="KreatiPlan" className="w-10 h-10 object-contain" />
              </button>
              <h1 className={`text-2xl font-bold tracking-tight ${textMain}`}>Kelola Habits</h1>
            </div>
            <button onClick={goBack} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${textSub} hover:${textMain}`}>
              <ArrowLeft size={16} /> {strings.back}
            </button>
          </div>

          <Card className={`p-5 !bg-orange-500/10 border border-orange-500/20 mb-5 ${isDark ? "" : "!bg-orange-50 !border-orange-100"}`}>
            <div className="text-[11px] tracking-wider text-orange-600 dark:text-orange-400 font-semibold">TAMBAHKAN SENDIRI</div>
            <div className={`text-xs mt-1 mb-3 ${isDark ? "text-orange-200" : "text-stone-500"}`}>Habit baru muncul di paling atas.</div>
            <div className="flex gap-2">
              <input
                value={habitDraft}
                onChange={(e) => setHabitDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                placeholder="Habit baru · Custom"
                className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none ${isDark ? "bg-[#292524] border-orange-500/30 text-stone-100" : "bg-white border-orange-200 text-stone-900"}`}
              />
              <button onClick={() => addHabit()} className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>
                <Plus size={18} />
              </button>
            </div>
          </Card>

          <Card className={`p-5 mb-5 ${cardOverride}`}>
            <div className={`font-semibold mb-1 ${textMain}`}>Habits Aktif ({habits.length})</div>
            <div className={`text-xs mb-4 ${textSub}`}>Tahan ikon ⠿ lalu geser untuk mengurutkan posisi.</div>
            {habits.length === 0 ? (
              <div className={`text-sm ${textSub} py-4 text-center`}>Belum ada habit aktif.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {habits.map((h) => (
                  <div 
                    key={h.id} 
                    draggable
                    onDragStart={() => { habitDragRef.current = h.id; }}
                    onDragOver={(e) => { e.preventDefault(); setHabitOverId(h.id); }}
                    onDrop={(e) => { e.preventDefault(); reorderHabits(habitDragRef.current, h.id); habitDragRef.current = null; setHabitOverId(null); }}
                    onDragEnd={() => { habitDragRef.current = null; setHabitOverId(null); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isDark ? "bg-[#1c1917] border-stone-800" : "bg-stone-50 border-stone-200"} ${habitOverId === h.id ? (isDark ? "border-stone-500 bg-stone-800" : "border-orange-300 bg-orange-50") : ""} cursor-grab active:cursor-grabbing transition-colors`}
                  >
                    <span className="min-w-0 flex items-center gap-3">
                      <GripVertical size={16} className={`shrink-0 ${isDark ? "text-stone-600" : "text-stone-400"}`} />
                      <span className={`text-sm font-medium truncate ${textMain}`}>{h.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 ${isDark ? "bg-stone-800 text-stone-400" : "bg-stone-200 text-stone-500"}`}>{HABIT_CATEGORY_LABEL[h.category] || "Custom"}</span>
                    </span>
                    <button onClick={() => removeHabit(h.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-red-900/40 text-stone-500 hover:text-red-400" : "hover:bg-red-50 text-stone-400 hover:text-red-500"}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className={`p-5 ${cardOverride}`}>
            <div className={`font-semibold mb-3 ${textMain}`}>Habits Library</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[{ id: "ibadah", label: "Ibadah" }, { id: "kerja", label: "Kerja" }, { id: "selfdev", label: "Self Dev" }, { id: "nobad", label: "No Bad Habits" }].map((t) => (
                <button key={t.id} onClick={() => setHabitsTab(t.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${habitsTab === t.id ? (isDark ? "bg-stone-100 text-stone-900 border-stone-100" : "bg-stone-900 text-white border-stone-900") : `border-stone-200 ${textMain} ${isDark ? "border-stone-700 hover:bg-stone-800" : "hover:bg-stone-50"}`}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {HABIT_LIBRARY[habitsTab].map((group) => (
                <div key={group.section}>
                  <div className="flex items-center gap-1.5 text-[11px] tracking-wider text-orange-500 font-semibold mb-2">
                    <span className="w-1 h-1 rounded-full bg-orange-500 inline-block" /> {group.section.toUpperCase()}
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const active = isInLibrary(habitsTab, item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleLibraryItem(habitsTab, item)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${active ? (isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-900 border-stone-900 text-white") : (isDark ? "bg-[#1c1917] border-stone-800 text-stone-400 hover:border-stone-600" : "bg-stone-50 border-stone-100 text-stone-700 hover:border-stone-300")}`}
                        >
                          {item} {active && <CheckCircle2 size={16} className={isDark ? "text-stone-300" : "text-stone-300"}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (page === "goals") {
    return (
      <div className={`min-h-screen ${bg} font-sans transition-colors pb-20`}>
        <div className="max-w-4xl mx-auto px-5 py-6">
          <Header title="Plans/Goals" subtitle="Progres otomatis dari sub-item & habit terkait." />

          <Card className={`p-4 flex gap-3 mb-6 items-center ${cardOverride}`}>
            <input 
              value={goalDraft} 
              onChange={(e) => setGoalDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              placeholder="Contoh: Lari 50km bulan ini" 
              className={`flex-1 bg-transparent text-sm outline-none ${textMain}`}
            />
            <button onClick={() => addGoal()} className={`px-5 py-2.5 rounded-full text-sm font-medium shrink-0 flex items-center gap-1.5 ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>
              <Plus size={15} /> Tambah Tujuan
            </button>
          </Card>

          <Card className={`p-5 relative mb-6 !bg-orange-500/10 border border-orange-500/20 ${isDark ? "" : "!bg-orange-50 !border-orange-100"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-orange-900/50" : "bg-orange-100"}`}>
                <span className="text-orange-500 font-bold text-xs">i</span>
              </div>
              <div>
                <div className={`font-semibold text-sm ${isDark ? "text-orange-400" : "text-stone-900"}`}>Tips: Gunakan kerangka SMART</div>
                <div className={`text-sm mt-1 leading-relaxed ${isDark ? "text-orange-200/80" : "text-stone-600"}`}>
                  Specific, Measurable, Achievable, Relevant, Time-bound. Fokus maksimal 3 goal aktif sekaligus agar momentum terjaga.
                </div>
              </div>
            </div>
          </Card>

          <Card className={`p-5 mb-8 border ${cardOverride}`}>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setGoalForm(!goalForm)}>
              <div className={`flex items-center gap-2 font-semibold ${textMain}`}>
                <Sparkles size={16} className="text-orange-500" /> Inspirasi SMART
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-stone-700 text-stone-300" : "bg-stone-100 text-stone-500"}`}>{SMART_GOALS.length}</span>
              </div>
              <ChevronDown size={18} className={`transition-transform duration-300 ${goalForm ? "rotate-180" : ""} ${textSub}`} />
            </div>
            
            {goalForm && (
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                <div className={`text-sm mb-4 ${textSub}`}>Klik untuk tambahkan langsung sebagai tujuan baru Anda.</div>
                <div className="flex flex-wrap gap-2.5">
                  {SMART_GOALS.map((sg, idx) => (
                    <button 
                      key={idx}
                      onClick={() => addGoal(sg)}
                      className={`px-3 py-2 rounded-xl text-sm text-left border transition-all ${isDark ? "bg-[#1c1917] border-stone-700 text-stone-300 hover:border-orange-500 hover:text-orange-400" : "bg-white border-stone-200 text-stone-700 hover:border-orange-400 hover:text-orange-600 hover:shadow-sm"}`}
                    >
                      + {sg}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className={`text-center py-12 ${textSub}`}>
                Belum ada tujuan yang aktif. Mulai tambahkan di atas!
              </div>
            ) : (
              goals.map((g) => {
                const subCount = g.subItems?.length || 0;
                const subDone = (g.subItems || []).filter(s => s.done).length;
                const progress = subCount > 0 ? Math.round((subDone / subCount) * 100) : (g.done ? 100 : 0);
                
                return (
                  <Card key={g.id} className={`p-0 overflow-hidden border transition-all ${isDark ? "border-stone-700" : "border-stone-200"}`}>
                    <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${isDark ? "bg-[#292524] border-stone-700" : "bg-white border-stone-100"}`}>
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => toggleGoal(g.id)}
                          className={`w-6 h-6 rounded border shrink-0 flex items-center justify-center mt-0.5 transition-colors ${g.done ? (isDark ? "bg-stone-300 border-stone-300 text-stone-900" : "bg-stone-900 border-stone-900 text-white") : (isDark ? "border-stone-600 bg-[#1c1917]" : "border-stone-300 bg-stone-50")}`}
                        >
                          {g.done && <CheckCircle2 size={14} />}
                        </button>
                        <div>
                          <div className={`font-semibold text-[15px] ${g.done ? `line-through opacity-60 ${textSub}` : textMain}`}>{g.text}</div>
                          <div className={`text-xs mt-1 ${textSub}`}>Progres otomatis dari sub-item</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
                        <div className="flex flex-col items-end gap-1.5 w-32">
                          <div className="flex justify-between w-full text-[11px] font-medium">
                            <span className={textMain}>{progress}%</span>
                            <span className={textSub}>{subDone}/{subCount} items</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-stone-800" : "bg-stone-100"}`}>
                            <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <button onClick={() => removeGoal(g.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-red-900/40 text-stone-500 hover:text-red-400" : "hover:bg-red-50 text-stone-400 hover:text-red-500"}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    
                    <div className={`p-4 sm:p-5 ${isDark ? "bg-[#1c1917]" : "bg-stone-50"}`}>
                      <div className="space-y-2 mb-3">
                        {(g.subItems || []).map((sub) => (
                          <div key={sub.id} className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={sub.done} 
                              onChange={() => toggleGoalSubItem(g.id, sub.id)} 
                              className="accent-orange-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={`text-sm flex-1 ${sub.done ? `line-through opacity-60 ${textSub}` : textMain}`}>{sub.text}</span>
                            <button onClick={() => removeGoalSubItem(g.id, sub.id)} className={`opacity-50 hover:opacity-100 ${textSub}`}><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 max-w-sm mt-4">
                        <input 
                          id={`sub-input-${g.id}`}
                          placeholder="Tambah sub-item..." 
                          className={`flex-1 text-sm bg-transparent border-b outline-none px-1 py-1 transition-colors focus:border-orange-500 ${isDark ? "border-stone-700 text-stone-100 placeholder:text-stone-600" : "border-stone-300 text-stone-900 placeholder:text-stone-400"}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addSubItemToGoal(g.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById(`sub-input-${g.id}`);
                            if(input) {
                              addSubItemToGoal(g.id, input.value);
                              input.value = "";
                            }
                          }}
                          className={`px-3 py-1 rounded text-xs font-medium ${isDark ? "bg-stone-800 text-stone-300 hover:bg-stone-700" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === "jadwal") {
    const DAY_ABBR3 = lang === "ID" ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const WEEKDAY_MON = lang === "ID" ? ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const HOURS = [];
    for (let h = GRID_HOUR_START; h <= GRID_HOUR_END; h++) HOURS.push(h);

    const anchorDate = gridAnchorKey ? fromKey(gridAnchorKey) : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeekMon = (d) => {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), diff);
    };

    let gridDates = [anchorDate];
    if (jadwalView === "3hari") gridDates = [0, 1, 2].map((i) => addDays(anchorDate, i));
    else if (jadwalView === "pekan") gridDates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(startOfWeekMon(anchorDate), i));

    const shiftView = (dir) => {
      if (jadwalView === "bulan") {
        setGridAnchorKey(dateKey(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + dir, 1)));
      } else {
        const n = jadwalView === "hari" ? 1 : jadwalView === "3hari" ? 3 : 7;
        setGridAnchorKey(dateKey(addDays(anchorDate, dir * n)));
      }
    };

    const prayerTimesFor = (d) => {
      const raw = computeTimes(d, loc.lat, loc.lng, loc.tz, method, madhab);
      return PRAYER_KEYS.map((k, i) => ({ key: k, label: PRAYER_LABELS[i], t: applyAdjust(raw[k], adjust[k]) }));
    };

    const getNavLabel = () => {
      if (jadwalView === "bulan") return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
      if (jadwalView === "pekan") return "Pekan Ini";
      if (jadwalView === "3hari") return `${anchorDate.getDate()} - ${addDays(anchorDate, 2).getDate()} ${MONTH_NAMES[anchorDate.getMonth()].slice(0,3)}`;
      return "Hari Ini";
    };

    return (
      <div className={`min-h-screen ${bg} font-sans transition-colors pb-20`}>
        <div className="max-w-6xl mx-auto px-5 py-6">
          <Header title="Jadwal & To-Do" />

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className={`inline-flex rounded-full border shadow-sm p-1 gap-1 ${isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}`}>
              {[{ id: "hari", label: "Hari" }, { id: "3hari", label: "3 Hari" }, { id: "pekan", label: "Pekan" }, { id: "bulan", label: "Bulan" }].map((o) => (
                <button key={o.id} onClick={() => setJadwalView(o.id)} className={`px-4 sm:px-6 py-1.5 text-sm font-medium rounded-full transition-colors ${jadwalView === o.id ? (isDark ? "bg-stone-100 text-stone-900 shadow-sm" : "bg-stone-900 text-white shadow-sm") : `hover:bg-stone-100 dark:hover:bg-stone-700 ${textMain}`}`}>
                  {o.label}
                </button>
              ))}
            </div>

            <div className="flex flex-row items-center justify-center gap-3 w-full flex-wrap">
              <div className={`flex items-center border rounded-full shadow-sm p-0.5 sm:p-1 shrink-0 ${isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-200"}`}>
                <button onClick={() => shiftView(-1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-stone-700" : "hover:bg-stone-100"}`}><ChevronLeft size={16} className={isDark ? "text-stone-300" : "text-stone-500"} /></button>
                <button onClick={() => setGridAnchorKey(null)} className={`px-3 sm:px-4 py-1 text-sm font-medium rounded-full transition-colors min-w-[90px] ${isDark ? "hover:bg-stone-700" : "hover:bg-stone-100"}`}>
                  {getNavLabel()}
                </button>
                <button onClick={() => shiftView(1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-stone-700" : "hover:bg-stone-100"}`}><ChevronRight size={16} className={isDark ? "text-stone-300" : "text-stone-500"} /></button>
              </div>
              
              <div className={`flex items-center text-xs font-medium border rounded-full overflow-hidden shadow-sm shrink-0 ${isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}`}>
                <span className="px-3 text-stone-400 hidden sm:inline">TAMPILKAN:</span>
                <button onClick={() => setShowPrayerGrid(v=>!v)} className={`px-3 py-2 transition-colors ${showPrayerGrid ? (isDark ? "bg-green-900/40 text-green-400" : "bg-green-50 text-green-600") : `hover:bg-stone-50 dark:hover:bg-stone-700 ${textMain}`}`}>Sholat</button>
                <button onClick={() => setShowFastingGrid(v=>!v)} className={`px-3 py-2 border-l ${isDark ? "border-stone-700" : "border-stone-100"} transition-colors ${showFastingGrid ? (isDark ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600") : `hover:bg-stone-50 dark:hover:bg-stone-700 ${textMain}`}`}>Puasa</button>
                <button onClick={() => setShowHolidayGrid(v=>!v)} className={`px-3 py-2 border-l ${isDark ? "border-stone-700" : "border-stone-100"} transition-colors ${showHolidayGrid ? (isDark ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600") : `hover:bg-stone-50 dark:hover:bg-stone-700 ${textMain}`}`}>Libur</button>
              </div>
            </div>
          </div>

          {jadwalView !== "bulan" && (
            <Card className={`p-0 overflow-x-auto ${cardOverride} shadow-sm border border-stone-200 relative`}>
              <div style={{ display: "grid", gridTemplateColumns: `50px repeat(${gridDates.length}, minmax(140px, 1fr))` }}>
                <div className={`sticky left-0 z-40 border-b border-r min-h-[90px] ${isDark ? "bg-[#292524] border-stone-700" : "bg-white border-stone-100"}`} />
                {gridDates.map((d) => {
                  const key = dateKey(d);
                  const isToday = key === todayKey;
                  const holiday = showHolidayGrid ? ID_HOLIDAYS[key] : null;
                  const fasting = showFastingGrid ? getFastingEvents(d, hijriOffset) : [];
                  return (
                    <div key={key} className={`text-center py-3 border-b border-l flex flex-col items-center justify-start min-h-[90px] ${isDark ? "bg-[#1c1917] border-stone-700" : "bg-stone-50 border-stone-100"}`}>
                      <div className={`text-[11px] font-medium tracking-wider mb-1 ${isToday ? "text-orange-500" : holiday ? "text-red-500" : textSub}`}>
                        {DAY_NAMES[d.getDay()].slice(0, 3)}
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${isToday ? "text-orange-500" : holiday ? "text-red-500" : textMain}`}>
                        {d.getDate()}
                      </div>
                      <div className="flex flex-col gap-0.5 w-full px-2 items-center justify-center">
                        {holiday && (
                          <div className="text-[10px] font-bold text-red-500 truncate max-w-[95%] leading-tight" title={holiday}>
                            {holiday}
                          </div>
                        )}
                        {fasting.map((f, idx) => (
                          <div key={idx} className="text-[10px] font-bold text-blue-500 truncate max-w-[95%] leading-tight" title={f.name}>
                            {f.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className={`relative border-r pt-2 sticky left-0 z-30 ${isDark ? "bg-[#292524] border-stone-700" : "bg-white border-stone-100"}`}>
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: GRID_ROW_H }} className={`text-[10px] ${textSub} pr-2 text-right -translate-y-2`}>
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {gridDates.map((d) => {
                  const key = dateKey(d);
                  const items = activitiesOn(key);
                  const prayers = showPrayerGrid ? prayerTimesFor(d) : [];
                  
                  return (
                    <div key={key} className={`relative border-l ${isDark ? "bg-[#1c1917] border-stone-700" : "bg-white border-stone-100"}`} style={{ height: GRID_ROW_H * HOURS.length }}>
                      {HOURS.map((h, i) => (
                        <div key={h} data-zone-type="slot" data-zone-value={`${key}|${h}`}
                          onDoubleClick={() => {
                            setActivityDraft({ title: "", time: `${String(h).padStart(2, "0")}:00`, category: "Personal", status: "todo_today" });
                            setActivityForm(key);
                            setShowAddPopup(true);
                          }}
                          className={`absolute left-0 right-0 border-b border-dashed cursor-crosshair transition-colors ${isDark ? "border-stone-700 hover:bg-stone-800" : "border-stone-100 hover:bg-stone-50"} ${isZoneActive("slot", `${key}|${h}`) ? (isDark ? "bg-orange-900/30" : "bg-orange-50") : ""}`}
                          style={{ top: i * GRID_ROW_H, height: GRID_ROW_H }}
                        />
                      ))}

                      {prayers.map((p) => {
                        const hf = p.t.h + p.t.m / 60;
                        if (hf < GRID_HOUR_START || hf > GRID_HOUR_END) return null;
                        const top = (hf - GRID_HOUR_START) * GRID_ROW_H;
                        return (
                          <div key={p.key} className="absolute left-0 right-0 px-1.5 pointer-events-none z-10" style={{ top: top - 7 }}>
                            <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-bold text-green-500">
                              <span className="truncate">{p.label}</span><span>{fmt(p.t)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {items.map((a) => {
                        const hf = timeToHourFloat(a.time);
                        if (hf === null || hf < GRID_HOUR_START || hf > GRID_HOUR_END) return null;
                        const top = (hf - GRID_HOUR_START) * GRID_ROW_H;
                        const height = Math.max(40, GRID_ROW_H - 4);
                        return (
                          <div key={a.id} onPointerDown={(e) => startDrag(a, e)} onClick={(e) => handleItemClick(e, a)}
                            style={{ position: "absolute", top: top + 2, left: 4, right: 4, height, touchAction: "none" }}
                            className={`rounded-lg px-2.5 py-1.5 text-xs cursor-grab active:cursor-grabbing overflow-hidden shadow-sm border transition-colors z-20 flex flex-col justify-start gap-0.5 ${getStatusColor(a.status, isDark)}`}
                          >
                            <div className={`font-semibold truncate leading-tight ${a.done ? "line-through opacity-70" : ""}`}>{a.title}</div>
                            <div className="text-[9px] font-medium opacity-80 truncate">{a.category}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {jadwalView === "bulan" && (() => {
            const y = anchorDate.getFullYear(), m = anchorDate.getMonth();
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            const firstWeekday = new Date(y, m, 1).getDay();
            const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1;
            const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
            const cells = Array.from({ length: totalCells }, (_, i) => {
              const dayNum = i - leadingBlanks + 1;
              return dayNum >= 1 && dayNum <= daysInMonth ? new Date(y, m, dayNum) : null;
            });
            return (
              <Card className={`p-0 overflow-hidden border shadow-sm ${cardOverride} ${isDark ? "border-stone-700" : "border-stone-200"}`}>
                <div className={`grid grid-cols-7 gap-px ${isDark ? "bg-stone-700" : "bg-stone-200"}`}>
                  {WEEKDAY_MON.map((w) => (
                    <div key={w} className={`text-center text-xs font-semibold py-3 ${isDark ? "bg-[#1c1917] text-stone-400" : "bg-stone-50 text-stone-500"}`}>{w.slice(0,3)}</div>
                  ))}
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} className={`min-h-[120px] ${isDark ? "bg-[#292524]" : "bg-white"}`} />;
                    const key = dateKey(d);
                    const items = activitiesOn(key);
                    const isToday = key === todayKey;
                    const holiday = showHolidayGrid ? ID_HOLIDAYS[key] : null;
                    const fasting = showFastingGrid ? getFastingEvents(d, hijriOffset) : [];
                    const isPopupActive = monthPopupDateKey === key;
                    
                    return (
                      <div key={i} data-zone-type="date" data-zone-value={key} onClick={() => setMonthPopupDateKey(key)}
                        className={`min-h-[120px] p-2 cursor-pointer transition-colors relative flex flex-col gap-1 ${isDark ? "bg-[#292524] hover:bg-stone-800" : "bg-white hover:bg-stone-50"} ${isZoneActive("date", key) ? (isDark ? "bg-orange-900/30" : "bg-orange-50") : ""} ${isPopupActive ? "ring-2 ring-inset ring-orange-500 bg-orange-50/10" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 ${isToday ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : holiday ? "text-red-500" : textMain}`}>{d.getDate()}</div>
                        </div>
                        
                        <div className="space-y-0.5 mt-1 z-10 w-full relative">
                          {holiday && <div className="text-[10px] font-bold text-red-500 truncate text-center leading-tight">{holiday}</div>}
                          {fasting.map((f, idx) => (
                             <div key={`f-${idx}`} className="text-[10px] font-bold text-blue-500 truncate text-center leading-tight">{f.name}</div>
                          ))}
                          
                          {items.slice(0, 3).map((a) => (
                            <div key={a.id} 
                                 onPointerDown={(e) => { e.stopPropagation(); startDrag(a, e); }}
                                 onClick={(e) => handleItemClick(e, a)}
                                 className={`text-[9px] truncate rounded px-1.5 py-0.5 font-medium border shadow-sm cursor-grab active:cursor-grabbing touch-none ${getStatusColor(a.status, isDark)} ${a.done ? "line-through opacity-70" : ""}`}>
                               {a.title}
                            </div>
                          ))}
                          {items.length > 3 && <div className={`text-[9px] font-medium text-center ${textSub}`}>+{items.length - 3} lainnya</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })()}
        </div>

        {monthPopupDateKey && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setMonthPopupDateKey(null); }}>
            <div className={`w-full sm:max-w-md overflow-hidden flex flex-col shadow-2xl transition-transform animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:rounded-2xl ${isDark ? "bg-[#1c1917] border border-stone-700" : "bg-white"} max-h-[85vh]`}>
              {(() => {
                const pd = fromKey(monthPopupDateKey);
                const items = activitiesOn(monthPopupDateKey);
                return (
                  <>
                    <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${isDark ? "bg-[#292524] border-stone-700" : "bg-stone-50 border-stone-100"}`}>
                      <div>
                        <div className={`text-xs font-semibold tracking-wider ${textSub}`}>{DAY_NAMES[pd.getDay()].toUpperCase()}</div>
                        <div className={`text-xl font-bold ${textMain}`}>{pd.getDate()} {MONTH_NAMES[pd.getMonth()]} {pd.getFullYear()}</div>
                      </div>
                      <button onClick={() => setMonthPopupDateKey(null)} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-stone-800 text-stone-400" : "bg-stone-200 text-stone-500"}`}><X size={16} /></button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <div className={`text-center py-8 ${textSub}`}>Tidak ada acara.</div>
                        ) : (
                          items.map(a => (
                            <div 
                              key={a.id}
                              onClick={() => {
                                setGridAnchorKey(monthPopupDateKey);
                                setJadwalView("hari");
                                setMonthPopupDateKey(null);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border group ${isDark ? "hover:bg-stone-800 border-transparent hover:border-stone-700" : "hover:bg-stone-50 border-transparent hover:border-stone-100"}`}
                            >
                              <div className={`w-1.5 h-10 rounded-full shrink-0 ${getStatusColor(a.status, isDark).split(" ")[0]} border opacity-80`} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold truncate ${a.done ? (isDark ? 'text-stone-500 line-through' : 'text-stone-400 line-through') : textMain}`}>{a.title}</div>
                                <div className={`text-xs font-medium flex gap-2 mt-0.5 ${textSub}`}>
                                  <span>{a.time}</span>
                                  <span>•</span>
                                  <span>{a.category}</span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className={`p-4 border-t ${isDark ? "bg-[#292524] border-stone-700" : "bg-stone-50 border-stone-100"}`}>
                      <button 
                        onClick={() => {
                          setGridAnchorKey(monthPopupDateKey);
                          setJadwalView("hari");
                          setMonthPopupDateKey(null);
                        }}
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}
                      >
                        Buka Detail Hari <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {(showAddPopup || showEditPopup) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) { setShowAddPopup(false); setShowEditPopup(false); }}}>
            <div className={`w-full max-w-sm rounded-2xl shadow-xl overflow-hidden ${isDark ? "bg-[#292524] border border-stone-700" : "bg-white"}`}>
              <div className={`px-5 py-4 border-b flex justify-between items-center ${isDark ? "border-stone-700" : "border-stone-100"}`}>
                <h3 className={`font-bold ${textMain}`}>{showAddPopup ? "Tambah Kegiatan" : "Edit Kegiatan"}</h3>
                <button onClick={() => { setShowAddPopup(false); setShowEditPopup(false); }} className={textSub}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={`text-xs font-semibold mb-1.5 block ${textSub}`}>Nama Kegiatan</label>
                  <input
                    autoFocus
                    value={showAddPopup ? activityDraft.title : editDraft.title}
                    onChange={(e) => showAddPopup ? setActivityDraft({ ...activityDraft, title: e.target.value }) : setEditDraft({...editDraft, title: e.target.value})}
                    placeholder="Contoh: Rapat Tim"
                    className={`w-full rounded-lg px-3 py-2 text-sm border outline-none ${isDark ? "bg-[#1c1917] border-stone-700 text-stone-100" : "bg-stone-50 border-stone-200"}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block ${textSub}`}>Waktu</label>
                    <input
                      type="time"
                      value={showAddPopup ? activityDraft.time : editDraft.time}
                      onChange={(e) => showAddPopup ? setActivityDraft({ ...activityDraft, time: e.target.value }) : setEditDraft({...editDraft, time: e.target.value})}
                      className={`w-full rounded-lg px-3 py-2 text-sm border outline-none ${isDark ? "bg-[#1c1917] border-stone-700 text-stone-100" : "bg-stone-50 border-stone-200"}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block ${textSub}`}>Kategori</label>
                    <select
                      value={showAddPopup ? activityDraft.category : editDraft.category}
                      onChange={(e) => {
                        if (e.target.value === "__new__") setShowNewCategoryInput(true);
                        else showAddPopup ? setActivityDraft({ ...activityDraft, category: e.target.value }) : setEditDraft({...editDraft, category: e.target.value});
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-sm border outline-none ${isDark ? "bg-[#1c1917] border-stone-700 text-stone-100" : "bg-stone-50 border-stone-200"}`}
                    >
                      {activityCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__new__">+ Kategori Baru</option>
                    </select>
                  </div>
                </div>
                {showNewCategoryInput && (
                  <div className="flex gap-2">
                    <input
                      value={newCategoryDraft}
                      onChange={(e) => setNewCategoryDraft(e.target.value)}
                      placeholder="Nama kategori..."
                      className={`flex-1 rounded-lg px-3 py-2 text-sm border outline-none ${isDark ? "bg-[#1c1917] border-stone-700 text-stone-100" : "bg-stone-50 border-stone-200"}`}
                    />
                    <button onClick={addActivityCategory} className={`px-4 text-sm font-medium rounded-lg ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>OK</button>
                  </div>
                )}
                <div>
                  <label className={`text-xs font-semibold mb-1.5 block ${textSub}`}>Status</label>
                  <select
                    value={showAddPopup ? activityDraft.status : editDraft.status}
                    onChange={(e) => showAddPopup ? setActivityDraft({ ...activityDraft, status: e.target.value }) : setEditDraft({...editDraft, status: e.target.value})}
                    className={`w-full rounded-lg px-3 py-2 text-sm border outline-none ${isDark ? "bg-[#1c1917] border-stone-700 text-stone-100" : "bg-stone-50 border-stone-200"}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label[lang]}</option>)}
                  </select>
                </div>
              </div>
              <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? "border-stone-700 bg-[#1c1917]" : "border-stone-100 bg-stone-50"}`}>
                {showEditPopup && (
                  <button onClick={() => removeActivity(editDraft.id)} className="mr-auto px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    Hapus
                  </button>
                )}
                <button onClick={() => { setShowAddPopup(false); setShowEditPopup(false); }} className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? "hover:bg-stone-800 text-stone-300" : "hover:bg-stone-200 text-stone-600"}`}>Batal</button>
                <button onClick={() => showAddPopup ? addActivity(activityForm) : updateActivity()} className={`px-5 py-2 text-sm font-medium rounded-lg ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {dragVisual && (
          <div className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium shadow-lg max-w-[70vw] truncate" style={{ left: dragVisual.x + 14, top: dragVisual.y + 14 }}>
            {dragVisual.label}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} font-sans transition-colors pb-10`}>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="https://di9i.my.id/apps/kreatiplan/icon-192.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${textMain}`}>{strings.appTitle}</h1>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 shrink-0 mt-1">
            <div className="text-right">
              <div className={`flex items-center gap-1.5 justify-end text-sm sm:text-base ${textMain} font-bold`}>
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 inline-block shrink-0" /> {hijriLabel}
              </div>
              <div className={`text-xs sm:text-base ${textSub} mt-0.5`}>{gregLabel}</div>
            </div>
            <button
              onClick={() => navigate("settings")}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isDark ? "border-stone-700 bg-[#292524] text-stone-300 hover:bg-stone-800" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        <Card className={`p-5 sm:p-8 ${cardOverride}`}>
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <div>
              <div className={`text-4xl sm:text-7xl font-black tracking-tight ${textMain}`}>
                {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-wider ${textSub} font-semibold mt-4 sm:mt-6`}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block shrink-0" /> {strings.nextPrayer}
              </div>
              <div className={`text-sm sm:text-base ${textMain} mt-1`}>
                {hoursUntil}h {minsRemain}m {strings.towards} {PRAYER_LABELS[nextIdx]}
              </div>
              <div className={`border-t my-3 sm:my-4 ${isDark ? "border-stone-700" : "border-stone-100"}`} />
              <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${textSub}`}>
                <MapPin size={14} className="shrink-0" /> {loc.label}
              </div>
            </div>

            <div>
              <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-wider ${textSub} font-semibold mb-3 sm:mb-4`}>
                <Sun size={13} /> {strings.prayerTimes}
              </div>
              <div className="space-y-2.5 sm:space-y-3.5">
                {PRAYER_KEYS.map((k, i) => (
                  <div key={k} className="flex items-center justify-between text-sm sm:text-lg">
                    <span className={textMain}>{PRAYER_LABELS[i]}</span>
                    <span className={`font-bold ${nextIdx === i ? "text-orange-500" : textMain}`}>{fmt(times[k])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className={`p-5 ${cardOverride}`}>
          <div className={`flex items-center gap-1.5 text-[11px] tracking-wider ${textSub} font-medium mb-2`}>
            <BookOpen size={12} /> {strings.hadithToday}
          </div>
          <div className={`text-right font-arabic text-lg leading-relaxed ${textMain}`} dir="rtl">{hadith.ar}</div>
          <div className={`text-sm ${textMain} mt-2`}>{hadith.id}</div>
          <div className={`text-xs ${textSub} mt-1`}>{hadith.src}</div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={cardOverride}>
            <div className="flex items-center justify-between px-5 pt-5 mb-2 cursor-pointer" onClick={() => navigate("jurnal")}>
              <div className={`flex items-center gap-2 font-semibold text-[15px] ${textMain}`}>
                <NotebookPen size={16} className="text-stone-500" /> {strings.journal}
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${isDark ? "bg-orange-900/30 border-orange-800 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-500"}`}>
                <Sparkles size={10} /> AI POLISH
              </span>
            </div>
            <div className="px-5 pb-5 space-y-2">
              <div className={`text-sm mb-3 ${textSub}`}>{strings.journalHint}</div>
              {journalEntries.length === 0 ? (
                <div className={`text-sm ${textSub} cursor-pointer`} onClick={() => navigate("jurnal")}>{strings.noJournal}</div>
              ) : (
                <div className={`text-sm line-clamp-2 ${textMain}`}>{journalEntries[0].text}</div>
              )}
              <button onClick={() => navigate("jurnal")} className={`w-full text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 mt-4 ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>
                <NotebookPen size={14} /> {strings.writeJournal}
              </button>
            </div>
          </Card>

          <Card className={cardOverride}>
            <CardHeader icon={Target} title={strings.goals} onClick={() => navigate("goals")} isDark={isDark} />
            <div className="px-5 pb-5 pt-2">
              {goals.length === 0 ? (
                <div className={`text-sm ${textSub} cursor-pointer`} onClick={() => navigate("goals")}>{strings.noGoals}</div>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 4).map((g) => {
                    const subCount = g.subItems?.length || 0;
                    const subDone = (g.subItems || []).filter(s => s.done).length;
                    const progress = subCount > 0 ? Math.round((subDone / subCount) * 100) : (g.done ? 100 : 0);
                    return (
                      <div key={g.id} className="w-full cursor-pointer" onClick={() => navigate("goals")}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-sm font-medium truncate pr-3 ${g.done ? `line-through opacity-50 ${textSub}` : textMain}`}>{g.text}</span>
                          <span className={`text-xs font-semibold shrink-0 ${textMain}`}>{progress}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-stone-800" : "bg-stone-100"}`}>
                          <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={cardOverride}>
            <CardHeader icon={Activity} title={strings.habits} onClick={() => navigate("habits")} isDark={isDark} />
            <div className="px-5 pb-5 pt-2">
              {habits.length === 0 && (
                <>
                  <div className={`text-sm ${textSub} cursor-pointer`} onClick={() => navigate("habits")}>{strings.noHabits}</div>
                  <div className={`border-t my-2 ${isDark ? "border-stone-800" : "border-stone-100"}`} />
                  <div className={`text-xs ${textSub} cursor-pointer`} onClick={() => navigate("habits")}>{strings.habitHint}</div>
                </>
              )}
              {habits.slice(0, 5).map((h) => (
                <label key={h.id} className="flex items-center justify-between text-sm py-1.5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={!!h.checkins?.[todayKey]} onChange={() => toggleHabitOn(h.id)} className="accent-orange-500 w-4 h-4" />
                    <span className={textMain}>{h.name}</span>
                  </span>
                  <span className={`text-xs ${textSub}`}>🔥{currentStreak(h, now)}</span>
                </label>
              ))}
              {habits.length > 0 && (
                <div className="text-xs text-orange-500 font-medium mt-4 cursor-pointer" onClick={() => navigate("habits")}>
                  Kelola semua habits →
                </div>
              )}
            </div>
          </Card>

          <Card className={cardOverride}>
            <CardHeader icon={Calendar} title={strings.jadwalTitle} onClick={() => navigate("jadwal")} isDark={isDark} />
            <div className="px-5 pb-5 pt-2">
              {activitiesOn(todayKey).length === 0 ? (
                <div className={`text-sm ${textSub} cursor-pointer`} onClick={() => navigate("jadwal")}>{strings.noSchedule}</div>
              ) : (
                <div className="space-y-3">
                  {activitiesOn(todayKey).slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("jadwal")}>
                      <div className={`w-1 h-10 rounded-full shrink-0 ${getStatusColor(a.status, isDark).split(' ')[0]}`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate ${a.done ? `line-through opacity-50 ${textSub}` : textMain}`}>{a.title}</div>
                        <div className={`text-[10px] ${textSub}`}>{a.time || "--:--"} • {a.category}</div>
                      </div>
                    </div>
                  ))}
                  {activitiesOn(todayKey).length > 4 && (
                    <div className="text-xs text-orange-500 font-medium pt-2 cursor-pointer" onClick={() => navigate("jadwal")}>
                      Lihat semua jadwal →
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className={`p-5 ${cardOverride}`}>
          <div className={`font-semibold text-[15px] mb-3 ${textMain}`}>{strings.dzikirDaily}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(DZIKIR_DATA).map(([key, d]) => (
              <div key={key} className={`border rounded-xl transition-colors ${isDark ? "border-stone-700 bg-[#1c1917]" : "border-stone-200 bg-white"}`}>
                <button
                  onClick={() => setDzikirOpen(dzikirOpen === key ? null : key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <div className={`text-sm font-semibold ${textMain}`}>{d.title}</div>
                    <div className={`text-xs ${textSub}`}>{d.subtitle}</div>
                  </div>
                  <ChevronDown size={14} className={`text-stone-400 transition-transform ${dzikirOpen === key ? "rotate-180" : ""}`} />
                </button>
                {dzikirOpen === key && (
                  <div className={`px-4 pb-3 space-y-2 border-t pt-2 ${isDark ? "border-stone-700" : "border-stone-100"}`}>
                    {d.items.map((it, i) => (
                      <div key={i}>
                        <div className={`text-right text-sm leading-relaxed ${textMain}`} dir="rtl">{it.ar}</div>
                        <div className={`text-xs ${textSub}`}>{it.id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className={`p-5 ${cardOverride}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className={`flex items-center gap-2 font-semibold text-[15px] ${textMain}`}>
                <Timer size={16} className="text-stone-500" /> {strings.focusTimer}
              </div>
              <div className={`text-4xl font-bold tracking-tight mt-2 ${textMain}`}>{timerMM}:{timerSS}</div>
              <div className={`text-sm ${textSub}`}>
                Pomodoro · {timerWork} / {timerBreak} m · {timerPhase === "work" ? "Fokus" : "Istirahat"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetTimer} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-stone-700 hover:bg-stone-800" : "border-stone-200 hover:bg-stone-50"}`}>
                <RotateCcw size={15} className="text-stone-500" />
              </button>
              <button onClick={toggleTimer} className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"}`}>
                {timerRunning ? <Pause size={14} /> : <Play size={14} />} {timerRunning ? strings.pause : strings.start}
              </button>
            </div>
          </div>
        </Card>
      </div>
      
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in">
          <div className="bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}