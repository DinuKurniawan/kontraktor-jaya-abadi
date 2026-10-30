// Mitra — grid kartu logo + urutan + Modal form
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Handshake, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

export default function Partners() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => (await api.get("/admin/partners", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["partners"] });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/partners/reorder", { ids }),
    onSuccess: () => { invalidate(); toast.success("Urutan mitra disimpan"); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/partners/${id}`, payload) : api.post("/admin/partners", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Mitra berhasil diperbarui" : "Mitra berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan mitra"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/partners/${id}`),
    onSuccess: () => { invalidate(); toast.success("Mitra berhasil dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus mitra"); setDeleting(null); },
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
        <h1 className="font-display text-xl font-semibold text-text">Mitra</h1>
        <Button onClick={() => setModal({ name: "", website: "", logo: "", isPublished: true })}>
          <Plus size={16} /> Tambah Mitra
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44" rounded="rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Handshake} title="Belum ada mitra" description="Tambahkan logo mitra/klien untuk tampil di beranda." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((m, i) => (
            <Card key={m.id} bodyClassName="!p-0">
              <div className="group relative">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-2xl bg-primary-soft p-4">
                  {m.logo ? (
                    <img src={m.logo} alt={m.name} className="max-h-full max-w-full object-contain transition group-hover:scale-105" />
                  ) : (
                    <Handshake size={36} className="text-primary" />
                  )}
                </div>
                {!m.isPublished && <span className="absolute bottom-2 left-2"><Badge variant="neutral">Draft</Badge></span>}
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label={`Naikkan ${m.name}`} className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label={`Turunkan ${m.name}`} className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold text-text">{m.name}</p>
                  {m.website && <p className="truncate text-xs text-text-muted">{m.website}</p>}
                  <div className="mt-3 flex gap-1.5">
                    <button type="button" onClick={() => setModal({ ...m, website: m.website ?? "", logo: m.logo ?? "" })} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text transition hover:bg-primary-soft hover:text-primary">Edit</button>
                    <button type="button" onClick={() => setDeleting(m)} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger" aria-label={`Hapus ${m.name}`}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PartnerModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus mitra?" message={`"${deleting?.name}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function PartnerModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: "", website: "", logo: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ name: modal.name ?? "", website: modal.website ?? "", logo: modal.logo ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e.target?.checked }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Nama minimal 2 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, website: form.website || null, logo: form.logo || null });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Mitra" : "Tambah Mitra"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="partner-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="partner-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Nama Mitra" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} placeholder="PT Bangun Perkasa" />
        <Input label="Website (opsional)" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
        <ImagePicker label="Logo" value={form.logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
