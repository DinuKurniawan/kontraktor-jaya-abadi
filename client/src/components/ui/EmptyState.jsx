// Tampilan kosong: ikon + judul + deskripsi + aksi opsional
export default function EmptyState({ icon: Icon, title = "Belum ada data", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {Icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon size={22} />
        </div>
      )}
      <p className="font-semibold text-text">{title}</p>
      {description && <p className="max-w-xs text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
