/*
 * ProjectFilterBar — satu panel filter untuk /proyek.
 * Desktop: kotak pencarian (debounce 400 ms), dropdown Layanan/Tahun/Urutkan,
 * chip Status & Kategori berjumlah (dari facets), chip filter aktif yang bisa
 * dihapus satu per satu, tombol Reset semua, dan ringkasan hasil.
 * Mobile: pencarian + tombol "Filter" (badge jumlah filter aktif) yang membuka
 * drawer bawah berisi dropdown, chip, dan reset.
 * Semua state disimpan di query string: q, layanan, tahun, urutan, status,
 * kategori, halaman.
 */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LayoutGrid, List, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import api from "../../../lib/axios.js";
import { STATUS_LABEL } from "../../../pages/public/project-labels.js";

export const SORT_OPTIONS = [
  ["terbaru", "Terbaru"],
  ["terlama", "Terlama"],
  ["terpopuler", "Terpopuler"],
  ["judul-az", "Judul A–Z"],
];

const selectClass =
  "w-full appearance-none rounded-xl border border-ink/10 bg-white py-2.5 pl-3.5 pr-9 text-sm text-ink outline-none transition focus:border-brand";

const chipBase = "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-light">{label}</span>
      {children}
    </label>
  );
}

function SelectBox({ value, onChange, children, ariaLabel }) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} className={selectClass}>
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-light" />
    </span>
  );
}

export const VIEW_OPTIONS = [
  ["grid", "Grid", LayoutGrid],
  ["daftar", "Daftar", List],
  ["peta", "Peta", MapIcon],
];

