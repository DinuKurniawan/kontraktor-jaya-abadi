import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { FieldWrap, fieldClass } from "./Input.jsx";

// Select native distyling agar konsisten dengan design system
const Select = forwardRef(function Select({ label, error, hint, className = "", id, children, ...props }, ref) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FieldWrap id={selectId} label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={!!error}
          className={`${fieldClass(error)} appearance-none pr-9 ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>
    </FieldWrap>
  );
});

export default Select;
