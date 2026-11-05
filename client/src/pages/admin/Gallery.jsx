/*
 * Gallery — grid foto + filter kategori, unggah banyak sekaligus (ImagePicker multi),
 * edit caption & kategori via Modal, urutan naik/turun, publish, hapus massal.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Images, Pencil, Plus, Trash2, Trash } from "lucide-react";
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
import ImagePicker from "../../components/admin/ImagePicker.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import { GALLERY_CATEGORIES, GALLERY_CAT_LABEL } from "../../lib/gallery.js";

const CATEGORIES = GALLERY_CATEGORIES.map(([c]) => c);
const CAT_LABEL = GALLERY_CAT_LABEL;
const PAGE_SIZE = 8;

export default function Gallery() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [upload, setUpload] = useState(null); // form unggah banyak
  const [selected, setSelected] = useState([]);
  const [bulkDelete, setBulkDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await api.get("/admin/gallery", { params: { limit: 200 } })).data,
  });
  // Filter di klien — data maks ~200 item, murah & tab transisi instan
  const rows = useMemo(
    () => (data?.data ?? []).filter((g) => !filter || g.category === filter),
    [data, filter],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, activePage]);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["gallery"] });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/admin/gallery", payload),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan foto"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/admin/gallery/${id}`, payload),
    onSuccess: () => { invalidate(); toast.success("Foto berhasil diperbarui"); setModal(null); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal memperbarui foto"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/gallery/${id}`),
    onSuccess: () => { invalidate(); toast.success("Foto berhasil dihapus"); setBulkDelete(false); setSelected([]); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menghapus foto"),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids) => api.patch("/admin/gallery/reorder", { ids }),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan urutan"),
  });

  const move = (targetIndex, dir) => {
    const nextIndex = targetIndex + dir;
    if (nextIndex < 0 || nextIndex >= rows.length) return;
    const next = [...rows];
    [next[targetIndex], next[nextIndex]] = [next[nextIndex], next[targetIndex]];
    reorderMutation.mutate(next.map((r) => r.id));
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Galeri</h1>
        <Button onClick={() => setUpload({ images: [""], category: "KEGIATAN", isPublished: true })}>
          <Plus size={16} /> Unggah Foto
        </Button>
      </div>

      {/* Filter kategori + aksi massal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter kategori galeri">
          {[["", "Semua"], ...CATEGORIES.map((c) => [c, CAT_LABEL[c]])].map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => { setFilter(v); setPage(1); setSelected([]); }}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${filter === v ? "bg-primary text-white" : "bg-white text-text-muted hover:text-primary"}`}>
              {label}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <Button variant="danger" onClick={() => setBulkDelete(true)}>
            <Trash size={15} /> Hapus {selected.length} foto
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52" rounded="rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Images} title="Belum ada foto" description="Unggah foto kegiatan, proyek, kantor, atau penghargaan." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pagedRows.map((g, pageIndex) => {
              const globalIndex = (activePage - 1) * PAGE_SIZE + pageIndex;
              return (
                <Card key={g.id} bodyClassName="!p-0">
                  <div className="group relative">
                    <img src={g.image} alt={g.caption ?? "Galeri"} className="aspect-[4/3] w-full rounded-t-2xl object-cover" loading="lazy" />
                    {/* Kotak pilih untuk hapus massal */}
                    <label className="absolute left-2 top-2 cursor-pointer rounded-md bg-black/50 p-1.5">
                      <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} aria-label={`Pilih ${g.caption ?? "foto"}`} className="h-4 w-4 accent-primary" />
                    </label>
                    {!g.isPublished && <span className="absolute left-10 top-2"><Badge variant="neutral">Draft</Badge></span>}
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      <button type="button" onClick={() => move(globalIndex, -1)} disabled={globalIndex === 0 || reorderMutation.isPending} aria-label="Naikkan" className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => move(globalIndex, 1)} disabled={globalIndex === rows.length - 1 || reorderMutation.isPending} aria-label="Turunkan" className="rounded-lg bg-black/50 p-1.5 text-white transition hover:bg-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{CAT_LABEL[g.category]}</p>
                      <p className="truncate text-sm font-medium text-text">{g.caption ?? <span className="text-text-muted">Tanpa keterangan</span>}</p>
                      <div className="mt-2 flex gap-1.5">
                        <button type="button" onClick={() => setModal({ ...g, caption: g.caption ?? "" })} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-text transition hover:bg-primary-soft hover:text-primary"><Pencil size={12} /> Edit</button>
                        <button type="button" onClick={() => deleteMutation.mutate(g.id)} aria-label="Hapus foto" className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="pt-2">
            <Pagination page={activePage} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      {/* Modal unggah banyak: pecah jadi POST per foto */}
      <UploadModal
        modal={upload}
        onClose={() => setUpload(null)}
        onAdd={({ images, category, isPublished }) => {
          // Berurutan agar publikasi aman; error per item tetap dilaporkan oleh onError
          for (const image of images) createMutation.mutate({ image, category, isPublished });
          setUpload(null);
          toast.info(`${images.length} foto sedang diunggah…`);
        }}
      />
      <EditModal modal={modal} onClose={() => setModal(null)} onSave={(p) => updateMutation.mutate(p)} saving={updateMutation.isPending} />
      <ConfirmDialog
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        onConfirm={async () => { for (const id of selected) await deleteMutation.mutateAsync(id); }}
        title={`Hapus ${selected.length} foto?`}
        message="Foto yang dipilih akan dihapus permanen dari galeri."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// Unggah banyak: satu baris ImagePicker per foto
