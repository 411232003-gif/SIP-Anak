"use client";

import { QRCodeSVG } from "qrcode.react";
import { umurLabel } from "@/lib/utils";

// Isi QR: JSON agar scanner bisa membedakan QR E-KMS dari QR lain.
export function qrValue(anak) {
  return JSON.stringify({ app: "sipanak-posyandu", nik: anak.nik });
}

export default function KartuAnak({ anak, profil }) {
  const logo = profil.logo || "/icons/icon-192.png";

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-pink-600 to-fuchsia-600 text-white shadow-lg">
      {/* Kepala kartu */}
      <div className="flex items-center gap-2.5 border-b border-white/20 px-4 py-3">
        <img
          src={logo}
          alt="Logo posyandu"
          className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-100">
            E-KMS Digital
          </p>
          <p className="truncate text-sm font-bold uppercase">{profil.namaPosyandu}</p>
        </div>
      </div>

      {/* Isi kartu */}
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold leading-tight">{anak.nama}</p>
          <p className="mt-1 font-mono text-sm tracking-wider text-pink-50">{anak.nik}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full bg-white/15 px-2 py-0.5">{anak.rw} / {anak.rt}</span>
            {anak.jenisKelamin && (
              <span className="rounded-full bg-white/15 px-2 py-0.5">{anak.jenisKelamin}</span>
            )}
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              {umurLabel(anak.tanggalLahir)}
            </span>
          </div>
          {anak.namaIbu && (
            <p className="mt-2 truncate text-[11px] text-pink-100">Ibu: {anak.namaIbu}</p>
          )}
        </div>
        <div className="shrink-0 rounded-xl bg-white p-2">
          <QRCodeSVG value={qrValue(anak)} size={104} marginSize={1} />
        </div>
      </div>

      <p className="bg-black/15 px-4 py-2 text-center text-[10px] text-pink-50">
        Tunjukkan QR ini kepada kader saat datang ke Posyandu
      </p>
    </div>
  );
}
