import {
  db as fdb,
  auth as fauth,
  getSecondaryAuth,
  isFirebaseConfigured,
  ortuEmail,
  petugasEmail,
} from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { bulanKey, generatePIN, hashPassword, randomSalt, todayKey } from "./utils";

export const USE_FIREBASE = isFirebaseConfigured;

// Role petugas Posyandu — semua boleh input data; hanya "admin" yang
// mengelola akun petugas & profil posyandu.
export const PETUGAS_ROLES = ["admin", "nakes", "kader"];
export const ROLE_LABEL = { admin: "Admin", nakes: "Nakes", kader: "Kader" };

/* ---------------- LocalStorage backend (mode demo tanpa Firebase) ---------------- */

const LS_KEY = "sipanak_db_v1";
const emptyDb = () => ({
  anak: [], ibu: [], kehadiran: [], pengukuran: [], imunisasi: [],
  kunjunganIbu: [], sesi: [], edaran: [], petugas: [], pushSubs: [],
  targets: {}, profil: {},
});

// ID dokumen pushSubs — hash endpoint agar subscription yang sama tidak duplikat
// (endpoint bisa berubah, jadi dokumen lama dibersihkan saat unsubscribe).
function pushSubId(nik, endpoint) {
  let h = 5381;
  for (let i = 0; i < endpoint.length; i++)
    h = ((h << 5) + h + endpoint.charCodeAt(i)) >>> 0;
  return `${nik}_${h.toString(36)}`;
}

// Trigger push ke orang tua — dipanggil setelah pengukuran/imunisasi diinput
// petugas, agar ortu mendapat kabar hasil penimbangan/imunisasi anaknya.
function notifyHasilAnak(nik, { title, body, url = "/ortu/kms" } = {}) {
  api.notifyOrtu({ nik, title, body, url }).catch(() => {});
}

export const DEFAULT_PROFIL = {
  namaPosyandu: "Posyandu Melati",
  namaKelurahan: "Kelurahan Duri Selatan",
  namaPuskesmas: "Puskesmas Tambora",
  alamatPosyandu: "",
  telpOperator: "",
  namaKetua: "",
  namaKapus: "",
  logo: "",
};

function readLocal() {
  if (typeof window === "undefined") return emptyDb();
  try {
    return { ...emptyDb(), ...JSON.parse(localStorage.getItem(LS_KEY) || "{}") };
  } catch {
    return emptyDb();
  }
}

function writeLocal(d) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}

/* ---------------- Akun petugas (koleksi `users`) ----------------
   Mode Firebase: akun Auth email/password biasa; role diverifikasi dari
   dokumen `users/{uid}` dengan field role ∈ admin|nakes|kader (doc ID =
   UID Auth). Username dipetakan ke email sintetis "<username>@petugas.<domain>"
   agar login bisa pakai username; login dengan email asli juga didukung.
   Mode demo (localStorage): password disimpan hash SHA-256 + salt. */

const PETUGAS_USERNAME_RE = /^[a-z0-9._-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const stripPetugas = ({ passHash, salt, ...a }) => a;

function validatePetugasInput({ username, nama, password, email, role }) {
  const u = String(username || "").trim().toLowerCase();
  if (!PETUGAS_USERNAME_RE.test(u))
    throw new Error("Username 3–32 karakter: huruf kecil, angka, titik, strip, atau underscore");
  if (!nama || !nama.trim()) throw new Error("Nama petugas wajib diisi");
  const em = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(em))
    throw new Error("Email asli wajib diisi — dipakai untuk login & reset password");
  if (!password || password.length < 6) throw new Error("Password minimal 6 karakter");
  const r = PETUGAS_ROLES.includes(role) ? role : "kader";
  return { username: u, nama: nama.trim(), password, email: em, role: r };
}

async function buildPetugasRecord(data) {
  const v = validatePetugasInput(data);
  const salt = randomSalt();
  return {
    uid: `local-${v.username}`,
    username: v.username,
    nama: v.nama,
    email: v.email,
    role: v.role,
    salt,
    passHash: await hashPassword(v.password, salt),
    createdAt: new Date().toISOString(),
  };
}

