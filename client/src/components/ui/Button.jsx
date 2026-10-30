import { Loader2 } from "lucide-react";

// Varian warna tombol mengikuti design system admin
const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/40",
  soft: "bg-primary-soft text-primary hover:bg-primary/20 focus-visible:ring-primary/30",
  outline: "border border-border bg-white text-text hover:bg-primary-soft/60 focus-visible:ring-primary/30",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/40",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

// Tombol dengan varian + keadaan loading (spinner, otomatis disabled)
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
