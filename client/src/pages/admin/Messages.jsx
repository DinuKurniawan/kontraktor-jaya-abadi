// Admin pesan — filter lengkap, status cepat, detail lampiran, catatan, WhatsApp, dan CSV.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileText, Inbox, Mail, MessageCircle, Paperclip, Search, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const STATUSES = { BARU: "BARU", DIPROSES: "DIPROSES", SELESAI: "SELESAI", SPAM: "SPAM" };
const STATUS_VARIANT = { BARU: "warning", DIPROSES: "info", SELESAI: "success", SPAM: "danger" };
const BUDGETS = { KURANG_100JT: "Kurang dari 100 juta", "100_500JT": "100–500 juta", "500JT_1M": "500 juta–1 M", "1M_5M": "1–5 M", LEBIH_5M: "Lebih dari 5 M", BELUM_TAHU: "Belum tahu" };
const CONTACT_LABEL = { WHATSAPP: "WhatsApp", TELEPON: "Telepon", EMAIL: "Email" };
const TIME_LABEL = { PAGI: "Pagi", SIANG: "Siang", SORE: "Sore", BEBAS: "Bebas" };
const fmtDate = (date) => date ? new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (date) => date ? `${fmtDate(date)} ${new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":")}` : "—";
const attachmentUrl = (url) => url?.startsWith("http") ? url : `${SERVER}${url}`;
const isImage = (url) => /\.(jpe?g|png|webp|gif|avif|bmp|tiff?|svg)$/i.test(url ?? "");

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}

