/* eslint-disable react/prop-types */
// Kartu putih rounded-2xl shadow lembut — bisa tanpa header, header polos, atau header biru
export default function Card({ title, actions, headerVariant = "plain", className = "", bodyClassName = "", children }) {
  const hasHeader = Boolean(title || actions);

  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-soft ${className}`}>
      {hasHeader && headerVariant === "primary" && (
        <header className="flex items-center justify-between bg-primary px-5 py-3.5 text-white">
          <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
          {actions}
        </header>
      )}
      {hasHeader && headerVariant !== "primary" && (
        <header className="flex items-center justify-between px-5 pb-1 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h3>
          {actions}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