function ViewToggle({ value, onChange }) {
  return (
    <div role="group" aria-label="Tampilan proyek" className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-ink/10 bg-cream p-1">
      {VIEW_OPTIONS.map(([v, label, Icon]) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={on}
            aria-label={`Tampilan ${label}`}
            title={label}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 ${
              on ? "bg-ink text-cream shadow-soft" : "text-ink-soft hover:text-brand"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ProjectFilterBar({ facets, meta, shown, page = 1, limit = 12 }) {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  const q = params.get("q") ?? "";
  const layanan = params.get("layanan") ?? "";
  const tahun = params.get("tahun") ?? "";
  const urutan = params.get("urutan") ?? "terbaru";
  const status = params.get("status") ?? "";
  const kategori = params.get("kategori") ?? "";
  const rawView = params.get("tampilan");
  const tampilan = VIEW_OPTIONS.some(([v]) => v === rawView) ? rawView : "grid";

  const { data: services } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => (await api.get("/public/services")).data.data,
  });
  const serviceOptions = services ?? [];

  // --- Pencarian: input lokal, sinkron ke URL setelah 400 ms ---
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  const setParam = useCallback((key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("halaman");
      return next;
    }, { replace: true });
  }, [setParams]);

  const clearParam = useCallback((key) => setParam(key, ""), [setParam]);

  useEffect(() => {
    if (text === q) return;
    const timer = setTimeout(() => setParam("q", text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text, q, setParam]);

  const resetAll = () => setParams((prev) => {
    const next = new URLSearchParams();
    const view = prev.get("tampilan");
    if (view && view !== "grid") next.set("tampilan", view);
    return next;
  }, { replace: true });

  // Ganti tampilan tanpa menyentuh filter/halaman (grid = default, tanpa param)
  const setView = (v) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    if (v === "grid") next.delete("tampilan");
    else next.set("tampilan", v);
    // Peta menampilkan semua titik hasil filter, bukan halaman aktif.
    if (v === "peta") next.delete("halaman");
    return next;
  }, { replace: true });

  const toggle = (key, value) => {
    setParam(key, params.get(key) === value ? "" : value);
  };

  // Chip filter aktif
  const catName = (slug) => facets?.categories?.find((c) => c.slug === slug)?.name ?? slug;
  const serviceName = (slug) => serviceOptions.find((s) => s.slug === slug)?.title ?? slug;
  const active = [
    q && { key: "q", label: `Pencarian: “${q}”` },
    layanan && { key: "layanan", label: serviceName(layanan) },
    tahun && { key: "tahun", label: `Tahun ${tahun}` },
    status && { key: "status", label: STATUS_LABEL[status] ?? status },
    kategori && { key: "kategori", label: catName(kategori) },
  ].filter(Boolean);
  // Badge mobile: filter yang tersembunyi di drawer (pencarian tampil di luar)
  const drawerFilterCount = active.filter((a) => a.key !== "q").length;

  const statusOptions = facets?.statuses ?? [];
  const categoryOptions = facets?.categories ?? [];
  const years = facets?.years ?? [];

  const countText = !meta
    ? "Memuat proyek…"
    : page > 1
      ? `Menampilkan ${(page - 1) * limit + 1}–${(page - 1) * limit + shown} dari ${meta.total} proyek`
      : `Menampilkan ${shown} dari ${meta.total} proyek`;

  const searchBox = (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-light" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cari judul, lokasi, atau kata kunci…"
        aria-label="Cari proyek"
        className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition focus:border-brand"
      />
      {text && (
        <button
          type="button"
          onClick={() => { setText(""); clearParam("q"); }}
          aria-label="Bersihkan pencarian"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-light transition hover:text-brand"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  const dropdowns = (
    <div className="grid gap-3 sm:grid-cols-3 lg:contents">
      <Field label="Layanan">
        <SelectBox value={layanan} onChange={(v) => setParam("layanan", v)} ariaLabel="Filter layanan">
          <option value="">Semua layanan</option>
          {serviceOptions.map((s) => <option key={s.id} value={s.slug}>{s.title}</option>)}
        </SelectBox>
      </Field>
      <Field label="Tahun">
        <SelectBox value={tahun} onChange={(v) => setParam("tahun", v)} ariaLabel="Filter tahun">
          <option value="">Semua tahun</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </SelectBox>
      </Field>
      <Field label="Urutkan">
        <SelectBox value={urutan} onChange={(v) => setParam("urutan", v === "terbaru" ? "" : v)} ariaLabel="Urutkan proyek">
          {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectBox>
      </Field>
    </div>
  );

  const statusChips = (
    <div role="group" aria-label="Filter status">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-light">Status</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => clearParam("status")} aria-pressed={!status}
          className={`${chipBase} ${!status ? "border-ink bg-ink text-cream" : "border-ink/15 bg-white text-ink-soft hover:border-brand hover:text-brand"}`}>
          Semua
        </button>
        {statusOptions.map((s) => {
          const on = status === s.status;
          return (
            <button key={s.status} type="button" onClick={() => toggle("status", s.status)} aria-pressed={on}
              className={`${chipBase} ${on ? "border-ink bg-ink text-cream" : "border-ink/15 bg-white text-ink-soft hover:border-brand hover:text-brand"}`}>
              {STATUS_LABEL[s.status] ?? s.status} ({s.count})
            </button>
          );
        })}
      </div>
    </div>
  );

  const categoryChips = (
    <div role="group" aria-label="Filter kategori">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-light">Kategori</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => clearParam("kategori")} aria-pressed={!kategori}
          className={`${chipBase} ${!kategori ? "border-brand bg-brand text-white" : "border-ink/15 bg-white text-ink-soft hover:border-brand hover:text-brand"}`}>
          Semua
        </button>
        {categoryOptions.map((c) => {
          const on = kategori === c.slug;
          return (
            <button key={c.id} type="button" onClick={() => toggle("kategori", c.slug)} aria-pressed={on}
              className={`${chipBase} ${on ? "border-brand bg-brand text-white" : "border-ink/15 bg-white text-ink-soft hover:border-brand hover:text-brand"}`}>
              {c.name} ({c.count})
            </button>
          );
        })}
      </div>
    </div>
  );

  const activeChips = active.length > 0 && (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filter aktif">
      {active.map((a) => (
        <span key={a.key} className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-brand">
          {a.label}
          <button type="button" onClick={() => clearParam(a.key)} aria-label={`Hapus filter ${a.label}`}
            className="rounded-full p-0.5 transition hover:bg-brand hover:text-white">
            <X size={12} />
          </button>
        </span>
      ))}
      <button type="button" onClick={resetAll} className="ml-1 text-xs font-bold text-ink-light underline-offset-2 transition hover:text-brand hover:underline">
        Reset semua
      </button>
    </div>
  );

  const resultCount = <p className="text-xs text-ink-light" aria-live="polite">{countText}</p>;

  // Kunci scroll halaman saat drawer terbuka + tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Desktop */}
      <section aria-label="Filter proyek" className="hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-soft lg:block">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-light">Filter proyek</p>
          <ViewToggle value={tampilan} onChange={setView} />
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <Field label="Pencarian">{searchBox}</Field>
          {dropdowns}
        </div>

        <div className="mt-5 grid gap-5 border-t border-ink/10 pt-4 sm:grid-cols-2">
          {statusChips}
          {categoryChips}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3">
          {resultCount}
          <div className="flex flex-wrap items-center gap-3">
            {activeChips}
            {active.length === 0 && (
              <button type="button" onClick={resetAll} disabled className="text-xs font-bold text-ink-light/40">Reset semua</button>
            )}
          </div>
        </div>
      </section>

      {/* Mobile: pencarian + tombol Filter */}
      <div className="space-y-3 lg:hidden">
        <div className="flex gap-2">
          <div className="flex-1">{searchBox}</div>
          <button type="button" onClick={() => setOpen(true)}
            className="relative inline-flex shrink-0 items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand">
            <SlidersHorizontal size={16} /> Filter
            {drawerFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                {drawerFilterCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {resultCount}
          <ViewToggle value={tampilan} onChange={setView} />
        </div>
        {activeChips}
      </div>

      {/* Drawer bawah (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Tutup filter" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream px-5 pb-5 pt-3 shadow-soft-lg">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/15" aria-hidden />
            <div className="flex items-center justify-between">
              <h2 id="filter-drawer-title" className="font-jakarta text-lg font-extrabold text-ink">Filter</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup filter"
                className="rounded-full border border-ink/10 bg-white p-2 text-ink-soft transition hover:text-brand">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {dropdowns}
              {statusChips}
              {categoryChips}
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { resetAll(); setText(""); }}
                className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">
                Reset semua
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-bold text-cream transition hover:bg-brand">
                Tampilkan hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
