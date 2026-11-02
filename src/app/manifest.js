export default function manifest() {
  return {
    name: "SIP-Anak — Sistem Informasi Posyandu Anak",
    short_name: "SIP-Anak",
    description:
      "Aplikasi pencatatan Posyandu: KMS digital, imunisasi, pemantauan stunting, dan kesehatan ibu.",
    id: "/",
    scope: "/",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff0f6",
    theme_color: "#f6339a",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
