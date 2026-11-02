"use client";

import { useCallback, useEffect, useState } from "react";
import { api, DEFAULT_PROFIL } from "@/lib/db";
import { formatTglLahir } from "@/lib/utils";
import Modal from "@/components/Modal";
import SuratSheet, { downloadEdaranDoc } from "@/components/SuratSheet";
import { InlineLoading } from "@/components/LoadingScreen";

export default function EdaranOrtuPage() {
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [e, p] = await Promise.all([api.listEdaran(), api.getProfil()]);
    setList(e);
    setProfil({ ...DEFAULT_PROFIL, ...p });
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  function unduhDoc() {
    if (!detail) return;
    downloadEdaranDoc(detail, profil);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Surat Edaran</h1>
        <p className="text-sm text-gray-500">Pengumuman resmi dari {profil.namaPosyandu}</p>
      </div>

      <div className="rounded-xl border border-pink-100 bg-white">
        {loading ? (
          <div className="px-4 py-6"><InlineLoading /></div>
        ) : list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            Belum ada surat edaran yang diterbitkan.
          </p>
        ) : (
          <ul className="divide-y divide-pink-50">
            {list.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <button onClick={() => setDetail(e)} className="block w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{e.judul}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatTglLahir(e.tanggal)}
                        {e.nomor ? ` · No. ${e.nomor}` : ""}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">{e.isi}</p>
                    </div>
                    <span className="mt-1 shrink-0 text-gray-300">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Surat Edaran">
        {detail && (
          <div className="space-y-4">
            <SuratSheet edaran={detail} profil={profil} />
            <button
              onClick={unduhDoc}
              className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
            >
              Unduh Surat (.doc)
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
