"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 3v18h18" />
      <path d="M7 15v3" />
      <path d="M12 10v8" />
      <path d="M17 6v12" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3.5 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M16.5 5a3.5 3.5 0 0 1 0 6.2" />
      <path d="M18 14.4a6 6 0 0 1 3 4.6v1" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="9" width="18" height="7" rx="1.5" />
      <path d="M7 9v3" />
      <path d="M11 9v4" />
      <path d="M15 9v3" />
      <path d="M19 9v4" />
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M5.5 16.5c.7-1.6 1.7-2.4 3-2.4s2.3.8 3 2.4" />
      <path d="M14 9.5h4.5M14 12.5h4.5M14 15.5h3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  );
}

function MotherIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="6.5" r="3" />
      <path d="M12 10c-2 1.5-4 3.2-4 5.5a4 4 0 0 0 8 0c0-2.3-2-4-4-5.5z" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
  );
}

const BERANDA_ROUTES = {
  admin: ["/admin/beranda", "/admin/kehadiran", "/admin/input-ukur", "/admin/imunisasi", "/admin/edaran"],
};

const MONEV_ITEMS = [
  { href: "/admin/laporan", label: "Laporan", Icon: ChartIcon },
  { href: "/admin/data-anak", label: "Data Anak", Icon: UsersIcon },
  { href: "/admin/data-ibu", label: "Data Ibu", Icon: MotherIcon },
  { href: "/admin/jadwal", label: "Jadwal", Icon: CalendarIcon },
  // Item beranda — hanya tampil di desktop (menu beranda disembunyikan di sana)
  { href: "/admin/kehadiran", label: "Kehadiran", Icon: ClipboardCheckIcon, desktopOnly: true },
  { href: "/admin/edaran", label: "Edaran", Icon: MailIcon, desktopOnly: true },
];

const ORTU_ITEMS = [
  { href: "/ortu/kms", label: "KMS Anak", Icon: ChartIcon },
  { href: "/ortu/imunisasi", label: "Imunisasi", Icon: SyringeIcon },
  { href: "/ortu/riwayat", label: "Riwayat", Icon: HistoryIcon },
  { href: "/ortu/edaran", label: "Edaran", Icon: MailIcon, desktopOnly: true },
];

export default function BottomNav({ variant = "admin" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isAdmin = variant === "admin";
  const berandaHref = isAdmin ? "/admin/beranda" : "/ortu";
  const profilHref = isAdmin ? "/admin/profil" : "/ortu/profil";
  const radialItems = isAdmin ? MONEV_ITEMS : ORTU_ITEMS;

  const berandaActive = isAdmin
    ? BERANDA_ROUTES.admin.some((p) => pathname.startsWith(p))
    : pathname === "/ortu";
  const profilActive = pathname.startsWith(profilHref);
  const radialActive = radialItems.some(
    (i) => !i.desktopOnly && pathname.startsWith(i.href)
  );

  return (
    <div className="mnav-wrap">
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="mnav-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      <nav className="mnav">
        <Link
          href={berandaHref}
          className={`mnav-item ${berandaActive ? "active" : ""}`}
        >
          <HomeIcon />
          <span>Beranda</span>
        </Link>

        <span className="mnav-label">
          {isAdmin ? "MONEV POSYANDU" : "SIP-ANAK"}
        </span>

        <Link
          href={profilHref}
          className={`mnav-item ${profilActive ? "active" : ""}`}
        >
          <UserIcon />
          <span>Profil</span>
        </Link>
      </nav>

      <div
        className={`mnav-radial ${open ? "open" : ""} ${
          isAdmin ? "mnav-radial--6" : "mnav-radial--4"
        }`}
      >
        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className={`mnav-fab ${open ? "open" : ""} ${radialActive ? "mnav-fab--active" : ""}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="bar h" />
          <span className="bar v" />
        </button>
        {radialItems.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mnav-menu-item mi-${i + 1} ${
              item.desktopOnly ? "mnav-menu-item--md" : ""
            }`}
            tabIndex={open ? 0 : -1}
          >
            <item.Icon />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
