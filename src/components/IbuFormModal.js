"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { MiniSpinner } from "./LoadingScreen";
import { api } from "@/lib/db";
import { RW_LIST, RT_LIST } from "@/lib/utils";

const empty = {
  nama: "",
  nik: "",
  rw: "RW 01",
  rt: "RT 01",
  tanggalLahir: "",
  hpht: "",
  status: "Hamil",
  alamat: "",
  noTelp: "",
};

export default function IbuFormModal({ open, onClose, initial, onSaved }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...initial } : empty);
      setError("");
    }
  }, [open, initial]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.nama.trim() || !form.nik.trim()) {
      setError("Nama dan NIK ibu wajib diisi");
      return;
    }
    if (!/^\d{16}$/.test(form.nik.trim())) {
      setError("NIK harus tepat 16 digit angka");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateIbu(initial.nik, { ...form, nik: initial.nik });
      } else {
        await api.addIbu({ ...form, nik: form.nik.trim(), nama: form.nama.trim() });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Data Ibu" : "Tambah Ibu Hamil / Nifas"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nama Ibu *</label>
          <input className={inputCls} value={form.nama} onChange={(e) => set("nama", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">NIK *</label>
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
            <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option>Hamil</option>
              <option>Nifas</option>
              <option>Umum</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Lahir</label>
            <input type="date" className={inputCls} value={form.tanggalLahir} onChange={(e) => set("tanggalLahir", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            HPHT — Hari Pertama Haid Terakhir
          </label>
          <input type="date" className={inputCls} value={form.hpht} onChange={(e) => set("hpht", e.target.value)} />
          <p className="mt-1 text-[11px] text-gray-400">
            Dipakai untuk menghitung usia kehamilan otomatis.
          </p>
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
          <label className="mb-1 block text-xs font-medium text-gray-600">No. Telepon</label>
          <input className={inputCls} value={form.noTelp} onChange={(e) => set("noTelp", e.target.value)} inputMode="tel" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {saving ? <><MiniSpinner />Menyimpan...</> : isEdit ? "Simpan Perubahan" : "Tambah Ibu"}
        </button>
      </form>
    </Modal>
  );
}
