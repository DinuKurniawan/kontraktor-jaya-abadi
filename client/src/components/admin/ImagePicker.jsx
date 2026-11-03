// ImagePicker — pemilih gambar: buka Modal berisi pustaka media + tab unggah baru.
// Menggantikan input file langsung di form admin. value: url (single) | [{url}] (multiple).
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { toast } from "../ui/Toast.jsx";

// Unggah file dengan progres — dipakai ImagePicker & halaman Media
export async function uploadImages(files, onProgress) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  const res = await api.post("/media/upload", fd, { onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0) });
  return res.data.data;
}

// Tombol pembuka + preview kecil (meniru ImageUploader agar form tidak berubah banyak)
export default function ImagePicker({ value, onChange, multiple = false, label = "Gambar" }) {
  const [open, setOpen] = useState(false);

  // Pilih dari pustaka: single → url string; multiple → tambah ke array
  const pick = (m) => {
    if (multiple) {
      const has = (value ?? []).some((img) => img.url === m.url);
      onChange(has ? (value ?? []).filter((img) => img.url !== m.url) : [...(value ?? []), { url: m.url }]);
    } else {
      onChange(m.url);
      setOpen(false);
    }
  };

  const items = multiple ? value ?? [] : value ? [{ url: value }] : [];
  const removeAt = (i) => (multiple ? onChange(items.filter((_, idx) => idx !== i)) : onChange(""));

  return (
    <div className="space-y-2">
      <p className="block text-sm font-medium text-text">{label}</p>
      <div className="flex flex-wrap gap-3">
        {items.map((img, i) => (
          <div key={`${img.url}-${i}`} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Hapus gambar dari pilihan"
              className="absolute right-1 top-1 rounded-lg bg-danger/90 p-1 text-white"
            >
              ✕
            </button>
            {multiple && i === 0 && <span className="absolute inset-x-0 bottom-0 bg-primary/85 py-0.5 text-center text-[10px] font-semibold text-white">Galeri utama</span>}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-text-muted transition hover:border-primary hover:text-primary"
        >
          <ImagePlus size={20} />
          <span className="text-[10px]">Pilih gambar</span>
        </button>
      </div>

      <MediaBrowserModal open={open} onClose={() => setOpen(false)} selected={(items.map((i) => i.url))} onSelect={pick} />
    </div>
  );
}

// Modal pustaka media: tab Pustaka (grid + search) & Unggah (progress)
export function MediaBrowserModal({ open, onClose, selected = [], onSelect }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Pustaka");
  const [progress, setProgress] = useState(null);
  const fileRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["media", { page, search }],
    queryFn: async () => (await api.get("/media", { params: { page, limit: 12, search: search || undefined } })).data,
    enabled: open,
  });

  // Hapus media dari pustaka
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/media/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menghapus media"),
  });

  const handleFiles = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (files.length === 0) return;
    setProgress(0);
    try {
      await uploadImages(files, setProgress);
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${files.length} gambar berhasil diunggah`);
setTab("Pustaka");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mengunggah");
    } finally {
      setProgress(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Pilih Gambar" size="lg">
      {/* Tab + pencarian */}
      <div className="mb-4 flex items-center gap-2">
        {["Pustaka", "Unggah"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === t ? "bg-primary text-white" : "bg-surface text-text-muted hover:text-primary"}`}
          >
            {t}
          </button>
        ))}
        {tab === "Pustaka" && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file…"
            aria-label="Cari media"
            className="ml-auto w-48 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        )}
      </div>

      {tab === "Unggah" ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-10 text-text-muted transition hover:border-primary hover:text-primary">
          <ImagePlus size={28} />
          <span className="text-sm font-medium">{progress === null ? "Klik pilih file (JPG/PNG/WebP, maks 5MB)" : `Mengunggah… ${progress}%`}</span>
          {progress !== null && (
            <div className="h-2 w-56 overflow-hidden rounded-full bg-primary-soft">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={handleFiles} />
        </label>
      ) : isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" rounded="rounded-xl" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <EmptyState icon={ImagePlus} title="Pustaka kosong" description="Unggah gambar lewat tab Unggah." />
      ) : (
        <>
          <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {data.data.map((m) => {
              const isSelected = selected.includes(m.url);
              return (
                <div key={m.id} className={`relative overflow-hidden rounded-xl border-2 transition ${isSelected ? "border-primary" : "border-transparent hover:border-border"}`}>
                  <button type="button" onClick={() => onSelect(m)} className="block h-24 w-full" aria-label={`Pilih ${m.filename}`}>
                    <img src={m.url} alt={m.filename} className="h-full w-full object-cover" />
                    {isSelected && <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-[10px] font-semibold text-white">Terpilih</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(m.id)}
                    aria-label={`Hapus ${m.filename}`}
                    className="absolute left-1 top-1 rounded-lg bg-black/50 p-1 text-white opacity-0 transition hover:bg-danger group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          {data.meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Sebelumnya
              </Button>
              <span className="text-xs text-text-muted">
                {page} / {data.meta.totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya
              </Button>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Selesai
        </Button>
      </div>
    </Modal>
  );
}

// Helper kecil copy URL (dipakai halaman Media juga)
export async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("URL disalin");
  } catch {
    toast.error("Gagal menyalin URL");
  }
}
