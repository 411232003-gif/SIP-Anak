// Warna status gizi anak → dipakai untuk mewarnai teks di tabel
// (Tailwind class) maupun di hasil export Excel (ARGB) & PDF (RGB).
// Level mengikuti `level` dari status*() di growth.js.

export const GIZI_LEVELS = {
  bahaya: { label: "Perlu Tindakan", tw: "text-red-500 font-bold", argb: "FFEF4444", rgb: [239, 68, 68], badge: "bg-red-100 text-red-700", dot: "#ef4444" },
  waspada: { label: "Waspada", tw: "text-amber-600 font-semibold", argb: "FFD97706", rgb: [217, 119, 6], badge: "bg-amber-100 text-amber-700", dot: "#d97706" },
  normal: { label: "Normal", tw: "text-emerald-600", argb: "FF10B981", rgb: [16, 185, 129], badge: "bg-emerald-100 text-emerald-700", dot: "#10b981" },
};

// Tailwind class untuk sel tabel; status null → warna default.
export function hc(status, fallback = "text-gray-600") {
  return status?.level ? GIZI_LEVELS[status.level].tw : fallback;
}

// Untuk exporter: cell { v, lv } — lv = status object dari growth.js
export function lvOf(status) {
  return status?.level || null;
}
