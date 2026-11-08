// Layout website publik: navbar sticky (berubah saat scroll), footer dari settings,
// tombol WhatsApp melayang, scroll-to-top saat pindah route
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Clock, Mail, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";

// SVG sosial media sederhana (brand icons dihapus dari lucide-react)
const SOCIAL_PATHS = {
  Instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.5 5.5A1 1 0 1 1 16.5 6.5 1 1 0 0 1 17.5 5.5z",
  Facebook: "M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2A20 20 0 0 0 14.3 4c-2.4 0-4 1.5-4 4.2v2.6H7.6V14h2.7v8z",
  LinkedIn: "M4.98 3.5A2.5 2.5 0 1 1 2.5 6 2.5 2.5 0 0 1 4.98 3.5zM3 8.5h4V21H3zM9.5 8.5h3.8v1.7h.1a4.2 4.2 0 0 1 3.8-2.1c4 0 4.8 2.6 4.8 6.1V21h-4v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21h-4z",
  YouTube: "M21.6 7.2a2.6 2.6 0 0 0-1.8-1.9C18.2 5 12 5 12 5s-6.2 0-7.8.3a2.6 2.6 0 0 0-1.8 1.9A27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.9c1.6.3 7.8.3 7.8.3s6.2 0 7.8-.3a2.6 2.6 0 0 0 1.8-1.9A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3z",
};
function SocialIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d={SOCIAL_PATHS[name]} />
    </svg>
  );
}
import api from "../../lib/axios.js";
import PillButton from "./PillButton.jsx";
import Container from "./Container.jsx";

const MENU = [
  { to: "/", label: "Beranda" },
  { to: "/tentang", label: "Tentang" },
  { to: "/layanan", label: "Layanan" },
  { to: "/proyek", label: "Proyek" },
  { to: "/artikel", label: "Artikel" },
  { to: "/kontak", label: "Kontak" },
];

// Satu listener scroll untuk seluruh layout: dibatasi requestAnimationFrame supaya
// setState tidak memicu render (dan pembacaan layout) di tiap event scroll.
const scrollListeners = new Set();
let scrollTicking = false;
function onScrollFrame() {
  scrollTicking = false;
  const y = window.scrollY;
  scrollListeners.forEach((fn) => fn(y));
}
function subscribeScroll(fn) {
  scrollListeners.add(fn);
  if (scrollListeners.size === 1) window.addEventListener("scroll", onScrollTick, { passive: true });
  fn(window.scrollY); // sinkronkan kondisi awal (mis. kembali ke halaman yang sudah di-scroll)
  return () => {
    scrollListeners.delete(fn);
    if (scrollListeners.size === 0) window.removeEventListener("scroll", onScrollTick);
  };
}
function onScrollTick() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollFrame);
}

// Tombol kembali ke atas — muncul setelah scroll 600px, hormati reduced-motion
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => subscribeScroll((y) => setShow(y > 600)), []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}
      aria-label="Kembali ke atas"
      className="fixed bottom-20 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-soft-lg transition hover:bg-brand-dark md:bottom-6"
    >
      <ArrowUp size={18} />
    </button>
  );
}

// Ambil settings publik (kontak, sosmed) — dipakai footer & tombol WA
function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/public/settings")).data.data,
    staleTime: 10 * 60 * 1000,
  });
}

