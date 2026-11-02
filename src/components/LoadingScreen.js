"use client";

import { useEffect, useState } from "react";
import { api, DEFAULT_PROFIL } from "@/lib/db";

function BabyLogo() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 9h.01M15 9h.01" />
      <path d="M10 11c.6.6 1.3.8 2 .8s1.4-.2 2-.8" />
      <path d="M12 4V2.5c0-.5.4-1 1-1s1 .5 1 1" />
      <path d="M6 20c1-1.8 3.2-3 6-3s5 1.2 6 3" />
    </svg>
  );
}

export default function LoadingScreen({ label = "Memuat...", overlay = false }) {
  const [pct, setPct] = useState(0);
  const [profil, setProfil] = useState(DEFAULT_PROFIL);

  useEffect(() => {
    const t = setInterval(() => {
      setPct((p) => (p >= 95 ? p : p + Math.max(1, Math.round((95 - p) * 0.12))));
    }, 140);
    api.getProfil()
      .then((p) => setProfil({ ...DEFAULT_PROFIL, ...p }))
      .catch(() => {});
    return () => clearInterval(t);
  }, []);

  const card = (
    <div className="lp-card">
      <div className="lp-card__border" />
      <div className="lp-top">
        <div className="lp-logo">
          <div className="lp-logo-box">
            <BabyLogo />
          </div>
        </div>
        <div className="lp-content">
          <h2>SIP-Anak</h2>
          <span>{profil.namaPosyandu} · {profil.namaKelurahan?.replace(/^kelurahan\s*/i, "")}</span>
        </div>
      </div>
      <div className="lp-box">
        <div className="lp-head">
          <div className="lp-status">
            <div className="lp-loader" />
            <p>{label}</p>
          </div>
          <h1 className="lp-percent">{pct}%</h1>
        </div>
        <div className="lp-progress">
          <div className="lp-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );

  if (overlay) return <div className="lp-overlay">{card}</div>;
  return <div className="lp-wrap">{card}</div>;
}

export function InlineLoading({ label = "Memuat..." }) {
  return (
    <div className="lp-inline">
      <div className="lp-loader lp-loader--dark" />
      {label ? <p>{label}</p> : null}
    </div>
  );
}

export function MiniSpinner() {
  return <span className="lp-mini" aria-hidden="true" />;
}
