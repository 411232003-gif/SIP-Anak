"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, DEFAULT_PROFIL } from "@/lib/db";
import { bulanLabel, formatTglLahir, tanggalIndo, umurLabel, todayKey } from "@/lib/utils";
import { hc, GIZI_LEVELS } from "@/lib/giziLevel";
import { peringatanDini } from "@/lib/growth";
import { petaImunisasi } from "@/lib/imunisasi";
import { umurBulan } from "@/lib/utils";
import { InlineLoading } from "@/components/LoadingScreen";
import BannerCarousel from "@/components/BannerCarousel";

export default function OrtuPage() {
  const { user } = useAuth();
  const [anak, setAnak] = useState(null);
  const [pengukuran, setPengukuran] = useState([]);
  const [kehadiran, setKehadiran] = useState([]);
  const [imunisasi, setImunisasi] = useState([]);
  const [sesi, setSesi] = useState([]);
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [latestEdaran, setLatestEdaran] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [w, p, a, im, s, prof, e] = await Promise.all([
      api.getAnak(user.nik),
      api.listPengukuran(user.nik),
      api.listKehadiran(user.nik),
      api.listImunisasi(user.nik),
      api.listSesi(),
      api.getProfil(),
      api.listEdaran(),
    ]);
    setAnak(w);
    setProfil({ ...DEFAULT_PROFIL, ...prof });
    setPengukuran(p.sort((x, y) => y.bulan.localeCompare(x.bulan)));
    setKehadiran(a.sort((x, y) => y.bulan.localeCompare(x.bulan)));
    setImunisasi(im);
    setSesi(s.filter((x) => x.tanggal >= todayKey()));
    setLatestEdaran(e[0] || null);
    setLoading(false);
  }, [user.nik]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const terbaru = pengukuran[0];
  const sesiNext = sesi[0];
  const umur = umurBulan(anak?.tanggalLahir);
  const warnings = anak
    ? peringatanDini({ logs: pengukuran, imunisasiDone: petaImunisasi(imunisasi, umur).done, umurBln: umur })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <InlineLoading label="Memuat data anak Anda..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BannerCarousel
        className="parent-home-banner"
        overlays={[
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {profil.namaPosyandu} · {profil.namaKelurahan?.replace(/^kelurahan\s*/i, "")}
            </p>
            <h1 className="mt-1 text-xl font-bold drop-shadow sm:text-2xl">
              Halo, Ayah/Bunda {anak?.namaIbu || user.nama}
            </h1>
            <p className="mt-1 text-sm text-white">
              {tanggalIndo()} — pantau tumbuh kembang {anak?.nama || "buah hati Anda"} di sini.
            </p>
          </>,
          <>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1z" />
                <path d="M15 9a3.5 3.5 0 0 1 0 6" />
                <path d="M18 6.5a7 7 0 0 1 0 11" />
              </svg>
              {sesiNext ? "Jadwal Posyandu Berikutnya" : "Surat Edaran Terbaru"}
            </p>
            {sesiNext ? (
              <>
                <h1 className="mt-1 line-clamp-2 max-w-lg text-xl font-bold drop-shadow sm:text-2xl">
                  {sesiNext.kegiatan}
                </h1>
                <p className="mt-1 text-sm text-white">
                  {formatTglLahir(sesiNext.tanggal)}{sesiNext.jam ? ` · ${sesiNext.jam}` : ""}{sesiNext.lokasi ? ` · ${sesiNext.lokasi}` : ""}
                </p>
              </>
            ) : latestEdaran ? (
              <>
                <h1 className="mt-1 line-clamp-2 max-w-lg text-xl font-bold drop-shadow sm:text-2xl">
                  {latestEdaran.judul}
                </h1>
                <p className="mt-1 text-sm text-white">
                  {formatTglLahir(latestEdaran.tanggal)}
                  {latestEdaran.nomor ? ` · No. ${latestEdaran.nomor}` : ""}
                </p>
                <Link
                  href="/ortu/edaran"
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/30"
                >
                  Selengkapnya →
                </Link>
              </>
            ) : (
              <h1 className="mt-1 text-xl font-bold drop-shadow sm:text-2xl">
                Belum ada pengumuman
              </h1>
            )}
          </>,
        ]}
      />

      {/* Peringatan dini KMS */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w) => (
            <div
              key={w.tipe}
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                w.level === "bahaya"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {w.pesan}
            </div>
          ))}
        </div>
      )}

      {/* Akses cepat — hanya mobile; di desktop ada di radial bawah */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <Link href="/ortu/kms" className="flex items-center gap-3 rounded-xl border border-pink-200 bg-white p-3 shadow-sm transition hover:border-pink-300 hover:shadow">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="M7 15v3" /><path d="M12 10v8" /><path d="M17 6v12" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-gray-900">KMS Digital</span>
            <span className="block text-[11px] text-gray-500">Grafik tumbuh &amp; E-KMS</span>
          </span>
        </Link>
        <Link href="/ortu/edaran" className="flex items-center gap-3 rounded-xl border border-pink-200 bg-white p-3 shadow-sm transition hover:border-pink-300 hover:shadow">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-gray-900">Surat Edaran</span>
            <span className="block text-[11px] text-gray-500">Pengumuman posyandu</span>
          </span>
        </Link>
      </div>

      {terbaru && (
        <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
          <p className="text-sm font-semibold text-pink-800">
            Penimbangan Terakhir — {bulanLabel(terbaru.bulan)}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["BB", terbaru.bb, "kg", null],
              ["TB", terbaru.tb, "cm", null],
              ["LK", terbaru.lk, "cm", null],
              ["BB/U", terbaru.sBBU?.label, "", terbaru.sBBU],
              ["TB/U", terbaru.sTBU?.label, "", terbaru.sTBU],
              ["BB/TB", terbaru.sBBTB?.label, "", terbaru.sBBTB],
            ].map(([l, v, u, st]) => (
              <div key={l} className="rounded-lg bg-white p-2">
                <p className="text-[10px] uppercase text-gray-500">{l}</p>
                <p className={`text-sm font-bold ${st ? hc(st) : "text-gray-900"}`}>{v || "-"}</p>
                {u ? <p className="text-[10px] text-gray-400">{u}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-pink-100 bg-white">
        <p className="border-b border-pink-100 px-4 py-3 text-sm font-semibold text-gray-700">
          Riwayat Kehadiran Posyandu
        </p>
        {kehadiran.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Belum pernah hadir</p>
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {kehadiran.map((a) => (
              <span key={a.bulan} className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
                {bulanLabel(a.bulan)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
