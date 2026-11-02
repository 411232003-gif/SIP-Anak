// Kirim Web Push ke subscription warga yang didaftarkan di Firestore.
// VAPID private key hanya hidup di sini — tidak pernah dikirim ke client.
// Body: { subs: [{endpoint, keys}], title, body, url }
import webpush from "web-push";

export const runtime = "nodejs";

export async function POST(request) {
  const { subs, title, body, url } = await request.json().catch(() => ({}));
  if (!Array.isArray(subs) || !subs.length || !title)
    return Response.json({ ok: false, error: "Payload tidak valid" }, { status: 400 });

  const pub = process.env.NEXT_PUBLIC_VAPID_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv)
    return Response.json(
      { ok: false, error: "VAPID key belum dikonfigurasi" },
      { status: 500 }
    );

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@sipanak.app", pub, priv);

  const payload = JSON.stringify({ title, body: body || "", url: url || "/" });
  const dead = [];
  const results = await Promise.allSettled(
    subs.slice(0, 5000).map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload)
    )
  );
  results.forEach((r, i) => {
    const code = r.status === "rejected" ? r.reason?.statusCode : null;
    if (code === 404 || code === 410) dead.push(subs[i].endpoint);
  });

  return Response.json({ ok: true, sent: subs.length - dead.length, dead });
}
