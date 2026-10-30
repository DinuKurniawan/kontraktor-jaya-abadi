// Kontak — info dari settings, embed Google Maps, form pesan (Zod + honeypot)
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import PageBanner from "../../components/public/PageBanner.jsx";
import Seo from "../../components/public/Seo.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(150),
  phone: z.string().min(6, "Nomor telepon minimal 6 karakter").max(20),
  subject: z.string().min(3, "Subjek minimal 3 karakter").max(150),
  body: z.string().min(10, "Pesan minimal 10 karakter").max(2000),
  website: z.string().max(300).optional(), // honeypot — tersembunyi dari pengguna
});

export default function ContactPage() {
  const [sp] = useSearchParams();
  const layananSlug = sp.get("layanan") ?? "";
  const { data: services } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => (await api.get("/public/services")).data.data,
  });
  const layananTitle = services?.find((x) => x.slug === layananSlug)?.title ?? layananSlug;
  const { data: s } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/public/settings")).data.data,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", subject: layananTitle ? `Konsultasi ${layananTitle}` : "", body: "", website: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload) => api.post("/public/messages", payload),
    onSuccess: () => {
      toast.success("Pesan terkirim! Kami akan membalas segera.");
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengirim pesan — coba lagi nanti"),
  });

  const waNumber = (s?.company_whatsapp ?? "").replace(/\D/g, "");
  const infoItems = [
    [MapPin, "Alamat", s?.company_address, null],
    [Phone, "Telepon", s?.company_phone, s?.company_phone ? `tel:${s.company_phone.replace(/\s/g, "")}` : null],
    [Mail, "Email", s?.company_email, s?.company_email ? `mailto:${s.company_email}` : null],
    [MessageCircle, "WhatsApp", s?.company_whatsapp, waNumber ? `https://wa.me/${waNumber}` : null],
    [Clock, "Jam Kerja", s?.company_work_hours, null],
  ].filter(([, , value]) => value);

  const inputCls = (err) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand ${err ? "border-danger" : "border-ink/10"}`;

  return (
    <>
      <Seo path="/kontak" title="Kontak" description="Hubungi Jaya Abadi — telepon, WhatsApp, email, dan lokasi kantor." />
      <PageBanner
        title={<>Hubungi <span className="text-brand">Kami</span></>}
        crumbs={[{ label: "Kontak" }]}
        description="Diskusikan proyek Anda — kami balas cepat di jam kerja."
      />

      <Container className="grid gap-10 py-14 lg:grid-cols-5">
        {/* Info kontak */}
        <aside className="space-y-4 lg:col-span-2">
          {infoItems.map(([Icon, label, value, href]) => (
            <div key={label} className="flex gap-4 rounded-2xl bg-white p-4 shadow-soft">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">{label}</p>
                {href ? (
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="break-words text-sm font-semibold text-ink transition hover:text-brand">
                    {value}
                  </a>
                ) : (
                  <p className="break-words text-sm font-semibold text-ink">{value}</p>
                )}
              </div>
            </div>
          ))}

          {/* Maps */}
          {s?.maps_embed && (
            <div className="overflow-hidden rounded-2xl shadow-soft">
              <iframe
                src={s.maps_embed}
                title="Lokasi kantor Jaya Abadi"
                loading="lazy"
                className="h-64 w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
        </aside>

        {/* Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-2xl bg-white p-6 shadow-soft sm:p-8" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ct-name" className="mb-1.5 block text-sm font-semibold text-ink">Nama</label>
                <input id="ct-name" {...register("name")} className={inputCls(errors.name)} placeholder="Nama lengkap" />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="ct-email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
                <input id="ct-email" type="email" {...register("email")} className={inputCls(errors.email)} placeholder="nama@email.com" />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="ct-phone" className="mb-1.5 block text-sm font-semibold text-ink">Telepon</label>
                <input id="ct-phone" type="tel" {...register("phone")} className={inputCls(errors.phone)} placeholder="0812…" />
                {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
              </div>
              <div>
                <label htmlFor="ct-subject" className="mb-1.5 block text-sm font-semibold text-ink">Subjek</label>
                <input id="ct-subject" {...register("subject")} className={inputCls(errors.subject)} placeholder="Renovasi rumah 2 lantai" />
                {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ct-body" className="mb-1.5 block text-sm font-semibold text-ink">Pesan</label>
                <textarea id="ct-body" rows={5} {...register("body")} className={inputCls(errors.body)} placeholder="Ceritakan kebutuhan proyek Anda…" />
                {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
              </div>
            </div>

            {/* Honeypot — disembunyikan dari manusia, isi = bot */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="ct-website">Website</label>
              <input id="ct-website" tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="inline-flex items-center gap-1.5 text-xs text-ink-light">
                <CheckCircle2 size={14} className="text-brand" /> Data Anda aman & tidak dibagikan.
              </p>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 font-jakarta text-sm font-semibold text-white shadow-[0_10px_24px_rgba(242,107,58,0.30)] transition hover:bg-brand-dark disabled:opacity-60"
              >
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Kirim Pesan
              </button>
            </div>
          </form>
        </div>
      </Container>
    </>
  );
}
