// ============================================================
// Standar Tumbuh Anak — referensi WHO Child Growth Standards 2006
// (disederhanakan: tabel titik umur/panjang tertentu + interpolasi linear).
// Cukup untuk skrining Posyandu (garis KMS, batas -2SD/-3SD, deteksi
// stunting & gizi kurang). Untuk akurasi klinis penuh, tabel di bawah
// bisa diganti dengan tabel LMS resmi tanpa mengubah API fungsi.
//
// Format tiap baris: [x, sd3neg, sd2neg, median, sd2pos, sd3pos]
//   BB/U & TB/U : x = umur (bulan penuh)
//   BB/TB       : x = panjang/tinggi badan (cm)
// ============================================================

// --- BB/U (Berat menurut Umur, kg) anak laki-laki, 0–60 bulan ---
const BBU_L = [
  [0, 2.1, 2.5, 3.3, 4.4, 5.0],
  [3, 4.4, 5.0, 6.4, 8.0, 9.0],
  [6, 5.8, 6.4, 7.9, 9.8, 10.9],
  [9, 6.5, 7.1, 8.9, 11.0, 12.3],
  [12, 6.9, 7.7, 9.6, 12.0, 13.5],
  [18, 7.8, 8.8, 10.9, 13.7, 15.5],
  [24, 8.6, 9.7, 12.2, 15.3, 17.3],
  [30, 9.4, 10.5, 13.3, 16.8, 19.1],
  [36, 10.0, 11.3, 14.3, 18.3, 21.0],
  [42, 10.6, 12.0, 15.3, 19.7, 22.8],
  [48, 11.2, 12.7, 16.3, 21.2, 24.6],
  [54, 11.8, 13.4, 17.3, 22.7, 26.5],
  [60, 12.4, 14.1, 18.3, 24.2, 28.5],
];

// --- BB/U anak perempuan ---
const BBU_P = [
  [0, 2.0, 2.4, 3.2, 4.2, 4.8],
  [3, 4.0, 4.5, 5.8, 7.5, 8.5],
  [6, 5.1, 5.8, 7.3, 9.3, 10.5],
  [9, 5.8, 6.5, 8.2, 10.5, 11.9],
  [12, 6.3, 7.0, 8.9, 11.5, 13.1],
  [18, 7.2, 8.1, 10.2, 13.2, 15.1],
  [24, 7.9, 9.0, 11.5, 14.8, 17.0],
  [30, 8.7, 9.9, 12.7, 16.4, 18.9],
  [36, 9.4, 10.8, 13.9, 18.1, 21.1],
  [42, 10.1, 11.6, 15.0, 19.8, 23.2],
  [48, 10.8, 12.3, 16.1, 21.5, 25.5],
  [54, 11.4, 13.0, 17.2, 23.2, 27.7],
  [60, 12.0, 13.7, 18.2, 24.9, 30.0],
];

// --- TB/U (Tinggi/Panjang menurut Umur, cm) laki-laki ---
const TBU_L = [
  [0, 44.2, 46.1, 49.9, 53.7, 55.6],
  [3, 55.3, 57.3, 61.4, 65.5, 67.6],
  [6, 61.2, 63.3, 67.6, 71.9, 74.0],
  [9, 65.2, 67.5, 72.0, 76.5, 78.8],
  [12, 68.6, 71.0, 75.7, 80.5, 82.9],
  [18, 74.2, 76.9, 82.3, 87.7, 90.5],
  [24, 78.7, 81.7, 87.1, 92.2, 95.0],
  [30, 82.5, 85.8, 91.9, 97.5, 100.5],
  [36, 86.4, 89.9, 96.1, 102.0, 105.3],
  [42, 89.6, 93.1, 99.9, 106.4, 109.9],
  [48, 92.5, 96.4, 103.3, 110.3, 114.0],
  [54, 95.4, 99.3, 106.7, 114.0, 118.0],
  [60, 98.0, 102.3, 110.0, 117.7, 121.9],
];

// --- TB/U perempuan ---
const TBU_P = [
  [0, 43.6, 45.4, 49.1, 52.9, 54.7],
  [3, 53.7, 55.8, 59.8, 63.9, 66.1],
  [6, 59.4, 61.5, 65.7, 70.0, 72.2],
  [9, 63.5, 65.7, 70.1, 74.5, 77.0],
  [12, 66.8, 69.2, 74.0, 78.9, 81.4],
  [18, 73.4, 76.0, 80.7, 85.4, 88.3],
  [24, 77.0, 80.0, 85.7, 91.4, 94.4],
  [30, 81.3, 84.5, 90.7, 97.0, 100.5],
  [36, 85.4, 88.9, 95.1, 101.3, 104.8],
  [42, 88.9, 92.5, 99.0, 105.4, 109.2],
  [48, 91.8, 95.7, 102.7, 109.6, 113.6],
  [54, 94.8, 98.7, 106.2, 113.6, 117.8],
  [60, 97.2, 101.6, 109.4, 117.1, 121.6],
];