function UploadModal({ modal, onClose, onAdd }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (modal) { setForm(modal); setError(""); }
    else setForm(null); // reset saat modal ditutup agar benar-benar hilang
  }, [modal]);

  if (!form) return null;

  const submit = (e) => {
    e.preventDefault();
    const images = form.images.filter(Boolean);
    if (images.length === 0) return setError("Unggah minimal satu foto");
    // ponytail: POST berurutan (bukan bulk endpoint) — cukup untuk ≤ belasan foto; tambah endpoint massal bila sering > 20
    onAdd({ images, category: form.category, isPublished: form.isPublished, _multi: true });
    setForm(null);
  };

  return (
    <Modal open onClose={onClose} title={`Unggah Foto (${form.images.filter(Boolean).length})`} footer={
      <>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" form="gallery-upload" disabled={form.images.filter(Boolean).length === 0}>
          Unggah {form.images.filter(Boolean).length || ""} Foto
        </Button>
      </>
    }>
      <form id="gallery-upload" onSubmit={submit} className="space-y-4" noValidate>
        {form.images.map((img, i) => (
          <ImagePicker
            key={i}
            label={`Foto ${i + 1}`}
            value={img}
            onChange={(v) => setForm((f) => ({ ...f, images: f.images.map((x, j) => (j === i ? v : x)) }))}
          />
        ))}
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => setForm((f) => ({ ...f, images: [...f.images, ""] }))}>
            <Plus size={14} /> Tambah slot
          </Button>
          {form.images.length > 1 && (
            <Button variant="outline" type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.slice(0, -1) }))}>
              Hapus slot terakhir
            </Button>
          )}
        </div>
        <Select label="Kategori" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </Select>
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Modal>
  );
}

// Modal edit: gambar bisa diganti, caption & kategori
function EditModal({ modal, onClose, onSave, saving }) {
  const [form, setForm] = useState({});
  useEffect(() => { if (modal) setForm({ image: modal.image ?? "", caption: modal.caption ?? "", category: modal.category, isPublished: modal.isPublished ?? true }); }, [modal]);
  if (!modal) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!form.image) return toast.error("Gambar wajib ada");
    onSave({ id: modal.id, ...form, caption: form.caption || null });
  };

  return (
    <Modal open onClose={onClose} title="Edit Foto" footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button type="submit" form="gallery-edit" loading={saving}>Simpan</Button>
      </>
    }>
      <form id="gallery-edit" onSubmit={submit} className="space-y-4" noValidate>
        <ImagePicker label="Gambar" value={form.image ?? ""} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
        <Input label="Keterangan (opsional)" value={form.caption ?? ""} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} placeholder="Briefing pagi proyek…" />
        <Select label="Kategori" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </Select>
        <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Tampilkan di situs publik" />
      </form>
    </Modal>
  );
}
