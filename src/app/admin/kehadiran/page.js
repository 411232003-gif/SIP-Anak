"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/db";
import { bulanKey, matchSearch, umurLabel, tanggalIndo, formatTglLahir } from "@/lib/utils";
import FilterBar from "@/components/FilterBar";
import Pagination, { usePagination } from "@/components/Pagination";
import ScanNikModal from "@/components/ScanNikModal";
import Modal from "@/components/Modal";
import { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

export default function KehadiranPage() {
  const [anak, setAnak] = useState([]);
  const [kehadiran, setKehadiran] = useState([]);
  const [rw, setRw] = useState("Semua");
  const [rt, setRt] = useState("Semua");
  const [q, setQ] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);

  const bulan = bulanKey();

  const load = useCallback(async () => {
    const [w, a] = await Promise.all([api.listAnak(), api.listKehadiran()]);
    setAnak(w);
    setKehadiran(a);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const hadirMap = useMemo(() => {
    const m = new Map();
    kehadiran.filter((a) => a.bulan === bulan).forEach((a) => m.set(a.nik, a));
    return m;
  }, [kehadiran, bulan]);

  const filtered = useMemo(
    () => anak
      .filter((w) =>
        (rw === "Semua" || w.rw === rw) &&
        (rt === "Semua" || w.rt === rt) &&
        matchSearch(w, q)
      )
      .sort((a, b) => {
        const ra = hadirMap.get(a.nik);
        const rb = hadirMap.get(b.nik);
        if (Boolean(ra) !== Boolean(rb)) return ra ? 1 : -1;
        if (ra && rb) return (rb.createdAt || "").localeCompare(ra.createdAt || "");
        return 0;
      }),
    [anak, hadirMap, rw, rt, q]
  );

  const pg = usePagination(filtered, { resetDeps: [rw, rt, q] });

  async function hadir(w) {
    setBusy(w.nik);
    try {
      await api.addKehadiran(w);
      setToast(`${w.nama} ditandai hadir`);
      await load();
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusy(null);
      setScanTarget(null);
      setTimeout(() => setToast(""), 3000);
    }
  }

  async function batalHadir(w) {
    setBusy(w.nik);
    try {
      await api.deleteKehadiran(w.nik);
      setToast(`Kehadiran ${w.nama} dibatalkan`);
      await load();
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusy(null);
      setCancelTarget(null);
      setTimeout(() => setToast(""), 3000);
    }
  }

  function onScan(nik) {
    setShowScan(false);
    const w = anak.find((x) => x.nik === nik);
    if (w) {
      setScanTarget(w);
    } else {
      setToast(`NIK ${nik} tidak terdaftar sebagai anak`);
      setTimeout(() => setToast(""), 4000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Kehadiran Posyandu</h1>
          <p className="text-sm text-gray-500">{tanggalIndo()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowScan(true)} className="btn-back">
            <svg viewBox="0 0 24 24">
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H7l1.2-1.8a1 1 0 0 1 .83-.45h5.94a1 1 0 0 1 .83.45L17 7h1.5A1.5 1.5 0 0 1 20 8.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-8Z" />
              <circle cx="12" cy="12.5" r="3" />
            </svg>
            Scan E-KMS
          </button>
          <button
            onClick={() => setShowFilter((s) => !s)}
            className={`btn-back ${showFilter ? "" : "btn-muted"}`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5L4 5Z" />
            </svg>
            Filter
          </button>
        </div>
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
          <table className="w-full text-left text-sm md:min-w-[720px]">
            <thead>
              <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Nama Anak</th>
                <th className="hidden px-4 py-3 md:table-cell">Nama Ibu</th>
                <th className="px-4 py-3">RW/RT</th>
                <th className="hidden px-4 py-3 md:table-cell">Usia</th>
                <th className="hidden px-4 py-3 md:table-cell">Status Bulan Ini</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6"><InlineLoading /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada anak ditemukan</td></tr>
              ) : (
                pg.pageItems.map((w) => {
                  const rec = hadirMap.get(w.nik);
                  return (
                    <tr key={w.nik} className="hover:bg-pink-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{w.nama}</td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{w.namaIbu || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{w.rw} / {w.rt}</td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{umurLabel(w.tanggalLahir)}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {rec ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            Hadir · {formatTglLahir(rec.tanggal)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => hadir(w)}
                            disabled={Boolean(rec) || busy === w.nik}
                            className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {busy === w.nik ? <MiniSpinner /> : rec ? "Sudah Hadir" : "Hadir"}
                          </button>
                          {rec && (
                            <button
                              onClick={() => setCancelTarget(w)}
                              className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Batal
                            </button>
                          )}
                        </div>
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

      <p className="text-xs text-gray-500">
        {hadirMap.size} anak hadir bulan ini · {filtered.length} anak ditampilkan
      </p>

      {/* Konfirmasi batal hadir */}
      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Batalkan Kehadiran">
        {cancelTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Kehadiran <b>{cancelTarget.nama}</b> bulan ini akan dihapus. Anak harus
              ditandai hadir ulang jika diperlukan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                onClick={() => batalHadir(cancelTarget)}
                disabled={busy === cancelTarget.nik}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy === cancelTarget.nik ? <><MiniSpinner />Memproses...</> : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ScanNikModal open={showScan} onClose={() => setShowScan(false)} onScan={onScan} />

      {/* Hasil pindaian — konfirmasi tandai hadir */}
      <Modal open={Boolean(scanTarget)} onClose={() => setScanTarget(null)} title="Hasil Pindai E-KMS">
        {scanTarget && (
          <div className="space-y-3">
            <dl className="rounded-xl border border-gray-200 text-sm">
              <div className="flex justify-between border-b border-gray-100 px-4 py-2.5">
                <dt className="text-gray-500">Nama</dt>
                <dd className="font-semibold text-gray-900">{scanTarget.nama}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 px-4 py-2.5">
                <dt className="text-gray-500">NIK</dt>
                <dd className="font-mono text-gray-900">{scanTarget.nik}</dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-gray-500">Usia</dt>
                <dd className="text-gray-900">{umurLabel(scanTarget.tanggalLahir)}</dd>
              </div>
            </dl>
            {hadirMap.has(scanTarget.nik) ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {scanTarget.nama} sudah tercatat hadir bulan ini.
              </p>
            ) : (
              <button
                onClick={() => hadir(scanTarget)}
                disabled={busy === scanTarget.nik}
                className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {busy === scanTarget.nik ? <><MiniSpinner />Memproses...</> : "Tandai Hadir"}
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
