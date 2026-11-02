# Panduan Deploy SIP-Anak — Firebase + Vercel

## A. Setup Firebase (±10 menit, sekali saja)

1. **Login ulang CLI** (token sudah kedaluwarsa):
   ```bash
   firebase login --reauth
   ```

2. **Buat project baru** di https://console.firebase.google.com → *Add project*
   → nama bebas (mis. `SIP-Anak`), Google Analytics boleh dimatikan.

3. **Aktifkan Firestore**: Build → Firestore Database → *Create database*
   → mode **Native**, lokasi `asia-southeast2` (Jakarta) atau terdekat.

4. **Aktifkan Auth**: Build → Authentication → *Get started* →
   aktifkan provider **Email/Password**.

5. **Daftarkan Web App**: Project settings → *Add app* → `</>` Web →
   copy nilai `apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId` ke `.env` dan ke env vars Vercel (bagian C).

6. **Deploy rules** (dari folder proyek):
   ```bash
   firebase use --add            # pilih project SIP-Anak → alias "default"
   firebase deploy --only firestore:rules
   ```

7. **Buat admin pertama** — dua langkah:
   - Authentication → *Add user*: email `admin@petugas.sipanak.app`,
     password bebas (min. 6) → salin **UID**-nya.
   - Firestore → koleksi `users`, Document ID = UID tadi, field:
     `role="admin"`, `username="admin"`, `nama="Admin"`.
   - Login aplikasi: username `admin` + password tadi.

8. *(Opsional)* Isi `ADMIN_USERNAME`/`ADMIN_PASSWORD` di `.env` lalu
   `npm run seed` untuk data contoh (60 anak + 12 ibu + jadwal).

## B. Push ke GitHub

1. Buat repo baru di https://github.com/new → nama mis. `SIP-Anak` → **Private**, tanpa README.
2. Hubungkan & push:
   ```bash
   git remote set-url origin https://github.com/411232003-gif/SIP-Anak.git
   git push -u origin main
   ```

## C. Deploy Vercel (via GitHub)

1. https://vercel.com/new → *Import Git Repository* → pilih `SIP-Anak`.
2. Framework auto-terdeteksi **Next.js** — tidak perlu ubah apapun.
3. Buka *Environment Variables*, isi (samakan dengan `.env`):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_ORTU_EMAIL_DOMAIN        = sipanak.app
   NEXT_PUBLIC_PETUGAS_EMAIL_DOMAIN     = petugas.sipanak.app
   NEXT_PUBLIC_VAPID_KEY                (opsional — push notifikasi)
   VAPID_PRIVATE_KEY                    (opsional — server only)
   VAPID_SUBJECT                        (opsional)
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY       (opsional — wajib tambah domain Vercel di console reCAPTCHA)
   RECAPTCHA_SECRET_KEY                 (opsional — server only)
   ADMIN_USERNAME / ADMIN_PASSWORD      (opsional — hanya untuk `npm run seed` lokal)
   ```
4. *Deploy* → tunggu ±1–2 menit → dapat URL `https://sip-anak-xxx.vercel.app`.

## D. Setelah deploy

- **Auth domain**: Firebase Console → Authentication → Settings →
  *Authorized domains* → tambahkan domain Vercel Anda (Vercel domain
  biasanya sudah otomatis tidak diblokir, tapi custom domain wajib ditambah).
- **reCAPTCHA**: daftarkan domain Vercel di reCAPTCHA Admin Console, atau
  kosongkan `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` untuk menonaktifkan.
- **PWA**: akses lewat HTTPS Vercel → tombol "Install" muncul di browser HP.
- **Keamanan**: `.env` sudah di-gitignore; jangan pernah commit kredensial.
