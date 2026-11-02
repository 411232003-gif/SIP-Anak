"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { MiniSpinner } from "./LoadingScreen";
import { api } from "@/lib/db";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

export default function GantiPinModal({ open, onClose, warga }) {
  const [pinLama, setPinLama] = useState("");
  const [pinBaru, setPinBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setPinLama("");
      setPinBaru("");
      setKonfirmasi("");
      setError("");
      setDone(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pinLama !== warga?.pin) {
      setError("Kata sandi lama salah");
      return;
    }
    if (pinBaru.length < 6) {
      setError("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (pinBaru === pinLama) {
      setError("Kata sandi baru tidak boleh sama dengan kata sandi lama");
      return;
    }
    if (konfirmasi !== pinBaru) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setSaving(true);
    try {
      await api.changePin(warga.nik, pinLama, pinBaru);
      setDone(true);
    } catch (err) {
      setError(err.message || "Gagal mengganti kata sandi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ganti Kata Sandi">
      {done ? (
        <div className="space-y-4 text-center">
          <div className="rounded-xl bg-pink-50 p-4">
            <p className="text-sm font-semibold text-pink-800">Kata sandi berhasil diganti</p>
            <p className="mt-1 text-xs text-gray-500">
              Gunakan kata sandi baru saat login berikutnya. Jangan bagikan ke siapa pun.
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
            <label className="mb-1 block text-xs font-medium text-gray-600">Kata Sandi Lama *</label>
            <input
              type="password"
              className={inputCls}
              value={pinLama}
              onChange={(e) => setPinLama(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Kata Sandi Baru (min. 6 karakter) *
            </label>
            <input
              type="password"
              className={inputCls}
              value={pinBaru}
              onChange={(e) => setPinBaru(e.target.value)}
              autoComplete="new-password"
              placeholder="Boleh huruf dan angka"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ulangi Kata Sandi Baru *</label>
            <input
              type="password"
              className={inputCls}
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              autoComplete="new-password"
              placeholder="Ulangi kata sandi baru"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? <><MiniSpinner />Menyimpan...</> : "Simpan Kata Sandi"}
          </button>
        </form>
      )}
    </Modal>
  );
}
