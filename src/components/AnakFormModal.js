"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import LoadingScreen, { MiniSpinner } from "./LoadingScreen";
import { api } from "@/lib/db";
import { RW_LIST, RT_LIST } from "@/lib/utils";

const empty = {
  nama: "",
  nik: "",
  rw: "RW 01",
  rt: "RT 01",
  jenisKelamin: "Laki-laki",
  tanggalLahir: "",
  namaIbu: "",
  namaAyah: "",
  bbLahir: "",
  tbLahir: "",
  alamat: "",
  noTelp: "",
};

export default function AnakFormModal({ open, onClose, initial, onSaved }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdPin, setCreatedPin] = useState(null);
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...initial } : empty);
      setError("");
      setCreatedPin(null);
    }
  }, [open, initial]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.nama.trim() || !form.nik.trim()) {
      setError("Nama dan NIK anak wajib diisi");
      return;
    }
    if (!/^\d{16}$/.test(form.nik.trim())) {
      setError("NIK harus tepat 16 digit angka");
      return;
    }
    if (!form.tanggalLahir) {
      setError("Tanggal lahir wajib diisi — dipakai untuk grafik KMS & jadwal imunisasi");
      return;
    }
    if (form.noTelp.trim() && !/^[\d+\-\s()]{6,20}$/.test(form.noTelp.trim())) {
      setError("Format nomor telepon tidak valid");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateAnak(initial.nik, { ...form, nik: initial.nik });
        onSaved?.();
        onClose();
      } else {
        const w = await api.addAnak({ ...form, nik: form.nik.trim(), nama: form.nama.trim() });
        setCreatedPin(w.pin);
        onSaved?.();
      }
    } catch (err) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Data Anak" : "Tambah Anak"}>
      {createdPin ? (
        <div className="space-y-4 text-center">
          <div className="rounded-xl bg-pink-50 p-4">
            <p className="text-sm text-gray-600">Anak berhasil didaftarkan</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{form.nama}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Kata Sandi Orang Tua</p>
            <p className="font-mono text-3xl font-bold tracking-widest text-pink-700">{createdPin}</p>
            <p className="mt-2 text-xs text-gray-500">
              Orang tua login dengan NIK anak: <b>{form.nik}</b> dan kata sandi ini.
              Catat dan berikan ke orang tua.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Selesai
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nama Anak *</label>
            <input className={inputCls} value={form.nama} onChange={(e) => set("nama", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">NIK Anak *</label>
            <input
              className={inputCls}
              value={form.nik}
              onChange={(e) => set("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              disabled={isEdit}
              inputMode="numeric"
              maxLength={16}
              placeholder="16 digit"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Jenis Kelamin *</label>
              <select className={inputCls} value={form.jenisKelamin} onChange={(e) => set("jenisKelamin", e.target.value)}>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Lahir *</label>
              <input type="date" className={inputCls} value={form.tanggalLahir} onChange={(e) => set("tanggalLahir", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">BB Lahir (kg)</label>
              <input className={inputCls} inputMode="decimal" placeholder="3.2" value={form.bbLahir} onChange={(e) => set("bbLahir", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">TB Lahir (cm)</label>
              <input className={inputCls} inputMode="decimal" placeholder="49" value={form.tbLahir} onChange={(e) => set("tbLahir", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nama Ibu</label>
              <input className={inputCls} value={form.namaIbu} onChange={(e) => set("namaIbu", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nama Ayah</label>
              <input className={inputCls} value={form.namaAyah} onChange={(e) => set("namaAyah", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">RW</label>
              <select className={inputCls} value={form.rw} onChange={(e) => set("rw", e.target.value)}>
                {RW_LIST.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">RT</label>
              <select className={inputCls} value={form.rt} onChange={(e) => set("rt", e.target.value)}>
                {RT_LIST.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Alamat</label>
            <input className={inputCls} value={form.alamat} onChange={(e) => set("alamat", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">No. Telepon Orang Tua</label>
            <input className={inputCls} value={form.noTelp} onChange={(e) => set("noTelp", e.target.value)} inputMode="tel" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? <><MiniSpinner />Menyimpan...</> : isEdit ? "Simpan Perubahan" : "Tambah Anak"}
          </button>
        </form>
      )}

      {saving && (
        <LoadingScreen
          overlay
          label={isEdit ? "Menyimpan perubahan..." : "Membuat akun orang tua..."}
        />
      )}
    </Modal>
  );
}
