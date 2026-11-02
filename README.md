# SIP-Anak — Sistem Informasi Posyandu Anak

Aplikasi web untuk digitalisasi Posyandu: **KMS digital** (grafik WHO BB/U & TB/U),
**imunisasi**, **peringatan dini stunting**, dan **pemantauan ibu hamil/nifas**.

Next.js 16 (App Router) · Tailwind CSS 4 · Firebase Auth + Firestore · Recharts · PWA.

## Peran pengguna

| Peran | Login | Akses |
|---|---|---|
| Orang tua | NIK anak + kata sandi | KMS digital, imunisasi, riwayat, edaran, notifikasi |
| Kader / Nakes | username/email + password | Absensi, timbang-ukur, imunisasi, jadwal, edaran, laporan |
| Admin | sama + role `admin` | semua petugas + kelola akun & profil posyandu |

## Menjalankan

```bash
npm install
cp env.example .env      # isi konfigurasi Firebase
npm run dev
```

Tanpa `.env` aplikasi berjalan dalam **mode demo** (data tersimpan di browser).

## Seed data contoh

Isi `ADMIN_USERNAME` & `ADMIN_PASSWORD` di `.env`, lalu:

```bash
npm run seed             # 60 anak + 12 ibu + pengukuran + imunisasi + jadwal
```

## Firestore

Koleksi: `users`, `anak`, `ibu`, `kehadiran`, `pengukuran`, `imunisasi`,
`kunjunganIbu`, `sesi`, `edaran`, `pushSubs`, `config/{profil,targets}`.
Aturan keamanan: `firestore.rules` (deploy via `firebase deploy`).

## Fitur utama

- **KMS digital**: kurva WHO -3SD/-2SD/median/+2SD, titik pengukuran anak,
  status gizi otomatis (BB/U, TB/U, BB/TB) — `src/lib/growth.js`.
- **Stunting early warning**: indikasi stunting, BB tidak naik (2T), gizi kurang,
  imunisasi belum lengkap.
- **Imunisasi**: 13 vaksin jadwal nasional, status jatuh tempo/terlambat/catch-up.
- **Field workflow**: scan QR E-KMS → absensi → input ukur → imunisasi.
- **Ibu hamil**: HPHT → usia kehamilan otomatis, input ANC (TD, LILA, TFU).
- **Laporan**: rekap per RW, tren bulanan, export Excel/PDF untuk Puskesmas.
- **PWA + push**: installable, offline cache, notifikasi jadwal/edaran/hasil ukur.
EOF