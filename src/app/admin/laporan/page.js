"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/db";
import {
  BULAN_SINGKAT, RW_LIST, RT_LIST, bulanKey, bulanLabel,
  umurLabel, matchSearch, formatTglLahir,
} from "@/lib/utils";
import { hc } from "@/lib/giziLevel";
import { exportHealthXlsx, exportHealthPdf } from "@/lib/exporter";
import ExportMenu from "@/components/ExportMenu";
import { InlineLoading } from "@/components/LoadingScreen";
import Pagination, { usePagination } from "@/components/Pagination";

const HEADERS = [
  "Nama", "NIK", "RW", "RT", "Umur", "L/P", "BB(kg)", "TB(cm)", "LK(cm)",
  "BB/U", "TB/U", "BB/TB", "Imunisasi",
];

function giziCells(w, p, imun) {
  return [
    w.nama, w.nik, w.rw, w.rt, umurLabel(w.tanggalLahir),
    w.jenisKelamin === "Laki-laki" ? "L" : "P",
    p?.bb || "", p?.tb || "", p?.lk || "",
    { v: p?.sBBU?.label || "", lv: p?.sBBU },
    { v: p?.sTBU?.label || "", lv: p?.sTBU },
    { v: p?.sBBTB?.label || "", lv: p?.sBBTB },
    imun ?? "",
  ];
}