async function verifyPetugas(a, password) {
  return a && (await hashPassword(password, a.salt)) === a.passHash ? a : null;
}

const local = {
  /* ----- Anak ----- */
  async listAnak() {
    return [...readLocal().anak].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  },
  async getAnak(nik) {
    return readLocal().anak.find((w) => w.nik === nik) || null;
  },
  async addAnak(data) {
    const d = readLocal();
    if (d.anak.some((w) => w.nik === data.nik)) throw new Error("NIK anak sudah terdaftar");
    const w = { ...data, pin: data.pin || generatePIN(), createdAt: new Date().toISOString() };
    d.anak.push(w);
    writeLocal(d);
    return w;
  },
  async updateAnak(nik, patch) {
    const d = readLocal();
    const i = d.anak.findIndex((w) => w.nik === nik);
    if (i < 0) throw new Error("Data anak tidak ditemukan");
    d.anak[i] = { ...d.anak[i], ...patch, nik };
    writeLocal(d);
    return d.anak[i];
  },
  async deleteAnak(nik) {
    const d = readLocal();
    d.anak = d.anak.filter((w) => w.nik !== nik);
    d.kehadiran = d.kehadiran.filter((a) => a.nik !== nik);
    d.pengukuran = d.pengukuran.filter((p) => p.nik !== nik);
    d.imunisasi = d.imunisasi.filter((p) => p.nik !== nik);
    writeLocal(d);
  },
  async loginOrtu(nik, pin) {
    return readLocal().anak.find((w) => w.nik === nik && w.pin === pin) || null;
  },
  async changePin(nik, pinLama, pinBaru) {
    const d = readLocal();
    const i = d.anak.findIndex((w) => w.nik === nik);
    if (i < 0) throw new Error("Data anak tidak ditemukan");
    if (d.anak[i].pin !== pinLama) throw new Error("Kata sandi lama salah");
    d.anak[i].pin = pinBaru;
    writeLocal(d);
  },

  /* ----- Ibu (hamil/nifas) ----- */
  async listIbu() {
    return [...readLocal().ibu].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  },
  async getIbu(nik) {
    return readLocal().ibu.find((w) => w.nik === nik) || null;
  },
  async addIbu(data) {
    const d = readLocal();
    if (d.ibu.some((w) => w.nik === data.nik)) throw new Error("NIK ibu sudah terdaftar");
    const w = { ...data, createdAt: new Date().toISOString() };
    d.ibu.push(w);
    writeLocal(d);
    return w;
  },
  async updateIbu(nik, patch) {
    const d = readLocal();
    const i = d.ibu.findIndex((w) => w.nik === nik);
    if (i < 0) throw new Error("Data ibu tidak ditemukan");
    d.ibu[i] = { ...d.ibu[i], ...patch, nik };
    writeLocal(d);
    return d.ibu[i];
  },
  async deleteIbu(nik) {
    const d = readLocal();
    d.ibu = d.ibu.filter((w) => w.nik !== nik);
    d.kunjunganIbu = d.kunjunganIbu.filter((k) => k.nik !== nik);
    writeLocal(d);
  },
  async listKunjunganIbu(nik) {
    const k = readLocal().kunjunganIbu;
    return nik ? k.filter((x) => x.nik === nik) : k;
  },
  async upsertKunjunganIbu(nik, bulan, patch) {
    const d = readLocal();
    const i = d.kunjunganIbu.findIndex((k) => k.nik === nik && k.bulan === bulan);
    if (i < 0) d.kunjunganIbu.push({ nik, bulan, ...patch });
    else d.kunjunganIbu[i] = { ...d.kunjunganIbu[i], ...patch };
    writeLocal(d);
  },

  /* ----- Kehadiran sesi Posyandu ----- */
  async listKehadiran(nik) {
    const a = readLocal().kehadiran;
    return nik ? a.filter((x) => x.nik === nik) : a;
  },
  async addKehadiran(w) {
    const d = readLocal();
    const bulan = bulanKey();
    if (d.kehadiran.some((a) => a.nik === w.nik && a.bulan === bulan))
      throw new Error(`${w.nama} sudah hadir bulan ini`);
    const rec = {
      nik: w.nik, nama: w.nama, rw: w.rw, rt: w.rt,
      bulan, tanggal: todayKey(), createdAt: new Date().toISOString(),
    };
    d.kehadiran.push(rec);
    writeLocal(d);
    return rec;
  },
  async deleteKehadiran(nik) {
    const d = readLocal();
    const bulan = bulanKey();
    d.kehadiran = d.kehadiran.filter((a) => !(a.nik === nik && a.bulan === bulan));
    writeLocal(d);
  },

  /* ----- Pengukuran antropometri ----- */
  async listPengukuran(nik) {
    const p = readLocal().pengukuran;
    return nik ? p.filter((x) => x.nik === nik) : p;
  },
  async upsertPengukuran(nik, bulan, patch) {
    const d = readLocal();
    const i = d.pengukuran.findIndex((p) => p.nik === nik && p.bulan === bulan);
    if (i < 0) d.pengukuran.push({ nik, bulan, ...patch });
    else d.pengukuran[i] = { ...d.pengukuran[i], ...patch };
    writeLocal(d);
    if (patch.bb || patch.tb) {
      notifyHasilAnak(nik, {
        title: "Hasil Penimbangan Baru",
        body: `Hasil penimbangan ${patch.nama || "anak Anda"} sudah diinput kader. Lihat grafik KMS-nya.`,
      });
    }
  },

  /* ----- Imunisasi ----- */
  async listImunisasi(nik) {
    const p = readLocal().imunisasi;
    return nik ? p.filter((x) => x.nik === nik) : p;
  },
  async addImunisasi(nik, vaksin, extra = {}) {
    const d = readLocal();
    const key = `${nik}_${vaksin.key}`;
    if (d.imunisasi.some((p) => p.id === key))
      throw new Error(`Vaksin ${vaksin.nama} sudah tercatat`);
    const rec = {
      id: key, nik, vaksin: vaksin.key, namaVaksin: vaksin.nama,
      tanggal: extra.tanggal || todayKey(), bulan: bulanKey(),
      nama: extra.nama || "", rw: extra.rw || "", rt: extra.rt || "",
      createdAt: new Date().toISOString(),
    };
    d.imunisasi.push(rec);
    writeLocal(d);
    notifyHasilAnak(nik, {
      title: "Imunisasi Diberikan",
      body: `${rec.nama || "Anak Anda"} baru saja menerima vaksin ${vaksin.nama}.`,
      url: "/ortu/imunisasi",
    });
    return rec;
  },
  async deleteImunisasi(nik, vaksinKey) {
    const d = readLocal();
    d.imunisasi = d.imunisasi.filter((p) => p.id !== `${nik}_${vaksinKey}`);
    writeLocal(d);
  },

  /* ----- Jadwal sesi Posyandu ----- */
  async listSesi() {
    return [...readLocal().sesi].sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || ""));
  },
  async addSesi(data) {
    const d = readLocal();
    const rec = {
      ...data,
      id: data.id || `sesi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    d.sesi.push(rec);
    writeLocal(d);
    rec._notify = await api.notifyOrtu({
      title: "Jadwal Posyandu Baru",
      body: `${data.kegiatan || "Kegiatan Posyandu"} — ${data.tanggal}${data.lokasi ? ` di ${data.lokasi}` : ""}.`,
      url: "/ortu",
    });
    return rec;
  },
  async updateSesi(id, patch) {
    const d = readLocal();
    const i = d.sesi.findIndex((s) => s.id === id);
    if (i < 0) throw new Error("Jadwal tidak ditemukan");
    d.sesi[i] = { ...d.sesi[i], ...patch, id };
    writeLocal(d);
    return d.sesi[i];
  },
  async deleteSesi(id) {
    const d = readLocal();
    d.sesi = d.sesi.filter((s) => s.id !== id);
    writeLocal(d);
  },

  /* ----- Config & edaran ----- */
  async getTargets() {
    return readLocal().targets;
  },
  async setTargets(t) {
    const d = readLocal();
    d.targets = t;
    writeLocal(d);
  },
  async getProfil() {
    return readLocal().profil;
  },
  async setProfil(p) {
    const d = readLocal();
    d.profil = p;
    writeLocal(d);
  },
  async listEdaran() {
    return [...readLocal().edaran].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  },
  async addEdaran(data) {
    const d = readLocal();
    const rec = {
      ...data,
      id: data.id || `ed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    d.edaran.push(rec);
    writeLocal(d);
    rec._notify = await api.notifyOrtu({
      title: "Surat Edaran Baru",
      body: data.judul || "Ada surat edaran baru dari Posyandu.",
      url: "/ortu/edaran",
    });
    return rec;
  },
  async updateEdaran(id, patch) {
    const d = readLocal();
    const i = d.edaran.findIndex((e) => e.id === id);
    if (i < 0) throw new Error("Edaran tidak ditemukan");
    d.edaran[i] = { ...d.edaran[i], ...patch, id };
    writeLocal(d);
    return d.edaran[i];
  },
  async deleteEdaran(id) {
    const d = readLocal();
    d.edaran = d.edaran.filter((e) => e.id !== id);
    writeLocal(d);
  },

  /* ----- Push subscription ----- */
  async savePushSubscription(nik, sub) {
    const d = readLocal();
    const rec = {
      id: pushSubId(nik, sub.endpoint),
      nik,
      endpoint: sub.endpoint,
      keys: sub.keys,
      createdAt: new Date().toISOString(),
    };
    const i = d.pushSubs.findIndex((s) => s.id === rec.id);
    if (i < 0) d.pushSubs.push(rec);
    else d.pushSubs[i] = rec;
    writeLocal(d);
    return rec;
  },
  async listPushSubscriptions(nik) {
    const s = readLocal().pushSubs;
    return nik ? s.filter((x) => x.nik === nik) : s;
  },
  async removePushSubscription(nik, endpoint) {
    const d = readLocal();
    d.pushSubs = d.pushSubs.filter((s) => s.id !== pushSubId(nik, endpoint));
    writeLocal(d);
  },

  /* ----- Petugas ----- */
  async listPetugas() {
    return [...readLocal().petugas]
      .sort((a, b) => a.username.localeCompare(b.username))
      .map(stripPetugas);
  },
  async addPetugas(data) {
    const rec = await buildPetugasRecord(data);
    const d = readLocal();
    if (d.petugas.some((a) => a.username === rec.username))
      throw new Error("Username sudah dipakai");
    d.petugas.push(rec);
    writeLocal(d);
    return stripPetugas(rec);
  },
  async deletePetugas(uid) {
    const d = readLocal();
    d.petugas = d.petugas.filter((a) => a.uid !== uid);
    writeLocal(d);
  },
  async loginPetugas(username, password) {
    const key = String(username || "").trim().toLowerCase();
    const a = readLocal().petugas.find(
      (x) => x.username === key || x.email === key
    );
    const ok = await verifyPetugas(a, password);
    return ok ? stripPetugas(ok) : null;
  },
  async resetPetugasPassword() {
    throw new Error("Reset password via email hanya tersedia saat Firebase aktif");
  },
  async getUser(uid) {
    const a = readLocal().petugas.find((x) => x.uid === uid);
    return a ? stripPetugas(a) : null;
  },
  async changePetugasPassword(uid, lama, baru) {
    if (!baru || baru.length < 6)
      throw new Error("Password baru minimal 6 karakter");
    const d = readLocal();
    const a = d.petugas.find((x) => x.uid === uid);
    if (!a || !(await verifyPetugas(a, lama))) throw new Error("Password lama salah");
    a.salt = randomSalt();
    a.passHash = await hashPassword(baru, a.salt);
    writeLocal(d);
  },
};

