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

const ABOUT_FN = async () => (await api.get("/public/about")).data.data;
const ABOUT_OPTS = { queryKey: ["public-about"], queryFn: ABOUT_FN, staleTime: 60_000 };

const POSTS_INIT_FN = async () => (await api.get("/public/posts/init")).data.data;
const POSTS_INIT_OPTS = { queryKey: ["public-posts-init"], queryFn: POSTS_INIT_FN, staleTime: 60_000 };

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
  return useQuery({ ...HOME_OPTS, select: (d) => (Array.isArray(d.posts) ? d.posts : d.posts?.data ?? []) });
}

/** Data halaman tentang (core values, timeline, mitra, sertifikat, tim). */
export function usePublicAbout() {
  return useQuery(ABOUT_OPTS);
}

export function usePublicCoreValues() {
  return useQuery({ ...ABOUT_OPTS, select: (d) => d.coreValues });
}

export function usePublicMilestones() {
  return useQuery({ ...ABOUT_OPTS, select: (d) => d.milestones });
}

export function usePublicPartners() {
  return useQuery({ ...ABOUT_OPTS, select: (d) => d.partners });
}

export function usePublicCertificates() {
  return useQuery({ ...ABOUT_OPTS, select: (d) => d.certificates });
}

export function usePublicTeam() {
  return useQuery({ ...ABOUT_OPTS, select: (d) => d.team });
}

/** Metadata & saran pencarian untuk halaman daftar artikel. */
export function usePublicPostsInit() {
  return useQuery(POSTS_INIT_OPTS);
}

export function usePublicPostCategories() {
  return useQuery({ ...POSTS_INIT_OPTS, select: (d) => d.categories });
}

export function usePublicPostTags() {
  return useQuery({ ...POSTS_INIT_OPTS, select: (d) => d.tags });
}

export function usePublicPostFacets() {
  return useQuery({ ...POSTS_INIT_OPTS, select: (d) => d.facets });
}

export function usePublicPopularPosts() {
  return useQuery({ ...POSTS_INIT_OPTS, select: (d) => d.popular });
}

export function usePublicFeaturedPosts() {
  return useQuery({ ...POSTS_INIT_OPTS, select: (d) => d.featured });
}
