"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/beranda"); }, [router]);
  return <LoadingScreen />;
}
