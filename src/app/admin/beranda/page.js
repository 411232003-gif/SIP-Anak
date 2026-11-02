"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, DEFAULT_PROFIL } from "@/lib/db";
import { bulanKey, bulanLabel, formatTglLahir, tanggalIndo } from "@/lib/utils";
import { InlineLoading } from "@/components/LoadingScreen";
import BannerCarousel from "@/components/BannerCarousel";

function ClipboardCheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="9" width="18" height="7" rx="1.5" />
      <path d="M7 9v3" />
      <path d="M11 9v4" />
      <path d="M15 9v3" />
      <path d="M19 9v4" />
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1z" />
      <path d="M15 9a3.5 3.5 0 0 1 0 6" />
      <path d="M18 6.5a7 7 0 0 1 0 11" />
    </svg>
  );
}

const MENU_POSYANDU = [
  { href: "/admin/kehadiran", title: "KEHADIRAN", sub: "Absensi anak hari ini", color: "b3-pink", Icon: ClipboardCheckIcon },
  { href: "/admin/input-ukur", title: "TIMBANG & UKUR", sub: "BB · TB · LK · LILA", color: "b3-violet", Icon: RulerIcon },
  { href: "/admin/imunisasi", title: "IMUNISASI", sub: "Catat pemberian vaksin", color: "b3-mint", Icon: SyringeIcon },
  { href: "/admin/edaran", title: "SURAT EDARAN", sub: "Pengumuman siap unduh", color: "b3-peach", Icon: MailIcon },
];

export default function BerandaAdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [latestEdaran, setLatestEdaran] = useState(null);
  const bulan = bulanKey();

  const load = useCallback(async () => {
    const [w, a, p, e] = await Promise.all([
      api.listAnak(),
      api.listKehadiran(),
      api.getProfil(),
      api.listEdaran(),
    ]);
    setStats({
      anak: w.length,
      hadir: a.filter((x) => x.bulan === bulan).length,
    });
    setProfil({ ...DEFAULT_PROFIL, ...p });
    setLatestEdaran(e[0] || null);
  }, [bulan]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  return (
    <div className="space-y-5">
      <BannerCarousel
        className="admin-home-banner"
        overlays={[
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {profil.namaPosyandu} · {profil.namaKelurahan?.replace(/^kelurahan\s*/i, "")}
            </p>
            <h1 className="mt-1 text-xl font-bold drop-shadow sm:text-2xl">
              Selamat bertugas, {user?.nama || "Petugas"}
            </h1>
            <p className="mt-1 text-sm text-white">{tanggalIndo()}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {stats ? (
                <>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {stats.anak} anak terdaftar
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {stats.hadir} hadir · {bulanLabel(bulan)}
                  </span>
                </>
              ) : (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  Memuat ringkasan...
                </span>
              )}
            </div>
          </>,
          <>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              <MegaphoneIcon /> Surat Edaran Terbaru
            </p>
            {latestEdaran ? (
              <>
                <h1 className="mt-1 line-clamp-2 max-w-lg text-xl font-bold drop-shadow sm:text-2xl">
                  {latestEdaran.judul}
                </h1>
                <p className="mt-1 text-sm text-white">
                  {formatTglLahir(latestEdaran.tanggal)}
                  {latestEdaran.nomor ? ` · No. ${latestEdaran.nomor}` : ""}
                </p>
                <Link
                  href="/admin/edaran"
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/30"
                >
                  Selengkapnya →
                </Link>
              </>
            ) : (
              <>
                <h1 className="mt-1 text-xl font-bold drop-shadow sm:text-2xl">
                  Pengumuman Posyandu
                </h1>
                <p className="mt-1 max-w-md text-sm text-white">
                  Belum ada surat edaran yang diterbitkan.
                </p>
                <Link
                  href="/admin/edaran"
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/30"
                >
                  Buat Edaran →
                </Link>
              </>
            )}
          </>,
        ]}
      />

      {/* Menu 3D — hanya mobile; di desktop menu ini ada di radial "Monev Posyandu" */}
      <div className="rounded-2xl border border-pink-100 bg-white px-4 py-2 sm:px-6 md:hidden">
        {stats ? (
          <ul className="btn3d-list">
            {MENU_POSYANDU.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className={`btn3d ${m.color}`}>
                  <span className="b3-icon"><m.Icon /></span>
                  <span>
                    <span className="b3-title">{m.title}</span>
                    <span className="b3-sub">{m.sub}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-10">
            <InlineLoading label="Memuat menu..." />
          </div>
        )}
      </div>

      {/* Kartu ringkasan desktop */}
      <div className="hidden gap-3 md:grid md:grid-cols-4">
        {MENU_POSYANDU.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-2xl border border-pink-100 bg-white p-4 transition hover:border-pink-300 hover:shadow-md"
          >
            <span className={`b3-icon ${m.color} mb-3`}><m.Icon /></span>
            <p className="text-sm font-bold text-gray-900">{m.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{m.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