/* ---------------- Firebase Auth helpers ----------------
   Akun orang tua disimpan di Firebase Authentication sebagai
   email sintetis "<nik>@<domain>" dengan kata sandi = password.
   Operasi petugas memakai app sekunder agar sesi auth utama
   tidak tertimpa (createUser/signIn auto-login user tsb). */

const AUTH_ERRORS = {
  "auth/email-already-in-use": "Email NIK sudah terdaftar di Authentication",
  "auth/invalid-credential": "NIK atau kata sandi salah",
  "auth/wrong-password": "NIK atau kata sandi salah",
  "auth/user-not-found": "Akun tidak ditemukan di Authentication",
  "auth/weak-password": "Kata sandi minimal 6 karakter",
  "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti",
  "auth/network-request-failed": "Koneksi bermasalah, coba lagi",
};

function authError(e) {
  return new Error(AUTH_ERRORS[e.code] || e.message || "Operasi Auth gagal");
}

async function createAuthOrtu(nik, pin) {
  const sec = getSecondaryAuth();
  try {
    await createUserWithEmailAndPassword(sec, ortuEmail(nik), pin);
  } finally {
    await signOut(sec).catch(() => {});
  }
}

/* ---------------- Firestore backend ---------------- */

const fs = {
  /* ----- Anak ----- */
  async listAnak() {
    const s = await getDocs(collection(fdb, "anak"));
    return s.docs.map((d) => d.data()).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  },
  async getAnak(nik) {
    const s = await getDoc(doc(fdb, "anak", nik));
    return s.exists() ? s.data() : null;
  },
  async addAnak(data) {
    const ref = doc(fdb, "anak", data.nik);
    const ex = await getDoc(ref);
    if (ex.exists()) throw new Error("NIK anak sudah terdaftar");
    const w = { ...data, pin: data.pin || generatePIN(), createdAt: new Date().toISOString() };
    await setDoc(ref, w);
    try {
      await createAuthOrtu(w.nik, w.pin);
    } catch (e) {
      // dokumen sudah tersimpan; login fallback + migrasi otomatis tetap jalan
      console.warn("Gagal membuat akun Auth orang tua:", e.code || e.message);
    }
    return w;
  },
  async updateAnak(nik, patch) {
    await setDoc(doc(fdb, "anak", nik), { ...patch, nik }, { merge: true });
    return { ...patch, nik };
  },
  async changePin(nik, pinLama, pinBaru) {
    const sec = getSecondaryAuth();
    const email = ortuEmail(nik);
    try {
      try {
        await signInWithEmailAndPassword(sec, email, pinLama);
        await updatePassword(sec.currentUser, pinBaru);
      } catch (e) {
        const migratable = [
          "auth/invalid-credential",
          "auth/wrong-password",
          "auth/user-not-found",
        ];
        if (!migratable.includes(e.code)) throw e;
        // akun lama belum ada di Auth → verifikasi PIN lama lewat dokumen
        const w = await this.getAnak(nik);
        if (!w || w.pin !== pinLama) throw new Error("Kata sandi lama salah");
        await createUserWithEmailAndPassword(sec, email, pinBaru);
      }
    } catch (e) {
      throw authError(e);
    } finally {
      await signOut(sec).catch(() => {});
    }
    // updateDoc pin-only: rules hanya mengizinkan ortu mengubah field `pin` miliknya
    await updateDoc(doc(fdb, "anak", nik), { pin: pinBaru });
  },
  async deleteAnak(nik) {
    const w = await this.getAnak(nik);
    await deleteDoc(doc(fdb, "anak", nik));
    for (const col of ["kehadiran", "pengukuran", "imunisasi"]) {
      const s = await getDocs(query(collection(fdb, col), where("nik", "==", nik)));
      await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
    }
    // hapus juga akun Auth-nya: login sebentar sebagai ortu di app sekunder
    if (w?.pin) {
      const sec = getSecondaryAuth();
      try {
        await signInWithEmailAndPassword(sec, ortuEmail(nik), w.pin);
        if (sec.currentUser) await deleteUser(sec.currentUser);
      } catch {
      } finally {
        await signOut(sec).catch(() => {});
      }
    }
  },
  async loginOrtu(nik, pin) {
    const email = ortuEmail(nik);
    try {
      await signInWithEmailAndPassword(fauth, email, pin);
      const w = await this.getAnak(nik);
      if (w) return w;
      await signOut(fauth).catch(() => {}); // akun Auth yatim → tolak
      return null;
    } catch {
      // Fallback: akun lama yang belum punya Auth → cek PIN di dokumen
      let w = null;
      try {
        w = await this.getAnak(nik);
      } catch {
        return null;
      }
      if (!w || w.pin !== pin) return null;
      // migrasikan ke Firebase Auth di latar belakang
      createAuthOrtu(nik, pin)
        .then(() => signInWithEmailAndPassword(fauth, email, pin))
        .catch(() => {});
      return w;
    }
  },

  /* ----- Ibu (hamil/nifas) ----- */
  async listIbu() {
    const s = await getDocs(collection(fdb, "ibu"));
    return s.docs.map((d) => d.data()).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  },
  async getIbu(nik) {
    const s = await getDoc(doc(fdb, "ibu", nik));
    return s.exists() ? s.data() : null;
  },
  async addIbu(data) {
    const ref = doc(fdb, "ibu", data.nik);
    const ex = await getDoc(ref);
    if (ex.exists()) throw new Error("NIK ibu sudah terdaftar");
    const w = { ...data, createdAt: new Date().toISOString() };
    await setDoc(ref, w);
    return w;
  },
  async updateIbu(nik, patch) {
    await setDoc(doc(fdb, "ibu", nik), { ...patch, nik }, { merge: true });
    return { ...patch, nik };
  },
  async deleteIbu(nik) {
    await deleteDoc(doc(fdb, "ibu", nik));
    const s = await getDocs(query(collection(fdb, "kunjunganIbu"), where("nik", "==", nik)));
    await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
  },
  async listKunjunganIbu(nik) {
    const q = nik
      ? query(collection(fdb, "kunjunganIbu"), where("nik", "==", nik))
      : collection(fdb, "kunjunganIbu");
    const s = await getDocs(q);
    return s.docs.map((d) => d.data());
  },
  async upsertKunjunganIbu(nik, bulan, patch) {
    await setDoc(doc(fdb, "kunjunganIbu", `${nik}_${bulan}`), { nik, bulan, ...patch }, { merge: true });
  },

  /* ----- Kehadiran ----- */
  async listKehadiran(nik) {
    const q = nik
      ? query(collection(fdb, "kehadiran"), where("nik", "==", nik))
      : collection(fdb, "kehadiran");
    const s = await getDocs(q);
    return s.docs.map((d) => d.data());
  },
  async addKehadiran(w) {
    const bulan = bulanKey();
    const ref = doc(fdb, "kehadiran", `${w.nik}_${bulan}`);
    const ex = await getDoc(ref);
    if (ex.exists()) throw new Error(`${w.nama} sudah hadir bulan ini`);
    const rec = {
      nik: w.nik, nama: w.nama, rw: w.rw, rt: w.rt,
      bulan, tanggal: todayKey(), createdAt: new Date().toISOString(),
    };
    await setDoc(ref, rec);
    return rec;
  },
  async deleteKehadiran(nik) {
    await deleteDoc(doc(fdb, "kehadiran", `${nik}_${bulanKey()}`));
  },

  /* ----- Pengukuran ----- */
  async listPengukuran(nik) {
    const q = nik
      ? query(collection(fdb, "pengukuran"), where("nik", "==", nik))
      : collection(fdb, "pengukuran");
    const s = await getDocs(q);
    return s.docs.map((d) => d.data());
  },
  async upsertPengukuran(nik, bulan, patch) {
    await setDoc(doc(fdb, "pengukuran", `${nik}_${bulan}`), { nik, bulan, ...patch }, { merge: true });
    if (patch.bb || patch.tb) {
      notifyHasilAnak(nik, {
        title: "Hasil Penimbangan Baru",
        body: `Hasil penimbangan ${patch.nama || "anak Anda"} sudah diinput kader. Lihat grafik KMS-nya.`,
      });
    }
  },

  /* ----- Imunisasi ----- */
  async listImunisasi(nik) {
    const q = nik
      ? query(collection(fdb, "imunisasi"), where("nik", "==", nik))
      : collection(fdb, "imunisasi");
    const s = await getDocs(q);
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async addImunisasi(nik, vaksin, extra = {}) {
    const id = `${nik}_${vaksin.key}`;
    const ref = doc(fdb, "imunisasi", id);
    const ex = await getDoc(ref);
    if (ex.exists()) throw new Error(`Vaksin ${vaksin.nama} sudah tercatat`);
    const rec = {
      nik, vaksin: vaksin.key, namaVaksin: vaksin.nama,
      tanggal: extra.tanggal || todayKey(), bulan: bulanKey(),
      nama: extra.nama || "", rw: extra.rw || "", rt: extra.rt || "",
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, rec);
    notifyHasilAnak(nik, {
      title: "Imunisasi Diberikan",
      body: `${rec.nama || "Anak Anda"} baru saja menerima vaksin ${vaksin.nama}.`,
      url: "/ortu/imunisasi",
    });
    return { id, ...rec };
  },
  async deleteImunisasi(nik, vaksinKey) {
    await deleteDoc(doc(fdb, "imunisasi", `${nik}_${vaksinKey}`));
  },

  /* ----- Jadwal sesi Posyandu ----- */
  async listSesi() {
    const s = await getDocs(collection(fdb, "sesi"));
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || ""));
  },
  async addSesi(data) {
    const ref = doc(collection(fdb, "sesi"));
    const rec = { ...data, id: ref.id, createdAt: new Date().toISOString() };
    await setDoc(ref, rec);
    rec._notify = await api.notifyOrtu({
      title: "Jadwal Posyandu Baru",
      body: `${data.kegiatan || "Kegiatan Posyandu"} — ${data.tanggal}${data.lokasi ? ` di ${data.lokasi}` : ""}.`,
      url: "/ortu",
    });
    return rec;
  },
  async updateSesi(id, patch) {
    await setDoc(doc(fdb, "sesi", id), { ...patch, id }, { merge: true });
    return { ...patch, id };
  },
  async deleteSesi(id) {
    await deleteDoc(doc(fdb, "sesi", id));
  },

  /* ----- Config & edaran ----- */
  async getTargets() {
    const s = await getDoc(doc(fdb, "config", "targets"));
    return s.exists() ? s.data() : {};
  },
  async setTargets(t) {
    await setDoc(doc(fdb, "config", "targets"), t);
  },
  async getProfil() {
    const s = await getDoc(doc(fdb, "config", "profil"));
    return s.exists() ? s.data() : {};
  },
  async setProfil(p) {
    await setDoc(doc(fdb, "config", "profil"), p);
  },
  async listEdaran() {
    const s = await getDocs(collection(fdb, "edaran"));
    return s.docs.map((d) => d.data()).sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  },
  async addEdaran(data) {
    const ref = doc(collection(fdb, "edaran"));
    const rec = { ...data, id: ref.id, createdAt: new Date().toISOString() };
    await setDoc(ref, rec);
    rec._notify = await api.notifyOrtu({
      title: "Surat Edaran Baru",
      body: data.judul || "Ada surat edaran baru dari Posyandu.",
      url: "/ortu/edaran",
    });
    return rec;
  },
  async updateEdaran(id, patch) {
    await setDoc(doc(fdb, "edaran", id), { ...patch, id }, { merge: true });
    return { ...patch, id };
  },
  async deleteEdaran(id) {
    await deleteDoc(doc(fdb, "edaran", id));
  },

  /* ----- Push subscription ----- */
  async savePushSubscription(nik, sub) {
    const rec = {
      nik,
      endpoint: sub.endpoint,
      keys: sub.keys,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(fdb, "pushSubs", pushSubId(nik, sub.endpoint)), rec);
    return rec;
  },
  async listPushSubscriptions(nik) {
    const q = nik
      ? query(collection(fdb, "pushSubs"), where("nik", "==", nik))
      : collection(fdb, "pushSubs");
    const s = await getDocs(q);
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async removePushSubscription(nik, endpoint) {
    await deleteDoc(doc(fdb, "pushSubs", pushSubId(nik, endpoint)));
  },

  /* ----- Petugas ----- */
  async listPetugas() {
    const s = await getDocs(collection(fdb, "users"));
    return s.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((a) => PETUGAS_ROLES.includes(a.role))
      .sort((a, b) => (a.username || "").localeCompare(b.username || ""));
  },
  async getUser(uid) {
    const s = await getDoc(doc(fdb, "users", uid));
    return s.exists() ? s.data() : null;
  },
  async addPetugas(data) {
    const v = validatePetugasInput(data);
    const dup = await getDocs(
      query(collection(fdb, "users"), where("username", "==", v.username))
    );
    if (!dup.empty) throw new Error("Username sudah dipakai");
    const sec = getSecondaryAuth();
    try {
      // Akun Auth memakai email asli agar fitur "Lupa password" dapat
      // mengirim link reset ke inbox petugas.
      const cred = await createUserWithEmailAndPassword(sec, v.email, v.password);
      try {
        await setDoc(doc(fdb, "users", cred.user.uid), {
          uid: cred.user.uid,
          username: v.username,
          nama: v.nama,
          email: v.email,
          role: v.role,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        await deleteUser(sec.currentUser).catch(() => {}); // rollback akun Auth
        throw e;
      }
    } finally {
      await signOut(sec).catch(() => {});
    }
    return { username: v.username, nama: v.nama, role: v.role };
  },
  async deletePetugas(uid) {
    // Hanya hapus dokumen — akun Auth-nya menjadi yatim tapi tidak bisa dipakai
    // login karena rules mewajibkan dokumen users/<uid> dengan role petugas.
    await deleteDoc(doc(fdb, "users", uid));
  },
  async loginPetugas(username, password) {
    const u = String(username || "").trim().toLowerCase();
    if (!u || !password) return null;
    // Username dipetakan ke email sintetis; input berisi '@' dianggap email asli
    const email = u.includes("@") ? u : petugasEmail(u);
    try {
      await signInWithEmailAndPassword(fauth, email, password);
    } catch {
      return null;
    }
    const a = await this.getUser(fauth.currentUser?.uid);
    if (!a || !PETUGAS_ROLES.includes(a.role)) {
      await signOut(fauth).catch(() => {}); // akun Auth tanpa role petugas → tolak
      return null;
    }
    // Samakan field email dokumen dengan email Auth aktual — memastikan
    // fitur reset password mengirim ke alamat yang benar walau dokumen
    // sempat diedit manual di Console.
    if (fauth.currentUser?.email && a.email !== fauth.currentUser.email) {
      updateDoc(doc(fdb, "users", fauth.currentUser.uid), {
        email: fauth.currentUser.email,
      }).catch(() => {});
    }
    return a;
  },
  async changePetugasPassword(uid, lama, baru) {
    if (!baru || baru.length < 6)
      throw new Error("Password baru minimal 6 karakter");
    const u = fauth.currentUser;
    if (!u || (uid && u.uid !== uid)) throw new Error("Sesi tidak valid — login ulang");
    try {
      await reauthenticateWithCredential(
        u,
        EmailAuthProvider.credential(u.email, lama)
      );
      await updatePassword(u, baru);
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential")
        throw new Error("Password lama salah");
      if (e.code === "auth/weak-password")
        throw new Error("Password baru minimal 6 karakter");
      if (e.code === "auth/requires-recent-login")
        throw new Error("Sesi kedaluwarsa — keluar lalu login ulang");
      throw e;
    }
  },
  async resetPetugasPassword(email) {
    const em = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(em)) throw new Error("Masukkan email akun petugas yang valid");
    try {
      await sendPasswordResetEmail(fauth, em);
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-email")
        throw new Error("Email tidak terdaftar sebagai akun petugas");
      throw e;
    }
  },
};

export const api = USE_FIREBASE ? fs : local;

// Kirim Web Push ke perangkat orang tua lewat API route /api/notify.
// `nik` = satu anak saja; tanpa nik = semua yang berlangganan (untuk edaran/jadwal).
// Bersifat best-effort — kegagalan jaringan/subscription tidak menggagalkan
// operasi utama (simpan edaran/pengukuran tetap sukses).
api.notifyOrtu = async ({ title, body, url = "/ortu", nik = null } = {}) => {
  try {
    if (typeof window === "undefined") return { sent: 0, reason: "server-side" };
    const subs = await api.listPushSubscriptions(nik);
    if (!subs?.length) return { sent: 0, reason: "belum ada perangkat berlangganan" };
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subs, title, body, url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { sent: 0, error: data.error || `HTTP ${res.status}` };
    return { sent: data.sent ?? 0, dead: data.dead };
  } catch (e) {
    return { sent: 0, error: e?.message || String(e) };
  }
};
