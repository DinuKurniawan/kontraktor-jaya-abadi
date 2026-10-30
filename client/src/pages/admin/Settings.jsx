// Pengaturan Situs — form bertab, simpan ke PUT /admin/settings (key-value upsert)
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, BarChart3, Search, Share2, FileText, ScrollText, Save } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import ImagePicker from "../../components/admin/ImagePicker.jsx";

// Definisi tab: fields = [key, label, jenis, hint]; grup = subjudul dalam tab
const TABS = [
  {
    key: "profil", label: "Profil Perusahaan", icon: Building2,
    fields: [
      ["company_name", "Nama Perusahaan", "input"],
      ["company_tagline", "Tagline", "input"],
      ["company_logo", "Logo", "image"],
      ["company_address", "Alamat", "textarea"],
      ["company_phone", "Telepon", "input"],
      ["company_email", "Email", "input"],
      ["company_whatsapp", "WhatsApp", "input", "Format internasional tanpa +, mis. 6281234567890"],
      ["company_work_hours", "Jam Kerja", "input", "Contoh: Senin–Jumat 08.00–17.00"],
    ],
  },
  {
    key: "tentang", label: "Tentang Kami", icon: FileText,
    fields: [
      ["about_description", "Deskripsi", "textarea"],
      ["about_vision", "Visi", "textarea"],
      ["about_mission", "Misi", "textarea", "Pisahkan poin dengan baris baru"],
    ],
  },
  {
    key: "about-page", label: "Halaman Tentang", icon: ScrollText,
    groups: [
      {
        title: "Profil",
        fields: [
          ["about_headline", "Headline", "input"],
          ["about_story", "Cerita Perusahaan", "story", "Paragraf dipisah baris kosong"],
          ["about_image", "Foto Utama", "image"],
          ["about_video_url", "URL Video Profil", "input", "URL YouTube, mis. https://www.youtube.com/watch?v=..."],
        ],
      },
      {
        title: "Sambutan Direktur",
        fields: [
          ["director_name", "Nama Direktur", "input"],
          ["director_position", "Jabatan", "input"],
          ["director_photo", "Foto Direktur", "image"],
          ["director_quote", "Kutipan Singkat", "textarea"],
          ["director_message", "Isi Sambutan", "textarea", "Boleh beberapa paragraf"],
        ],
      },
      {
        title: "Legalitas",
        fields: [
          ["legal_nib", "NIB", "input"],
          ["legal_sbu", "SBU", "input"],
          ["legal_npwp", "NPWP", "input"],
          ["legal_address", "Alamat Legal", "textarea"],
        ],
      },
    ],
  },
  {
    key: "statistik", label: "Statistik", icon: BarChart3,
    fields: [
      ["homepage_stats_1", "Statistik 1 — Angka", "input", "Contoh: 120"],
      ["homepage_stats_1_label", "Statistik 1 — Label", "input", "Contoh: Proyek Selesai"],
      ["homepage_stats_2", "Statistik 2 — Angka", "input"],
      ["homepage_stats_2_label", "Statistik 2 — Label", "input"],
      ["homepage_stats_3", "Statistik 3 — Angka", "input"],
      ["homepage_stats_3_label", "Statistik 3 — Label", "input"],
      ["homepage_stats_4", "Statistik 4 — Angka", "input"],
      ["homepage_stats_4_label", "Statistik 4 — Label", "input"],
    ],
  },
  {
    key: "sosial", label: "Sosial Media", icon: Share2,
    fields: [
      ["social_instagram", "Instagram", "input", "URL lengkap profil"],
      ["social_facebook", "Facebook", "input"],
      ["social_linkedin", "LinkedIn", "input"],
      ["social_youtube", "YouTube", "input"],
      ["social_tiktok", "TikTok", "input"],
    ],
  },
  {
    key: "seo", label: "SEO Default", icon: Search,
    fields: [
      ["seo_meta_title", "Meta Title", "input", "Maksimal ±60 karakter agar tak terpotong Google"],
      ["seo_meta_description", "Meta Description", "textarea", "Maksimal ±160 karakter"],
    ],
  },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("profil");
  const [form, setForm] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/admin/settings")).data.data,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/admin/settings", payload),
    onSuccess: (res) => {
      queryClient.setQueryData(["settings"], res.data.data);
      toast.success("Pengaturan berhasil disimpan");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal menyimpan pengaturan"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" rounded="rounded-2xl" />
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.key === tab);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Kumpulkan field dari tab biasa maupun tab bergugus
  const activeFields = activeTab.fields ?? activeTab.groups?.flatMap((g) => g.fields) ?? [];

  // Kirim hanya field yang berubah sejak data terakhir dimuat
  const submit = (e) => {
    e.preventDefault();
    const payload = {};
    for (const [key] of activeFields) {
      if (form[key] !== (data?.[key] ?? "")) payload[key] = form[key] ?? "";
    }
    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold text-text">Pengaturan Situs</h1>

      <div className="flex flex-wrap gap-1.5 rounded-xl bg-white p-1.5 shadow-soft sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-primary text-white" : "text-text-muted hover:bg-primary-soft hover:text-primary"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <Card title={activeTab.label} headerVariant="primary" actions={<Save size={16} />}>
          {activeTab.groups
            ? activeTab.groups.map((g) => (
                <fieldset key={g.title} className="mb-8 last:mb-0">
                  <legend className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-primary">{g.title}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {g.fields.map(([key, label, jenis, hint]) => <Field key={key} k={key} label={label} jenis={jenis} hint={hint} form={form} setField={setField} />)}
                  </div>
                </fieldset>
              ))
            : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeTab.fields.map(([key, label, jenis, hint]) => <Field key={key} k={key} label={label} jenis={jenis} hint={hint} form={form} setField={setField} />)}
              </div>
            )}
          <div className="mt-5 flex justify-end border-t border-border pt-4">
            <Button type="submit" loading={saveMutation.isPending}>
              <Save size={16} /> Simpan {activeTab.label}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

// Field sesuai jenis; "story" = textarea besar + penghitung karakter
function Field({ k, label, jenis, hint, form, setField }) {
  const val = form[k] ?? "";
  return (
    <div className={jenis === "textarea" || jenis === "story" || jenis === "image" ? "sm:col-span-2" : ""}>
      {jenis === "textarea" ? (
        <Textarea label={label} rows={4} hint={hint} value={val} onChange={(e) => setField(k, e.target.value)} />
      ) : jenis === "story" ? (
        <div>
          <Textarea label={label} rows={10} hint={hint} value={val} onChange={(e) => setField(k, e.target.value)} />
          <p className="mt-1 text-right text-xs text-gray-400">{val.length.toLocaleString("id-ID")} karakter</p>
        </div>
      ) : jenis === "image" ? (
        <ImagePicker label={label} value={val} onChange={(v) => setField(k, v)} />
      ) : (
        <Input label={label} hint={hint} value={val} onChange={(e) => setField(k, e.target.value)} />
      )}
    </div>
  );
}
