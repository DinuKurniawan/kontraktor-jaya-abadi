// Shared hooks untuk data publik yang dipakai banyak komponen.
// Satu definisi queryFn per queryKey → React Query deduplikasi in-flight otomatis
// dan semua observer memakai opsi cache yang sama.
//
// Semua data beranda diambil lewat satu endpoint /public/home: satu cold start
// Vercel, bukan tujuh request paralel yang masing-masing bayar boot ~3-4 dtk.
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios.js";

const HOME_FN = async () => (await api.get("/public/home")).data.data;
const HOME_OPTS = { queryKey: ["public-home"], queryFn: HOME_FN, staleTime: 60_000 };

/** Semua data beranda sekaligus (hero, settings, services, features, testimonials, posts). */
export function usePublicHome() {
  return useQuery(HOME_OPTS);
}

/** Settings perusahaan (kontak, sosmed, jam kerja, hero, dsb). */
export function usePublicSettings() {
  return useQuery({ ...HOME_OPTS, select: (d) => d.settings });
}

/** Daftar semua layanan aktif. */
export function usePublicServices() {
  return useQuery({ ...HOME_OPTS, select: (d) => d.services });
}

/** Semua testimoni (tanpa filter). */
export function usePublicTestimonials() {
  return useQuery({ ...HOME_OPTS, select: (d) => d.testimonials });
}

/** Slide hero aktif. */
export function usePublicHeroSlides() {
  return useQuery({ ...HOME_OPTS, select: (d) => d.heroSlides });
}

/** Keunggulan (features) terbit. */
export function usePublicFeatures() {
  return useQuery({ ...HOME_OPTS, select: (d) => d.features });
}

/** 4 artikel terbaru untuk beranda. */
export function usePublicLatestPosts() {
  return useQuery({ ...HOME_OPTS, select: (d) => d.posts });
}
