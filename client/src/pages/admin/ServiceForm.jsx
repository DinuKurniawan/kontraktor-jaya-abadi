// Form tambah/edit layanan — pola ProjectForm
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import api from "../../lib/axios.js";
import { SERVICE_ICONS } from "../../lib/service-icons.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

const serviceSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter").max(100),
  shortDesc: z.string().min(5, "Deskripsi singkat minimal 5 karakter").max(200),
  description: z.string().min(20, "Deskripsi lengkap minimal 20 karakter"),
  icon: z.string().min(1, "Pilih ikon"),
  sortOrder: z.coerce.number().int().min(0, "Urutan minimal 0"),
});

function slugify(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ServiceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [image, setImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => (await api.get(`/admin/services/${id}`)).data.data,
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", shortDesc: "", description: "", icon: "Wrench", sortOrder: 0 },
  });

  // Isi form saat data detail tersedia
  useEffect(() => {
    if (!isEdit || !existing || existing.id !== id) return;
    reset({ title: existing.title, shortDesc: existing.shortDesc, description: existing.description, icon: existing.icon, sortOrder: existing.sortOrder });
    setImage(existing.image ?? "");
    setIsPublished(existing.isPublished);
  }, [isEdit, existing, id, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/admin/services/${id}`, payload) : api.post("/admin/services", payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(isEdit ? "Layanan berhasil diperbarui" : "Layanan berhasil dibuat");
      navigate("/admin/layanan");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan layanan"),
  });

  const onSubmit = (values) => {
    saveMutation.mutate({ ...values, sortOrder: Number(values.sortOrder), image: image || null, isPublished });
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
        <h1 className="font-display text-xl font-semibold text-text">{isEdit ? "Edit Layanan" : "Tambah Layanan"}</h1>
        <Link to="/admin/layanan" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke daftar
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-3" noValidate>
        <div className="space-y-6 xl:col-span-2">
          <Card title="Informasi Layanan" headerVariant="primary">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Judul" placeholder="Contoh: Renovasi Rumah" error={errors.title?.message} {...register("title")} />
                <p className="mt-1 text-xs text-text-muted">
                  Slug otomatis: <code className="rounded bg-primary-soft px-1.5 py-0.5 text-primary">{slugPreview}</code>
                </p>
              </div>
              <Textarea label="Deskripsi Singkat" rows={2} placeholder="Satu kalimat untuk kartu layanan" error={errors.shortDesc?.message} className="sm:col-span-2" {...register("shortDesc")} />
              <Textarea label="Deskripsi Lengkap" rows={8} placeholder="Jelaskan cakupan layanan…" error={errors.description?.message} className="sm:col-span-2" {...register("description")} />
              <Input label="Urutan Tampil" type="number" min={0} hint="Angka kecil tampil lebih dulu; urutkan juga dari tombol naik/turun" error={errors.sortOrder?.message} {...register("sortOrder")} />
            </div>
          </Card>
        </div>

        {/* Kolom samping */}
        <div className="space-y-6">
          <Card title="Ikon" headerVariant="primary">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(SERVICE_ICONS).map(([name, Icon]) => {
                const active = watch("icon") === name;
                return (
                  // eslint-disable-next-line react/jsx-no-undef
                  <button
                    key={name}
                    type="button"
                    onClick={() => setValue("icon", name, { shouldDirty: true })}
                    aria-pressed={active}
                    aria-label={`Ikon ${name}`}
                    className={`flex h-12 items-center justify-center rounded-xl border transition ${
                      active ? "border-primary bg-primary-soft text-primary shadow-soft" : "border-border text-text-muted hover:bg-surface"
                    }`}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
            {errors.icon && <p className="mt-2 text-xs text-danger">{errors.icon.message}</p>}
          </Card>

          <Card title="Gambar (opsional)" headerVariant="primary">
            <ImagePicker label="" value={image} onChange={setImage} />
            <p className="mt-2 text-xs text-text-muted">Jika kosong, ikon yang dipilih menjadi tampilan kartu.</p>
          </Card>

          <Card title="Publikasi" headerVariant="primary">
            <Switch label="Tampilkan di situs publik" checked={isPublished} onChange={setIsPublished} />
          </Card>

          <Button type="submit" loading={saveMutation.isPending} className="w-full">
            <Save size={16} /> {isEdit ? "Simpan Perubahan" : "Buat Layanan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
