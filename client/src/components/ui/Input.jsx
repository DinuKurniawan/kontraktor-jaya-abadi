import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";

// Dasar gaya input (dipakai Input, Textarea, Select)
export const fieldClass = (error) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/70 outline-none transition focus:ring-2 ${
    error
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-primary focus:ring-primary/20"
  }`;

// Bungkus label + field + pesan error/hint
export function FieldWrap({ id, label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={12} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const Input = forwardRef(function Input({ label, error, hint, className = "", id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrap id={inputId} label={label} error={error} hint={hint}>
      <input id={inputId} ref={ref} aria-invalid={!!error} className={`${fieldClass(error)} ${className}`} {...props} />
    </FieldWrap>
  );
});

export default Input;
