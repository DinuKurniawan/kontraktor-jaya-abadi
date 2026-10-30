import { forwardRef, useId } from "react";
import { FieldWrap, fieldClass } from "./Input.jsx";

const Textarea = forwardRef(function Textarea({ label, error, hint, rows = 4, className = "", id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrap id={inputId} label={label} error={error} hint={hint}>
      <textarea id={inputId} ref={ref} rows={rows} aria-invalid={!!error} className={`${fieldClass(error)} ${className}`} {...props} />
    </FieldWrap>
  );
});

export default Textarea;
