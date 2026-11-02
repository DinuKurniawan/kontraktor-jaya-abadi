# Prompt Bertahap Website Kontraktor "Jaya Abadi"

Panduan prompt satu fitur satu prompt untuk dipakai di AI coding (Claude Code, Cursor, dll). Urutan: **Sistem → Admin → Publik → Finishing**.

## Cara Pakai

1. Tempel **Prompt 0 (Konteks Global)** di awal setiap sesi baru.
2. Jalankan prompt **berurutan**, satu per satu. Test hasilnya sebelum lanjut.
3. Untuk prompt Admin (A1 dan A2), lampirkan **gambar pertama** (dashboard Medcare). Untuk prompt Publik (P1 dan P2), lampirkan **gambar kedua** (Globe Trekker).
4. Setiap prompt sudah membatasi scope supaya AI tidak mengerjakan fitur lain.

## Tech Stack

- Frontend: React 18 + Vite, React Router v6, Tailwind CSS, TanStack Query, React Hook Form + Zod, Axios, Lucide Icons
- Backend: Node.js + Express (REST API), Prisma ORM, PostgreSQL
- Auth: JWT (httpOnly cookie) + bcrypt
- Upload: Multer (disk lokal, bisa diganti S3/Cloudinary)
- Bahasa: JavaScript (bisa diganti TypeScript)

## Struktur Folder Target

```text
jaya-abadi/
├─ client/                      # Vite + React (publik + admin dalam satu app)
│  └─ src/
│     ├─ routes/                # definisi route publik & admin, ProtectedRoute
│     ├─ layouts/               # PublicLayout, AdminLayout
│     ├─ pages/
│     │  ├─ public/             # Home, About, Services, Projects, Blog, Contact
│     │  └─ admin/              # Login, Dashboard, Projects, Services, ...
│     ├─ components/
│     │  ├─ ui/                 # Button, Input, Modal, Table, Badge (dipakai bersama)
│     │  ├─ public/             # Navbar, Footer, HeroSection, ProjectCard, ...
│     │  └─ admin/              # Sidebar, Topbar, StatCard, DataTable, ImageUploader
│     ├─ services/              # api client per modul (projectApi.js, dst)
│     ├─ hooks/  lib/  styles/
├─ server/
│  ├─ prisma/ (schema.prisma, seed.js)
│  └─ src/
│     ├─ config/  middlewares/  utils/
│     ├─ modules/<fitur>/       # route, controller, service, validation
│     └─ uploads/
└─ README.md
```

---

# PROMPT 0 — Konteks Global

```text
Kamu adalah senior fullstack engineer. Kita membangun website company profile kontraktor bernama "Jaya Abadi" (bidang: konstruksi bangunan, renovasi, interior, dan pengawasan proyek).

Stack: React + Vite (client), Express + Prisma + PostgreSQL (server), Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod.
Arsitektur: monorepo folder `client/` dan `server/`. Backend modular: server/src/modules/<fitur>/{route,controller,service,validation}.js.
Aplikasi React punya dua area: halaman publik (`/`) dan CMS admin (`/admin`).
Desain: admin mengikuti gambar referensi pertama (dashboard biru, kartu putih rounded, sidebar biru vertikal). Publik mengikuti gambar referensi kedua (latar krem, aksen oranye, kartu foto rounded, tombol pill hitam).

Aturan kerja:
- Kerjakan HANYA scope prompt yang saya berikan, jangan membuat fitur lain.
- Gunakan kode bersih, komentar singkat berbahasa Indonesia, teks UI berbahasa Indonesia.
- Sebutkan file apa saja yang dibuat/diubah di akhir jawaban dan cara mengetesnya.
- Jangan menimpa file yang sudah ada tanpa alasan; baca dulu struktur yang ada.
Konfirmasi singkat bahwa kamu paham, lalu tunggu prompt berikutnya.
```

---

# TAHAP 1 — SISTEM (Backend & Database)

## S1 — Inisialisasi Monorepo

```text
Buat struktur monorepo `jaya-abadi/` dengan folder `client/` dan `server/`.
- client: Vite + React, install tailwindcss, react-router-dom, @tanstack/react-query, axios, react-hook-form, zod, @hookform/resolvers, lucide-react. Konfigurasi Tailwind dan alias `@` ke `src/`.
- server: npm init, install express, cors, helmet, morgan, cookie-parser, dotenv, zod, bcrypt, jsonwebtoken, multer, prisma, @prisma/client, nodemon.
- Buat `.env.example` untuk client (VITE_API_URL) dan server (DATABASE_URL, JWT_SECRET, CLIENT_URL, PORT).
- Root `package.json` dengan script `dev` yang menjalankan client dan server bersamaan (concurrently).
- Buat `.gitignore` dan README singkat cara menjalankan.
Jangan buat fitur apa pun dulu. Pastikan `npm run dev` berjalan tanpa error.
```

## S2 — Skema Database Prisma

```text
Buat `server/prisma/schema.prisma` (provider postgresql) dengan model berikut, lengkap dengan relasi, `createdAt`, `updatedAt`, dan index yang sesuai:
- User: id, name, email (unique), password, role enum (SUPER_ADMIN, ADMIN, EDITOR), isActive.
- Category: id, name, slug (unique), type enum (PROJECT, POST).
- Project: id, title, slug (unique), summary, description (text), location, clientName, year, value (opsional), status enum (PLANNING, ONGOING, COMPLETED), coverImage, isFeatured, isPublished, categoryId.
- ProjectImage: id, projectId, url, caption, sortOrder.
- Service: id, title, slug (unique), shortDesc, description, icon, image, sortOrder, isPublished.
- Post: id, title, slug (unique), excerpt, content (text), coverImage, authorId, categoryId, readTime, isPublished, publishedAt.
- Testimonial: id, name, position, company, content, rating (1-5), avatar, isPublished.
- TeamMember: id, name, position, photo, bio, sortOrder, isPublished.
- HeroSlide: id, title, subtitle, image, ctaLabel, ctaUrl, sortOrder, isActive.
- Message: id, name, email, phone, subject, body, isRead, createdAt.
- SiteSetting: id, key (unique), value (text) -- untuk nama perusahaan, alamat, telepon, email, WhatsApp, jam kerja, sosmed, teks tentang, visi, misi, statistik.
- Media: id, url, filename, mimeType, size, createdAt.
Jalankan `prisma migrate dev --name init` dan buat `server/src/config/prisma.js` (singleton PrismaClient). Jelaskan relasi antar model di akhir.
```

## S3 — Seed Data Awal

```text
Buat `server/prisma/seed.js` dan script `npm run seed`:
- 1 user SUPER_ADMIN (admin@jayaabadi.co.id, password dari env SEED_ADMIN_PASSWORD, di-hash bcrypt).
- Kategori proyek: Gedung, Rumah Tinggal, Renovasi, Interior, Infrastruktur. Kategori artikel: Tips Konstruksi, Berita, Proyek.
- 4 layanan contoh, 6 proyek contoh (campuran status, 2 featured), 3 testimoni, 4 anggota tim, 3 hero slide, 3 artikel.
- SiteSetting default (nama perusahaan, alamat, telepon, email, WhatsApp, jam kerja, tentang, visi, misi, dan statistik: tahun pengalaman, proyek selesai, klien, tenaga ahli).
Seed harus idempotent (upsert). Gunakan URL gambar placeholder (picsum atau unsplash).
```

## S4 — Fondasi Server Express

```plain
Buat fondasi server di `server/src`:
- `app.js` (helmet, cors dengan origin CLIENT_URL + credentials, morgan, json parser, cookie-parser, static `/uploads`) dan `server.js`.
- Prefix semua route di `/api`. Route kesehatan `GET /api/health`.
- Middleware `errorHandler` global (format respons error seragam: `{ success:false, message, errors }`), `notFound`, dan `validate(schema)` berbasis Zod.
- Helper `asyncHandler`, helper respons sukses `{ success:true, data, meta }`, helper `slugify` (unik, otomatis tambah suffix jika bentrok) dan helper `paginate` (page, limit, search).
- Rate limit dasar untuk `/api`.
Jangan buat modul fitur dulu.
```

## S5 — Sistem Autentikasi & Otorisasi

```text
Buat modul `auth` dan `users`:
- `POST /api/auth/login` (email+password, validasi Zod, cek isActive) → set JWT di httpOnly cookie (7 hari), `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/change-password`.
- Middleware `requireAuth` dan `requireRole(...roles)`.
- CRUD `users` (hanya SUPER_ADMIN): list dengan pagination, create, update, toggle aktif, delete (tidak boleh menghapus diri sendiri).
- Password tidak pernah dikembalikan di respons.
Buat juga contoh file REST client (`server/requests.http`) untuk mengetes endpoint.
```

## S6 — Sistem Upload & Media

```text
Buat modul `media`:
- `POST /api/media/upload` (multer, multiple, field `files`): hanya jpg/png/webp, maks 5 MB per file, nama file di-random, simpan di `server/uploads/`. Simpan record ke tabel Media.
- `GET /api/media` (pagination + search), `DELETE /api/media/:id` (hapus record dan file fisik).
- Semua route wajib `requireAuth`.
- Kembalikan URL absolut berbasis env `SERVER_URL`.
Tambahkan penanganan error multer yang ramah (file terlalu besar, tipe tidak didukung).
```

## S7 — Pola Modul CRUD (Template Backend)

```text
Buat satu modul contoh yang lengkap, `categories`, sebagai template pola semua modul berikutnya:
- Admin (butuh auth): `GET /api/admin/categories` (pagination, search, filter type), `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id` (tolak jika masih dipakai).
- Publik (tanpa auth): `GET /api/public/categories?type=PROJECT`.
- Struktur file: route, controller, service, validation. Slug otomatis dari nama.
Dokumentasikan polanya di `server/README.md` agar modul lain (projects, services, posts, dst) mengikuti pola yang sama persis.
```

---

# TAHAP 2 — ADMIN CMS

> Lampirkan **gambar pertama** (dashboard Medcare) pada A1 dan A2.

## A1 — Design System Admin

```text
[Lampirkan gambar referensi 1]
Buat design system CMS admin berdasarkan gambar: sidebar biru vertikal rounded, background abu-biru muda, kartu putih rounded-2xl dengan shadow lembut, header kartu biru, tipografi bersih.
- Definisikan token di `tailwind.config.js` (primary biru ~#4361D8, primary-soft, surface, border, text, success, warning, danger) dan font (Inter/Poppins).
- Buat komponen reusable di `client/src/components/ui/`: Button (variant primary/soft/outline/danger, loading), Input, Textarea, Select, Switch, Badge, Modal, ConfirmDialog, Card, Pagination, EmptyState, Skeleton, Toast.
- Buat halaman sementara `/admin/_ui` sebagai katalog komponen.
Jangan buat layout atau halaman admin lain dulu.
```

## A2 — Layout Admin (Sidebar, Topbar, Proteksi Route)

