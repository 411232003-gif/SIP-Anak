"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/db";
import { umurLabel, formatTglLahir } from "@/lib/utils";
import { pushSupported, pushReady, getPushSubscription, enablePush, disablePush } from "@/lib/push";
import GantiPinModal from "@/components/GantiPinModal";
import { MiniSpinner } from "@/components/LoadingScreen";

export default function ProfilOrtuPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anak, setAnak] = useState(null);
  const [showGanti, setShowGanti] = useState(false);
  const [pushStatus, setPushStatus] = useState("unsupported");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");

  const load = useCallback(async () => {
    const w = await api.getAnak(user.nik);
    setAnak(w);
  }, [user.nik]);

  useEffect(() => {
    load().catch(() => {});
    (async () => {
      if (!pushReady()) return setPushStatus("unsupported");
      const sub = await getPushSubscription();
      setPushStatus(sub ? "subscribed" : "unsubscribed");
    })();
  }, [load]);

  async function togglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    setPushMsg("");
    try {
      if (pushStatus === "subscribed") {
        await disablePush(user.nik);
        setPushStatus("unsubscribed");
        setPushMsg("Notifikasi dimatikan untuk perangkat ini.");
      } else {
        await enablePush(user.nik);
        setPushStatus("subscribed");
        setPushMsg("Notifikasi aktif — Anda akan menerima jadwal & hasil penimbangan.");
      }
    } catch (e) {
      setPushMsg(e?.message || "Gagal mengatur notifikasi");
    } finally {
      setPushBusy(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Profil</h1>

      {anak && (
        <div className="rounded-xl border border-pink-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Data Anak</p>
          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              ["Nama Anak", anak.nama],
              ["NIK", anak.nik],
              ["Jenis Kelamin", anak.jenisKelamin],
              ["Tanggal Lahir", formatTglLahir(anak.tanggalLahir)],
              ["Usia", umurLabel(anak.tanggalLahir)],
              ["Wilayah", `${anak.rw} / ${anak.rt}`],
              ["Nama Ibu", anak.namaIbu || "-"],
              ["Nama Ayah", anak.namaAyah || "-"],
              ["Alamat", anak.alamat || "-"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-4 border-b border-pink-50 pb-2">
                <dt className="text-gray-500">{l}</dt>
                <dd className="text-right font-medium text-gray-900">{v || "-"}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Notifikasi */}
      <div className="rounded-xl border border-pink-100 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">Notifikasi</p>
        <p className="mt-1 text-xs text-gray-500">
          Terima pengingat jadwal Posyandu, surat edaran, dan hasil penimbangan anak.
        </p>
        {pushStatus === "unsupported" ? (
          <p className="mt-2 text-xs text-gray-400">Perangkat ini tidak mendukung notifikasi.</p>
        ) : (
          <button
            onClick={togglePush}
            disabled={pushBusy}
            className={`mt-3 w-full rounded-lg py-2.5 text-sm font-semibold ${
              pushStatus === "subscribed"
                ? "border border-red-300 text-red-600 hover:bg-red-50"
                : "bg-pink-600 text-white hover:bg-pink-700"
            } disabled:opacity-50`}
          >
            {pushBusy ? <MiniSpinner /> : pushStatus === "subscribed" ? "Matikan Notifikasi" : "Aktifkan Notifikasi"}
          </button>
        )}
        {pushMsg && <p className="mt-2 text-xs text-gray-600">{pushMsg}</p>}
      </div>

      <button
        onClick={() => setShowGanti(true)}
        className="w-full rounded-xl border border-pink-600 bg-white py-3 text-sm font-semibold text-pink-700 hover:bg-pink-50"
      >
        Ganti Kata Sandi
      </button>

      <button
        onClick={handleLogout}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
      >
        Keluar
      </button>

      <GantiPinModal open={showGanti} onClose={() => setShowGanti(false)} warga={anak} />
    </div>
  );
}
