// Form tulis/edit artikel — rich text sederhana + readTime otomatis (preview)
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, Plus, Save, Tag as TagIcon } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";
import RichText from "../../components/admin/RichText.jsx";

const postSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  excerpt: z.string().min(10, "Ringkasan minimal 10 karakter").max(300),
  categoryId: z.string().optional().or(z.literal("")),
  metaTitle: z.string().max(150, "Meta title maksimal 150 karakter").optional(),
  metaDescription: z.string().max(300, "Meta description maksimal 300 karakter").optional(),
});

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function PostForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["categories", "POST"],
    queryFn: async () => (await api.get("/admin/categories", { params: { type: "POST", limit: 50 } })).data,
  });

  const { data: tagData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get("/admin/tags", { params: { limit: 100 } })).data,
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
    defaultValues: { title: "", excerpt: "", content: "", categoryId: "", metaTitle: "", metaDescription: "" },
  });

  useEffect(() => {
    if (!isEdit || !existing || existing.id !== id) return;
    reset({
      title: existing.title,
      excerpt: existing.excerpt,
      content: existing.content,
      categoryId: existing.categoryId ?? "",
      metaTitle: existing.metaTitle ?? "",
      metaDescription: existing.metaDescription ?? "",
    });
    setCoverImage(existing.coverImage);
    setContent(existing.content);
    setIsPublished(existing.isPublished);
    setIsFeatured(existing.isFeatured);
    setPublishedAt(formatDateTimeLocal(existing.publishedAt));
    setSelectedTagIds((existing.tags ?? []).map((item) => item.tag?.id ?? item.id).filter(Boolean));
  }, [isEdit, existing, id, reset]);

  const createTagMutation = useMutation({
    mutationFn: (name) => api.post("/admin/tags", { name }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setSelectedTagIds((ids) => [...new Set([...ids, data.data.id])]);
      setNewTagName("");
      toast.success("Tag berhasil dibuat");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal membuat tag"),
  });

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

  const metaTitle = watch("metaTitle") || "";
  const metaDescription = watch("metaDescription") || "";

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
      isFeatured,
      publishedAt: isPublished && publishedAt ? new Date(publishedAt).toISOString() : null,
      tagIds: selectedTagIds,
    });
  };

  const slugPreview = (watch("title") || "otomatis-dari-judul")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  const toggleTag = (tagId) => setSelectedTagIds((ids) => (ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId]));
  const createTag = (event) => {
    event.preventDefault();
    const name = newTagName.trim();
    if (name.length >= 2) createTagMutation.mutate(name);
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
        <h1 className="font-display text-xl font-semibold text-text">{isEdit ? "Edit Artikel" : "Tulis Artikel"}</h1>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye size={16} /> Pratinjau
          </Button>
          <Link to="/admin/posts" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary">
            <ArrowLeft size={15} /> Kembali ke daftar
          </Link>
        </div>
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
            <div className="space-y-5">
              <Select label="Kategori" error={errors.categoryId?.message} {...register("categoryId")}>
                <option value="">— Tanpa kategori —</option>
                {(catData?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-text"><TagIcon size={15} /> Tag</p>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                  {(tagData?.data ?? []).length === 0 ? (
                    <p className="px-2 py-2 text-xs text-text-muted">Belum ada tag.</p>
                  ) : (tagData?.data ?? []).map((tag) => (
                    <label key={tag.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-surface">
                      <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
                      <span className="flex-1 truncate">{tag.name}</span>
                      <span className="text-[11px] text-text-muted">{tag.postCount ?? 0}</span>
                    </label>
                  ))}
                </div>
                <form onSubmit={createTag} className="flex gap-2">
                  <input
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                    placeholder="Buat tag baru"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <Button type="submit" size="sm" variant="soft" loading={createTagMutation.isPending} disabled={newTagName.trim().length < 2} aria-label="Buat tag baru">
                    <Plus size={15} />
                  </Button>
                </form>
              </div>
            </div>
          </Card>

          <Card title="SEO" headerVariant="primary">
            <div className="space-y-4">
              <div>
                <Input label="Meta title" placeholder="Judul untuk mesin pencari" error={errors.metaTitle?.message} {...register("metaTitle")} />
                <p className={`mt-1 text-right text-xs ${metaTitle.length > 150 ? "text-danger" : "text-text-muted"}`}>{metaTitle.length}/150</p>
              </div>
              <div>
                <Textarea label="Meta description" rows={4} placeholder="Deskripsi singkat untuk hasil pencarian" error={errors.metaDescription?.message} {...register("metaDescription")} />
                <p className={`mt-1 text-right text-xs ${metaDescription.length > 300 ? "text-danger" : "text-text-muted"}`}>{metaDescription.length}/300</p>
              </div>
            </div>
          </Card>

          <Card title="Publikasi" headerVariant="primary">
            <div className="space-y-3">
              <Switch label="Terbitkan artikel" checked={isPublished} onChange={setIsPublished} />
              <Switch label="Tandai sebagai unggulan" checked={isFeatured} onChange={setIsFeatured} />
              <Input
                type="datetime-local"
                label="Jadwal terbit"
                value={publishedAt}
                onChange={(event) => {
                  setPublishedAt(event.target.value);
                  if (event.target.value) setIsPublished(true);
                }}
                hint="Isi tanggal di masa depan untuk menjadwalkan artikel."
              />
              <p className="text-xs text-text-muted">
                {isPublished && publishedAt && new Date(publishedAt) > new Date() ? "Artikel akan terbit otomatis sesuai jadwal." : isPublished ? "Artikel tampil di situs publik." : "Disimpan sebagai draft."}
              </p>
            </div>
          </Card>

          <Button type="submit" loading={saveMutation.isPending} className="w-full">
            <Save size={16} /> {isEdit ? "Simpan Perubahan" : "Publikasikan"}
          </Button>
        </div>
      </form>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Pratinjau artikel" size="lg">
        <article className="max-h-[70vh] overflow-y-auto">
          {coverImage && <img src={coverImage} alt="" className="mb-5 aspect-[16/8] w-full rounded-xl object-cover" />}
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{(catData?.data ?? []).find((c) => c.id === watch("categoryId"))?.name ?? "Artikel"}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text">{watch("title") || "Judul artikel"}</h2>
          <p className="mt-2 text-sm text-text-muted">{watch("excerpt") || "Ringkasan artikel akan tampil di sini."}</p>
          <div className="prose-jaya mt-6" dangerouslySetInnerHTML={{ __html: content || "<p>Konten artikel akan tampil di sini.</p>" }} />
        </article>
      </Modal>
    </div>
  );
}
