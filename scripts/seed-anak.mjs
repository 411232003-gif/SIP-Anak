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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------- env ---------- */
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
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
const db = getFirestore(app);
const auth = getAuth(app);

// App Firebase kedua: createUser otomatis login sebagai user baru,
// jadi harus pakai instance terpisah supaya sesi admin tidak tertimpa.
const app2 =
  getApps().find((a) => a.name === "seed-secondary") ||
  initializeApp(app.options, "seed-secondary");
const auth2 = getAuth(app2);

// Domain email sintetis — harus sama dengan src/lib/firebase.js
const ORTU_DOMAIN = env.NEXT_PUBLIC_ORTU_EMAIL_DOMAIN || "sipanak.app";
const PETUGAS_DOMAIN =
  env.NEXT_PUBLIC_PETUGAS_EMAIL_DOMAIN || `petugas.${ORTU_DOMAIN}`;

// Kredensial admin untuk script — TANPA prefix NEXT_PUBLIC_ agar tidak
// ikut ter-bundle ke client. Boleh username (dipetakan ke email sintetis)
// atau email asli akun admin.
const ADMIN_USER = env.ADMIN_USERNAME;
const ADMIN_PASS = env.ADMIN_PASSWORD;
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error("Isi ADMIN_USERNAME & ADMIN_PASSWORD di .env terlebih dahulu.");
  process.exit(1);
}
const adminLoginEmail = ADMIN_USER.includes("@")
  ? ADMIN_USER
  : `${ADMIN_USER}@${PETUGAS_DOMAIN}`;

/* ---------- helpers ---------- */
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, w = 2) => String(n).padStart(w, "0");

const NAMA_ANAK_L = [
  "Arka", "Bara", "Damar", "Elang", "Faris", "Galang", "Hafiz", "Ibrahim",
  "Kenzo", "Luthfi", "Nabil", "Rafka", "Zaidan", "Adnan", "Bilal",
];
const NAMA_ANAK_P = [
  "Alya", "Bunga", "Citra", "Dewi", "Elvina", "Farah", "Gita", "Hana",
  "Kirana", "Laras", "Naira", "Raisa", "Zahra", "Aisyah", "Salsabila",
];
const NAMA_IBU = [
  "Siti", "Dewi", "Sri", "Rina", "Yanti", "Nur", "Aminah", "Ratna",
  "Endang", "Lilis", "Yuni", "Rahayu", "Sari", "Maya", "Fitri",
];
const MARGA = ["Santoso", "Hidayat", "Saputra", "Wijaya", "Prasetyo", "Nugroho", "Setiawan", "Rahmawati", "Putri", "Anggraini"];
const JALAN = [
  "Jl. Duri Selatan", "Jl. Jembatan Besi Raya", "Jl. Angke Jaya",
  "Jl. Krendang Raya", "Jl. Tanah Sereal", "Jl. Pekojan Raya",
  "Jl. Kalianyar", "Jl. Kopi Raya", "Jl. Tambora Raya", "Jl. Krukut",
];

const RWS = ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07"];
const RTS = ["RT 01", "RT 02", "RT 03", "RT 04", "RT 05", "RT 06", "RT 07", "RT 08"];

function monthKey(year, month) {
  return `${year}-${pad(month)}`;
}

// Umur acak 0–59 bulan → tanggal lahir
function genDob() {
  const now = new Date();
  const months = randi(0, 59);
  const d = new Date(now.getFullYear(), now.getMonth() - months, randi(1, 28));
  return { iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, months };
}

// BB/TB realistis untuk umur & jk (aproksimasi median WHO ±10%)
function genUkur(umurBln, jk) {
  const l = jk === "Laki-laki";
  const bbMed = Math.round((3.3 + umurBln * 0.26) * 10) / 10;
  const tbMed = Math.round((49.9 + umurBln * 1.05) * 10) / 10;
  const bb = Math.max(2.4, bbMed + rand(-bbMed * 0.12, bbMed * 0.1));
  const tb = Math.max(44, tbMed + rand(-tbMed * 0.08, tbMed * 0.08));
  return {
    bb: bb.toFixed(1),
    tb: tb.toFixed(1),
    lk: rand(30 + umurBln * 0.3, 34 + umurBln * 0.35).toFixed(1),
  };
}

const JADWAL = [
  ["hb0", 0], ["bcg", 0], ["polio1", 0], ["dpt1", 2], ["polio2", 2],
  ["dpt2", 3], ["polio3", 3], ["dpt3", 4], ["polio4", 4], ["ipv", 4],
  ["campak", 9], ["dpt4", 18], ["campak2", 18],
];

/* ---------- main ---------- */
const N_ANAK = 60;
const N_IBU = 12;

