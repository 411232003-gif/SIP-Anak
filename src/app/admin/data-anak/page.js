"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, DEFAULT_PROFIL } from "@/lib/db";
import { RW_LIST, RT_LIST, umurLabel, matchSearch } from "@/lib/utils";
import AnakFormModal from "@/components/AnakFormModal";
import ScanNikModal from "@/components/ScanNikModal";
import Pagination, { usePagination } from "@/components/Pagination";
import LoadingScreen, { InlineLoading } from "@/components/LoadingScreen";

const UMUR_OPTS = [
  { v: "Semua", label: "Semua Umur" },
  { v: "bawah1", label: "< 12 bulan" },
  { v: "bawah2", label: "12–23 bulan" },
  { v: "balita", label: "24–59 bulan" },
  { v: "atas5", label: "≥ 5 tahun" },
];

const selectCls =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none";

function matchUmur(tglLahir, opt) {
  if (opt === "Semua") return true;
  if (!tglLahir) return false;
  const d = new Date(tglLahir);
  const m = (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
  if (opt === "bawah1") return m < 12;
  if (opt === "bawah2") return m >= 12 && m < 24;
  if (opt === "balita") return m >= 24 && m < 60;
  if (opt === "atas5") return m >= 60;
  return true;
}

export default function DataAnakPage() {
  const [anak, setAnak] = useState([]);
  const [rw, setRw] = useState("Semua");
  const [rt, setRt] = useState("Semua");
  const [umur, setUmur] = useState("Semua");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showPin, setShowPin] = useState({});
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [showFilter, setShowFilter] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [w, p] = await Promise.all([api.listAnak(), api.getProfil()]);
    setAnak(w);
    setProfil({ ...DEFAULT_PROFIL, ...p });
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const filtered = useMemo(
    () => anak.filter((w) =>
      (rw === "Semua" || w.rw === rw) &&
      (rt === "Semua" || w.rt === rt) &&
      matchUmur(w.tanggalLahir, umur) &&
      matchSearch(w, q)
    ),
    [anak, rw, rt, umur, q]
  );

  const pg = usePagination(filtered, { perPage: 12, resetDeps: [rw, rt, umur, q] });

  function onScan(nik) {
    setShowScan(false);
    const w = anak.find((x) => x.nik === nik);
    if (w) {
      setQ(w.nik);
      setToast(`Menampilkan ${w.nama} (NIK ${w.nik})`);
    } else {
      setToast(`NIK ${nik} tidak terdaftar sebagai anak`);
    }
    setTimeout(() => setToast(""), 4000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteAnak(confirmDel.nik);
      setConfirmDel(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Data Anak</h1>
          <p className="text-sm text-gray-500">Daftar anak {profil.namaPosyandu}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowScan(true)} className="btn-back">
            <svg viewBox="0 0 24 24">
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H7l1.2-1.8a1 1 0 0 1 .83-.45h5.94a1 1 0 0 1 .83.45L17 7h1.5A1.5 1.5 0 0 1 20 8.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-8Z" />
              <circle cx="12" cy="12.5" r="3" />
            </svg>
            Scan
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
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-back">
            + Tambah Anak
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="rounded-xl border border-pink-100 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{filtered.length} anak ditemukan</span>
            <select className={selectCls} value={rw} onChange={(e) => setRw(e.target.value)}>
              <option value="Semua">Semua RW</option>
              {RW_LIST.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select className={selectCls} value={rt} onChange={(e) => setRt(e.target.value)}>
              <option value="Semua">Semua RT</option>
              {RT_LIST.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select className={selectCls} value={umur} onChange={(e) => setUmur(e.target.value)}>
              {UMUR_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
            <input
              className={`${selectCls} min-w-0 flex-1`}
              placeholder="Cari nama anak / ibu / NIK..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700">{toast}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-pink-100 bg-white px-4 py-6"><InlineLoading /></div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-gray-400">Tidak ada anak ditemukan</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pg.pageItems.map((w) => (
              <div key={w.nik} className="rounded-xl border border-pink-100 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{w.nama}</p>
                    <p className="text-xs text-gray-500">NIK: {w.nik}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      Sandi Ortu:{" "}
                      {showPin[w.nik] ? (
                        <span className="font-mono font-semibold text-pink-700">{w.pin}</span>
                      ) : (
                        <span className="font-mono tracking-widest text-gray-400">••••••</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPin((s) => ({ ...s, [w.nik]: !s[w.nik] }))}
                        className="ml-0.5 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-pink-600"
                        aria-label={showPin[w.nik] ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          {showPin[w.nik] ? (
                            <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></>
                          ) : (
                            <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>
                          )}
                        </svg>
                      </button>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700">
                    {w.rw} / {w.rt}
                  </span>
                </div>
                <div className="mt-3 space-y-0.5 text-xs text-gray-600">
                  <p>{umurLabel(w.tanggalLahir)} · {w.jenisKelamin}</p>
                  {w.namaIbu && <p>Ibu: {w.namaIbu}</p>}
                  {w.alamat && <p className="truncate">{w.alamat}</p>}
                  {w.noTelp && <p>{w.noTelp}</p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setEditing(w); setShowForm(true); }}
                    className="flex-1 rounded-lg border border-pink-600 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDel(w)}
                    className="flex-1 rounded-lg border border-red-300 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={pg.page}
            totalPages={pg.totalPages}
            total={pg.total}
            start={pg.start}
            end={pg.end}
            onChange={pg.setPage}
            className="rounded-xl border border-pink-100 bg-white px-4 py-3"
          />
        </>
      )}

      <ScanNikModal open={showScan} onClose={() => setShowScan(false)} onScan={onScan} />

      <AnakFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        initial={editing}
        onSaved={load}
      />

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-gray-900">Hapus {confirmDel.nama}?</p>
            <p className="mt-1 text-sm text-gray-500">
              Data anak beserta riwayat kehadiran, pengukuran, dan imunisasinya akan dihapus permanen.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600">
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && <LoadingScreen overlay label="Menghapus data anak..." />}
    </div>
  );
}