export default function Messages() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteReadyId, setNoteReadyId] = useState(null);
  const debouncedSearch = useDebounced(search);
  const filters = { search: debouncedSearch || undefined, status: status || (unreadOnly ? "BARU" : undefined), serviceId: serviceId || undefined, budgetRange: budgetRange || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };

  useEffect(() => setPage(1), [debouncedSearch, status, serviceId, budgetRange, dateFrom, dateTo, unreadOnly]);
  const { data, isLoading } = useQuery({ queryKey: ["messages", { page, ...filters }], queryFn: async () => (await api.get("/admin/messages", { params: { page, limit: 15, ...filters } })).data });
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const { data: selected } = useQuery({ queryKey: ["message", selectedId], queryFn: async () => (await api.get(`/admin/messages/${selectedId}`)).data.data, enabled: !!selectedId });
  const { data: services } = useQuery({ queryKey: ["admin-services-message-filter"], queryFn: async () => (await api.get("/admin/services", { params: { limit: 50 } })).data.data });

  useEffect(() => { if (selected) { setNoteDraft(selected.adminNote ?? ""); setNoteReadyId(selected.id); } }, [selected?.id]);
  useEffect(() => {
    if (!selected || noteReadyId !== selected.id || noteDraft === (selected.adminNote ?? "")) return undefined;
    const timer = setTimeout(() => adminUpdateMutation.mutate({ id: selected.id, adminNote: noteDraft }), 700);
    return () => clearTimeout(timer);
  }, [noteDraft, noteReadyId, selected?.id]);

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["messages"] }); queryClient.invalidateQueries({ queryKey: ["message"] }); queryClient.invalidateQueries({ queryKey: ["unread-count"] }); };
  const adminUpdateMutation = useMutation({ mutationFn: ({ id, ...payload }) => api.patch(`/admin/messages/${id}`, payload), onSuccess: invalidate, onError: (error) => toast.error(error.response?.data?.message ?? "Gagal menyimpan perubahan") });
  const readMutation = useMutation({ mutationFn: ({ id, isRead }) => api.patch(`/admin/messages/${id}/read`, { isRead }), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id) => api.delete(`/admin/messages/${id}`), onSuccess: () => { invalidate(); toast.success("Pesan berhasil dihapus"); setDeleting(null); setSelectedId(null); }, onError: (error) => { toast.error(error.response?.data?.message ?? "Gagal menghapus pesan"); setDeleting(null); } });

  const select = (id) => { setSelectedId(id); setTimeout(() => { queryClient.invalidateQueries({ queryKey: ["messages"] }); queryClient.invalidateQueries({ queryKey: ["unread-count"] }); }, 300); };
  const updateStatus = (id, nextStatus) => adminUpdateMutation.mutate({ id, status: nextStatus });
  const resetFilters = () => { setSearch(""); setStatus(""); setServiceId(""); setBudgetRange(""); setDateFrom(""); setDateTo(""); setUnreadOnly(false); };
  const exportCsv = async () => {
    try {
      const response = await api.get("/admin/messages/export", { params: filters, responseType: "blob" });
      const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = "pesan-jaya-abadi.csv"; link.click(); URL.revokeObjectURL(url);
    } catch (error) { toast.error(error.response?.data?.message ?? "Gagal mengekspor CSV"); }
  };

  const waNumber = (selected?.phone ?? "").replace(/\D/g, "").replace(/^0/, "62");
  const waText = selected ? `Halo ${selected.name},\n\nTerima kasih telah menghubungi Jaya Abadi. Kami sedang menindaklanjuti permintaan Anda.\n\nNomor tiket: ${selected.ticketCode}\n\nTim kami akan menghubungi Anda kembali.` : "";
  const waLink = selected ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : "";
  const mailto = selected ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject} [${selected.ticketCode}]`)}&body=${encodeURIComponent(waText)}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-xl font-semibold text-text">Pesan</h1><p className="mt-1 text-sm text-text-muted">Kelola konsultasi masuk dan tindak lanjut pelanggan.</p></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={exportCsv}><Download size={14} /> Ekspor CSV</Button><Switch label="Hanya BARU" checked={unreadOnly} onChange={(value) => setUnreadOnly(value)} /></div></div>

      <Card bodyClassName="!py-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, tiket, subjek…" aria-label="Cari pesan" className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" /></div><Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status"><option value="">Semua status</option>{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select value={serviceId} onChange={(event) => setServiceId(event.target.value)} aria-label="Filter layanan"><option value="">Semua layanan</option>{(services ?? []).map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</Select><Select value={budgetRange} onChange={(event) => setBudgetRange(event.target.value)} aria-label="Filter anggaran"><option value="">Semua anggaran</option>{Object.entries(BUDGETS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><label className="text-xs font-medium text-text-muted">Dari<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary" /></label><label className="text-xs font-medium text-text-muted">Sampai<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary" /></label><div className="flex items-end"><button type="button" onClick={resetFilters} className="text-xs font-semibold text-text-muted underline hover:text-primary">Reset filter</button></div></div></Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card bodyClassName="!px-0 !py-0 lg:col-span-2">
          {isLoading ? <div className="space-y-2 p-4">{[...Array(6)].map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : rows.length === 0 ? <EmptyState icon={Inbox} title="Tidak ada pesan" description="Sesuaikan filter atau tunggu pesan baru dari form kontak." /> : <ul className="max-h-[38rem] divide-y divide-border overflow-y-auto">{rows.map((message) => <li key={message.id}><button type="button" onClick={() => select(message.id)} aria-current={message.id === selectedId ? "true" : undefined} className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${message.id === selectedId ? "bg-primary-soft" : "hover:bg-surface/60"} ${message.status === "BARU" ? "border-l-2 border-warning" : ""}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className={`truncate text-sm ${message.status === "BARU" ? "font-bold" : "font-medium"} text-text`}>{message.name}</p><p className="truncate text-[11px] text-text-muted">{message.ticketCode}</p></div><Badge variant={STATUS_VARIANT[message.status]}>{message.status}</Badge></div><p className="truncate text-xs text-text-muted">{message.subject}</p><div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] text-text-muted">{message.service?.title ?? "Umum"} · {fmtDate(message.createdAt)}</span><select value={message.status} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStatus(message.id, event.target.value)} aria-label={`Ubah status ${message.ticketCode}`} className="rounded-lg border border-border bg-white px-1.5 py-1 text-[10px] font-semibold text-text outline-none focus:border-primary">{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></button></li>)}</ul>}
          {meta && meta.totalPages > 1 && <div className="border-t border-border p-3"><Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} /></div>}
        </Card>

        <Card className="lg:col-span-3" bodyClassName="min-h-[28rem]">
          {!selected ? <EmptyState icon={Mail} title="Pilih pesan" description="Klik pesan di kiri untuk melihat detail lengkap." /> : <article className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-semibold text-text">{selected.subject}</h2><Badge variant={STATUS_VARIANT[selected.status]}>{selected.status}</Badge></div><p className="mt-1 break-words text-sm text-text">{selected.name} · <a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email || "—"}</a>{selected.phone && <> · {selected.phone}</>}</p><p className="mt-1 text-xs text-text-muted">{selected.ticketCode} · {fmtDateTime(selected.createdAt)}</p></div><div className="flex items-center gap-2"><select value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value)} aria-label="Status pesan" className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text outline-none focus:border-primary">{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => setDeleting(selected)} aria-label="Hapus pesan" className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={16} /></button></div></header>

            <div className="grid gap-3 rounded-xl bg-surface/60 p-4 text-sm sm:grid-cols-2"><Info label="Layanan" value={selected.service?.title ?? "Umum"} /><Info label="Anggaran" value={BUDGETS[selected.budgetRange] ?? "—"} /><Info label="Lokasi proyek" value={selected.projectLocation ?? "—"} /><Info label="Luas proyek" value={selected.projectArea ? `${selected.projectArea.toLocaleString("id-ID")} m²` : "—"} /><Info label="Kontak pilihan" value={CONTACT_LABEL[selected.preferredContact] ?? selected.preferredContact} /><Info label="Waktu pilihan" value={TIME_LABEL[selected.preferredTime] ?? selected.preferredTime} /><Info label="Sumber" value={selected.source ?? "—"} /><Info label="Diperbarui" value={fmtDateTime(selected.updatedAt)} /></div>
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Pesan</p><p className="whitespace-pre-line text-sm leading-relaxed text-text">{selected.body}</p></div>
            <Attachments attachments={selected.attachments} />
            <div className="rounded-xl border border-warning/30 bg-warning-soft/30 p-4"><div className="flex items-center justify-between gap-2"><label htmlFor="admin-note" className="text-xs font-bold uppercase tracking-wide text-text-muted">Catatan internal admin</label><span className="text-[11px] text-text-muted">{adminUpdateMutation.isPending ? "Menyimpan…" : "Tersimpan otomatis"}</span></div><textarea id="admin-note" rows={3} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Tulis catatan tindak lanjut…" className="mt-2 w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text outline-none focus:border-primary" /></div>
            <footer className="flex flex-wrap gap-2 border-t border-border pt-4"><a href={mailto} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark"><Mail size={14} /> Balas via Email</a><a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-xs font-semibold text-white transition hover:bg-success/90"><MessageCircle size={14} /> Balas via WhatsApp</a><Switch label="Tandai belum dibaca" checked={!selected.isRead} onChange={(value) => readMutation.mutate({ id: selected.id, isRead: !value })} /></footer>
          </article>}
        </Card>
      </div>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus pesan?" message={`Pesan dari "${deleting?.name}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function Info({ label, value }) { return <div><p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p><p className="mt-0.5 break-words text-sm text-text">{value}</p></div>; }

function Attachments({ attachments }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;
  return <section><p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-muted"><Paperclip size={13} /> Lampiran ({attachments.length})</p><div className="grid gap-3 sm:grid-cols-3">{attachments.map((attachment) => <div key={attachment} className="overflow-hidden rounded-xl border border-border bg-surface"><a href={attachmentUrl(attachment)} target="_blank" rel="noreferrer" className="block">{isImage(attachment) ? <img src={attachmentUrl(attachment)} alt="Lampiran pesan" className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center text-primary"><FileText size={32} /></div>}</a><div className="flex items-center justify-between gap-2 border-t border-border bg-white px-2.5 py-2"><span className="truncate text-[11px] text-text-muted">{attachment.split("/").pop()}</span><a href={attachmentUrl(attachment)} download target="_blank" rel="noreferrer" aria-label="Unduh lampiran" className="rounded-lg p-1.5 text-text-muted hover:bg-primary-soft hover:text-primary"><Download size={14} /></a></div></div>)}</div></section>;
}
