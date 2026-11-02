"use client";

import { useEffect, useState } from "react";

export function usePagination(items, { perPage = 10, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, resetDeps);

  const start = (safePage - 1) * perPage;
  const end = Math.min(start + perPage, items.length);
  return {
    page: safePage,
    setPage,
    totalPages,
    total: items.length,
    start: items.length ? start + 1 : 0,
    end,
    pageItems: items.slice(start, end),
  };
}

function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (page >= totalPages - 3) {
    return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "…", page - 1, page, page + 1, "…", totalPages];
}

const btnCls =
  "min-w-8 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors";
const navCls =
  `${btnCls} border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40`;

export default function Pagination({ page, totalPages, total, start, end, onChange, className = "" }) {
  if (totalPages <= 1) return null;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <p className="text-xs text-gray-500">
        Menampilkan {start}–{end} dari {total} data
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className={navCls}
        >
          ‹
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1.5 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${btnCls} ${
                p === page
                  ? "border-pink-600 bg-pink-600 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
          className={navCls}
        >
          ›
        </button>
      </div>
    </div>
  );
}
