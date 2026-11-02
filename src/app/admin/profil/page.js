"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, DEFAULT_PROFIL, ROLE_LABEL } from "@/lib/db";
import Modal from "@/components/Modal";
import LoadingScreen, { InlineLoading, MiniSpinner } from "@/components/LoadingScreen";

const KOSONG_PETUGAS = { username: "", nama: "", email: "", password: "", role: "kader" };

export default function ProfilAdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [petugas, setPetugas] = useState([]);
  const [form, setForm] = useState(KOSONG_PETUGAS);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busyUid, setBusyUid] = useState(null);
  const [info, setInfo] = useState("");
  const [showGanti, setShowGanti] = useState(false);
  const [gantiForm, setGantiForm] = useState({ lama: "", baru: "", ulang: "" });
  const [gantiMsg, setGantiMsg] = useState(null);
  const [gantiBusy, setGantiBusy] = useState(false);

  const isAdmin = user?.petugasRole === "admin";

  const load = useCallback(async () => {
    const [p, a] = await Promise.all([api.getProfil(), api.listPetugas()]);
    setProfil({ ...DEFAULT_PROFIL, ...p });
    setPetugas(a);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  function say(t) {
    setInfo(t);
    setTimeout(() => setInfo(""), 4000);
  }

  async function simpanProfil(e) {
    e.preventDefault();
    if (!profil.namaPosyandu.trim()) {
      setMsg("Nama Posyandu wajib diisi");
      return;
    }
    setMsg("");
    setSaving(true);
    try {
      await api.setProfil(profil);
      setMsg("Profil posyandu tersimpan.");
      say("Profil posyandu tersimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function tambahPetugas(e) {
    e.preventDefault();
    setErr("");
    setAdding(true);
    try {
      await api.addPetugas(form);
      setForm(KOSONG_PETUGAS);
      say(`Akun ${form.username} dibuat`);
      await load();
    } catch (err) {
      setErr(err.message || "Gagal menambahkan akun");
    } finally {
      setAdding(false);
    }
  }

  async function hapusPetugas() {
    const a = confirmDel;
    if (!a) return;
    setBusyUid(a.uid);
    try {
      await api.deletePetugas(a.uid);
      say(`Akun ${a.username} dihapus`);
      setConfirmDel(null);
      await load();
    } finally {
      setBusyUid(null);
    }
  }

  async function gantiPassword(e) {
    e.preventDefault();
    if (!gantiForm.baru || gantiForm.baru.length < 6)
      return setGantiMsg({ ok: false, text: "Password baru minimal 6 karakter" });
    if (gantiForm.baru !== gantiForm.ulang)
      return setGantiMsg({ ok: false, text: "Konfirmasi password tidak sama" });
    setGantiMsg(null);
    setGantiBusy(true);
    try {
      await api.changePetugasPassword(user.uid, gantiForm.lama, gantiForm.baru);
      setGantiForm({ lama: "", baru: "", ulang: "" });
      setGantiMsg({ ok: true, text: "Password berhasil diganti." });
      setTimeout(() => setShowGanti(false), 900);
    } catch (err) {
      setGantiMsg({ ok: false, text: err.message || "Gagal mengganti password" });
    } finally {
      setGantiBusy(false);
    }
  }

  function onLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150_000) {
      say("Ukuran logo terlalu besar (maks 150KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfil((p) => ({ ...p, logo: reader.result }));
    reader.readAsDataURL(file);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

  if (loading) {
    return (
      <div className="rounded-xl border border-pink-100 bg-white px-4 py-6">
        <InlineLoading label="Memuat profil posyandu..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Profil</h1>
        <p className="text-sm text-gray-500">
          Pengaturan posyandu & akun petugas
        </p>
      </div>

      {info && (
        <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700">{info}</div>
      )}

      {/* Identitas posyandu */}
      <form
        onSubmit={simpanProfil}
        className="rounded-xl border border-pink-100 bg-white p-4 sm:p-5"
      >
        <p className="mb-3 text-sm font-semibold text-gray-700">Identitas Posyandu</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nama Posyandu *</label>
            <input className={inputCls} value={profil.namaPosyandu} onChange={(e) => setProfil({ ...profil, namaPosyandu: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kelurahan</label>
            <input className={inputCls} value={profil.namaKelurahan} onChange={(e) => setProfil({ ...profil, namaKelurahan: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Puskesmas Pembina</label>
            <input className={inputCls} value={profil.namaPuskesmas} onChange={(e) => setProfil({ ...profil, namaPuskesmas: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">No. Telepon</label>
            <input className={inputCls} value={profil.telpOperator} onChange={(e) => setProfil({ ...profil, telpOperator: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Alamat Posyandu</label>
            <input className={inputCls} value={profil.alamatPosyandu} onChange={(e) => setProfil({ ...profil, alamatPosyandu: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nama Ketua Posyandu</label>
            <input className={inputCls} value={profil.namaKetua} onChange={(e) => setProfil({ ...profil, namaKetua: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nama Kepala Puskesmas</label>
            <input className={inputCls} value={profil.namaKapus} onChange={(e) => setProfil({ ...profil, namaKapus: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {profil.logo && (
            <img src={profil.logo} alt="Logo posyandu" className="h-12 w-12 rounded-lg border border-gray-200 object-contain" />
          )}
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Ubah Logo
            <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} />
          </label>
          <span className="text-xs text-gray-400">PNG/JPG maks 150KB</span>
        </div>
        {msg && <p className="mt-3 text-sm text-pink-700">{msg}</p>}
        <button type="submit" disabled={saving || !isAdmin} className="mt-4 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
          {saving ? <><MiniSpinner />Menyimpan...</> : "Simpan Profil"}
        </button>
        {!isAdmin && <p className="mt-2 text-xs text-gray-400">Hanya admin yang dapat mengubah profil posyandu.</p>}
      </form>

      {/* Manajemen akun petugas — hanya admin */}
      {isAdmin && (
        <div className="rounded-xl border border-pink-100 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-gray-700">Akun Petugas ({petugas.length})</p>
          <ul className="mt-3 divide-y divide-pink-50">
            {petugas.map((a) => (
              <li key={a.uid || a.username} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{a.nama || a.username}</p>
                  <p className="text-xs text-gray-400">@{a.username}{a.email ? ` · ${a.email}` : ""}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                    {ROLE_LABEL[a.role] || a.role}
                  </span>
                  {a.uid !== user.uid && (
                    <button
                      onClick={() => setConfirmDel(a)}
                      disabled={busyUid === a.uid}
                      className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyUid === a.uid ? <MiniSpinner /> : "Hapus"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Tambah akun</p>
          <form onSubmit={tambahPetugas} className="mt-2 grid gap-2 sm:grid-cols-2">
            <input className={inputCls} placeholder="Username (contoh: kader01)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <input className={inputCls} placeholder="Nama lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
            <input className={inputCls} type="email" placeholder="Email asli (untuk reset password)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className={inputCls} type="password" placeholder="Password awal (min. 6)" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="kader">Kader</option>
              <option value="nakes">Nakes</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={adding} className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
              {adding ? <><MiniSpinner />Menambah...</> : "Tambah Akun"}
            </button>
          </form>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      )}

      {/* Aksi akun */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={() => setShowGanti(true)} className="flex-1 rounded-lg border border-pink-600 py-2.5 text-sm font-semibold text-pink-700 hover:bg-pink-50">
          Ganti Password Saya
        </button>
        <button onClick={handleLogout} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
          Keluar
        </button>
      </div>

      <Modal open={showGanti} onClose={() => setShowGanti(false)} title="Ganti Password">
        <form onSubmit={gantiPassword} className="space-y-3">
          <input type="password" className={inputCls} placeholder="Password lama" value={gantiForm.lama} onChange={(e) => setGantiForm({ ...gantiForm, lama: e.target.value })} autoComplete="current-password" />
          <input type="password" className={inputCls} placeholder="Password baru (min. 6)" value={gantiForm.baru} onChange={(e) => setGantiForm({ ...gantiForm, baru: e.target.value })} autoComplete="new-password" />
          <input type="password" className={inputCls} placeholder="Ulangi password baru" value={gantiForm.ulang} onChange={(e) => setGantiForm({ ...gantiForm, ulang: e.target.value })} autoComplete="new-password" />
          {gantiMsg && (
            <p className={`text-sm ${gantiMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{gantiMsg.text}</p>
          )}
          <button type="submit" disabled={gantiBusy} className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
            {gantiBusy ? <><MiniSpinner />Menyimpan...</> : "Simpan Password"}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)} title="Hapus Akun Petugas">
        {confirmDel && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Akun <b>@{confirmDel.username}</b> ({confirmDel.nama}) akan dihapus.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600">
                Batal
              </button>
              <button onClick={hapusPetugas} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>

      {(saving || adding) && <LoadingScreen overlay label="Menyimpan..." />}
    </div>
  );
}
