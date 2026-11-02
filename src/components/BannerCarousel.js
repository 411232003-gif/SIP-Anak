"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 30_000;

// Slide = latar gradien candy + bentuk dekoratif (tanpa file gambar).
// Tambah slide baru cukup tambah entri di sini.
const SLIDES = [
  {
    key: "sambutan",
    bg: "linear-gradient(135deg, #ff5fa2 0%, #f6339a 45%, #c026d3 100%)",
    deco: "dots",
  },
  {
    key: "info",
    bg: "linear-gradient(135deg, #f6339a 0%, #fb7185 50%, #ffb37e 100%)",
    deco: "hearts",
  },
];

function Deco({ kind }) {
  if (kind === "hearts") {
    return (
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
        <circle cx="680" cy="40" r="120" fill="rgba(255,255,255,0.12)" />
        <circle cx="740" cy="240" r="70" fill="rgba(255,255,255,0.10)" />
        <circle cx="60" cy="260" r="90" fill="rgba(255,255,255,0.10)" />
        <path d="M700 120c-8-14-30-14-34 0-4-14-26-14-34 0-4 8 2 16 8 22l26 22 26-22c6-6 12-14 8-22z" fill="rgba(255,255,255,0.22)" transform="scale(1.4) translate(-260,-40)" />
        <path d="M120 60c-6-10-22-10-25 0-3-10-19-10-25 0-3 6 1 12 6 16l19 16 19-16c5-4 9-10 6-16z" fill="rgba(255,255,255,0.18)" />
      </svg>
    );
  }
  return (
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
      <circle cx="700" cy="50" r="140" fill="rgba(255,255,255,0.12)" />
      <circle cx="90" cy="270" r="110" fill="rgba(255,255,255,0.10)" />
      <circle cx="620" cy="220" r="26" fill="rgba(255,255,255,0.2)" />
      <circle cx="660" cy="180" r="12" fill="rgba(255,255,255,0.28)" />
      <circle cx="120" cy="70" r="16" fill="rgba(255,255,255,0.18)" />
      <circle cx="180" cy="46" r="8" fill="rgba(255,255,255,0.3)" />
      <path d="M730 90l14 0M737 83l0 14" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
      <path d="M520 40l10 0M525 35l0 10" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BannerCarousel({ children, className = "", overlays = null }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [navOn, setNavOn] = useState(false);
  const touch = useRef({ x: 0, y: 0 });
  const navTimer = useRef(null);

  // Di layar sentuh: tombol tetap terlihat beberapa detik setelah banner disentuh
  function showNavTemp() {
    setNavOn(true);
    clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => setNavOn(false), 3500);
  }

  useEffect(() => () => clearTimeout(navTimer.current), []);

  useEffect(() => {
    if (paused || SLIDES.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, idx]);

  function onTouchStart(e) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
    setPaused(true);
    showNavTemp();
  }

  function onTouchEnd(e) {
    setPaused(false);
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    setIdx((i) =>
      dx < 0
        ? (i + 1) % SLIDES.length
        : (i - 1 + SLIDES.length) % SLIDES.length
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.key}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: s.bg }}
          aria-hidden={i !== idx}
        >
          <Deco kind={s.deco} />
        </div>
      ))}

      {/* Konten per-slide (latar & teks berganti bersamaan) */}
      {SLIDES.map((s, i) => (
        <div
          key={`overlay-${s.key}`}
          className={`absolute inset-0 z-10 flex flex-col justify-center p-5 text-white transition-opacity duration-1000 ease-in-out sm:p-7 ${
            i === idx ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={i !== idx}
        >
          {overlays ? overlays[i] : children}
        </div>
      ))}

      {/* Tombol geser kiri/kanan — tersembunyi, muncul saat banner di-hover/disentuh */}
      {SLIDES.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Banner sebelumnya"
            className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/25 p-1.5 text-white backdrop-blur-[2px] transition-all duration-300 hover:bg-white/40 sm:left-3 sm:p-2 ${
              paused || navOn ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
            aria-label="Banner berikutnya"
            className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/25 p-1.5 text-white backdrop-blur-[2px] transition-all duration-300 hover:bg-white/40 sm:right-3 sm:p-2 ${
              paused || navOn ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicator */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
