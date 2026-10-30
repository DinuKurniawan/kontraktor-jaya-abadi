// IconPicker — dropdown kurasi ikon Lucide dengan pratinjau. Nilai: nama komponen (string) atau "".
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { SERVICE_ICONS } from "../../lib/service-icons.jsx";

// Dropdown native <select> (aksesibel, tanpa dependensi) + pratinjau besar di samping
export default function IconPicker({ value, onChange, label = "Ikon" }) {
  const [open, setOpen] = useState(false);
  const Preview = SERVICE_ICONS[value];

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-text">{label}</span>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {Preview ? <Preview size={20} /> : <span className="text-[10px] text-text-muted">?</span>}
        </span>
        <div className="relative flex-1">
          <select
            aria-label={label}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none rounded-md bg-surface py-1.5 pl-3 pr-8 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="">— Tanpa ikon —</option>
            {Object.keys(SERVICE_ICONS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>
        {value && (
          <button type="button" onClick={() => onChange("")} aria-label="Hapus ikon" className="rounded-md p-1.5 text-text-muted transition hover:bg-danger-soft hover:text-danger">
            <X size={14} />
          </button>
        )}
      </div>
      {open && null}
    </div>
  );
}
