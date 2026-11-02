// Form tambah/edit proyek — 6 tab: Info Utama, Spesifikasi, Cerita, Lokasi, Media, SEO
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
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
import MapPicker from "../../components/admin/MapPicker.jsx";
import { STATUS_LABEL } from "./Projects.jsx";

// Angka opsional: string kosong → null (bukan 0)
const numOpt = (schema) => z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), schema.nullable());
const dateOpt = z.preprocess((v) => (v === "" || v == null ? null : v), z.string().nullable());

// Mirip schema backend
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
  // Spesifikasi
  area: numOpt(z.number().int().positive().max(1_000_000)),
  floors: numOpt(z.number().int().min(0).max(200)),
  durationMonths: numOpt(z.number().int().positive().max(600)),
  startDate: dateOpt,
  endDate: dateOpt,
  architect: z.string().max(150).optional().or(z.literal("")),
  serviceId: z.string().optional().or(z.literal("")),
  // Cerita
  challenge: z.string().max(2000).optional().or(z.literal("")),
  solution: z.string().max(2000).optional().or(z.literal("")),
  result: z.string().max(2000).optional().or(z.literal("")),
  // Lokasi
  latitude: numOpt(z.number().min(-90).max(90)),
  longitude: numOpt(z.number().min(-180).max(180)),
  videoUrl: z.url("URL video tidak valid").max(300).optional().or(z.literal("")),
  // SEO
  metaTitle: z.string().max(150).optional().or(z.literal("")),
  metaDescription: z.string().max(300).optional().or(z.literal("")),
});

const TABS = [
  ["info", "Info Utama"],
  ["spesifikasi", "Spesifikasi"],
  ["cerita", "Cerita Proyek"],
  ["lokasi", "Lokasi"],
  ["media", "Media"],
  ["seo", "SEO"],
];

