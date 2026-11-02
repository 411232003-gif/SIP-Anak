"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/db";
import { umurBulan, umurLabel, formatTglLahir } from "@/lib/utils";
import { petaImunisasi } from "@/lib/imunisasi";
import { InlineLoading } from "@/components/LoadingScreen";

const STATUS_UI = {
  sudah: { label: "Sudah", cls: "bg-emerald-100 text-emerald-700" },
  jatuh_tempo: { label: "Jatuh Tempo", cls: "bg-amber-100 text-amber-700" },
  terlambat: { label: "Terlambat", cls: "bg-red-100 text-red-700" },
  belum_waktu: { label: "Belum Waktunya", cls: "bg-gray-100 text-gray-400" },
};

export default function ImunisasiOrtuPage() {
  const { user } = useAuth();
  const [anak, setAnak] = useState(null);
  const [imunisasi, setImunisasi] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [w, im] = await Promise.all([api.getAnak(user.nik), api.listImunisasi(user.nik)]);
    setAnak(w);
    setImunisasi(im);
    setLoading(false);
  }, [user.nik]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <InlineLoading label="Memuat jadwal imunisasi..." />
      </div>
    );
  }

  const umur = umurBulan(anak?.tanggalLahir);
  const peta = petaImunisasi(imunisasi, umur);
  const map = new Map(imunisasi.map((r) => [r.vaksin, r]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Imunisasi {anak?.nama}</h1>
        <p className="text-sm text-gray-500">
          Usia {umurLabel(anak?.tanggalLahir)} · {peta.done}/{peta.totalDasar} imunisasi dasar lengkap
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-pink-100 bg-white p-4">
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          <span className="text-gray-600">Kelengkapan Imunisasi Dasar</span>
          <span className="text-pink-700">{Math.round((peta.done / peta.totalDasar) * 100)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-pink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-600 transition-all"
            style={{ width: `${(peta.done / peta.totalDasar) * 100}%` }}
          />
        </div>
        {peta.lengkap && (
          <p className="mt-2 text-xs font-semibold text-emerald-600">Imunisasi dasar lengkap — kerja bagus!</p>
        )}
      </div>

      <ul className="space-y-2">
        {peta.items.map((v) => {
          const ui = STATUS_UI[v.status];
          const rec = map.get(v.key);
          return (
            <li key={v.key} className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
                  v.status === "sudah" ? "bg-emerald-500" : v.status === "belum_waktu" ? "bg-gray-300" : "bg-pink-500"
                }`}>
                  {v.status === "sudah" ? (
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 2 4 4" /><path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{v.nama}</p>
                  <p className="text-[11px] text-gray-400">
                    Jadwal {v.usia}
                    {rec?.tanggal ? ` · diberikan ${formatTglLahir(rec.tanggal)}` : ""}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${ui.cls}`}>{ui.label}</span>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-gray-400">
        Status &quot;Terlambat&quot; berarti vaksin sudah melewati jadwal — segera bawa anak
        ke Posyandu terdekat untuk imunisasi kejar (catch-up).
      </p>
    </div>
  );
}
