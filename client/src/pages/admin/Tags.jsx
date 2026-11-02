// CRUD tag artikel — slug otomatis dan jumlah artikel terhubung
import { useEffect, useState } from "react";
import { Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import { toast } from "../../components/ui/Toast.jsx";

export default function Tags() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(null);

  useEffect(() => setPage(1), [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["tags", { page, search }],
    queryFn: async () => (await api.get("/admin/tags", { params: { page, limit: 50, search: search || undefined } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tags"] });
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName("");
    setNameError(null);
  };
  const openCreate = () => {
    setEditing(null);
    setName("");
    setNameError(null);
    setModalOpen(true);
  };
  const openEdit = (tag) => {
    setEditing(tag);
    setName(tag.name);
    setNameError(null);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => (editing ? api.put(`/admin/tags/${editing.id}`, { name }) : api.post("/admin/tags", { name })),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(editing ? "Tag berhasil diperbarui" : "Tag berhasil dibuat");
      closeModal();
    },
    onError: (err) => setNameError(err.response?.data?.message ?? "Gagal menyimpan tag"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/tags/${id}`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Tag berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus tag");
      setDeleting(null);
    },
  });

  const submit = (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setNameError("Nama tag minimal 2 karakter");
      return;
    }
    setNameError(null);
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Tag Artikel</h1>
          <p className="mt-1 text-sm text-text-muted">Kelola label untuk mengelompokkan artikel.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Tambah Tag</Button>
      </div>

      <Card bodyClassName="!py-4">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau slug tag…" aria-label="Cari tag" />
      </Card>

      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{[...Array(5)].map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={TagIcon} title="Belum ada tag" description="Buat tag pertama untuk artikel Anda." action={<Button size="sm" variant="soft" onClick={openCreate}><Plus size={14} /> Tambah Tag</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Nama</th>
                  <th className="px-3 py-3.5 font-semibold">Slug</th>
                  <th className="px-3 py-3.5 text-right font-semibold">Jumlah artikel</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((tag) => (
                  <tr key={tag.id} className="transition hover:bg-primary-soft/40">
                    <td className="px-5 py-3 font-semibold text-text">{tag.name}</td>
                    <td className="px-3 py-3"><code className="rounded bg-surface px-1.5 py-0.5 text-xs text-text-muted">{tag.slug}</code></td>
                    <td className="px-3 py-3 text-right text-text-muted">{(tag.postCount ?? 0).toLocaleString("id-ID")}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => openEdit(tag)} aria-label={`Edit ${tag.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"><Pencil size={15} /></button>
                        <button type="button" onClick={() => setDeleting(tag)} aria-label={`Hapus ${tag.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Tag" : "Tambah Tag"}
        size="sm"
        footer={<><Button variant="outline" onClick={closeModal} disabled={saveMutation.isPending}>Batal</Button><Button type="submit" form="tag-form" loading={saveMutation.isPending}>Simpan</Button></>}
      >
        <form id="tag-form" onSubmit={submit} noValidate>
          <Input label="Nama tag" value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Material" error={nameError} autoFocus />
          <p className="mt-2 text-xs text-text-muted">Slug dibuat otomatis dan tetap unik.</p>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus tag?"
        message={`Tag "${deleting?.name}" akan dihapus dari artikel yang menggunakannya.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
