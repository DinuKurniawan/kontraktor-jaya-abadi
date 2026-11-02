// ArticleNewsletter — newsletter ringkas memakai endpoint publik subscribe.
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";
import api from "../../../lib/axios.js";
import { toast } from "../../ui/Toast.jsx";

export default function ArticleNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const subscribe = useMutation({
    mutationFn: async () => (await api.post("/public/subscribe", { email: email.trim() })).data,
    onSuccess: () => { setDone(true); setEmail(""); },
    onError: (error) => toast.error(error.response?.data?.message ?? "Gagal berlangganan"),
  });

  return (
    <section className="mt-10 rounded-2xl bg-ink p-6 text-cream sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
      <div>
        <div className="flex items-center gap-2 text-brand-soft"><Mail size={19} /><p className="text-xs font-bold uppercase tracking-wider">Newsletter Jaya Abadi</p></div>
        <h2 className="mt-2 font-jakarta text-xl font-extrabold text-white">Wawasan baru, langsung di inbox.</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-cream/70">Dapatkan tips konstruksi, renovasi, dan inspirasi ruang secara berkala.</p>
      </div>
      {done ? (
        <p className="mt-5 shrink-0 text-sm font-semibold text-brand-soft sm:mt-0">Terima kasih! Email Anda sudah terdaftar.</p>
      ) : (
        <form className="mt-5 flex shrink-0 flex-col gap-2 sm:mt-0 sm:w-72" onSubmit={(event) => { event.preventDefault(); subscribe.mutate(); }}>
          <label htmlFor="article-newsletter-email" className="sr-only">Email newsletter</label>
          <input id="article-newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email Anda" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-light focus:border-brand" />
          <button type="submit" disabled={subscribe.isPending} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{subscribe.isPending ? "Mendaftarkan…" : "Berlangganan"}</button>
        </form>
      )}
    </section>
  );
}
