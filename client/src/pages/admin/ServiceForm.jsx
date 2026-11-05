// Form tambah/edit layanan — pola ProjectForm
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save } from "lucide-react";
import api from "../../lib/axios.js";
import { SERVICE_ICONS } from "../../lib/service-icons.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Select from "../../components/ui/Select.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker, { uploadImages } from "../../components/admin/ImagePicker.jsx";
import ImageCropModal from "../../components/admin/ImageCropModal.jsx";
import AspectImage from "../../components/ui/AspectImage.jsx";

const serviceSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter").max(100),
  shortDesc: z.string().min(5, "Deskripsi singkat minimal 5 karakter").max(200),
  description: z.string().min(20, "Deskripsi lengkap minimal 20 karakter"),
  icon: z.string().min(1, "Pilih ikon"),
  sortOrder: z.coerce.number().int().min(0, "Urutan minimal 0"),
  categoryId: z.string().optional(),
});

function slugify(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

function ImageQualityNotice({ src, ratio, onCrop }) {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    if (!src) { setMetrics(null); return undefined; }
    const image = new Image();
    image.onload = () => setMetrics({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => setMetrics(null);
    image.src = src;
    return () => { image.onload = null; image.onerror = null; };
  }, [src]);
  if (!metrics) return null;
  const expected = ratio === "16/9" ? 16 / 9 : 4 / 3;
  const actual = metrics.width / metrics.height;
  const warning = Math.abs(actual - expected) / expected > 0.15 || metrics.width < 800;
  if (!warning) return null;
  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <p>Rasio atau resolusi gambar kurang sesuai ({metrics.width}×{metrics.height}). Disarankan rasio {ratio} dan lebar minimal 800 px.</p>
      <Button type="button" size="sm" variant="outline" className="mt-2 border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200" onClick={onCrop}>Potong &amp; Atur</Button>
    </div>
  );
}

