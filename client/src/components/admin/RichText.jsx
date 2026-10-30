// Editor rich text sederhana — contentEditable + toolbar (bold/italic/h2/list)
// Output HTML disimpan & dirender di situs publik; input hanya dari admin (env terpercaya)
import { useEffect, useRef } from "react";

const btn = "rounded-lg p-2 text-sm font-semibold text-text-muted transition hover:bg-primary-soft hover:text-primary";

export default function RichText({ value, onChange, error }) {
  const ref = useRef(null);

  // Set HTML awal / saat ganti artikel — hanya bila beda agar kursor tidak lompat
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value ?? "";
  }, [value]);

  // Jalankan perintah format dokumen (arg opsional, mis. formatBlock h2)
  const exec = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    onChange?.(ref.current.innerHTML);
  };

  return (
    <div className="space-y-1.5">
      <div className={`overflow-hidden rounded-xl border bg-white ${error ? "border-danger" : "border-border"}`}>
        <div className="flex flex-wrap gap-1 border-b border-border bg-surface/60 px-2 py-1.5">
          <button type="button" className={btn} onClick={() => exec("bold")} aria-label="Tebal"><b>B</b></button>
          <button type="button" className={btn} onClick={() => exec("italic")} aria-label="Miring"><i>I</i></button>
          <button type="button" className={`${btn} underline`} onClick={() => exec("underline")} aria-label="Garis bawah">U</button>
          <button type="button" className={btn} onClick={() => exec("formatBlock", "h2")} aria-label="Judul bagian">H2</button>
          <button type="button" className={btn} onClick={() => exec("insertUnorderedList")} aria-label="Daftar poin">• List</button>
          <button type="button" className={btn} onClick={() => exec("insertOrderedList")} aria-label="Daftar bernomor">1. List</button>
        </div>
        <div
          ref={ref}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Konten artikel"
          className="min-h-48 px-4 py-3 text-sm leading-relaxed text-text outline-none [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5"
          onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
          onBlur={(e) => onChange?.(e.currentTarget.innerHTML)}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
