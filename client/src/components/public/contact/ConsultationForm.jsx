// ConsultationForm — konsultasi publik tiga langkah dengan draft, upload, dan tiket.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

// Disable Zod JIT to avoid eval() under strict CSP.
// ponytail: eval disabled, acceptable because schemas are static.
z.config({ jitless: true });
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Loader2, MessageCircle, RotateCcw, Send, ShieldCheck, Upload, X } from "lucide-react";
import api from "../../../lib/axios.js";
import { toast } from "../../ui/Toast.jsx";
import { usePublicServices } from "../../../hooks/usePublicData.js";

const DRAFT_KEY = "jaya-abadi-consultation-draft";
const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

const DEFAULT_VALUES = {
  name: "",
  email: "",
  phone: "",
  preferredContact: "WHATSAPP",
  preferredTime: "BEBAS",
  serviceId: "",
  projectLocation: "",
  projectArea: "",
  budgetRange: "",
  startEstimate: "",
  subject: "Konsultasi proyek",
  body: "",
  attachments: [],
  consent: false,
  website: "",
};

const STEP_SCHEMAS = [
  z.object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
    email: z.string().trim().email("Format email tidak valid").max(150, "Email maksimal 150 karakter"),
    phone: z.string().trim().min(6, "Nomor telepon/WhatsApp minimal 6 karakter").max(20, "Nomor maksimal 20 karakter"),
    preferredContact: z.enum(["WHATSAPP", "TELEPON", "EMAIL"]),
    preferredTime: z.enum(["PAGI", "SIANG", "SORE", "BEBAS"]),
  }),
  z.object({
    serviceId: z.string().min(1, "Pilih jenis layanan"),
    projectLocation: z.string().trim().min(2, "Lokasi proyek wajib diisi").max(200, "Lokasi maksimal 200 karakter"),
    projectArea: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number({ error: "Luas proyek wajib diisi" }).int("Luas harus berupa angka bulat").positive("Luas harus lebih dari 0").max(100000, "Luas terlalu besar")),
    budgetRange: z.enum(["KURANG_100JT", "100_500JT", "500JT_1M", "1M_5M", "LEBIH_5M", "BELUM_TAHU"], { error: "Pilih kisaran anggaran" }),
    startEstimate: z.string().min(1, "Pilih perkiraan mulai"),
  }),
  z.object({
    body: z.string().trim().min(10, "Detail pesan minimal 10 karakter").max(2000, "Pesan maksimal 2.000 karakter"),
    attachments: z.array(z.string()).max(MAX_FILES, "Maksimal 3 lampiran"),
    consent: z.boolean().refine((value) => value === true, "Anda harus menyetujui kebijakan privasi"),
    website: z.string().max(300).optional(),
  }),
];

const STEP_LABELS = ["Data diri", "Kebutuhan proyek", "Detail"];
const BUDGETS = [
  ["KURANG_100JT", "Kurang dari Rp100 juta"],
  ["100_500JT", "Rp100–500 juta"],
  ["500JT_1M", "Rp500 juta–1 miliar"],
  ["1M_5M", "Rp1–5 miliar"],
  ["LEBIH_5M", "Lebih dari Rp5 miliar"],
  ["BELUM_TAHU", "Belum tahu — konsultasi dulu"],
];

function readDraft() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}

function saveDraft(values, step) {
  try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step })); } catch { /* storage may be unavailable */ }
}

function clearDraft() {
  try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage may be unavailable */ }
}

function fileSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileUrl(path) { return path?.startsWith("http") ? path : `${SERVER}${path}`; }

function Field({ id, label, error, hint, children }) {
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-semibold text-ink">{label}</label>{children}{hint && !error && <p className="text-xs text-ink-light">{hint}</p>}{error && <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs text-danger"><AlertCircle size={12} aria-hidden />{error}</p>}</div>;
}

const fieldClass = (error) => `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:ring-2 ${error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-ink/10 focus:border-brand focus:ring-brand/20"}`;

