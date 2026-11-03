/*
 * IntegratedServices — "Satu Mitra untuk Semua Tahap": diagram alur horizontal
 * 4 simpul (Desain → RAB → Bangun → Awasi) tersambung garis + ikon, masing-masing
 * satu kalimat + tautan ke layanan terkait (jika ada). Mobile: vertikal.
 * Di bawahnya 3 lencana manfaat.
 */
import { ChevronDown, ChevronRight, FileText, Hammer, HardHat, Link2, PenTool, ShieldCheck, Wallet } from "lucide-react";
import Container from "../Container.jsx";

const NODES = [
  { key: "desain|interior", icon: PenTool, title: "Desain", text: "Konsep 3D dan tata ruang disetujui sebelum batu pertama.", },
  { key: "konstruksi", icon: FileText, title: "RAB", text: "Anggaran terperinci per item — transparan sejak awal.", },
  { key: "konstruksi", icon: Hammer, title: "Bangun", text: "Pelaksanaan terjadwal dengan laporan progres mingguan.", },
  { key: "pengawas", icon: HardHat, title: "Awasi", text: "Kontrol mutu independen sampai serah terima kunci.", },
];

const slugMatch = (services, key) => {
  const re = new RegExp(key, "i");
  return (services ?? []).find((s) => re.test(`${s.slug} ${s.title}`)) ?? null;
};

export default function IntegratedServices({ services }) {
  const badges = [
    [ShieldCheck, "Satu kontrak", "Semua tahap dalam satu kesepakatan — tanpa friksi antar vendor."],
    [Link2, "Satu penanggung jawab", "Manajer khusus bertanggung jawab penuh dari desain sampai serah terima."],
    [Wallet, "Biaya terkendali", "RAB diaudit tiap milestone — tak ada biaya siluman di tengah jalan."],
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Terintegrasi</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Satu Mitra untuk <span className="text-brand">Semua Tahap</span></h2>
        </div>

        {/* Diagram alur: horizontal desktop, vertikal mobile */}
        <ol className="relative mx-auto mt-12 max-w-5xl space-y-8 md:flex md:space-y-0">
          {/* Garis penghubung */}
          <div aria-hidden className="absolute left-[1.55rem] top-2 h-[calc(100%-3rem)] border-l-2 border-dashed border-ink/15 md:left-[12%] md:top-7 md:h-0 md:w-[76%] md:border-l-0 md:border-t-2" />
          {NODES.map(({ key, icon: Icon, title, text }, i) => {
            const s = slugMatch(services, key);
            return (
              <li key={title} className="relative flex items-start gap-4 md:flex-1 md:flex-col md:items-center md:text-center">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-soft-lg">
                  <Icon size={22} strokeWidth={1.9} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-cream">{i + 1}</span>
                </span>
                <div className="md:mt-4">
                  <h3 className="font-jakarta font-bold text-ink">
                    {s ? <a href={`/layanan/${s.slug}`} className="transition hover:text-brand">{s.title}</a> : title}
                  </h3>
                  <p className="mt-1 max-w-[15rem] text-sm leading-relaxed text-ink-soft">{text}</p>
                </div>
                {i < NODES.length - 1 && (
                  <>
                    <ChevronDown aria-hidden size={16} className="absolute -bottom-6 left-[1.6rem] md:hidden" />
                    <ChevronRight aria-hidden size={18} className="absolute right-0 top-7 z-10 hidden translate-x-1/2 -translate-y-1/2 bg-white text-brand md:block" />
                  </>
                )}
              </li>
            );
          })}
        </ol>

        {/* Lencana manfaat */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {badges.map(([Icon, title, text]) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl bg-cream-deep p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Icon size={16} /></span>
              <div>
                <p className="font-jakarta text-sm font-bold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-light">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
