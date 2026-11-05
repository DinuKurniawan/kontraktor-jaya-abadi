// Admin: daftar pelanggan newsletter — tabel + tambah + edit + hapus + ekspor CSV
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "../../components/ui/Toast.jsx";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function Subscribers() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => (await api.get("/admin/subscribers")).data.data,
  });
  const rows = data ?? [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/admin/subscribers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Pelanggan berhasil ditambahkan");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Gagal menambahkan pelanggan"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/subscribers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Pelanggan berhasil diperbarui");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Gagal memperbarui pelanggan"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/subscribers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Pelanggan berhasil dihapus");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Gagal menghapus pelanggan"),
  });

  const openCreate = () => {
    setEditingItem(null);
    setEmail("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setEmail(item.email);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setEmail("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email wajib diisi");
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: { email } });
    } else {
      createMutation.mutate({ email });
    }
  };

  const handleDelete = (id) => {
    if (confirm("Hapus pelanggan ini?")) {
      deleteMutation.mutate(id);
    }
  };

  // Ekspor CSV di sisi klien
  const exportCsv = () => {
    const csv = "email,created_at\n" + rows.map((r) => `${r.email},${r.createdAt}`).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "subscribers.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Pelanggan Newsletter</h1>
          <p className="mt-1 text-sm text-text-muted">Kelola daftar email pelanggan buletin dan promosi.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="inline-flex items-center gap-1.5">
            <Plus size={15} /> Tambah Pelanggan
          </Button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
          >
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Memuat…</p>
      ) : (
        <Card>
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Belum ada pelanggan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Tanggal daftar</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-neutral-50/50">
                      <td className="px-5 py-3 font-medium text-text">{r.email}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="rounded p-1.5 text-text-muted hover:bg-neutral-100 hover:text-text"
                            title="Edit Email"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="Hapus"
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
      )}

      {/* Modal Tambah / Edit Pelanggan */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Alamat Email</label>
            <Input
              type="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? "Simpan Perubahan" : "Tambah Pelanggan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
