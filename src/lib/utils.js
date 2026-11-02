export const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const BULAN_LENGKAP = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const HARI = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

export const RW_LIST = Array.from({ length: 10 }, (_, i) => `RW ${String(i + 1).padStart(2, "0")}`);
export const RT_LIST = Array.from({ length: 15 }, (_, i) => `RT ${String(i + 1).padStart(2, "0")}`);

const pad = (n) => String(n).padStart(2, "0");

export function bulanKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function bulanLabel(key) {
  if (!key) return "-";
  const [y, m] = key.split("-");
  return `${BULAN_SINGKAT[parseInt(m, 10) - 1]} ${y}`;
}

export function tanggalIndo(date = new Date()) {
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN_LENGKAP[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTglLahir(tgl) {
  if (!tgl) return "-";
  const d = new Date(tgl);
  if (isNaN(d)) return tgl;
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
}

export function hitungUmur(tglLahir) {
  if (!tglLahir) return null;
  const d = new Date(tglLahir);
  if (isNaN(d)) return null;
  const now = new Date();
  let u = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) u--;
  return u;
}

// Umur dalam bulan penuh pada tanggal acuan — dipakai untuk lookup
// tabel tumbuh WHO (BB/U, TB/U) dan status imunisasi.
export function umurBulan(tglLahir, refDate = new Date()) {
  if (!tglLahir) return null;
  const d = new Date(tglLahir);
  if (isNaN(d)) return null;
  let m = (refDate.getFullYear() - d.getFullYear()) * 12 + (refDate.getMonth() - d.getMonth());
  if (refDate.getDate() < d.getDate()) m--;
  return Math.max(0, m);
}

// Label umur ramah anak: "8 bln" / "2 th 3 bln"
export function umurLabel(tglLahir, refDate = new Date()) {
  const m = umurBulan(tglLahir, refDate);
  if (m === null) return "-";
  if (m < 24) return `${m} bln`;
  const th = Math.floor(m / 12);
  const sisa = m % 12;
  return sisa ? `${th} th ${sisa} bln` : `${th} th`;
}

// Usia kehamilan (minggu) dari HPHT — monitoring ibu hamil.
export function usiaKehamilanMinggu(hpht, refDate = new Date()) {
  if (!hpht) return null;
  const d = new Date(hpht);
  if (isNaN(d)) return null;
  const days = Math.floor((refDate - d) / 86400000);
  return days >= 0 ? Math.floor(days / 7) : null;
}

export function hitungIMT(bb, tb) {
  const b = parseFloat(bb);
  const t = parseFloat(tb);
  if (!b || !t) return "-";
  return (b / Math.pow(t / 100, 2)).toFixed(1);
}

// Parse angka dari input pengguna (menerima koma desimal).
// null = kosong, NaN = bukan angka.
export function parseNumID(v) {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function generatePIN() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function downloadCSV(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function matchSearch(w, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    (w.nama || "").toLowerCase().includes(s) ||
    (w.nik || "").toLowerCase().includes(s) ||
    (w.namaIbu || "").toLowerCase().includes(s)
  );
}

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export function randomSalt() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return toHex(b);
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}
