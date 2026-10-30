// Harga estimasi — tabel per tipe bangunan, format Rupiah, edit inline via Modal
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";

// Format angka → Rupiah (Rp 4.500.000)
export const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const TYPE_LABEL = { RUMAH: "Rumah", RUKO: "Ruko", RENOVASI: "Renovasi", INTERIOR: "Interior" };
const TYPE_VARIANT = { RUMAH: "info", RUKO: "warning", RENOVASI: "neutral", INTERIOR: "success" };

export default function EstimatePrices() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["estimate-prices"],
    queryFn: async () => (await api.get("/admin/estimate-prices", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["estimate-prices"] });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...payload }) => (id ? api.put(`/admin/estimate-prices/${id}`, payload) : api.post("/admin/estimate-prices", payload)),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.id ? "Harga estimasi berhasil diperbarui" : "Harga estimasi berhasil ditambahkan");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan harga estimasi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/estimate-prices/${id}`),
    onSuccess: () => { invalidate(); toast.success("Harga estimasi berhasil dihapus"); setDeleting(null); },
    onError: (err) => { toast.error(err.response?.data?.message ?? "Gagal menghapus"); setDeleting(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Harga Estimasi</h1>
        <Button onClick={() => setModal({ buildingType: "RUMAH", label: "", pricePerM2Min: "", pricePerM2Max: "", isPublished: true })}>
          <Plus size={16} /> Tambah Harga
        </Button>
      </div>

      {isLoading ? (
        <Card><Skeleton className="h-48" rounded="rounded-xl" /></Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Banknote} title="Belum ada harga estimasi" description="Isi kisaran harga per m² untuk kalkulator beranda." /></Card>
      ) : (
        <Card bodyClassName="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Harga/m² Minimum</th>
                  <th className="px-4 py-3">Harga/m² Maksimum</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><Badge variant={TYPE_VARIANT[r.buildingType] ?? "neutral"}>{TYPE_LABEL[r.buildingType] ?? r.buildingType}</Badge></td>
                    <td className="px-4 py-3 font-medium text-text">{r.label}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{rupiah(r.pricePerM2Min)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{rupiah(r.pricePerM2Max)}</td>
                    <td className="px-4 py-3">{r.isPublished ? <Badge variant="success">Publik</Badge> : <Badge variant="neutral">Draft</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setModal({ ...r, pricePerM2Min: String(r.pricePerM2Min), pricePerM2Max: String(r.pricePerM2Max) })} aria-label={`Edit ${r.label}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary"><Pencil size={13} /></button>
                        <button type="button" onClick={() => setDeleting(r)} aria-label={`Hapus ${r.label}`} className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <EstimateModal modal={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isPending} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus harga estimasi?" message={`"${deleting?.label}" akan dihapus permanen.`} loading={deleteMutation.isPending} />
    </div>
  );
}

function EstimateModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({ buildingType: "RUMAH", label: "", pricePerM2Min: "", pricePerM2Max: "", isPublished: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modal) setForm({ buildingType: modal.buildingType ?? "RUMAH", label: modal.label ?? "", pricePerM2Min: modal.pricePerM2Min ?? "", pricePerM2Max: modal.pricePerM2Max ?? "", isPublished: modal.isPublished ?? true });
  }, [modal]);

  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    const min = Number(form.pricePerM2Min);
    const max = Number(form.pricePerM2Max);
    if (form.label.trim().length < 2) errs.label = "Label minimal 2 karakter";
    if (!Number.isInteger(min) || min < 0) errs.pricePerM2Min = "Nominal tidak valid";
    if (!Number.isInteger(max) || max < 0) errs.pricePerM2Max = "Nominal tidak valid";
    if (!errs.pricePerM2Min && !errs.pricePerM2Max && max < min) errs.pricePerM2Max = "Maksimum tidak boleh di bawah minimum";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      id: modal.id,
      buildingType: form.buildingType,
      label: form.label,
      pricePerM2Min: min,
      pricePerM2Max: max,
      isPublished: form.isPublished,
    });
  };

  return (
    <Modal open onClose={onClose} title={modal.id ? "Edit Harga Estimasi" : "Tambah Harga Estimasi"} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="estimate-form" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="estimate-form" onSubmit={submit} className="space-y-4" noValidate>
        <Select label="Tipe Bangunan" value={form.buildingType} onChange={(e) => setForm((f) => ({ ...f, buildingType: e.target.value }))}>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Input label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} error={errors.label} placeholder="Rumah Tinggal (Standar)" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Harga/m² Minimum" type="number" min="0" value={form.pricePerM2Min} onChange={(e) => setForm((f) => ({ ...f, pricePerM2Min: e.target.value }))} error={errors.pricePerM2Min} hint="Contoh: 4500000" />
          <Input label="Harga/m² Maksimum" type="number" min="0" value={form.pricePerM2Max} onChange={(e) => setForm((f) => ({ ...f, pricePerM2Max: e.target.value }))} error={errors.pricePerM2Max} hint="Contoh: 6500000" />
        </div>
        {(form.pricePerM2Min || form.pricePerM2Max) && (
          <p className="rounded-lg bg-surface px-3 py-2 text-sm text-text-muted">
            Pratinjau: {rupiah(form.pricePerM2Min)} – {rupiah(form.pricePerM2Max)} per m²
          </p>
        )}
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
