// ============================================================
// Jadwal Imunisasi Dasar Anak (program imunisasi nasional IDAI/Kemenkes)
// umurMin/umurMax = rentang umur (bulan) pemberian yang direkomendasikan.
// ============================================================

export const JADWAL_IMUNISASI = [
  { key: "hb0", nama: "HB-0", umurMin: 0, umurMax: 0, usia: "0–24 jam" },
  { key: "bcg", nama: "BCG", umurMin: 0, umurMax: 1, usia: "0–1 bln" },
  { key: "polio1", nama: "Polio 1", umurMin: 0, umurMax: 1, usia: "0–1 bln" },
  { key: "dpt1", nama: "DPT-HB-Hib 1", umurMin: 2, umurMax: 3, usia: "2 bln" },
  { key: "polio2", nama: "Polio 2", umurMin: 2, umurMax: 3, usia: "2 bln" },
  { key: "dpt2", nama: "DPT-HB-Hib 2", umurMin: 3, umurMax: 4, usia: "3 bln" },
  { key: "polio3", nama: "Polio 3", umurMin: 3, umurMax: 4, usia: "3 bln" },
  { key: "dpt3", nama: "DPT-HB-Hib 3", umurMin: 4, umurMax: 6, usia: "4 bln" },
  { key: "polio4", nama: "Polio 4", umurMin: 4, umurMax: 6, usia: "4 bln" },
  { key: "ipv", nama: "IPV", umurMin: 4, umurMax: 6, usia: "4 bln" },
  { key: "campak", nama: "Campak / MR", umurMin: 9, umurMax: 12, usia: "9 bln" },
  { key: "dpt4", nama: "DPT-HB-Hib Lanjutan", umurMin: 18, umurMax: 24, usia: "18 bln" },
  { key: "campak2", nama: "Campak/MR Lanjutan", umurMin: 18, umurMax: 24, usia: "18 bln" },
];

export const vaksinByKey = (key) => JADWAL_IMUNISASI.find((v) => v.key === key);

// Status satu vaksin untuk anak:
//   "sudah"        — ada catatan pemberian (records = map key→dok imunisasi)
//   "terlambat"    — umur sudah melewati umurMax tapi belum diberikan
//   "jatuh_tempo"  — umur berada dalam rentang pemberian, belum diberikan
//   "belum_waktu"  — umur belum mencapai umurMin
export function statusVaksin(v, records, umurBln) {
  const rec = records?.get ? records.get(v.key) : records?.[v.key];
  if (rec) return { status: "sudah", rec };
  if (umurBln === null || umurBln === undefined) return { status: "belum_waktu" };
  if (umurBln > v.umurMax) return { status: "terlambat" };
  if (umurBln >= v.umurMin) return { status: "jatuh_tempo" };
  return { status: "belum_waktu" };
}

// Peta status lengkap satu anak + angka kelengkapan dasar (11 antigen dasar:
// tanpa dosis lanjutan dpt4/campak2).
export function petaImunisasi(records, umurBln) {
  const map = new Map(records?.entries ? records.entries() : Object.entries(records || {}));
  const items = JADWAL_IMUNISASI.map((v) => ({ ...v, ...statusVaksin(v, map, umurBln) }));
  const dasar = items.slice(0, 11);
  const done = dasar.filter((i) => i.status === "sudah").length;
  return {
    items,
    done,
    totalDasar: dasar.length,
    lengkap: done === dasar.length,
    jatuhTempo: items.filter((i) => i.status === "jatuh_tempo"),
    terlambat: items.filter((i) => i.status === "terlambat"),
  };
}

// Vaksin yang sedang bisa diberikan pada kunjungan ini
// (jatuh tempo atau terlambat = boleh dikejar/catch-up).
export function vaksinBoleh(records, umurBln) {
  return petaImunisasi(records, umurBln).items.filter(
    (i) => i.status === "jatuh_tempo" || i.status === "terlambat"
  );
}
