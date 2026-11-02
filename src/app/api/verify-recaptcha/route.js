// Verifikasi token reCAPTCHA v2 ke server Google (SiteVerify).
// Secret key hanya hidup di sini — tidak pernah dikirim ke client.
export async function POST(request) {
  const { token } = await request.json().catch(() => ({}));
  if (!token) return Response.json({ success: false }, { status: 400 });

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret)
    return Response.json(
      { success: false, error: "RECAPTCHA_SECRET_KEY belum dikonfigurasi" },
      { status: 500 }
    );

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  });
  const data = await res.json().catch(() => ({}));
  return Response.json({ success: Boolean(data.success) });
}
