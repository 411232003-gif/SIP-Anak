// Web Push client — langganan notifikasi perangkat orang tua.
// Subscription disimpan di Firestore (koleksi `pushSubs`, mode demo:
// localStorage) lalu API route /api/notify mengirim push via VAPID.
import { api } from "./db";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_KEY;

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// true = dukung + VAPID key sudah diset
export function pushReady() {
  return pushSupported() && Boolean(VAPID_PUBLIC);
}

function b64ToUint8(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  return reg ? reg.pushManager.getSubscription() : null;
}

// Minta izin notifikasi lalu daftarkan perangkat ini untuk menerima push.
export async function enablePush(nik) { // nik = NIK anak (akun orang tua)
  if (!pushSupported()) throw new Error("Perangkat/browser tidak mendukung notifikasi push");
  if (!VAPID_PUBLIC) throw new Error("Notifikasi belum dikonfigurasi di server");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Izin notifikasi ditolak — aktifkan lewat pengaturan browser");
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: b64ToUint8(VAPID_PUBLIC),
  });
  const json = sub.toJSON();
  await api.savePushSubscription(nik, { endpoint: json.endpoint, keys: json.keys });
  return sub;
}

export async function disablePush(nik) {
  const sub = await getPushSubscription();
  if (sub) {
    await api.removePushSubscription(nik, sub.endpoint).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
}

// Kirim push tes ke perangkat INI langsung via /api/notify — memakai
// subscription lokal (tanpa baca Firestore, jadi aman untuk role warga).
export async function testPush() {
  const sub = await getPushSubscription();
  if (!sub) return { sent: 0, reason: "perangkat belum berlangganan" };
  const json = sub.toJSON();
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subs: [{ endpoint: json.endpoint, keys: json.keys }],
      title: "Tes Notifikasi",
      body: "Notifikasi SIP-Anak berhasil — jadwal Posyandu & hasil penimbangan akan muncul seperti ini.",
      url: "/ortu",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { sent: 0, error: data.error || `HTTP ${res.status}` };
  return { sent: data.sent ?? 0 };
}
