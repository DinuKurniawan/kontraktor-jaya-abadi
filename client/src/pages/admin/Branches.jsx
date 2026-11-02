// Admin cabang — kartu cabang + modal form lengkap dengan peta dan jam operasional.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Clock3, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";
import MapPicker from "../../components/admin/MapPicker.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DEFAULT_HOURS = () => DAYS.map((hari, index) => ({ hari, buka: "08:00", tutup: index === 5 ? "14:00" : "17:00", libur: index === 6 }));
const EMPTY = () => ({ name: "", address: "", city: "", phone: "", whatsapp: "", email: "", latitude: -6.2, longitude: 106.8166, mapEmbedUrl: "", openingHours: DEFAULT_HOURS(), photo: "", isMain: false, sortOrder: 0, isPublished: true });

function toForm(branch) {
  const hours = Array.isArray(branch.openingHours) ? branch.openingHours : [];
  return {
    ...branch,
    photo: branch.photo ?? "",
    openingHours: DAYS.map((hari, index) => hours.find((item) => item.hari === hari) ?? DEFAULT_HOURS()[index]),
  };
}

function Field({ label, required = false, children, className = "" }) {
  return <label className={`block space-y-1.5 ${className}`}><span className="text-sm font-medium text-text">{label}{required && <span className="text-danger"> *</span>}</span>{children}</label>;
}

