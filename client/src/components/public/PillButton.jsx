// Tombol pill gaya publik: variant "primary" (oranye), "dark" (hitam), "outline"
import { Link } from "react-router-dom";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-[0_10px_24px_rgba(242,107,58,0.30)]",
  dark: "bg-ink text-cream hover:bg-ink/85",
  outline: "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-cream",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-jakarta text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";

export default function PillButton({ variant = "primary", to, className = "", children, ...props }) {
  const cls = `${base} ${VARIANTS[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
