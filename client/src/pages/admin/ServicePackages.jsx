// Kelola Paket Layanan — kartu sort, modal form (fitur dinamis, Rupiah otomatis,
// satu "Paling Populer" per layanan), pratinjau kartu.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Star, Trash2, Wrench } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";

export const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);
// Input terformat: simpan hanya digit
const digits = (s) => s.replace(/\D/g, "");

const EMPTY = { name: "", description: "", priceFrom: "", priceUnit: "per m²", features: [""], isPopular: false, ctaLabel: "Konsultasi Sekarang", isPublished: true };

export default function ServicePackages() {
  const { id: serviceId } = useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null); // paket sedang diedit / draft baru
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => (await api.get(`/admin/services/${serviceId}`)).data.data,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["service-packages", serviceId],
    queryFn: async () => (await api.get("/admin/service-packages", { params: { serviceId, limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["service-packages", serviceId] });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/service-packages/reorder", { ids }),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/service-packages/${id}`),
    onSuccess: () => { invalidate(); toast.success("Paket dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus"); setDeleting(null); },
  });
  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }) => {
      // Satu "Paling Populer" per layanan: matikan lainnya dulu bila paket ini jadi populer
      if (payload.isPopular) {
        for (const r of rows) {
          if (r.id !== id && r.isPopular) await api.put(`/admin/service-packages/${r.id}`, { isPopular: false });
        }
      }
      return id ? api.put(`/admin/service-packages/${id}`, payload) : api.post("/admin/service-packages", payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Paket layanan berhasil disimpan");
      setForm(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan paket"),
  });
  // Tandai populer langsung dari kartu
  const popularMutation = useMutation({
    mutationFn: async (row) => {
      for (const r of rows) {
        const next = r.id === row.id ? true : false;
        if (r.isPopular !== next) await api.put(`/admin/service-packages/${r.id}`, { isPopular: next });
      }
      return true;
    },
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengubah paket populer"),
  });

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((r) => r.id));
  };

  const openNew = () => { setForm({ ...EMPTY }); setIsNew(true); };
  const openEdit = (r) => {
    setForm({ ...r, priceFrom: String(r.priceFrom ?? ""), features: (r.features?.length ? r.features : [""]) });
    setIsNew(false);
  };
  const save = (e) => {
    e.preventDefault();
    const features = (form.features ?? []).map((f) => f.trim()).filter(Boolean);
    if (!form.name?.trim()) return toast.error("Nama paket wajib diisi");
    if ((form.description ?? "").trim().length < 2) return toast.error("Deskripsi minimal 2 karakter");
    if (features.length === 0) return toast.error("Minimal 1 fitur");
    saveMutation.mutate({
      id: isNew ? null : form.id,
      payload: {
        serviceId,
        name: form.name.trim(),
        description: form.description?.trim() ?? "",
        priceFrom: Number(digits(form.priceFrom)) || 0,
        priceUnit: form.priceUnit || null,
        features,
        isPopular: !!form.isPopular,
        ctaLabel: form.ctaLabel?.trim() || "Konsultasi Sekarang",
        isPublished: !!form.isPublished,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Paket — {service?.title ?? "…"}</h1>
          <p className="text-sm text-text-muted">Harga paket tampil di halaman detail layanan.</p>
        </div>
        <Button onClick={openNew} disabled={rows.length >= 6} title={rows.length >= 6 ? "Maksimal 6 paket" : undefined}>
          <Plus size={16} /> Tambah Paket
        </Button>
      </div>

      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Wrench} title="Belum ada paket" description="Tambahkan paket harga pertama untuk layanan ini."
            action={<Button size="sm" variant="soft" onClick={openNew}><Plus size={14} /> Tambah Paket</Button>} />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r, i) => (
              <li key={r.id} className={`flex flex-wrap items-center gap-3 p-4 ${r.isPopular ? "bg-primary-soft/40" : ""}`}>
                <div className="flex items-center gap-1">
                  <span className="w-6 text-center text-xs font-semibold text-text-muted">{i + 1}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label={`Naikkan ${r.name}`} className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label={`Turunkan ${r.name}`} className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <div className="min-w-[12rem] flex-1">
                  <p className="flex items-center gap-2 font-semibold text-text">
                    {r.name}
                    {r.isPopular && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white"><Star size={10} /> Populer</span>}
                    {!r.isPublished && <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold uppercase text-text-muted">Draft</span>}
                  </p>
                  <p className="text-xs text-text-muted">{rupiah(r.priceFrom)} {r.priceUnit ?? ""} · {r.features?.length ?? 0} fitur</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => popularMutation.mutate(r)} disabled={r.isPopular || popularMutation.isPending}
                    title={r.isPopular ? "Sudah jadi populer" : "Tandai paket ini paling populer"}
                    className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent">
                    <Star size={15} />
                  </button>
                  <button type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"><Pencil size={15} /></button>
                  <button type="button" onClick={() => setDeleting(r)} aria-label={`Hapus ${r.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Link to="/admin/layanan" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary">
        <ArrowLeft size={15} /> Kembali ke daftar layanan
      </Link>

      {/* Modal form + pratinjau */}
      <Modal open={!!form} onClose={() => setForm(null)} title={isNew ? "Tambah Paket" : `Edit Paket: ${form?.name ?? ""}`} size="lg">
        {form && (
          <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
            {/* Form */}
            <div className="space-y-4">
              <Input label="Nama Paket" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Renovasi Menyeluruh" required />
              <Textarea label="Deskripsi" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Satu kalimat positioning paket" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Harga Mulai Dari" value={form.priceFrom ? rupiah(form.priceFrom) : ""} onChange={(e) => setForm({ ...form, priceFrom: digits(e.target.value) })} placeholder="Rp 0" required />
                <Input label="Satuan" value={form.priceUnit ?? ""} onChange={(e) => setForm({ ...form, priceUnit: e.target.value })} placeholder="per m²" />
              </div>

              {/* Fitur dinamis */}
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold text-text">Fitur Paket</legend>
                <div className="space-y-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={f} onChange={(e) => setForm({ ...form, features: form.features.map((x, j) => (j === i ? e.target.value : x)) })}
                        placeholder={`Fitur ${i + 1}`} aria-label={`Fitur ${i + 1}`}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      <button type="button" onClick={() => setForm({ ...form, features: form.features.filter((_, j) => j !== i) })}
                        disabled={form.features.length === 1} aria-label={`Hapus fitur ${i + 1}`}
                        className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-30">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="soft" size="sm" className="mt-2" onClick={() => setForm({ ...form, features: [...form.features, ""] })}>
                  <Plus size={13} /> Tambah Fitur
                </Button>
              </fieldset>

              <Input label="Label Tombol" value={form.ctaLabel ?? ""} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="Konsultasi Sekarang" />
              <div className="flex flex-wrap gap-4">
                <Switch label="Paling Populer (satu per layanan)" checked={!!form.isPopular} onChange={(v) => setForm({ ...form, isPopular: v })} />
                <Switch label="Tampilkan (publish)" checked={!!form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} />
              </div>
            </div>

            {/* Pratinjau kartu */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Pratinjau</p>
              <div className={`rounded-2xl border-2 p-5 transition ${form.isPopular ? "border-primary bg-primary-soft/50 shadow-soft-lg" : "border-border bg-surface"}`}>
                {form.isPopular && (
                  <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    <Star size={11} /> Paling Populer
                  </span>
                )}
                <h3 className="font-display text-lg font-bold text-text">{form.name || "Nama Paket"}</h3>
                <p className="mt-1 text-sm text-text-muted">{form.description || "Deskripsi singkat paket"}</p>
                <p className="mt-3 font-display text-2xl font-extrabold text-primary">
                  {rupiah(form.priceFrom)} <span className="text-sm font-medium text-text-muted">{form.priceUnit || ""}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {form.features.filter((f) => f.trim()).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text"><span className="text-primary">✓</span> {f}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white opacity-90">
                  {form.ctaLabel || "Konsultasi Sekarang"}
                </div>
              </div>
              {!form.isPublished && <p className="mt-2 text-xs text-text-muted">Draft — tidak tampil di situs publik.</p>}
            </div>

            <div className="flex justify-end gap-2 lg:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Batal</Button>
              <Button type="submit" loading={saveMutation.isPending}>Simpan Paket</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus paket?" message={`Paket "${deleting?.name}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}
