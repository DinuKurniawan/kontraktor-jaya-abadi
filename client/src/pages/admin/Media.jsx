// Halaman Media — unggah dan memakai pustaka media bersama ImagePicker.
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import MediaLibrary from "../../components/admin/MediaLibrary.jsx";
import { uploadImages } from "../../components/admin/ImagePicker.jsx";
import StorageLimitOverlay from "../../components/admin/StorageLimitOverlay.jsx";
import { toast } from "../../components/ui/Toast.jsx";

export default function Media() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [storageError, setStorageError] = useState(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setProgress(0);
    try {
      await uploadImages(files, setProgress);
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${files.length} gambar berhasil diunggah`);
    } catch (error) {
      if (error?.response?.status === 507) {
        setStorageError(error);
      } else {
        toast.error(error.response?.data?.message ?? "Gagal mengunggah");
      }
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold text-text">Media</h1>
      <Card bodyClassName="!py-4">
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragOver ? "border-primary bg-primary-soft" : "border-border"}`}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles([...event.dataTransfer.files].filter((file) => file.type.startsWith("image/")));
          }}
        >
          {progress !== null ? (
            <>
              <p className="text-sm font-medium text-text">Mengunggah… {progress}%</p>
              <div className="h-2 w-64 overflow-hidden rounded-full bg-primary-soft"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
            </>
          ) : (
            <>
              <ImagePlus size={24} className="text-primary" />
              <p className="text-sm text-text-muted">
                Tarik &amp; lepas gambar ke sini, atau{" "}
                <button type="button" className="font-semibold text-primary underline" onClick={() => fileRef.current?.click()}>pilih file</button>{" "}
                (JPG/PNG/WebP, maks 5MB)
              </p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { handleFiles([...event.target.files]); event.target.value = ""; }} />
            </>
          )}
        </div>
      </Card>

      <MediaLibrary showDetails showCleanup />
      <StorageLimitOverlay error={storageError} onClose={() => setStorageError(null)} />
    </div>
  );
}
