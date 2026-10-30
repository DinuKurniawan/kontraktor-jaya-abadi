# 🏗️ Jaya Abadi — Company Profile + CMS Kontraktor

Website company profile untuk kontraktor **Jaya Abadi** dengan CMS admin lengkap — dari layanan, paket harga, proyek, galeri, hingga pesan masuk. Monorepo: `client/` (React + Vite) dan `server/` (Express + Prisma + PostgreSQL).

![React](https://img.shields.io/badge/React-19.3-61dafb) ![Vite](https://img.shields.io/badge/Vite-8.3-646cff) ![Express](https://img.shields.io/badge/Express-5.3-000) ![Prisma](https://img.shields.io/badge/Prisma-6.19-2d3748) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791) ![Node](https://img.shields.io/badge/Node-20%2B-339933) ![Tailwind](https://img.shields.io/badge/Tailwind-4.3-38bdf8)

![Tangkapan Layar Utama](docs/screenshots/homepage.png)
> TODO: tambahkan tangkapan layar ke `docs/screenshots/` (homepage, /layanan, detail layanan, dashboard admin, detail proyek).

## 📑 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#%EF%B8%8F-fitur)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#%EF%B8%8F-arsitektur)
- [Struktur Folder](#-struktur-folder)
- [Skema Database](#-skema-database)
- [Prasyarat](#%EF%B8%8F-prasyarat)
- [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
- [Variabel Lingkungan](#-variabel-lingkungan)
- [Script NPM](#-script-npm)
- [Dokumentasi API](#-dokumentasi-api)
- [Autentikasi & Otorisasi](#%EF%B8%8F-autentikasi--otorisasi)
- [Upload & Media](#%EF%B8%8F-upload--media)
- [Panduan Penggunaan CMS](#-panduan-penggunaan-cms)
- [Pengujian & Kualitas](#-pengujian--kualitas)
- [Deployment](#-deployment)
- [Keamanan](#-keamanan)
- [Pemecahan Masalah](#-pemecahan-masalah-troubleshooting)
- [Roadmap](#-roadmap)
- [Kontribusi](#-kontribusi)
- [Lisensi dan Kontak](#-lisensi-dan-kontak)

## 🎯 Tentang Proyek

Website resmi kontraktor Jaya Abadi yang menampilkan layanan konstruksi, renovasi, desain interior, dan pengawasan proyek.

**Pengguna:**
- **Pengunjung** — melihat layanan, paket harga, portofolio proyek, artikel, dan mengirim pesan/konsultasi.
- **Admin** — mengelola seluruh konten situs lewat CMS: CRUD semua modul, unggah media, kelola pesan masuk dan pengguna.

**Ringkasan fitur:** website publik dengan SEO dinamis (JSON-LD, sitemap), CMS dengan editor bertab, upload media (JPG/PNG/WebP + konversi WebP), statistik dashboard, kalkulator estimasi biaya, dan respons penuh (Lighthouse desktop 95/97/96/100 di `/layanan`).

## ✨ Fitur

### Website Publik

| Halaman | Sub-fitur |
| --- | --- |
| Beranda (`/`) | Hero slider, layanan unggulan, keunggulan, alur kerja, galeri sebelum/sesudah, testimoni, mitra marquee, kalkulator estimasi biaya, CTA |
| Tentang (`/tentang`) | Timeline sejarah, statistik, tim, legalitas/sertifikat, galeri, perbandingan nilai, marquee, CTA |
| Layanan (`/layanan`) | Banner + anchor sticky scroll-spy, grid kartu bergambar + pencarian & filter tanpa reload, diagram layanan terintegrasi, tab ruang lingkup (di-sync ke URL `?tab=`), alur kerja, paket harga (modal penawaran), sektor terlayani, proyek terkait (carousel), testimoni, FAQ (accordion + JSON-LD), CTA |
| Detail Layanan (`/layanan/:slug`) | Hero bergambar + breadcrumb + harga + CTA, konten dua kolom (scope, alur, paket, proyek, testimoni, FAQ), sidebar sticky (kontak cepat, layanan lain, jam kerja), navigasi sebelum/berikutnya, SEO dinamis dari `metaTitle`/`metaDescription`, JSON-LD FAQPage |
| Proyek (`/proyek`) | Filter kategori/status/search tersinkron URL, muat lebih banyak, detail proyek (`/proyek/:slug`) + galeri + terkait |
| Artikel (`/artikel`) | Filter kategori, pencarian, paginasi, detail artikel + terkait |
| Kontak (`/kontak`) | Form tervalidasi Zod + honeypot, info kontak, embed maps, pre-fill subjek dari `?layanan=`, subscribe newsletter |
| Global | SEO per halaman (react-helmet-async), `sitemap.xml` & `robots.txt` dari server, desain responsif penuh |

### CMS Admin (`/admin`)

Semua modul di bawah memakai REST API `/api/admin/*` (wajib login). Backend saat ini menerapkan `requireAuth` untuk seluruh route admin; **pembatasan role hanya pada modul Pengguna & Media (SUPER_ADMIN)**. Rencana role per modul di matriks di [Autentikasi & Otorisasi](#%EF%B8%8F-autentikasi--otorisasi).

| Modul | Fungsi | Role yang boleh mengakses (backend saat ini) |
| --- | --- | --- |
| Dashboard | Statistik ringkas (unread pesan, jumlah entri) | Login |
| Proyek | CRUD, publish, unggulan, gambar multi | Login |
| Layanan | CRUD + reorder, hero image, harga mulai, brosur, meta SEO | Login |
| Paket Layanan | CRUD per layanan, fitur dinamis, "Paling Populer" tunggal, reorder | Login |
| Ruang Lingkup | CRUD scope per layanan, reorder, ikon | Login |
| Kategori | CRUD (type PROJECT/POST) | Login |
| Artikel | CRUD, publish | Login |
| Testimoni | CRUD, publish | Login |
| Tim | CRUD anggota, reorder, departemen | Login |
| Hero Slider | CRUD slide beranda | Login |
| Mitra | CRUD logo mitra, reorder | Login |
| Sertifikat | CRUD, reorder | Login |
| FAQ | CRUD, reorder, link layanan | Login |
| Keunggulan | CRUD, reorder | Login |
| Alur Kerja | CRUD langkah, reorder, link layanan | Login |
| Sebelum/Sesudah | CRUD perbandingan proyek, reorder | Login |
| Sejarah | CRUD milestone timeline, reorder | Login |
| Nilai | CRUD nilai perusahaan, reorder | Login |
| Galeri | CRUD foto, kategori galeri, reorder | Login |
| Pesan | Lihat, tandai dibaca, hapus pesan masuk | Login |
| Media | Unggah (maks 10 file × 5 MB), daftar, hapus — SUPER_ADMIN | SUPER_ADMIN |
| Harga Estimasi | CRUD harga satuan kalkulator | Login |
| Pengaturan | Instansi site settings (telepon, WA, alamat, statistik, brosur, dll.) | Login |
| Pengguna | CRUD user, aktif/nonaktif, ganti password — SUPER_ADMIN | SUPER_ADMIN |
| Subscriber | Daftar email newsletter | Login |

## 🧰 Tech Stack

| Lapisan | Teknologi | Versi | Alasan |
| --- | --- | --- | --- |
| Frontend | React | 19.3 | UI deklaratif, ekosistem besar |
| Bundler | Vite (rolldown) | 8.3 | Dev server cepat, build modern |
| Styling | Tailwind CSS | 4.3 | Utility-first, tema terpusat via `@theme` |
| Data fetching | TanStack Query | 5.105 | Cache + invalidasi otomatis di CMS |
| Form | react-hook-form + Zod | 7.91 / 4.6 | Validasi schema yang sama dengan server |
| Routing | react-router-dom | 7.18 | SPA routing + lazy loading |
| SEO | react-helmet-async | 3.0 | Meta/JSON-LD per halaman |
| Backend | Express | 5.3 | REST API minimalis, ESM |
| ORM | Prisma | 6.19 | Type-safe query + migrasi |
| Database | PostgreSQL | 16 | Relasional andal |
| Auth | jsonwebtoken + bcrypt | 9 / 6 | JWT cookie httpOnly, hash password |
| Upload | multer + sharp | 2.5 / 0.35 | Multifile + konversi WebP |
| Keamanan | helmet, express-rate-limit | 8.3 / 8.7 | Header aman, rate limit |

## 🖼️ Arsitektur

```mermaid
flowchart LR
    A[Browser] -->|GET /, /layanan, ...| B[React 19 + Vite SPA]
    A -->|/admin CMS| B
    B -->|fetch /api via Vite proxy? no - axios baseURL| C[Express 5 REST API]
    C -->|/api/public/*| C2[Endpoint Publik]
    C -->|/api/admin/* + JWT cookie| C1[Auth middleware]
    C1 --> D[Prisma Client]
    D -->[(PostgreSQL)]
    C -->|multer + sharp| E[(uploads/ static /uploads)]
    B -.->|GET /uploads/xxx| E
    C -->|sitemap.xml, robots.txt| A
```

- SPA memanggil `VITE_API_URL` (default `http://localhost:4000/api`) langsung via axios.
- Semua respons memakai format baku `{ success, data, meta }` (lihat [Dokumentasi API](#-dokumentasi-api)).
- **Alur autentikasi:** `POST /api/auth/login` memverifikasi bcrypt lalu menyetel cookie `token` (JWT 7 hari, `httpOnly`, `sameSite=lax`, `secure` di produksi). Setiap request admin membaca token dari cookie atau header `Authorization: Bearer`, memverifikasi, lalu mengambil user terbaru (akun nonaktif langsung ditolak). Logout menghapus cookie. CORS dibatasi ke `CLIENT_URL` (+ origin preview) dengan `credentials: true`.

## 📁 Struktur Folder

```text
kotraktor-jaya-abadi/
├── client/                 # SPA React + Vite + Tailwind v4
│   ├── public/             # Aset statis (robots.txt, favicon)
│   └── src/
│       ├── components/     # public/ (per halaman) + ui/ (design system) + admin/
│       ├── context/        # AuthContext (sesi login)
│       ├── hooks/          # useReveal dkk.
│       ├── lib/            # axios instance, service-icons
│       ├── pages/          # public/ + admin/ (lazy-loaded)
│       └── routes/         # ProtectedRoute, RoleRoute
├── server/                 # REST API Express + Prisma
│   ├── prisma/             # schema.prisma, migrations/, seed.js
│   ├── src/
│   │   ├── config/         # prisma.js, jwt.js
│   │   ├── middleware/     # auth (requireAuth/requireRole), error-handler, validate
│   │   ├── modules/        # 1 folder per modul: route, controller, service, validation
│   │   └── utils/          # response, paginate, api-error, async-handler, slugify
│   └── uploads/            # Media terunggah (dilayani statis di /uploads)
├── docs/screenshots/       # Tangkapan layar untuk README
└── package.json            # Script root (devConcurrently)
```

## 🗄️ Skema Database

```mermaid
erDiagram
    User }o--|| Role : has
    Category ||--o{ Project : "projects"
    Category ||--o{ Post : "posts"
    Project ||--o{ ProjectImage : images
    Project }o--o| Service : belongs
    Service ||--o{ ServiceScope : scopes
    Service ||--o{ ServicePackage : packages
    Service ||--o{ Faq : faqs
    Service ||--o{ ProcessStep : steps
    Service ||--o{ Testimonial : testimonials
    Post }o--o| Category : category
    Milestone }o--o| Service : "opsional"
    EstimatePrice }o--o| BuildingType : type

    User {
        string id PK
        string email UK
        string password
        string role
        boolean isActive
    }
    Service {
        string id PK
        string slug UK
        string title
        string heroImage
        float startingPrice
        string brochureUrl
        boolean isPublished
    }
    ServicePackage {
        string id PK
        string serviceId FK
        float priceFrom
        string priceUnit
        json features
        boolean isPopular
    }
    Project {
        string id PK
        string slug UK
        string categoryId FK
        string serviceId FK
        string status
        boolean isPublished
    }
    Post {
        string id PK
        string slug UK
        string categoryId FK
    }
    Message {
        string id PK
        string name
        string phone
        boolean isRead
    }
```

| Model | Fungsi |
| --- | --- |
| `User` (enum `Role`: SUPER_ADMIN/ADMIN/EDITOR) | Akun CMS |
| `Category` (enum `CategoryType`: PROJECT/POST) | Kategori proyek & artikel |
| `Project` + `ProjectImage` | Portofolio + galeri gambar |
| `Service` | Layanan utama + harga mulai + brosur + meta SEO |
| `ServiceScope` / `ServicePackage` | Ruang lingkup + paket harga per layanan |
| `Post` | Artikel/blog |
| `Testimonial` / `TeamMember` (enum `TeamDepartment`) | Testimoni klien + tim |
| `Milestone` / `CoreValue` | Timeline sejarah + nilai perusahaan |
| `GalleryItem` (enum `GalleryCategory`) | Galeri foto |
| `HeroSlide` / `Partner` / `Certificate` | Slider beranda, logo mitra, sertifikat |
| `Faq` / `Feature` / `ProcessStep` / `BeforeAfter` | FAQ, keunggulan, langkah alur, sebelum/sesudah |
| `Message` / `Subscriber` | Pesan kontak + email newsletter |
| `SiteSetting` | Pengaturan situs key-value |
| `EstimatePrice` (enum `BuildingType`) | Harga satuan kalkulator estimasi |
| `Media` | Register file terunggah |

## ✅ Prasyarat

- **Node.js ≥ 20** dan npm ≥ 10
- **PostgreSQL ≥ 14** (lokal) **atau Docker** untuk menjalankan Postgres
- Git

## 🚀 Instalasi & Menjalankan Lokal

```bash
# 1. Clone
git clone <URL_REPO>
cd kotraktor-jaya-abadi

# 2. Install semua dependency (root + server + client)
npm run install-all

# 3. Salin contoh env
cp server/.env.example server/.env
cp client/.env.example client/.env
# lalu edit DATABASE_URL & JWT_SECRET di server/.env

# 4. Buat schema database + migrasi (jika DB masih kosong, db push cukup)
cd server
npx prisma migrate deploy     # produksi; dev pertama kali: npx prisma migrate dev
cd ..

# 5. Seed data awal (admin + konten contoh)
npm run seed --prefix server
#   SEED_ADMIN_PASSWORD wajib diatur di server/.env

# 6. Jalankan server + client bersamaan (dari root)
npm run dev
```

**Akses:**
- Publik: http://localhost:5173
- CMS: http://localhost:5173/admin (redirect ke `/admin/login`)
- API: http://localhost:4000/api/health

**Akun admin awal (seed):** email `admin@jayaabadi.co.id`, password diambil dari `SEED_ADMIN_PASSWORD` di `server/.env` (lihat `.env.example`; jangan pernah memakai nilai seed di produksi). Role: `SUPER_ADMIN`.

## 🔐 Variabel Lingkungan

### `server/.env` (lihat `server/.env.example`)

| Nama | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | `postgres://user:pass@localhost:5432/jayaabadi` | Koneksi PostgreSQL (Prisma) |
| `DATABASE_URL_POOLED` | ⬜ | `postgres://...@pooled.db.prisma.io:5432/postgres` | Koneksi pooled (Prisma Postgres cloud, opsional) |
| `JWT_SECRET` | ✅ (produksi) | string acak 64 hex | Secret token JWT; ada fallback dev |
| `CLIENT_URL` | ✅ | `http://localhost:5173` | Origin diizinkan CORS (post produksi: domain Anda) |
| `PORT` | ⬜ | `4000` | Port HTTP server (default 4000) |
| `SERVER_URL` | ⬜ | `http://localhost:4000` | URL publik server — membangun URL absolut media |
| `SEED_ADMIN_PASSWORD` | ✅ (seed) | placeholder kuat | Password admin awal seed |
| `NODE_ENV` | ⬜ | `production` | Aktifkan `secure` cookie |

### `client/.env` (lihat `client/.env.example`)

| Nama | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `VITE_API_URL` | ✅ | `http://localhost:4000/api` | Base URL REST API |
| `VITE_SITE_URL` | ⬜ | `http://localhost:5173` | URL situs untuk canonical/OG/JSON-LD |

## 📜 Script NPM

| Lokasi | Script | Fungsi |
| --- | --- | --- |
| root | `npm run dev` | Jalankan server (nodemon) + client (vite) bersamaan |
| root | `npm run install-all` | Install root + server + client |
| server | `npm run dev` | API dengan nodemon (reload) |
| server | `npm start` | API produksi |
| server | `npm run seed` | Seed admin + data contoh |
| server | `npx prisma migrate dev` | Migrasi dev |
| server | `npx prisma migrate deploy` | Migrasi produksi |
| server | `npx prisma db push` | Sinkron schema tanpa file migrasi |
| server | `npx prisma studio` | GUI database |
| client | `npm run dev` | Vite dev server (5173) |
| client | `npm run build` | Build produksi ke `dist/` |
| client | `npm run preview` | Serve build (4173) |

## 📚 Dokumentasi API

Base URL: `http://localhost:4000/api`. Detail lengkap per modul: **TODO — `server/README.md` belum dibuat.**

Semua respons memakai format baku:

```json
// Sukses
{ "success": true, "data": { }, "meta": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 } }

// Error (dari error handler global)
{ "success": false, "message": "Pesan kesalahan", "errors": [ { "path": "name", "message": "Nama minimal 2 karakter" } ] }
```

Paginasi (`paginate` util): `?page=1&limit=10&search=kata` — `limit` maksimal 50, `search` case-insensitive pada field `searchFields` modul.

### Endpoint publik (tanpa login)

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/public/services` · `/services/:slug` | Daftar layanan / detail lengkap (scopes, packages, faqs, processSteps, projects, testimonials, prev/next) |
| GET | `/api/public/service-packages?serviceId=` | Paket harga per layanan |
| GET | `/api/public/projects` · `/projects/:slug` | Proyek (filter `?category=&status=&service=&search=&page=&limit=&featured=true&exclude=`) |
| GET | `/api/public/posts` · `/posts/:slug` | Artikel (filter `category`, `search`) |
| GET | `/api/public/testimonials?serviceId=&limit=` | Testimoni terbit |
| GET | `/api/public/faqs?serviceId=` | FAQ terbit |
| GET | `/api/public/categories?type=PROJECT` | Kategori + jumlah proyek |
| GET | `/api/public/settings` | Site settings publik |
| GET | `/api/public/hero-slides` · `/partners` · `/certificates` · `/features` · `/process-steps` · `/milestones` · `/core-values` · `/gallery` · `/before-after` · `/estimate-prices` · `/team` | Konten terbit |
| POST | `/api/public/messages` | Kirim pesan (honeypot `website` harus kosong) |
| POST | `/api/public/subscribe` | Subscribe newsletter (email) |

### Endpoint admin (wajib login)

| Method | Path | Auth | Role | Deskripsi |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` · `/logout` | –/✅ | – | Login (set cookie) / logout |
| GET | `/api/auth/me` | ✅ | login | Profil sesi |
| PUT | `/api/auth/change-password` | ✅ | login | Ganti password sendiri |
| GET | `/api/admin/dashboard` | ✅ | login | Statistik ringkas |
| CRUD | `/api/admin/projects` (+ `PATCH /:id/publish`, `PATCH /:id/featured`) | ✅ | login | Kelola proyek |
| CRUD | `/api/admin/services` (+ `PATCH /reorder`) | ✅ | login | Kelola layanan |
| CRUD | `/api/admin/service-scopes` (+ `/reorder`) · `/api/admin/service-packages` (+ `/reorder`) | ✅ | login | Scope & paket layanan |
| CRUD | `/api/admin/posts` (+ `PATCH /:id/publish`) | ✅ | login | Artikel |
| CRUD | `/api/admin/categories` · `/testimonials` · `/team` · `/hero-slides` · `/partners` · `/certificates` · `/faqs` · `/features` · `/process-steps` · `/before-after` · `/milestones` · `/core-values` · `/gallery` · `/estimate-prices` | ✅ | login | CRUD modul konten (+ `/reorder` untuk yang mendukung) |
| GET | `/api/admin/messages` · `/:id` · `/unread-count` | ✅ | login | Pesan masuk |
| PATCH | `/api/admin/messages/:id/read` · DELETE `/:id` | ✅ | login | Tandai baca / hapus |
| GET/PUT | `/api/admin/settings` | ✅ | login | Site settings |
| GET | `/api/admin/subscribers` | ✅ | login | Daftar subscriber |
| CRUD | `/api/admin/users` (+ `PATCH /:id/toggle-status`) | ✅ | **SUPER_ADMIN** | Kelola pengguna |
| POST | `/api/media/upload` · GET `/api/media` · DELETE `/api/media/:id` | ✅ | **SUPER_ADMIN** | Unggah max 10 file, daftar, hapus |

**Contoh request nyata:**

```bash
# Login — cookie "token" disetel otomatis
curl -i -c jar.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jayaabadi.co.id","password":"<SEED_ADMIN_PASSWORD>"}'
```

```json
// Respons login
{ "success": true, "data": { "id": "c...", "name": "Super Admin", "email": "admin@jayaabadi.co.id", "role": "SUPER_ADMIN", "isActive": true },
  "meta": { "token": "eyJhbGciOi..." } }
```

## 🔑 Autentikasi & Otorisasi

JWT 7 hari di cookie `token` (`httpOnly`, `sameSite=lax`, `secure` saat `NODE_ENV=production`), plus dukungan `Authorization: Bearer` (mis. untuk tooling). Role di schema: `SUPER_ADMIN`, `ADMIN`, `EDITOR`.

**Matriks role (rencana penuh):**

| Modul | SUPER_ADMIN | ADMIN | EDITOR |
| --- | --- | --- | --- |
| Pengguna, Media | ✅ (satu-satunya yang dibatasi di backend saat ini) | ❌ | ❌ |
| Modul konten lainnya (proyek, layanan, artikel, dst.) | ✅ | ✅ | ✅ (backend belum membatasi per-role) |
| Pengaturan situs | ✅ | ✅ | TODO — dibatasi saat granularisasi role |

> ⚠️ Catatan jujur: saat ini hanya `users` & `media` yang memakai `requireRole("SUPER_ADMIN")`. Modul admin lainnya hanya lindungi `requireAuth`. Granularisasi per-role (mis. `EDITOR` hanya draft) masuk [Roadmap](#-roadmap).

## 🖼️ Upload & Media

- **Endpoint:** `POST /api/media/upload`, field form-data `files` (multi, maks **10 file**).
- **Tipe:** JPG (`image/jpeg`), PNG (`image/png`), WebP (`image/webp`). Maks **5 MB per file**.
- **Penyimpanan:** disk `server/uploads/`, nama acak UUID + ekstensi dari mimetype (mencegah path traversal). Dilayani statis di `http://localhost:4000/uploads/<file>`; URL absolut memakai `SERVER_URL`.
- **Konversi WebP:** sharp menghasilkan varian `image/webp` saat diproses (lihat `modules/media/service.js`).
- **Pindah ke S3/Cloudinary:** abstraksi ada di `modules/media/upload.js` (multer `diskStorage`) dan `service.js`. Ganti `destination` menjadi stream engine S3/Cloudinary (`s3 multer-storage` atau `multer-cloudinary`), tambahkan env `S3_BUCKET`/`CLOUDINARY_*`, dan ubah `service.js` menyimpan URL remote di model `Media`.

## 🧭 Panduan Penggunaan CMS

1. **Tambah proyek** (`/admin/proyek/baru`): isi nama, kategori, layanan, lokasi, tahun, status, ringkasan, deskripsi, unggah cover + gambar (via Media lalu pilih URL) → **Simpan**, lalu **Publish** dari daftar.
2. **Kelola galeri** (`/admin/galeri`): unggah foto, pilih kategori galeri, susun urutan dengan tombol ▲▼ (reorder tersimpan langsung).
3. **Atur pengaturan situs** (`/admin/pengaturan`): telepon, WhatsApp, email, alamat, embed maps, jam kerja, angka statistik, URL brosur — berlaku keduanya di semua halaman publik.
4. **Baca pesan masuk** (`/admin/pesan`): daftar pesan dari form kontak & modal paket, tandai dibaca (`PATCH /:id/read`), badge unread muncul di dashboard/sidebar.
5. **Layanan & paket:** edit layanan (form 4 tab), kelola paket di `/admin/layanan/:id/paket` (reorder, satu "Paling Populer" per layanan, preview kartu langsung).

## 🧪 Pengujian & Kualitas

- **Lint** — TODO: script lint (ESLint/Prettier) belum dikonfigurasi di repo.
- **Test otomatis** — TODO: belum ada test runner. Pengujian dilakukan headless (Playwright + Edge) dan smoke check API manual.
- **Build verifikasi:** `npm run build --prefix client` (terakhir ✓ 491–714 ms, tanpa error).
- **Checklist QA manual:**
  - [ ] `/`, `/tentang`, `/layanan`, `/proyek`, `/artikel`, `/kontak` — 0 error console, 0 horizontal scroll di 375/768/1024/1440 px
  - [ ] Login/logout admin, akses `/admin` tanpa login ditolak (redirect)
  - [ ] CRUD satu entri per modul utama + reorder
  - [ ] Upload gambar (JPG/PNG/WebP) tampil di halaman publik
  - [ ] Form kontak + subscribe + modal paket terkirim (pesan muncul di admin)
  - [ ] SEO: meta description, JSON-LD, `sitemap.xml` & `robots.txt` merespons 200

## 🚢 Deployment

### (a) Docker Compose

TODO — file `docker-compose.yml` belum ada di repo. Kerangka yang disarankan:

```yaml
# TODO: buat docker-compose.yml (db, server, client + nginx)
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: jayaabadi
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: jayaabadi
    volumes: [dbdata:/var/lib/postgresql/data]
  # server: build ./server, NODE_ENV=production, depend on db
  # client: build ./client, serve dist via nginx reverse proxy /api + /uploads
volumes: { dbdata: {} }
```

### (b) VPS Manual (Nginx + PM2 + Let's Encrypt)

```bash
# 1. Server: install Node 20+, PostgreSQL, nginx, pm2
npm i -g pm2

# 2. Deploy kode + install + env produksi
git pull
npm run install-all
# server/.env → NODE_ENV=production, CLIENT_URL=https://domain.tld,
# SERVER_URL=https://api.domain.tld, DATABASE_URL, JWT_SECRET baru

# 3. Migrasi + build
cd server && npx prisma migrate deploy && cd ..
npm run build --prefix client

# 4. PM2
pm2 start server/src/server.js --name jaya-api
pm2 save && pm2 startup

# 5. Nginx: root /var/www/jayaabadi/client/dist,
#    proxy /api & /uploads → http://127.0.0.1:4000
sudo certbot --nginx -d domain.tld
```

**Backup/restore database:**

```bash
# Backup
pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%F).dump
# Restore
pg_restore -d "$DATABASE_URL" --clean --if-exists backup-2026-01-01.dump
```

## 🔐 Keamanan

Sudah diterapkan:
- `helmet` (header keamanan), `express-rate-limit` (300 req/15 menit per IP di `/api`)
- Validasi input **Zod** di semua endpoint via middleware `validate`
- Cookie sesi **httpOnly** + `sameSite=lax` + `secure` di produksi
- Password **bcrypt** (10 salt rounds), akun bisa dinonaktifkan (cek per-request)
- Upload: whitelist mimetype, nama file acak UUID, batas ukuran/jumlah
- Honeypot form kontak (anti-bot), CORS whitelist origin

Sebelum produksi:
- [ ] `JWT_SECRET` baru & acak (jangan fallback `dev-secret-jaya-abadi`)
- [ ] Granularisasi `requireRole` di seluruh modul admin
- [ ] HTTPS aktif (cookie `secure` butuh ini)
- [ ] Batasi `morgan` hanya di development
- [ ] Backup database terjadwal

## 🛠️ Pemecahan Masalah (Troubleshooting)

| Masalah | Solusi |
| --- | --- |
| `P1001: can't reach database` / koneksi ditolak | PostgreSQL belum jalan atau `DATABASE_URL` salah. Tes: `psql "$DATABASE_URL" -c "select 1"`; pastikan port 5432, user, nama DB benar. |
| Prisma error "migration failed / drift" | Jangan campur `db push` dan `migrate`. Reset dev: `npx prisma migrate reset --schema=prisma/schema.prisma` (hapus data!). Produksi selalu `migrate deploy`. |
| Cookie login tidak terkirim / CORS blokir | `CLIENT_URL` di `server/.env` harus persis origin frontend (protokol+host+port). Preview build (port 4173) sudah di-whitelist; tambah origin lain di `server/src/app.js` atau atur `CLIENT_URL`. |
| Request admin dapat 401 | Sesi kedaluwarsa (JWT 7 hari) atau akun `isActive=false`. Login ulang; cek `GET /api/auth/me`. |
| Upload gagal "Ukuran file melebihi 5 MB" / tipe tidak didukung | Maks 5 MB, hanya JPG/PNG/WebP, field form-data harus `files`. Folder `server/uploads/` harus bisa ditulis. |
| Gambar tidak tampil (`/uploads/...` 404) | `SERVER_URL` belum diatur dengan URL publik yang benar, atau file dihapus dari `server/uploads/`. |
| Port 4000/5173 bentrok ("EADDRINUSE") | Matikan proses lama: `npx kill-port 4000 5173` atau Windows `Get-NetTCPConnection -LocalPort 4000 | % { taskkill /PID $_.OwningProcess /T /F }`. |
| "Terlalu banyak permintaan" saat tes bulk | Rate limit 300 req/15 menit aktif. Beri jeda antar request atau restart server di lingkungan dev. |
| Seed gagal `SEED_ADMIN_PASSWORD tidak diatur` | Atur `SEED_ADMIN_PASSWORD` di `server/.env` sebelum `npm run seed`. |
| React 401 di console `/api/auth/me` saat mengunjungi halaman publik | Normal — cek sesi dari AuthContext; abaikan bila belum login. |

## 🗺️ Roadmap

- [ ] Granularisasi role per modul (`EDITOR` = draft only, dll.)
- [ ] `docker-compose.yml` + Dockerfile produksi
- [ ] Lint (ESLint + Prettier) & CI pipeline
- [ ] Test otomatis (Vitest/Playwright) + `server/README.md` dokumentasi API
- [ ] Penyimpanan media ke S3/Cloudinary
- [ ] WYSIWYG editor konten proyek/artikel
- [ ] Multi-bahasa
- [ ] Notifikasi email pesan masuk
- [ ] Halaman karier (`/karier`)

## 🤝 Kontribusi

1. Branch dari `main`: `feat/nama-fitur` atau `fix/nama-bug`.
2. Commit: **Conventional Commits** — `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`.
3. Standar kode: ESM, komponen kecil & fungsional, Tailwind v4 `@theme` token (tanpa warna literal), validasi Zod di batas kepercayaan, respons API lewat `sendSuccess`/`ApiError`.
4. Sebelum push: `npm run build --prefix client` harus lolos, cek 0 console error di halaman yang disentuh.

## 📄 Lisensi dan Kontak

TODO — lisensi belum ditetapkan (repo `private: true`). Gunakan MIT/proprietary sesuai keputusan pemilik.

**Kontak** — Jaya Abadi Kontraktor:
- Website: http://localhost:5173 (produksi: TODO)
- Email/telepon/alamat: diatur di CMS (`/admin/pengaturan`) dan tampil di halaman `/kontak`
