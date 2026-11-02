"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, USE_FIREBASE } from "@/lib/db";
import LoadingScreen from "@/components/LoadingScreen";
import ThemeToggle from "@/components/ThemeToggle";
import RecaptchaBox from "@/components/RecaptchaBox";
import SakuraFall from "@/components/SakuraFall";

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

function IdCardIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M5.8 16c.5-1.4 1.6-2 2.7-2s2.2.6 2.7 2" />
      <path d="M14.5 10h4" />
      <path d="M14.5 13.5h4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

export default function LoginPage() {
  const [flipped, setFlipped] = useState(false);
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

  function flip(toAdmin) {
    setFlipped(toAdmin);
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

  async function handleAdmin(e) {
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
    <div className="login-wrapper">
      <SakuraFall />

      <div className="tm-corner">
        <ThemeToggle />
      </div>

      <div className="login-brand">
        <h2>SIP-Anak</h2>
        <span className="live-badge" title="Sistem sedang aktif">
          <span className="live-dot" aria-hidden="true" />
          LIVE
        </span>
      </div>

      <div className={`flip-scene ${flipped ? "flipped" : ""}`}>
        <div className="flip-card">
          {/* DEPAN — LOGIN ORANG TUA */}
          <div className="glass-circle front">
            <form className="login-form" onSubmit={handleOrtu}>
              <h1>Login</h1>
              <div className="subtitle">Masuk sebagai Orang Tua</div>

              <div className="input-box">
                <span className="ico"><IdCardIcon /></span>
                <input
                  type="text"
                  placeholder="NIK Anak"
                  inputMode="numeric"
                  autoComplete="off"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="input-box">
                <span className="ico"><LockIcon /></span>
                <input
                  type="password"
                  placeholder="Kata sandi"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>

              {error && !flipped && <p className="login-error">{error}</p>}

              <RecaptchaBox ref={capOrtuRef} onToken={setCapOrtu} />

              <button
                type="submit"
                className="login-btn"
                disabled={loading || (CAPTCHA_ON && !capOrtu)}
              >
                Masuk
              </button>

              <div className="signup-text flip-link">
                Kader / Petugas Posyandu?{" "}
                <button type="button" onClick={() => flip(true)}>
                  Login Petugas
                </button>
              </div>
            </form>
          </div>

          {/* BELAKANG — LOGIN PETUGAS */}
          <div className="glass-circle back">
            <form className="login-form" onSubmit={handleAdmin}>
              <h1>Petugas</h1>
              <div className="subtitle">Admin · Nakes · Kader Posyandu</div>

              <div className="input-box">
                <span className="ico"><UserIcon /></span>
                <input
                  type="text"
                  placeholder="Email atau username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-box">
                <span className="ico"><LockIcon /></span>
                <input
                  type="password"
                  placeholder="Password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && flipped && <p className="login-error">{error}</p>}
              {resetMsg && flipped && <p className="login-success">{resetMsg}</p>}

              <RecaptchaBox ref={capAdminRef} onToken={setCapAdmin} />

              <button
                type="submit"
                className="login-btn"
                disabled={loading || (CAPTCHA_ON && !capAdmin)}
              >
                Masuk
              </button>

              <div className="signup-text">
                <button type="button" onClick={handleReset} disabled={loading}>
                  Lupa password?
                </button>
              </div>

              <div className="signup-text flip-link">
                Bukan petugas?{" "}
                <button type="button" onClick={() => flip(false)}>
                  Login Orang Tua
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {!USE_FIREBASE && (
        <p className="login-note">
          Firebase belum dikonfigurasi — berjalan dalam mode demo
          (data tersimpan di browser ini).
        </p>
      )}

      {loading && <LoadingScreen overlay label="Memeriksa akun..." />}
    </div>
  );
}
