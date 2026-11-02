"use client";

import { tanggalIndo } from "@/lib/utils";

const JABATAN = {
  ketua: (profil) => `Ketua ${profil.namaPosyandu.replace(/^kelurahan\s*/i, "")}`,
  kapus: () => "Kepala Puskesmas",
};

export function penandatangan(edaran, profil) {
  const kapus = edaran.penandatangan === "kapus";
  return {
    jabatan: (JABATAN[edaran.penandatangan] || JABATAN.ketua)(profil),
    nama: kapus ? profil.namaKapus : profil.namaKetua,
  };
}

export default function SuratSheet({ edaran, profil, className = "" }) {
  const logo = profil.logo || "/icon.png";
  const ttd = penandatangan(edaran, profil);
  const tgl = edaran.tanggal ? new Date(`${edaran.tanggal}T00:00:00`) : new Date();

  return (
    <div className={`bg-white text-gray-900 ${className}`}>
      {/* Kop surat */}
      <div className="flex items-center gap-3 border-b-4 border-double border-gray-800 pb-3">
        <img src={logo} alt="Logo kelurahan" className="h-16 w-16 shrink-0 rounded object-contain" />
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">
            Posyandu
          </p>
          <p className="text-lg font-bold uppercase leading-tight">
            {profil.namaPosyandu}
          </p>
          <p className="text-[11px] text-gray-600">
            {[profil.alamatPosyandu, profil.telpOperator && `Telp. ${profil.telpOperator}`]
              .filter(Boolean).join(" · ") || "\u00A0"}
          </p>
        </div>
        <div className="w-16 shrink-0" />
      </div>

      {/* Nomor & judul */}
      <div className="mt-4 text-center">
        <p className="text-sm font-bold uppercase tracking-wide underline underline-offset-4">
          Surat Edaran
        </p>
        {edaran.nomor && (
          <p className="mt-0.5 text-xs text-gray-600">Nomor: {edaran.nomor}</p>
        )}
      </div>

      <p className="mt-4 text-right text-xs text-gray-700">
        {tanggalIndo(tgl)}
      </p>

      <h2 className="mt-3 text-base font-bold leading-snug">{edaran.judul}</h2>

      <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800">
        {edaran.isi}
      </div>

      {/* Tanda tangan */}
      <div className="mt-8 flex justify-end">
        <div className="w-48 text-center">
          <p className="text-sm">{ttd.jabatan}</p>
          <div className="h-16" />
          <p className="text-sm font-bold underline underline-offset-2">
            {ttd.nama || "(..............................)"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Unduh surat sebagai dokumen Word (.doc). Isi file berupa HTML yang kompatibel
// dengan Microsoft Word / WPS / Google Docs — bisa langsung dibuka & dicetak.
export function downloadEdaranDoc(edaran, profil) {
  const logoSrc = profil.logo || `${window.location.origin}/icon.png`;
  const ttd = penandatangan(edaran, profil);
  const tgl = edaran.tanggal ? new Date(`${edaran.tanggal}T00:00:00`) : new Date();
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const kontak = [profil.alamatPosyandu, profil.telpOperator && `Telp. ${profil.telpOperator}`]
    .filter(Boolean).join(" &middot; ");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${esc(edaran.judul)}</title>
<style>
  body { font-family: "Times New Roman", serif; color: #111; max-width: 720px; margin: 32px auto; padding: 0 24px; }
  .kop { display: flex; align-items: center; gap: 16px; border-bottom: 4px double #333; padding-bottom: 12px; }
  .kop img { width: 80px; height: 80px; object-fit: contain; }
  .kop div { flex: 1; text-align: center; }
  .kop .kecil { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #444; margin: 0; }
  .kop h1 { font-size: 24px; margin: 2px 0; text-transform: uppercase; }
  .kop .kontak { font-size: 12px; color: #444; margin: 0; }
  .judul { text-align: center; margin-top: 20px; }
  .judul p { font-weight: bold; text-transform: uppercase; text-decoration: underline; margin: 0; letter-spacing: 1px; }
  .judul span { font-size: 13px; color: #444; }
  .tgl { text-align: right; font-size: 13px; margin-top: 20px; }
  h2 { font-size: 17px; margin: 16px 0 8px; }
  .isi { font-size: 14px; line-height: 1.8; white-space: pre-line; }
  .ttd { margin-top: 48px; display: flex; justify-content: flex-end; }
  .ttd div { width: 220px; text-align: center; font-size: 14px; }
  .ttd .nama { font-weight: bold; text-decoration: underline; margin-top: 64px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="kop">
    <img src="${esc(logoSrc)}" alt="Logo">
    <div>
      <p class="kecil">Posyandu</p>
      <h1>${esc(profil.namaPosyandu)}</h1>
      <p class="kontak">${kontak || "&nbsp;"}</p>
    </div>
    <span style="width:80px"></span>
  </div>
  <div class="judul">
    <p>Surat Edaran</p>
    ${edaran.nomor ? `<span>Nomor: ${esc(edaran.nomor)}</span>` : ""}
  </div>
  <p class="tgl">${esc(tanggalIndo(tgl))}</p>
  <h2>${esc(edaran.judul)}</h2>
  <div class="isi">${esc(edaran.isi)}</div>
  <div class="ttd">
    <div>
      <p>${esc(ttd.jabatan)}</p>
      <p class="nama">${esc(ttd.nama || "(..............................)")}</p>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `surat-edaran-${(edaran.judul || "posbindu").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