```text
[Lampirkan gambar referensi 1]
Buat `AdminLayout` mengikuti gambar:
- Sidebar biru vertikal dengan logo "Jaya Abadi", menu ikon + label: Dashboard, Proyek, Layanan, Kategori, Artikel, Testimoni, Tim, Hero Slider, Pesan (badge jumlah belum dibaca), Media, Pengaturan Situs, Pengguna (hanya SUPER_ADMIN), Keluar.
- Topbar: kotak pencarian, ikon notifikasi, dropdown profil (nama, role, logout).
- Responsif: sidebar menjadi drawer di mobile.
- Setup React Router: `/admin/login` publik, seluruh `/admin/*` dibungkus `ProtectedRoute` (cek `/api/auth/me` via TanStack Query, redirect ke login jika belum login), `RoleRoute` untuk menu per role.
- Buat `AuthContext`/hook `useAuth`, axios instance dengan `withCredentials`.
Halaman isi cukup placeholder.
```

## A3 — Halaman Login Admin

```text
Buat `/admin/login`: layout dua kolom (form di kiri, ilustrasi/foto proyek konstruksi dengan overlay biru di kanan), konsisten dengan design system admin.
- Form email + password (React Hook Form + Zod), tombol tampil/sembunyi password, state loading, pesan error dari API.
- Setelah sukses redirect ke `/admin` (atau halaman asal sebelum dialihkan).
- Jika sudah login, langsung redirect ke dashboard.
```

## A4 — Dashboard Admin

```text
Buat `GET /api/admin/dashboard` (statistik) dan halaman `/admin` mengikuti tata letak gambar referensi 1:
- Banner sapaan "Selamat datang, {nama}" dengan tanggal dan jam.
- 3 kartu statistik bergaya mini-chart: Total Proyek (dengan rincian status), Pesan Masuk (belum dibaca), Artikel Terbit.
- Kartu donut: komposisi proyek per status. Kartu progress bar: proyek per kategori.
- Panel kanan: profil admin yang login dan daftar 5 pesan terbaru (nama, subjek, waktu).
Gunakan recharts atau SVG sederhana. Tambahkan skeleton loading.
```

## A5 — CRUD Proyek (Portofolio)

```text
Buat modul `projects` backend dan halaman admin `/admin/projects`:
Backend: CRUD admin lengkap + `PATCH /:id/publish` dan `PATCH /:id/featured`, pagination, search, filter kategori/status. Pola sama seperti modul categories.
Frontend: 
- Daftar: DataTable dengan thumbnail, judul, kategori, status (badge), switch publish/featured, aksi edit/hapus (ConfirmDialog), filter, pencarian, pagination.
- Form tambah/edit (halaman terpisah): judul, slug otomatis, ringkasan, deskripsi (textarea/rich text sederhana), lokasi, klien, tahun, nilai proyek, status, kategori, cover image, galeri multi-gambar (urutkan drag/atau tombol naik-turun), toggle publish/featured.
- Validasi Zod dan toast sukses/gagal.
```

## A6 — CRUD Layanan

```text
Buat modul `services` backend dan halaman `/admin/services` (pola sama dengan Proyek): field judul, slug, deskripsi singkat, deskripsi lengkap, pilihan ikon (Lucide), gambar, urutan tampil, publish. Tambahkan fitur ubah urutan (sortOrder) lewat tombol naik/turun yang menyimpan ke endpoint `PATCH /api/admin/services/reorder`.
```

## A7 — CRUD Kategori

```text
Pakai modul `categories` dari S7. Buat halaman `/admin/categories` dengan dua tab (Kategori Proyek, Kategori Artikel), tabel sederhana, tambah/edit lewat Modal, hapus dengan ConfirmDialog (tampilkan pesan jika kategori masih dipakai).
```

## A8 — CRUD Artikel / Blog

```text
Buat modul `posts` backend dan halaman `/admin/posts`: daftar + form (judul, slug, ringkasan, konten rich text sederhana, cover, kategori, estimasi waktu baca otomatis dari konten, status draft/terbit, tanggal terbit). Penulis diambil dari user login. Filter status dan kategori, pencarian judul.
```

## A9 — CRUD Testimoni

```text
Buat modul `testimonials` backend dan halaman `/admin/testimonials`: tabel + Modal form (nama, jabatan, perusahaan, isi testimoni, rating bintang 1-5 interaktif, avatar opsional, publish). Tampilkan bintang di tabel.
```

## A10 — CRUD Tim

```text
Buat modul `team` backend dan halaman `/admin/team`: tampilan grid kartu (foto, nama, jabatan) dengan aksi edit/hapus, Modal form (nama, jabatan, bio, foto, urutan, publish), dan tombol ubah urutan.
```

## A11 — CRUD Hero Slider

```text
Buat modul `hero-slides` backend dan halaman `/admin/hero-slides`: daftar kartu dengan preview gambar, form (judul, subjudul, gambar, label tombol, URL tombol, urutan, aktif). Batasi maksimal 5 slide aktif. Tambahkan preview langsung gambar yang diunggah.
```

## A12 — Inbox Pesan Masuk

```text
Buat modul `messages`: publik `POST /api/public/messages` (rate limit ketat, validasi, honeypot anti spam); admin `GET` (pagination, filter belum dibaca), `GET /:id` (otomatis tandai dibaca), `PATCH /:id/read`, `DELETE`, dan `GET /unread-count`.
Halaman `/admin/messages`: layout dua panel (daftar di kiri, detail di kanan), badge belum dibaca di sidebar yang ter-update, tombol balas via email (mailto) dan WhatsApp (wa.me), hapus pesan.
```

## A13 — Media Library

```text
Buat halaman `/admin/media`: grid gambar, drag & drop upload multiple dengan progress, pencarian, klik untuk lihat detail (nama, ukuran, URL, tombol salin URL), hapus. Buat juga komponen reusable `ImagePicker` (Modal berisi media library + tab upload baru) yang menggantikan input gambar di semua form admin sebelumnya (Proyek, Layanan, Artikel, Testimoni, Tim, Hero).
```

## A14 — Pengaturan Situs & Manajemen Pengguna

```text
Buat dua halaman:
1) `/admin/settings`: form bertab (Profil Perusahaan: nama, tagline, logo, alamat, telepon, email, WhatsApp, jam kerja; Tentang Kami: deskripsi, visi, misi, foto; Statistik: 4 angka beranda; Sosial Media; SEO default: meta title dan description). Backend `GET/PUT /api/admin/settings` (upsert key-value) dan `GET /api/public/settings`.
2) `/admin/users` (SUPER_ADMIN saja): tabel pengguna, tambah/edit via Modal, atur role, aktif/nonaktif, reset password; plus halaman ubah password sendiri di menu profil.
```

---

# TAHAP 3 — HALAMAN PUBLIK

> Lampirkan **gambar kedua** (Globe Trekker) pada P1 dan P2. Semua halaman publik memakai endpoint `/api/public/*` (tanpa auth). Pastikan modul publik tiap fitur sudah ada: tambahkan endpoint publik jika belum.

## P1 — Design System Publik

```text
[Lampirkan gambar referensi 2]
Buat design system website publik berdasarkan gambar: latar krem hangat (~#FBF5F0), aksen oranye (~#F26B3A) untuk kata sorotan dan tombol utama, tombol sekunder pill hitam/outline, kartu foto rounded-2xl, judul bold besar, jarak antar section lega.
- Token di Tailwind (namespace `brand`, `cream`, `ink`) dan font (Plus Jakarta Sans atau Poppins). Karena ini kontraktor, ganti nuansa ke konstruksi namun pertahankan gaya gambar referensi.
- Komponen di `client/src/components/public/`: SectionHeading (judul + link "lihat semua"), PillButton, ProjectCard (foto rounded + judul + lokasi), ServiceCard, ArticleCard (kategori, judul, tanggal, waktu baca), TestimonialCard, Container, Breadcrumb, Skeleton.
- Buat halaman sementara `/_ui-public` sebagai katalog.
Jangan buat layout atau halaman dulu.
```

## P2 — Layout Publik (Navbar & Footer)

```text
[Lampirkan gambar referensi 2]
Buat `PublicLayout`:
- Navbar: logo "Jaya Abadi", menu (Beranda, Tentang, Layanan, Proyek, Artikel, Kontak), tombol pill hitam "Hubungi Kami". Sticky, berubah gaya saat scroll, hamburger menu di mobile.
- Footer: logo + deskripsi singkat, kolom Perusahaan, Layanan, Proyek Unggulan, Kontak (alamat, telepon, email, WhatsApp) dan sosial media, baris hak cipta gelap di paling bawah seperti gambar. Data kontak dari `GET /api/public/settings`.
- Tombol WhatsApp melayang di kanan bawah. Scroll-to-top saat pindah route.
- Daftarkan semua route publik dengan halaman placeholder: `/`, `/tentang`, `/layanan`, `/layanan/:slug`, `/proyek`, `/proyek/:slug`, `/artikel`, `/artikel/:slug`, `/kontak`, dan halaman 404.
```

## P3 — Beranda: Hero

```text
Buat section Hero di `/` mengikuti gambar referensi 2: judul besar dengan satu kata beraksen oranye bergaris bawah, paragraf pendek, tombol pill oranye "Konsultasi Gratis" dan tombol sekunder "Lihat Proyek", di kanan kolase 3 foto rounded berukuran berbeda. Data dari tabel HeroSlide (`GET /api/public/hero-slides`): jika lebih dari satu slide, ganti otomatis tiap 6 detik dengan indikator titik. Tambahkan loading skeleton dan fallback jika data kosong.
```

## P4 — Beranda: Statistik & Layanan

```text
Buat dua section di Beranda:
1) Strip statistik (tahun pengalaman, proyek selesai, klien puas, tenaga ahli) dari SiteSetting dengan animasi hitung naik saat terlihat di layar.
2) "Layanan Kami": grid ServiceCard (ikon, judul, deskripsi singkat, link detail) dari `GET /api/public/services`, tombol "Lihat semua layanan".
```

## P5 — Beranda: Proyek Unggulan

```text
Buat section "Proyek Unggulan" seperti blok "Top Destinations" di gambar referensi 2: tab filter kategori (Semua, Gedung, Rumah Tinggal, Renovasi, dst) di atas, grid 4 kolom ProjectCard foto tinggi rounded (judul + lokasi), carousel geser di mobile, tombol outline "Jelajahi semua proyek". Data dari `GET /api/public/projects?featured=true&category=`.
```

## P6 — Beranda: Testimoni, Artikel Terbaru, CTA

```text
Buat tiga section penutup Beranda:
1) "Kata Klien Kami" seperti blok "Trekker's Highlights": satu testimoni besar (avatar, nama, bintang, isi) dengan navigasi panah dan foto proyek di sisi kanan.
2) "Artikel Terbaru": layout seperti "Latest Stories" (1 artikel besar kiri + 3 artikel kecil kanan) dari `GET /api/public/posts?limit=4`.
3) Banner CTA berlatar foto proyek dengan overlay gelap, judul "Wujudkan Bangunan Impian Anda" dan form singkat (nama + nomor WhatsApp) yang mengirim ke `POST /api/public/messages`.
```

## P7 — Halaman Tentang Kami

```text
Buat `/tentang`: banner judul + breadcrumb, profil perusahaan (teks + foto dari SiteSetting), kartu Visi dan Misi, statistik, grid anggota tim (`/api/public/team`), dan section "Mengapa Memilih Kami" (4 poin dengan ikon, konten statis boleh). Terapkan animasi fade-in saat scroll yang ringan.
```

## P8 — Halaman Layanan & Detail Layanan

```text
Buat dua halaman:
- `/layanan`: banner, grid ServiceCard lengkap.
- `/layanan/:slug`: gambar utama, deskripsi lengkap, daftar layanan lain di sidebar, proyek terkait, dan tombol CTA konsultasi. Tampilkan 404 jika slug tidak ditemukan.
Gunakan TanStack Query dengan state loading dan error.
```

## P9 — Halaman Portofolio Proyek & Detail

```text
Buat dua halaman:
- `/proyek`: filter kategori (pill), filter status (Selesai/Berjalan), pencarian, grid ProjectCard, pagination atau tombol "Muat lebih banyak". Sinkronkan filter dengan query string URL.
- `/proyek/:slug`: galeri foto (gambar utama + thumbnail + lightbox), tabel info (klien, lokasi, tahun, status, nilai), deskripsi, dan "Proyek Serupa" (kategori sama).
Backend publik: `GET /api/public/projects` (pagination, filter, search, hanya yang isPublished) dan `GET /api/public/projects/:slug`.
```

## P10 — Halaman Artikel & Detail

```text
Buat dua halaman:
- `/artikel`: artikel besar + grid, filter kategori, pencarian, pagination.
- `/artikel/:slug`: judul, meta (kategori, tanggal, waktu baca, penulis), cover, konten dengan tipografi nyaman (prose), tombol bagikan (WhatsApp, Facebook, salin link), dan artikel terkait.
Backend publik: list dan detail artikel (hanya isPublished dan publishedAt <= sekarang).
```

## P11 — Halaman Kontak

```text
Buat `/kontak`: kartu info (alamat, telepon, email, WhatsApp, jam kerja dari settings), embed Google Maps (iframe, URL dari setting `maps_embed`), dan form pesan (nama, email, telepon, subjek, pesan) dengan validasi Zod, honeypot, state loading, dan notifikasi sukses yang jelas. Kirim ke `POST /api/public/messages`.
```

---

# TAHAP 4 — FINISHING

## F1 — SEO & Meta

```text
Tambahkan SEO: komponen `<Seo>` (react-helmet-async) untuk title, description, canonical, dan Open Graph per halaman (detail proyek dan artikel memakai data dinamis), favicon, `sitemap.xml` dan `robots.txt` yang digenerate dari data publik (endpoint server atau script).
```

## F2 — Performa & Aksesibilitas

```text
Optimalkan: lazy loading route (React.lazy + Suspense), `loading="lazy"` dan atribut width/height pada gambar, kompres gambar saat upload (sharp, ubah ke webp, buat thumbnail), alt text pada semua gambar, fokus keyboard yang jelas, kontras warna memadai. Laporkan skor Lighthouse sebelum dan sesudah.
```

## F3 — Hardening & Deployment

```text
Siapkan produksi: validasi env saat start, CORS dan cookie secure/sameSite untuk produksi, helmet dan rate limit yang tepat, backup/seed script, Dockerfile (client, server) + `docker-compose.yml` (postgres, server, client/nginx), script `prisma migrate deploy`, dan README deployment langkah demi langkah (VPS). Sertakan checklist QA: login, semua CRUD, upload, form kontak, responsif mobile.
```

---

## Urutan Ringkas

**S1 → S7** (sistem) → **A1 → A14** (admin) → **P1 → P11** (publik) → **F1 → F3** (finishing).

Tips: setelah A5 (Proyek) selesai, test dulu alurnya dari admin sampai tampil di publik (P5 dan P9) sebelum mengerjakan CRUD lainnya, supaya pola sudah terbukti benar.

---

# TAMBAHAN — PENGAYAAN BERANDA (Lebih Kompleks)

Dipakai **setelah P3–P6 selesai**. Berdasarkan screenshot beranda saat ini, temuan utamanya: strip statistik hanya menampilkan satu angka (120+), kolase hero punya satu foto yang pudar, ruang testimoni terlalu kosong, dan belum ada section pembangun kepercayaan (mitra, sertifikat, alur kerja, FAQ). Urutan beranda target:

**Hero → Mitra/Klien → Statistik → Tentang Singkat → Layanan → Mengapa Kami → Proyek Unggulan → Sebelum/Sesudah → Alur Kerja → Kalkulator Estimasi → Testimoni → Sertifikat → FAQ → Artikel → CTA → Footer**

## Struktur Tambahan

```text
client/src/components/public/home/
├─ HeroSection.jsx          ├─ PartnerMarquee.jsx
├─ StatsStrip.jsx           ├─ AboutTeaser.jsx
├─ ServicesSection.jsx      ├─ WhyUsSection.jsx
├─ FeaturedProjects.jsx     ├─ BeforeAfterSection.jsx
├─ ProcessSection.jsx       ├─ CostEstimator.jsx
├─ TestimonialSection.jsx   ├─ CertificateSection.jsx
├─ FaqSection.jsx           ├─ LatestPosts.jsx
└─ CtaSection.jsx
client/src/pages/public/HomePage.jsx   # hanya merakit section di atas
server/src/modules/{partners,certificates,faqs,features,process-steps,before-after}/
```

---

## Tahap Sistem Tambahan

### SB1 — Skema & API Konten Beranda

```text
Tambahkan model Prisma lalu migrate (`add_home_content`):
- Partner: id, name, logo, website, sortOrder, isPublished.
- Certificate: id, title, issuer, image, year, sortOrder, isPublished.
- Faq: id, question, answer (text), sortOrder, isPublished.
- Feature (Keunggulan): id, title, description, icon, sortOrder, isPublished.
- ProcessStep: id, title, description, icon, sortOrder, isPublished.
- BeforeAfter: id, title, location, beforeImage, afterImage, projectId (opsional), sortOrder, isPublished.
- EstimatePrice: id, buildingType (enum RUMAH, RUKO, RENOVASI, INTERIOR), label, pricePerM2Min, pricePerM2Max, isPublished.
Buat modul backend untuk tiap model memakai pola categories (S7): CRUD admin + endpoint publik `GET /api/public/<nama>` (hanya isPublished, urut sortOrder) + `PATCH /reorder`. Tambahkan data contoh di seed (8 mitra, 4 sertifikat, 6 FAQ, 6 keunggulan, 5 langkah alur, 3 before/after, 4 harga estimasi). Jangan buat UI dulu.
```

---

## Tahap Admin Tambahan

### AB1 — CRUD Mitra & Sertifikat

```text
Buat halaman admin `/admin/partners` dan `/admin/certificates` (gaya sama dengan CRUD Tim): grid kartu, Modal form dengan ImagePicker, switch publish, tombol urutkan. Tambahkan menu di sidebar grup "Konten Beranda".
```

### AB2 — CRUD FAQ

```text
Buat `/admin/faqs`: daftar accordion pratinjau, Modal form (pertanyaan, jawaban), ubah urutan, publish. Tambahkan ke grup menu "Konten Beranda".
```

### AB3 — CRUD Keunggulan & Alur Kerja

```text
Buat `/admin/features` dan `/admin/process-steps`: tabel dengan pemilih ikon Lucide (dropdown dengan pratinjau ikon), judul, deskripsi, urutan (naik/turun), publish. Satu komponen `IconPicker` dipakai bersama.
```

### AB4 — CRUD Sebelum/Sesudah & Harga Estimasi

```text
Buat `/admin/before-after` (dua ImagePicker: sebelum dan sesudah, judul, lokasi, relasi proyek opsional, pratinjau slider) dan `/admin/estimate-prices` (edit harga per m² minimum dan maksimum per tipe bangunan, tampilkan format Rupiah).
```

---

## Tahap Publik: Beranda Lebih Kompleks

### H0 — Perbaikan Bug Beranda Saat Ini

```text
Perbaiki masalah di beranda berdasarkan screenshot:
1) Strip statistik hanya memunculkan "120+": render 4 item (angka, label, ikon) dalam grid, pastikan animasi hitung naik memakai IntersectionObserver dan nilai awal tidak tersembunyi, fallback ke nilai akhir jika animasi gagal.
2) Kolase hero: semua foto harus tampil penuh (tidak pudar), gunakan `object-cover`, ukuran konsisten, dan placeholder skeleton saat memuat.
3) Section testimoni: kurangi ruang kosong, rata tengah secara vertikal, ukuran kutipan lebih besar.
Hanya perbaiki tiga hal ini.
```

### H1 — Hero Premium

```text
Upgrade HeroSection: layout dua kolom dengan kolase foto rounded bertumpuk di kanan, kartu mengambang kecil ("15+ tahun pengalaman" dan "200+ proyek selesai", data dari settings) yang melayang dengan animasi halus, baris lencana kepercayaan di bawah tombol (Berizin resmi, Bergaransi, Transparan RAB), tombol video "Putar profil perusahaan" yang membuka Modal YouTube (URL dari setting `profile_video`), indikator scroll di bawah, dan latar pola garis/blueprint tipis berwarna krem gelap. Tetap dukung banyak slide dari HeroSlide.
```

### H2 — Marquee Mitra & Klien

```text
Buat PartnerMarquee tepat di bawah hero: judul kecil "Dipercaya oleh", logo mitra berjalan otomatis (CSS marquee tanpa library), grayscale lalu berwarna saat hover, berhenti saat hover, dua baris arah berlawanan di desktop. Data dari `GET /api/public/partners`. Sembunyikan section jika data kosong.
```

### H3 — Statistik Lengkap

```text
Rapikan StatsStrip: latar gelap, 4 angka besar oranye dengan ikon dan label, pemisah vertikal tipis, hitung naik saat terlihat, ditambah satu baris ringkas "Dipercaya sejak {tahun}". Data dari settings.
```

### H4 — Tentang Singkat (About Teaser)

```text
Buat AboutTeaser: kiri komposisi dua foto bertumpuk (satu besar, satu kecil bergeser) dengan lencana bundar "{n} Tahun Pengalaman", kanan label kecil oranye, judul, paragraf (dari settings `about`), daftar 4 centang (Tim bersertifikat, RAB transparan, Tepat waktu, Garansi pekerjaan), tombol "Selengkapnya" ke `/tentang`, dan tanda tangan/nama direktur. Animasi masuk dari kiri dan kanan.
```

### H5 — Layanan Interaktif

```text
Upgrade ServicesSection: kartu layanan memakai gambar latar, ikon dalam lingkaran oranye, deskripsi singkat, dan efek hover (gambar zoom, overlay gelap, panah muncul). Di desktop tampilkan grid 4 kolom dengan kartu pertama berukuran lebih besar. Perbaiki tinggi kartu agar sejajar. Data sama dari `GET /api/public/services`.
```

### H6 — Mengapa Memilih Kami

```text
Buat WhyUsSection dengan layout bento: kartu besar bergambar di kiri berisi pernyataan nilai utama dan tombol, enam kartu keunggulan (ikon, judul, deskripsi) di kanan dalam grid 2x3, kartu bergantian warna krem dan oranye lembut. Data dari `GET /api/public/features`.
```

### H7 — Proyek Unggulan Versi Bento

```text
Upgrade FeaturedProjects: grid bento (satu kartu besar 2x2 + kartu kecil), overlay gradient dengan judul, kategori, lokasi, tahun, dan badge status (Selesai/Berjalan) di setiap foto, tab kategori dengan transisi halus (tanpa reload), dan tombol "Jelajahi semua proyek". Tambahkan baris angka kecil di atas: jumlah proyek selesai, berjalan, total nilai (opsional).
```

### H8 — Sebelum & Sesudah

```text
Buat BeforeAfterSection: slider perbandingan gambar (handle geser di tengah, bisa drag mouse dan sentuh, juga keyboard), label "Sebelum" dan "Sesudah", judul dan lokasi, navigasi antar item (panah dan thumbnail), tombol "Lihat proyek" jika ada relasi. Tanpa library eksternal. Data dari `GET /api/public/before-after`.
```

### H9 — Alur Kerja

```text
Buat ProcessSection: timeline 5 langkah (Konsultasi → Survei & Desain → RAB & Kontrak → Pelaksanaan → Serah Terima). Desktop: garis horizontal putus-putus dengan nomor bulat dan ikon, garis terisi bertahap saat di-scroll. Mobile: timeline vertikal. Data dari `GET /api/public/process-steps`.
```

### H10 — Kalkulator Estimasi Biaya

```text
Buat CostEstimator interaktif: pilih tipe bangunan (dari EstimatePrice), geser slider luas (20–1000 m²), pilih tingkat finishing (Standar, Menengah, Premium) yang mengubah pengali, hasil rentang biaya (min–maks, format Rupiah) berubah langsung dengan animasi angka. Tampilkan catatan "estimasi awal, bukan penawaran resmi". Tombol "Kirim estimasi ke tim kami" membuka form kecil (nama, WhatsApp) yang mengirim ke `POST /api/public/messages` dengan isi ringkasan pilihan otomatis.
```

### H11 — Testimoni Carousel

```text
Upgrade TestimonialSection: sisi kiri ringkasan rating (skor rata-rata besar, jumlah ulasan), kutipan besar dengan tanda kutip dekoratif, bintang, avatar, jabatan, kemudian carousel otomatis dengan panah dan titik, geser sentuh di mobile. Sisi kanan foto proyek terkait (dengan caption) berganti sesuai testimoni. Sembunyikan avatar kosong dengan inisial berwarna.
```

### H12 — Sertifikat & Legalitas

```text
Buat CertificateSection: grid 4 kartu sertifikat (gambar, judul, penerbit, tahun) dengan klik untuk lightbox. Di sampingnya, daftar legalitas singkat (NIB, SBU, ISO) dengan ikon centang. Data dari `GET /api/public/certificates`.
```

### H13 — FAQ

```text
Buat FaqSection: dua kolom (kiri judul, deskripsi singkat dan tombol "Tanya via WhatsApp"; kanan accordion), hanya satu item terbuka pada satu waktu, animasi tinggi halus, aksesibel (aria-expanded, tombol keyboard). Data dari `GET /api/public/faqs`. Tambahkan JSON-LD FAQPage untuk SEO.
```

### H14 — Artikel Terbaru & Newsletter

```text
Perbaiki LatestPosts: satu artikel besar + tiga kecil dengan tinggi seimbang (saat ini hanya dua artikel kecil), tampilkan kategori, tanggal, waktu baca. Tambahkan blok langganan newsletter ringkas di bawahnya (email saja) dengan model `Subscriber` (email unik) dan endpoint `POST /api/public/subscribe` serta daftar di admin `/admin/subscribers` (tabel + ekspor CSV).
```

### H15 — CTA Konsultasi Multi-Langkah & Footer

```text
Upgrade CtaSection: form 3 langkah dengan progress (1. Jenis proyek, 2. Lokasi dan estimasi anggaran, 3. Nama dan WhatsApp), transisi antar langkah, validasi per langkah, simpan ke Message dengan subjek otomatis. Di sisi kiri tambahkan tiga jaminan singkat dan nomor telepon besar. Perkaya footer: tambah kolom jam kerja, baris sosial media berikon, dan tombol kembali ke atas.
```

### H16 — Animasi, Responsif, & Perakitan Akhir

```text
Rakit `HomePage.jsx` sesuai urutan target. Tambahkan komponen `Reveal` (fade/slide saat terlihat, hormati prefers-reduced-motion), penanda menu aktif berdasarkan scroll, skeleton untuk tiap section, dan state kosong yang menyembunyikan section jika tidak ada data. Uji tampilan di 375, 768, 1024, 1440 px, pastikan tidak ada scroll horizontal, dan laporkan skor Lighthouse.
```

---

## Urutan Tambahan

**SB1 → AB1–AB4** (data & admin) → **H0 → H16** (tampilan beranda). Kerjakan H0 lebih dulu karena memperbaiki bug yang terlihat sekarang.

---

# TAMBAHAN — PENGAYAAN HALAMAN TENTANG KAMI

Dipakai **setelah P7 dan SB1 (data mitra, sertifikat, keunggulan) selesai**. Temuan dari screenshot halaman Tentang saat ini: bagian profil perusahaan menampilkan teks "belum diisi lewat CMS" dengan kotak gambar kosong, strip statistik hanya satu angka (120+), kartu Visi punya ruang kosong besar, foto tim masih placeholder yang tidak relevan, dan section "Mengapa Memilih Kami" sama persis dengan yang akan ada di beranda. Belum ada sejarah perusahaan, nilai-nilai, sambutan direktur, legalitas, galeri, maupun ajakan bertindak di akhir halaman.

Urutan halaman target:

**Banner → Profil Perusahaan → Sambutan Direktur → Visi & Misi → Nilai-Nilai → Statistik → Sejarah (Timeline) → Tim → Legalitas & Sertifikat → Galeri Kegiatan → Perbandingan → Mitra → CTA**

> Blok struktur di bawah hanya **peta acuan**, bukan prompt. Tempel sekali di awal sesi dengan kalimat pengantar (lihat bagian tips di akhir).

```text
client/src/components/public/about/
├─ AboutBanner.jsx          ├─ CompanyProfile.jsx
├─ DirectorMessage.jsx      ├─ VisionMission.jsx
├─ CoreValues.jsx           ├─ AboutStats.jsx
├─ HistoryTimeline.jsx      ├─ TeamSection.jsx
├─ LegalitySection.jsx      ├─ GallerySection.jsx
├─ ComparisonTable.jsx      └─ AboutCta.jsx
client/src/pages/public/AboutPage.jsx   # hanya merakit section di atas
server/src/modules/{milestones,core-values,gallery}/
```

---

## Tahap Sistem Tambahan

### TB1 — Skema & API Konten Halaman Tentang

```text
Tambahkan model Prisma lalu migrate (`add_about_content`):
- Milestone: id, year (int), title, description, image (opsional), sortOrder, isPublished.
- CoreValue: id, title, description, icon, sortOrder, isPublished.
- GalleryItem: id, image, caption, category (enum KEGIATAN, PROYEK, KANTOR, PENGHARGAAN), sortOrder, isPublished.
- Perluas TeamMember: department (enum MANAJEMEN, TEKNIK, ARSITEK_INTERIOR, PENGAWAS, ADMINISTRASI), email, linkedin, instagram.
Buat modul backend dengan pola categories (S7): CRUD admin + `PATCH /reorder` + endpoint publik `GET /api/public/milestones`, `/core-values`, `/gallery?category=`. Tambahkan key SiteSetting baru: about_headline, about_story (text panjang), about_image, about_video_url, director_name, director_position, director_photo, director_quote, director_message, legal_nib, legal_sbu, legal_npwp, legal_address. Isi seed: 7 milestone (2008–2026), 5 nilai, 12 galeri, dan semua key setting. Jangan buat UI dulu.
```

---

## Tahap Admin Tambahan

### TA1 — CRUD Sejarah & Nilai-Nilai

```text
Buat `/admin/milestones` (tabel diurutkan tahun, Modal form: tahun, judul, deskripsi, gambar opsional, publish) dan `/admin/core-values` (kartu dengan IconPicker, judul, deskripsi, urutan, publish). Taruh di grup sidebar "Halaman Tentang".
```

### TA2 — CRUD Galeri Kegiatan

```text
Buat `/admin/gallery`: grid foto dengan filter kategori, unggah banyak foto sekaligus lewat ImagePicker/Media Library, edit caption dan kategori lewat Modal, urutan naik/turun, publish, hapus massal (pilih beberapa lalu hapus dengan konfirmasi).
```

### TA3 — Pengaturan Konten Halaman Tentang

```text
Tambahkan tab "Halaman Tentang" di `/admin/settings` dengan tiga kelompok: (1) Profil: headline, cerita perusahaan (textarea besar dengan penghitung karakter), foto utama, URL video profil. (2) Sambutan Direktur: nama, jabatan, foto, kutipan singkat, isi sambutan. (3) Legalitas: NIB, SBU, NPWP, alamat legal. Simpan lewat endpoint settings yang sudah ada dengan pratinjau gambar.
Perbarui juga form Tim (`/admin/team`): tambah pilihan divisi, email, LinkedIn, dan Instagram.
```

---

## Tahap Publik: Halaman Tentang Lebih Kompleks

### T0 — Perbaikan Masalah Halaman Saat Ini

```text
Perbaiki di `/tentang`:
1) Bagian profil: jangan menampilkan teks "belum diisi lewat CMS" kepada pengunjung; jika data kosong tampilkan konten default yang layak dan sembunyikan gambar kosong.
2) Strip statistik: render 4 item penuh (angka, label, ikon), bukan hanya satu angka.
3) Kartu Visi: samakan tinggi dengan kartu Misi dan isi ruang kosong (ikon besar samar atau kutipan).
4) Foto tim: pakai `object-cover` rasio 4:5, tampilkan avatar inisial berwarna jika foto kosong.
Hanya perbaiki empat hal ini.
```

### T1 — Banner Halaman

```text
Buat AboutBanner: latar foto lebar (setting `about_image`) dengan overlay gelap gradasi, breadcrumb, judul besar "Tentang Kami" dengan kata beraksen oranye, subjudul dari `about_headline`, dan baris sub-navigasi anchor (Profil, Visi Misi, Sejarah, Tim, Legalitas, Galeri) yang menempel (sticky) di bawah navbar dan menandai section aktif saat di-scroll dengan smooth scroll.
```

### T2 — Profil Perusahaan

```text
Buat CompanyProfile: kiri komposisi foto bertumpuk dengan lencana bundar "{n} Tahun Berpengalaman" dan tombol play yang membuka Modal video (`about_video_url`); kanan label kecil oranye, judul, cerita perusahaan (`about_story`, pecah per paragraf), daftar 4 poin centang, dan dua tombol ("Hubungi Kami", "Unduh Company Profile" jika setting `profile_pdf` terisi). Animasi masuk kiri-kanan.
```

### T3 — Sambutan Direktur

```text
Buat DirectorMessage: foto direktur dalam bingkai rounded dengan blok oranye offset di belakangnya, kutipan besar bertanda kutip dekoratif, isi sambutan, nama, jabatan, dan area tanda tangan (teks cursive). Latar krem gelap. Data dari settings `director_*`; sembunyikan section jika kosong.
```

### T4 — Visi & Misi

```text
Redesain VisionMission: dua kartu sejajar dengan tinggi sama, kartu Visi berlatar oranye dengan teks putih dan ikon target besar samar, kartu Misi putih dengan daftar bernomor (lingkaran angka oranye). Tambahkan animasi muncul bergantian. Data dari settings `vision` dan `mission` (pisahkan misi per baris).
```

### T5 — Nilai-Nilai Perusahaan

```text
Buat CoreValues: judul tengah "Nilai yang Kami Pegang", grid 5 kartu (ikon bundar, judul, deskripsi) yang naik sedikit dan berganti warna latar saat hover; di mobile menjadi carousel geser. Data dari `GET /api/public/core-values`.
```

### T6 — Statistik

```text
Buat AboutStats: latar gelap dengan pola blueprint tipis, 4 angka besar (Tahun Pengalaman, Proyek Selesai, Klien Puas, Tenaga Ahli) dengan ikon, hitung naik saat terlihat. Di bawahnya satu baris tambahan mini (luas total bangunan terbangun, jumlah kota, tingkat proyek tepat waktu dalam persen) dari settings.
```

### T7 — Sejarah Perusahaan (Timeline)

```text
Buat HistoryTimeline: timeline vertikal bergantian kiri-kanan di desktop (garis tengah dengan titik oranye, tahun besar, kartu berisi judul, deskripsi, gambar opsional), satu kolom di mobile. Garis terisi progresif saat di-scroll, kartu muncul bergantian. Data dari `GET /api/public/milestones` diurutkan tahun.
```

### T8 — Tim Ahli Lengkap

```text
Upgrade TeamSection: tab filter divisi (Semua, Manajemen, Teknik, Arsitek & Interior, Pengawas), kartu foto rasio 4:5 dengan overlay saat hover yang menampilkan ikon sosial (email, LinkedIn, Instagram), klik kartu membuka Modal profil (foto, nama, jabatan, bio lengkap, tombol kontak). Tambahkan statistik kecil di atas: jumlah anggota tim dan jumlah divisi. Data dari `GET /api/public/team?department=`.
```

### T9 — Legalitas & Sertifikat

```text
Buat LegalitySection: kiri kartu data legalitas (NIB, SBU, NPWP, alamat legal) dengan tombol salin; kanan grid sertifikat (gambar, judul, penerbit, tahun) dengan lightbox. Data sertifikat dari `GET /api/public/certificates`, data legalitas dari settings. Tambahkan lencana kecil "Terverifikasi".
```

### T10 — Galeri Kegiatan

```text
Buat GallerySection: filter kategori (Semua, Kegiatan, Proyek, Kantor, Penghargaan), grid masonry responsif, hover menampilkan caption, klik membuka lightbox dengan navigasi panah, swipe, tombol Esc, dan penghitung foto. Muat 9 foto awal dengan tombol "Muat lebih banyak". Data dari `GET /api/public/gallery`.
```

### T11 — Tabel Perbandingan

```text
Buat ComparisonTable "Mengapa Jaya Abadi?" (ganti isi section "Mengapa Memilih Kami" lama agar tidak duplikat dengan beranda): tabel dua kolom Jaya Abadi vs Kontraktor Biasa dengan 6 baris (RAB transparan, laporan progres mingguan, garansi, tenaga bersertifikat, K3, jadwal tertulis) memakai ikon centang dan silang. Kolom Jaya Abadi disorot warna oranye lembut. Di mobile berubah menjadi kartu bertumpuk. Data dari `GET /api/public/features` bila tersedia, jika tidak gunakan konten statis.
```

### T12 — Mitra & CTA Penutup

```text
Pakai ulang komponen PartnerMarquee (dari beranda) di bawah galeri. Lalu buat AboutCta: banner berlatar foto proyek dengan overlay gelap, judul "Mari Wujudkan Proyek Anda Bersama Kami", dua tombol (Konsultasi via WhatsApp, Lihat Proyek), dan baris kontak cepat (telepon dan email).
```

### T13 — Perakitan, SEO & QA

```text
Rakit `AboutPage.jsx` sesuai urutan target, tambahkan komponen `Reveal` untuk animasi masuk, skeleton per section, dan sembunyikan section yang datanya kosong. Tambahkan `<Seo>` dengan JSON-LD `Organization` (nama, logo, alamat, telepon, sosial media). Uji di 375, 768, 1024, dan 1440 px, pastikan tidak ada scroll horizontal, dan laporkan skor Lighthouse.
```

---

## Urutan Pengerjaan Halaman Tentang

**TB1 → TA1–TA3** (data dan admin) → **T0 → T13** (tampilan). Kerjakan T0 lebih dulu karena memperbaiki masalah yang terlihat sekarang. Isi konten lewat admin (profil, sambutan, legalitas, foto tim asli) sebelum menilai tampilan akhir.

---

# REVISI — GALERI HALAMAN TENTANG (Pagination)

Prompt ini **menggantikan bagian "muat lebih banyak" pada T10**. Semua foto langsung ditampilkan, tanpa tombol "Muat lebih banyak lagi (3)"; jika lebih dari 12 foto, dipakai pagination.

### T10b — Galeri dengan Pagination

```text
Revisi GallerySection di `/tentang`. Fokus hanya pada section galeri.

Yang dihapus:
- Tombol "Muat lebih banyak lagi (n)" dan seluruh logika load more / jumlah foto awal.

Aturan tampilan:
- Semua foto pada halaman aktif langsung tampil, tidak ada pemuatan tambahan lewat tombol.
- Batas 12 foto per halaman (grid 4 kolom desktop, 3 kolom tablet, 2 kolom mobile).
- Jika total foto <= 12, pagination TIDAK ditampilkan sama sekali.
- Jika total foto > 12, tampilkan pagination di bawah grid, rata tengah: tombol "Sebelumnya", nomor halaman (dengan elipsis "..." bila halaman banyak, selalu tampilkan halaman pertama, terakhir, dan 1 halaman di kiri-kanan halaman aktif), tombol "Berikutnya". Halaman aktif berwarna oranye, tombol disabled di halaman pertama/terakhir. Di mobile ringkas (Sebelumnya, "2 / 5", Berikutnya).
- Di bawah grid tampilkan teks kecil "Menampilkan 1–12 dari 30 foto".

Backend:
- Ubah `GET /api/public/gallery` agar menerima `category`, `page` (default 1), `limit` (default 12, maks 24) dan mengembalikan `meta: { page, limit, total, totalPages }`. Urutkan sortOrder lalu createdAt.

Frontend:
- Gunakan TanStack Query dengan `placeholderData: keepPreviousData` agar grid tidak berkedip saat pindah halaman, serta prefetch halaman berikutnya.
- Simpan halaman aktif dan kategori di query string URL (`?kategori=proyek&hal=2`) agar bisa dibagikan dan tombol Back berfungsi. Jangan memakai hash, karena hash dipakai sub-navigasi anchor.
- Mengganti kategori selalu mengembalikan ke halaman 1.
- Setelah pindah halaman, scroll halus ke bagian atas section galeri (kompensasi tinggi navbar + sub-navigasi sticky), tanpa reload halaman.
- Jaga tinggi grid tetap stabil (min-height / skeleton 12 kotak) agar layout tidak melompat saat memuat.
- Lightbox tetap berfungsi dengan navigasi panah, swipe, dan Esc pada foto di halaman aktif; penghitung menampilkan nomor foto di halaman tersebut.
- Pagination aksesibel: elemen `<nav aria-label="Paginasi galeri">`, `aria-current="page"` pada halaman aktif, dan bisa dioperasikan dengan keyboard.
- Jika kategori tidak punya foto, tampilkan EmptyState "Belum ada foto di kategori ini".

Buat komponen `Pagination` publik yang reusable (props: page, totalPages, onChange) karena akan dipakai juga di halaman Proyek dan Artikel. Uji dengan 8 foto (tanpa pagination), 12 foto (tanpa pagination), 13 foto (2 halaman), dan 40 foto (elipsis).
```

---

# TAMBAHAN — PENGAYAAN HALAMAN LAYANAN

Dipakai **setelah P8 dan SB1 (FAQ, alur kerja, mitra, harga estimasi) selesai**. Temuan dari screenshot halaman Layanan saat ini:

- Kartu layanan hanya teks, tanpa gambar maupun ikon, sehingga terlihat polos.
- Tata letak 3 + 1: kartu keempat sendirian di baris kedua dan banyak ruang kosong.
- Tautan "Detail layanan" berada di luar kartu dan tinggi kartu tidak seragam.
- Belum ada ruang lingkup pekerjaan, alur kerja, paket/harga, proyek terkait, testimoni, maupun FAQ.
- Banner hanya judul dan satu kalimat; CTA penutup terlalu singkat.

Urutan halaman `/layanan` target:

**Banner → Grid Layanan → Layanan Terpadu → Ruang Lingkup (tab) → Alur Kerja → Paket & Harga → Sektor yang Dilayani → Proyek Terkait → Testimoni → FAQ → CTA**

> Blok struktur di bawah hanya **peta acuan**, bukan prompt. Tempel sekali di awal sesi dengan kalimat pengantar.

```text
client/src/components/public/services/
├─ ServicesBanner.jsx       ├─ ServiceGrid.jsx
├─ IntegratedServices.jsx   ├─ ScopeTabs.jsx
├─ ServiceProcess.jsx       ├─ PricingPackages.jsx
├─ SectorsServed.jsx        ├─ RelatedProjects.jsx
├─ ServiceTestimonials.jsx  ├─ ServiceFaq.jsx
└─ ServiceCta.jsx
client/src/pages/public/{ServicesPage.jsx, ServiceDetailPage.jsx}
server/src/modules/{service-scopes,service-packages}/
```

---

## Tahap Sistem Tambahan

### LB1 — Skema & API Konten Layanan

```text
Tambahkan model Prisma lalu migrate (`add_service_content`):
- Perluas Service: heroImage, longDescription (text), startingPrice (opsional, Int), brochureUrl (opsional), metaTitle, metaDescription, isFeatured.
- ServiceScope (ruang lingkup): id, serviceId, title, description, icon, sortOrder.
- ServicePackage: id, serviceId, name, description, priceFrom (Int), priceUnit (contoh "per m²"), features (Json array string), isPopular, ctaLabel, sortOrder, isPublished.
- Tambahkan `serviceId` (nullable, relasi opsional) pada Project, Faq, ProcessStep, dan Testimonial agar bisa dikaitkan ke layanan tertentu.
Buat modul backend dengan pola categories (S7): CRUD admin untuk scopes dan packages, `PATCH /reorder`. Endpoint publik: `GET /api/public/services` (sertakan jumlah proyek, startingPrice, scope ringkas), `GET /api/public/services/:slug` (lengkap: scopes, packages, faqs, processSteps, projects terkait maks 6, testimonials terkait, layanan sebelum/berikutnya), `GET /api/public/service-packages?serviceId=`. Perbarui seed: tiap layanan punya 4-6 ruang lingkup, 3 paket (satu isPopular), 3 FAQ, dan relasi ke proyek contoh. Jangan buat UI dulu.
```

---

## Tahap Admin Tambahan

### LA1 — Form Layanan Bertab

```text
Upgrade form tambah/edit di `/admin/services` menjadi bertab: (1) Info Utama (judul, slug, deskripsi singkat, deskripsi lengkap, ikon, gambar kartu, gambar hero, harga mulai dari, brosur PDF, unggulan, publish); (2) Ruang Lingkup (daftar item dengan IconPicker, tambah/hapus/urutkan dalam satu form tanpa pindah halaman); (3) Relasi (pilih FAQ, langkah alur kerja, proyek, dan testimoni yang ditautkan ke layanan ini dengan multi-select); (4) SEO (meta title, meta description, pratinjau tampilan di Google). Simpan semua tab dalam satu aksi "Simpan" dengan indikator perubahan belum tersimpan.
```

### LA2 — CRUD Paket Layanan

```text
Buat halaman `/admin/services/:id/packages` (juga dapat dibuka dari tombol "Kelola Paket" di daftar layanan): kartu paket yang bisa diurutkan, Modal form (nama, deskripsi, harga mulai dari, satuan, daftar fitur dinamis tambah/hapus baris, tandai "Paling Populer" - hanya satu per layanan, label tombol, publish), pratinjau kartu paket di samping form, format Rupiah otomatis.
```

---

## Tahap Publik: Halaman Layanan Lebih Kompleks

### L0 — Perbaikan Masalah Halaman Saat Ini

```text
Perbaiki di `/layanan`:
1) Jadikan seluruh kartu layanan satu area klik (tautan di dalam kartu, bukan di luar), tinggi semua kartu seragam.
2) Atur grid agar tidak menyisakan satu kartu sendirian: 4 kolom di desktop lebar, 2 kolom di tablet dan desktop sedang (2x2), 1 kolom di mobile; jika jumlah ganjil, kartu terakhir melebar penuh.
3) Tambahkan ikon di setiap kartu.
4) Tampilkan state loading (skeleton) dan state kosong yang layak.
Hanya perbaiki empat hal ini.
```

### L1 — Banner Halaman

```text
Buat ServicesBanner: latar krem gelap dengan pola blueprint tipis, breadcrumb, judul "Layanan Kami" beraksen oranye, subjudul, dua tombol (Konsultasi Gratis, Unduh Brosur bila ada), dan baris 3 angka ringkas di sisi kanan (jumlah layanan, proyek selesai, tahun pengalaman). Di bawahnya sub-navigasi anchor sticky (Layanan, Ruang Lingkup, Alur, Paket, Proyek, FAQ) dengan penanda section aktif.
```

### L2 — Grid Layanan Bergambar

```text
Redesain ServiceGrid: kartu bergambar (gambar atas rasio 4:3, ikon bundar oranye menimpa batas gambar, judul, deskripsi singkat, tiga poin ruang lingkup teratas, label "Mulai dari Rp ..." bila ada, tautan "Lihat detail" dengan panah). Hover: gambar zoom halus dan kartu terangkat. Layanan dengan isFeatured tampil lebih besar (span 2 kolom) dengan lencana "Paling Dicari". Tambahkan kolom pencarian dan filter cepat (Semua, Bangun, Renovasi, Desain, Pengawasan) yang memfilter tanpa reload. Data dari `GET /api/public/services`.
```

### L3 — Layanan Terpadu (One-Stop)

```text
Buat IntegratedServices: judul "Satu Mitra untuk Semua Tahap" dengan diagram alur horizontal empat simpul (Desain → RAB → Bangun → Awasi) yang tersambung garis dan ikon, tiap simpul memiliki satu kalimat dan tautan ke layanan terkait. Di mobile menjadi diagram vertikal. Di bawahnya tiga lencana manfaat (Satu kontrak, Satu penanggung jawab, Biaya terkendali).
```

### L4 — Ruang Lingkup Pekerjaan (Tab)

```text
Buat ScopeTabs: tab horizontal per layanan (scroll geser di mobile); isi tab menampilkan gambar di satu sisi dan grid ruang lingkup (ikon, judul, deskripsi) di sisi lain, dengan transisi halus antar tab, tombol "Detail layanan" dan "Minta penawaran" (membawa pilihan layanan ke form kontak lewat query string). Data dari `GET /api/public/services` (scopes). Tab aktif tersimpan di URL (`?tab=renovasi`).
```

### L5 — Alur Kerja

```text
Pakai ulang ProcessSection dari beranda (data `process-steps`), tambahkan tombol filter "Semua / per layanan" jika ada langkah yang ditautkan ke layanan. Tambahkan perkiraan durasi per langkah sebagai teks kecil jika tersedia.
```

### L6 — Paket & Harga

```text
Buat PricingPackages: pilihan layanan di atas (segmented control), lalu 3 kartu paket berdampingan (nama, "Mulai dari Rp ... / satuan", daftar fitur dengan ikon centang, tombol). Paket isPopular lebih besar dengan lencana "Paling Populer" dan bingkai oranye. Di mobile menjadi carousel. Catatan kecil: "Harga indikatif, penawaran final setelah survei". Tombol paket membuka Modal form singkat (nama, WhatsApp, luas/lokasi) yang mengirim ke `POST /api/public/messages` dengan isi paket terpilih. Tambahkan tautan "Hitung estimasi biaya" ke CostEstimator. Data dari `GET /api/public/service-packages?serviceId=`.
```

### L7 — Sektor yang Dilayani

```text
Buat SectorsServed: grid 5-6 kartu sektor (Rumah Tinggal, Komersial & Perkantoran, Pendidikan, Kesehatan, Industri & Pergudangan, Hospitality) dengan ikon, deskripsi satu kalimat, dan jumlah proyek yang dihitung dari kategori proyek. Klik kartu menuju `/proyek?kategori=...`. Data kategori dari `GET /api/public/categories?type=PROJECT`.
```

### L8 — Proyek Terkait

```text
Buat RelatedProjects: tab layanan (Semua, Konstruksi, Renovasi, Desain & Interior, Pengawasan), carousel 3-4 ProjectCard (foto, judul, lokasi, tahun, badge status) berdasarkan relasi `serviceId`, tombol panah dan titik, tombol "Lihat semua proyek". Sembunyikan tab yang tidak punya proyek.
```

### L9 — Testimoni & Mitra

```text
Buat ServiceTestimonials: tiga kartu testimoni (bintang, kutipan, nama, jabatan, label layanan yang dipakai) dengan filter layanan, lalu PartnerMarquee (pakai ulang) di bawahnya. Data dari `GET /api/public/testimonials?serviceId=`.
```

### L10 — FAQ per Layanan

```text
Buat ServiceFaq: tab layanan di kiri (atau di atas pada mobile), accordion FAQ di kanan, satu item terbuka pada satu waktu, aksesibel (aria-expanded). Tambahkan kolom "Pertanyaan Anda belum terjawab?" dengan tombol WhatsApp. Sisipkan JSON-LD FAQPage. Data dari `GET /api/public/faqs?serviceId=`.
```

### L11 — CTA Konsultasi dengan Pilihan Layanan

```text
Ganti CTA penutup menjadi ServiceCta: kiri judul "Belum yakin layanan mana yang Anda butuhkan?", tiga jaminan singkat, dan nomor telepon besar; kanan form singkat (pilih layanan dari dropdown yang otomatis terisi dari query string atau tab aktif, nama, WhatsApp, deskripsi singkat kebutuhan) yang mengirim ke `POST /api/public/messages`. Tampilkan notifikasi sukses yang jelas dan hindari kirim ganda.
```

### L12 — Perakitan, SEO & QA Halaman Layanan

```text
Rakit `ServicesPage.jsx` sesuai urutan target, tambahkan komponen `Reveal` untuk animasi masuk, skeleton per section, dan sembunyikan section yang datanya kosong. Tambahkan `<Seo>` dengan JSON-LD `Service`/`ItemList`. Uji di 375, 768, 1024, dan 1440 px, pastikan tidak ada scroll horizontal, dan laporkan skor Lighthouse.
```

---

## Halaman Detail Layanan `/layanan/:slug` (Pengayaan)

### LD1 — Hero & Struktur Detail

```text
Upgrade ServiceDetailPage: hero dengan gambar lebar (`heroImage`), breadcrumb, judul, deskripsi singkat, label "Mulai dari Rp ...", dan dua tombol (Minta Penawaran, Unduh Brosur). Di bawahnya layout dua kolom: konten utama kiri, sidebar sticky kanan.
```

### LD2 — Konten Detail

```text
Isi kolom utama detail layanan: deskripsi lengkap (tipografi nyaman), grid ruang lingkup dengan ikon, alur kerja khusus layanan (timeline vertikal), paket (pakai ulang PricingPackages untuk layanan ini), galeri proyek terkait (carousel), testimoni terkait, dan FAQ khusus layanan. Setiap section disembunyikan bila datanya kosong. Tampilkan 404 yang rapi jika slug tidak ditemukan.
```

### LD3 — Sidebar & Navigasi Antar Layanan

```text
Buat sidebar sticky: kartu kontak cepat (telepon, WhatsApp, form mini), daftar layanan lain dengan penanda layanan aktif, tombol unduh brosur, dan kartu jam kerja. Di bawah konten tambahkan navigasi "Layanan Sebelumnya / Berikutnya" dan di mobile ubah sidebar menjadi bar tombol melayang (Telepon, WhatsApp) di bagian bawah layar. Sisipkan SEO dinamis dari `metaTitle` dan `metaDescription`.
```

---

## Urutan Pengerjaan Halaman Layanan

**LB1 → LA1–LA2** (data dan admin) → **L0 → L12** (halaman daftar) → **LD1 → LD3** (halaman detail). Kerjakan L0 lebih dulu karena memperbaiki masalah yang terlihat sekarang. Isi paket, ruang lingkup, dan FAQ lewat admin sebelum menilai tampilan akhir.

---

# DOKUMENTASI — README.md PROYEK

Jalankan prompt ini **setelah F3 (atau setelah setiap tahap besar selesai)** agar README selalu sesuai kondisi kode sebenarnya. Prompt sengaja mewajibkan AI membaca repositori lebih dulu supaya tidak mengarang perintah, endpoint, atau nama file.

### DOC1 — README.md Lengkap

```text
Buat (atau perbarui) file `README.md` di root proyek "Jaya Abadi" yang profesional, lengkap, dan akurat, ditulis dalam bahasa Indonesia.

LANGKAH WAJIB SEBELUM MENULIS (jangan lewati):
1) Telusuri seluruh repositori: struktur folder, `package.json` (root, client, server), `schema.prisma`, daftar route Express di `server/src/modules/*`, route React di `client/src/routes`, file `.env.example`, `docker-compose.yml`, dan script seed.
2) Semua perintah, nama script, port, variabel env, endpoint, dan nama model HARUS diambil dari kode nyata. Jangan mengarang. Jika ada yang tidak ditemukan, tulis "TODO" dan laporkan di akhir jawaban.
3) Jalankan (atau simulasikan dengan membaca skrip) perintah instalasi dan pastikan urutan langkah di README benar.

STRUKTUR README (gunakan heading ini, urut):
1. Judul + tagline + baris badge (versi Node, React, Vite, Prisma, PostgreSQL, lisensi) + tangkapan layar utama (placeholder `docs/screenshots/...` jika belum ada).
2. Daftar Isi (tautan anchor).
3. Tentang Proyek: tujuan, siapa pengguna (pengunjung dan admin), ringkasan fitur.
4. Fitur: dua tabel terpisah. (a) Website Publik: Beranda, Tentang, Layanan, Proyek, Artikel, Kontak beserta sub-fiturnya. (b) CMS Admin: tiap modul CRUD (Proyek, Layanan, Paket, Kategori, Artikel, Testimoni, Tim, Hero Slider, Mitra, Sertifikat, FAQ, Keunggulan, Alur Kerja, Sebelum/Sesudah, Sejarah, Nilai, Galeri, Pesan, Media, Pengaturan, Pengguna, Subscriber), dengan kolom ringkas "Fungsi" dan "Role yang boleh mengakses".
5. Tech Stack: tabel (lapisan, teknologi, versi, alasan dipakai).
6. Arsitektur: diagram Mermaid alur sistem (Browser → React/Vite → REST API Express → Prisma → PostgreSQL, serta penyimpanan upload) dan penjelasan singkat alur autentikasi JWT cookie.
7. Struktur Folder: pohon direktori (dua level, dengan komentar singkat tiap folder) sesuai kondisi repo sekarang.
8. Skema Database: diagram ER Mermaid (erDiagram) seluruh model Prisma beserta relasinya, lalu tabel ringkas fungsi tiap model.
9. Prasyarat: versi Node.js, npm, PostgreSQL (atau Docker).
10. Instalasi & Menjalankan Lokal: langkah bernomor (clone, install, salin `.env.example`, buat database, `prisma migrate dev`, `npm run seed`, `npm run dev`), alamat akses (publik, admin), dan akun admin awal dari seed (tanpa menampilkan password produksi; arahkan ke variabel env).
11. Variabel Lingkungan: tabel terpisah untuk client dan server (nama, wajib/opsional, contoh nilai, keterangan).
12. Script NPM: tabel semua script di root, client, server beserta fungsinya.
13. Dokumentasi API: tabel ringkas per modul (method, path, auth, role, deskripsi) untuk endpoint publik `/api/public/*` dan admin `/api/admin/*`, format respons sukses dan error baku, parameter pagination (`page`, `limit`, `search`), serta satu contoh request dan respons nyata. Sebutkan bahwa detail lengkap ada di `server/README.md`.
14. Autentikasi & Otorisasi: matriks role (SUPER_ADMIN, ADMIN, EDITOR) terhadap modul.
15. Upload & Media: aturan tipe file, batas ukuran, lokasi penyimpanan, dan cara pindah ke S3/Cloudinary.
16. Panduan Penggunaan CMS: alur singkat mengelola konten (tambah proyek, kelola galeri, atur pengaturan situs, membaca pesan masuk).
17. Pengujian & Kualitas: cara menjalankan lint, test (jika ada), dan checklist QA manual.
18. Deployment: (a) Docker Compose, (b) VPS manual dengan Nginx + PM2 + SSL Let's Encrypt, termasuk `prisma migrate deploy`, variabel env produksi, dan cara backup/restore database.
19. Keamanan: ringkasan langkah yang sudah diterapkan (helmet, rate limit, validasi Zod, cookie httpOnly, bcrypt) dan hal yang perlu dilakukan sebelum produksi.
20. Pemecahan Masalah (Troubleshooting): minimal 8 masalah umum dan solusinya (koneksi database ditolak, migrasi gagal, CORS/cookie tidak terkirim, upload gagal, port bentrok, gambar tidak tampil, dsb.).
21. Roadmap: daftar fitur yang belum dikerjakan (checkbox).
22. Kontribusi: alur branch, format commit (Conventional Commits), dan standar kode.
23. Lisensi dan Kontak.

ATURAN GAYA:
- Gunakan heading hierarkis, tabel untuk data terstruktur, blok kode dengan penanda bahasa (bash, env, json, mermaid), dan emoji secukupnya hanya pada heading utama.
- Kalimat singkat dan aktif; hindari paragraf lebih dari 4 baris.
- Jangan menaruh rahasia nyata (password, secret, API key); gunakan placeholder.
- Pastikan seluruh tautan anchor di Daftar Isi valid dan diagram Mermaid dapat dirender di GitHub.

BUAT JUGA:
- `docs/screenshots/.gitkeep` dan catatan di README tentang file yang perlu ditambahkan.
- `.env.example` yang sudah lengkap bila ada variabel yang belum tercantum.

Di akhir jawaban, berikan: (1) daftar bagian yang berisi TODO atau asumsi, (2) daftar file yang dibuat/diubah, (3) perintah yang kamu verifikasi dan hasilnya.
```

**Tips:** setelah README selesai, buat juga `server/README.md` (dokumentasi API detail per modul) dengan prompt serupa: telusuri `server/src/modules/*`, lalu hasilkan tabel endpoint, skema validasi Zod, dan contoh request/respons untuk setiap modul.

---

# TAMBAHAN — PENGAYAAN HALAMAN PROYEK

Dipakai **setelah P9 dan LB1 (relasi layanan) selesai**. Temuan dari screenshot halaman Proyek saat ini:

- Tata letak 4 + 2: baris kedua hanya berisi dua kartu sehingga banyak ruang kosong.
- Kartu hanya memuat foto, kategori, lokasi, dan judul; tahun, status, luas, dan layanan tidak terlihat.
- Tiga baris filter (pencarian, status, kategori) tidak menunjukkan jumlah hasil, filter aktif, urutan, maupun tombol reset.
- Tidak ada pagination, banner tanpa statistik, tidak ada proyek unggulan, tampilan peta, maupun CTA penutup.

Urutan halaman `/proyek` target:

**Banner + Statistik → Proyek Unggulan → Filter Bar → Hasil (Grid / Daftar / Peta) → Pagination → CTA**

> Blok struktur di bawah hanya **peta acuan**, bukan prompt.

```text
client/src/components/public/projects/
├─ ProjectsBanner.jsx     ├─ FeaturedProjectsStrip.jsx
├─ ProjectFilterBar.jsx   ├─ ProjectResults.jsx
├─ ProjectCardV2.jsx      ├─ ProjectListItem.jsx
├─ ProjectsMap.jsx        └─ ProjectsCta.jsx
client/src/pages/public/{ProjectsPage.jsx, ProjectDetailPage.jsx}
```

---

## Sistem & Admin

### PRB1 — Skema & API Proyek Lengkap

```text
Perluas model Project lalu migrate (`extend_project`): area (Int, m²), durationMonths (Int), floors (Int), startDate, endDate, architect (string), videoUrl, latitude, longitude, challenge (text), solution (text), result (text), highlights (Json array string), tags (Json array string), viewCount (Int default 0), serviceId (relasi opsional ke Service jika belum ada).
Perbarui `GET /api/public/projects` agar menerima: `search`, `status`, `category`, `service`, `year`, `sort` (terbaru, terlama, judul-az, terpopuler), `page`, `limit` (default 12), dan mengembalikan `meta` (page, limit, total, totalPages) plus `facets` (jumlah per kategori, per status, daftar tahun tersedia) agar filter bisa menampilkan angka. Tambahkan `GET /api/public/projects/stats` (total, selesai, berjalan, total luas, jumlah kota) dan `GET /api/public/projects/map` (id, slug, judul, koordinat, cover, kategori). Detail proyek: `GET /api/public/projects/:slug` menambah viewCount, mengembalikan galeri, proyek serupa, serta proyek sebelumnya/berikutnya. Perbarui seed agar semua proyek memiliki koordinat dan data baru.
```

### PRA1 — Form Proyek Admin Diperluas

```text
Upgrade form `/admin/projects` menjadi bertab: (1) Info Utama; (2) Spesifikasi (luas, lantai, durasi, tanggal mulai/selesai, arsitek, layanan terkait); (3) Cerita Proyek (tantangan, solusi, hasil, daftar poin sorotan dinamis, tag); (4) Lokasi (latitude/longitude dengan pemilih titik di peta Leaflet dan tombol "cari alamat"); (5) Media (cover, galeri, URL video dengan pratinjau); (6) SEO. Tambahkan aksi massal di daftar (publish/unpublish/hapus banyak) dan kolom jumlah dilihat.
```

---

## Tahap Publik

### PR0 — Perbaikan Masalah Halaman Saat Ini

```text
Perbaiki di `/proyek`:
1) Grid 4 kolom desktop, 3 tablet, 2 mobile kecil; kartu terakhir tidak boleh membuat baris janggal (gunakan 12 per halaman agar baris selalu penuh).
2) Samakan tinggi kartu dan batasi judul 2 baris (line-clamp).
3) Tampilkan skeleton 12 kartu saat memuat dan EmptyState "Tidak ada proyek yang cocok" dengan tombol Reset Filter.
Hanya perbaiki tiga hal ini.
```

### PR1 — Banner & Statistik

```text
Buat ProjectsBanner: latar krem gelap dengan pola blueprint, breadcrumb, judul beraksen oranye, subjudul, dan baris 4 statistik (Total Proyek, Selesai, Sedang Berjalan, Kota Terjangkau) dari `GET /api/public/projects/stats` dengan hitung naik saat terlihat.
```

### PR2 — Proyek Unggulan

```text
Buat FeaturedProjectsStrip: carousel besar (1 proyek per slide di desktop berukuran lebar dengan foto, judul, lokasi, luas, durasi, tombol "Lihat proyek") untuk proyek `isFeatured`, dengan panah, titik, dan geser sentuh. Sembunyikan jika tidak ada proyek unggulan. Hanya tampil pada halaman 1 tanpa filter aktif.
```

### PR3 — Filter Bar Lengkap

```text
Redesain ProjectFilterBar menjadi satu panel rapi: kotak pencarian (debounce 400 ms), dropdown Layanan, Tahun, dan Urutkan, chip Status dan chip Kategori yang menampilkan jumlah (contoh "Gedung (3)") dari `facets`, chip "filter aktif" yang bisa dihapus satu per satu, tombol "Reset semua", dan teks "Menampilkan 12 dari 30 proyek". Di mobile filter masuk ke drawer bawah (tombol "Filter" dengan badge jumlah filter aktif). Semua filter, urutan, tampilan, dan halaman disinkronkan ke query string URL.
```

### PR4 — Kartu Proyek V2 & Mode Tampilan

```text
Buat ProjectCardV2: foto rasio 4:3 dengan badge kategori dan status (warna berbeda: Selesai hijau, Berjalan oranye, Perencanaan abu), judul, lokasi, dan baris meta kecil (tahun, luas m², layanan). Hover: foto zoom dan overlay "Lihat detail". Tambahkan tombol pengalih tampilan Grid / Daftar / Peta di kanan filter; mode Daftar memakai ProjectListItem (foto kecil di kiri, deskripsi singkat, meta, tombol). Mode tampilan tersimpan di URL.
```

### PR5 — Pagination Proyek

```text
Pakai komponen `Pagination` reusable (dari T10b; buat jika belum ada). 12 proyek per halaman, pagination hanya muncul jika total lebih dari 12, tanpa tombol "muat lebih banyak", scroll halus ke atas hasil saat pindah halaman, placeholderData keepPreviousData, prefetch halaman berikutnya.
```

### PR6 — Tampilan Peta Proyek

```text
Buat ProjectsMap (react-leaflet + tile OpenStreetMap, lazy load): penanda untuk setiap proyek hasil filter dari `GET /api/public/projects/map`, popup berisi foto kecil, judul, lokasi, dan tautan detail, pengelompokan penanda (cluster) saat banyak titik, tombol "Fokus ke semua". Peta mengikuti filter yang aktif dan tidak dipakai bersama pagination (tampilkan semua titik).
```

### PR7 — CTA Penutup

```text
Buat ProjectsCta: banner berlatar foto proyek dengan overlay gelap, judul "Punya proyek serupa? Mari diskusikan", tombol Konsultasi via WhatsApp dan Hubungi Kami, serta tiga jaminan singkat.
```

### PRD1 — Detail Proyek: Hero & Info

```text
Upgrade `/proyek/:slug`: hero lebar dengan foto cover, breadcrumb, judul, badge kategori/status, lokasi. Di bawahnya kartu info ikon (klien, lokasi, tahun, luas, jumlah lantai, durasi, arsitek, nilai proyek bila ada) dan tombol bagikan (WhatsApp, Facebook, salin tautan).
```

### PRD2 — Detail Proyek: Cerita & Media

```text
Isi kolom utama: deskripsi, tiga blok "Tantangan", "Solusi", "Hasil" (kartu bernomor), daftar sorotan berikon centang, galeri (gambar utama + thumbnail + lightbox dengan swipe), video YouTube bila ada (lazy embed), serta peta lokasi kecil (Leaflet). Sembunyikan blok yang datanya kosong.
```

### PRD3 — Detail Proyek: Sidebar, Terkait & Navigasi

```text
Buat sidebar sticky (kartu "Tertarik proyek serupa?" dengan form mini ke `POST /api/public/messages` membawa nama proyek, tombol WhatsApp, layanan terkait). Di bawah konten: carousel "Proyek Serupa" (kategori atau layanan sama), navigasi "Proyek Sebelumnya / Berikutnya", dan CTA penutup. Sisipkan SEO dinamis dan JSON-LD `CreativeWork`.
```

### PR8 — Perakitan & QA Halaman Proyek

```text
Rakit `ProjectsPage.jsx` sesuai urutan target dengan komponen `Reveal`, uji di 375, 768, 1024, dan 1440 px, pastikan tidak ada scroll horizontal, uji kombinasi filter + pagination + mode tampilan lewat URL langsung, dan laporkan skor Lighthouse.
```

**Urutan:** PRB1 → PRA1 → PR0 → PR1 → PR8, lalu PRD1 → PRD3.

---

# TAMBAHAN — PENGAYAAN HALAMAN ARTIKEL

Dipakai **setelah P10 selesai**. Temuan dari screenshot halaman Artikel saat ini:

- **Bug tata letak:** ringkasan artikel besar ("48 unit rumah dua lantai...") keluar dari kartu dan menimpa area di bawahnya.
- Dua kartu kecil punya jarak kosong besar antara judul dan tanggal karena mengikuti tinggi kartu besar.
- Hanya tiga artikel tampil tanpa pagination, tanpa pengurutan, tanpa hasil pencarian yang informatif.
- Tidak ada artikel unggulan, sidebar (populer, kategori, tag), newsletter, maupun CTA.

Urutan halaman `/artikel` target:

**Banner → Artikel Unggulan → Filter Bar → Daftar Artikel + Sidebar → Pagination → Newsletter/CTA**

> Blok struktur di bawah hanya **peta acuan**, bukan prompt.

```text
client/src/components/public/blog/
├─ BlogBanner.jsx        ├─ FeaturedPostsHero.jsx
├─ BlogFilterBar.jsx     ├─ PostCardV2.jsx
├─ BlogSidebar.jsx       ├─ TableOfContents.jsx
├─ ReadingProgress.jsx   ├─ AuthorBox.jsx
└─ NewsletterBlock.jsx
client/src/pages/public/{BlogPage.jsx, BlogDetailPage.jsx}
```

---

## Sistem & Admin

### ARB1 — Skema & API Artikel Lengkap

```text
Tambahkan model Tag (id, name, slug unik) dan relasi many-to-many PostTag. Perluas Post: isFeatured, viewCount, metaTitle, metaDescription, updatedAt tampil, dan `authorId` (relasi User). Perbarui `GET /api/public/posts`: parameter `search` (judul, ringkasan, konten), `category`, `tag`, `sort` (terbaru, terpopuler, terlama), `page`, `limit` (default 9), kembalikan `meta` dan `facets` (jumlah per kategori). Tambahkan `GET /api/public/posts/featured`, `/popular` (berdasarkan viewCount), `GET /api/public/tags`, dan detail `GET /api/public/posts/:slug` yang menambah viewCount, mengembalikan penulis (nama, jabatan, foto), tag, artikel terkait (kategori/tag sama), serta artikel sebelumnya/berikutnya. Perbarui seed menjadi 12 artikel, 8 tag, 3 artikel unggulan.
```

### ARA1 — Admin Artikel & Tag

```text
Upgrade `/admin/posts`: pemilih tag (multi-select dengan buat tag baru langsung), toggle unggulan, kolom SEO (meta title dan description dengan penghitung karakter), tombol pratinjau, jadwal terbit (publishedAt di masa depan), dan aksi massal. Buat halaman `/admin/tags` (CRUD sederhana dengan jumlah artikel). Tampilkan kolom jumlah dilihat di tabel.
```

---

## Tahap Publik

### AR0 — Perbaikan Bug Tata Letak

```text
Perbaiki di `/artikel`:
1) Ringkasan pada kartu artikel besar tidak boleh keluar dari kartu: pakai flex column, `overflow-hidden`, dan `line-clamp-3` pada ringkasan.
2) Hentikan efek kartu kecil meregang mengikuti kartu besar: atur `items-start` / tinggi sesuai isi, tampilkan tanggal tepat di bawah judul.
3) Samakan gaya kartu (radius, bayangan, jarak) di seluruh daftar.
Hanya perbaiki tiga hal ini.
```

### AR1 — Banner & Artikel Unggulan

```text
Buat BlogBanner (judul "Artikel & Wawasan", subjudul, jumlah artikel, kolom pencarian besar dengan saran pencarian) dan FeaturedPostsHero: slider 3 artikel unggulan, foto lebar dengan overlay gradient, kategori, judul, ringkasan, penulis, tanggal, waktu baca, dan tombol "Baca selengkapnya", otomatis berganti 7 detik dengan indikator. Hanya tampil di halaman 1 tanpa filter aktif.
```

### AR2 — Filter, Pencarian & Urutan

```text
Buat BlogFilterBar: chip kategori dengan jumlah, dropdown urutan (Terbaru, Terpopuler, Terlama), pencarian dengan debounce, chip filter aktif (kategori, tag, kata kunci) yang bisa dihapus, tombol reset, dan teks hasil ("12 artikel ditemukan untuk 'atap'"). Semua state di query string URL. Sorot kata kunci yang cocok pada judul kartu.
```

### AR3 — Daftar Artikel (Kartu V2) & Pagination

```text
Buat PostCardV2: foto rasio 16:9, kategori, judul (2 baris), ringkasan (3 baris), penulis kecil dengan avatar, tanggal, waktu baca, dan tag. Layout dua kolom konten: grid 2 kolom artikel di kiri (9 per halaman) dan sidebar di kanan; satu kolom di mobile. Pagination memakai komponen `Pagination` reusable (muncul hanya jika total lebih dari 9), tanpa tombol "muat lebih banyak". Tambahkan EmptyState "Tidak ada artikel yang cocok" dengan saran kategori populer.
```

### AR4 — Sidebar Blog

```text
Buat BlogSidebar (sticky): kartu "Artikel Populer" (5 teratas, nomor, judul, tanggal), daftar kategori dengan jumlah, awan tag yang dapat diklik (menambah filter tag), blok newsletter ringkas (pakai ulang endpoint subscribe), dan kartu CTA konsultasi dengan tombol WhatsApp.
```

### AR5 — Detail Artikel Lengkap

```text
Upgrade `/artikel/:slug`: bar progres baca di atas layar, header (kategori, judul, penulis + avatar, tanggal terbit dan diperbarui, waktu baca, jumlah dilihat), cover lebar, konten bertipografi nyaman dengan daftar isi otomatis dari heading (sticky di desktop, melipat di mobile), tombol bagikan (WhatsApp, Facebook, X, salin tautan), tag, kotak penulis (AuthorBox), navigasi artikel sebelumnya/berikutnya, carousel artikel terkait, dan blok newsletter. SEO dinamis dengan JSON-LD `Article`.
```

### AR6 — Perakitan & QA Halaman Artikel

```text
Rakit `BlogPage.jsx` dengan komponen `Reveal`, skeleton, dan state kosong. Uji di 375, 768, 1024, dan 1440 px, pastikan tidak ada teks yang keluar dari kartu atau scroll horizontal, uji kombinasi kategori + tag + pencarian + pagination lewat URL, dan laporkan skor Lighthouse.
```

**Urutan:** ARB1 → ARA1 → AR0 → AR1 → AR6, lalu AR5.

---

# TAMBAHAN — PENGAYAAN HALAMAN KONTAK

Dipakai **setelah P11 selesai**. Temuan dari screenshot halaman Kontak saat ini:

- Hanya kartu kontak dan satu form umum; tidak ada peta, jam kerja, maupun status buka/tutup.
- Form tidak menanyakan jenis layanan, anggaran, lokasi proyek, atau waktu yang disukai, sehingga tim harus menanyakan ulang.
- Tidak ada penjelasan langkah setelah pesan dikirim, FAQ, kantor cabang, maupun saluran cepat (WhatsApp, telepon).
- Catatan: ikon ungu yang menimpa tombol WhatsApp di bagian bawah kemungkinan berasal dari ekstensi browser, bukan dari aplikasi. Cek dengan jendela incognito sebelum memperbaiki.

Urutan halaman `/kontak` target:

**Banner + Saluran Cepat → Form Konsultasi + Info → Peta & Kantor → Langkah Setelah Kirim → FAQ → CTA**

> Blok struktur di bawah hanya **peta acuan**, bukan prompt.

```text
client/src/components/public/contact/
├─ ContactBanner.jsx      ├─ QuickChannels.jsx
├─ OpenStatusBadge.jsx    ├─ ConsultationForm.jsx
├─ OfficeMap.jsx          ├─ WhatNext.jsx
├─ ContactFaq.jsx         └─ ContactCta.jsx
client/src/pages/public/ContactPage.jsx
server/src/modules/branches/
```

---

## Sistem & Admin

### KB1 — Skema & API Kontak

```text
Tambahkan model Branch (id, name, address, city, phone, whatsapp, email, latitude, longitude, mapEmbedUrl, openingHours Json (hari, buka, tutup, libur), photo, isMain, sortOrder, isPublished). Perluas Message: serviceId (opsional), budgetRange (enum KURANG_100JT, 100_500JT, 500JT_1M, 1M_5M, LEBIH_5M, BELUM_TAHU), projectLocation, projectArea (Int, opsional), preferredContact (enum WHATSAPP, TELEPON, EMAIL), preferredTime (enum PAGI, SIANG, SORE, BEBAS), attachments (Json array URL, maks 3), status (enum BARU, DIPROSES, SELESAI, SPAM), adminNote, ticketCode (unik, format JA-YYYYMMDD-XXXX), source (halaman asal). Endpoint: `GET /api/public/branches`, `POST /api/public/messages` diperbarui (validasi Zod, honeypot, rate limit 5 pesan per jam per IP, kembalikan ticketCode), `POST /api/public/messages/attachments` (publik, hanya jpg/png/webp/pdf, maks 5 MB per file dan 3 file, simpan terpisah dari Media admin, dibatasi rate limit). Seed 2 cabang contoh.
```

### KA1 — Admin Kantor Cabang

```text
Buat `/admin/branches`: kartu cabang dengan foto, Modal form (nama, alamat, kota, kontak, koordinat dengan pemilih peta Leaflet, embed URL, jam operasional per hari dengan switch libur, kantor utama hanya satu, urutan, publish).
```

### KA2 — Inbox Pesan Diperluas

```text
Upgrade `/admin/messages`: kolom status (BARU/DIPROSES/SELESAI/SPAM) dengan ubah cepat, filter status, layanan, anggaran, rentang tanggal, pencarian, panel detail menampilkan semua field baru dan lampiran (unduh/pratinjau), kolom catatan internal admin yang tersimpan otomatis, tombol balas via WhatsApp dengan template pesan berisi nomor tiket, ekspor CSV, dan penghitung pesan BARU di sidebar.
```

---

## Tahap Publik

### K0 — Perbaikan Masalah Halaman Saat Ini

```text
Perbaiki di `/kontak`: (1) pastikan kolom kiri (kartu kontak) dan kolom kanan (form) rata tinggi pada desktop dan bertumpuk rapi di mobile; (2) tambahkan state pesan sukses, state gagal dengan tombol coba lagi, dan cegah kirim ganda; (3) tambahkan atribut `autocomplete`, label terkait input, dan pesan error di bawah setiap field. Hanya perbaiki tiga hal ini.
```

### K1 — Banner & Saluran Cepat

```text
Buat ContactBanner dengan judul beraksen, subjudul, dan OpenStatusBadge ("Buka sekarang - tutup 17.00" atau "Tutup - buka Senin 08.00", dihitung dari openingHours kantor utama dan zona waktu WIB). Di bawahnya QuickChannels: empat kartu besar yang bisa diklik (WhatsApp dengan pesan awal otomatis, Telepon `tel:`, Email `mailto:`, Petunjuk Arah ke Google Maps) dengan ikon dan waktu respons rata-rata ("dibalas rata-rata 15 menit", dari setting).
```

### K2 — Form Konsultasi Lengkap

```text
Buat ConsultationForm dengan tiga langkah (progress bar): (1) Data diri: nama, email, telepon/WhatsApp, cara dihubungi, waktu yang disukai; (2) Kebutuhan proyek: jenis layanan (dropdown dari `GET /api/public/services`, otomatis terisi dari query `?layanan=`), lokasi proyek, perkiraan luas, kisaran anggaran, perkiraan mulai; (3) Detail: pesan, unggah lampiran (denah/foto, drag & drop, maksimal 3 file 5 MB dengan pratinjau dan progres), persetujuan privasi. Validasi Zod per langkah, tombol Kembali/Lanjut, simpan draf di sessionStorage, honeypot, dan pencegahan kirim ganda. Setelah sukses tampilkan kartu konfirmasi berisi nomor tiket, ringkasan pesan, dan tombol "Lanjut via WhatsApp" berisi nomor tiket. Isi otomatis dari query string (`?layanan=`, `?proyek=`, `?paket=`) sehingga CTA di halaman lain terhubung.
```

### K3 — Peta & Kantor

```text
Buat OfficeMap: tab per cabang (jika lebih dari satu), peta Leaflet/OSM (atau embed Google dari `mapEmbedUrl`) di kiri, kartu detail di kanan (foto kantor, alamat, telepon, WhatsApp, email, tabel jam operasional dengan hari ini disorot, tombol "Petunjuk Arah" dan "Salin Alamat"). Peta dimuat malas saat masuk viewport. Data dari `GET /api/public/branches`.
```

### K4 — Langkah Setelah Kirim

```text
Buat WhatNext: judul "Apa yang terjadi setelah Anda menghubungi kami?" dan timeline 4 langkah (Pesan diterima, Konsultasi awal via telepon/WhatsApp, Survei lokasi, Penawaran dan RAB) dengan perkiraan waktu tiap langkah, ikon, dan garis penghubung. Konten dari setting atau statis.
```

### K5 — FAQ Kontak

```text
Buat ContactFaq memakai `GET /api/public/faqs` (kategori umum): accordion satu terbuka, aksesibel, dengan blok "Masih ada pertanyaan?" berisi tombol WhatsApp dan telepon. Sisipkan JSON-LD `FAQPage`.
```

### K6 — CTA Penutup & SEO Lokal

```text
Buat ContactCta: banner berlatar foto proyek, ajakan "Siap memulai proyek Anda?", tombol WhatsApp dan Telepon. Tambahkan JSON-LD `LocalBusiness`/`GeneralContractor` (nama, alamat, telepon, jam operasional, koordinat, area layanan) dan SEO meta.
```

### K7 — Perakitan & QA Halaman Kontak

```text
Rakit `ContactPage.jsx` sesuai urutan target, tambahkan `Reveal` dan skeleton. Uji alur form lengkap (valid, tidak valid, gagal jaringan, kirim ganda, lampiran terlalu besar, honeypot terisi), keyboard navigation dan aksesibilitas label, tampilan di 375, 768, 1024, dan 1440 px, serta laporkan skor Lighthouse.
```

**Urutan:** KB1 → KA1 → KA2 → K0 → K1 → K7.
