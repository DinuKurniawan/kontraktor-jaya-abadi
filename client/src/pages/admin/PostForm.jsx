// Form tulis/edit artikel — rich text sederhana + readTime otomatis (preview)
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
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
import RichText from "../../components/admin/RichText.jsx";

const postSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  excerpt: z.string().min(10, "Ringkasan minimal 10 karakter").max(300),
  categoryId: z.string().optional().or(z.literal("")),
});

export default function PostForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState(null);
  const [isPublished, setIsPublished] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["categories", "POST"],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: "POST", limit: 50 } })).data,
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => (await api.get(`/admin/posts/${id}`)).data.data,
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
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", excerpt: "", content: "", categoryId: "" },
  });

  useEffect(() => {
    if (!isEdit || !existing || existing.id !== id) return;
    reset({ title: existing.title, excerpt: existing.excerpt, content: existing.content, categoryId: existing.categoryId ?? "" });
    setCoverImage(existing.coverImage);
    setContent(existing.content);
    setIsPublished(existing.isPublished);
  }, [isEdit, existing, id, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/admin/posts/${id}`, payload) : api.post("/admin/posts", payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(isEdit ? "Artikel berhasil diperbarui" : "Artikel berhasil dibuat");
      navigate("/admin/artikel");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan artikel"),
  });

  // Preview estimasi waktu baca (server menghitung ulang — angka ini hanya indikasi)
  const readTimePreview = (() => {
    const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  })();

  const onSubmit = (values) => {
    if (!coverImage) {
      toast.error("Unggah cover terlebih dahulu");
      return;
    }
    if (content.replace(/<[^>]*>/g, " ").trim().length < 20) {
      setContentError("Konten minimal 20 karakter");
      return;
    }
    setContentError(null);
    saveMutation.mutate({
      ...values,
      content,
      categoryId: values.categoryId || null,
      coverImage,
      isPublished,
    });
  };

  const slugPreview = (watch("title") || "otomatis-dari-judul")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

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
        <h1 className="font-display text-xl font-semibold text-text">{isEdit ? "Edit Artikel" : "Tulis Artikel"}</h1>
        <Link to="/admin/artikel" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke daftar
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-3" noValidate>
        <div className="space-y-6 xl:col-span-2">
          <Card title="Konten Artikel" headerVariant="primary">
            <div className="space-y-4">
              <Input label="Judul" placeholder="Judul artikel" error={errors.title?.message} {...register("title")} />
              <p className="-mt-2 text-xs text-text-muted">
                Slug otomatis: <code className="rounded bg-primary-soft px-1.5 py-0.5 text-primary">{slugPreview}</code>
              </p>
              <Textarea label="Ringkasan" rows={2} placeholder="Ringkasan untuk kartu & meta pencarian" error={errors.excerpt?.message} {...register("excerpt")} />
              <div>
                <p className="mb-1.5 text-sm font-medium text-text">
                  Konten <span className="text-xs font-normal text-text-muted">· estimasi {readTimePreview} menit baca</span>
                </p>
                <RichText value={content} onChange={(v) => { setContent(v); setContentError(null); }} error={contentError} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cover" headerVariant="primary">
            <ImagePicker label="" value={coverImage} onChange={setCoverImage} />
          </Card>

          <Card title="Organisasi" headerVariant="primary">
            <Select label="Kategori" error={errors.categoryId?.message} {...register("categoryId")}>
              <option value="">— Tanpa kategori —</option>
              {(catData?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Card>

          <Card title="Publikasi" headerVariant="primary">
            <div className="space-y-3">
              <Switch label="Terbitkan artikel" checked={isPublished} onChange={setIsPublished} />
              <p className="text-xs text-text-muted">
                {isPublished ? "Artikel tampil di situs publik; tanggal terbit dicatat otomatis." : "Disimpan sebagai draft."}
              </p>
            </div>
          </Card>

          <Button type="submit" loading={saveMutation.isPending} className="w-full">
            <Save size={16} /> {isEdit ? "Simpan Perubahan" : "Publikasikan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
