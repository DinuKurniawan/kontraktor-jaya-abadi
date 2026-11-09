// BlogSidebar — konten tambahan artikel, newsletter, dan CTA konsultasi.
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Flame, Mail, MessageCircle, Tag as TagIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import api from "../../../lib/axios.js";
import { useSiteSettings } from "../home/HeroSection.jsx";
import { toast } from "../../ui/Toast.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const imageUrl = (path) => (!path ? "" : path.startsWith("http") ? path : `${SERVER}${path}`);

const TAG_STYLES = [
  "bg-brand-soft text-brand",
  "bg-cream-deep text-ink-soft",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
];

const formatDate = (date) => date && new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function BlogSidebar({ categories = [], tags = [], activeTag = "", onTagChange }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { data: settings } = useSiteSettings();
  const { data: popular = [], isLoading } = useQuery({
    queryKey: ["public-posts-popular-sidebar"],
    queryFn: async () => (await api.get("/public/posts/popular", { params: { limit: 5 } })).data.data,
    staleTime: 60 * 1000,
  });
  const categoryList = [...categories].filter((category) => category.slug && (category.count ?? 0) > 0).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const sortedTags = [...tags].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const subscribe = useMutation({
    mutationFn: async () => (await api.post("/public/subscribe", { email: email.trim() })).data,
    onSuccess: () => { setSubscribed(true); setEmail(""); },
    onError: (error) => toast.error(error.response?.data?.message ?? "Gagal berlangganan"),
  });
  const waNumber = String(settings?.company_whatsapp || settings?.whatsapp || "6281234567890").replace(/\D/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo Jaya Abadi, saya ingin konsultasi proyek.")}`;

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Artikel tambahan">
      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-brand" />
          <h2 className="font-jakarta text-lg font-extrabold text-ink">Artikel populer</h2>
        </div>
        {isLoading ? (
          <div className="mt-4 space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-cream-deep" />)}</div>
        ) : (
          <div className="mt-4 divide-y divide-ink/10">
            {popular.map((post, index) => (
              <Link key={post.id} to={`/artikel/${post.slug}`} className="flex gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <span className="pt-1 font-jakarta text-lg font-extrabold text-brand">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-ink transition-colors hover:text-brand">{post.title}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-light"><CalendarDays size={12} /> {formatDate(post.publishedAt)}</p>
                </div>
                {post.coverImage && <img src={imageUrl(post.coverImage)} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
              </Link>
            ))}
          </div>
        )}
        <Link to="/artikel?urutan=terpopuler" className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-strong hover:text-brand-dark">Lihat semua populer <ArrowRight size={14} /></Link>
      </section>

      {categoryList.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-cream-deep p-5">
          <h2 className="font-jakarta text-lg font-extrabold text-ink">Kategori artikel</h2>
          <div className="mt-3 space-y-1">
            {categoryList.map((category) => (
              <Link key={category.id ?? category.slug} to={`/artikel?kategori=${category.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-brand">
                <span>{category.name}</span><span className="text-xs text-ink-light">{category.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sortedTags.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <TagIcon size={17} className="text-brand" />
            <h2 className="font-jakarta text-lg font-extrabold text-ink">Tag populer</h2>
          </div>
          <div role="group" className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filter tag artikel">
            {sortedTags.map((item, index) => (
              <button
                key={item.id ?? item.slug}
                type="button"
                onClick={() => onTagChange?.(activeTag === item.slug ? "" : item.slug)}
                aria-pressed={activeTag === item.slug}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-brand hover:text-white ${activeTag === item.slug ? "bg-brand text-white" : TAG_STYLES[index % TAG_STYLES.length]}`}
              >
                #{item.name} <span className="ml-1 opacity-60">{item.count ?? 0}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-ink p-5 text-cream shadow-soft-lg">
        <div className="flex items-center gap-2 text-brand-light">
          <Mail size={18} />
          <h2 className="font-jakarta text-lg font-extrabold text-white">Tips konstruksi</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/80">Dapatkan wawasan dan inspirasi terbaru langsung di inbox Anda.</p>
        {subscribed ? (
          <p className="mt-4 text-sm font-semibold text-brand-light">Terima kasih! Email Anda sudah terdaftar.</p>
        ) : (
          <form className="mt-4 space-y-2" onSubmit={(event) => { event.preventDefault(); subscribe.mutate(); }}>
            <label htmlFor="sidebar-newsletter-email" className="sr-only">Email newsletter</label>
            <input id="sidebar-newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email Anda" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-light focus:border-brand" />
            <button type="submit" disabled={subscribe.isPending} className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{subscribe.isPending ? "Mendaftarkan…" : "Berlangganan"}</button>
          </form>
        )}
      </section>

      <section className="rounded-2xl bg-brand-dark p-5 text-white shadow-soft-lg">
        <MessageCircle size={22} className="text-white/80" />
        <h2 className="mt-3 font-jakarta text-lg font-extrabold">Punya rencana proyek?</h2>
        <p className="mt-2 text-sm leading-relaxed text-white">Ceritakan kebutuhan Anda. Tim Jaya Abadi siap membantu memberi arahan.</p>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-cream text-ink">Konsultasi via WhatsApp <ArrowRight size={15} /></a>
      </section>
    </aside>
  );
}
