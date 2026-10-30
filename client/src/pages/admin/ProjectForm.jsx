// Form tambah/edit proyek — halaman terpisah
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowDown, ArrowUp, Save } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";
import { STATUS_LABEL } from "./Projects.jsx";

// Mirip schema backend — year otomatis dari string input
const projectSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  summary: z.string().min(10, "Ringkasan minimal 10 karakter").max(300),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  location: z.string().min(2, "Lokasi minimal 2 karakter").max(150),
  clientName: z.string().min(2, "Nama klien minimal 2 karakter").max(150),
  year: z.coerce.number().int().min(1990, "Tahun minimal 1990").max(2100),
  value: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["PLANNING", "ONGOING", "COMPLETED"]),
  categoryId: z.string().optional().or(z.literal("")),
});

// Slug preview dari judul (versi ringan dari slugify server)
function slugify(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState([]); // [{ url, caption? }]
  const [flags, setFlags] = useState({ isPublished: false, isFeatured: false });

  const { data: catData } = useQuery({
    queryKey: ["categories", "PROJECT"],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: "PROJECT", limit: 50 } })).data,
  });

  // Data awal saat edit
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await api.get(`/admin/projects/${id}`)).data.data,
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", summary: "", description: "", location: "", clientName: "", year: new Date().getFullYear(), value: "", status: "PLANNING", categoryId: "" },
  });

  // Isi form sekali data detail tersedia
  const filledId = existing?.id;
  useEffect(() => {
    if (!isEdit || !existing || filledId !== id) return;
    reset({
      title: existing.title,
      summary: existing.summary,
      description: existing.description,
      location: existing.location,
      clientName: existing.clientName,
      year: existing.year,
      value: existing.value ?? "",
      status: existing.status,
      categoryId: existing.categoryId ?? "",
    });
    setCoverImage(existing.coverImage);
    setImages(existing.images ?? []);
    setFlags({ isPublished: existing.isPublished, isFeatured: existing.isFeatured });
  }, [isEdit, existing, filledId, id, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/admin/projects/${id}`, payload) : api.post("/admin/projects", payload)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isEdit ? "Proyek berhasil diperbarui" : "Proyek berhasil dibuat");
      navigate("/admin/proyek");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan proyek"),
  });

  const onSubmit = (values) => {
    if (!coverImage) {
      toast.error("Unggah cover image terlebih dahulu");
      return;
    }
    saveMutation.mutate({
      ...values,
      value: values.value || null,
      year: Number(values.year),
      categoryId: values.categoryId || null,
      coverImage,
      images,
      ...flags,
    });
  };

  // Geser urutan galeri
  const moveImage = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };

  const slugPreview = slugify(watch("title")) || "otomatis-dari-judul";

  if (isEdit && loadingExisting) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" rounded="rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">{isEdit ? "Edit Proyek" : "Tambah Proyek"}</h1>
        <Link
          to="/admin/proyek"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary"
        >
          <ArrowLeft size={15} /> Kembali ke daftar
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-3" noValidate>
        {/* Kolom utama */}
        <div className="space-y-6 xl:col-span-2">
          <Card title="Informasi Proyek" headerVariant="primary">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Judul" placeholder="Contoh: Pembangunan Jembatan Desa Sukamaju" error={errors.title?.message} {...register("title")} />
                <p className="mt-1 text-xs text-text-muted">Slug otomatis: <code className="rounded bg-primary-soft px-1.5 py-0.5 text-primary">{slugPreview}</code></p>
              </div>
              <Textarea label="Ringkasan" placeholder="Ringkasan singkat untuk kartu proyek" error={errors.summary?.message} className="sm:col-span-2" {...register("summary")} />
              <Textarea label="Deskripsi Lengkap" rows={8} placeholder="Deskripsi lengkap proyek…" error={errors.description?.message} className="sm:col-span-2" {...register("description")} />
              <Input label="Lokasi" placeholder="Kab. Bandung" error={errors.location?.message} {...register("location")} />
              <Input label="Nama Klien" placeholder="Pemerintah Desa…" error={errors.clientName?.message} {...register("clientName")} />
              <Input label="Tahun" type="number" min={1990} max={2100} error={errors.year?.message} {...register("year")} />
              <Input label="Nilai Proyek" placeholder="Rp 1,2 M (opsional)" hint="Format bebas; kosongkan bila rahasia" error={errors.value?.message} {...register("value")} />
              <Select label="Status" error={errors.status?.message} {...register("status")}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
              <Select label="Kategori" error={errors.categoryId?.message} {...register("categoryId")}>
                <option value="">— Tanpa kategori —</option>
                {(catData?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </Card>

          <Card title="Galeri Foto" headerVariant="primary" bodyClassName="space-y-3">
            <ImagePicker label="" multiple value={images} onChange={setImages} />
            {images.length === 0 ? (
              <p className="text-xs text-text-muted">Belum ada foto galeri. Maksimal 10 gambar.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {images.map((img, i) => (
                  <li key={`${img.url}-${i}`} className="flex items-center gap-3 px-3 py-2">
                    <img src={img.url} alt="" className="h-10 w-14 rounded-lg object-cover" />
                    <span className="flex-1 truncate text-sm text-text-muted">{img.url.split("/").pop()}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Naikkan urutan" className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30">
                        <ArrowUp size={15} />
                      </button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Turunkan urutan" className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30">
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Kolom samping: cover, flag, simpan */}
        <div className="space-y-6">
          <Card title="Cover" headerVariant="primary">
            <ImagePicker label="" value={coverImage} onChange={setCoverImage} />
          </Card>

          <Card title="Publikasi" headerVariant="primary">
            <div className="space-y-4">
              <Switch label="Tampilkan di situs publik (terbit)" checked={flags.isPublished} onChange={(v) => setFlags((f) => ({ ...f, isPublished: v }))} />
              <Switch label="Tandai sebagai unggulan" checked={flags.isFeatured} onChange={(v) => setFlags((f) => ({ ...f, isFeatured: v }))} />
            </div>
          </Card>

          <Button type="submit" loading={saveMutation.isPending} className="w-full">
            <Save size={16} /> {isEdit ? "Simpan Perubahan" : "Buat Proyek"}
          </Button>
        </div>
      </form>
    </div>
  );
}
