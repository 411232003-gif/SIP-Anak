"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, DEFAULT_PROFIL, USE_FIREBASE, ROLE_LABEL } from "@/lib/db";
import LoadingScreen from "@/components/LoadingScreen";
import BottomNav from "@/components/BottomNav";
import BackButton from "@/components/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isBeranda = pathname === "/admin" || pathname === "/admin/beranda";
  const [posyandu, setPosyandu] = useState(DEFAULT_PROFIL.namaPosyandu);
  const [demoBanner, setDemoBanner] = useState(false);
  useEffect(() => setDemoBanner(!USE_FIREBASE), []);

  useEffect(() => {
    if (!loading && (!user || user.role !== "petugas")) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    api.getProfil()
      .then((p) => { if (p?.namaPosyandu) setPosyandu(p.namaPosyandu); })
      .catch(() => {});
  }, []);

  if (loading || !user || user.role !== "petugas") {
    return <LoadingScreen label="Memuat halaman petugas..." />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <Link href="/admin/beranda" className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-600 shadow-md shadow-pink-300">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="9" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M15 9h.01M6 20c1-1.8 3.2-3 6-3s5 1.2 6 3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 sm:text-base">SIP-Anak</p>
              <p className="truncate text-xs text-pink-600">
                {ROLE_LABEL[user.petugasRole] || "Petugas"} · {posyandu}
              </p>
            </div>
          </Link>
          {isBeranda ? <ThemeToggle /> : <BackButton href="/admin/beranda" />}
        </div>
      </header>

      {demoBanner && (
        <div className="bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
          Mode demo — Firebase belum dikonfigurasi, data tersimpan di browser ini.
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-3 pb-28 pt-4 sm:px-6 sm:pt-6 md:pb-32">
        {children}
      </main>

      <BottomNav variant="admin" />
    </div>
  );
}
