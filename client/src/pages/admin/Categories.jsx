// Halaman kategori — dua tab (Proyek/Artikel), form via Modal, hapus via ConfirmDialog
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const TABS = [
  { key: "PROJECT", label: "Kategori Proyek" },
  { key: "POST", label: "Kategori Artikel" },
];

export default function Categories() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("PROJECT");
  const [editing, setEditing] = useState(null); // {id,name} saat edit
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(null);

  useEffect(() => {
    if (editing) setName(editing.name);
  }, [editing]);

  const { data, isLoading } = useQuery({
    queryKey: ["categories", tab],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: tab, limit: 50 } })).data,
  });
  const rows = data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setNameError(null);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setName(c.name);
    setNameError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName("");
    setNameError(null);
  };

  const saveMutation = useMutation({
    mutationFn: () => (editing ? api.put(`/admin/categories/${editing.id}`, { name, type: tab }) : api.post("/admin/categories", { name, type: tab })),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Kategori berhasil diperbarui" : "Kategori berhasil dibuat");
      closeModal();
    },
    onError: (err) => setNameError(err.response?.data?.message ?? "Gagal menyimpan kategori"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      // Backend menolak dengan 400 bila masih dipakai proyek/artikel — tampilkan pesannya
      toast.error(err.response?.data?.message ?? "Gagal menghapus kategori");
      setDeleting(null);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError("Nama minimal 2 karakter");
      return;
    }
    setNameError(null);
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Kategori</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> Tambah Kategori
        </Button>
      </div>

      {/* Tab PROYEK / POST */}
      <div className="flex gap-1.5 rounded-xl bg-white p-1.5 shadow-soft sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-primary text-white shadow-soft" : "text-text-muted hover:bg-primary-soft hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={FolderTree} title="Belum ada kategori" description={`Tambahkan kategori pertama untuk ${tab === "PROJECT" ? "proyek" : "artikel"}.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Nama</th>
                  <th className="px-3 py-3.5 font-semibold">Slug</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id} className="transition hover:bg-primary-soft/40">
                    <td className="px-5 py-3 font-semibold text-text">
                      <Badge variant={tab === "PROJECT" ? "info" : "success"}>{tab === "PROJECT" ? "Proyek" : "Artikel"}</Badge>
                      <span className="ml-2">{c.name}</span>
                    </td>
                    <td className="px-3 py-3">
                      <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-text-muted">{c.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label={`Edit ${c.name}`}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          aria-label={`Hapus ${c.name}`}
                          className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"
                        >
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

      {/* Modal tambah/edit */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Kategori" : "Tambah Kategori"}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saveMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" form="category-form" loading={saveMutation.isPending}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} className="space-y-1" noValidate>
          <Input
            label="Nama kategori"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tab === "PROJECT" ? "Contoh: Gedung Bertingkat" : "Contoh: Tips Konstruksi"}
            error={nameError}
            autoFocus
          />
          <p className="text-xs text-text-muted">
            {tab === "PROJECT" ? "Kategori ini dipakai untuk proyek." : "Kategori ini dipakai untuk artikel."} Slug dibuat otomatis dari nama.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus kategori?"
        loading={deleteMutation.isPending}
        message={`Kategori "${deleting?.name}" akan dihapus permanen. Kategori yang masih dipakai proyek atau artikel tidak dapat dihapus.`}
      />
    </div>
  );
}
