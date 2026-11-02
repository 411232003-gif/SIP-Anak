"use client";

import { useRouter } from "next/navigation";

// Tombol kembali 3D — muncul di semua halaman selain beranda.
// Kembali ke halaman sebelumnya bila ada riwayat in-app,
// kalau tidak (buka langsung) diarahkan ke beranda.
export default function BackButton({ href, label = "Kembali" }) {
  const router = useRouter();

  function goBack() {
    const idx = window.history.state?.idx;
    if (typeof idx === "number" && idx > 0) router.back();
    else router.push(href);
  }

  return (
    <button type="button" onClick={goBack} className="btn-back">
      <svg viewBox="0 0 24 24">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {label}
    </button>
  );
}
