// Sertifikat — grid kartu + urutan + Modal form (judul, penerbit, tahun, gambar)
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Award, Pencil, Plus, Trash2 } from "lucide-react";
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

export default function Certificates() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => (await api.get("/admin/certificates", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["certificates"] });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/certificates/reorder", { ids }),
    onSuccess: () => { invalidate(); toast.success("Urutan sertifikat disimpan"); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/certificates/${id}`, payload) : api.post("/admin/certificates", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Sertifikat berhasil diperbarui" : "Sertifikat berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan sertifikat"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/certificates/${id}`),
    onSuccess: () => { invalidate(); toast.success("Sertifikat berhasil dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus sertifikat"); setDeleting(null); },
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
        <h1 className="font-display text-xl font-semibold text-text">Sertifikat</h1>
        <Button onClick={() => setModal({ title: "", issuer: "", year: "", image: "", isPublished: true })}>
          <Plus size={16} /> Tambah Sertifikat
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56" rounded="rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Award} title="Belum ada sertifikat" description="Tambahkan sertifikat & legalitas perusahaan." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((c, i) => (
            <Card key={c.id} bodyClassName="!p-0">
              <div className="group relative">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-2xl bg-primary-soft p-4">
                  {c.image ? (
                    <img src={c.image} alt={c.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <Award size={36} className="text-primary" />
                  )}
                </div>
                {!c.isPublished && <span className="absolute bottom-2 left-2"><Badge variant="neutral">Draft</Badge></span>}
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label={`Naikkan ${c.title}`} className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label={`Turunkan ${c.title}`} className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold text-text">{c.title}</p>
                  <p className="truncate text-sm text-text-muted">{[c.issuer, c.year].filter(Boolean).join(" · ")}</p>
                  <div className="mt-3 flex gap-1.5">
                    <button type="button" onClick={() => setModal({ ...c, issuer: c.issuer ?? "", year: c.year ?? "", image: c.image ?? "" })} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text transition hover:bg-primary-soft hover:text-primary">Edit</button>
                    <button type="button" onClick={() => setDeleting(c)} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger" aria-label={`Hapus ${c.title}`}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CertificateModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus sertifikat?" message={`"${deleting?.title}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function CertificateModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({ title: "", issuer: "", year: "", image: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ title: modal.title ?? "", issuer: modal.issuer ?? "", year: modal.year ?? "", image: modal.image ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 2) errs.title = "Judul minimal 2 karakter";
    if (form.year && (Number(form.year) < 1900 || Number(form.year) > 2100)) errs.year = "Tahun tidak valid";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      id: modal.id,
      title: form.title,
      issuer: form.issuer || null,
      year: form.year ? Number(form.year) : null,
      image: form.image || null,
      isPublished: form.isPublished,
    });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Sertifikat" : "Tambah Sertifikat"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="certificate-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="certificate-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Judul" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={errors.title} placeholder="SBU Konstruksi Gedung" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Penerbit (opsional)" value={form.issuer} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))} placeholder="LPJK" />
          <Input label="Tahun (opsional)" type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} error={errors.year} placeholder="2024" />
        </div>
        <ImagePicker label="Gambar (opsional)" value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
