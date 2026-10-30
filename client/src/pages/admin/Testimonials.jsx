// Testimoni — tabel + Modal form (rating bintang interaktif)
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareQuote, Pencil, Plus, Star, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Input from "../../components/ui/Input.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

// Barisan bintang — interaktif di form, statis di tabel
function Stars({ value, onChange, size = 16 }) {
  return (
    <div className="flex gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} bintang`}
          className={onChange ? "transition enabled:hover:scale-110" : "cursor-default"}
        >
          <Star size={size} className={n <= value ? "fill-warning text-warning" : "fill-border text-border"} />
        </button>
      ))}
    </div>
  );
}

const emptyForm = { name: "", position: "", company: "", content: "" };

export default function Testimonials() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | {id, ...data}
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["testimonials", page],
    queryFn: async () => (await api.get("/admin/testimonials", { params: { page, limit: 10 } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["testimonials"] });

  // Simpan (create/update) — rating & avatar di state modal
  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/testimonials/${id}`, payload) : api.post("/admin/testimonials", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Testimoni berhasil diperbarui" : "Testimoni berhasil dibuat");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan testimoni"),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/testimonials/${id}/publish`),
    onSuccess: invalidate,
    onError: () => toast.error("Gagal mengubah status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/testimonials/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Testimoni berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus testimoni");
      setDeleting(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Testimoni</h1>
        <Button onClick={() => setModal({ ...emptyForm, rating: 5, avatar: "", isPublished: false })}>
          <Plus size={16} /> Tambah Testimoni
        </Button>
      </div>

      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={MessageSquareQuote} title="Belum ada testimoni" description="Tambahkan testimoni klien untuk halaman depan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Klien</th>
                  <th className="px-3 py-3.5 font-semibold">Testimoni</th>
                  <th className="px-3 py-3.5 font-semibold">Rating</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Terbit</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => (
                  <tr key={t.id} className="transition hover:bg-primary-soft/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {t.avatar ? (
                          <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary">
                            {t.name[0]}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-text">{t.name}</p>
                          <p className="text-xs text-text-muted">{t.position}{t.company ? ` · ${t.company}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-3 py-3">
                      <p className="truncate text-text-muted">{t.content}</p>
                    </td>
                    <td className="px-3 py-3"><Stars value={t.rating} /></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <Switch checked={t.isPublished} onChange={() => publishMutation.mutate(t.id)} />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setModal({ ...t, company: t.company ?? "", avatar: t.avatar ?? "" })} aria-label={`Edit ${t.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setDeleting(t)} aria-label={`Hapus ${t.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger">
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

      {/* Modal form tambah/edit */}
      <TestimonialModal modal={modal} onClose={() => setModal(null)} onSave={(payload) => saveMutation.mutate(payload)} saving={saveMutation.isPending} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus testimoni?"
        message={`Testimoni dari "${deleting?.name}" akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// Form di Modal — validasi ringan manual (field wajib + rating default)
function TestimonialModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [rating, setRating] = useState(5);
  const [avatar, setAvatar] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!modal) return;
    const { rating = 5, avatar = "", ...rest } = modal;
    setForm(rest.id ? { name: modal.name, position: modal.position, company: modal.company ?? "", content: modal.content } : { ...emptyForm, ...modal });
    setRating(Number(rating));
    setAvatar(avatar);
  }, [modal]);

  if (!modal) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Nama minimal 2 karakter";
    if (form.position.trim().length < 2) errs.position = "Jabatan minimal 2 karakter";
    if (form.content.trim().length < 10) errs.content = "Isi testimoni minimal 10 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form, rating, avatar: avatar || null, isPublished: modal.isPublished ?? false });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Testimoni" : "Tambah Testimoni"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="testimonial-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="testimonial-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nama" value={form.name} onChange={set("name")} error={errors.name} placeholder="Nama klien" />
          <Input label="Jabatan" value={form.position} onChange={set("position")} error={errors.position} placeholder="Direktur Operasional" />
          <Input label="Perusahaan (opsional)" value={form.company} onChange={set("company")} placeholder="PT Maju Jaya" />
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">Rating</p>
            <Stars value={rating} onChange={setRating} size={22} />
          </div>
        </div>
        <Textarea label="Isi Testimoni" rows={4} value={form.content} onChange={set("content")} error={errors.content} placeholder="Kesan dan pesan klien…" />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={modal.isPublished ?? false} onChange={(e) => setModal((m) => ({ ...m, isPublished: e.target.checked }))} />
          Tampilkan di situs publik
        </label>
        <ImagePicker label="Foto (opsional)" value={avatar} onChange={setAvatar} />
      </form>
    </Modal>
  );
}
