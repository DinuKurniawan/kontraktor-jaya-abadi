// Halaman daftar layanan — urutan naik/turun, switch publish, edit/hapus
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, BadgePercent, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import api from "../../lib/axios.js";
import { SERVICE_ICONS } from "../../lib/service-icons.jsx";
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
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Services() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deleting, setDeleting] = useState(null);
  const debouncedSearch = useDebounced(search);
  const limit = 10;

  useEffect(() => setPage(1), [debouncedSearch, categoryId]);

  const { data: categoryData } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => (await api.get("/admin/service-categories", { params: { limit: 100 } })).data,
  });
  const categories = categoryData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["services", { page, search: debouncedSearch, categoryId }],
    queryFn: async () => (await api.get("/admin/services", { params: { page, limit, search: debouncedSearch || undefined, categoryId: categoryId || undefined } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["services"] });

  // Simpan urutan hasil tombol naik/turun (hanya baris yang berpindah perlu dikirim — kirim semua cukup)
  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/services/reorder", { ids }),
    onSuccess: () => {
      invalidate();
      toast.success("Urutan layanan disimpan");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }) => api.put(`/admin/services/${id}`, { isPublished }),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengubah status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/services/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Layanan berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus layanan");
      setDeleting(null);
    },
  });

  // Geser baris lalu kirim urutan baru ke server
  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((r) => r.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Layanan</h1>
        <Link
          to="/admin/layanan/baru"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus size={16} /> Tambah Layanan
        </Link>
      </div>

      <Card bodyClassName="!py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul layanan…"
            aria-label="Cari layanan"
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Select label="Filter kategori" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
        </div>
      </Card>

      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Belum ada layanan"
            description="Tambahkan layanan pertama Anda."
            action={<Link to="/admin/layanan/baru"><Button size="sm" variant="soft"><Plus size={14} /> Tambah Layanan</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Layanan</th>
                  <th className="px-3 py-3.5 font-semibold">Kategori</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Urutan</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Terbit</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s, i) => {
                  const Icon = SERVICE_ICONS[s.icon] ?? Wrench;
                  return (
                    <tr key={s.id} className="transition hover:bg-primary-soft/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {s.image ? (
                            <img src={s.image} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                              <Icon size={18} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-text">{s.title}</p>
                            <p className="max-w-xs truncate text-xs text-text-muted">{s.shortDesc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-text-muted">{s.category?.name ?? "Tanpa kategori"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <span className="mr-1 w-6 text-center text-xs font-semibold text-text-muted">{s.sortOrder + 1}</span>
                          <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label={`Naikkan ${s.title}`} className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30">
                            <ArrowUp size={15} />
                          </button>
                          <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label={`Turunkan ${s.title}`} className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30">
                            <ArrowDown size={15} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center">
                          <Switch checked={s.isPublished} onChange={() => publishMutation.mutate({ id: s.id, isPublished: !s.isPublished })} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Link to={`/admin/layanan/${s.id}/paket`} aria-label={`Kelola paket ${s.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary" title="Kelola Paket">
                            <BadgePercent size={15} />
                          </Link>
                          <Link to={`/admin/layanan/${s.id}/edit`} aria-label={`Edit ${s.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary">
                            <Pencil size={15} />
                          </Link>
                          <button type="button" onClick={() => setDeleting(s)} aria-label={`Hapus ${s.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        title="Hapus layanan?"
        message={`Layanan "${deleting?.title}" akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
