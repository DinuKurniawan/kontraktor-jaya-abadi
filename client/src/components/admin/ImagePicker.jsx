// ImagePicker — pemilih gambar: buka Modal berisi pustaka media + tab unggah baru.
// Menggantikan input file langsung di form admin. value: url (single) | [{url}] (multiple).
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import api from "../../lib/axios.js";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import ImageWithFallback from "../ui/ImageWithFallback.jsx";
import MediaLibrary from "./MediaLibrary.jsx";
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
            <ImageWithFallback src={img.url} alt="" className="h-full w-full object-cover" />
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

      <MediaBrowserModal
        open={open}
        onClose={() => setOpen(false)}
        selected={items.map((i) => i.url)}
        onSelect={pick}
        onDeleted={(deleted) => {
          const deletedUrls = new Set(deleted.map((media) => media.url));
          if (multiple) onChange(items.filter((item) => !deletedUrls.has(item.url)));
          else if (value && deletedUrls.has(value)) onChange("");
          if (items.some((item) => deletedUrls.has(item.url))) toast.success("Gambar yang terpilih telah dihapus");
        }}
      />
    </div>
  );
}

// Modal pustaka media: tab Pustaka (grid + search) & Unggah (progress)
export function MediaBrowserModal({ open, onClose, selected = [], onSelect, onDeleted }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Pustaka");
  const [progress, setProgress] = useState(null);
  const fileRef = useRef(null);

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
      ) : <MediaLibrary open={open} selected={selected} onSelect={onSelect} onDeleted={onDeleted} showCleanup />}

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
