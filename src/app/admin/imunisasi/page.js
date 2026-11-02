"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/db";
import { bulanKey, matchSearch, umurBulan, umurLabel, tanggalIndo, formatTglLahir } from "@/lib/utils";
import { petaImunisasi } from "@/lib/imunisasi";
import FilterBar from "@/components/FilterBar";
import Pagination, { usePagination } from "@/components/Pagination";
import Modal from "@/components/Modal";
import LoadingScreen, { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

const STATUS_UI = {
  sudah: { label: "Sudah", cls: "bg-emerald-100 text-emerald-700" },
  jatuh_tempo: { label: "Jatuh Tempo", cls: "bg-amber-100 text-amber-700" },
  terlambat: { label: "Terlambat", cls: "bg-red-100 text-red-700" },
  belum_waktu: { label: "Belum Waktunya", cls: "bg-gray-100 text-gray-400" },
};

export default function ImunisasiPage() {
  const [anak, setAnak] = useState([]);
  const [kehadiran, setKehadiran] = useState([]);
  const [imunisasi, setImunisasi] = useState([]);
  const [rw, setRw] = useState("Semua");
  const [rt, setRt] = useState("Semua");
  const [q, setQ] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState("");

  const bulan = bulanKey();

  const load = useCallback(async () => {
    const [w, a, p] = await Promise.all([api.listAnak(), api.listKehadiran(), api.listImunisasi()]);
    setAnak(w);
    setKehadiran(a);
    setImunisasi(p);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const hadirNik = useMemo(
    () => new Set(kehadiran.filter((a) => a.bulan === bulan).map((a) => a.nik)),
    [kehadiran, bulan]
  );

  const imunMap = useMemo(() => {
    const m = new Map();
    imunisasi.forEach((r) => {
      if (!m.has(r.nik)) m.set(r.nik, new Map());
      m.get(r.nik).set(r.vaksin, r);
    });
    return m;
  }, [imunisasi]);

  const filtered = useMemo(
    () => anak
      .filter((w) =>
        hadirNik.has(w.nik) &&
        (rw === "Semua" || w.rw === rw) &&
        (rt === "Semua" || w.rt === rt) &&
        matchSearch(w, q)
      )
      .sort((a, b) => {
        const due = (w) => {
          const peta = petaImunisasi(imunMap.get(w.nik) || new Map(), umurBulan(w.tanggalLahir));
          return peta.jatuhTempo.length + peta.terlambat.length;
        };
        return due(b) - due(a);
      }),
    [anak, hadirNik, imunMap, rw, rt, q]
  );

  const pg = usePagination(filtered, { resetDeps: [rw, rt, q] });

  async function beriVaksin(w, v) {
    const key = `${w.nik}_${v.key}`;
    setBusyKey(key);
    try {
      await api.addImunisasi(w.nik, v, { nama: w.nama, rw: w.rw, rt: w.rt });
      setToast(`${v.nama} untuk ${w.nama} tercatat`);
      await load();
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusyKey("");
      setTimeout(() => setToast(""), 3000);
    }
  }

  async function hapusVaksin(w, v) {
    const key = `${w.nik}_${v.key}`;
    setBusyKey(key);
    try {
      await api.deleteImunisasi(w.nik, v.key);
      setToast(`Catatan ${v.nama} ${w.nama} dihapus`);
      await load();
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusyKey("");
      setTimeout(() => setToast(""), 3000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Imunisasi Anak</h1>
          <p className="text-sm text-gray-500">{tanggalIndo()} — hanya anak yang hadir bulan ini</p>
        </div>
        <button
          onClick={() => setShowFilter((s) => !s)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            showFilter ? "border-pink-600 bg-pink-50 text-pink-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Filter
        </button>
      </div>

      {showFilter && (
        <div className="rounded-xl border border-pink-100 bg-white p-3">
          <FilterBar rw={rw} setRw={setRw} rt={rt} setRt={setRt} q={q} setQ={setQ} />
        </div>
      )}

      {toast && (
        <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700">{toast}</div>
      )}

      <div className="rounded-xl border border-pink-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm md:min-w-[640px]">
            <thead>
              <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Nama Anak</th>
                <th className="hidden px-4 py-3 md:table-cell">Usia</th>
                <th className="px-4 py-3">RW/RT</th>
                <th className="hidden px-4 py-3 md:table-cell">Imunisasi Dasar</th>
                <th className="hidden px-4 py-3 md:table-cell">Jatuh Tempo</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6"><InlineLoading /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada anak yang hadir bulan ini</td></tr>
              ) : (
                pg.pageItems.map((w) => {
                  const peta = petaImunisasi(imunMap.get(w.nik) || new Map(), umurBulan(w.tanggalLahir));
                  const due = peta.jatuhTempo.length + peta.terlambat.length;
                  return (
                    <tr key={w.nik} className="hover:bg-pink-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{w.nama}</td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{umurLabel(w.tanggalLahir)}</td>
                      <td className="px-4 py-3 text-gray-600">{w.rw} / {w.rt}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${peta.lengkap ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {peta.done}/{peta.totalDasar}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {due > 0 ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{due} vaksin</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setTarget(w)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            due > 0
                              ? "bg-pink-600 text-white hover:bg-pink-700"
                              : "border border-pink-600 text-pink-700 hover:bg-pink-50"
                          }`}
                        >
                          Kelola
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pg.page}
          totalPages={pg.totalPages}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onChange={pg.setPage}
          className="border-t border-pink-100 px-4 py-3"
        />
      </div>

      {/* Modal kelola imunisasi per anak */}
      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={`Imunisasi — ${target?.nama || ""}`}>
        {target && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Usia {umurLabel(target.tanggalLahir)} · ketuk untuk mencatat pemberian vaksin hari ini
            </p>
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {petaImunisasi(imunMap.get(target.nik) || new Map(), umurBulan(target.tanggalLahir)).items.map((v) => {
                const ui = STATUS_UI[v.status];
                const key = `${target.nik}_${v.key}`;
                return (
                  <li key={v.key} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{v.nama}</p>
                      <p className="text-[11px] text-gray-400">
                        Jadwal {v.usia}
                        {v.status === "sudah" && v.rec?.tanggal ? ` · diberikan ${formatTglLahir(v.rec.tanggal)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ui.cls}`}>{ui.label}</span>
                      {v.status === "sudah" ? (
                        <button
                          onClick={() => hapusVaksin(target, v)}
                          disabled={busyKey === key}
                          className="rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {busyKey === key ? <MiniSpinner /> : "Hapus"}
                        </button>
                      ) : (v.status === "jatuh_tempo" || v.status === "terlambat") ? (
                        <button
                          onClick={() => beriVaksin(target, v)}
                          disabled={busyKey === key}
                          className="rounded-lg bg-pink-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                        >
                          {busyKey === key ? <MiniSpinner /> : "Beri"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
