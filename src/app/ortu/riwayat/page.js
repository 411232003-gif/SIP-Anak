"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/db";
import { bulanLabel, formatTglLahir } from "@/lib/utils";
import { InlineLoading } from "@/components/LoadingScreen";

export default function RiwayatPage() {
  const { user } = useAuth();
  const [pengukuran, setPengukuran] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await api.listPengukuran(user.nik);
    setPengukuran(p.sort((a, b) => b.bulan.localeCompare(a.bulan)));
    setLoading(false);
  }, [user.nik]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <InlineLoading label="Memuat riwayat pengukuran..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Riwayat Penimbangan</h1>
        <p className="text-sm text-gray-500">Semua hasil pengukuran anak dari bulan ke bulan</p>
      </div>

      {pengukuran.length === 0 ? (
        <p className="rounded-xl border border-pink-100 bg-white px-4 py-8 text-center text-sm text-gray-400">
          Belum ada riwayat pengukuran.
        </p>
      ) : (
        <ul className="space-y-3">
          {pengukuran.map((p) => (
            <li key={`${p.nik}_${p.bulan}`} className="rounded-xl border border-pink-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">{bulanLabel(p.bulan)}</p>
                <p className="text-xs text-gray-400">
                  {p.tanggal ? formatTglLahir(p.tanggal) : ""}
                  {p.umurBln !== undefined && p.umurBln !== null ? ` · usia ${p.umurBln} bln` : ""}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ["BB", p.bb && `${p.bb} kg`],
                  ["TB", p.tb && `${p.tb} cm`],
                  ["LK", p.lk && `${p.lk} cm`],
                  ["LILA", p.lila && `${p.lila} cm`],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-pink-50/70 p-2">
                    <p className="text-[10px] uppercase text-gray-500">{l}</p>
                    <p className="text-sm font-bold text-gray-900">{v || "-"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[p.sBBU, p.sTBU, p.sBBTB].filter(Boolean).map((s) => (
                  <span key={s.key} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${GIZI_BADGE[s.level]}`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const GIZI_BADGE = {
  bahaya: "bg-red-100 text-red-700",
  waspada: "bg-amber-100 text-amber-700",
  normal: "bg-emerald-100 text-emerald-700",
};
