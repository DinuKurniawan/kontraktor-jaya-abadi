// Media library — grid, drag & drop + progress unggah, cari, detail (salin URL), hapus
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ImagePlus, Search, Trash2 } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import { uploadImages, copyUrl } from "../../components/admin/ImagePicker.jsx";

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Media() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(null); // 0-100 saat unggah
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["media", { page, search }],
    queryFn: async () => (await api.get("/media", { params: { page, limit: 12, search: search || undefined } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Media berhasil dihapus");
      setDeleting(null);
      setDetail(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menghapus media"),
  });

  // Unggah beberapa file + progres
  const handleFiles = async (files) => {
    if (!files?.length) return;
    setProgress(0);
    try {
      await uploadImages(files, setProgress);
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${files.length} gambar berhasil diunggah`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mengunggah");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold text-text">Media</h1>

      {/* Dropzone + pencarian */}
      <Card bodyClassName="!py-4">
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragOver ? "border-primary bg-primary-soft" : "border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
          }}
        >
          {progress !== null ? (
            <>
              <p className="text-sm font-medium text-text">Mengunggah… {progress}%</p>
              <div className="h-2 w-64 overflow-hidden rounded-full bg-primary-soft">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <ImagePlus size={24} className="text-primary" />
              <p className="text-sm text-text-muted">
                Tarik & lepas gambar ke sini, atau{" "}
                <button type="button" className="font-semibold text-primary underline" onClick={() => fileRef.current?.click()}>
                  pilih file
                </button>{" "}
                (JPG/PNG/WebP, maks 5MB)
              </p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ""; }} />
            </>
          )}
        </div>

        <div className="relative mt-3 max-w-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file…"
            aria-label="Cari media"
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={ImagePlus} title="Pustaka kosong" description="Unggah gambar pertama Anda lewat area di atas." />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {rows.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setDetail(m)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-white transition hover:shadow-soft"
            >
              <img src={m.url} alt={m.filename} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                {m.filename}
              </span>
            </button>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}

      {/* Detail media */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Media" size="sm">
        {detail && (
          <div className="space-y-4">
            <img src={detail.url} alt={detail.filename} className="max-h-64 w-full rounded-xl object-contain" />
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">Nama</dt>
                <dd className="truncate font-medium text-text">{detail.filename}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">Ukuran</dt>
                <dd className="font-medium text-text">{fmtSize(detail.size)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-text-muted">URL</dt>
                <dd className="truncate font-medium text-text">{detail.url}</dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyUrl(detail.url)}>
                <Copy size={14} /> Salin URL
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleting(detail)}>
                <Trash2 size={14} /> Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Hapus media?"
        message={`"${deleting?.filename}" akan dihapus dari pustaka & server. Gambar yang masih dipakai di konten akan hilang.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
