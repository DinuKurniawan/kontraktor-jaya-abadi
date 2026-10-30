// Pengguna (SUPER_ADMIN saja) — tabel, Modal tambah/edit, reset password via edit
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const ROLE_LABEL = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", EDITOR: "Editor" };
const ROLE_VARIANT = { SUPER_ADMIN: "info", ADMIN: "success", EDITOR: "neutral" };

const emptyForm = { name: "", email: "", password: "", role: "EDITOR", isActive: true };

export default function Users() {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | {id, name, email, role, isActive}
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: async () => (await api.get("/users", { params: { page, limit: 10 } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const saveMutation = useMutation({
    mutationFn: ({ id, password, ...payload }) => {
      // Password kosong di edit = tidak diubah
      if (id) return api.put(`/users/${id}`, password ? { ...payload, password } : payload);
      return api.post("/users", { ...payload, password });
    },
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Pengguna berhasil diperbarui" : "Pengguna berhasil dibuat");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan pengguna"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/toggle-status`),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengubah status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Pengguna berhasil dihapus");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Gagal menghapus pengguna");
      setDeleting(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Pengguna</h1>
        <Button onClick={() => setModal({ ...emptyForm })}>
          <Plus size={16} /> Tambah Pengguna
        </Button>
      </div>

      <Card bodyClassName="!px-0 !py-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={UserCog} title="Belum ada pengguna" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3.5 font-semibold">Pengguna</th>
                  <th className="px-3 py-3.5 font-semibold">Role</th>
                  <th className="px-3 py-3.5 text-center font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((u) => (
                  <tr key={u.id} className="transition hover:bg-primary-soft/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-sm font-semibold text-white">
                          {u.name[0]?.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-text">
                            {u.name}
                            {u.id === me?.id && <span className="ml-1.5 text-xs font-normal text-text-muted">(Anda)</span>}
                          </p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role] ?? u.role}</Badge></td>
                    <td className="px-3 py-3 text-center">
                      {u.isActive ? <Badge variant="success">Aktif</Badge> : <Badge variant="danger">Nonaktif</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={u.id === me?.id}
                          title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          aria-label={`${u.isActive ? "Nonaktifkan" : "Aktifkan"} ${u.name}`}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"
                        >
                          {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button type="button" onClick={() => setModal({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive })} aria-label={`Edit ${u.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setDeleting(u)} disabled={u.id === me?.id} aria-label={`Hapus ${u.name}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-30">
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

      <UserModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus pengguna?"
        message={`Akun "${deleting?.name}" (${deleting?.email}) akan dihapus permanen.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function UserModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Isi form tiap kali modal dibuka
  const [lastKey, setLastKey] = useState(null);
  if (modal && lastKey !== (modal.id ?? "baru")) {
    setLastKey(modal.id ?? "baru");
    setForm({ name: modal.name ?? "", email: modal.email ?? "", password: "", role: modal.role ?? "EDITOR", isActive: modal.isActive ?? true });
    setErrors({});
  }

  if (!modal) return null;
  const isEdit = !!modal.id;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Nama minimal 2 karakter";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = "Format email tidak valid";
    if (!isEdit && form.password.length < 8) errs.password = "Password minimal 8 karakter";
    if (isEdit && form.password && form.password.length < 8) errs.password = "Password minimal 8 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: modal.id, name: form.name, email: form.email, password: form.password, role: form.role, isActive: form.isActive });
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Pengguna" : "Tambah Pengguna"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="user-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="user-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Nama" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} />
        <Input
          label={isEdit ? "Password Baru (opsional)" : "Password"}
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          error={errors.password}
          placeholder={isEdit ? "Kosongkan bila tidak diubah" : "Minimal 8 karakter"}
          autoComplete="new-password"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select label="Status" value={form.isActive ? "1" : "0"} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "1" }))}>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
