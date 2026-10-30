/*
 * DirectorMessage — foto direktur dengan blok oranye offset, kutipan dekoratif,
 * isi sambutan, nama + jabatan, tanda tangan cursive. Latar krem gelap.
 * Data: settings director_* — section disembunyikan bila nama & sambutan kosong.
 */
import { useSiteSettings } from "../home/HeroSection.jsx";
import Container from "../Container.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

export default function DirectorMessage() {
  const { data: s } = useSiteSettings();
  const name = s?.director_name;
  const message = s?.director_message;
  if (!name && !message) return null;

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-5">
        {/* Foto + blok oranye offset */}
        <div className="relative mx-auto w-full max-w-xs animate-in-left lg:col-span-2">
          <div aria-hidden className="absolute -left-4 top-6 h-full w-full rounded-3xl bg-brand sm:-left-6" />
          {s?.director_photo ? (
            <img src={img(s.director_photo)} alt={name ?? "Direktur"} width={480} height={600}
              className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-soft-lg" />
          ) : (
            <div className="relative flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-cream text-4xl font-jakarta font-extrabold text-ink-light">
              {(name?.[0] ?? "J").toUpperCase()}
            </div>
          )}
        </div>

        {/* Sambutan */}
        <div className="animate-in-right lg:col-span-3">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Sambutan Direktur</p>
          {s?.director_quote && (
            <blockquote className="relative mt-5 pl-6">
              <span aria-hidden className="absolute -left-1 -top-5 font-jakarta text-7xl leading-none text-brand/25">“</span>
              <p className="font-jakarta text-2xl font-bold leading-snug text-ink sm:text-3xl">{s.director_quote}</p>
            </blockquote>
          )}
          {message && <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-soft">{message}</p>}
          <div className="mt-7">
            <p className="font-jakarta text-2xl italic text-ink/85" style={{ fontFamily: "'Segoe Script', cursive" }}>
              {name ?? "Jaya Abadi"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-light">{s?.director_position ?? "Direktur Utama"}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
