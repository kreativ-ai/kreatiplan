# KreatiPlan — React + Vite

Proyek ini sudah dikonversi menjadi struktur React + Vite.

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Build produksi

```bash
npm run build
npm run preview
```

Hasil build ada di folder `dist`.

## Struktur

- `src/main.jsx` — entry point React
- `src/KreatiPlan.jsx` — komponen aplikasi utama
- `src/index.css` — Tailwind dan CSS global
- `vite.config.js` — konfigurasi Vite
- `tailwind.config.js` — konfigurasi Tailwind

## Catatan Firebase

Konfigurasi Firebase dari file asli dipertahankan. Pastikan Authentication dan
Firestore sudah diaktifkan di Firebase Console. Untuk login Google, tambahkan
domain lokal/produksi ke **Authorized domains**.
