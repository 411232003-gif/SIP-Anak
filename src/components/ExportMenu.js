"use client";

import { useEffect, useRef, useState } from "react";

// Tombol Export 3D dengan dropdown pilihan format (Excel / PDF).
// Dropdown diposisikan `fixed` (diukur dari tombol) supaya tidak terpotong
// oleh container tabel yang memakai overflow-x-auto.
export default function ExportMenu({ onExcel, onPdf, busy = false, compact = false, label = "Export" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const ref = useRef(null);

  function toggle() {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const closeOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const pick = (fn) => () => { setOpen(false); fn?.(); };

  return (
    <div ref={ref} className="inline-block">
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`btn-export ${compact ? "btn-export--sm" : ""}`}
      >
        {busy ? "Menyiapkan..." : label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="btn-export-caret">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="fixed z-50 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
          style={{ top: pos.top, right: pos.right }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onExcel)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-600">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8" />
              <path d="M8 17h8" />
            </svg>
            Excel (.xlsx)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onPdf)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M9 13h6" />
            </svg>
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
