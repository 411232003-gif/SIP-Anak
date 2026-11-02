"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "sipanak_theme";

export default function ThemeToggle() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    setNight(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !night;
    setNight(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "night" : "day");
    } catch {}
  }

  return (
    <button
      type="button"
      className={`tm-switch ${night ? "night" : ""}`}
      onClick={toggle}
      aria-pressed={night}
      aria-label={night ? "Ganti ke mode siang" : "Ganti ke mode malam"}
      title={night ? "Mode malam aktif" : "Mode siang aktif"}
    >
      <span className="tm-track">
        <span className="tm-moon" />
        <span className="tm-sun" />
        <span className="tm-stars">
          <i /><i /><i /><i /><i />
        </span>
        <span className="tm-clouds">
          <i className="c1" />
          <i className="c2" />
        </span>
      </span>
      <span className="tm-knob" />
    </button>
  );
}
