import { Loader2 } from "lucide-react";

// Pemuat layar penuh — dipakai saat memeriksa sesi
export default function ScreenLoader({ label = "Memeriksa sesi…" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface">
      <Loader2 className="animate-spin text-primary" size={28} />
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
