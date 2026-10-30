// FAQ — daftar accordion pratinjau + naik/turun + Modal form
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, CircleHelp, Pencil, Plus, Trash2 } from "lucide-react";
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

export default function Faqs() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => (await api.get("/admin/faqs", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["faqs"] });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/faqs/reorder", { ids }),
    onSuccess: () => { invalidate(); toast.success("Urutan FAQ disimpan"); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/faqs/${id}`, payload) : api.post("/admin/faqs", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "FAQ berhasil diperbarui" : "FAQ berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan FAQ"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => { invalidate(); toast.success("FAQ berhasil dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus FAQ"); setDeleting(null); },
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
        <h1 className="font-display text-xl font-semibold text-text">FAQ</h1>
        <Button onClick={() => setModal({ question: "", answer: "", isPublished: true })}>
          <Plus size={16} /> Tambah FAQ
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={CircleHelp} title="Belum ada FAQ" description="Tambahkan pertanyaan yang sering diajukan klien." /></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((f, i) => (
            <Card key={f.id} bodyClassName="!p-0">
              <div className="flex items-start gap-2 p-4">
                <div className="flex flex-col gap-1 pt-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorderMutation.isPending} aria-label="Naikkan" className="rounded-md border border-border p-1 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowUp size={13} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reorderMutation.isPending} aria-label="Turunkan" className="rounded-md border border-border p-1 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowDown size={13} /></button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  aria-expanded={openId === f.id}
                  className="flex flex-1 items-center justify-between gap-3 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-text">{f.question}</span>
                    {!f.isPublished && <Badge variant="neutral">Draft</Badge>}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-text-muted transition ${openId === f.id ? "rotate-180" : ""}`} />
                </button>

                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setModal({ ...f })} aria-label="Edit" className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"><Pencil size={13} /></button>
                  <button type="button" onClick={() => setDeleting(f)} aria-label="Hapus" className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
                </div>
              </div>
              {openId === f.id && (
                <p className="border-t border-border px-4 py-3 pl-14 text-sm leading-relaxed text-text-muted">{f.answer}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <FaqModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus FAQ?" message={`"${deleting?.question}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function FaqModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({ question: "", answer: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ question: modal.question ?? "", answer: modal.answer ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.question.trim().length < 5) errs.question = "Pertanyaan minimal 5 karakter";
    if (form.answer.trim().length < 5) errs.answer = "Jawaban minimal 5 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, ...form });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit FAQ" : "Tambah FAQ"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="faq-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="faq-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Pertanyaan" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} error={errors.question} placeholder="Berapa lama masa garansi?" />
        <Textarea label="Jawaban" rows={4} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} error={errors.answer} placeholder="Tulis jawaban lengkap…" />
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
