"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { api, PETUGAS_ROLES } from "./db";
import { auth as fauth } from "./firebase";

const AuthContext = createContext(null);
const SESSION_KEY = "sipanak_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function persist(u) {
    setUser(u);
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
  }

  function cachedMatch(key, value) {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return s?.[key] === value;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    // Sesi cache untuk render cepat; di mode Firebase kebenaran sesi
    // divalidasi lewat onAuthStateChanged (rules menolak request tanpa auth).
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setUser(JSON.parse(s));
    } catch {}
    if (!fauth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(fauth, async (fb) => {
      try {
        if (!fb?.email) {
          persist(null);
          return;
        }
        // Role petugas diverifikasi dari dokumen users/<uid>
        // (role ∈ admin | nakes | kader).
        const acc = await api.getUser(fb.uid).catch(() => null);
        if (acc && PETUGAS_ROLES.includes(acc.role)) {
          persist({
            role: "petugas",
            petugasRole: acc.role,
            uid: fb.uid,
            username: acc.username,
            nama: acc.nama || acc.username,
          });
          return;
        }
        // Selain itu anggap akun orang tua: bagian email sebelum '@' = NIK anak
        const nik = fb.email.split("@")[0];
        const w = await api.getAnak(nik).catch(() => null);
        if (w) persist({ role: "ortu", nik: w.nik, nama: w.nama });
        else if (!cachedMatch("nik", nik) && !cachedMatch("uid", fb.uid)) {
          // dokumen mungkin belum terbaca sesaat setelah dibuat —
          // jangan hapus sesi yang identitasnya sama
          persist(null);
        }
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function loginPetugas(username, password) {
    const a = await api.loginPetugas(username.trim().toLowerCase(), password);
    if (a) {
      persist({
        role: "petugas",
        petugasRole: a.role,
        uid: a.uid,
        username: a.username,
        nama: a.nama || a.username,
      });
      return true;
    }
    return false;
  }

  async function loginOrtu(nik, pin) {
    const w = await api.loginOrtu(nik.trim(), pin.trim());
    if (w) {
      persist({ role: "ortu", nik: w.nik, nama: w.nama });
      return w;
    }
    return null;
  }

  function logout() {
    if (fauth) signOut(fauth).catch(() => {});
    persist(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginPetugas, loginOrtu, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