// Logo teks + kotak oranye sederhana
function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-jakarta text-lg font-extrabold text-white">
        J
      </span>
      <span className={`font-jakarta text-lg font-extrabold tracking-tight ${light ? "text-cream" : "text-ink"}`}>
        Jaya <span className={light ? "text-brand-light" : "text-brand"}>Abadi</span>
      </span>
    </Link>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Transparan di atas, putih shadow setelah scroll
  useEffect(() => subscribeScroll((y) => setScrolled(y > 24)), []);

  // Tutup drawer mobile saat pindah halaman
  useEffect(() => setOpen(false), [location.pathname]);

  const linkCls = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? "text-brand" : "text-ink hover:text-brand"
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || open ? "bg-cream/90 shadow-[0_6px_24px_rgba(28,25,23,0.06)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu utama">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.to === "/"} className={linkCls}>
              {m.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <PillButton variant="dark" to="/kontak" className="!px-5 !py-2.5">
            Hubungi Kami
          </PillButton>
        </div>

        {/* Hamburger mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="rounded-lg p-2 text-ink transition hover:bg-ink/5 lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {/* Drawer mobile */}
      {open && (
        <nav className="border-t border-ink/5 bg-cream px-5 pb-5 pt-2 lg:hidden" aria-label="Menu seluler">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.to === "/"} className={({ isActive }) =>
              `block rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-brand-soft text-brand-dark" : "text-ink"}`
            }>
              {m.label}
            </NavLink>
          ))}
          <PillButton variant="dark" to="/kontak" className="mt-3 w-full">
            Hubungi Kami
          </PillButton>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { data: s } = usePublicSettings();
  const socials = [
    ["Instagram", s?.social_instagram],
    ["Facebook", s?.social_facebook],
    ["LinkedIn", s?.social_linkedin],
    ["YouTube", s?.social_youtube],
  ].filter(([, url]) => url);

  return (
    <footer className="bg-ink text-cream/80">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            {s?.company_tagline ?? "Kontraktor terpercaya untuk bangunan berkualitas"} — jasa konstruksi,
            renovasi, dan desain dengan hasil rapi dan RAB transparan.
          </p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={name}
                  className="rounded-full bg-white/10 p-2.5 text-cream transition hover:bg-brand">
                  <SocialIcon name={name} />
                </a>
              ))}
            </div>
          )}
        </div>

        <nav aria-label="Perusahaan">
          <p className="mb-4 font-jakarta text-sm font-bold text-cream">Perusahaan</p>
          <ul className="space-y-2.5 text-sm">
            {MENU.map((m) => (
              <li key={m.to}>
                <Link to={m.to} className="transition hover:text-brand">{m.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Layanan">
          <p className="mb-4 font-jakarta text-sm font-bold text-cream">Layanan</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/layanan/konstruksi-bangunan" className="transition hover:text-brand">Konstruksi Bangunan</Link></li>
            <li><Link to="/layanan/renovasi" className="transition hover:text-brand">Renovasi</Link></li>
            <li><Link to="/layanan/desain-rab" className="transition hover:text-brand">Desain & RAB</Link></li>
            <li><Link to="/layanan/finishing" className="transition hover:text-brand">Finishing</Link></li>
          </ul>
          <p className="mb-4 mt-6 font-jakarta text-sm font-bold text-cream">Proyek Unggulan</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/proyek" className="transition hover:text-brand">Rumah Tinggal</Link></li>
            <li><Link to="/proyek" className="transition hover:text-brand">Gedung Komersial</Link></li>
          </ul>
        </nav>

        <div>
          <p className="mb-4 font-jakarta text-sm font-bold text-cream">Kontak</p>
          <ul className="space-y-3 text-sm">
            {s?.company_address && (
              <li className="flex gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
                {s.company_address}
              </li>
            )}
            {s?.company_phone && (
              <li className="flex gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0 text-brand" />
                <a href={`tel:${s.company_phone}`} className="transition hover:text-brand">{s.company_phone}</a>
              </li>
            )}
            {s?.company_email && (
              <li className="flex gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-brand" />
                <a href={`mailto:${s.company_email}`} className="transition hover:text-brand">{s.company_email}</a>
              </li>
            )}
            {s?.company_whatsapp && (
              <li className="flex gap-2.5">
                <MessageCircle size={15} className="mt-0.5 shrink-0 text-brand" />
                <a href={`https://wa.me/${s.company_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="transition hover:text-brand">
                  WhatsApp {s.company_whatsapp}
                </a>
              </li>
            )}
          </ul>
          {/* Jam kerja */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 flex items-center gap-2 font-jakarta text-sm font-bold text-cream"><Clock size={15} className="text-brand" /> Jam Kerja</p>
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between gap-3"><span>Senin – Jumat</span><span className="text-cream/60">{s?.work_hours_weekday ?? "08.00 – 17.00"}</span></li>
              <li className="flex justify-between gap-3"><span>Sabtu</span><span className="text-cream/60">{s?.work_hours_saturday ?? "08.00 – 14.00"}</span></li>
              <li className="flex justify-between gap-3"><span>Minggu / Libur</span><span className="text-cream/60">Tutup</span></li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Baris hak cipta gelap */}
      <div className="bg-black/40">
        <Container className="flex flex-col items-center justify-between gap-1.5 py-4 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {s?.company_name ?? "Jaya Abadi"}. Semua hak dilindungi.</p>
          <p>Dibangun dengan integritas sejak {new Date().getFullYear()}.</p>
        </Container>
      </div>
      {/* Kembali ke atas: muncul setelah scroll 600px */}
      <BackToTop />
    </footer>
  );
}

// Tombol WhatsApp melayang
function WhatsAppFab() {
  const { data: s } = usePublicSettings();
  if (!s?.company_whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${s.company_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Halo Jaya Abadi, saya ingin konsultasi proyek.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] transition hover:scale-105"
    >
      <MessageCircle size={24} />
    </a>
  );
}

// Scroll ke atas tiap pindah route
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-cream font-jakarta text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2.5 focus:font-bold focus:text-white focus:shadow-soft-lg"
      >
        Lewati ke konten utama
      </a>
      <ScrollToTop />
      <Navbar />
      {/* padding atas untuk navbar fixed */}
      <main id="main-content" tabIndex={-1} className="pt-16 outline-none sm:pt-20">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
