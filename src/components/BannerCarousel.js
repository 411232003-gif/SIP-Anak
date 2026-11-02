"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 30_000;

// The supplied desktop/mobile artwork is shared while the caption rotates.
const SLIDES = [
  { key: "sambutan" },
  { key: "info" },
];

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
      className={`banner-carousel ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="banner-art">
        <div className="banner-art__shade" />

        {SLIDES.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
              aria-label="Banner sebelumnya"
              className={`banner-arrow banner-arrow--left ${
                paused || navOn ? "visible" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
              aria-label="Banner berikutnya"
              className={`banner-arrow banner-arrow--right ${
                paused || navOn ? "visible" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        <div className="banner-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Tampilkan informasi ${i + 1}`}
              aria-current={i === idx}
              className={`banner-dot ${i === idx ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="banner-caption" aria-live="polite">
        {SLIDES.map((s, i) => (
          <div
            key={`caption-${s.key}`}
            className={`banner-caption__slide ${i === idx ? "active" : ""}`}
            aria-hidden={i !== idx}
          >
            {overlays ? overlays[i] : children}
          </div>
        ))}
      </div>
    </div>
  );
}
