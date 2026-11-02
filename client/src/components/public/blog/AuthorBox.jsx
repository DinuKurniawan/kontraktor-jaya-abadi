// AuthorBox — profil singkat penulis artikel.
const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const imageUrl = (path) => (!path ? "" : path.startsWith("http") ? path : `${SERVER}${path}`);

function initials(name = "Jaya Abadi") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JA";
}

export default function AuthorBox({ author }) {
  const name = author?.name || "Jaya Abadi";
  const photo = imageUrl(author?.photo);

  return (
    <section className="mt-10 flex gap-4 rounded-2xl border border-ink/10 bg-cream-deep p-5 sm:items-center sm:p-6" aria-label="Tentang penulis">
      {photo ? (
        <img src={photo} alt={name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-soft font-jakarta text-lg font-extrabold text-brand">{initials(name)}</span>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand">Ditulis oleh</p>
        <h2 className="mt-1 font-jakarta text-lg font-extrabold text-ink">{name}</h2>
        {author?.position && <p className="mt-0.5 text-sm text-ink-soft">{author.position}</p>}
        <p className="mt-2 text-xs leading-relaxed text-ink-light">Berbagi wawasan praktis untuk membantu Anda membangun ruang yang lebih baik.</p>
      </div>
    </section>
  );
}
