// Daftar artikel — filter status/kategori + pencarian + switch terbit
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
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

function useDebounced(value, delay = 300) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function Posts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deleting, setDeleting] = useState(null);
  const qSearch = useDebounced(search);

  useEffect(() => setPage(1), [qSearch, status, categoryId]);

  const { data, isLoading } = useQuery({
    queryKey: ["posts", { page, search: qSearch, status, categoryId }],
    queryFn: async () => (await api.get("/admin/posts", { params: { page, limit: 8, search: qSearch || undefined, status: status || undefined, categoryId: categoryId || undefined } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const { data: catData } = useQuery({
    queryKey: ["categories", "POST"],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: "POST", limit: 50 } })).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["posts"] });

  const publishMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/posts/${id}/publish`),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengubah status"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/posts/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Artikel berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus artikel");
      setDeleting(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Artikel</h1>
        <Link to="/admin/artikel/baru" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark">
          <Plus size={16} /> Tulis Artikel
        </Link>
      </div>

      <Card bodyClassName="!py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul artikel…"
            aria-label="Cari artikel"
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">Semua status</option>
            <option value="PUBLISHED">Terbit</option>
            <option value="DRAFT">Draft</option>
          </Select>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            {(catData?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Belum ada artikel"
            description="Tulis artikel pertama untuk situs publik."
            action={<Link to="/admin/artikel/baru"><Button size="sm" variant="soft"><Plus size={14} /> Tulis Artikel</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Artikel</th>
                  <th className="px-3 py-3.5 font-semibold">Kategori</th>
                  <th className="px-3 py-3.5 font-semibold">Tanggal Terbit</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Terbit</th>
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
                          <p className="text-xs text-text-muted">
                            {p.author?.name} · {p.readTime} mnt baca
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-text-muted">{p.category?.name ?? "—"}</td>
                    <td className="px-3 py-3 text-text-muted">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <Switch checked={p.isPublished} onChange={() => publishMutation.mutate(p.id)} />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link to={`/admin/artikel/${p.id}/edit`} aria-label={`Edit ${p.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary">
                          <Pencil size={15} />
                        </Link>
                        <button type="button" onClick={() => setDeleting(p)} aria-label={`Hapus ${p.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger">
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

      {meta && meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus artikel?"
        message={`Artikel "${deleting?.title}" akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
