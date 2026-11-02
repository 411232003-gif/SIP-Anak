"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, USE_FIREBASE } from "@/lib/db";
import LoadingScreen from "@/components/LoadingScreen";
import ThemeToggle from "@/components/ThemeToggle";
import RecaptchaBox from "@/components/RecaptchaBox";

const CAPTCHA_ON = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

async function verifyCaptcha(token) {
  const res = await fetch("/api/verify-recaptcha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const d = await res.json().catch(() => ({}));
  return Boolean(d.success);
}

export default function LoginPage() {
  const [mode, setMode] = useState("ortu"); // "ortu" | "petugas"
  const [nik, setNik] = useState("");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [capOrtu, setCapOrtu] = useState("");
  const [capAdmin, setCapAdmin] = useState("");
  const capOrtuRef = useRef(null);
  const capAdminRef = useRef(null);
  const { loginPetugas, loginOrtu } = useAuth();
  const router = useRouter();
  const [demoNote, setDemoNote] = useState(false);
  useEffect(() => setDemoNote(!USE_FIREBASE), []);

  function switchMode(to) {
    if (to === mode) return;
    setMode(to);
    setError("");
    setResetMsg("");
  }

  async function handleReset() {
    const email = username.trim();
    setError("");
    setResetMsg("");
    if (!email.includes("@")) {
      setError("Ketik email akun petugas Anda di kolom atas, lalu klik Lupa password lagi");
      return;
    }
    if (CAPTCHA_ON && !capAdmin) {
      setError("Centang kotak reCAPTCHA dulu");
      return;
    }
    if (CAPTCHA_ON && !(await verifyCaptcha(capAdmin))) {
      setError("Verifikasi reCAPTCHA gagal — coba lagi");
      capAdminRef.current?.reset();
      return;
    }
    setLoading(true);
    try {
      await api.resetPetugasPassword(email);
      setResetMsg(`Link reset password dikirim ke ${email} — cek inbox atau folder spam.`);
    } catch (err) {
      setError(err.message || "Gagal mengirim link reset");
    } finally {
      setLoading(false);
    }
  }

  async function handleOrtu(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (CAPTCHA_ON) {
        if (!capOrtu) {
          setError("Centang kotak reCAPTCHA dulu");
          return;
        }
        if (!(await verifyCaptcha(capOrtu))) {
          setError("Verifikasi reCAPTCHA gagal — coba lagi");
          capOrtuRef.current?.reset();
          return;
        }
      }
      const w = await loginOrtu(nik, pin);
      if (w) return router.replace("/ortu");
      capOrtuRef.current?.reset();
      setError("NIK anak atau kata sandi salah. Pastikan anak sudah didaftarkan kader.");
    } catch (err) {
      capOrtuRef.current?.reset();
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handlePetugas(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (CAPTCHA_ON) {
        if (!capAdmin) {
          setError("Centang kotak reCAPTCHA dulu");
          return;
        }
        if (!(await verifyCaptcha(capAdmin))) {
          setError("Verifikasi reCAPTCHA gagal — coba lagi");
          capAdminRef.current?.reset();
          return;
        }
      }
      const ok = await loginPetugas(username, password);
      if (ok) return router.replace("/admin/beranda");
      capAdminRef.current?.reset();
      setError("Username atau password petugas salah");
    } catch (err) {
      capAdminRef.current?.reset();
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg-hero">
      <div className="tm-corner">
        <ThemeToggle />
      </div>

      <div className="lg-card">
        <h1>SIP-Anak</h1>
        <h2>Selamat Datang</h2>
        <p>
          Masuk untuk memantau KMS digital, imunisasi,
          dan tumbuh kembang si kecil di posyandu.
        </p>

        {/* Pemilih peran — gaya countdown glass */}
        <div className="lg-roles">
          <button
            type="button"
            className={`lg-role ${mode === "ortu" ? "active" : ""}`}
            onClick={() => switchMode("ortu")}
          >
            <span>Orang Tua</span>
            <small>NIK ANAK</small>
          </button>
          <button
            type="button"
            className={`lg-role ${mode === "petugas" ? "active" : ""}`}
            onClick={() => switchMode("petugas")}
          >
            <span>Petugas</span>
            <small>KADER · NAKES · ADMIN</small>
          </button>
        </div>

        {mode === "ortu" ? (
          <form className="lg-form" onSubmit={handleOrtu}>
            <input
              type="text"
              className="lg-input"
              placeholder="NIK Anak"
              inputMode="numeric"
              autoComplete="off"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
            />
            <input
              type="password"
              className="lg-input"
              placeholder="Kata sandi"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            {error && <p className="login-error">{error}</p>}
            <RecaptchaBox ref={capOrtuRef} onToken={setCapOrtu} />
            <button
              type="submit"
              className="lg-join"
              disabled={loading || (CAPTCHA_ON && !capOrtu)}
            >
              Masuk
            </button>
          </form>
        ) : (
          <form className="lg-form" onSubmit={handlePetugas}>
            <input
              type="text"
              className="lg-input"
              placeholder="Email atau username petugas"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              className="lg-input"
              placeholder="Password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="login-error">{error}</p>}
            {resetMsg && <p className="login-success">{resetMsg}</p>}
            <RecaptchaBox ref={capAdminRef} onToken={setCapAdmin} />
            <button
              type="submit"
              className="lg-join"
              disabled={loading || (CAPTCHA_ON && !capAdmin)}
            >
              Masuk
            </button>
            <button type="button" className="lg-link" onClick={handleReset} disabled={loading}>
              Lupa password?
            </button>
          </form>
        )}

        <div className="lg-privacy">
          🔒 Data Anda aman — hanya petugas berwenang yang bisa mengakses.
        </div>

        {/* Chip fitur — pengganti baris sosial */}
        <div className="lg-socials">
          <span className="lg-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15v3"/><path d="M12 10v8"/><path d="M17 6v12"/></svg>
          </span>
          <span className="lg-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>
          </span>
          <span className="lg-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 8h18M8 11h4M8 14h6"/></svg>
          </span>
          <span className="lg-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-4-3.5-8-6.6-8-10.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 3.9-4 7-8 10.5z"/></svg>
          </span>
        </div>
      </div>

      {demoNote && (
        <p className="lg-note">
          Mode demo — data tersimpan di browser ini (Firebase belum dikonfigurasi).
        </p>
      )}

      {loading && <LoadingScreen overlay label="Memeriksa akun..." />}
    </div>
  );
}
