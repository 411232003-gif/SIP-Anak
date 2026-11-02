# SIP-Anak — Sistem Informasi Posyandu Anak

Next.js 16 (App Router, JavaScript) + Tailwind CSS 4 + Firebase (Auth + Firestore).
Fork-domain dari InterPulse (Posbindu) → Posyandu: KMS digital, imunisasi,
stunting early-warning, kesehatan ibu.

## Perintah
- `npm run dev` / `npm run build` / `npm run lint` / `npm run seed`

## Struktur domain
- Role: `petugas` (admin|nakes|kader, koleksi `users`) & `ortu` (email sintetis
  `<nik-anak>@sipanak.app`).
- Koleksi: `anak`, `ibu`, `kehadiran`, `pengukuran`, `imunisasi`,
  `kunjunganIbu`, `sesi`, `edaran`, `pushSubs`, `config/{profil,targets}`, `users`.
- Data layer tunggal: `src/lib/db.js` (Firestore ↔ localStorage demo, `api.*`).
- WHO z-score: `src/lib/growth.js` (BB/U, TB/U, BB/TB + `peringatanDini`).
- Jadwal imunisasi: `src/lib/imunisasi.js`.
- Warna status gizi: `src/lib/giziLevel.js` (dipakai UI + exporter).
- Export PDF/Excel: `src/lib/exporter.js` (ExcelJS/jsPDF dynamic import).

## Catatan penting
- `NEXT_PUBLIC_ORTU_EMAIL_DOMAIN` di `.env` harus cocok dengan regex
  `isOrtuMail()` di `firestore.rules`.
- `head` di mesin ini BUKAN GNU head (tool HTTP) — jangan pakai.
- Mode demo (tanpa Firebase env): data di localStorage `sipanak_db_v1`.
