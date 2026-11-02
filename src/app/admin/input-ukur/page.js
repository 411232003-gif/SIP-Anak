"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/db";
import { bulanKey, matchSearch, todayKey, umurBulan, umurLabel, tanggalIndo, parseNumID } from "@/lib/utils";
import { evaluasiUkur } from "@/lib/growth";
import { hc } from "@/lib/giziLevel";
import FilterBar from "@/components/FilterBar";
import Pagination, { usePagination } from "@/components/Pagination";
import Modal from "@/components/Modal";
import LoadingScreen, { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

export default function InputUkurPage() {
  const [anak, setAnak] = useState([]);
  const [kehadiran, setKehadiran] = useState([]);
  const [pengukuran, setPengukuran] = useState([]);
  const [rw, setRw] = useState("Semua");
  const [rt, setRt] = useState("Semua");
  const [q, setQ] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ bb: "", tb: "", lk: "", lila: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const bulan = bulanKey();

  const load = useCallback(async () => {
    const [w, a, p] = await Promise.all([api.listAnak(), api.listKehadiran(), api.listPengukuran()]);
    setAnak(w);
    setKehadiran(a);
    setPengukuran(p);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const hadirNik = useMemo(
    () => new Set(kehadiran.filter((a) => a.bulan === bulan).map((a) => a.nik)),
    [kehadiran, bulan]
  );

  const pengMap = useMemo(() => {
    const m = new Map();
    pengukuran.filter((p) => p.bulan === bulan).forEach((p) => m.set(p.nik, p));
    return m;
  }, [pengukuran, bulan]);

  const filtered = useMemo(
    () => anak
      .filter((w) =>
        hadirNik.has(w.nik) &&
        (rw === "Semua" || w.rw === rw) &&
        (rt === "Semua" || w.rt === rt) &&
        matchSearch(w, q)
      )
      .sort((a, b) => {
        const fa = Boolean(pengMap.get(a.nik)?.bb);
        const fb = Boolean(pengMap.get(b.nik)?.bb);
        if (fa !== fb) return fa ? 1 : -1;
        if (fa) return (pengMap.get(b.nik).updatedAt || "").localeCompare(pengMap.get(a.nik).updatedAt || "");
        return 0;
      }),
    [anak, hadirNik, pengMap, rw, rt, q]
  );

  const pg = usePagination(filtered, { resetDeps: [rw, rt, q] });

  function openForm(w) {
    const p = pengMap.get(w.nik);
    setForm({ bb: p?.bb || "", tb: p?.tb || "", lk: p?.lk || "", lila: p?.lila || "" });
    setError("");
    setTarget(w);
  }

  // Pratinjau status gizi live saat kader mengetik angka
  const preview = useMemo(() => {
    if (!target) return null;
    const umur = umurBulan(target.tanggalLahir);
    return evaluasiUkur({ anak: { ...target, umurUkur: umur }, bb: form.bb, tb: form.tb });
  }, [target, form.bb, form.tb]);

  async function save(e) {
    e.preventDefault();
    const bb = parseNumID(form.bb);
    const tb = parseNumID(form.tb);
    const lk = parseNumID(form.lk);
    const lila = parseNumID(form.lila);
    if (bb === null || Number.isNaN(bb) || bb < 1 || bb > 40)
      return setError("Berat badan harus angka 1–40 kg");
    if (tb === null || Number.isNaN(tb) || tb < 35 || tb > 130)
      return setError("Tinggi/panjang badan harus angka 35–130 cm");
    if (lk !== null && (Number.isNaN(lk) || lk < 20 || lk > 60))
      return setError("Lingkar kepala harus angka 20–60 cm");
    if (lila !== null && (Number.isNaN(lila) || lila < 5 || lila > 40))
      return setError("LILA harus angka 5–40 cm");
    setError("");
    setSaving(true);
    try {
      const umur = umurBulan(target.tanggalLahir);
      const ev = evaluasiUkur({ anak: { ...target, umurUkur: umur }, bb, tb });
      await api.upsertPengukuran(target.nik, bulan, {
        nama: target.nama, rw: target.rw, rt: target.rt,
        jenisKelamin: target.jenisKelamin,
        umurBln: umur,
        bb: String(bb), tb: String(tb),
        lk: lk === null ? "" : String(lk),
        lila: lila === null ? "" : String(lila),
        ...ev,
        tanggal: todayKey(),
        updatedAt: new Date().toISOString(),
      });
      setTarget(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Timbang &amp; Ukur Anak</h1>
          <p className="text-sm text-gray-500">{tanggalIndo()} — hanya anak yang sudah hadir bulan ini</p>
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

      <div className="rounded-xl border border-pink-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm md:min-w-[640px]">
            <thead>
              <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Nama Anak</th>
                <th className="hidden px-4 py-3 md:table-cell">Usia</th>
                <th className="px-4 py-3">RW/RT</th>
                <th className="hidden px-4 py-3 md:table-cell">BB / TB / LK</th>
                <th className="hidden px-4 py-3 md:table-cell">Status Gizi</th>
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
                  const p = pengMap.get(w.nik);
                  const filled = p && p.bb && p.tb;
                  return (
                    <tr key={w.nik} className="hover:bg-pink-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{w.nama}</td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{umurLabel(w.tanggalLahir)}</td>
                      <td className="px-4 py-3 text-gray-600">{w.rw} / {w.rt}</td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                        {filled ? `${p.bb} / ${p.tb} / ${p.lk || "-"}` : "-"}
                      </td>
                      <td className={`hidden px-4 py-3 text-xs md:table-cell ${hc(p?.sBBTB)}`}>
                        {p?.sBBTB?.label || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openForm(w)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            filled
                              ? "border border-pink-600 text-pink-700 hover:bg-pink-50"
                              : "bg-pink-600 text-white hover:bg-pink-700"
                          }`}
                        >
                          {filled ? "Edit" : "Input"}
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

      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={`Timbang & Ukur — ${target?.nama || ""}`}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Berat Badan (kg) *</label>
              <input className={inputCls} inputMode="decimal" value={form.bb} onChange={(e) => setForm({ ...form, bb: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tinggi/Panjang (cm) *</label>
              <input className={inputCls} inputMode="decimal" value={form.tb} onChange={(e) => setForm({ ...form, tb: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Lingkar Kepala (cm)</label>
              <input className={inputCls} inputMode="decimal" value={form.lk} onChange={(e) => setForm({ ...form, lk: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">LILA (cm)</label>
              <input className={inputCls} inputMode="decimal" value={form.lila} onChange={(e) => setForm({ ...form, lila: e.target.value })} />
            </div>
          </div>
          {preview && (form.bb || form.tb) && (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-pink-50/70 p-3 text-center">
              {[
                ["BB/U", preview.sBBU],
                ["TB/U", preview.sTBU],
                ["BB/TB", preview.sBBTB],
              ].map(([l, s]) => (
                <div key={l} className="rounded-lg bg-white p-2">
                  <p className="text-[10px] uppercase text-gray-500">{l}</p>
                  <p className={`text-xs font-bold ${hc(s)}`}>{s?.label || "-"}</p>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
            {saving ? <><MiniSpinner />Menyimpan...</> : "Simpan"}
          </button>
        </form>
      </Modal>

      {saving && <LoadingScreen overlay label="Menyimpan pengukuran..." />}
    </div>
  );
}
