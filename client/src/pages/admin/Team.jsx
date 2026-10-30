// Tim — grid kartu (foto, nama, jabatan) + naik/turun urutan + Modal form
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Users2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

// Label divisi untuk kartu (bentuk panjang ARSITEK_INTERIOR dsb.)
const DEPT_LABEL = { MANAJEMEN: "Manajemen", TEKNIK: "Teknik", ARSITEK_INTERIOR: "Arsitek & Interior", PENGAWAS: "Pengawas", ADMINISTRASI: "Administrasi" };

export default function Team() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => (await api.get("/admin/team", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team"] });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/team/reorder", { ids }),
    onSuccess: () => {
      invalidate();
      toast.success("Urutan tim disimpan");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/team/${id}`, payload) : api.post("/admin/team", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Anggota tim berhasil diperbarui" : "Anggota tim berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan anggota tim"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/team/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Anggota tim berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus anggota tim");
      setDeleting(null);
    },
  });

  const move = (i, dir) => {
    const target = i + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[i], next[target]] = [next[target], next[i]];
    reorderMutation.mutate(next.map((r) => r.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Tim</h1>
        <Button onClick={() => setModal({ name: "", position: "", bio: "", photo: "", isPublished: true })}>
          <Plus size={16} /> Tambah Anggota
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-56" rounded="rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={Users2} title="Belum ada anggota tim" description="Tambahkan foto & profil tim Anda." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((m, i) => (
            <Card key={m.id} bodyClassName="!p-0">
              <div className="group relative">
                <div className="aspect-[4/5] overflow-hidden rounded-t-2xl bg-primary-soft">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary">
                      <Users2 size={40} />
                    </div>
                  )}
                </div>
                {!m.isPublished && <span className="absolute left-2 bottom-2"><Badge variant="neutral">Draft</Badge></span>}
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label={`Naikkan ${m.name}`} className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label={`Turunkan ${m.name}`} className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="p-4">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-primary">{DEPT_LABEL[m.department] ?? "Manajemen"}</p>
                  <p className="truncate font-semibold text-text">{m.name}</p>
                  <p className="truncate text-sm text-text-muted">{m.position}</p>
                  <div className="mt-3 flex gap-1.5">
                    <button type="button" onClick={() => setModal({ ...m, bio: m.bio ?? "", photo: m.photo ?? "" })} aria-label={`Edit ${m.name}`} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text transition hover:bg-primary-soft hover:text-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(m)} aria-label={`Hapus ${m.name}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TeamModal modal={modal} onClose={() => setModal(null)} onSave={(payload) => saveMutation.mutate(payload)} saving={saveMutation.isPending} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus anggota tim?"
        message={`"${deleting?.name}" akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function TeamModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: "", position: "", bio: "", photo: "", department: "MANAJEMEN", email: "", linkedin: "", instagram: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) {
      setForm({ name: modal.name ?? "", position: modal.position ?? "", bio: modal.bio ?? "", photo: modal.photo ?? "", department: modal.department ?? "MANAJEMEN", email: modal.email ?? "", linkedin: modal.linkedin ?? "", instagram: modal.instagram ?? "", isPublished: modal.isPublished ?? true });
      setErrors({});
    }
  }, [modal]);

  if (!modal) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Nama minimal 2 karakter";
    if (form.position.trim().length < 2) errs.position = "Jabatan minimal 2 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, bio: form.bio || null, photo: form.photo || null, email: form.email || null, linkedin: form.linkedin || null, instagram: form.instagram || null });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Anggota Tim" : "Tambah Anggota Tim"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="team-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="team-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nama" value={form.name} onChange={set("name")} error={errors.name} placeholder="Nama lengkap" />
          <Input label="Jabatan" value={form.position} onChange={set("position")} error={errors.position} placeholder="Site Manager" />
        </div>
        <Select label="Divisi" value={form.department} onChange={set("department")}>
          <option value="MANAJEMEN">Manajemen</option>
          <option value="TEKNIK">Teknik</option>
          <option value="ARSITEK_INTERIOR">Arsitek &amp; Interior</option>
          <option value="PENGAWAS">Pengawas</option>
          <option value="ADMINISTRASI">Administrasi</option>
        </Select>
        <Textarea label="Bio (opsional)" rows={3} value={form.bio} onChange={set("bio")} placeholder="Pengalaman singkat…" />
        <ImagePicker label="Foto" value={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Email (opsional)" type="email" value={form.email} onChange={set("email")} error={errors.email} />
          <Input label="LinkedIn (opsional)" value={form.linkedin} onChange={set("linkedin")} error={errors.linkedin} placeholder="https://linkedin.com/in/…" />
          <Input label="Instagram (opsional)" value={form.instagram} onChange={set("instagram")} error={errors.instagram} placeholder="https://instagram.com/…" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
          Tampilkan di situs publik
        </label>
      </form>
    </Modal>
  );
}
