"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const WIDGET_W = 304;
const WIDGET_H = 78;
const BOX_PADDING = 8; // padding horizontal .captcha-box

let loadPromise = null;
function loadScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      window.__sipanakRecaptchaOnload = () => resolve(window.grecaptcha);
      const s = document.createElement("script");
      s.src =
        "https://www.google.com/recaptcha/api.js?onload=__sipanakRecaptchaOnload&render=explicit";
      s.async = true;
      s.defer = true;
      s.onerror = () => reject(new Error("Gagal memuat reCAPTCHA"));
      document.head.appendChild(s);
    });
  }
  return loadPromise;
}

// Widget reCAPTCHA v2. Lebar widget (304px) di-scale otomatis mengikuti
// lebar .captcha-box (yang selebar input-box) supaya tidak overflow
// di mobile. Panggil ref.current.reset() untuk mengosongkan centang
// (mis. setelah login gagal — token v2 hanya bisa dipakai sekali).
const RecaptchaBox = forwardRef(function RecaptchaBox({ onToken }, ref) {
  const wrapRef = useRef(null);
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const onTokenRef = useRef(onToken);
  const [scale, setScale] = useState(1);
  onTokenRef.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.grecaptcha && widgetId.current !== null) {
        window.grecaptcha.reset(widgetId.current);
        onTokenRef.current("");
      }
    },
  }));

  // Ukur lebar kotak → scale widget (304px) agar pas tanpa overflow.
  useEffect(() => {
    if (!SITE_KEY || !wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, (el.clientWidth - BOX_PADDING) / WIDGET_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then((g) => {
        if (cancelled || !g || !boxRef.current || widgetId.current !== null) return;
        const dark =
          document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark");
        widgetId.current = g.render(boxRef.current, {
          sitekey: SITE_KEY,
          theme: dark ? "dark" : "light",
          callback: (t) => onTokenRef.current(t),
          "expired-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!SITE_KEY) return null;
  return (
    <div ref={wrapRef} className="captcha-box">
      <div
        style={{
          width: WIDGET_W * scale,
          height: WIDGET_H * scale,
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        <div
          ref={boxRef}
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
        />
      </div>
    </div>
  );
});

export default RecaptchaBox;
