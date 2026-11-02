"use client";

import { RW_LIST, RT_LIST } from "@/lib/utils";

const selectCls =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none";

export default function FilterBar({ rw, setRw, rt, setRt, q, setQ, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={selectCls} value={rw} onChange={(e) => setRw(e.target.value)}>
        <option value="Semua">Semua RW</option>
        {RW_LIST.map((r) => <option key={r}>{r}</option>)}
      </select>
      <select className={selectCls} value={rt} onChange={(e) => setRt(e.target.value)}>
        <option value="Semua">Semua RT</option>
        {RT_LIST.map((r) => <option key={r}>{r}</option>)}
      </select>
      {extra}
      <input
        className={`${selectCls} min-w-0 flex-1`}
        placeholder="Cari nama atau NIK..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </div>
  );
}
