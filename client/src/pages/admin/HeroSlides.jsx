// Hero slider — kartu preview + Modal form (maks 5 aktif di backend)
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Images, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

const empty = { title: "", subtitle: "", ctaLabel: "", ctaUrl: "", image: "", isActive: false };

export default function HeroSlides() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => (await api.get("/admin/hero-slides", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["hero-slides"] });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/hero-slides/${id}`, payload) : api.post("/admin/hero-slides", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Slide berhasil diperbarui" : "Slide berhasil dibuat");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan slide"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/hero-slides/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Slide berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus slide");
      setDeleting(null);
    },
  });

  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Hero Slider</h1>
        <Button onClick={() => setModal({ ...empty })}>
          <Plus size={16} /> Tambah Slide
        </Button>
      </div>
      <p className="text-sm text-text-muted">
        Aktif: <span className="font-semibold text-text">{activeCount}</span> / 5 slide (batas backend)
      </p>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-52" rounded="rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={Images} title="Belum ada slide" description="Slide hero tampil di bagian atas halaman depan." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <Card key={s.id} bodyClassName="!p-0">
              <div className="group relative aspect-video overflow-hidden rounded-t-2xl bg-primary-soft">
                {/* Preview langsung gambar */}
                <img src={s.image} alt={s.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                  <p className="font-display font-semibold">{s.title}</p>
                  {s.subtitle && <p className="text-xs text-white/80">{s.subtitle}</p>}
                </div>
                <span className="absolute left-2 top-2">
                  <Badge variant={s.isActive ? "success" : "neutral"}>{s.isActive ? "Aktif" : "Nonaktif"}</Badge>
                </span>
              </div>
              <div className="flex items-center gap-1.5 p-3">
                <p className="flex-1 truncate text-xs text-text-muted">
                  {s.ctaLabel ? `${s.ctaLabel} → ${s.ctaUrl ?? "/"}` : "Tanpa tombol"}
                </p>
                <button type="button" onClick={() => setModal({ ...s, subtitle: s.subtitle ?? "", ctaLabel: s.ctaLabel ?? "", ctaUrl: s.ctaUrl ?? "" })} aria-label={`Edit ${s.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => setDeleting(s)} aria-label={`Hapus ${s.title}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger">
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SlideModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus slide?"
        message={`Slide "${deleting?.title}" akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function SlideModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) {
      setForm({ ...empty, title: modal.title ?? "", subtitle: modal.subtitle ?? "", ctaLabel: modal.ctaLabel ?? "", ctaUrl: modal.ctaUrl ?? "", image: modal.image ?? "", isActive: modal.isActive ?? false });
      setErrors({});
    }
  }, [modal]);

  if (!modal) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 3) errs.title = "Judul minimal 3 karakter";
    if (!form.image) errs.image = "Pilih gambar slide";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, subtitle: form.subtitle || null, ctaLabel: form.ctaLabel || null, ctaUrl: form.ctaUrl || null });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Slide" : "Tambah Slide"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="hero-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="hero-form" onSubmit={submit} className="space-y-4" noValidate>
        {/* Preview langsung */}
        {form.image && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-primary-soft">
            <img src={form.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              <p className="font-display font-semibold">{form.title || "Judul slide"}</p>
              {form.subtitle && <p className="text-xs text-white/80">{form.subtitle}</p>}
            </div>
          </div>
        )}
        <Input label="Judul" value={form.title} onChange={set("title")} error={errors.title} placeholder="Bangun Bersama Jaya Abadi" />
        <Input label="Subjudul (opsional)" value={form.subtitle} onChange={set("subtitle")} placeholder="Kontraktor terpercaya sejak 1998" />
        <ImagePicker label="Gambar Slide" value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
        {errors.image && <p className="-mt-1 text-xs text-danger">{errors.image}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Label Tombol (opsional)" value={form.ctaLabel} onChange={set("ctaLabel")} placeholder="Hubungi Kami" />
          <Input label="URL Tombol (opsional)" value={form.ctaUrl} onChange={set("ctaUrl")} placeholder="/kontak" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          Slide aktif (tampil di halaman depan)
        </label>
      </form>
    </Modal>
  );
}
