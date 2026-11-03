// Pustaka media bersama untuk ImagePicker dan halaman Media.
import { useEffect, useMemo, useState } from "react";
import { Check, ImagePlus, RefreshCw, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import ImageWithFallback from "../ui/ImageWithFallback.jsx";
import Modal from "../ui/Modal.jsx";
import Pagination from "../ui/Pagination.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { toast } from "../ui/Toast.jsx";

const fmtSize = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes ?? 0) / 1024))} KB`);
const canDeleteRole = (role) => role === "SUPER_ADMIN" || role === "ADMIN";

function UsageList({ usages = [] }) {
  if (usages.length === 0) return <p className="text-sm text-text-muted">Tidak ada pemakaian yang ditemukan.</p>;
  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
      {usages.map((usage, index) => (
        <li key={`${usage.recordId}-${usage.field}-${index}`} className="flex items-start justify-between gap-3 rounded-xl bg-surface px-3 py-2">
          <div className="min-w-0">
            <p className="font-semibold text-text">{usage.module}: {usage.label}</p>
            <p className="text-xs text-text-muted">Kolom: {usage.field}</p>
          </div>
          <a href={usage.editUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-primary underline">Buka</a>
        </li>
      ))}
    </ul>
  );
}

function MediaCard({ media, selected, selecting, canDelete, onSelect, onDelete, onToggle, onImageError }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border-2 bg-white transition ${selected ? "border-primary" : "border-border hover:border-primary/40"}`}>
      <button type="button" onClick={() => onSelect(media)} className="block aspect-square w-full text-left" aria-label={`Pilih ${media.filename}`} aria-pressed={selecting ? selected : undefined}>
        <ImageWithFallback src={media.url} alt={media.filename} loading="lazy" className="h-full w-full object-cover" onError={() => onImageError(media.id)} />
        {selecting && (
          <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-md border border-white bg-white/90 text-primary shadow-sm">
            {selected && <Check size={14} strokeWidth={3} />}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1 bg-black/60 px-2 py-1.5 text-[10px] text-white">
          {media.isBroken && <span className="rounded bg-danger px-1.5 py-0.5 font-bold">Rusak</span>}
          {media.inUse && <span className="rounded bg-primary px-1.5 py-0.5 font-bold" title={`${media.usageCount} pemakaian`}>Dipakai ({media.usageCount})</span>}
          <span className="min-w-0 flex-1 truncate">{media.filename} · {fmtSize(media.size)}</span>
        </div>
      </button>
      {canDelete && (
        <button
          type="button"
          aria-label="Hapus gambar"
          title="Hapus gambar"
          onClick={(event) => { event.stopPropagation(); onDelete(media); }}
          className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white opacity-100 transition hover:bg-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function MediaLibrary({ open = true, selected = [], onSelect, onDeleted, showDetails = false, showCleanup = false }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canDelete = canDeleteRole(user?.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [detail, setDetail] = useState(null);
  const [failedIds, setFailedIds] = useState(() => new Set());
  const [cleanupPreview, setCleanupPreview] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["media", { page, search }],
    queryFn: async () => (await api.get("/media", { params: { page, limit: 12, search: search || undefined } })).data,
    enabled: open,
    placeholderData: (previous) => previous,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.includes(row.id)), [rows, selectedIds]);

  useEffect(() => {
    if (!isLoading && rows.length === 0 && page > 1 && meta?.totalPages && page > meta.totalPages) setPage(meta.totalPages);
  }, [isLoading, meta?.totalPages, page, rows.length]);

  const invalidateMedia = () => queryClient.invalidateQueries({ queryKey: ["media"] });
  const removeFromForm = (deletedRows) => {
    const deletedUrls = new Set(deletedRows.map((row) => row.url));
    const selectedUrls = selected.filter((value) => typeof value === "string" ? value : value?.url);
    if (selectedUrls.some((value) => deletedUrls.has(value))) onDeleted?.(deletedRows);
  };

  const deleteMutation = useMutation({
    mutationFn: (media) => api.delete(`/media/${media.id}`),
    onSuccess: (response, media) => {
      invalidateMedia();
      setDeleting(null);
      setSelectedIds((ids) => ids.filter((id) => id !== media.id));
      removeFromForm([media]);
      toast.success("Gambar berhasil dihapus");
    },
    onError: (error) => {
      if (error.response?.status === 409) setBlocked({ filename: deleting?.filename, usages: error.response.data.errors ?? [] });
      else toast.error(error.response?.data?.message ?? "Gagal menghapus gambar");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (ids) => api.post("/media/bulk-delete", { ids }),
    onSuccess: (response) => {
      const result = response.data.data;
      const deletedRows = selectedRows.filter((row) => result.deleted.some((item) => item.id === row.id));
      invalidateMedia();
      removeFromForm(deletedRows);
      setSelectedIds([]);
      setSelecting(false);
      if (result.skipped.length || result.failed.length) setCleanupResult(result);
      toast.info(`${result.deleted.length} dihapus, ${result.skipped.length} dilewati karena masih dipakai`);
    },
    onError: (error) => toast.error(error.response?.data?.message ?? "Gagal menghapus gambar terpilih"),
  });

  const brokenQuery = useMutation({
    mutationFn: () => api.get("/media/broken"),
    onSuccess: (response) => setCleanupPreview(response.data.data),
    onError: () => toast.error("Gagal memuat daftar gambar rusak"),
  });
  const cleanupMutation = useMutation({
    mutationFn: () => api.post("/media/cleanup-broken", { dryRun: false }),
    onSuccess: (response) => {
      const result = response.data.data;
      invalidateMedia();
      setCleanupPreview(null);
      setCleanupResult(result);
      toast.success(`${result.deleted.length} gambar rusak dibersihkan`);
    },
    onError: (error) => toast.error(error.response?.data?.message ?? "Gagal membersihkan gambar rusak"),
  });

  const handleSelect = (media) => {
    if (selecting) {
      setSelectedIds((ids) => ids.includes(media.id) ? ids.filter((id) => id !== media.id) : [...ids, media.id]);
      return;
    }
    if (onSelect) onSelect(media);
    else setDetail(media);
  };
  const selectedUrls = selected.map((value) => typeof value === "string" ? value : value?.url);
  const allPageSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={selecting ? "primary" : "outline"} onClick={() => { setSelecting((value) => !value); setSelectedIds([]); }}>
          {selecting ? "Selesai memilih" : "Pilih beberapa"}
        </Button>
        {selecting && (
          <>
            <span className="text-sm font-semibold text-text">{selectedIds.length} dipilih</span>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(allPageSelected ? [] : rows.map((row) => row.id))}>
              {allPageSelected ? "Batal pilih halaman" : "Pilih semua di halaman ini"}
            </Button>
            <Button size="sm" variant="danger" disabled={selectedIds.length === 0} onClick={() => setDeleting({ bulk: true, count: selectedIds.length })}>
              <Trash2 size={14} /> Hapus terpilih
            </Button>
          </>
        )}
        {showCleanup && user?.role === "SUPER_ADMIN" && (
          <Button size="sm" variant="outline" onClick={() => brokenQuery.mutate()} loading={brokenQuery.isPending}>
            <RefreshCw size={14} /> Bersihkan gambar rusak
          </Button>
        )}
        <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama file…" aria-label="Cari media" className="ml-auto w-48 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft p-8 text-center">
          <p className="text-sm text-danger">Gagal memuat pustaka media.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{[...Array(6)].map((_, index) => <Skeleton key={index} className="h-32" rounded="rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ImagePlus} title="Pustaka kosong" description="Unggah gambar lewat area unggah di atas." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {rows.map((media) => (
              <MediaCard
                key={media.id}
                media={{ ...media, isBroken: media.isBroken || failedIds.has(media.id) }}
                selected={selecting ? selectedIds.includes(media.id) : selectedUrls.includes(media.url)}
                selecting={selecting}
                canDelete={canDelete}
                onSelect={handleSelect}
                onDelete={setDeleting}
                onToggle={handleSelect}
                onImageError={(id) => setFailedIds((ids) => new Set(ids).add(id))}
              />
            ))}
          </div>
          {meta && meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
        </>
      )}

      {deleting && !deleting.bulk && (
        <ConfirmDialog
          open
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting)}
          loading={deleteMutation.isPending}
          title="Hapus gambar"
          message="Hapus gambar ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        >
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface p-3">
            <ImageWithFallback src={deleting.url} alt={deleting.filename} className="h-16 w-20 rounded-lg object-cover" />
            <p className="truncate text-sm font-semibold text-text">{deleting.filename}</p>
          </div>
        </ConfirmDialog>
      )}
      {deleting?.bulk && (
        <ConfirmDialog open onClose={() => setDeleting(null)} onConfirm={() => { setDeleting(null); bulkMutation.mutate(selectedIds); }} loading={bulkMutation.isPending} title="Hapus gambar terpilih" message={`Hapus ${deleting.count} gambar secara permanen? Tindakan ini tidak dapat dibatalkan.`} />
      )}

      <Modal open={!!blocked} onClose={() => setBlocked(null)} title="Gambar masih dipakai" size="md">
        <p className="mb-4 text-sm text-text">Ganti gambar di tempat tersebut lebih dulu, lalu hapus.</p>
        <UsageList usages={blocked?.usages} />
      </Modal>

      {showDetails && detail && (
        <MediaDetail media={detail} onClose={() => setDetail(null)} />
      )}

      <Modal open={!!cleanupPreview} onClose={() => setCleanupPreview(null)} title="Bersihkan gambar rusak" size="lg" footer={<><Button variant="outline" onClick={() => setCleanupPreview(null)}>Batal</Button><Button variant="danger" loading={cleanupMutation.isPending} disabled={!cleanupPreview?.candidates?.length} onClick={() => cleanupMutation.mutate()}>Bersihkan</Button></>}>
        <p className="mb-3 text-sm text-text">Pratinjau gambar rusak yang dapat dibersihkan.</p>
        <p className="mb-2 text-sm font-semibold text-text">Akan dihapus ({cleanupPreview?.candidates?.length ?? 0})</p>
        <ul className="mb-4 max-h-32 space-y-1 overflow-y-auto text-sm text-text-muted">{(cleanupPreview?.candidates ?? []).map((media) => <li key={media.id}>{media.filename}</li>)}</ul>
        <p className="mb-2 text-sm font-semibold text-text">Dilewati karena dipakai ({cleanupPreview?.skipped?.length ?? 0})</p>
        <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-text-muted">{(cleanupPreview?.skipped ?? []).map((media) => <li key={media.id}>{media.filename}</li>)}</ul>
      </Modal>

      <Modal open={!!cleanupResult} onClose={() => setCleanupResult(null)} title="Hasil penghapusan" size="md">
        <p className="mb-3 text-sm text-text">{cleanupResult?.deleted?.length ?? 0} dihapus, {cleanupResult?.skipped?.length ?? 0} dilewati karena masih dipakai.</p>
        {cleanupResult?.skipped?.length > 0 && <UsageList usages={cleanupResult.skipped.flatMap((item) => item.usages ?? [])} />}
        {cleanupResult?.failed?.length > 0 && <p className="mt-3 text-sm text-danger">{cleanupResult.failed.length} gambar gagal dihapus.</p>}
      </Modal>
    </>
  );
}

function MediaDetail({ media, onClose }) {
  const { data, isLoading } = useQuery({ queryKey: ["media-usage", media.id], queryFn: async () => (await api.get(`/media/${media.id}/usage`)).data.data });
  return (
    <Modal open onClose={onClose} title="Detail Media" size="md">
      <div className="space-y-4">
        <ImageWithFallback src={media.url} alt={media.filename} className="max-h-64 w-full rounded-xl object-contain" />
        <p className="truncate text-sm font-semibold text-text">{media.filename}</p>
        <p className="text-sm text-text-muted">Ukuran: {fmtSize(media.size)} · {media.isBroken ? media.brokenReason : "File tersedia"}</p>
        <h3 className="text-sm font-semibold text-text">Pemakaian gambar ({data?.count ?? media.usageCount ?? 0})</h3>
        {isLoading ? <Skeleton className="h-20" rounded="rounded-xl" /> : <UsageList usages={data?.usages} />}
      </div>
    </Modal>
  );
}
