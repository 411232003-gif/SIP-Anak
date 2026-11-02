"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role === "petugas") router.replace("/admin/beranda");
    else router.replace("/ortu");
  }, [user, loading, router]);

  return <LoadingScreen label="Membuka aplikasi..." />;
}
