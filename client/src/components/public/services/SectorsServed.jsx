/*
 * SectorsServed — grid sektor yang dilayani (ikon + deskripsi + jumlah proyek
 * dari kategori PROJECT). Klik kartu → /proyek?kategori=slug.
 * Mapping sektor via nama kategori; kategori di luar mapping tetap tampil generik.
 */
import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, HeartPulse, Home, Hospital, Hotel, Factory, Store, Building, Landmark, Warehouse } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import Reveal from "./Reveal.jsx";

// Ikon + deskripsi per sektor, dicocokkan dari nama kategori proyek
const SECTOR_META = [
  { re: /rumah|tinggal|hunian|residential/i, icon: Home, desc: "Bangun & renovasi rumah — dari desain hingga serah terima kunci." },
  { re: /komersial|perkantoran|kantor|office|ruko/i, icon: Building2, desc: "Kantor & ruko yang efisien dan berkesan profesional." },
  { re: /pendidikan|sekolah|kampus/i, icon: GraduationCap, desc: "Fasilitas pendidikan yang aman untuk generasi penerus." },
  { re: /kesehatan|rumah sakit|klinik|puskesmas/i, icon: Hospital, desc: "Sarana kesehatan sesuai standar sanitasi & alur layanan." },
  { re: /industri|pabrik|gudang|pergudangan/i, icon: Warehouse, desc: "Bangunan industri dengan struktur kuat & efisiensi tinggi." },
  { re: /hotel|hospitality|restoran|kafe|villa/i, icon: Hotel, desc: "Ruang hospitality berkualitas bintang — kenyamanan tamu nomor satu." },
];
const FALLBACK = { icon: Landmark, desc: "Amanah proyek Anda selesai rapi, tepat waktu." };

export default function SectorsServed() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-categories-project"],
    queryFn: async () => (await api.get("/public/categories", { params: { type: "PROJECT" } })).data.data,
  });
  const rows = data ?? [];
  if (!isLoading && rows.length === 0) return null;

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Sektor yang kami layani</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Pengalaman lintas <span className="text-brand">sektor</span></h2>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-cream-deep" aria-hidden />)}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((c, i) => {
              const meta = SECTOR_META.find((m) => m.re.test(c.name)) ?? FALLBACK;
              const Icon = meta.icon;
              return (
                <Reveal key={c.id} delay={i * 60}>
                  <a href={`/proyek?kategori=${c.slug}`}
                    className="group flex h-full items-start gap-4 rounded-2xl bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                      <Icon size={22} strokeWidth={1.9} />
                    </span>
                    <div>
                      <p className="font-jakarta font-bold text-ink">{c.name}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-light">{meta.desc}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand">
                        {c._count?.projects ?? 0} proyek <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                      </p>
                    </div>
                  </a>
                </Reveal>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
