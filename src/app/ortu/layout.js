"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import LoadingScreen from "@/components/LoadingScreen";
import BottomNav from "@/components/BottomNav";
import BackButton from "@/components/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

export default function OrtuLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isBeranda = pathname === "/ortu";

  useEffect(() => {
    if (!loading && (!user || user.role !== "ortu")) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ortu") {
    return <LoadingScreen label="Memuat halaman orang tua..." />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <Link href="/ortu" className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-600 shadow-md shadow-pink-300">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="9" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M15 9h.01M6 20c1-1.8 3.2-3 6-3s5 1.2 6 3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 sm:text-base">SIP-Anak</p>
              <p className="truncate text-xs text-pink-600">Orang Tua · {user.nama}</p>
            </div>
          </Link>
          {isBeranda ? <ThemeToggle /> : <BackButton href="/ortu" />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-3 pb-28 pt-4 sm:px-6 sm:pt-6 md:pb-32">
        {children}
      </main>

      <BottomNav variant="ortu" />
    </div>
  );
}
