"use client";

// Dialog konfirmasi kustom — pengganti window.confirm bawaan browser
// (yang menampilkan nama domain mentah & tampilan generik).
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Hapus data?",
  message,
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  busy = false,
  tone = "danger", // "danger" | "primary"
}) {
  if (!open) return null;

  const danger = tone === "danger";
  const grad = danger ? "from-red-500 to-rose-600" : "from-pink-500 to-pink-700";
  const hover = danger ? "hover:from-red-600 hover:to-rose-700" : "hover:from-pink-600 hover:to-pink-800";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${grad} px-5 py-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
              {danger ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              {danger && <p className="text-xs text-red-100">Tindakan ini tidak dapat dibatalkan</p>}
            </div>
          </div>
        </div>

        {message && <p className="px-5 py-4 text-sm leading-relaxed text-gray-600">{message}</p>}

        <div className="flex gap-2.5 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-xl bg-gradient-to-r ${grad} py-2.5 text-sm font-semibold text-white shadow-md transition ${hover} disabled:opacity-50`}
          >
            {busy ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
