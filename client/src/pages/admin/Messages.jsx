// Pesan — dua panel: daftar kiri + detail kanan; balas via mailto/WhatsApp, hapus
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Mail, MessageCircle, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";

// Nomor WA dari pengaturan situs, fallback admin? sederhana: param env via settings query
function useSiteWhatsApp() {
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/public/settings")).data.data,
    staleTime: 10 * 60 * 1000,
  });
  return data?.company_whatsapp ?? "";
}

const fmtDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":");

export default function Messages() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", { page, unreadOnly }],
    queryFn: async () => (await api.get("/admin/messages", { params: { page, limit: 15, unread: unreadOnly ? "true" : undefined } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  // Detail — GET otomatis menandai dibaca (badge & daftar di-refresh oleh select())
  const { data: selected } = useQuery({
    queryKey: ["message", selectedId],
    queryFn: async () => (await api.get(`/admin/messages/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const wa = useSiteWhatsApp();

  const readMutation = useMutation({
    mutationFn: ({ id, isRead }) => api.patch(`/admin/messages/${id}/read`, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["message"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("Pesan berhasil dihapus");
      setDeleting(null);
      setSelectedId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus pesan");
      setDeleting(null);
    },
  });

  const select = (id) => {
    setSelectedId(id);
    // refresh badge setelah auto-read
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    }, 300);
  };

  // Balas via email / WhatsApp
  const mailto = selected ? `mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}&body=${encodeURIComponent(`Halo ${selected.name},\n\nTerima kasih telah menghubungi Jaya Abadi.\n\n`)}` : "";
  const waNumber = (selected?.phone ?? "").replace(/\D/g, "").replace(/^0/, "62");
  const waLink = selected ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo ${selected.name}, terima kasih telah menghubungi Jaya Abadi.`)}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Pesan</h1>
        <Switch label="Hanya belum dibaca" checked={unreadOnly} onChange={(v) => { setUnreadOnly(v); setPage(1); }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Panel kiri: daftar */}
        <Card bodyClassName="!px-0 !py-0 lg:col-span-2">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Inbox} title="Tidak ada pesan" description={unreadOnly ? "Semua pesan sudah dibaca." : "Pesan dari form kontak tampil di sini."} />
          ) : (
            <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
              {rows.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => select(m.id)}
                    aria-current={m.id === selectedId ? "true" : undefined}
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition ${m.id === selectedId ? "bg-primary-soft" : "hover:bg-surface/60"} ${m.isRead ? "" : "border-l-2 border-primary"}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${m.isRead ? "font-medium text-text" : "font-bold text-text"}`}>{m.name}</p>
                      <span className="shrink-0 text-[10px] text-text-muted">{fmtTime(m.createdAt)}</span>
                    </div>
                    <p className="truncate text-xs text-text-muted">{m.subject}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border p-3">
            {meta && meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
          </div>
        </Card>

        {/* Panel kanan: detail */}
        <Card className="lg:col-span-3" bodyClassName="min-h-[24rem]">
          {!selected ? (
            <EmptyState icon={Mail} title="Pilih pesan" description="Klik pesan di kiri untuk melihat detail lengkap." />
          ) : (
            <article className="space-y-4">
              <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text">{selected.subject}</h2>
                  <p className="text-sm text-text">
                    {selected.name} · <a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a>
                    {selected.phone && <> · {selected.phone}</>}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {fmtDate(selected.createdAt)} {fmtTime(selected.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.isRead ? <Badge variant="neutral">Sudah dibaca</Badge> : <Badge variant="warning">Belum dibaca</Badge>}
                  <button
                    type="button"
                    onClick={() => setDeleting(selected)}
                    aria-label="Hapus pesan"
                    className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </header>

              <p className="whitespace-pre-line text-sm leading-relaxed text-text">{selected.body}</p>

              <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
                <a href={mailto} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark">
                  <Mail size={14} /> Balas via Email
                </a>
                <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-xs font-semibold text-white transition hover:bg-success/90">
                  <MessageCircle size={14} /> Balas via WhatsApp
                </a>
                <Switch
                  label="Tandai belum dibaca"
                  checked={!selected.isRead}
                  onChange={(v) => readMutation.mutate({ id: selected.id, isRead: !v })}
                />
              </footer>
            </article>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus pesan?"
        message={`Pesan dari "${deleting?.name}" akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