async function main() {
  console.log("Login sebagai admin...");
  await signInWithEmailAndPassword(auth, adminLoginEmail, ADMIN_PASS);
  console.log("Login admin OK.");

  const anakSnap = await getDocs(collection(db, "anak"));
  const nikAda = new Set(anakSnap.docs.map((d) => d.id));
  console.log(`Sudah ada: ${nikAda.size} anak.`);

  const now = new Date();
  const blnIni = monthKey(now.getFullYear(), now.getMonth() + 1);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const blnLalu = monthKey(prev.getFullYear(), prev.getMonth() + 1);

  let buat = 0;
  const usedNama = new Set();
  for (let i = 0; i < N_ANAK; i++) {
    const jk = Math.random() < 0.5 ? "Laki-laki" : "Perempuan";
    const nama = `${pick(jk === "Laki-laki" ? NAMA_ANAK_L : NAMA_ANAK_P)} ${pick(MARGA)}`;
    if (usedNama.has(nama)) continue;
    usedNama.add(nama);
    const dob = genDob();
    const dd = jk === "Perempuan" ? Number(dob.iso.slice(8, 10)) + 40 : Number(dob.iso.slice(8, 10));
    const nik = `317304${pad(dd)}${dob.iso.slice(5, 7)}${dob.iso.slice(2, 4)}${pad(1000 + i, 4)}`;
    if (nikAda.has(nik)) continue;

    const pin = String(randi(100000, 999999));
    const anak = {
      nama,
      nik,
      jenisKelamin: jk,
      tanggalLahir: dob.iso,
      namaIbu: `${pick(NAMA_IBU)} ${pick(MARGA)}`,
      namaAyah: `${pick(NAMA_ANAK_L)} ${pick(MARGA)}`,
      rw: pick(RWS),
      rt: pick(RTS),
      alamat: `${pick(JALAN)} No. ${randi(1, 60)}`,
      noTelp: `08${randi(10, 99)}${randi(1000, 9999)}${randi(1000, 9999)}`,
      bbLahir: rand(2.4, 4).toFixed(1),
      tbLahir: rand(46, 52).toFixed(1),
      pin,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "anak", nik), anak);
    try {
      await createUserWithEmailAndPassword(auth2, `${nik}@${ORTU_DOMAIN}`, pin);
      await signOut(auth2);
    } catch {}

    // Pengukuran bulan ini & lalu
    for (const [bKey, umurOffset] of [[blnLalu, -1], [blnIni, 0]]) {
      const umur = dob.months + umurOffset;
      if (umur < 0) continue;
      const u = genUkur(umur, jk);
      await setDoc(doc(db, "pengukuran", `${nik}_${bKey}`), {
        nik, bulan: bKey, nama, rw: anak.rw, rt: anak.rt,
        jenisKelamin: jk, umurBln: umur,
        bb: u.bb, tb: u.tb, lk: u.lk, lila: "",
        tanggal: `${bKey}-15`,
        updatedAt: new Date().toISOString(),
      });
    }

    // Kehadiran bulan ini (~80%)
    if (Math.random() < 0.8) {
      await setDoc(doc(db, "kehadiran", `${nik}_${blnIni}`), {
        nik, nama, rw: anak.rw, rt: anak.rt,
        bulan: blnIni, tanggal: `${blnIni}-15`,
        createdAt: new Date().toISOString(),
      });
    }

    // Imunisasi yang seharusnya sudah diberikan (~85%)
    for (const [vk, umurVaksin] of JADWAL) {
      if (dob.months >= umurVaksin && Math.random() < 0.85) {
        await setDoc(doc(db, "imunisasi", `${nik}_${vk}`), {
          nik, vaksin: vk, nama, rw: anak.rw, rt: anak.rt,
          tanggal: `${blnLalu}-10`, bulan: blnLalu,
          createdAt: new Date().toISOString(),
        });
      }
    }
    buat++;
  }
  console.log(`Anak dibuat: ${buat}`);

  for (let i = 0; i < N_IBU; i++) {
    const nik = `317304${pad(randi(41, 68))}${pad(randi(1, 12))}${pad(randi(80, 99))}${pad(2000 + i, 4)}`;
    const hamil = Math.random() < 0.7;
    const hpht = hamil
      ? (() => {
          const d = new Date(now.getTime() - randi(4, 36) * 7 * 86400000);
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        })()
      : "";
    await setDoc(doc(db, "ibu", nik), {
      nama: `${pick(NAMA_IBU)} ${pick(MARGA)}`,
      nik,
      status: hamil ? "Hamil" : "Nifas",
      tanggalLahir: `${randi(1990, 2005)}-${pad(randi(1, 12))}-${pad(randi(1, 28))}`,
      hpht,
      rw: pick(RWS), rt: pick(RTS),
      alamat: `${pick(JALAN)} No. ${randi(1, 60)}`,
      noTelp: `08${randi(10, 99)}${randi(1000, 9999)}${randi(1000, 9999)}`,
      createdAt: new Date().toISOString(),
    });
  }
  console.log(`Ibu dibuat: ${N_IBU}`);

  await setDoc(doc(db, "config", "profil"), {
    namaPosyandu: "Posyandu Melati",
    namaKelurahan: "Kelurahan Duri Selatan",
    namaPuskesmas: "Puskesmas Tambora",
    alamatPosyandu: "Jl. Duri Selatan Raya No. 12",
    telpOperator: "021-5551234",
    namaKetua: "Siti Rahmawati",
    namaKapus: "dr. Andi Prasetyo",
    logo: "",
  });
  await setDoc(doc(db, "config", "targets"), Object.fromEntries(RWS.map((rw) => [rw, 50])));

  const sesi = new Date(now.getTime() + 5 * 86400000);
  await setDoc(doc(collection(db, "sesi")), {
    tanggal: `${sesi.getFullYear()}-${pad(sesi.getMonth() + 1)}-${pad(sesi.getDate())}`,
    jam: "08:00",
    lokasi: "Balai RW 03",
    kegiatan: "Penimbangan, Pengukuran & Imunisasi",
    catatan: "Bawa buku KIA / KMS anak.",
    createdAt: new Date().toISOString(),
  });
  console.log("Config & jadwal dibuat.");
  console.log("Selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
