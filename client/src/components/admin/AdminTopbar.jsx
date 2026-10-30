import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, KeyRound, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_LABEL = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", EDITOR: "Editor" };

// Topbar: pencarian (dekoratif), notifikasi, dropdown profil
export default function AdminTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "A";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
      {/* Tombol drawer mobile */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Buka menu"
        className="rounded-xl border border-border bg-white p-2.5 text-text transition hover:bg-primary-soft lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Kotak pencarian */}
      <div className="relative w-full max-w-md">
        <input
          type="search"
          placeholder="Cari proyek, artikel, pesan…"
          aria-label="Pencarian"
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-4 pr-10 text-sm text-text placeholder:text-text-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <Search size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {/* Notifikasi + profil */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-xl border border-border bg-white p-2.5 text-text transition hover:bg-primary-soft"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" aria-hidden />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-3 transition hover:bg-primary-soft"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-text">{user?.name}</span>
              <span className="block text-xs leading-tight text-text-muted">{ROLE_LABEL[user?.role] ?? user?.role}</span>
            </span>
            <ChevronDown size={16} className={`text-text-muted transition ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-panel-in absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-soft-lg"
            >
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-text">{user?.name}</p>
                <p className="text-xs text-text-muted">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {ROLE_LABEL[user?.role] ?? user?.role}
                </span>
              </div>
              <Link
                to="/admin/akun"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text transition hover:bg-primary-soft"
              >
                <KeyRound size={15} />
                Ubah Password
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft"
              >
                <LogOut size={15} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
