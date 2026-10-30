// Kartu layanan — ikon, judul, deskripsi singkat, latar cream-deep
export default function ServiceCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl bg-cream-deep p-6 transition-colors hover:bg-brand-soft">
      {Icon && (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-cream">
          <Icon size={20} strokeWidth={2.2} />
        </span>
      )}
      <h3 className="font-jakarta text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>}
    </div>
  );
}
