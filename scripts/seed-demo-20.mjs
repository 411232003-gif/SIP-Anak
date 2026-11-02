import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { evaluasiUkur } from "../src/lib/growth.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
const db = getFirestore(app);
const auth = getAuth(app);
const app2 =
  getApps().find((a) => a.name === "seed-secondary") ||
  initializeApp(app.options, "seed-secondary");
const auth2 = getAuth(app2);

const ORTU_DOMAIN = env.NEXT_PUBLIC_ORTU_EMAIL_DOMAIN || "sipanak.app";
const PETUGAS_DOMAIN = env.NEXT_PUBLIC_PETUGAS_EMAIL_DOMAIN || `petugas.${ORTU_DOMAIN}`;
const adminEmail = env.ADMIN_USERNAME.includes("@")
  ? env.ADMIN_USERNAME
  : `${env.ADMIN_USERNAME}@${PETUGAS_DOMAIN}`;

const pad = (n, w = 2) => String(n).padStart(w, "0");
const mk = (y, m) => `${y}-${pad(m)}`;
// 4 bulan terakhir termasuk bulan ini: [bulan-3, -2, -1, 0]
function lastMonths(n = 4) {
  const now = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(mk(d.getFullYear(), d.getMonth() + 1));
  }
  return out;
}
function dobFromAge(months, day = 12) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`;
}

// 20 anak: nama, jk, umurBln skrg, rw, rt, ibu
const ANAK = [
  ["Alya Putri Sari", "Perempuan", 14, "RW 01", "RT 02", "Sari Wulandari"],
  ["Bilal Ramadhan", "Laki-laki", 18, "RW 01", "RT 04", "Nur Halimah"],
  ["Citra Anindya", "Perempuan", 10, "RW 02", "RT 01", "Dewi Anggraini"],
  ["Damar Aksara", "Laki-laki", 22, "RW 02", "RT 05", "Rina Puspita"],
  ["Elvina Zahira", "Perempuan", 16, "RW 03", "RT 03", "Yanti Susanti"],
  ["Farhan Alkadri", "Laki-laki", 8, "RW 03", "RT 06", "Endang Lestari"],
  ["Gita Savitri", "Perempuan", 26, "RW 04", "RT 02", "Ratna Juwita"],
  ["Hafiz Pratama", "Laki-laki", 12, "RW 04", "RT 07", "Fitri Handayani"],
  ["Ibrahim Zaidan", "Laki-laki", 20, "RW 05", "RT 01", "Wulan Kusuma"],
  ["Kirana Maheswari", "Perempuan", 15, "RW 05", "RT 04", "Sri Rahayu"],
  ["Luthfi Hakim", "Laki-laki", 28, "RW 06", "RT 03", "Maya Kartika"],
  ["Naira Azalea", "Perempuan", 11, "RW 06", "RT 06", "Tuti Aprilianti"],
  ["Rafka Syahputra", "Laki-laki", 24, "RW 07", "RT 02", "Lilis Suryani"],
  ["Salsabila Azzahra", "Perempuan", 17, "RW 07", "RT 05", "Neneng Sari"],
  ["Zaidan Alfarizi", "Laki-laki", 30, "RW 01", "RT 07", "Rukiyah Santoso"],
  ["Aisyah Khadijah", "Perempuan", 13, "RW 02", "RT 03", "Halimah Ningsih"],
  ["Bara Dirgantara", "Laki-laki", 19, "RW 03", "RT 01", "Rohmah Widya"],
  ["Elang Pradipta", "Laki-laki", 25, "RW 04", "RT 05", "Suminah Astuti"],
  ["Farah Kamila", "Perempuan", 21, "RW 05", "RT 07", "Oom Komariyah"],
  ["Kenzo Arkananta", "Laki-laki", 16, "RW 06", "RT 01", "Dedeh Kurnia"],
];

// 5 anak pertama punya riwayat ukur: [bb0,bb1,bb2,bb3] & [tb0..tb3]
// (bulan-3 → bulan ini); dirancang agar statusnya bervariasi
const RIWAYAT = {
  0: { bb: [8.2, 8.9, 9.5, 10.1], tb: [68, 70.5, 73, 75.5], note: "normal" },
  1: { bb: [7.4, 7.8, 8.3, 8.7], tb: [64, 65.5, 66.8, 68], note: "stunting (TB < -2SD)" },
  2: { bb: [6.8, 7.0, 7.2, 7.4], tb: [65, 67.5, 70, 72.5], note: "BB kurang" },
  3: { bb: [8.5, 9.2, 9.8, 9.8], tb: [71, 73.5, 76, 78.5], note: "BB stagnan (2T)" },
  4: { bb: [9.0, 9.7, 10.4, 11.0], tb: [74, 77, 79.5, 82], note: "normal" },
};

const IMUN_MIN = { hb0: 0, bcg: 0, polio1: 0, dpt1: 2, polio2: 2, dpt2: 3, polio3: 3, dpt3: 4, polio4: 4, ipv: 4, campak: 9, dpt4: 18, campak2: 18 };

const usedNama = new Set();

async function main() {
  console.log("Login admin...");
  await signInWithEmailAndPassword(auth, adminEmail, env.ADMIN_PASSWORD);
  const snap = await getDocs(collection(db, "anak"));
  const nikAda = new Set(snap.docs.map((d) => d.id));
  console.log(`Anak di DB: ${nikAda.size}. Membuat 20 anak demo...`);

  const bulanList = lastMonths(4);
  const blnIni = bulanList[3];
  const hasil = [];

  for (let i = 0; i < ANAK.length; i++) {
    const [nama, jk, umur, rw, rt, ibu] = ANAK[i];
    const dd = jk === "Perempuan" ? 41 + (i % 20) : 1 + (i % 20);
    const nik = `317304${pad(dd)}${pad((i % 12) + 1)}${pad(24 + (i % 3))}${pad(3000 + i, 4)}`;
    if (nikAda.has(nik)) { console.log(`skip ${nama} (NIK ada)`); continue; }
    const dob = dobFromAge(umur);
    const pin = String(100000 + ((i + 1) * 137791) % 900000);
    const anak = {
      nama, nik, jenisKelamin: jk, tanggalLahir: dob,
      namaIbu: ibu, namaAyah: "", rw, rt,
      alamat: `Jl. Duri Selatan No. ${10 + i}`,
      noTelp: `08${pad(10 + i)}${pad(1000 + i * 7, 8).slice(0, 8)}`,
      bbLahir: (2.7 + (i % 5) * 0.2).toFixed(1),
      tbLahir: (48 + (i % 4)).toFixed(1),
      pin, createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "anak", nik), anak);
    try {
      await createUserWithEmailAndPassword(auth2, `${nik}@${ORTU_DOMAIN}`, pin);
      await signOut(auth2);
    } catch {}

    // kehadiran bulan ini → langsung bisa scan & input ukur
    await setDoc(doc(db, "kehadiran", `${nik}_${blnIni}`), {
      nik, nama, rw, rt, bulan: blnIni,
      tanggal: `${blnIni}-15`, createdAt: new Date().toISOString(),
    });

    // riwayat ukur untuk 5 anak pertama
    const rwt = RIWAYAT[i];
    if (rwt) {
      for (let m = 0; m < 4; m++) {
        const umurUkur = umur - (3 - m);
        if (umurUkur < 0) continue;
        const ev = evaluasiUkur(
          { anak: { jenisKelamin: jk, umurUkur }, bb: rwt.bb[m], tb: rwt.tb[m] }
        );
        await setDoc(doc(db, "pengukuran", `${nik}_${bulanList[m]}`), {
          nik, bulan: bulanList[m], nama, rw, rt, jenisKelamin: jk,
          umurBln: umurUkur,
          bb: String(rwt.bb[m]), tb: String(rwt.tb[m]),
          lk: (32 + umurUkur * 0.4).toFixed(1), lila: "",
          zBBU: ev.zBBU, zTBU: ev.zTBU, zBBTB: ev.zBBTB,
          sBBU: ev.sBBU, sTBU: ev.sTBU, sBBTB: ev.sBBTB,
          tanggal: `${bulanList[m]}-15`,
          updatedAt: new Date().toISOString(),
        });
      }
      // imunisasi yang seharusnya sudah diberikan
      for (const [vk, vUmur] of Object.entries(IMUN_MIN)) {
        if (umur >= vUmur) {
          await setDoc(doc(db, "imunisasi", `${nik}_${vk}`), {
            nik, vaksin: vk, nama, rw, rt,
            namaVaksin: vk, tanggal: `${bulanList[1]}-10`, bulan: bulanList[1],
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    hasil.push({ nama, nik, pin, umur, featured: Boolean(rwt), note: rwt?.note });
    console.log(`+ ${nama} ${rwt ? `★ ${rwt.note}` : ""}`);
  }

  console.log("\n=== AKUN ORTU (NIK + PIN) ===");
  for (const h of hasil) {
    console.log(`${h.featured ? "★" : " "} ${h.nik}  PIN:${h.pin}  ${h.nama} (${h.umur} bln)${h.note ? " — " + h.note : ""}`);
  }
  console.log("\n★ = punya riwayat ukur 4 bulan, grafiknya langsung terlihat");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
