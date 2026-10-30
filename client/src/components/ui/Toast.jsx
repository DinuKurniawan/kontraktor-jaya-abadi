import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

/*
 * Toast sederhana tanpa library: panggil `toast.success("...")` dari mana saja.
 * <ToastHost /> dipasang sekali di main.jsx.
 */
const TYPES = {
  success: { icon: CheckCircle2, className: "text-success" },
  error: { icon: AlertTriangle, className: "text-danger" },
  info: { icon: Info, className: "text-primary" },
};

let listeners = [];
let idCounter = 0;
let items = [];

function notify() {
  // beri salinan baru agar re-render terpicu
  const snapshot = [...items];
  listeners.forEach((l) => l(snapshot));
}

function push(type, message, duration = 3500) {
  const id = ++idCounter;
  items = [...items, { id, type, message }];
  notify();
  setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id) {
  items = items.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (message) => push("success", message),
  error: (message) => push("error", message),
  info: (message) => push("info", message),
};

export function ToastHost() {
  const [stack, setStack] = useState([]);

  useEffect(() => {
    listeners.push(setStack);
    return () => {
      listeners = listeners.filter((l) => l !== setStack);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
      {stack.map(({ id, type, message }) => {
        const { icon: Icon, className } = TYPES[type];
        return (
          <div key={id} className="animate-toast-in flex items-start gap-2.5 rounded-xl bg-white p-3.5 shadow-soft-lg">
            <Icon size={18} className={`mt-0.5 shrink-0 ${className}`} aria-hidden />
            <p className="flex-1 text-sm text-text">{message}</p>
            <button type="button" onClick={() => dismissToast(id)} aria-label="Tutup" className="text-text-muted transition hover:text-text">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
