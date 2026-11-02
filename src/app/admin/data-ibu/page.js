"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/db";
import { bulanKey, matchSearch, todayKey, usiaKehamilanMinggu, hitungUmur, formatTglLahir, parseNumID } from "@/lib/utils";
import IbuFormModal from "@/components/IbuFormModal";
import Pagination, { usePagination } from "@/components/Pagination";
import Modal from "@/components/Modal";
import LoadingScreen, { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

const selectCls =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none";

export default function DataIbuPage() {
  const [ibu, setIbu] = useState([]);
  const [kunjungan, setKunjungan] = useState([]);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [ancTarget, setAncTarget] = useState(null);
  const [ancForm, setAncForm] = useState({ bb: "", tdSys: "", tdDia: "", lila: "", tfu: "", keluhan: "" });
  const [ancErr, setAncErr] = useState("");
  const [saving, setSaving] = useState(false);

  const bulan = bulanKey();

  const load = useCallback(async () => {
    const [w, k] = await Promise.all([api.listIbu(), api.listKunjunganIbu()]);
    setIbu(w);
    setKunjungan(k);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const kunjMap = useMemo(() => {
    const m = new Map();
    kunjungan.forEach((k) => {
      const cur = m.get(k.nik);
      if (!cur || (k.bulan || "") > (cur.bulan || "")) m.set(k.nik, k);
    });
    return m;
  }, [kunjungan]);

  const filtered = useMemo(
    () => ibu.filter((w) =>
      (fStatus === "Semua" || (w.status || "Umum") === fStatus) && matchSearch(w, q)
    ),
    [ibu, fStatus, q]
  );

  const pg = usePagination(filtered, { perPage: 12, resetDeps: [fStatus, q] });

  function openAnc(w) {
    const k = kunjungan.find((x) => x.nik === w.nik && x.bulan === bulan);
    setAncForm({
      bb: k?.bb || "", tdSys: k?.tdSys || "", tdDia: k?.tdDia || "",
      lila: k?.lila || "", tfu: k?.tfu || "", keluhan: k?.keluhan || "",
    });
    setAncErr("");
    setAncTarget(w);
  }

  async function saveAnc(e) {
    e.preventDefault();
    const bb = parseNumID(ancForm.bb);
    const tdSys = parseNumID(ancForm.tdSys);
    const tdDia = parseNumID(ancForm.tdDia);
    const lila = parseNumID(ancForm.lila);
    const tfu = parseNumID(ancForm.tfu);
    if (bb !== null && (Number.isNaN(bb) || bb < 30 || bb > 200))
      return setAncErr("BB harus angka 30–200 kg");
    if (tdSys !== null && (Number.isNaN(tdSys) || tdSys < 60 || tdSys > 250))
      return setAncErr("TD sistolik harus angka 60–250");
    if (tdDia !== null && (Number.isNaN(tdDia) || tdDia < 30 || tdDia > 180))
      return setAncErr("TD diastolik harus angka 30–180");
    setAncErr("");
    setSaving(true);
    try {
      await api.upsertKunjunganIbu(ancTarget.nik, bulan, {
        nama: ancTarget.nama, rw: ancTarget.rw, rt: ancTarget.rt,
        usiaMinggu: usiaKehamilanMinggu(ancTarget.hpht),
        bb: bb === null ? "" : String(bb),
        tdSys: tdSys === null ? "" : String(tdSys),
        tdDia: tdDia === null ? "" : String(tdDia),
        lila: lila === null ? "" : String(lila),
        tfu: tfu === null ? "" : String(tfu),
        keluhan: ancForm.keluhan.trim(),
        tanggal: todayKey(),
        updatedAt: new Date().toISOString(),
      });
      setAncTarget(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteIbu(confirmDel.nik);
      setConfirmDel(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Data Ibu Hamil &amp; Nifas</h1>
          <p className="text-sm text-gray-500">Pemantauan kesehatan ibu (ANC)</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-back">
          + Tambah Ibu
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-pink-100 bg-white p-3">
        <select className={selectCls} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option>Semua</option>
          <option>Hamil</option>
          <option>Nifas</option>
          <option>Umum</option>
        </select>
        <input
          className={`${selectCls} min-w-0 flex-1`}
          placeholder="Cari nama / NIK ibu..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-pink-100 bg-white px-4 py-6"><InlineLoading /></div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-gray-400">Tidak ada data ibu ditemukan</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pg.pageItems.map((w) => {
              const minggu = usiaKehamilanMinggu(w.hpht);
              const k = kunjMap.get(w.nik);
              return (
                <div key={w.nik} className="rounded-xl border border-pink-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{w.nama}</p>
                      <p className="text-xs text-gray-500">NIK: {w.nik}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      w.status === "Hamil" ? "bg-pink-100 text-pink-700" : w.status === "Nifas" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {w.status || "Umum"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-0.5 text-xs text-gray-600">
                    <p>{hitungUmur(w.tanggalLahir) ?? "-"} tahun · {w.rw} / {w.rt}</p>
                    {minggu !== null && w.status === "Hamil" && (
                      <p className="font-semibold text-pink-700">Usia kehamilan: {minggu} minggu</p>
                    )}
                    {k?.tanggal && (
                      <p>ANC terakhir: {formatTglLahir(k.tanggal)}{k.tdSys ? ` · TD ${k.tdSys}/${k.tdDia || "-"}` : ""}</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openAnc(w)}
                      className="flex-1 rounded-lg bg-pink-600 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
                    >
                      Input ANC
                    </button>
                    <button
                      onClick={() => { setEditing(w); setShowForm(true); }}
                      className="rounded-lg border border-pink-600 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel(w)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
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

      <IbuFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        initial={editing}
        onSaved={load}
      />

      {/* Modal input kunjungan ANC bulan ini */}
      <Modal open={Boolean(ancTarget)} onClose={() => setAncTarget(null)} title={`Kunjungan ANC — ${ancTarget?.nama || ""}`}>
        <form onSubmit={saveAnc} className="space-y-3">
          <p className="text-xs text-gray-500">
            Bulan {bulan}
            {ancTarget && usiaKehamilanMinggu(ancTarget.hpht) !== null
              ? ` · Usia kehamilan ${usiaKehamilanMinggu(ancTarget.hpht)} minggu`
              : ""}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Berat Badan (kg)</label>
              <input className={inputCls} inputMode="decimal" value={ancForm.bb} onChange={(e) => setAncForm({ ...ancForm, bb: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">LILA (cm)</label>
              <input className={inputCls} inputMode="decimal" value={ancForm.lila} onChange={(e) => setAncForm({ ...ancForm, lila: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">TD Sistolik</label>
              <input className={inputCls} inputMode="numeric" placeholder="120" value={ancForm.tdSys} onChange={(e) => setAncForm({ ...ancForm, tdSys: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">TD Diastolik</label>
              <input className={inputCls} inputMode="numeric" placeholder="80" value={ancForm.tdDia} onChange={(e) => setAncForm({ ...ancForm, tdDia: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Tinggi Fundus (cm)</label>
              <input className={inputCls} inputMode="decimal" value={ancForm.tfu} onChange={(e) => setAncForm({ ...ancForm, tfu: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Keluhan / Catatan</label>
            <textarea className={`${inputCls} min-h-20`} value={ancForm.keluhan} onChange={(e) => setAncForm({ ...ancForm, keluhan: e.target.value })} />
          </div>
          {ancErr && <p className="text-sm text-red-600">{ancErr}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
            {saving ? <><MiniSpinner />Menyimpan...</> : "Simpan Kunjungan"}
          </button>
        </form>
      </Modal>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-gray-900">Hapus {confirmDel.nama}?</p>
            <p className="mt-1 text-sm text-gray-500">Data ibu beserta riwayat kunjungan ANC-nya akan dihapus permanen.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && <LoadingScreen overlay label="Menghapus data ibu..." />}
    </div>
  );
}