// --- BB/TB (Berat menurut Tinggi, kg) laki-laki, panjang 45–110 cm ---
const BBTB_L = [
  [45, 1.9, 2.0, 2.5, 3.0, 3.3],
  [50, 2.4, 2.7, 3.4, 4.2, 4.8],
  [55, 3.2, 3.6, 4.4, 5.5, 6.3],
  [60, 4.3, 4.7, 5.6, 6.9, 7.9],
  [65, 5.4, 5.9, 7.0, 8.5, 9.7],
  [70, 6.6, 7.1, 8.4, 10.0, 11.4],
  [75, 7.5, 8.1, 9.5, 11.5, 13.1],
  [80, 8.4, 9.1, 10.7, 13.0, 14.9],
  [85, 9.2, 10.0, 12.0, 14.7, 16.9],
  [90, 10.2, 11.1, 13.3, 16.4, 18.9],
  [95, 11.1, 12.1, 14.6, 18.0, 20.9],
  [100, 12.0, 13.2, 15.9, 19.7, 22.9],
  [105, 13.0, 14.3, 17.2, 21.4, 24.9],
  [110, 14.0, 15.4, 18.6, 23.3, 27.1],
];

// --- BB/TB perempuan ---
const BBTB_P = [
  [45, 1.9, 2.1, 2.5, 3.0, 3.3],
  [50, 2.5, 2.8, 3.4, 4.0, 4.5],
  [55, 3.3, 3.7, 4.4, 5.2, 5.9],
  [60, 4.2, 4.7, 5.6, 6.7, 7.6],
  [65, 5.2, 5.8, 6.9, 8.3, 9.4],
  [70, 6.2, 6.9, 8.2, 9.9, 11.3],
  [75, 7.2, 8.0, 9.5, 11.4, 13.0],
  [80, 8.1, 8.9, 10.6, 12.9, 14.9],
  [85, 9.0, 10.0, 11.9, 14.5, 16.7],
  [90, 9.9, 11.0, 13.2, 16.1, 18.6],
  [95, 10.8, 12.0, 14.5, 17.7, 20.6],
  [100, 11.7, 13.0, 15.8, 19.4, 22.6],
  [105, 12.5, 13.9, 17.0, 21.0, 24.6],
  [110, 13.4, 14.9, 18.3, 22.8, 26.8],
];

const isL = (jk) => jk !== "Perempuan"; // "Laki-laki" default

export const TABEL = {
  bbu: (jk) => (isL(jk) ? BBU_L : BBU_P),
  tbu: (jk) => (isL(jk) ? TBU_L : TBU_P),
  bbtb: (jk) => (isL(jk) ? BBTB_L : BBTB_P),
};

// Interpolasi linear antar titik tabel; ekstrapolasi clamp di ujung.
export function interp(table, x) {
  if (x == null || !table?.length) return null;
  if (x <= table[0][0]) return rowObj(table[0]);
  const last = table[table.length - 1];
  if (x >= last[0]) return rowObj(last);
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const a = table[i - 1], b = table[i];
      const t = (x - a[0]) / (b[0] - a[0]);
      return rowObj(a.map((v, j) => v + (b[j] - v) * t));
    }
  }
  return rowObj(last);
}

const rowObj = (r) => ({ sd3n: r[1], sd2n: r[2], med: r[3], sd2p: r[4], sd3p: r[5] });

// Z-score aproksimasi: lebar SD dihitung dari sisi (bawah/atas) median
// tempat nilai berada.
function zOf(value, band) {
  if (value == null || !band) return null;
  const sdLow = (band.med - band.sd2n) / 2;
  const sdHigh = (band.sd2p - band.med) / 2;
  if (value <= band.med) return sdLow ? (value - band.med) / sdLow : null;
  return sdHigh ? (value - band.med) / sdHigh : null;
}

export function zBBU(umurBln, bbKg, jk) {
  return zOf(parseFloat(bbKg), interp(TABEL.bbu(jk), umurBln));
}
export function zTBU(umurBln, tbCm, jk) {
  return zOf(parseFloat(tbCm), interp(TABEL.tbu(jk), umurBln));
}
export function zBBTB(tbCm, bbKg, jk) {
  return zOf(parseFloat(bbKg), interp(TABEL.bbtb(jk), tbCm));
}

const r2 = (z) => (z === null ? null : Math.round(z * 100) / 100);

/* ---------------- Klasifikasi status gizi (permendagri/KMS) ---------------- */

// level: "bahaya" | "waspada" | "normal" — dipetakan ke warna di giziLevel.js
export function statusBBU(z) {
  if (z === null) return null;
  if (z < -3) return { key: "bb_sangat_kurang", label: "BB Sangat Kurang", level: "bahaya" };
  if (z < -2) return { key: "bb_kurang", label: "BB Kurang", level: "waspada" };
  if (z > 2) return { key: "bb_lebih", label: "Risiko BB Lebih", level: "waspada" };
  return { key: "bb_normal", label: "BB Normal", level: "normal" };
}

