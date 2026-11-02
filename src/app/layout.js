import { Geist, Geist_Mono, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import RegisterSW from "@/components/RegisterSW";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "SIP-Anak — Sistem Informasi Posyandu Anak",
  description:
    "Aplikasi pencatatan Posyandu: KMS digital, imunisasi, pemantauan stunting, dan kesehatan ibu.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SIP-Anak" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f6339a",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("sipanak_theme")==="night")document.documentElement.classList.add("dark")}catch(e){}`}
        </Script>
        <AuthProvider>{children}</AuthProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