function ProgressBar({ step }) {
  return <div role="group" className="mb-7" aria-label={`Langkah ${step} dari 3`}><div className="relative flex justify-between"><div className="absolute left-5 right-5 top-5 h-0.5 bg-ink/10" aria-hidden><span className="block h-full bg-brand transition-all" style={{ width: `${((step - 1) / 2) * 100}%` }} /></div>{STEP_LABELS.map((label, index) => { const number = index + 1; const complete = number < step; const active = number === step; return <div key={label} className="relative z-10 flex flex-col items-center gap-2 bg-white px-1 text-center"><span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${complete || active ? "bg-brand text-white" : "border-2 border-ink/10 bg-white text-ink-light"}`}>{complete ? <Check size={17} /> : number}</span><span className={`text-xs font-bold ${active ? "text-brand" : "text-ink-light"}`}>{label}</span></div>; })}</div></div>;
}

function UploadedFiles({ files, onRemove }) {
  if (!files.length) return null;
  return <div className="mt-3 grid gap-2 sm:grid-cols-3">{files.map((entry) => <div key={entry.id} className="relative overflow-hidden rounded-xl border border-ink/10 bg-cream-deep/40 p-2">{entry.file.type.startsWith("image/") ? <img src={entry.preview} alt={`Pratinjau ${entry.file.name}`} className="h-24 w-full rounded-lg object-cover" /> : <div className="flex h-24 items-center justify-center rounded-lg bg-white text-brand"><FileText size={30} /></div>}<div className="mt-2 min-w-0 pr-5"><p className="truncate text-xs font-semibold text-ink">{entry.file.name}</p><p className="text-[11px] text-ink-light">{fileSize(entry.file.size)}{entry.status === "uploading" ? ` · ${entry.progress}%` : entry.status === "error" ? " · gagal" : ""}</p></div><button type="button" onClick={() => onRemove(entry)} aria-label={`Hapus ${entry.file.name}`} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-ink-light shadow-sm hover:text-danger"><X size={13} /></button>{entry.status === "uploading" && <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10"><span className="block h-full bg-brand transition-all" style={{ width: `${entry.progress}%` }} /></div>}{entry.status === "uploaded" && <CheckCircle2 size={14} className="absolute bottom-2 right-2 text-success" aria-label="Berhasil diunggah" />}</div>)}</div>;
}

export default function ConsultationForm({ settings, branch }) {
  const [sp] = useSearchParams();
  const layananSlug = sp.get("layanan") || "";
  const projectRef = sp.get("proyek") || "";
  const packageRef = sp.get("paket") || "";
  const initialDraft = useState(readDraft)[0];
  const [step, setStep] = useState(initialDraft?.step || 1);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [success, setSuccess] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const lastPayload = useRef(null);
  const sendingRef = useRef(false);

  const { data: services, isLoading: servicesLoading } = usePublicServices();

  const initialContext = useMemo(() => {
    const lines = [];
    if (projectRef) lines.push(`Proyek yang dirujuk: ${projectRef}`);
    if (packageRef) lines.push(`Paket yang diminati: ${packageRef}`);
    return lines.join("\n");
  }, [projectRef, packageRef]);

  const { register, handleSubmit, getValues, setValue, setError, clearErrors, watch, reset, formState: { errors } } = useForm({
    defaultValues: { ...DEFAULT_VALUES, ...(initialDraft?.values || {}), body: initialDraft?.values?.body || initialContext },
    mode: "onTouched",
  });
  const values = watch();
  const serializedValues = JSON.stringify(values);

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(values, step), 250);
    return () => clearTimeout(timer);
  }, [serializedValues, step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!services?.length || getValues("serviceId")) return;
    const match = services.find((service) => service.slug === layananSlug);
    if (match) setValue("serviceId", match.id, { shouldDirty: true });
  }, [services, layananSlug, getValues, setValue]);

  const selectedService = services?.find((service) => service.id === values.serviceId);
  useEffect(() => {
    if (!selectedService || initialDraft?.values?.subject) return;
    setValue("subject", `Konsultasi ${selectedService.title}`, { shouldDirty: false });
  }, [selectedService, initialDraft, setValue]);

  const validateStep = async (stepNumber) => {
    const result = STEP_SCHEMAS[stepNumber - 1].safeParse(getValues());
    clearErrors();
    if (result.success) return true;
    result.error.issues.forEach((issue) => {
      const name = issue.path[0];
      if (typeof name === "string") setError(name, { type: "manual", message: issue.message });
    });
    const first = result.error.issues[0]?.path[0];
    if (first) window.setTimeout(() => document.getElementById(first)?.focus(), 0);
    return false;
  };

  const goNext = async () => {
    if (await validateStep(step)) setStep((current) => Math.min(3, current + 1));
  };
  const goBack = () => setStep((current) => Math.max(1, current - 1));

  const uploadFiles = async (fileList) => {
    if (uploading) return;
    const incoming = Array.from(fileList || []);
    if (files.length + incoming.length > MAX_FILES) {
      setUploadError("Maksimal 3 file dapat dilampirkan.");
      return;
    }
    const valid = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) { setUploadError("Format file hanya JPG, PNG, WebP, atau PDF."); continue; }
      if (file.size > MAX_FILE_SIZE) { setUploadError("Ukuran setiap file maksimal 5 MB."); continue; }
      valid.push(file);
    }
    if (!valid.length) return;
    setUploadError("");
    const entries = valid.map((file, index) => ({ id: `${Date.now()}-${index}-${file.name}`, file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "", status: "uploading", progress: 0, url: "" }));
    setFiles((current) => [...current, ...entries]);
    setUploading(true);
    const formData = new FormData();
    valid.forEach((file) => formData.append("files", file));
    try {
      const response = await api.post("/public/messages/attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          setFiles((current) => current.map((entry) => entries.some((item) => item.id === entry.id) ? { ...entry, progress } : entry));
        },
      });
      const urls = response.data?.data?.attachments || [];
      setFiles((current) => current.map((entry, index) => entries.some((item) => item.id === entry.id) ? { ...entry, status: "uploaded", progress: 100, url: urls[entries.findIndex((item) => item.id === entry.id)] || "" } : entry));
      setValue("attachments", [...(getValues("attachments") || []), ...urls], { shouldDirty: true });
    } catch (error) {
      setFiles((current) => current.map((entry) => entries.some((item) => item.id === entry.id) ? { ...entry, status: "error" } : entry));
      setUploadError(error.response?.data?.message || "Lampiran gagal diunggah. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (entry) => {
    if (entry.preview) URL.revokeObjectURL(entry.preview);
    setFiles((current) => current.filter((item) => item.id !== entry.id));
    if (entry.url) setValue("attachments", (getValues("attachments") || []).filter((url) => url !== entry.url), { shouldDirty: true });
  };

  const mutation = useMutation({
    mutationFn: (payload) => api.post("/public/messages", payload),
    onSuccess: (response, payload) => {
      const ticketCode = response.data?.data?.ticketCode;
      setSuccess({ ticketCode, payload });
      clearDraft();
      toast.success("Konsultasi berhasil dikirim.");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Konsultasi gagal dikirim. Coba lagi."),
    onSettled: () => { sendingRef.current = false; },
  });

  const submit = async () => {
    if (sendingRef.current || mutation.isPending || uploading || success) return;
    if (!(await validateStep(3))) return;
    if (sendingRef.current || mutation.isPending || uploading || success) return;
    const form = getValues();
    const payload = {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      subject: form.subject.trim() || `Konsultasi ${selectedService?.title || "proyek"}`,
      body: form.body.trim(), serviceId: form.serviceId, budgetRange: form.budgetRange,
      projectLocation: form.projectLocation.trim(), projectArea: form.projectArea,
      startEstimate: form.startEstimate, preferredContact: form.preferredContact,
      preferredTime: form.preferredTime, attachments: form.attachments || [],
      consent: form.consent, website: form.website, source: "contact-consultation",
    };
    lastPayload.current = payload;
    sendingRef.current = true;
    mutation.mutate(payload);
  };

  const retry = () => { if (lastPayload.current && !sendingRef.current && !mutation.isPending) { sendingRef.current = true; mutation.mutate(lastPayload.current); } };
  const resetForm = () => { clearDraft(); sendingRef.current = false; setSuccess(null); setStep(1); setFiles([]); reset({ ...DEFAULT_VALUES, body: "", serviceId: layananSlug && services?.find((service) => service.slug === layananSlug)?.id || "" }); };
  const waNumber = String(branch?.whatsapp || settings?.company_whatsapp || "").replace(/\D/g, "");
  const waText = success ? `Halo Jaya Abadi, saya ingin melanjutkan konsultasi. Nomor tiket saya: ${success.ticketCode}.` : "";

  if (success) return <div className="h-full rounded-3xl bg-white p-6 shadow-soft-lg sm:p-8" role="status"><div className="mx-auto max-w-xl py-5 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 size={34} /></span><h2 className="mt-5 font-jakarta text-2xl font-extrabold text-ink">Konsultasi terkirim</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">Terima kasih. Tim Jaya Abadi akan meninjau kebutuhan Anda dan segera menghubungi melalui pilihan kontak.</p><div className="mt-5 rounded-2xl bg-cream-deep p-4 text-left"><p className="text-xs font-bold uppercase tracking-wide text-ink-light">Nomor tiket</p><p className="mt-1 font-jakarta text-xl font-extrabold text-brand">{success.ticketCode || "Sedang diproses"}</p><p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-light">Ringkasan pesan</p><p className="mt-1 whitespace-pre-line text-sm text-ink">{success.payload.body}</p></div><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><a href={waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : "#"} target={waNumber ? "_blank" : undefined} rel={waNumber ? "noreferrer" : undefined} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition ${waNumber ? "bg-success hover:bg-success/90" : "pointer-events-none bg-ink/30"}`}><MessageCircle size={16} /> Lanjut via WhatsApp</a><button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream transition hover:bg-ink/80"><RotateCcw size={15} /> Konsultasi lain</button></div></div></div>;

  const errorFor = (name) => errors[name]?.message;
  return <form onSubmit={handleSubmit(submit)} noValidate className="h-full rounded-3xl bg-white p-6 shadow-soft-lg sm:p-8">
    <ProgressBar step={step} />
    <div className="mb-6"><h2 className="font-jakarta text-xl font-extrabold text-ink">Konsultasi proyek</h2><p className="mt-1 text-sm text-ink-light">Isi beberapa detail agar tim kami dapat memberi arahan yang tepat.</p></div>

    {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
      <Field id="consult-name" label="Nama lengkap" error={errorFor("name")}><input id="consult-name" autoComplete="name" {...register("name")} aria-invalid={!!errorFor("name")} aria-describedby={errorFor("name") ? "consult-name-error" : undefined} className={fieldClass(errorFor("name"))} placeholder="Nama Anda" /></Field>
      <Field id="consult-email" label="Email" error={errorFor("email")}><input id="consult-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errorFor("email")} aria-describedby={errorFor("email") ? "consult-email-error" : undefined} className={fieldClass(errorFor("email"))} placeholder="nama@email.com" /></Field>
      <Field id="consult-phone" label="Telepon / WhatsApp" error={errorFor("phone")}><input id="consult-phone" type="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!errorFor("phone")} aria-describedby={errorFor("phone") ? "consult-phone-error" : undefined} className={fieldClass(errorFor("phone"))} placeholder="0812xxxx" /></Field>
      <Field id="consult-contact" label="Cara dihubungi" error={errorFor("preferredContact")}><select id="consult-contact" {...register("preferredContact")} className={fieldClass(errorFor("preferredContact"))}><option value="WHATSAPP">WhatsApp</option><option value="TELEPON">Telepon</option><option value="EMAIL">Email</option></select></Field>
      <Field id="consult-time" label="Waktu yang disukai" error={errorFor("preferredTime")}><select id="consult-time" {...register("preferredTime")} className={fieldClass(errorFor("preferredTime"))}><option value="BEBAS">Bebas</option><option value="PAGI">Pagi (08.00–12.00)</option><option value="SIANG">Siang (12.00–15.00)</option><option value="SORE">Sore (15.00–17.00)</option></select></Field>
    </div>}

    {step === 2 && <div className="grid gap-4 sm:grid-cols-2">
      <Field id="consult-service" label="Jenis layanan" error={errorFor("serviceId")} hint={servicesLoading ? "Memuat layanan…" : undefined}><select id="consult-service" {...register("serviceId")} disabled={servicesLoading} className={fieldClass(errorFor("serviceId"))}><option value="">Pilih layanan</option>{(services || []).map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select></Field>
      <Field id="consult-location" label="Lokasi proyek" error={errorFor("projectLocation")}><input id="consult-location" autoComplete="street-address" {...register("projectLocation")} className={fieldClass(errorFor("projectLocation"))} placeholder="Kota atau alamat proyek" /></Field>
      <Field id="consult-area" label="Perkiraan luas (m²)" error={errorFor("projectArea")}><input id="consult-area" type="number" min="1" inputMode="numeric" {...register("projectArea")} className={fieldClass(errorFor("projectArea"))} placeholder="Contoh: 120" /></Field>
      <Field id="consult-budget" label="Kisaran anggaran" error={errorFor("budgetRange")}><select id="consult-budget" {...register("budgetRange")} className={fieldClass(errorFor("budgetRange"))}><option value="">Pilih kisaran</option>{BUDGETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field id="consult-start" label="Perkiraan mulai" error={errorFor("startEstimate")}><select id="consult-start" {...register("startEstimate")} className={fieldClass(errorFor("startEstimate"))}><option value="">Pilih waktu mulai</option><option value="Secepatnya">Secepatnya</option><option value="1–3 bulan">Dalam 1–3 bulan</option><option value="3–6 bulan">Dalam 3–6 bulan</option><option value="Lebih dari 6 bulan">Lebih dari 6 bulan</option><option value="Belum ditentukan">Belum ditentukan</option></select></Field>
      {(projectRef || packageRef) && <div className="sm:col-span-2 rounded-xl bg-brand-soft/50 px-4 py-3 text-xs text-ink-soft"><p className="font-bold text-brand-dark">Referensi dari halaman sebelumnya</p>{projectRef && <p className="mt-1">Proyek: {projectRef}</p>}{packageRef && <p className="mt-0.5">Paket: {packageRef}</p>}</div>}
    </div>}

    {step === 3 && <div className="space-y-5">
      <Field id="consult-body" label="Ceritakan kebutuhan proyek" error={errorFor("body")} hint="Semakin lengkap detailnya, semakin tepat arahan awal kami."><textarea id="consult-body" rows={6} {...register("body")} className={fieldClass(errorFor("body"))} placeholder="Ceritakan kebutuhan, gaya, atau kendala proyek Anda…" /></Field>
      <div><p className="mb-1.5 text-sm font-semibold text-ink">Lampiran <span className="font-normal text-ink-light">(opsional)</span></p><label htmlFor="consult-files" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }} className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition ${dragging ? "border-brand bg-brand-soft" : "border-ink/15 bg-cream-deep/30 hover:border-brand hover:bg-brand-soft/30"}`}><Upload size={24} className="text-brand" /><span className="mt-2 text-sm font-bold text-ink">Tarik file ke sini atau pilih file</span><span className="mt-1 text-xs text-ink-light">Denah/foto: JPG, PNG, WebP, PDF · maks. 3 file, 5 MB/file</span><input id="consult-files" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="sr-only" onChange={(event) => { uploadFiles(event.target.files); event.target.value = ""; }} /></label>{uploadError && <p role="alert" className="mt-2 flex items-center gap-1 text-xs text-danger"><AlertCircle size={12} />{uploadError}</p>}<UploadedFiles files={files} onRemove={removeFile} /></div>
      <div className={`rounded-xl border px-4 py-3 ${errorFor("consent") ? "border-danger bg-danger-soft" : "border-ink/10 bg-cream-deep/30"}`}><label htmlFor="consult-consent" className="flex cursor-pointer items-start gap-3 text-sm text-ink"><input id="consult-consent" type="checkbox" {...register("consent")} className="mt-0.5 h-4 w-4 accent-brand" /><span>Saya menyetujui data ini digunakan Jaya Abadi untuk menghubungi saya terkait konsultasi proyek.</span></label>{errorFor("consent") && <p role="alert" className="mt-2 flex items-center gap-1 text-xs text-danger"><AlertCircle size={12} />{errorFor("consent")}</p>}</div>
      <div className="absolute -left-[9999px]" aria-hidden="true"><label htmlFor="consult-website">Website</label><input id="consult-website" tabIndex={-1} autoComplete="off" {...register("website")} /></div>
      {mutation.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"><span>{mutation.error?.response?.data?.message || "Konsultasi gagal dikirim."}</span><button type="button" onClick={retry} disabled={mutation.isPending} className="inline-flex shrink-0 items-center gap-1 font-bold hover:underline"><RotateCcw size={14} /> Coba lagi</button></div>}
    </div>}

    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={goBack} disabled={step === 1 || mutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-ink-soft transition hover:bg-ink/5 disabled:invisible"><ArrowLeft size={16} /> Kembali</button>{step < 3 ? <button type="button" onClick={goNext} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(242,107,58,0.25)] transition hover:bg-brand-dark">Lanjut <ArrowRight size={16} /></button> : <button type="submit" disabled={mutation.isPending || uploading} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(242,107,58,0.25)] transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Mengirim…</> : uploading ? "Menunggu unggahan…" : <><Send size={16} /> Kirim konsultasi</>}</button>}</div><p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-light"><ShieldCheck size={14} className="text-brand" /> Data Anda aman dan tidak dibagikan.</p>
  </form>;
}
