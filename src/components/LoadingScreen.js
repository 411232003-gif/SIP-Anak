"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, DEFAULT_PROFIL } from "@/lib/db";

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
            <Image
              src="/icons/icon-192.png"
              alt="Logo SIP-Anak"
              width={64}
              height={64}
              priority
            />
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