export default function LaporanPage() {
  const now = new Date();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth());
  const [anak, setAnak] = useState([]);
  const [kehadiran, setKehadiran] = useState([]);
  const [pengukuran, setPengukuran] = useState([]);
  const [imunisasi, setImunisasi] = useState([]);
  const [targets, setTargets] = useState({});
  const [profil, setProfil] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editRw, setEditRw] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [fRw, setFRw] = useState("Semua");
  const [fQ, setFQ] = useState("");

  const selKey = `${tahun}-${String(bulan + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    const [w, a, p, i, t, pr] = await Promise.all([
      api.listAnak(), api.listKehadiran(), api.listPengukuran(),
      api.listImunisasi(), api.getTargets(), api.getProfil(),
    ]);
    setAnak(w); setKehadiran(a); setPengukuran(p); setImunisasi(i); setTargets(t); setProfil(pr);
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const hadirSet = useMemo(
    () => new Set(kehadiran.filter((a) => a.bulan === selKey).map((a) => a.nik)),
    [kehadiran, selKey]
  );

  const pengBulan = useMemo(() => {
    const m = new Map();
    pengukuran.filter((p) => p.bulan === selKey).forEach((p) => m.set(p.nik, p));
    return m;
  }, [pengukuran, selKey]);

  const imunCount = useMemo(() => {
    const m = new Map();
    imunisasi.forEach((r) => m.set(r.nik, (m.get(r.nik) || 0) + 1));
    return m;
  }, [imunisasi]);

  const targetOf = useCallback(
    (rw) => {
      const t = targets[rw];
      if (t !== undefined && t !== null && t !== "") return Number(t) || 0;
      return anak.filter((w) => w.rw === rw).length;
    },
    [targets, anak]
  );

  const rekap = useMemo(
    () => RW_LIST.map((rw) => {
      const hadir = kehadiran.filter((a) => a.bulan === selKey && a.rw === rw).length;
      const target = targetOf(rw);
      return { rw, hadir, target, capaian: target ? (hadir / target) * 100 : 0 };
    }),
    [kehadiran, selKey, targetOf]
  );

  const totalTarget = rekap.reduce((s, r) => s + r.target, 0);
  const totalHadir = rekap.reduce((s, r) => s + r.hadir, 0);

  const stuntingCount = useMemo(
    () => [...pengBulan.values()].filter((p) => p.sTBU?.level === "bahaya").length,
    [pengBulan]
  );
  const giziKurangCount = useMemo(
    () => [...pengBulan.values()].filter((p) => p.sBBTB?.level === "bahaya" || p.sBBU?.level === "bahaya").length,
    [pengBulan]
  );

  const chartData = useMemo(
    () => BULAN_SINGKAT.map((b, i) => {
      const key = `${tahun}-${String(i + 1).padStart(2, "0")}`;
      return {
        bulan: b,
        "Total Hadir": kehadiran.filter((a) => a.bulan === key).length,
        "Terukur": pengukuran.filter((p) => p.bulan === key && p.bb && p.tb).length,
      };
    }),
    [kehadiran, pengukuran, tahun]
  );

  const tableRows = useMemo(
    () => anak.filter((w) => {
      if (!hadirSet.has(w.nik)) return false;
      if (fRw !== "Semua" && w.rw !== fRw) return false;
      return matchSearch(w, fQ);
    }),
    [anak, hadirSet, fRw, fQ]
  );

  const pg = usePagination(tableRows, { resetDeps: [fRw, fQ, selKey] });

  async function saveTarget(rw) {
    const t = { ...targets, [rw]: Number(editVal) || 0 };
    await api.setTargets(t);
    setTargets(t);
    setEditRw(null);
  }

  const instansi = profil ? `${profil.namaPosyandu} — ${profil.namaKelurahan}` : "Posyandu";

  async function doExport(sections, scopeLabel, scopeSlug, kind) {
    if (exporting) return;
    setExporting(true);
    try {
      const payload = {
        instansi,
        judul: `Laporan Gizi Anak — ${bulanLabel(selKey)}${scopeLabel ? ` · ${scopeLabel}` : ""}`,
        headers: HEADERS,
        sections: sections.map((s) => ({
          label: s.label,
          rows: s.list.map((w) => giziCells(w, pengBulan.get(w.nik), `${imunCount.get(w.nik) || 0}/13`)),
        })),
        filename: `posyandu${scopeSlug ? `_${scopeSlug}` : "_semua"}_${selKey}.${kind}`,
      };
      if (kind === "xlsx") await exportHealthXlsx(payload);
      else await exportHealthPdf(payload);
    } finally {
      setExporting(false);
    }
  }

  const exportRw = (rw, kind) =>
    doExport(
      [{ label: rw, list: anak.filter((w) => w.rw === rw && hadirSet.has(w.nik)) }],
      rw, rw.replace(/\s+/g, "").toLowerCase(), kind
    );

  const exportAll = (kind) => {
    const groups = RW_LIST
      .map((rw) => ({ label: rw, list: tableRows.filter((w) => w.rw === rw) }))
      .filter((g) => g.list.length);
    const extra = tableRows.filter((w) => !RW_LIST.includes(w.rw));
    if (extra.length) groups.push({ label: "Lainnya", list: extra });
    return doExport(groups, "", "", kind);
  };

  const selectCls =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Laporan</h1>
          <p className="text-sm text-gray-500">Rekap gizi & partisipasi untuk Puskesmas</p>
        </div>
        <ExportMenu busy={exporting} onExcel={() => exportAll("xlsx")} onPdf={() => exportAll("pdf")} />
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        {[
          ["Total Hadir", totalHadir, "text-pink-700"],
          ["Target Anak", totalTarget, "text-gray-900"],
          ["Indikasi Stunting", stuntingCount, stuntingCount ? "text-red-600" : "text-emerald-600"],
          ["Gizi Kurang/Buruk", giziKurangCount, giziKurangCount ? "text-red-600" : "text-emerald-600"],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-xl border border-pink-100 bg-white p-3 sm:p-4">
            <p className="text-xs text-gray-500">{l}</p>
            <p className={`text-xl font-bold sm:text-2xl ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Pilih bulan */}
      <div className="rounded-xl border border-pink-100 bg-white p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Pilih Bulan</p>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <button onClick={() => setTahun((t) => t - 1)} className="rounded px-2 py-1 hover:bg-gray-100">&lt;</button>
            <span>{tahun}</span>
            <button onClick={() => setTahun((t) => t + 1)} className="rounded px-2 py-1 hover:bg-gray-100">&gt;</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BULAN_SINGKAT.map((b, i) => (
            <button
              key={b}
              onClick={() => setBulan(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium sm:text-sm ${
                bulan === i ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Grafik tren */}
      <div className="rounded-xl border border-pink-100 bg-white p-3 sm:p-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">Tren Bulanan — {tahun}</p>
        <div className="h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fbd0e4" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Total Hadir" stroke="#d61f83" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Terukur" stroke="#a21caf" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rekap per RW */}
      <div className="rounded-xl border border-pink-100 bg-white">
        <p className="border-b border-pink-100 px-4 py-3 text-sm font-semibold text-gray-700">
          Rekapitulasi Partisipasi Anak — {bulanLabel(selKey)}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Hadir</th>
                <th className="px-4 py-3">Target Anak <span className="normal-case text-gray-400">(klik untuk edit)</span></th>
                <th className="px-4 py-3">Capaian</th>
                <th className="px-4 py-3">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {rekap.map((r) => (
                <tr key={r.rw} className="hover:bg-pink-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.rw}</td>
                  <td className="px-4 py-3 text-gray-600">{r.hadir}</td>
                  <td className="px-4 py-3">
                    {editRw === r.rw ? (
                      <span className="inline-flex items-center gap-1">
                        <input
                          autoFocus
                          className="w-16 rounded border border-pink-500 px-2 py-1 text-sm"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => { if (e.key === "Enter") saveTarget(r.rw); if (e.key === "Escape") setEditRw(null); }}
                        />
                        <button onClick={() => saveTarget(r.rw)} className="rounded bg-pink-600 px-2 py-1 text-xs text-white">OK</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setEditRw(r.rw); setEditVal(String(r.target)); }}
                        className="text-gray-700 underline decoration-dotted underline-offset-4 hover:text-pink-700"
                      >
                        {r.target}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${r.capaian > 0 ? "text-pink-700" : "text-gray-400"}`}>
                      {r.capaian.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ExportMenu compact busy={exporting} onExcel={() => exportRw(r.rw, "xlsx")} onPdf={() => exportRw(r.rw, "pdf")} />
                  </td>
                </tr>
              ))}
              <tr className="bg-pink-50/60 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-4 py-3 text-gray-900">{totalHadir}</td>
                <td className="px-4 py-3 text-gray-900">{totalTarget}</td>
                <td className="px-4 py-3 text-pink-700">{totalTarget ? ((totalHadir / totalTarget) * 100).toFixed(0) : 0}%</td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Data gizi */}
      <div className="rounded-xl border border-pink-100 bg-white">
        <p className="border-b border-pink-100 px-4 py-3 text-sm font-semibold text-gray-700">
          Data Pengukuran Anak — {bulanLabel(selKey)}
        </p>
        <div className="flex flex-wrap items-center gap-2 border-b border-pink-100 p-3">
          <select className={selectCls} value={fRw} onChange={(e) => setFRw(e.target.value)}>
            <option value="Semua">Semua RW</option>
            {RW_LIST.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input
            className={`${selectCls} min-w-0 flex-1`}
            placeholder="Cari nama/NIK..."
            value={fQ}
            onChange={(e) => setFQ(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead>
              <tr className="border-b border-pink-100 uppercase tracking-wide text-gray-500">
                {HEADERS.map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {loading ? (
                <tr><td colSpan={13} className="px-4 py-6"><InlineLoading /></td></tr>
              ) : tableRows.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
              ) : (
                pg.pageItems.map((w) => {
                  const p = pengBulan.get(w.nik);
                  return (
                    <tr key={w.nik} className="hover:bg-pink-50/50">
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">{w.nama}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600">{w.nik}</td>
                      <td className="px-3 py-2 text-gray-600">{w.rw}</td>
                      <td className="px-3 py-2 text-gray-600">{w.rt}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600">{umurLabel(w.tanggalLahir)}</td>
                      <td className="px-3 py-2 text-gray-600">{w.jenisKelamin === "Laki-laki" ? "L" : "P"}</td>
                      <td className="px-3 py-2 text-gray-600">{p?.bb || "-"}</td>
                      <td className="px-3 py-2 text-gray-600">{p?.tb || "-"}</td>
                      <td className="px-3 py-2 text-gray-600">{p?.lk || "-"}</td>
                      <td className={`whitespace-nowrap px-3 py-2 ${hc(p?.sBBU)}`}>{p?.sBBU?.label || "-"}</td>
                      <td className={`whitespace-nowrap px-3 py-2 ${hc(p?.sTBU)}`}>{p?.sTBU?.label || "-"}</td>
                      <td className={`whitespace-nowrap px-3 py-2 ${hc(p?.sBBTB)}`}>{p?.sBBTB?.label || "-"}</td>
                      <td className="px-3 py-2 text-gray-600">{imunCount.get(w.nik) || 0}/13</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pg.page}
          totalPages={pg.totalPages}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onChange={pg.setPage}
          className="border-t border-pink-100 px-4 py-3"
        />
      </div>
    </div>
  );
}
