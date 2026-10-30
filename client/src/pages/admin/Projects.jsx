// Halaman daftar proyek — DataTable + filter + search + paginasi + aksi
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
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

export const STATUS_LABEL = { PLANNING: "Perencanaan", ONGOING: "Berjalan", COMPLETED: "Selesai" };
export const STATUS_VARIANT = { PLANNING: "warning", ONGOING: "info", COMPLETED: "success" };

// Search dengan jeda 300ms agar tidak nembak API tiap ketikan
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Projects() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deleting, setDeleting] = useState(null); // proyek yang akan dihapus

  const debouncedSearch = useDebounced(search);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => setPage(1), [debouncedSearch, status, categoryId]);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", { page, search: debouncedSearch, status, categoryId }],
    queryFn: async () =>
      (await api.get("/admin/projects", { params: { page, limit: 8, search: debouncedSearch || undefined, status: status || undefined, categoryId: categoryId || undefined } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const { data: catData } = useQuery({
    queryKey: ["categories", "PROJECT"],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: "PROJECT", limit: 50 } })).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });

  // Toggle publish/featured + hapus
  const toggleMutation = useMutation({
    mutationFn: ({ id, flag }) => api.patch(`/admin/projects/${id}/${flag}`),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengubah status"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/projects/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Proyek berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus proyek");
      setDeleting(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Proyek</h1>
        <Link
          to="/admin/proyek/baru"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus size={16} /> Tambah Proyek
        </Link>
      </div>

      {/* Filter bar */}
      <Card bodyClassName="!py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul / nama klien…"
            aria-label="Cari proyek"
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">Semua status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            {(catData?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Tabel */}
      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Belum ada proyek"
            description="Tambahkan proyek pertama Anda."
            action={<Link to="/admin/proyek/baru"><Button size="sm" variant="soft"><Plus size={14} /> Tambah Proyek</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Proyek</th>
                  <th className="px-3 py-3.5 font-semibold">Kategori</th>
                  <th className="px-3 py-3.5 font-semibold">Status</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Terbit</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Unggulan</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.id} className="transition hover:bg-primary-soft/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.coverImage} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text">{p.title}</p>
                          <p className="text-xs text-text-muted">{p.year} · {p.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-text-muted">{p.category?.name ?? "—"}</td>
                    <td className="px-3 py-3"><Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <Switch checked={p.isPublished} onChange={() => toggleMutation.mutate({ id: p.id, flag: "publish" })} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <Switch checked={p.isFeatured} onChange={() => toggleMutation.mutate({ id: p.id, flag: "featured" })} />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          to={`/admin/proyek/${p.id}/edit`}
                          aria-label={`Edit ${p.title}`}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          aria-label={`Hapus ${p.title}`}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Paginasi */}
      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus proyek?"
        message={`Proyek "${deleting?.title}" beserta galeri fotonya akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