const inputClass = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function Branches() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: async () => (await api.get("/admin/branches", { params: { limit: 50 } })).data,
  });
  const rows = data?.data ?? [];

  useEffect(() => {
    if (!form) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setForm(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [form]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
  const saveMutation = useMutation({
    mutationFn: (payload) => payload.id ? api.put(`/admin/branches/${payload.id}`, payload) : api.post("/admin/branches", payload),
    onSuccess: () => { invalidate(); setForm(null); toast.success("Cabang berhasil disimpan"); },
    onError: (error) => toast.error(error.response?.data?.message ?? "Gagal menyimpan cabang"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/branches/${id}`),
    onSuccess: (response) => { invalidate(); setDeleting(null); toast.success(response.data?.data?.message ?? "Cabang berhasil dihapus"); },
    onError: (error) => { setDeleting(null); toast.error(error.response?.data?.message ?? "Gagal menghapus cabang"); },
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateHour = (index, key, value) => setForm((current) => ({ ...current, openingHours: current.openingHours.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const submit = (event) => {
    event.preventDefault();
    const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), sortOrder: Number(form.sortOrder), photo: form.photo || null };
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-xl font-semibold text-text">Cabang</h1><p className="mt-1 text-sm text-text-muted">Kelola kantor dan lokasi layanan yang tampil di halaman kontak.</p></div>
        <Button onClick={() => setForm(EMPTY())}><Plus size={16} /> Tambah Cabang</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <Card key={item}><Skeleton className="aspect-[16/9] w-full" rounded="rounded-xl" /><Skeleton className="mt-4 h-5 w-2/3" /><Skeleton className="mt-2 h-4 w-full" /></Card>)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Building2} title="Belum ada cabang" description="Tambahkan kantor pertama untuk ditampilkan di halaman kontak." action={<Button size="sm" onClick={() => setForm(EMPTY())}><Plus size={14} /> Tambah Cabang</Button>} /></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((branch) => (
            <Card key={branch.id} bodyClassName="!p-0">
              <div className="relative aspect-[16/9] overflow-hidden bg-primary-soft">
                {branch.photo ? <img src={branch.photo} alt={branch.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary/40"><Building2 size={48} /></div>}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">{branch.isMain && <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">Kantor utama</span>}<span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${branch.isPublished ? "bg-success text-white" : "bg-black/60 text-white"}`}>{branch.isPublished ? "Publik" : "Draf"}</span></div>
              </div>
              <div className="space-y-3 p-5">
                <div><h2 className="font-display text-base font-semibold text-text">{branch.name}</h2><p className="mt-1 flex items-start gap-1.5 text-sm text-text-muted"><MapPin size={15} className="mt-0.5 shrink-0 text-primary" /> {branch.address}, {branch.city}</p></div>
                <div className="space-y-1 text-xs text-text-muted"><p className="flex items-center gap-1.5"><Phone size={13} /> {branch.phone}</p><p className="flex items-center gap-1.5"><Mail size={13} /> {branch.email}</p><p className="flex items-center gap-1.5"><Clock3 size={13} /> {branch.openingHours?.find((day) => !day.libur)?.buka ?? "—"}–{branch.openingHours?.find((day) => !day.libur)?.tutup ?? "—"}</p></div>
                <div className="flex justify-end gap-2 border-t border-border pt-3"><Button size="sm" variant="outline" onClick={() => setForm(toForm(branch))}><Pencil size={14} /> Edit</Button><Button size="sm" variant="danger" onClick={() => setDeleting(branch)}><Trash2 size={14} /> Hapus</Button></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => !saveMutation.isPending && setForm(null)} title={form?.id ? "Edit Cabang" : "Tambah Cabang"} size="lg" footer={<><Button variant="outline" onClick={() => setForm(null)} disabled={saveMutation.isPending}>Batal</Button><Button type="submit" form="branch-form" loading={saveMutation.isPending}>Simpan Cabang</Button></>}>
        {form && <form id="branch-form" onSubmit={submit} className="max-h-[72vh] space-y-6 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Nama cabang" required><input required value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClass} /></Field><Field label="Kota" required><input required value={form.city} onChange={(event) => update("city", event.target.value)} className={inputClass} /></Field></div>
          <Field label="Alamat lengkap" required><textarea required rows={2} value={form.address} onChange={(event) => update("address", event.target.value)} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Telepon" required><input required value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} /></Field><Field label="WhatsApp" required><input required value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} className={inputClass} /></Field><Field label="Email" required><input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={inputClass} /></Field></div>

          <div><h3 className="mb-3 text-sm font-semibold text-text">Koordinat lokasi</h3><MapPicker lat={form.latitude} lng={form.longitude} onChange={({ lat, lng }) => setForm((current) => ({ ...current, latitude: lat, longitude: lng }))} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Latitude" required><input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} className={inputClass} /></Field><Field label="Longitude" required><input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} className={inputClass} /></Field></div></div>
          <Field label="URL embed Google Maps" required><input required type="url" value={form.mapEmbedUrl} onChange={(event) => update("mapEmbedUrl", event.target.value)} placeholder="https://www.google.com/maps/embed?..." className={inputClass} /><p className="text-xs text-text-muted">Gunakan URL embed dari Google Maps, bukan URL halaman biasa.</p></Field>
          <ImagePicker label="Foto cabang" value={form.photo} onChange={(value) => update("photo", value)} />

          <div><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-text">Jam operasional</h3><p className="text-xs text-text-muted">Aktifkan switch libur untuk menonaktifkan jam pada hari tertentu.</p></div><Clock3 size={18} className="text-primary" /></div><div className="space-y-2 rounded-xl border border-border p-3">{form.openingHours.map((row, index) => <div key={row.hari} className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 text-sm"><span className="font-medium text-text">{row.hari}</span><input type="time" disabled={row.libur} value={row.buka} onChange={(event) => updateHour(index, "buka", event.target.value)} className={`${inputClass} disabled:bg-surface disabled:text-text-muted`} /><input type="time" disabled={row.libur} value={row.tutup} onChange={(event) => updateHour(index, "tutup", event.target.value)} className={`${inputClass} disabled:bg-surface disabled:text-text-muted`} /><Switch checked={row.libur} onChange={(value) => updateHour(index, "libur", value)} label="Libur" /></div>)}</div></div>

          <div className="grid gap-4 rounded-xl border border-border bg-surface/50 p-4 sm:grid-cols-3"><Field label="Urutan"><input type="number" min="0" value={form.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} className={inputClass} /></Field><div className="flex items-end pb-2"><Switch checked={form.isMain} onChange={(value) => update("isMain", value)} label="Kantor utama" /></div><div className="flex items-end pb-2"><Switch checked={form.isPublished} onChange={(value) => update("isPublished", value)} label="Tampilkan publik" /></div><p className="text-xs text-text-muted sm:col-span-3">Jika kantor utama diaktifkan, kantor utama sebelumnya akan otomatis dilepas.</p></div>
        </form>}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Hapus cabang?" message={`Cabang "${deleting?.name}" akan dihapus permanen.`} confirmLabel="Hapus" confirmVariant="danger" loading={deleteMutation.isPending} />
    </div>
  );
}
