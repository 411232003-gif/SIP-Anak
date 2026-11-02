"use client";

import { useCallback, useEffect, useState } from "react";
import { api, DEFAULT_PROFIL } from "@/lib/db";
import { formatTglLahir, todayKey } from "@/lib/utils";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import SuratSheet, { downloadEdaranDoc } from "@/components/SuratSheet";
import LoadingScreen, { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

const KOSONG = {
  judul: "",
  nomor: "",
  tanggal: todayKey(),
  isi: "",
  penandatangan: "ketua",
};

export default function EdaranAdminPage() {
  const [edaran, setEdaran] = useState([]);
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pilih, setPilih] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [e, p] = await Promise.all([api.listEdaran(), api.getProfil()]);
    setEdaran(e);
    setProfil({ ...DEFAULT_PROFIL, ...p });
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  function info(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function bukaTambah() {
    setForm(KOSONG);
    setEditId(null);
    setShowForm(true);
  }

  function bukaEdit(e) {
    setForm({
      judul: e.judul || "",
      nomor: e.nomor || "",
      tanggal: e.tanggal || todayKey(),
      isi: e.isi || "",
      penandatangan: e.penandatangan || "ketua",
    });
    setEditId(e.id);
    setShowForm(true);
  }

  async function simpan(ev) {
    ev.preventDefault();
    if (!form.judul.trim() || !form.isi.trim()) {
      info("Judul dan isi surat wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const data = {
        judul: form.judul.trim(),
        nomor: form.nomor.trim(),
        tanggal: form.tanggal,
        isi: form.isi.trim(),
        penandatangan: form.penandatangan,
      };
      if (editId) {
        await api.updateEdaran(editId, data);
        info("Surat edaran diperbarui");
      } else {
        const rec = await api.addEdaran(data);
        info(
          rec._notify?.sent
            ? `Surat edaran diterbitkan · notif terkirim ke ${rec._notify.sent} perangkat`
            : `Surat edaran diterbitkan · notif: ${rec._notify?.error || rec._notify?.reason || "tidak ada perangkat berlangganan"}`
        );
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function hapus() {
    const e = confirmDel;
    if (!e) return;
    setBusyId(e.id);
    try {
      await api.deleteEdaran(e.id);
      info("Surat edaran dihapus");
      setConfirmDel(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Surat Edaran Digital</h1>
          <p className="text-sm text-gray-500">
            Buat pengumuman resmi dengan kop posyandu &amp; tanda tangan
          </p>
        </div>
        <button
          onClick={bukaTambah}
          className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-700"
        >
          + Buat Edaran
        </button>
      </div>

      {toast && (
        <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700">{toast}</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-4 py-6">
            <InlineLoading />
          </div>
        ) : edaran.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            Belum ada surat edaran. Klik &quot;Buat Edaran&quot; untuk menerbitkan pengumuman.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {edaran.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{e.judul}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {e.nomor ? `No. ${e.nomor} · ` : ""}
                    {formatTglLahir(e.tanggal)} ·{" "}
                    {e.penandatangan === "kapus" ? "ttd Kapuskesmas" : "ttd Ketua Posyandu"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setPilih(e)}
                    className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
                  >
                    Lihat &amp; Unduh
                  </button>
                  <button
                    onClick={() => bukaEdit(e)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDel(e)}
                    disabled={busyId === e.id}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyId === e.id ? <MiniSpinner /> : "Hapus"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Nama Lurah/Kapuskesmas, alamat, dan logo kop surat diatur di halaman Profil admin.
      </p>

      {/* Form tambah/edit */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Edit Surat Edaran" : "Buat Surat Edaran"}
      >
        <form onSubmit={simpan} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Judul / Perihal *</label>
            <input
              className={inputCls}
              placeholder="contoh: Jadwal Posyandu Bulan Oktober"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nomor Surat</label>
              <input
                className={inputCls}
                placeholder="opsional"
                value={form.nomor}
                onChange={(e) => setForm({ ...form, nomor: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal</label>
              <input
                type="date"
                className={inputCls}
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Isi Pengumuman *</label>
            <textarea
              className={`${inputCls} min-h-28`}
              placeholder="Tulis isi surat edaran di sini..."
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Penandatangan</label>
            <select
              className={inputCls}
              value={form.penandatangan}
              onChange={(e) => setForm({ ...form, penandatangan: e.target.value })}
            >
              <option value="ketua">Ketua Posyandu</option>
              <option value="kapus">Kepala Puskesmas</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? <><MiniSpinner />Menyimpan...</> : editId ? "Simpan Perubahan" : "Terbitkan"}
          </button>
        </form>
      </Modal>

      {/* Pratinjau + unduh */}
      <Modal open={Boolean(pilih)} onClose={() => setPilih(null)} title="Pratinjau Surat Edaran">
        {pilih && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-300 p-4 shadow-inner">
              <SuratSheet edaran={pilih} profil={profil} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadEdaranDoc(pilih, profil)}
                className="flex-1 rounded-lg border border-pink-600 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-50"
              >
                Unduh Word
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-lg bg-pink-600 py-2 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Cetak / Simpan PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Area cetak — hanya tampil saat print */}
      {pilih && (
        <div className="print-sheet">
          <SuratSheet edaran={pilih} profil={profil} />
        </div>
      )}

      {/* Konfirmasi hapus */}
      <ConfirmModal
        open={Boolean(confirmDel)}
        onClose={() => setConfirmDel(null)}
        onConfirm={hapus}
        busy={Boolean(confirmDel) && busyId === confirmDel?.id}
        title="Hapus Surat Edaran?"
        message={confirmDel ? <>Surat edaran <strong>&quot;{confirmDel.judul}&quot;</strong> akan dihapus permanen dan tidak lagi tampil di halaman warga.</> : ""}
      />

      {saving && <LoadingScreen overlay label="Menyimpan surat edaran..." />}
    </div>
  );
}
