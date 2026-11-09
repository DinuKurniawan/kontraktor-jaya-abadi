import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

// Modal: overlay gelap, focus trap keyboard, kembalikan fokus saat ditutup
export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Pindahkan fokus awal ke tombol/elemen pertama dalam panel
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (prevFocus && typeof prevFocus.focus === "function") {
        prevFocus.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div className="animate-overlay-fade absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div ref={panelRef} className={`animate-panel-in relative w-full ${SIZES[size]} overflow-hidden rounded-2xl bg-white shadow-soft-lg`}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="modal-heading" className="font-display text-base font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X size={18} />
          </button>
        </header>
        <div className="px-5 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border bg-surface/60 px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}