export default function ServiceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [image, setImage] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [crop, setCrop] = useState(null);
  const [cropSaving, setCropSaving] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => (await api.get(`/admin/services/${id}`)).data.data,
    enabled: isEdit,
  });

  const { data: categoryData } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => (await api.get("/admin/service-categories", { params: { limit: 100 } })).data,
  });
  const serviceCategories = categoryData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", shortDesc: "", description: "", icon: "Wrench", sortOrder: 0, categoryId: "" },
  });

  // Isi form saat data detail tersedia
  useEffect(() => {
    if (!isEdit || !existing || existing.id !== id) return;
    reset({ title: existing.title, shortDesc: existing.shortDesc, description: existing.description, icon: existing.icon, sortOrder: existing.sortOrder, categoryId: existing.categoryId ?? "" });
    setImage(existing.image ?? "");
    setHeroImage(existing.heroImage ?? "");
    setIsPublished(existing.isPublished);
  }, [isEdit, existing, id, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/admin/services/${id}`, payload) : api.post("/admin/services", payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["service", id] });
      }
      toast.success(isEdit ? "Layanan berhasil diperbarui" : "Layanan berhasil dibuat");
      navigate("/admin/layanan");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan layanan"),
  });

  const categoryMutation = useMutation({
    mutationFn: () => api.post("/admin/service-categories", { name: categoryName.trim() }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      setValue("categoryId", data.data.id, { shouldDirty: true });
      setCategoryModalOpen(false);
      setCategoryName("");
      setCategoryError("");
      toast.success("Kategori layanan berhasil dibuat");
    },
    onError: (err) => setCategoryError(err.response?.data?.message ?? "Gagal membuat kategori"),
  });

  const onSubmit = (values) => {
    saveMutation.mutate({ ...values, sortOrder: Number(values.sortOrder), image: image || null, heroImage: heroImage || null, categoryId: values.categoryId || null, isPublished });
  };

  const saveCrop = async (file) => {
    setCropSaving(true);
    try {
      const uploaded = await uploadImages([file], undefined, crop.purpose);
      const url = uploaded[0]?.url;
      if (!url) throw new Error("URL hasil potongan tidak tersedia");
      if (crop.purpose === "service-card") setImage(url);
      else setHeroImage(url);
      setCrop(null);
      toast.success("Gambar berhasil dipotong dan dipilih");
    } catch (error) {
      toast.error(error.response?.data?.message ?? error.message ?? "Gagal mengunggah hasil potongan");
    } finally {
      setCropSaving(false);
    }
  };

  const slugPreview = slugify(watch("title")) || "otomatis-dari-judul";
  const openCategoryModal = () => {
    setCategoryName("");
    setCategoryError("");
    setCategoryModalOpen(true);
  };

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
              <div>
                <Select label="Kategori layanan" {...register("categoryId")}>
                  <option value="">Tanpa kategori</option>
                  {serviceCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
                <button type="button" onClick={openCategoryModal} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <Plus size={13} /> Kategori baru
                </button>
              </div>
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

          <Card title="Gambar layanan" headerVariant="primary" bodyClassName="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Gambar kartu</p>
              <ImagePicker label="" value={image} onChange={setImage} purpose="service-card" />
              <p className="mt-2 text-xs text-text-muted">Gambar kartu: rasio 4:3, ideal 1200×900 px (min 800 px).</p>
              <AspectImage src={image} alt="Pratinjau kartu layanan" ratio="4/3" className="mt-3 rounded-xl" />
              <ImageQualityNotice src={image} ratio="4/3" onCrop={() => setCrop({ src: image, ratio: "4/3", purpose: "service-card" })} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Gambar hero</p>
              <ImagePicker label="" value={heroImage} onChange={setHeroImage} purpose="service-hero" />
              <p className="mt-2 text-xs text-text-muted">Gambar hero: rasio 16:9, ideal 1920×1080 px.</p>
              <AspectImage src={heroImage} alt="Pratinjau hero layanan" ratio="16/9" className="mt-3 rounded-xl" />
              <ImageQualityNotice src={heroImage} ratio="16/9" onCrop={() => setCrop({ src: heroImage, ratio: "16/9", purpose: "service-hero" })} />
            </div>
            <p className="text-xs text-text-muted">Jika gambar kartu kosong, ikon yang dipilih menjadi tampilan kartu.</p>
          </Card>

          <Card title="Publikasi" headerVariant="primary">
            <Switch label="Tampilkan di situs publik" checked={isPublished} onChange={setIsPublished} />
          </Card>

          <Button type="submit" loading={saveMutation.isPending} className="w-full">
            <Save size={16} /> {isEdit ? "Simpan Perubahan" : "Buat Layanan"}
          </Button>
        </div>
      </form>
      <ImageCropModal open={!!crop} src={crop?.src} ratio={crop?.ratio} onClose={() => !cropSaving && setCrop(null)} onSave={saveCrop} />
      <Modal
        open={categoryModalOpen}
        onClose={() => !categoryMutation.isPending && setCategoryModalOpen(false)}
        title="Tambah Kategori Layanan"
        size="sm"
        footer={<><Button variant="outline" onClick={() => setCategoryModalOpen(false)} disabled={categoryMutation.isPending}>Batal</Button><Button type="submit" form="service-category-form" loading={categoryMutation.isPending}>Simpan</Button></>}
      >
        <form id="service-category-form" onSubmit={(event) => { event.preventDefault(); if (categoryName.trim().length < 2) { setCategoryError("Nama minimal 2 karakter"); return; } categoryMutation.mutate(); }} className="space-y-1" noValidate>
          <Input label="Nama kategori" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Contoh: Konstruksi" error={categoryError} autoFocus />
          <p className="text-xs text-text-muted">Slug kategori dibuat otomatis dari nama.</p>
        </form>
      </Modal>
    </div>
  );
}
