import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}

const app = getApps().length ? getApps()[0] : initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const auth = getAuth(app);

const ORTU_DOMAIN = env.NEXT_PUBLIC_ORTU_EMAIL_DOMAIN || "sipanak.app";
const PETUGAS_DOMAIN = env.NEXT_PUBLIC_PETUGAS_EMAIL_DOMAIN || `petugas.${ORTU_DOMAIN}`;
const ADMIN_USER = env.ADMIN_USERNAME;
const ADMIN_PASS = env.ADMIN_PASSWORD;

const email = ADMIN_USER.includes("@") ? ADMIN_USER : `${ADMIN_USER}@${PETUGAS_DOMAIN}`;
console.log(`[1] Project: ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
console.log(`[2] Login sebagai: ${email}`);

try {
  const cred = await signInWithEmailAndPassword(auth, email, ADMIN_PASS);
  console.log(`[3] Auth OK — uid: ${cred.user.uid}, email: ${cred.user.email}`);
  try {
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      console.log(`[4] DOKUMEN users/${cred.user.uid} TIDAK ADA → buat di Console dengan Document ID = UID ini, field role="admin"`);
    } else {
      console.log(`[4] Dokumen users:`, JSON.stringify(snap.data()));
      const role = snap.data().role;
      console.log(["admin", "nakes", "kader"].includes(role)
        ? `[5] Role "${role}" valid — seharusnya bisa login di aplikasi`
        : `[5] Role "${role}" TIDAK valid — harus admin/nakes/kader`);
    }
  } catch (e) {
    console.log(`[4] Gagal baca dokumen users: ${e.code || e.message} → kemungkinan firestore.rules belum di-deploy`);
  }
} catch (e) {
  console.log(`[3] Auth GAGAL: ${e.code || e.message}`);
  if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential")
    console.log(`    → Akun "${email}" tidak ditemukan/password salah. Pastikan email di Authentication persis sama.`);
}
process.exit(0);
