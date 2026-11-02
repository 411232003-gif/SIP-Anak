/** @type {import('next').NextConfig} */
const nextConfig = {
  // Izinkan akses dev server lewat IP LAN (misal tes dari HP)
  allowedDevOrigins: ["192.168.100.31", "127.0.0.1", "localhost"],
};

export default nextConfig;
