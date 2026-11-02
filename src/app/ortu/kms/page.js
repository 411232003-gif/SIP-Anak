"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, DEFAULT_PROFIL } from "@/lib/db";
import { umurBulan, umurLabel, bulanLabel } from "@/lib/utils";
import { GIZI_LEVELS, hc } from "@/lib/giziLevel";
import KartuAnak from "@/components/KartuAnak";
import GrowthChart from "@/components/GrowthChart";
import { InlineLoading } from "@/components/LoadingScreen";

export default function KmsPage() {
  const { user } = useAuth();
  const [anak, setAnak] = useState(null);
  const [pengukuran, setPengukuran] = useState([]);
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [loading, setLoading] = useState(true);
  const [jenis, setJenis] = useState("bbu");

  const load = useCallback(async () => {
    const [w, p, prof] = await Promise.all([
      api.getAnak(user.nik),
      api.listPengukuran(user.nik),
      api.getProfil(),
    ]);
    setAnak(w);
    setProfil({ ...DEFAULT_PROFIL, ...prof });
    setPengukuran(p.sort((a, b) => (a.umurBln ?? 0) - (b.umurBln ?? 0)));
    setLoading(false);
  }, [user.nik]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const umur = umurBulan(anak?.tanggalLahir);
  const terbaru = pengukuran[pengukuran.length - 1];

  const ringkasan = useMemo(() => {
    if (!terbaru) return [];
    return [
      { label: "Berat / Umur", st: terbaru.sBBU, z: terbaru.zBBU },
      { label: "Tinggi / Umur", st: terbaru.sTBU, z: terbaru.zTBU },
      { label: "Berat / Tinggi", st: terbaru.sBBTB, z: terbaru.zBBTB },
    ];
  }, [terbaru]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <InlineLoading label="Memuat KMS digital..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">KMS Digital</h1>
        <p className="text-sm text-gray-500">
          Kartu Menuju Sehat {anak?.nama} · {umurLabel(anak?.tanggalLahir)}
        </p>
      </div>

      {anak && <KartuAnak anak={anak} profil={profil} />}

      {/* Ringkasan status gizi terakhir */}
      {terbaru ? (
        <div className="grid grid-cols-3 gap-2">
          {ringkasan.map(({ label, st, z }) => (
            <div key={label} className="rounded-xl border border-pink-100 bg-white p-3 text-center">
              <p className="text-[10px] font-medium uppercase text-gray-500">{label}</p>
              <p className={`mt-1 text-sm font-bold ${hc(st)}`}>{st?.label || "-"}</p>
              {z !== null && z !== undefined && (
                <p className="mt-0.5 text-[10px] text-gray-400">z = {z}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-pink-100 bg-white px-4 py-6 text-center text-sm text-gray-400">
          Belum ada data penimbangan — datanglah ke Posyandu pada jadwal berikutnya.
        </p>
      )}

      {/* Grafik KMS */}
      <div className="rounded-xl border border-pink-100 bg-white p-3 sm:p-4">
        <div className="mb-3 flex gap-1.5">
          {[
            ["bbu", "Berat menurut Umur"],
            ["tbu", "Tinggi menurut Umur"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setJenis(k)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                jenis === k ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <GrowthChart jenis={jenis} jk={anak?.jenisKelamin} logs={pengukuran} umurMax={umur || 24} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-300" /> Zona normal (-3SD s.d. +2SD)</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-red-600" /> Batas -2SD (garis merah KMS)</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-pink-700" /> Kurva anak</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Grafik mengikuti standar WHO — bila titik anak turun di bawah garis merah,
        segera konsultasikan ke kader atau Puskesmas.
      </p>
    </div>
  );
}
