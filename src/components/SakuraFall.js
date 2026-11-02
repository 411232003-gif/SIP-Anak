"use client";

import { useEffect, useRef } from "react";

// Kelopak sakura jatuh di background halaman login (canvas, di belakang
// kartu flip). Kelopak berayun horizontal seperti tertiup angin dan
// respawn dari atas setelah keluar layar. Nonaktif otomatis saat user
// memakai prefers-reduced-motion.
export default function SakuraFall() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    let w = 0;
    let h = 0;

    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#ffc7d6", "#ffb3c6", "#ffd9e3", "#f9a8c0", "#fbd0dd"];
    const rand = (a, b) => a + Math.random() * (b - a);

    function spawn(anyY) {
      return {
        x: rand(-w * 0.2, w),
        y: anyY ? rand(-h, h) : rand(-70, -15),
        size: rand(7, 14),
        speedY: rand(0.6, 1.6),
        swayAmp: rand(18, 55),
        swayFreq: rand(0.008, 0.02),
        phase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        rotSp: rand(-0.02, 0.02),
        alpha: rand(0.55, 0.95),
        color: COLORS[(Math.random() * COLORS.length) | 0],
      };
    }

    const N = Math.max(18, Math.min(36, Math.floor(w / 40)));
    const petals = Array.from({ length: N }, () => spawn(true));

    let t = 0;
    function frame() {
      t++;
      const wind = Math.sin(t * 0.004) * 0.45 + 0.25; // embusan berubah-ubah
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.y += p.speedY;
        p.x += Math.sin(t * p.swayFreq + p.phase) * (p.swayAmp * 0.02) + wind;
        p.rot += p.rotSp;
        if (p.y > h + 20 || p.x > w + 40) Object.assign(p, spawn(false));
        if (p.x < -40) p.x = w + 20;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + Math.sin(t * p.swayFreq + p.phase) * 0.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s * 0.5);
        ctx.bezierCurveTo(s * 0.6, -s * 0.55, s * 0.75, s * 0.35, 0, s * 0.5);
        ctx.bezierCurveTo(-s * 0.75, s * 0.35, -s * 0.6, -s * 0.55, 0, -s * 0.5);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="sakura-canvas" aria-hidden="true" />;
}
