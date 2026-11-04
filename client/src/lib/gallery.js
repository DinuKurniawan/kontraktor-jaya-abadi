// Kategori galeri — dipakai halaman publik (/tentang) dan admin (/admin/gallery).
export const GALLERY_CATEGORIES = [
  ["KEGIATAN", "Kegiatan"],
  ["PROYEK", "Proyek"],
  ["KANTOR", "Kantor"],
  ["PENGHARGAAN", "Penghargaan"],
];

export const GALLERY_CAT_LABEL = Object.fromEntries(GALLERY_CATEGORIES);

export const galleryCatLabel = (v) => GALLERY_CAT_LABEL[v] ?? v;
