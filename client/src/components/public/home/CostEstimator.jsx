/*
 * CostEstimator — kalkulator estimasi biaya: tipe bangunan (EstimatePrice),
 * slider luas 20-1000 m², tingkat finishing (pengali), hasil rentang Rupiah animatif.
 * Tombol kirim membuka form kecil → POST /api/public/messages (nama+WA+ringkasan).
 * Dapat ditampilkan sebagai section penuh atau popup modal.
 */
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Loader2, Send } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import Input from "../../ui/Input.jsx"; // ponytail: kalau tak ada, ganti <input> polos
import Modal from "../../ui/Modal.jsx";
import { toast } from "../../ui/Toast.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

// ponytail: pengali finishing hardcode; pindah ke settings jika klien ingin atur sendiri
const FINISHING = [
  { label: "Standar", mult: 1 },
  { label: "Menengah", mult: 1.35 },
  { label: "Premium", mult: 1.8 },
];

const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Angka animatif ringan: transisi ke target dalam 500ms
function AnimatedRupiah({ value }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 500);
      setV(Math.round(a + (value - a) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value]);
  return <>{rupiah(v)}</>;
}

export default function CostEstimator({ modal = false, onClose }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["public-estimate-prices"],
    queryFn: async () => (await api.get("/public/estimate-prices")).data.data,
  });
  const types = data ?? [];

  const [typeId, setTypeId] = useState(null);
  const [area, setArea] = useState(120);
  const [fin, setFin] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  const price = types.find((t) => t.id === typeId) ?? types[0];

  const min = price ? Math.round(price.pricePerM2Min * FINISHING[fin].mult * area) : 0;
  const max = price ? Math.round(price.pricePerM2Max * FINISHING[fin].mult * area) : 0;

  const send = useMutation({
    mutationFn: async () => {
      const summary = `Permintaan estimasi — Tipe: ${price.label}; Luas: ${area} m²; Finishing: ${FINISHING[fin].label}; Estimasi: ${rupiah(min)} - ${rupiah(max)}.`;
      await api.post("/public/messages", { name: form.name, phone: form.phone, subject: "Permintaan estimasi biaya", body: summary });
    },
    onSuccess: () => {
      toast.success("Permintaan terkirim! Tim kami akan menghubungi Anda.");
      setOpenForm(false);
      setForm({ name: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal mengirim, coba lagi."),
  });

  if (types.length === 0) {
    if (!modal) return null;
    return (
      <Modal open onClose={onClose} title="Hitung Estimasi Biaya" size="lg">
        <div className="py-8 text-center text-sm text-ink-light">
          {isLoading ? "Memuat kalkulator estimasi…" : "Data estimasi belum tersedia."}
        </div>
      </Modal>
    );
  }

  const content = (
    <div className={`grid gap-10 lg:grid-cols-2 ${modal ? "rounded-2xl bg-ink p-5 sm:p-6" : ""}`}>
        {/* Kiri: kontrol */}
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-light"><Calculator size={14} /> Kalkulator Estimasi</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-cream sm:text-4xl">Hitung perkiraan biaya bangunan Anda</h2>

          <fieldset className="mt-7">
            <legend className="mb-2 text-sm font-semibold text-cream/80">Tipe bangunan</legend>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button key={t.id} type="button" onClick={() => setTypeId(t.id)}
                  aria-pressed={t.id === price.id}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${t.id === price.id ? "bg-brand text-white" : "bg-white/10 text-cream/80 hover:bg-white/20"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <label htmlFor="est-area" className="text-sm font-semibold text-cream/80">
              Luas bangunan: <span className="font-jakarta font-bold text-brand-light">{area} m²</span>
            </label>
            <input id="est-area" type="range" min={20} max={1000} step={10} value={area}
              onChange={(e) => setArea(+e.target.value)}
              className="mt-2 w-full accent-brand" />
            <div className="flex justify-between text-xs text-cream/50"><span>20 m²</span><span>1000 m²</span></div>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-semibold text-cream/80">Tingkat finishing</legend>
            <div className="flex gap-2">
              {FINISHING.map((f, idx) => (
                <button key={f.label} type="button" onClick={() => setFin(idx)} aria-pressed={fin === idx}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${fin === idx ? "bg-brand text-white" : "bg-white/10 text-cream/80 hover:bg-white/20"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Kanan: hasil + form kirim */}
        <div className="flex flex-col justify-center rounded-3xl bg-white p-7 shadow-soft-lg sm:p-9">
          <p className="text-sm text-ink-light">{price.label} · {area} m² · finishing {FINISHING[fin].label}</p>
          <p className="mt-3 font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            <span className="text-brand"><AnimatedRupiah value={min} /></span>
            <span className="mx-2 text-ink/30">—</span>
            <span className="text-brand"><AnimatedRupiah value={max} /></span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-light">
            Estimasi awal, bukan penawaran resmi. Biaya final ditetapkan setelah survei & RAB.
          </p>

          {!openForm ? (
            <button type="button" onClick={() => setOpenForm(true)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-jakarta font-bold text-white shadow-soft transition hover:bg-brand-dark">
              <Send size={15} /> Kirim estimasi ke tim kami
            </button>
          ) : (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
              <Input label="Nama" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required minLength={2} />
              <Input label="Nomor WhatsApp" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required minLength={6} />
              <div className="flex gap-2">
                <button type="submit" disabled={send.isPending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-jakarta font-bold text-white transition hover:bg-brand-dark disabled:opacity-60">
                  {send.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Kirim
                </button>
                <button type="button" onClick={() => setOpenForm(false)}
                  className="rounded-full px-5 py-3 text-sm font-semibold text-ink-soft hover:text-ink">Batal</button>
              </div>
            </form>
          )}
        </div>
    </div>
  );

  if (modal) {
    return <Modal open onClose={onClose} title="Hitung Estimasi Biaya" size="lg">{content}</Modal>;
  }

  return (
    <section id="estimasi" className="scroll-mt-24 bg-ink py-16 sm:py-20">
      <Container>{content}</Container>
    </section>
  );
}
