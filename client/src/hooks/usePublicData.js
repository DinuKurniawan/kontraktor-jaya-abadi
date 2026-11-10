// Shared hooks untuk data publik yang dipakai banyak komponen.
// Satu definisi queryFn per queryKey → React Query deduplikasi in-flight otomatis
// dan semua observer memakai opsi cache yang sama.
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios.js";

const SETTINGS_FN = async () => (await api.get("/public/settings")).data.data;
const SERVICES_FN = async () => (await api.get("/public/services")).data.data;
const TESTIMONIALS_FN = async () => (await api.get("/public/testimonials")).data.data;

/** Settings perusahaan (kontak, sosmed, jam kerja, hero, dsb). */
export function usePublicSettings() {
  return useQuery({ queryKey: ["public-settings"], queryFn: SETTINGS_FN });
}

/** Daftar semua layanan aktif. */
export function usePublicServices() {
  return useQuery({ queryKey: ["public-services"], queryFn: SERVICES_FN });
}

/** Semua testimoni (tanpa filter). */
export function usePublicTestimonials() {
  return useQuery({ queryKey: ["public-testimonials"], queryFn: TESTIMONIALS_FN });
}
