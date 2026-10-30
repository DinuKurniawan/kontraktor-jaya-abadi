// Halaman Dashboard admin — statistik ringkas dari GET /api/admin/dashboard
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, Newspaper, UserRound } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Warna per status proyek (konsisten donut & rincian kartu)
const STATUS = [
  { key: "PLANNING", label: "Perencanaan", color: "#E9A23B", soft: "bg-warning-soft text-warning" },
  { key: "ONGOING", label: "Berjalan", color: "#4361D8", soft: "bg-primary-soft text-primary" },
  { key: "COMPLETED", label: "Selesai", color: "#22C55E", soft: "bg-success-soft text-success" },
];

// Waktu & tanggal berjalan (jam:menit:detik)
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Donut SVG sederhana: kumpulan lingkaran stroke-dasharray
function Donut({ segments, total }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EEF1FB" strokeWidth="16" />
        {segments.map(({ color, value }) => {
          if (value <= 0) return null;
          const len = (value / total) * C;
          const dash = `${len} ${C - len}`;
          const el = (
            <circle
              key={color}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-text">{total}</span>
        <span className="text-xs text-text-muted">Proyek</span>
      </div>
    </div>
  );
}

// Kartu statistik bernomor besar + bar mini rincian opsional
function StatCard({ icon: Icon, label, value, badge, accentClass, children }) {
  return (
    <Card className="flex-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-text">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon size={20} />
        </span>
      </div>
      {children}
      {badge}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const now = useClock();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/admin/dashboard")).data.data,
  });

  const projects = data?.projects;
  const messages = data?.latestMessages ?? [];

  const firstName = user?.name?.split(" ")[0] ?? "Admin";
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ":");

  // ===== Skeleton saat memuat =====
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" rounded="rounded-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="h-36 flex-1" rounded="rounded-2xl" />
          <Skeleton className="h-36 flex-1" rounded="rounded-2xl" />
          <Skeleton className="h-36 flex-1" rounded="rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" rounded="rounded-2xl" />
          <Skeleton className="h-64" rounded="rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner sapaan */}
      <div className="flex flex-col gap-2 rounded-2xl bg-primary px-6 py-6 text-white shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold sm:text-2xl">Selamat datang, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-white/75">Semangat mengelola proyek hari ini!</p>
        </div>
        <div className="text-sm text-white/80 sm:text-right">
          <p>{dateStr}</p>
          <p className="font-semibold tabular-nums">{timeStr} WIB</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Kolom kiri (span 2): kartu statistik + donut + progress */}
        <div className="space-y-6 xl:col-span-2">
          {/* 3 kartu statistik */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <StatCard
              icon={Building2}
              label="Total Proyek"
              value={projects.total}
              accentClass="bg-primary-soft text-primary"
              badge={<Badge variant="info">{projects.byStatus.COMPLETED} selesai</Badge>}
            >
              <ul className="mt-3 space-y-1.5 text-xs text-text-muted">
                {STATUS.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
                    <span className="flex-1">{s.label}</span>
                    <span className="font-semibold text-text">{projects.byStatus[s.key]}</span>
                  </li>
                ))}
              </ul>
            </StatCard>

            <StatCard
              icon={Mail}
              label="Pesan Masuk"
              value={data.messages.unread}
              accentClass="bg-warning-soft text-warning"
              badge={<Badge variant={data.messages.unread ? "warning" : "neutral"}>belum dibaca</Badge>}
            />

            <StatCard
              icon={Newspaper}
              label="Artikel Terbit"
              value={data.posts.published}
              accentClass="bg-success-soft text-success"
              badge={<Badge variant="success">published</Badge>}
            />
          </div>

          {/* Donut + progress bar sejajar */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Komposisi Status Proyek" headerVariant="primary">
              <div className="flex items-center gap-5">
                <Donut total={projects.total} segments={STATUS.map((s) => ({ color: s.color, value: projects.byStatus[s.key] }))} />
                <ul className="flex-1 space-y-2.5 text-sm">
                  {STATUS.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                      <span className="flex-1 text-text">{s.label}</span>
                      <span className="font-semibold text-text">{projects.byStatus[s.key]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card title="Proyek per Kategori" headerVariant="primary">
              {projects.byCategory.length === 0 ? (
                <EmptyState icon={Building2} title="Belum ada kategori proyek" />
              ) : (
                <ul className="space-y-3.5">
                  {projects.byCategory.map((c) => {
                    const pct = projects.total ? Math.round((c.count / projects.total) * 100) : 0;
                    return (
                      <li key={c.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-text">{c.name}</span>
                          <span className="font-semibold text-text">{c.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Panel kanan: profil + pesan terbaru */}
        <div className="space-y-6">
          <Card title="Profil Admin" headerVariant="primary" bodyClassName="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-lg font-semibold text-primary">
              {user?.name?.trim()?.[0]?.toUpperCase() ?? "A"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-text">{user?.name}</p>
              <p className="truncate text-sm text-text-muted">{user?.email}</p>
              <Badge variant="info" >
                {user?.role === "SUPER_ADMIN" ? "Super Admin" : user?.role === "ADMIN" ? "Admin" : "Editor"}
              </Badge>
            </div>
          </Card>

          <Card title="Pesan Terbaru" headerVariant="primary" bodyClassName="!px-2">
            {messages.length === 0 ? (
              <EmptyState icon={Mail} title="Belum ada pesan" description="Pesan dari form kontak akan muncul di sini." />
            ) : (
              <ul className="divide-y divide-border">
                {messages.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 px-3 py-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <UserRound size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-text">{m.name}</p>
                        {!m.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-label="Belum dibaca" />}
                      </div>
                      <p className="truncate text-sm text-text-muted">{m.subject}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ·{" "}
                        {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