// Slug preview dari judul (versi ringan dari slugify server)
function slugify(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

// YouTube/Vimeo → URL embed untuk pratinjau
function embedUrl(url = "") {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

const EMPTY = {
  title: "", summary: "", description: "", location: "", clientName: "", year: new Date().getFullYear(),
  value: "", status: "PLANNING", categoryId: "",
  area: "", floors: "", durationMonths: "", startDate: "", endDate: "", architect: "", serviceId: "",
  challenge: "", solution: "", result: "", latitude: "", longitude: "", videoUrl: "",
  metaTitle: "", metaDescription: "",
};

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("info");
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState([]); // [{ url, caption? }]
  const [flags, setFlags] = useState({ isPublished: false, isFeatured: false });
  const [highlights, setHighlights] = useState([""]);
  const [tagsInput, setTagsInput] = useState(""); // dipisah koma
  const [videoPreview, setVideoPreview] = useState("");

  const { data: catData } = useQuery({
    queryKey: ["categories", "PROJECT"],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: "PROJECT", limit: 50 } })).data,
  });
  const { data: svcData } = useQuery({
    queryKey: ["services", "options"],
    queryFn: async () => (await api.get("/admin/services", { params: { limit: 50 } })).data,
  });

  // Data awal saat edit
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await api.get(`/admin/projects/${id}`)).data.data,
    enabled: isEdit,
  });

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: EMPTY,
  });

  // Isi form sekali data detail tersedia
  const filledId = existing?.id;
  useEffect(() => {
    if (!isEdit || !existing || filledId !== id) return;
    const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    reset({
      ...EMPTY,
      ...existing,
      value: existing.value ?? "",
      categoryId: existing.categoryId ?? "",
      serviceId: existing.serviceId ?? "",
      architect: existing.architect ?? "",
      challenge: existing.challenge ?? "",
      solution: existing.solution ?? "",
      result: existing.result ?? "",
      videoUrl: existing.videoUrl ?? "",
      metaTitle: existing.metaTitle ?? "",
      metaDescription: existing.metaDescription ?? "",
      area: existing.area ?? "",
      floors: existing.floors ?? "",
      durationMonths: existing.durationMonths ?? "",
      startDate: iso(existing.startDate),
      endDate: iso(existing.endDate),
      latitude: existing.latitude ?? "",
      longitude: existing.longitude ?? "",
    });
    setCoverImage(existing.coverImage);
    setImages(existing.images ?? []);
    setFlags({ isPublished: existing.isPublished, isFeatured: existing.isFeatured });
    setHighlights(existing.highlights?.length ? existing.highlights : [""]);
    setTagsInput(Array.isArray(existing.tags) ? existing.tags.join(", ") : "");
    setVideoPreview(existing.videoUrl ?? "");
  }, [isEdit, existing, filledId, id, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/admin/projects/${id}`, payload) : api.post("/admin/projects", payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isEdit ? "Proyek berhasil diperbarui" : "Proyek berhasil dibuat");
      navigate("/admin/proyek");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan proyek"),
  });

  const onSubmit = (values) => {
    if (!coverImage) {
      toast.error("Unggah cover image terlebih dahulu (tab Media)");
      setTab("media");
      return;
    }
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    saveMutation.mutate({
      ...values,
      value: values.value || null,
      year: Number(values.year),
      categoryId: values.categoryId || null,
      serviceId: values.serviceId || null,
      architect: values.architect || null,
      challenge: values.challenge || null,
      solution: values.solution || null,
      result: values.result || null,
      videoUrl: values.videoUrl || null,
      metaTitle: values.metaTitle || null,
      metaDescription: values.metaDescription || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      highlights: highlights.map((h) => h.trim()).filter(Boolean),
      tags,
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
  const watchedTitle = watch("title");
  const watchedMeta = watch("metaDescription");
  const numOrNull = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
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
        <Link to="/admin/proyek" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke daftar
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-3" noValidate>
        <div className="space-y-4 xl:col-span-2">
          {/* Tab */}
          <div role="tablist" aria-label="Bagian form proyek" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
            {TABS.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${tab === key ? "bg-primary text-white shadow-soft" : "text-text-muted hover:bg-primary-soft hover:text-primary"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <Card title="Info Utama" headerVariant="primary">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Judul" placeholder="Contoh: Pembangunan Jembatan Desa Sukamaju" error={errors.title?.message} {...register("title")} />
                  <p className="mt-1 text-xs text-text-muted">Slug otomatis: <code className="rounded bg-primary-soft px-1.5 py-0.5 text-primary">{slugPreview}</code></p>
                </div>
                <Textarea label="Ringkasan" placeholder="Ringkasan singkat untuk kartu proyek" error={errors.summary?.message} className="sm:col-span-2" {...register("summary")} />
                <Textarea label="Deskripsi Lengkap" rows={8} placeholder="Deskripsi lengkap proyek…" error={errors.description?.message} className="sm:col-span-2" {...register("description")} />
                <Input label="Lokasi (kota)" placeholder="Kab. Bandung" error={errors.location?.message} {...register("location")} />
                <Input label="Nama Klien" placeholder="Pemerintah Desa…" error={errors.clientName?.message} {...register("clientName")} />
                <Input label="Tahun" type="number" min={1990} max={2100} error={errors.year?.message} {...register("year")} />
                <Input label="Nilai Proyek" placeholder="Rp 1,2 M (opsional)" hint="Format bebas; kosongkan bila rahasia" error={errors.value?.message} {...register("value")} />
                <Select label="Status" error={errors.status?.message} {...register("status")}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Select label="Kategori" error={errors.categoryId?.message} {...register("categoryId")}>
                  <option value="">— Tanpa kategori —</option>
                  {(catData?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
            </Card>
          )}

          {tab === "spesifikasi" && (
            <Card title="Spesifikasi" headerVariant="primary">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Luas (m²)" type="number" min={1} placeholder="12500" error={errors.area?.message} {...register("area")} />
                <Input label="Jumlah Lantai" type="number" min={0} placeholder="8" error={errors.floors?.message} {...register("floors")} />
                <Input label="Durasi (bulan)" type="number" min={1} placeholder="20" error={errors.durationMonths?.message} {...register("durationMonths")} />
                <Input label="Arsitek" placeholder="Studio Arsitek Nusantara" error={errors.architect?.message} {...register("architect")} />
                <Input label="Tanggal Mulai" type="date" error={errors.startDate?.message} {...register("startDate")} />
                <Input label="Tanggal Selesai" type="date" hint="Kosongkan bila masih berjalan" error={errors.endDate?.message} {...register("endDate")} />
                <Select label="Layanan Terkait" className="sm:col-span-2" error={errors.serviceId?.message} {...register("serviceId")}>
                  <option value="">— Tidak ditautkan —</option>
                  {(svcData?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </Select>
              </div>
            </Card>
          )}

          {tab === "cerita" && (
            <Card title="Cerita Proyek" headerVariant="primary">
              <div className="space-y-4">
                <Textarea label="Tantangan" rows={3} placeholder="Apa kendala utama proyek ini?" error={errors.challenge?.message} {...register("challenge")} />
                <Textarea label="Solusi" rows={3} placeholder="Bagaimana kami mengatasinya?" error={errors.solution?.message} {...register("solution")} />
                <Textarea label="Hasil" rows={3} placeholder="Dampak / hasil akhir proyek" error={errors.result?.message} {...register("result")} />

                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold text-text">Poin Sorotan</legend>
                  <div className="space-y-2">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={h} onChange={(e) => setHighlights(highlights.map((x, j) => (j === i ? e.target.value : x)))}
                          placeholder={`Sorotan ${i + 1}`} aria-label={`Sorotan ${i + 1}`}
                          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} disabled={highlights.length === 1}
                          aria-label={`Hapus sorotan ${i + 1}`} className="rounded-lg p-2 text-text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-30">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="soft" size="sm" className="mt-2" onClick={() => setHighlights([...highlights, ""])}>
                    <Plus size={13} /> Tambah Sorotan
                  </Button>
                </fieldset>

                <div>
                  <label htmlFor="project-tags" className="mb-1.5 block text-sm font-medium text-text">Tag</label>
                  <input
                    id="project-tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="highrise, perkantoran, green-building"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-text-muted">Pisahkan dengan koma. Dipakai untuk pencarian &amp; tautan terkait.</p>
                </div>
              </div>
            </Card>
          )}

          {tab === "lokasi" && (
            <Card title="Lokasi" headerVariant="primary">
              <div className="space-y-4">
                <MapPicker
                  lat={numOrNull(watch("latitude"))}
                  lng={numOrNull(watch("longitude"))}
                  onChange={({ lat, lng }) => {
                    setValue("latitude", lat, { shouldDirty: true, shouldValidate: true });
                    setValue("longitude", lng, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Latitude" type="number" step="any" placeholder="-6.2915" error={errors.latitude?.message} {...register("latitude")} />
                  <Input label="Longitude" type="number" step="any" placeholder="106.8004" error={errors.longitude?.message} {...register("longitude")} />
                </div>
              </div>
            </Card>
          )}

          {tab === "media" && (
            <>
              <Card title="Cover" headerVariant="primary">
                <ImagePicker label="" value={coverImage} onChange={setCoverImage} />
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
                          <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Naikkan urutan" className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowUp size={15} /></button>
                          <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Turunkan urutan" className="rounded-lg p-1.5 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-30"><ArrowDown size={15} /></button>
                          <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} aria-label="Hapus gambar" className="rounded-lg p-1.5 text-text-muted transition hover:bg-danger-soft hover:text-danger"><X size={15} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Video" headerVariant="primary" bodyClassName="space-y-3">
                <Input label="URL Video (YouTube/Vimeo)" placeholder="https://www.youtube.com/watch?v=…" error={errors.videoUrl?.message}
                  {...register("videoUrl", { onChange: (e) => setVideoPreview(e.target.value) })} />
                {videoPreview ? (
                  <div className="aspect-video overflow-hidden rounded-xl bg-black">
                    <iframe src={embedUrl(videoPreview)} title="Pratinjau video proyek" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">Tempel tautan YouTube/Vimeo untuk pratinjau.</p>
                )}
              </Card>
            </>
          )}

          {tab === "seo" && (
            <Card title="SEO" headerVariant="primary">
              <div className="space-y-4">
                <Input label="Meta Title" placeholder={watchedTitle || "Judul halaman di hasil pencarian"} maxLength={150} error={errors.metaTitle?.message} {...register("metaTitle")} />
                <Textarea label="Meta Description" rows={3} maxLength={300} placeholder="Ringkasan 120–160 karakter untuk hasil pencarian" error={errors.metaDescription?.message} {...register("metaDescription")} />
                <p className="text-xs text-text-muted">{(watchedMeta ?? "").length}/300 karakter · kosongkan untuk memakai judul & ringkasan proyek.</p>
                {/* Pratinjau hasil pencarian */}
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-xs text-text-muted">Pratinjau Google</p>
                  <p className="mt-1 truncate text-sm text-[#1a0dab]">{watch("metaTitle") || watchedTitle || "Judul proyek"}</p>
                  <p className="truncate text-xs text-[#006621]">jayaabadi.co.id › proyek › {slugPreview}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{watch("metaDescription") || watch("summary") || "Deskripsi proyek…"}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Kolom samping: publikasi + simpan */}
        <div className="space-y-6">
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
