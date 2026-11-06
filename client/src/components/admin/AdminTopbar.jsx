import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronDown, KeyRound, LogOut, Mail, Menu, MessageSquare, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";

const ROLE_LABEL = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", EDITOR: "Editor" };

// Topbar: pencarian (dekoratif), notifikasi dropdown, dropdown profil
export default function AdminTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Ambil jumlah unread & pesan terbaru untuk dropdown notifikasi
  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => (await api.get("/admin/messages/unread-count")).data.data,
  });

  const { data: latestMessages } = useQuery({
    queryKey: ["messages", { limit: 5 }],
    queryFn: async () => (await api.get("/admin/messages", { params: { limit: 5 } })).data.data,
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = Array.isArray(latestMessages) ? latestMessages : latestMessages?.items ?? [];

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!menuOpen && !notifOpen) return undefined;
    const onClick = (e) => {
      if (menuOpen && !menuRef.current?.contains(e.target)) setMenuOpen(false);
      if (notifOpen && !notifRef.current?.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, notifOpen]);

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
        {/* Dropdown Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Notifikasi"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            className={`relative rounded-xl border border-border bg-white p-2.5 text-text transition hover:bg-primary-soft ${
              notifOpen ? "border-primary text-primary" : ""
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="animate-panel-in absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border bg-white shadow-soft-lg"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-semibold text-text">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <Link
                  to="/admin/pesan"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-text-muted">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                    Belum ada pesan masuk
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to="/admin/pesan"
                      onClick={() => setNotifOpen(false)}
                      className={`block px-4 py-3 transition hover:bg-surface ${
                        !n.isRead ? "bg-primary-soft/30" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
                          )}
                          <span className="truncate text-xs font-semibold text-text">
                            {n.name}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-text-muted whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-text-muted">
                        {n.subject}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-text/80">
                        {n.body}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1">
                        {n.isRead ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                            <CheckCheck size={11} /> Dibaca
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
                            <Mail size={11} /> Baru
                          </span>
                        )}
                        {n.status && n.status !== "BARU" && (
                          <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                            {n.status}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="border-t border-border bg-surface/50 p-2 text-center">
                <Link
                  to="/admin/pesan"
                  onClick={() => setNotifOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:underline"
                >
                  <Mail size={13} />
                  Buka Kotak Masuk Pesan
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profil Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
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
