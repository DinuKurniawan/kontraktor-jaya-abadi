// Sakelar on/off gaya iOS — pada dasarnya tombol role="switch"
export default function Switch({ checked = false, onChange, label, disabled = false }) {
  return (
    <label className="inline-flex select-none items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}
