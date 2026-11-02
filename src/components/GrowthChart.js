"use client";

import { useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceDot, ResponsiveContainer,
} from "recharts";
import { referensiSeries } from "@/lib/growth";

// Grafik KMS digital: pita hijau normal (-2SD..+2SD) berdasar kurva WHO,
// garis merah -2SD/-3SD, titik pengukuran anak.
//   jenis: "bbu" (Berat/Umur) | "tbu" (Tinggi/Umur)
//   logs : pengukuran anak [{umurBln, bb|tb, tanggal|bulan}]
export default function GrowthChart({ jenis = "bbu", jk = "Laki-laki", logs = [], umurMax = 24 }) {
  const isBB = jenis === "bbu";
  const dataKey = isBB ? "bb" : "tb";

  const data = useMemo(() => {
    const ref = referensiSeries(jenis, jk, umurMax);
    const byUmur = new Map(ref.map((r) => [r.umur, r]));
    logs.forEach((l) => {
      const u = Math.round(l.umurBln ?? l.umur ?? 0);
      const row = byUmur.get(u) || { umur: u };
      row.anak = parseFloat(l[dataKey]);
      if (!byUmur.has(u)) byUmur.set(u, row);
    });
    return [...byUmur.values()]
      .sort((a, b) => a.umur - b.umur)
      .map((r) => ({
        ...r,
        bandLow: r.sd3n ?? null,
        bandRange:
          r.sd2p !== undefined && r.sd3n !== undefined ? r.sd2p - r.sd3n : null,
      }));
  }, [jenis, jk, logs, umurMax, dataKey]);

  const satuan = isBB ? "kg" : "cm";

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#fbd0e4" />
          <XAxis
            dataKey="umur"
            tick={{ fontSize: 11, fill: "#9d4a72" }}
            tickFormatter={(v) => `${v}`}
            label={{ value: "Umur (bln)", position: "insideBottomRight", offset: -2, fontSize: 10, fill: "#9d4a72" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#9d4a72" }} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v, name) => [
              v !== null && v !== undefined ? `${v} ${satuan}` : "-",
              name,
            ]}
            labelFormatter={(u) => `Umur ${u} bulan`}
            contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #f9a8d4" }}
          />
          {/* Pita zona normal -3SD..+2SD */}
          <Area
            type="monotone"
            dataKey="bandLow"
            stackId="zona"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
            legendType="none"
            tooltipType="none"
          />
          <Area
            type="monotone"
            dataKey="bandRange"
            stackId="zona"
            stroke="none"
            fill="#bbf7d0"
            fillOpacity={0.45}
            name="Zona Normal"
            isAnimationActive={false}
          />
          <Line type="monotone" dataKey="sd2n" name="Batas -2SD" stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sd3n" name="Batas -3SD" stroke="#7f1d1d" strokeWidth={1.5} strokeDasharray="3 4" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="med" name="Median WHO" stroke="#059669" strokeWidth={1.5} strokeDasharray="8 5" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sd2p" name="Batas +2SD" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="anak"
            name="Anak"
            stroke="#d61f83"
            strokeWidth={3}
            dot={{ r: 4, fill: "#d61f83", stroke: "#fff", strokeWidth: 1.5 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
