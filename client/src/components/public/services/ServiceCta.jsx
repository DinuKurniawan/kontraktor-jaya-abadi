/*
 * ServiceCta — CTA penutup: kiri judul + 3 jaminan + nomor telepon besar;
 * kanan form singkat (layanan dropdown dari query ?layanan= / tab aktif, nama,
 * WhatsApp, kebutuhan) → POST /api/public/messages. Notifikasi sukses inline,
 * anti kirim ganda (state sending), honeypot.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, Check, Phone, ShieldCheck, Wallet } from "lucide-react";
import api from "../../../lib/axios.js";
import { useSiteSettings } from "../home/HeroSection.jsx";

const GUARANTEES = [
  [ShieldCheck, "Garansi struktur 5 tahun"],
  [Wallet, "RAB transparan tanpa biaya tersembunyi"],
  [BadgeCheck, "Progress report mingguan"],
];

export default function ServiceCta({ services, activeSlug }) {
  const { data: settings } = useSiteSettings();
  const [sp] = useSearchParams();
  const prefill = sp.get("layanan") || activeSlug || "";
  const [form, setForm] = useState({ service: prefill, name: "", phone: "", note: "", website: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  // Query string berubah (pilihan tab layanan) → sinkronkan dropdown
  useEffect(() => {
    setForm((f) => ({ ...f, service: prefill || f.service }));
  }, [prefill]);

  const phone = settings?.company_phone ?? "(021) 555-0123";
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const svc = (services ?? []).find((s) => s.slug === form.service);
    if (form.name.trim().length < 2) return setErr("Nama minimal 2 karakter");
    if (form.phone.trim().length < 6) return setErr("Nomor WhatsApp minimal 6 karakter");
    if (form.note.trim().length < 10) return setErr("Ceritakan kebutuhan Anda (min. 10 karakter)");
    setSending(true);
    try {
      await api.post("/public/messages", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        subject: `Konsultasi layanan${svc ? ` — ${svc.title}` : ""}`,
        body: form.note.trim(),
        website: form.website, // honeypot
      });
      setDone(true);
    } catch {
      setErr("Gagal mengirim — coba lagi atau hubungi kami lewat telepon.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-brand py-16 sm:py-20" id="kontak-cta">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
        {/* Kiri: judul + jaminan + telepon */}
        <div className="text-white">
          <h2 className="font-jakarta text-3xl font-extrabold sm:text-4xl">
            Belum yakin layanan mana yang <span className="text-ink">Anda butuhkan?</span>
          </h2>
          <ul className="mt-6 space-y-3" role="list">
            {GUARANTEES.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15"><Icon size={15} /></span>
                {text}
              </li>
            ))}
          </ul>
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="mt-8 inline-flex items-center gap-3 transition hover:opacity-90">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-soft-lg"><Phone size={20} /></span>
            <span className="font-jakarta text-2xl font-extrabold tracking-tight sm:text-3xl">{phone}</span>
          </a>
          <p className="mt-2 text-xs text-white/70">Senin–Sabtu, 08.00–17.00 WIB</p>
        </div>

        {/* Kanan: form singkat */}
        <div className="rounded-3xl bg-white p-6 shadow-soft-lg sm:p-8">
          {done ? (
            <div className="py-8 text-center" role="status">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white"><Check size={22} /></span>
              <h3 className="mt-4 font-jakarta text-lg font-bold text-ink">Permintaan Anda terkirim!</h3>
              <p className="mt-1.5 text-sm text-ink-soft">Terima kasih, {form.name.split(" ")[0] || "Bapak/Ibu"}. Tim kami akan menghubungi Anda maksimal 1×24 jam kerja.</p>
              <button type="button" onClick={() => { setDone(false); setForm({ service: prefill, name: "", phone: "", note: "", website: "" }); }}
                className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-cream transition hover:bg-ink/80">Kirim permintaan lain</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h3 className="font-jakarta text-lg font-bold text-ink">Konsultasi gratis</h3>
              <p className="mt-0.5 text-sm text-ink-light">Ceritakan kebutuhan Anda — kami bantu pilih layanan yang tepat.</p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Layanan</span>
                  <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
                    <option value="">Belum tahu — konsultasi dulu</option>
                    {(services ?? []).map((s) => <option key={s.id} value={s.slug}>{s.title}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Nama</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama Anda" required
                    className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">No. WhatsApp</span>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812xxxx" required
                    className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Kebutuhan singkat</span>
                  <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Cth: bangun rumah 2 lantai 120 m² di Bekasi" required
                    className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </label>
                <input type="hidden" name="website" value={form.website} /> {/* honeypot */}
              </div>
              {err && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{err}</p>}
              <button type="submit" disabled={sending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
                {sending ? "Mengirim…" : "Kirim Permintaan Konsultasi"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
