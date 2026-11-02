"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/db";
import { formatTglLahir, todayKey } from "@/lib/utils";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingScreen, { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

const KOSONG = { tanggal: todayKey(), jam: "08:00", lokasi: "", kegiatan: "Penimbangan & Pengukuran", catatan: "" };

export default function JadwalPage() {
  const [sesi, setSesi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const s = await api.listSesi();
    setSesi(s);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  function info(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  function bukaTambah() {
    setForm(KOSONG);
    setEditId(null);
    setShowForm(true);
  }

  function bukaEdit(s) {
    setForm({
      tanggal: s.tanggal || todayKey(),
      jam: s.jam || "08:00",
      lokasi: s.lokasi || "",
      kegiatan: s.kegiatan || "",
      catatan: s.catatan || "",
    });
    setEditId(s.id);
    setShowForm(true);
  }

  async function simpan(ev) {
    ev.preventDefault();
    if (!form.tanggal || !form.kegiatan.trim()) {
      info("Tanggal dan nama kegiatan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const data = {
        tanggal: form.tanggal,
        jam: form.jam,
        lokasi: form.lokasi.trim(),
        kegiatan: form.kegiatan.trim(),
        catatan: form.catatan.trim(),
      };
      if (editId) {
        await api.updateSesi(editId, data);
        info("Jadwal diperbarui");
      } else {
        const rec = await api.addSesi(data);
        info(
          rec._notify?.sent
            ? `Jadwal diterbitkan · notif terkirim ke ${rec._notify.sent} perangkat`
            : "Jadwal diterbitkan"
        );
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function hapus() {
    const s = confirmDel;
    if (!s) return;
    setBusyId(s.id);
    try {
      await api.deleteSesi(s.id);
      info("Jadwal dihapus");
      setConfirmDel(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  const today = todayKey();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Jadwal Posyandu</h1>
          <p className="text-sm text-gray-500">Atur jadwal kegiatan — ortu mendapat notifikasi otomatis</p>
        </div>
        <button onClick={bukaTambah} className="btn-back">+ Tambah Jadwal</button>
      </div>

      {toast && (
        <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700">{toast}</div>
      )}

      <div className="rounded-xl border border-pink-100 bg-white">
        {loading ? (
          <div className="px-4 py-6"><InlineLoading /></div>
        ) : sesi.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            Belum ada jadwal. Klik &quot;Tambah Jadwal&quot; untuk menjadwalkan kegiatan.
          </p>
        ) : (
          <ul className="divide-y divide-pink-50">
            {sesi.map((s) => {
              const lewat = s.tanggal < today;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white ${lewat ? "bg-gray-300" : "bg-gradient-to-br from-pink-500 to-fuchsia-600"}`}>
                      <span className="text-base font-bold leading-none">{s.tanggal?.slice(8, 10)}</span>
                      <span className="text-[9px] font-semibold uppercase">{s.tanggal?.slice(5, 7)}/{s.tanggal?.slice(0, 4)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{s.kegiatan}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatTglLahir(s.tanggal)}{s.jam ? ` · ${s.jam}` : ""}{s.lokasi ? ` · ${s.lokasi}` : ""}
                        {lewat && <span className="ml-1 text-gray-400">(selesai)</span>}
                      </p>
                      {s.catatan && <p className="mt-0.5 truncate text-[11px] text-gray-400">{s.catatan}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => bukaEdit(s)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel(s)}
                      disabled={busyId === s.id}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === s.id ? <MiniSpinner /> : "Hapus"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Jadwal" : "Tambah Jadwal Posyandu"}>
        <form onSubmit={simpan} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nama Kegiatan *</label>
            <input
              className={inputCls}
              placeholder="contoh: Penimbangan & Imunisasi"
              value={form.kegiatan}
              onChange={(e) => setForm({ ...form, kegiatan: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal *</label>
              <input type="date" className={inputCls} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Jam</label>
              <input type="time" className={inputCls} value={form.jam} onChange={(e) => setForm({ ...form, jam: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Lokasi</label>
            <input
              className={inputCls}
              placeholder="contoh: Balai RW 03"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Catatan</label>
            <textarea
              className={`${inputCls} min-h-20`}
              placeholder="opsional — mis. bawa KMS & buku KIA"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
            {saving ? <><MiniSpinner />Menyimpan...</> : editId ? "Simpan Perubahan" : "Terbitkan Jadwal"}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(confirmDel)}
        onClose={() => setConfirmDel(null)}
        onConfirm={hapus}
        busy={Boolean(confirmDel) && busyId === confirmDel?.id}
        title="Hapus Jadwal?"
        message={confirmDel ? <>Jadwal <strong>&quot;{confirmDel.kegiatan}&quot;</strong> tanggal {formatTglLahir(confirmDel.tanggal)} akan dihapus.</> : ""}
      />

      {saving && <LoadingScreen overlay label="Menyimpan jadwal..." />}
    </div>
  );
}
