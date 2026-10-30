// Milestones — tabel urut tahun + Modal (tahun, judul, deskripsi, gambar opsional, publish)
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Trophy } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

export default function Milestones() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["milestones"],
    queryFn: async () => (await api.get("/admin/milestones", { params: { limit: 100 } })).data,
  });
  // Tabel diurutkan tahun terbaru di atas (sortOrder tak dipakai untuk tampil)
  const rows = [...(data?.data ?? [])].sort((a, b) => b.year - a.year);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["milestones"] });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/milestones/${id}`, payload) : api.post("/admin/milestones", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Milestone berhasil diperbarui" : "Milestone berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan milestone"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/milestones/${id}`),
    onSuccess: () => { invalidate(); toast.success("Milestone berhasil dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus milestone"); setDeleting(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Milestone</h1>
        <Button onClick={() => setModal({ year: new Date().getFullYear(), title: "", description: "", image: "", isPublished: true })}>
          <Plus size={16} /> Tambah Milestone
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Trophy} title="Belum ada milestone" description="Catat momen penting perjalanan perusahaan." /></Card>
      ) : (
        <Card bodyClassName="!p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 w-20">Tahun</th>
                <th className="px-5 py-3">Judul &amp; Deskripsi</th>
                <th className="px-5 py-3 w-28">Status</th>
                <th className="px-5 py-3 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-primary-soft/40">
                  <td className="px-5 py-3 font-display text-lg font-bold text-primary">{r.year}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {r.image && <img src={r.image} alt="" className="h-10 w-16 shrink-0 rounded-md object-cover" />}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">{r.title}</p>
                        <p className="truncate text-xs text-text-muted">{r.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{r.isPublished ? <Badge variant="success">Publik</Badge> : <Badge variant="neutral">Draft</Badge>}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => setModal({ ...r })} aria-label={`Edit ${r.title}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"><Pencil size={13} /></button>
                      <button type="button" onClick={() => setDeleting(r)} aria-label={`Hapus ${r.title}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <MilestoneModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus milestone?" message={`Milestone "${deleting?.year} — ${deleting?.title}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function MilestoneModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ year: modal.year ?? new Date().getFullYear(), title: modal.title ?? "", description: modal.description ?? "", image: modal.image ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    const y = Number(form.year);
    if (!Number.isInteger(y) || y < 1900 || y > 2100) errs.year = "Tahun tidak valid (1900–2100)";
    if (form.title.trim().length < 2) errs.title = "Judul minimal 2 karakter";
    if (form.description.trim().length < 2) errs.description = "Deskripsi minimal 2 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, year: y, image: form.image || null });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Milestone" : "Tambah Milestone"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="milestone-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="milestone-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Tahun" type="number" min={1900} max={2100} value={form.year ?? ""} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} error={errors.year} />
        <Input label="Judul" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={errors.title} placeholder="100 Proyek Rampung" />
        <Textarea label="Deskripsi" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} error={errors.description} />
        <ImagePicker label="Gambar (opsional)" value={form.image ?? ""} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
