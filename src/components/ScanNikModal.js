"use client";

import { useEffect, useId, useRef, useState } from "react";
import Modal from "./Modal";

// Ekstrak NIK dari isi QR: mendukung JSON {app, nik} dari E-Kartu
// maupun teks polos berisi deretan angka.
export function parseNikFromQr(text) {
  if (!text) return null;
  try {
    const obj = JSON.parse(text);
    if (obj && obj.nik) return String(obj.nik).trim();
  } catch {}
  const m = String(text).match(/\d{8,20}/);
  return m ? m[0] : null;
}

export default function ScanNikModal({ open, onClose, onScan }) {
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [phase, setPhase] = useState("ask"); // "ask" | "scan"
  const scannerRef = useRef(null);
  const doneRef = useRef(false);
  const onScanRef = useRef(onScan);
  const regionId = `qr-region-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Saat modal dibuka: jika izin kamera sudah pernah diberikan,
  // langsung masuk fase scan. Kalau belum, tampilkan layar izin dulu.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setPhase("ask");
    let cancelled = false;
    async function checkPerm() {
      try {
        const res = await navigator.permissions?.query({ name: "camera" });
        if (!cancelled) setPhase(res?.state === "granted" ? "scan" : "ask");
      } catch {
        // Browser tidak mendukung query izin kamera — tetap di layar "ask".
        if (!cancelled) setPhase("ask");
      }
    }
    checkPerm();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || phase !== "scan") return;
    doneRef.current = false;
    setError(null);
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError({
          title: "Kamera Diblokir Browser",
          desc: "Browser hanya mengizinkan kamera pada alamat yang aman. Halaman ini dibuka lewat alamat jaringan biasa sehingga kamera dinonaktifkan.",
          steps: [
            "Buka aplikasi langsung di perangkat ini (localhost)",
            "Atau minta pengelola mengaktifkan koneksi aman (HTTPS)",
          ],
        });
        return;
      }
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decoded) => {
            const nik = parseNikFromQr(decoded);
            if (nik && !doneRef.current) {
              doneRef.current = true;
              onScanRef.current(nik);
            }
          },
          () => {}
        );
      } catch (err) {
        if (cancelled) return;
        const name = err?.name || "";
        if (name === "NotAllowedError") {
          setError({
            title: "Izin Kamera Ditolak",
            desc: "Aplikasi membutuhkan izin kamera untuk memindai QR pada E-KMS anak.",
            steps: [
              "Klik ikon gembok/pengaturan di address bar browser",
              "Ubah izin Kamera menjadi Izinkan",
              "Tekan tombol Coba Lagi di bawah",
            ],
          });
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setError({
            title: "Kamera Tidak Ditemukan",
            desc: "Perangkat ini tidak memiliki kamera, atau kamera tidak terdeteksi oleh browser.",
          });
        } else if (name === "NotReadableError" || name === "AbortError") {
          setError({
            title: "Kamera Sedang Dipakai",
            desc: "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu tekan Coba Lagi.",
          });
        } else {
          setError({
            title: "Kamera Belum Siap",
            desc: "Kamera gagal dinyalakan. Pastikan tidak ada aplikasi lain yang memakai kamera lalu tekan Coba Lagi.",
          });
        }
      }
    }
    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop()
          .catch(() => {})
          .finally(() => {
            try { s.clear(); } catch {}
          });
      }
    };
  }, [open, regionId, retry, phase]);

  return (
    <Modal open={open} onClose={onClose} title="Pindai E-KMS Anak">
      <div className="space-y-3">
        {phase === "ask" && !error ? (
          <div className="rounded-xl border border-pink-200 bg-gradient-to-b from-pink-50 to-fuchsia-50 p-5 text-center shadow-sm">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-pink-400 to-pink-600 text-white"
              style={{ boxShadow: "0 5px 0 #0b6f66, 0 10px 18px rgba(13,148,136,.35), inset 0 1px 1px rgba(255,255,255,.5)" }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H7l1.2-1.8a1 1 0 0 1 .83-.45h5.94a1 1 0 0 1 .83.45L17 7h1.5A1.5 1.5 0 0 1 20 8.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-8Z" />
                <circle cx="12" cy="12.5" r="3" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-bold text-pink-900">Izinkan Akses Kamera</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-pink-800">
              Kamera dipakai untuk memindai QR Code pada E-KMS anak. Setelah menekan tombol di
              bawah, browser akan meminta izin — pilih <b>Izinkan</b>.
            </p>
            <button
              type="button"
              onClick={() => setPhase("scan")}
              className="btn-back mt-4"
            >
              Nyalakan Kamera
            </button>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-4 text-center shadow-sm">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-400 to-orange-500 text-white"
              style={{ boxShadow: "0 5px 0 #b45309, 0 10px 18px rgba(217,119,6,.35), inset 0 1px 1px rgba(255,255,255,.5)" }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16.5v1a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 17.5v-7A1.5 1.5 0 0 1 5.5 9H7l1.2-1.8a1 1 0 0 1 .83-.45h3.94a1 1 0 0 1 .83.45L15 9h3.5A1.5 1.5 0 0 1 20 10.5v4.55" />
                <circle cx="10" cy="13.5" r="2.5" />
                <path d="m3 3 18 18" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-bold text-amber-900">{error.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">{error.desc}</p>
            {error.steps && (
              <ol className="mx-auto mt-3 max-w-xs space-y-1.5 text-left">
                {error.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                    <span
                      className="mt-px flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white"
                      style={{ boxShadow: "0 2px 0 #b45309" }}
                    >
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            )}
            <button
              type="button"
              onClick={() => { setError(null); setRetry((r) => r + 1); }}
              className="btn-back mt-4"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <div
              id={regionId}
              className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 [&_video]:w-full"
            />
            <p className="text-center text-xs text-gray-500">
              Arahkan kamera ke QR Code pada E-KMS anak.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
