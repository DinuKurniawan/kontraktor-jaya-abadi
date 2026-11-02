import { useQuery } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../lib/axios.js";
import {
  Award,
  Banknote,
  Building2,
  CircleHelp,
  Columns2,
  FolderTree,
  Handshake,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  MapPin,
  MessageSquareQuote,
  Newspaper,
  Scale,
  Settings,
  Sparkles,
  Trophy,
  Tags as TagsIcon,
  UserCog,
  Users2,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

// Sidebar pesan badge hidup via query unread-count di komponen (di bawah)

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/proyek", label: "Proyek", icon: Building2 },
  { to: "/admin/layanan", label: "Layanan", icon: Wrench },
  { to: "/admin/kategori", label: "Kategori", icon: FolderTree },
  { to: "/admin/posts", label: "Artikel", icon: Newspaper },
  { to: "/admin/tags", label: "Tag Artikel", icon: TagsIcon },
  { to: "/admin/testimoni", label: "Testimoni", icon: MessageSquareQuote },
  { to: "/admin/tim", label: "Tim", icon: Users2 },
  { to: "/admin/pesan", label: "Pesan", icon: Mail, unread: true },
  { to: "/admin/branches", label: "Cabang", icon: MapPin },
  { to: "/admin/subscribers", label: "Pelanggan", icon: Users2, unread: false },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  // Grup "Konten Beranda"
  { to: "/admin/hero-slider", label: "Hero Slider", icon: Images, group: "Konten Beranda" },
  { to: "/admin/partners", label: "Mitra", icon: Handshake, group: "Konten Beranda" },
  { to: "/admin/certificates", label: "Sertifikat", icon: Award, group: "Konten Beranda" },
  { to: "/admin/features", label: "Keunggulan", icon: Sparkles, group: "Konten Beranda" },
  { to: "/admin/process-steps", label: "Alur Kerja", icon: ListOrdered, group: "Konten Beranda" },
  { to: "/admin/before-after", label: "Before / After", icon: Columns2, group: "Konten Beranda" },
  { to: "/admin/estimate-prices", label: "Harga Estimasi", icon: Banknote, group: "Konten Beranda" },
  { to: "/admin/faqs", label: "FAQ", icon: CircleHelp, group: "Konten Beranda" },
  // Grup "Halaman Tentang"
  { to: "/admin/milestones", label: "Milestone", icon: Trophy, group: "Halaman Tentang" },
  { to: "/admin/core-values", label: "Nilai Perusahaan", icon: Scale, group: "Halaman Tentang" },
  { to: "/admin/gallery", label: "Galeri", icon: Images, group: "Halaman Tentang" },
  { to: "/admin/pengaturan", label: "Pengaturan Situs", icon: Settings },
  { to: "/admin/pengguna", label: "Pengguna", icon: UserCog, roles: ["SUPER_ADMIN"] },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? "bg-white text-primary shadow-soft" : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;

// Sidebar biru vertikal (referensi) — drawer di layar kecil
export default function AdminSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Jumlah pesan berstatus BARU — badge hidup, di-refresh tiap 30 detik
  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => (await api.get("/admin/messages/unread-count")).data.data,
    refetchInterval: 30 * 1000,
  });
  const unread = unreadData?.count ?? 0;

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      {/* Backdrop untuk drawer mobile */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-64 flex-col rounded-2xl bg-primary text-white shadow-soft-lg transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-[110%]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-start justify-between px-5 pb-4 pt-5">
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Jaya Abadi</p>
            <p className="text-xs text-white/60">CMS Admin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu — item dengan prop `group` dirangkum jadi satu sub-header per grup */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {items.map(({ to, label, icon: Icon, end, unread: showUnread, group }, i) => (
            <div key={to}>
              {group && items[i - 1]?.group !== group && (
                <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-white/50">{group}</p>
              )}
              <NavLink to={to} end={end} className={linkClass} onClick={onClose}>
                <Icon size={18} className="shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {showUnread && unread > 0 && (
                  <span className="rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Keluar */}
        <div className="border-t border-white/15 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
