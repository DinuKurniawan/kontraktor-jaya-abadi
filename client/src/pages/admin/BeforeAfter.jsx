// Before/After — grid kartu slider pratinjau + dua ImagePicker + relasi proyek opsional
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Columns2, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

export default function BeforeAfter() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["before-after"],
    queryFn: async () => (await api.get("/admin/before-after", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["before-after"] });

  // Daftar proyek untuk relasi opsional
  const { data: projectData } = useQuery({
    queryKey: ["projects", "options"],
    queryFn: async () => (await api.get("/admin/projects", { params: { limit: 100 } })).data,
  });
  const projects = projectData?.data ?? [];

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/before-after/reorder", { ids }),
    onSuccess: () => { invalidate(); toast.success("Urutan disimpan"); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/before-after/${id}`, payload) : api.post("/admin/before-after", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Before/After berhasil diperbarui" : "Before/After berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan before/after"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/before-after/${id}`),
    onSuccess: () => { invalidate(); toast.success("Before/After berhasil dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus"); setDeleting(null); },
  });

  const move = (i, dir) => {
    const t = i + dir;
    if (t < 0 || t >= rows.length) return;
    const next = [...rows];
    [next[i], next[t]] = [next[t], next[i]];
    reorderMutation.mutate(next.map((r) => r.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Before / After</h1>
        <Button onClick={() => setModal({ title: "", location: "", beforeImage: "", afterImage: "", projectId: "", isPublished: true })}>
          <Plus size={16} /> Tambah Before/After
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" rounded="rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Columns2} title="Belum ada before/after" description="Pasangkan foto kondisi sebelum & sesudah pekerjaan." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((b, i) => (
            <BeforeAfterCard key={b.id} item={b} index={i} total={rows.length} onMove={move} onEdit={() => setModal({ ...b, location: b.location ?? "", projectId: b.projectId ?? "" })} onDelete={() => setDeleting(b)} reorderPending={reorderMutation.isPending} />
          ))}
        </div>
      )}

      <BeforeAfterModal modal={modal} projects={projects} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus before/after?" message={`"${deleting?.title}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

// Kartu dengan slider pratinjau: geser perbandingan sebelum/sesudah
function BeforeAfterCard({ item: b, index, total, onMove, onEdit, onDelete, reorderPending }) {
  const [pos, setPos] = useState(50);
  return (
    <Card bodyClassName="!p-0">
      <div className="group relative select-none">
        {/* Slider perbandingan */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-cream-deep"
          onPointerMove={(e) => e.buttons === 1 && setPos(Math.min(100, Math.max(0, ((e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.clientWidth) * 100)))}
        >
          <img src={b.afterImage} alt={`Sesudah — ${b.title}`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
            <img src={b.beforeImage} alt={`Sebelum — ${b.title}`} className="h-full object-cover" style={{ width: "100vw", maxWidth: "none" }} draggable={false} />
          </div>
          <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">SEBELUM</span>
          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">SESUDAH</span>
        </div>

        {!b.isPublished && <span className="absolute left-2 top-2"><Badge variant="neutral">Draft</Badge></span>}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0 || reorderPending} aria-label="Naikkan" className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowUp size={14} /></button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1 || reorderPending} aria-label="Turunkan" className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowDown size={14} /></button>
        </div>
        <div className="p-4">
          <p className="truncate font-semibold text-text">{b.title}</p>
          <p className="truncate text-xs text-text-muted">{[b.location, b.project?.title].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex gap-1.5">
            <button type="button" onClick={onEdit} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text transition hover:bg-primary-soft hover:text-primary">Edit</button>
            <button type="button" onClick={onDelete} aria-label={`Hapus ${b.title}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BeforeAfterModal({ modal, projects, onClose, onSave, saving }) {
  const [form, setForm] = useState({ title: "", location: "", beforeImage: "", afterImage: "", projectId: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ title: modal.title ?? "", location: modal.location ?? "", beforeImage: modal.beforeImage ?? "", afterImage: modal.afterImage ?? "", projectId: modal.projectId ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 2) errs.title = "Judul minimal 2 karakter";
    if (!form.beforeImage) errs.beforeImage = "Foto sebelum wajib diisi";
    if (!form.afterImage) errs.afterImage = "Foto sesudah wajib diisi";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, location: form.location || null, projectId: form.projectId || null });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Before/After" : "Tambah Before/After"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="ba-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="ba-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Judul" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={errors.title} placeholder="Lobby Jaya Tower" />
        <Input label="Lokasi (opsional)" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Jakarta Selatan" />
        <Select label="Proyek terkait (opsional)" value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
          <option value="">— Tidak terkait —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePicker label="Foto Sebelum" value={form.beforeImage} onChange={(v) => setForm((f) => ({ ...f, beforeImage: v }))} />
          <ImagePicker label="Foto Sesudah" value={form.afterImage} onChange={(v) => setForm((f) => ({ ...f, afterImage: v }))} />
        </div>
        {(errors.beforeImage || errors.afterImage) && <p className="text-xs text-danger">{errors.beforeImage ?? errors.afterImage}</p>}
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