export function statusTBU(z) {
  if (z === null) return null;
  if (z < -3) return { key: "sangat_pendek", label: "Sangat Pendek", level: "bahaya" };
  if (z < -2) return { key: "pendek", label: "Pendek (Stunting)", level: "bahaya" };
  if (z > 3) return { key: "tinggi", label: "Tinggi", level: "normal" };
  return { key: "tb_normal", label: "Normal", level: "normal" };
}

export function statusBBTB(z) {
  if (z === null) return null;
  if (z < -3) return { key: "gizi_buruk", label: "Gizi Buruk", level: "bahaya" };
  if (z < -2) return { key: "gizi_kurang", label: "Gizi Kurang", level: "waspada" };
  if (z > 3) return { key: "obesitas", label: "Obesitas", level: "bahaya" };
  if (z > 2) return { key: "gizi_lebih", label: "Gizi Lebih", level: "waspada" };
  if (z > 1) return { key: "risiko_lebih", label: "Risiko Gizi Lebih", level: "normal" };
  return { key: "gizi_baik", label: "Gizi Baik", level: "normal" };
}

// Ringkasan satu pengukuran → semua z-score + status.
export function evaluasiUkur({ anak, bb, tb }) {
  const umur = anak?.umurUkur ?? null; // bulan penuh saat pengukuran
  const jk = anak?.jenisKelamin;
  const b = parseFloat(bb);
  const t = parseFloat(tb);
  const z1 = Number.isFinite(b) && umur !== null ? zBBU(umur, b, jk) : null;
  const z2 = Number.isFinite(t) && umur !== null ? zTBU(umur, t, jk) : null;
  const z3 = Number.isFinite(b) && Number.isFinite(t) ? zBBTB(t, b, jk) : null;
  return {
    zBBU: r2(z1), zTBU: r2(z2), zBBTB: r2(z3),
    sBBU: statusBBU(z1), sTBU: statusTBU(z2), sBBTB: statusBBTB(z3),
  };
}

/* ------------- Sistem Peringatan Dini (KMS rules) -------------

   Aturan kartu KMS klasik yang didigitalkan:
   1. Stunting  : z TB/U < -2SD → perlu rujukan
   2. BB tidak naik ("2T"): berat 2 pengukuran terakhir stagnan/turun
   3. Gizi kurang/buruk: z BB/U atau BB/TB < -2SD
   4. Imunisasi dasar belum lengkap di atas usia 12 bulan
   Hasil: array { tipe, level, pesan } — level "bahaya"|"waspada". */
export function peringatanDini({ logs = [], imunisasiDone = 0, umurBln = null }) {
  const out = [];
  const sorted = [...logs]
    .filter((l) => l.bb || l.tb)
    .sort((a, b) => (a.tanggal || a.bulan || "").localeCompare(b.tanggal || b.bulan || ""));
  const last = sorted[sorted.length - 1];

  if (last?.zTBU !== null && last?.zTBU !== undefined && last.zTBU < -2) {
    out.push({
      tipe: "stunting",
      level: "bahaya",
      pesan: "Tinggi badan di bawah -2SD — indikasi stunting, rujuk ke Puskesmas.",
    });
  }
  if (last?.zBBU !== null && last?.zBBU !== undefined && last.zBBU < -2) {
    out.push({
      tipe: "bb_kurang",
      level: "bahaya",
      pesan: "Berat badan di bawah garis merah KMS (< -2SD).",
    });
  } else if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2];
    if (last?.bb && prev?.bb && parseFloat(last.bb) <= parseFloat(prev.bb)) {
      out.push({
        tipe: "2t",
        level: "waspada",
        pesan: "Berat badan tidak naik dibanding pengukuran sebelumnya (2T).",
      });
    }
  }
  if (last?.zBBTB !== null && last?.zBBTB !== undefined && last.zBBTB < -2) {
    out.push({
      tipe: "gizi_kurang",
      level: "bahaya",
      pesan: "Berat terhadap tinggi < -2SD — gizi kurang, perlu pendampingan.",
    });
  }
  if (umurBln !== null && umurBln >= 12 && imunisasiDone < 11) {
    out.push({
      tipe: "imunisasi",
      level: "waspada",
      pesan: "Imunisasi dasar belum lengkap untuk usianya.",
    });
  }
  return out;
}

// Seri kurva referensi untuk grafik KMS (Recharts) — garis -3SD, -2SD,
// median, +2SD, +3SD pada rentang umur anak.
export function referensiSeries(jenis /* "bbu"|"tbu" */, jk, umurMax = 24) {
  const table = TABEL[jenis](jk);
  const max = Math.min(60, Math.max(24, Math.ceil(umurMax / 6) * 6));
  const pts = [];
  for (let m = 0; m <= max; m += (max <= 24 ? 1 : 2)) {
    const b = interp(table, m);
    pts.push({ umur: m, sd3n: r2(b.sd3n), sd2n: r2(b.sd2n), med: r2(b.med), sd2p: r2(b.sd2p), sd3p: r2(b.sd3p) });
  }
  return pts;
}
