// IconListAdmin — tabel generik untuk konten berjudul+deskripsi+ikon (Features, ProcessSteps).
// Props: endpoint (tanpa /reorder), title, addLabel, emptyTitle, queryKey.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Input from "../../components/ui/Input.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import IconPicker from "./IconPicker.jsx";
import { SERVICE_ICONS } from "../../lib/service-icons.jsx";

export default function IconListAdmin({ endpoint, title, addLabel, emptyTitle, queryKey }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await api.get(endpoint, { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch(`${endpoint}/reorder`, { ids }),
    onSuccess: () => { invalidate(); toast.success("Urutan disimpan"); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`${endpoint}/${id}`, payload) : api.post(endpoint, payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Berhasil diperbarui" : "Berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan data"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => { invalidate(); toast.success("Berhasil dihapus"); setDeleting(null); },
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
        <h1 className="font-display text-xl font-semibold text-text">{title}</h1>
        <Button onClick={() => setModal({ title: "", description: "", icon: "", isPublished: true })}>
          <Plus size={16} /> {addLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Sparkles} title={emptyTitle} description="Tambahkan item untuk beranda." /></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => {
            const Icon = SERVICE_ICONS[r.icon];
            return (
              <Card key={r.id} bodyClassName="!p-0">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label="Naikkan" className="rounded-md border border-border p-1 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowUp size={13} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label="Turunkan" className="rounded-md border border-border p-1 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowDown size={13} /></button>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    {Icon ? <Icon size={18} /> : <Sparkles size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-text">
                      <span className="truncate">{r.title}</span>
                      {!r.isPublished && <Badge variant="neutral">Draft</Badge>}
                    </p>
                    <p className="truncate text-sm text-text-muted">{r.description}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setModal({ ...r, description: r.description ?? "", icon: r.icon ?? "" })} aria-label={`Edit ${r.title}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"><Pencil size={13} /></button>
                    <button type="button" onClick={() => setDeleting(r)} aria-label={`Hapus ${r.title}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <IconRowModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title={`${title}: hapus item?`} message={`"${deleting?.title}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function IconRowModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({ title: "", description: "", icon: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ title: modal.title ?? "", description: modal.description ?? "", icon: modal.icon ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 2) errs.title = "Judul minimal 2 karakter";
    if (form.description.trim().length < 5) errs.description = "Deskripsi minimal 5 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, icon: form.icon || null });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Item" : "Tambah Item"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="icon-row-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="icon-row-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Judul" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={errors.title} />
        <Textarea label="Deskripsi" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} error={errors.description} />
        <IconPicker value={form.icon} onChange={(v) => setForm((f) => ({ ...f, icon: v }))} />
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
