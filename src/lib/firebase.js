import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// Orang tua login pakai NIK anak; di Firebase Auth disimpan sebagai email
// sintetis "<nik>@<domain>" dengan kata sandi sebagai password.
export const ORTU_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ORTU_EMAIL_DOMAIN || "sipanak.app";

// Petugas (admin/nakes/kader) login pakai username; di Firebase Auth disimpan
// sebagai email sintetis "<username>@petugas.<domain>" — subdomain "petugas"
// membedakan dari akun orang tua dan dipakai firestore.rules.
export const PETUGAS_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_PETUGAS_EMAIL_DOMAIN || `petugas.${ORTU_EMAIL_DOMAIN}`;

export const ortuEmail = (nik) => `${nik}@${ORTU_EMAIL_DOMAIN}`;
export const petugasEmail = (username) => `${username}@${PETUGAS_EMAIL_DOMAIN}`;

let db = null;
let auth = null;
if (isFirebaseConfigured) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

// App Firebase kedua: dipakai petugas untuk membuat/menghapus/mengubah akun
// Auth orang tua & petugas lain tanpa menimpa sesi auth utama
// (createUser* auto-login user tsb).
let secondaryAuth = null;
export function getSecondaryAuth() {
  if (!isFirebaseConfigured) return null;
  if (!secondaryAuth) {
    const existing = getApps().find((a) => a.name === "sipanak-secondary");
    secondaryAuth = getAuth(
      existing || initializeApp(firebaseConfig, "sipanak-secondary")
    );
  }
  return secondaryAuth;
}

export { db, auth };
