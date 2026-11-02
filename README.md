# 🏗️ Jaya Abadi — Company Profile dan CMS Kontraktor

Website publik dan CMS untuk Jaya Abadi, kontraktor konstruksi, renovasi, interior, dan pengawasan proyek.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white) ![React](https://img.shields.io/badge/React-19.3.1-61DAFB?logo=react&logoColor=111827) ![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/Express-5.3.0-111827?logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-336791?logo=postgresql&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-4.3.3-38BDF8?logo=tailwindcss&logoColor=white) ![Build](https://img.shields.io/badge/build-local%20verified-brightgreen) ![License](https://img.shields.io/badge/license-belum%20ditentukan-lightgrey)

> Lisensi proyek belum ditetapkan. Jangan menganggap kode ini berlisensi open source sebelum file `LICENSE` ditambahkan.

![Tangkapan layar utama — placeholder](docs/screenshots/homepage-placeholder.svg)

Tangkapan layar belum disimpan di repositori. Daftar gambar yang disarankan ada di [`docs/screenshots/README.md`](docs/screenshots/README.md).

## 2. Daftar Isi

- [Tentang Proyek](#3-tentang-proyek)
- [Fitur Website Publik](#4-fitur-website-publik)
- [Fitur CMS Admin](#5-fitur-cms-admin)
- [Tech Stack](#6-tech-stack)
- [Arsitektur](#7-arsitektur)
- [Struktur Folder](#8-struktur-folder)
- [Skema Database](#9-skema-database)
- [Prasyarat](#10-prasyarat)
- [Instalasi dan Menjalankan Lokal](#11-instalasi-dan-menjalankan-lokal)
- [Variabel Lingkungan](#12-variabel-lingkungan)
- [Script NPM](#13-script-npm)
- [Peta Route](#14-peta-route)
- [Dokumentasi API](#15-dokumentasi-api)
- [Autentikasi dan Otorisasi](#16-autentikasi-dan-otorisasi)
- [Upload, Media dan Lampiran](#17-upload-media-dan-lampiran)
- [Panduan Penggunaan CMS](#18-panduan-penggunaan-cms)
- [Konten Awal Seed](#19-konten-awal-seed)
- [Pengujian dan Kualitas](#20-pengujian-dan-kualitas)
- [SEO dan Performa](#21-seo-dan-performa)
- [Deployment](#22-deployment)
- [Keamanan](#23-keamanan)
- [Pemecahan Masalah](#24-pemecahan-masalah)
- [Roadmap](#25-roadmap)
- [Kontribusi](#26-kontribusi)
- [Changelog Ringkas](#27-changelog-ringkas)
- [Lisensi dan Kontak](#28-lisensi-dan-kontak)

## 3. Tentang Proyek

Jaya Abadi adalah monorepo dengan dua aplikasi:

- `client/`: SPA React + Vite untuk pengunjung dan CMS admin.
- `server/`: REST API Express + Prisma yang terhubung ke PostgreSQL.

### Pengguna

| Pengguna | Kebutuhan |
| --- | --- |
| Pengunjung | Membaca profil, layanan, proyek, artikel, FAQ, lokasi kantor, dan mengirim konsultasi. |
| Admin | Mengelola konten, pesan masuk, media, cabang, pengaturan, dan subscriber. |
| Editor | Mengelola modul admin yang memerlukan login; pembatasan per modul belum diterapkan selain pengguna. |

### Ringkasan otomatis dari kode

| Angka | Nilai | Sumber |
| --- | ---: | --- |
| Model Prisma | **28** | `server/prisma/schema.prisma` |
| Enum Prisma | **10** | `server/prisma/schema.prisma` |
| Migrasi | **12** | `server/prisma/migrations/` |
| Endpoint publik | **32** | `publicRouter` dan `public-router.js` |
| Endpoint admin | **134** | route module yang dipasang di `/api/admin/*` |
| Halaman publik | **10** | route React publik, termasuk 404 |
| Halaman admin | **38** | login + 37 route area admin, termasuk placeholder 404 |
| Modul CMS admin | **27** | 25 prefix `/api/admin/*` + Media + Pengguna |

Endpoint `/api/auth/*`, `/api/users/*`, `/api/media/*`, dan `/api/health` dihitung terpisah dari angka admin karena tidak dipasang di prefix `/api/admin/*`.

## 4. Fitur Website Publik

| Halaman | Section/Fitur | Sumber data |
| --- | --- | --- |
| Beranda `/` | Hero slider, statistik animasi, layanan unggulan, keunggulan, alur kerja, before/after, testimoni, mitra marquee, kalkulator estimasi biaya, CTA | Endpoint publik hero, services, features, process steps, before-after, testimonials, partners, estimate prices, settings |
| Tentang `/tentang` | Banner, profil perusahaan, pesan direktur, statistik, timeline sejarah, visi-misi, nilai, tim, legalitas, galeri, CTA | `milestones`, `core-values`, `team`, `certificates`, `gallery`, settings |
| Layanan `/layanan` | Banner, pencarian/filter, grid layanan, layanan terintegrasi, ruang lingkup, alur kerja, paket/harga, sektor, proyek terkait, testimoni, FAQ, CTA | `GET /api/public/services` dan endpoint publik terkait |
| Detail layanan `/layanan/:slug` | Hero, harga mulai, brosur, scope, proses, paket, proyek terkait, FAQ, testimoni, navigasi sebelum/berikutnya, SEO | `GET /api/public/services/:slug`, packages, faqs, projects |
| Proyek `/proyek` | Filter kategori/status/tahun/search, pagination, mode Grid/Daftar/Peta, statistik | `GET /api/public/projects`, `/projects/map`, `/projects/stats` |
| Detail proyek `/proyek/:slug` | Galeri, spesifikasi, cerita tantangan-solusi-hasil, koordinat, proyek terkait, view count, CTA konsultasi | `GET /api/public/projects/:slug` |
| Artikel `/artikel` | Featured hero, filter kategori/tag/search, pagination, sidebar populer, newsletter | `GET /api/public/posts`, `/api/public/posts/featured`, `/api/public/posts/popular`, `/api/public/tags` |
| Detail artikel `/artikel/:slug` | Reading progress, daftar isi, metadata, share, author, artikel terkait, newsletter, JSON-LD Article | `GET /api/public/posts/:slug` |
| Kontak `/kontak` | ContactBanner, QuickChannels, form konsultasi tiga langkah, upload lampiran, nomor tiket, OfficeMap cabang, WhatNext, FAQ umum, ContactCta | settings, branches, services, faqs, messages |
| 404 publik | Halaman tidak ditemukan | Statis |

Fitur khas yang tersedia:

- Banner dan statistik animasi.
- Marquee mitra.
- Kalkulator estimasi biaya.
- Slider before/after.
- Timeline sejarah dan alur kerja.
- Paket dan harga per layanan.
- Filter proyek dengan mode Grid, Daftar, dan Peta Leaflet/OSM.
- Daftar isi dan reading progress artikel.
- Form konsultasi tiga langkah dengan Zod, draft `sessionStorage`, honeypot, upload lampiran, rate limit, dan nomor tiket.
- Peta kantor cabang, status buka/tutup WIB, tombol salin alamat dan petunjuk arah.
- Pagination, lazy loading, skeleton, `Reveal`, SEO meta, dan JSON-LD.

## 5. Fitur CMS Admin

Semua modul admin di bawah memerlukan login. Saat ini backend hanya menerapkan pembatasan role khusus pada Pengguna; modul lain memakai `requireAuth` tanpa `requireRole`.

| Modul | Fungsi | Fitur khusus | Role yang boleh mengakses |
| --- | --- | --- | --- |
| Dashboard | Statistik ringkas dan pesan terbaru | Unread count, ringkasan status proyek | Semua user login |
| Proyek | CRUD portofolio | Publish, featured, bulk action, galeri, koordinat, SEO | Semua user login |
| Layanan | CRUD layanan | Reorder, publish, hero image, brosur, harga, SEO | Semua user login |
| Paket Layanan | CRUD paket per layanan | Harga, fitur JSON, popular, reorder | Semua user login |
| Ruang Lingkup | CRUD scope layanan | Ikon dan reorder | Semua user login |
| Kategori | CRUD kategori | Type `PROJECT`/`POST`, slug | Semua user login |
| Artikel | CRUD artikel | Publish, scheduling, featured, SEO, bulk action | Semua user login |
| Tag | CRUD tag artikel | Slug dan relasi many-to-many | Semua user login |
| Testimoni | CRUD testimoni | Publish dan relasi layanan | Semua user login |
| Tim | CRUD anggota tim | Departemen, publish, reorder | Semua user login |
| Hero Slider | CRUD slide | Aktif/nonaktif, urutan, CTA | Semua user login |
| Mitra | CRUD mitra | Logo, website, publish, reorder | Semua user login |
| Sertifikat | CRUD sertifikat | Tahun, issuer, publish, reorder | Semua user login |
| FAQ | CRUD FAQ | FAQ umum/berbasis layanan, publish, reorder | Semua user login |
| Keunggulan | CRUD keunggulan | Ikon, publish, reorder | Semua user login |
| Alur Kerja | CRUD process step | Ikon, relasi layanan, publish, reorder | Semua user login |
| Sebelum/Sesudah | CRUD perbandingan | Relasi proyek, publish, reorder | Semua user login |
| Harga Estimasi | CRUD harga kalkulator | Tipe bangunan, rentang harga, publish | Semua user login |
| Sejarah | CRUD milestone | Tahun, publish, reorder | Semua user login |
| Nilai-Nilai | CRUD core value | Ikon, publish, reorder | Semua user login |
| Galeri | CRUD galeri | Kategori, publish, reorder | Semua user login |
| Kantor Cabang | CRUD kantor | Satu kantor utama, jam 7 hari, koordinat, peta, publish | Semua user login |
| Pesan Masuk | Membaca dan memproses konsultasi | Status cepat, filter, catatan autosave, lampiran, WhatsApp, CSV | Semua user login |
| Subscriber | Daftar newsletter | Listing dan pagination | Semua user login |
| Media | Upload dan kelola media | Maks. 10 file, 5 MB/file, kompresi WebP, thumbnail | Semua user login |
| Pengaturan Situs | Key-value settings | Kontak, statistik, konten umum, response time | Semua user login |
| Pengguna | CRUD akun CMS | Aktif/nonaktif, role, ganti password | **SUPER_ADMIN** |

## 6. Tech Stack

| Lapisan | Teknologi | Versi dari manifest | Alasan dipakai |
| --- | --- | --- | --- |
| Runtime | Node.js | Tidak dikunci di `package.json`; prasyarat operasional 20+ | Runtime client tooling dan server ESM |
| Frontend | React | `19.3.1` | UI deklaratif dan component-based |
| Bundler | Vite | `8.3.5` | Dev server dan build code-splitting |
| Routing | React Router DOM | `7.18.5` | Route publik, admin, protected route |
| Styling | Tailwind CSS | `4.3.3` | Token desain dan utility responsive |
| Data fetching | TanStack Query | `5.105.0` | Cache, loading, invalidasi, mutation |
| Form | React Hook Form | `7.91.0` | Form state dan submit efisien |
| Validasi client/server | Zod | `4.6.7` | Schema validation dan pesan error |
| HTTP client | Axios | `1.21.0` | Base URL dan cookie credentials |
| Ikon | Lucide React | `1.64.0` | Ikon UI konsisten |
| Peta | Leaflet + React Leaflet | `1.9.4` / `5.0.0` | OSM, marker, peta proyek dan kantor |
| Peta cluster | React Leaflet Cluster | `4.1.3` | Mengelompokkan marker proyek |
| SEO | React Helmet Async | `3.0.0` | Meta, canonical, Open Graph, JSON-LD |
| Backend | Express | `5.3.0` | REST API modular |
| ORM | Prisma Client / CLI | `6.19.3` | Query PostgreSQL dan migration |
| Database | PostgreSQL | Provider Prisma `postgresql` | Data relasional dan JSON field |
| Auth | JSON Web Token + bcrypt | `9.0.3` / `6.0.0` | JWT cookie httpOnly dan hash password |
| Upload | Multer | `2.5.0` | Multipart upload dan batas file |
| Optimasi gambar | sharp | `0.35.5` | WebP dan thumbnail Media admin |
| Security | Helmet + express-rate-limit | `8.3.0` / `8.7.2` | Header keamanan dan pembatasan request |

## 7. Arsitektur

```mermaid
flowchart LR
    Browser[Browser] --> React[React 19 + Vite SPA]
    React --> Axios[Axios VITE_API_URL]
    Axios --> API[Express REST API]
    API --> Public[/api/public/*]
    API --> Auth[/api/auth/*]
    API --> Admin[/api/admin/*]
    Admin --> Middleware[requireAuth + validation]
    Public --> Services[Modular controller/service]
    Middleware --> Services
    Services --> Prisma[Prisma Client]
    Prisma --> PostgreSQL[(PostgreSQL)]
    API --> Uploads[/uploads static]
    Uploads --> Disk[(server/uploads)]
    API --> SEO[sitemap.xml + robots.txt]
```

### Sequence login JWT cookie

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as React
    participant A as Express Auth
    participant P as Prisma
    participant D as PostgreSQL
    B->>R: Isi email dan password
    R->>A: POST /api/auth/login
    A->>P: Cari User berdasarkan email
    P->>D: SELECT users
    D-->>P: User + password hash
    P-->>A: User aktif
    A->>A: bcrypt.compare + sign JWT 7d
    A-->>B: Set-Cookie token httpOnly
    B->>A: GET /api/auth/me dengan cookie
    A->>A: Verifikasi JWT
    A->>P: Ambil user terbaru
    P->>D: SELECT users
    D-->>P: Profil tanpa password
    P-->>A: Profil
    A-->>B: { success: true, data: user }
```

### Sequence pengiriman form kontak

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as ConsultationForm
    participant A as Express
    participant L as Rate limiter
    participant V as Zod validation
    participant DB as Prisma/PostgreSQL
    B->>F: Isi 3 langkah dan lampiran
    F->>A: POST /api/public/messages/attachments
    A->>L: Batasi 5 upload/jam/IP
    L-->>A: Lolos
    A-->>F: URL lampiran
    F->>A: POST /api/public/messages
    A->>L: Batasi 5 pesan/jam/IP
    L-->>A: Lolos
    A->>V: Validasi body
    V-->>A: Valid
    A->>A: Honeypot kosong
    A->>DB: Generate ticket + INSERT messages
    DB-->>A: Message + ticketCode
    A-->>F: 201 { ticketCode }
    F-->>B: Kartu konfirmasi + WhatsApp
```

### Pola backend dan frontend

- Backend memakai pola `route.js` → `controller.js` → `service.js` → `validation.js`.
- `route.js` memasang middleware auth dan validasi.
- `controller.js` mengurus HTTP; logika bisnis dan Prisma berada di service.
- Frontend memakai `api` Axios tunggal, TanStack Query untuk query/mutation, dan `React.lazy` untuk code-splitting halaman.
- Respons sukses memakai `{ success, data, meta }`; error memakai `{ success: false, message, errors }`.

## 8. Struktur Folder

```text
kotraktor-jaya-abadi/
├── client/
│   ├── public/                         # robots.txt dan favicon
│   └── src/
│       ├── components/
│       │   ├── ui/                     # Button, Input, Modal, Skeleton, Toast, dll.
│       │   ├── public/
│       │   │   ├── home/               # Hero, estimator, process, FAQ, before/after
│       │   │   ├── about/              # Profil, timeline, tim, legalitas, galeri
│       │   │   ├── services/           # Layanan, scope, paket, FAQ, CTA
│       │   │   ├── projects/           # Card, filter, map, banner, CTA
│       │   │   ├── blog/               # Banner, filter, card, detail, sidebar
│       │   │   └── contact/            # Banner, form konsultasi, kantor, FAQ, CTA
│       │   └── admin/                  # Layout, sidebar, topbar, picker, rich text
│       ├── context/                    # AuthContext
│       ├── hooks/                      # useReveal dan hook lain
│       ├── lib/                        # Axios dan service icons
│       ├── pages/
│       │   ├── public/                 # halaman publik
│       │   └── admin/                  # halaman CMS admin
│       ├── routes/                     # ProtectedRoute dan RoleRoute
│       ├── App.jsx                     # Definisi route React
│       └── main.jsx                    # Provider dan entry point
├── server/
│   ├── prisma/                         # schema, migrations, seed
│   ├── src/
│   │   ├── config/                     # Prisma dan JWT
│   │   ├── middleware/                 # Auth, validation, error handler
│   │   ├── modules/                    # Modul REST per domain
│   │   ├── app.js                      # Mount router dan middleware
│   │   └── server.js                   # Listener PORT
│   ├── uploads/                        # File Media dan messages
│   └── requests.http                   # Contoh request REST
├── docs/screenshots/                   # Placeholder/list screenshot
├── CONTRIBUTING.md                     # Panduan kontribusi
├── PRD.md                              # Riwayat requirement bertahap
├── package.json                        # Script root
└── README.md                           # Dokumentasi ini
```

## 9. Skema Database

### Konten utama

```mermaid
erDiagram
    Category ||--o{ Project : category
    Category ||--o{ Post : category
    Service ||--o{ Project : service
    Project ||--o{ ProjectImage : images
    Project ||--o{ BeforeAfter : comparisons
    User ||--o{ Post : authors
    Post ||--o{ PostTag : tags
    Tag ||--o{ PostTag : posts
    Category {
        string id PK
        string name
        string slug UK
        CategoryType type
    }
    Project {
        string id PK
        string slug UK
        string categoryId FK
        string serviceId FK
        ProjectStatus status
        boolean isPublished
    }
    ProjectImage {
        string id PK
        string projectId FK
        string url
        int sortOrder
    }
    Post {
        string id PK
        string slug UK
        string authorId FK
        string categoryId FK
        boolean isPublished
    }
    Tag {
        string id PK
        string slug UK
        string name
    }
    PostTag {
        string postId PK
        string tagId PK
    }
    User {
        string id PK
        string email UK
        Role role
        boolean isActive
    }
    Service {
        string id PK
        string slug UK
        string title
    }
    BeforeAfter {
        string id PK
        string projectId FK
        string beforeImage
        string afterImage
    }
```

### Beranda dan Tentang

```mermaid
erDiagram
    Milestone {
        string id PK
        int year
        string title
        boolean isPublished
    }
    CoreValue {
        string id PK
        string title
        string icon
        boolean isPublished
    }
    GalleryItem {
        string id PK
        GalleryCategory category
        string image
        int sortOrder
    }
    HeroSlide {
        string id PK
        string title
        string image
        boolean isActive
    }
    Partner {
        string id PK
        string name
        string logo
        boolean isPublished
    }
    Certificate {
        string id PK
        string title
        string issuer
        boolean isPublished
    }
    Feature {
        string id PK
        string title
        string icon
        boolean isPublished
    }
    TeamMember {
        string id PK
        string name
        TeamDepartment department
        boolean isPublished
    }
```

### Layanan dan paket

```mermaid
erDiagram
    Service ||--o{ ServiceScope : scopes
    Service ||--o{ ServicePackage : packages
    Service ||--o{ Faq : faqs
    Service ||--o{ ProcessStep : steps
    Service ||--o{ Testimonial : testimonials
    Service {
        string id PK
        string slug UK
        string title
        boolean isPublished
    }
    ServiceScope {
        string id PK
        string serviceId FK
        string title
        int sortOrder
    }
    ServicePackage {
        string id PK
        string serviceId FK
        int priceFrom
        boolean isPopular
    }
    Faq {
        string id PK
        string serviceId FK
        string question
        boolean isPublished
    }
    ProcessStep {
        string id PK
        string serviceId FK
        string title
        int sortOrder
    }
    Testimonial {
        string id PK
        string serviceId FK
        string name
        int rating
    }
    EstimatePrice {
        string id PK
        BuildingType buildingType
        string label
        int pricePerM2Min
        int pricePerM2Max
        boolean isPublished
    }
```

### Blog dan Tag

```mermaid
erDiagram
    User ||--o{ Post : writes
    Category ||--o{ Post : groups
    Post ||--o{ PostTag : has
    Tag ||--o{ PostTag : groups
    Post {
        string id PK
        string authorId FK
        string categoryId FK
        string slug UK
        datetime publishedAt
    }
    PostTag {
        string postId PK
        string tagId PK
    }
    Tag {
        string id PK
        string slug UK
        string name
    }
```

### Kontak dan pesan

```mermaid
erDiagram
    Service ||--o{ Message : related
    Branch {
        string id PK
        string name
        string city
        float latitude
        float longitude
        json openingHours
    }
    Message {
        string id PK
        string serviceId FK
        string ticketCode UK
        MessageStatus status
        json attachments
    }
    Subscriber {
        string id PK
        string email UK
        datetime createdAt
    }
    SiteSetting {
        string id PK
        string key UK
        string value
    }
```

### Pengguna dan media

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        Role role
        boolean isActive
    }
    Media {
        string id PK
        string url
        string filename
        string mimeType
        int size
    }
```

### Ringkasan model

| Model | Fungsi |
| --- | --- |
| `User` | Akun CMS dan penulis artikel. |
| `Category` | Kategori proyek atau artikel. |
| `Project`, `ProjectImage` | Portofolio dan gambar proyek. |
| `Service`, `ServiceScope`, `ServicePackage` | Layanan, scope, dan paket harga. |
| `Post`, `Tag`, `PostTag` | Artikel, tag, dan relasi many-to-many. |
| `Testimonial`, `TeamMember` | Testimoni dan profil tim. |
| `Milestone`, `CoreValue`, `GalleryItem` | Konten halaman Tentang. |
| `HeroSlide`, `Partner`, `Certificate`, `Feature` | Konten beranda dan legalitas. |
| `Faq`, `ProcessStep`, `BeforeAfter`, `EstimatePrice` | FAQ, alur kerja, perbandingan, kalkulator. |
| `Message`, `Branch`, `Subscriber`, `SiteSetting` | Kontak, kantor, newsletter, konfigurasi. |
| `Media` | Register file Media admin. |

### Enum

`Role`, `CategoryType`, `ProjectStatus`, `BudgetRange`, `PreferredContact`, `PreferredTime`, `MessageStatus`, `TeamDepartment`, `GalleryCategory`, dan `BuildingType`.

## 10. Prasyarat

- Node.js 20 atau lebih baru. `package.json` belum memiliki field `engines`, jadi versi ini adalah standar operasional proyek, bukan constraint npm.
- npm yang kompatibel dengan Node.js.
- PostgreSQL yang dapat diakses oleh `DATABASE_URL`.
- Git.
- Docker opsional; `docker-compose.yml` **Belum tersedia**.

## 11. Instalasi dan Menjalankan Lokal

```bash
# 1. Clone
git clone <URL_REPO>
cd kotraktor-jaya-abadi

# 2. Install root, server, dan client
npm run install-all

# 3. Salin environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Isi DATABASE_URL dan SEED_ADMIN_PASSWORD.

# 4. Validasi dan migrasi database
cd server
npx prisma validate
npx prisma migrate dev

# 5. Isi data awal
npm run seed

# 6. Jalankan server dan client dari root
cd ..
npm run dev
```

Alamat lokal:

| Area | URL |
| --- | --- |
| Publik | `http://localhost:5173` |
| Admin | `http://localhost:5173/admin/login` |
| Health API | `http://localhost:4000/api/health` |
| Sitemap | `http://localhost:4000/sitemap.xml` |
| Robots | `http://localhost:4000/robots.txt` |

Akun seed memakai email `admin@jayaabadi.co.id`. Password dibaca dari `SEED_ADMIN_PASSWORD`; password nyata tidak disimpan di dokumentasi.

### Reset database pengembangan

Perintah berikut destruktif untuk database yang sedang dipakai:

```bash
cd server
npx prisma migrate reset
npm run seed
```

Jalankan hanya pada database development.

## 12. Variabel Lingkungan

### Server

| Nama | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `DATABASE_URL` | Ya | `postgres://USER:PASSWORD@localhost:5432/jayaabadi` | Koneksi Prisma/PostgreSQL. |
| `DATABASE_URL_POOLED` | Opsional | `postgres://...` | Ada di contoh env; belum dibaca langsung oleh runtime. |
| `JWT_SECRET` | Ya untuk produksi | `acak-minimal-32-karakter` | Secret JWT; development memiliki fallback. |
| `CLIENT_URL` | Ya | `http://localhost:5173` | Origin CORS utama. |
| `PORT` | Opsional | `4000` | Port Express, default `4000`. |
| `SERVER_URL` | Opsional | `http://localhost:4000` | Prefix URL respons Media. |
| `SITE_URL` | Opsional | `http://localhost:5173` | URL sitemap/robots. |
| `SEED_ADMIN_PASSWORD` | Wajib saat seed | `password-kuat` | Password admin awal. |
| `NODE_ENV` | Opsional | `production` | Mengaktifkan secure cookie dan pesan error production. |

### Client

| Nama | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `VITE_API_URL` | Ya | `http://localhost:4000/api` | Base URL Axios. |
| `VITE_SITE_URL` | Opsional | `http://localhost:5173` | Canonical, Open Graph, JSON-LD. |
| `VITE_WA_NUMBER` | Opsional | `6281234567890` | Fallback WhatsApp pada `FaqSection`; settings/branch tetap sumber utama komponen kontak. |

## 13. Script NPM

| Lokasi | Script | Fungsi |
| --- | --- | --- |
| Root | `npm run dev` | Menjalankan server dan client bersamaan dengan `concurrently`. |
| Root | `npm run install-all` | Install dependency root, server, dan client. |
| Client | `npm run dev` | Menjalankan Vite. |
| Client | `npm run build` | Build production Vite. |
| Client | `npm run preview` | Preview hasil build Vite. |
| Server | `npm run dev` | Nodemon pada `src/server.js`. |
| Server | `npm start` | Menjalankan server production-style. |
| Server | `npm run seed` | Menjalankan `prisma/seed.js`. |
| Server via npx | `npx prisma validate` | Validasi schema Prisma. |
| Server via npx | `npx prisma migrate dev` | Membuat/menjalankan migration development. |
| Server via npx | `npx prisma migrate deploy` | Menjalankan migration deployment. |

Tidak ada script `lint` atau `test` di manifest saat ini. TODO: tambahkan test runner dan linting standar.

## 14. Peta Route

### Route React publik

| Path | Halaman | Parameter/query penting |
| --- | --- | --- |
| `/` | Beranda | — |
| `/tentang` | Tentang | — |
| `/layanan` | Daftar layanan | — |
| `/layanan/:slug` | Detail layanan | `slug` |
| `/proyek` | Daftar proyek | `q`, `kategori`, `layanan`, `tahun`, `status`, `urutan`, `halaman`, `tampilan` (`grid`/`daftar`/`peta`) |
| `/proyek/:slug` | Detail proyek | `slug` |
| `/artikel` | Daftar artikel | `q`, `kategori`, `tag`, `urutan`, `halaman` |
| `/artikel/:slug` | Detail artikel | `slug` |
| `/kontak` | Form konsultasi dan kontak | `layanan`, `proyek`, `paket` |
| `*` | 404 publik | — |

### Route React admin

| Path | Modul | Role |
| --- | --- | --- |
| `/admin/login` | Login | Publik |
| `/admin` | Dashboard | Semua user login |
| `/admin/proyek`, `/admin/proyek/baru`, `/admin/proyek/:id/edit` | Proyek | Semua user login |
| `/admin/layanan`, `/admin/layanan/baru`, `/admin/layanan/:id/edit` | Layanan | Semua user login |
| `/admin/layanan/:id/paket` | Paket layanan | Semua user login |
| `/admin/kategori` | Kategori | Semua user login |
| `/admin/artikel`, `/admin/artikel/baru`, `/admin/artikel/:id/edit`, `/admin/posts`, `/admin/posts/baru`, `/admin/posts/:id/edit` | Artikel | Semua user login |
| `/admin/tags`, `/admin/testimoni`, `/admin/tim` | Konten | Semua user login |
| `/admin/partners`, `/admin/certificates`, `/admin/faqs` | Konten beranda | Semua user login |
| `/admin/features`, `/admin/process-steps`, `/admin/before-after`, `/admin/estimate-prices` | Konten beranda | Semua user login |
| `/admin/milestones`, `/admin/core-values`, `/admin/gallery` | Tentang | Semua user login |
| `/admin/subscribers`, `/admin/hero-slider`, `/admin/pesan`, `/admin/branches`, `/admin/media`, `/admin/pengaturan`, `/admin/akun` | Operasional | Semua user login |
| `/admin/pengguna` | Pengguna | `SUPER_ADMIN` |

## 15. Dokumentasi API

### Modul publik

| Method | Path | Auth | Deskripsi |
| --- | --- | --- | --- |
| GET | `/api/health` | Tidak | Health check. |
| GET | `/api/public/services`, `/api/public/services/:slug` | Tidak | Daftar/detail layanan terbit. |
| GET | `/api/public/projects`, `/api/public/projects/:slug` | Tidak | Daftar/detail proyek terbit. |
| GET | `/api/public/projects/map`, `/api/public/projects/stats` | Tidak | Titik peta dan statistik proyek. |
| GET | `/api/public/posts`, `/api/public/posts/:slug`, `/api/public/posts/featured`, `/api/public/posts/popular` | Tidak | Artikel terbit. |
| GET | `/api/public/tags`, `/api/public/testimonials`, `/api/public/team` | Tidak | Tag, testimoni, dan tim. |
| GET | `/api/public/categories`, `/api/public/faqs`, `/api/public/partners`, `/api/public/certificates` | Tidak | Kategori, FAQ, dan konten publik. |
| GET | `/api/public/features`, `/api/public/process-steps`, `/api/public/before-after`, `/api/public/estimate-prices` | Tidak | Konten beranda. |
| GET | `/api/public/milestones`, `/core-values`, `/gallery`, `/branches` | Tidak | Konten Tentang dan kantor. |
| GET | `/api/public/hero-slides` | Tidak | Slide hero aktif. |
| GET | `/api/public/service-packages?serviceId=` | Tidak | Paket per layanan. |
| GET | `/api/public/settings` | Tidak | Settings publik yang tidak sensitif. |
| POST | `/api/public/subscribe` | Rate limit dasar | Subscriber newsletter. |
| POST | `/api/public/messages` | 5/jam/IP | Pesan konsultasi, honeypot, ticket. |
| POST | `/api/public/messages/attachments` | 5/jam/IP | Lampiran JPG/PNG/WebP/PDF. |

### Modul admin

| Prefix | Method umum | Auth/role | Deskripsi |
| --- | --- | --- | --- |
| `/api/admin/categories` | GET, GET `/:id`, POST, PUT, DELETE | Login | Kategori. |
| `/api/admin/dashboard` | GET | Login | Statistik dashboard. |
| `/api/admin/projects` | GET, POST, GET/PUT/DELETE `/:id`, PATCH bulk/publish/featured | Login | Proyek. |
| `/api/admin/services` | GET, POST, GET/PUT/DELETE `/:id`, PATCH reorder | Login | Layanan. |
| `/api/admin/service-scopes` | GET, POST, GET/PUT/DELETE `/:id`, PATCH reorder | Login | Scope layanan. |
| `/api/admin/service-packages` | GET, POST, GET/PUT/DELETE `/:id`, PATCH reorder | Login | Paket layanan. |
| `/api/admin/hero-slides` | GET, POST, GET/PUT/DELETE `/:id` | Login | Slide hero. |
| `/api/admin/posts` | GET, POST, GET/PUT/DELETE `/:id`, PATCH bulk/publish | Login | Artikel. |
| `/api/admin/tags` | GET, POST, PUT/DELETE `/:id` | Login | Tag. |
| `/api/admin/testimonials`, `/api/admin/team`, `/api/admin/partners`, `/api/admin/certificates` | CRUD + reorder/publish sesuai modul | Login | Konten profil. |
| `/api/admin/faqs`, `/api/admin/features`, `/api/admin/process-steps`, `/api/admin/before-after` | CRUD + reorder | Login | Konten beranda. |
| `/api/admin/estimate-prices`, `/api/admin/milestones`, `/api/admin/core-values`, `/api/admin/gallery` | CRUD + reorder bila tersedia | Login | Kalkulator/Tentang. |
| `/api/admin/branches` | GET, POST, GET/PUT/DELETE `/:id` | Login | Cabang dan kantor utama. |
| `/api/admin/messages` | GET, GET `/:id`, PATCH, PATCH `/:id/read`, DELETE, GET `/export`, GET `/unread-count` | Login | Pesan masuk, status, catatan, CSV. |
| `/api/admin/settings` | GET, PUT | Login | Site settings. |
| `/api/admin/subscribers` | GET | Login | Subscriber. |

Endpoint operasional di luar prefix admin:

| Prefix | Method | Role |
| --- | --- | --- |
| `/api/auth` | POST login/logout, GET me, PUT change-password | Login hanya untuk endpoint yang membutuhkan sesi |
| `/api/users` | GET, POST, PUT, PATCH status, DELETE | `SUPER_ADMIN` |
| `/api/media` | POST upload, GET list, DELETE | Semua user login |

### Format respons

```json
{
  "success": true,
  "data": [],
  "meta": { "total": 6, "page": 1, "limit": 12, "totalPages": 1 }
}
```

Error:

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [{ "field": "email", "message": "Format email tidak valid" }]
}
```

Parameter umum: `page`, `limit`, `search`, `sort`, `category`, `status`, `serviceId`. Endpoint proyek publik juga memakai `year`, `service`, `featured`, `exclude`. `meta` berisi pagination; endpoint proyek publik dapat menambahkan `facets` berisi kategori, status, dan tahun.

### Contoh proyek

```bash
curl "http://localhost:4000/api/public/projects?page=1&limit=1"
```

```json
{
  "success": true,
  "data": [{
    "id": "cmvuj3kt5000efgxo7sn0bo2f",
    "title": "Perkantoran Jaya Tower",
    "slug": "perkantoran-jaya-tower",
    "location": "Jakarta Selatan",
    "year": 2025,
    "status": "ONGOING",
    "isFeatured": true,
    "category": { "name": "Gedung", "slug": "gedung" },
    "service": { "title": "Pengawasan Proyek", "slug": "pengawasan-proyek" }
  }],
  "meta": { "total": 6, "page": 1, "limit": 1, "totalPages": 6 }
}
```

Respons di atas adalah cuplikan field utama dari smoke test lokal; ID/data dapat berubah setelah seed atau editing CMS.

### Contoh pesan kontak

```bash
curl -X POST http://localhost:4000/api/public/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Dokumentasi QA","email":"qa@example.com","phone":"081234567890","subject":"Verifikasi dokumentasi","body":"Pesan uji sementara untuk verifikasi endpoint kontak.","preferredContact":"WHATSAPP","preferredTime":"PAGI","attachments":[],"website":""}'
```

```json
{
  "success": true,
  "data": { "message": "Pesan terkirim", "ticketCode": "JA-20261102-3DAA" },
  "meta": null
}
```

Respons tiket di atas berasal dari smoke test lokal dan record uji langsung dihapus setelah verifikasi.

> Dokumentasi backend yang lebih rinci ada di [`server/README.md`](server/README.md).

## 16. Autentikasi dan Otorisasi

| Modul | SUPER_ADMIN | ADMIN | EDITOR |
| --- | --- | --- | --- |
| Dashboard dan seluruh CRUD konten | Ya | Ya | Ya |
| Media | Ya | Ya | Ya |
| Pengguna | Ya | Tidak | Tidak |

Status di atas mengikuti kode backend saat ini. `users/route.js` memakai `requireRole("SUPER_ADMIN")`; route admin lain hanya memakai `requireAuth`.

Login membuat JWT 7 hari dengan payload `sub` dan `role`, lalu menyimpannya pada cookie `token` dengan `httpOnly`, `sameSite=lax`, `path=/`, dan `secure=true` hanya ketika `NODE_ENV=production`. Header `Authorization: Bearer` juga diterima middleware.

## 17. Upload, Media dan Lampiran

| Jenis | Tipe | Batas | Lokasi |
| --- | --- | --- | --- |
| Media admin | JPG, PNG, WebP | Maks. 10 file/request, 5 MB/file | `server/uploads/`, register di `Media` |
| Lampiran pesan publik | JPG, PNG, WebP, PDF | Maks. 3 file/request, 5 MB/file | `server/uploads/messages/`, disimpan sebagai JSON pada `Message.attachments` |

Media admin memakai `sharp`: gambar diputar sesuai metadata, diubah maksimal 1600 px ke WebP quality 80, dan dibuat thumbnail 480 px quality 72. Lampiran publik tidak masuk Media admin.

Untuk migrasi ke S3/Cloudinary, pertahankan kontrak URL respons, pindahkan storage adapter pada modul `media` dan `messages`, simpan key/object URL di database, lalu tambahkan lifecycle cleanup dan private access policy.

## 18. Panduan Penggunaan CMS

### Tugas umum

1. **Proyek lengkap:** buat kategori dan layanan lebih dulu, tambah proyek, isi cover, status, publish/featured, spesifikasi, koordinat, lalu galeri.
2. **Paket layanan:** buka layanan terkait, masuk ke paket, isi nama, harga, unit, fitur, CTA, publish, dan tandai popular bila perlu.
3. **Galeri:** upload media lebih dulu, tambah item galeri, pilih kategori, atur urutan, lalu publish.
4. **Beranda/Tentang:** isi settings, hero slider, mitra, sertifikat, keunggulan, process steps, milestone, nilai, dan galeri.
5. **Pesan masuk:** buka `/admin/pesan`, filter status BARU, buka detail, ubah status, tulis catatan internal, lalu gunakan WhatsApp atau ekspor CSV.
6. **Subscriber:** buka `/admin/subscribers` untuk membaca daftar email. Fitur pengiriman kampanye newsletter belum tersedia.

### Urutan pengisian situs baru

1. Settings kontak dan identitas.
2. User/admin dan role.
3. Kategori, layanan, scope, dan paket.
4. Proyek dan media.
5. Hero, keunggulan, proses, FAQ, testimoni, mitra, sertifikat.
6. Konten Tentang dan galeri.
7. Artikel dan tag.
8. Cabang kantor dan jam operasional.
9. Uji halaman publik, form kontak, sitemap, dan SEO.

## 19. Konten Awal Seed

Seed terakhir berhasil dijalankan dan melaporkan:

| Data | Jumlah seed |
| --- | ---: |
| User | 1 |
| Kategori | 8 |
| Tag artikel | 8 |
| Layanan | 4 |
| Scope layanan | 17 |
| Paket layanan | 12 |
| Proyek | 6 |
| Testimoni | 3 |
| Tim | 4 |
| Hero slide | 3 |
| Artikel | 12 |
| SiteSetting | 27 |
| Cabang | 2 |
| Mitra | 8 |
| Sertifikat | 4 |
| FAQ | 6 |
| Keunggulan | 6 |
| Langkah alur | 5 |
| Before/After | 3 |
| Harga estimasi | 4 |
| Milestone | 7 |
| Nilai perusahaan | 5 |
| Galeri | 12 |

Seed bersifat upsert. Gambar seed adalah placeholder dan wajib diganti sebelum produksi. Database development saat ini juga dapat memiliki data tambahan dari migrasi atau pengujian.

## 20. Pengujian dan Kualitas

### Perintah yang tersedia

```bash
cd client
npm run build

cd ../server
npx prisma validate
npx prisma migrate status
npm run seed
```

Tidak ada script lint/test otomatis. TODO: tambahkan Vitest/Playwright dan ESLint sebelum CI produksi.

### Checklist QA manual

- [ ] Publik: `/`, `/tentang`, `/layanan`, detail layanan, `/proyek`, detail proyek, `/artikel`, detail artikel, `/kontak`.
- [ ] Viewport 375, 768, 1024, dan 1440 px.
- [ ] Tidak ada horizontal scroll.
- [ ] Keyboard dapat mencapai nav, accordion, form, tab cabang, dan tombol upload.
- [ ] Label input dan pesan error terbaca screen reader.
- [ ] Uji form valid, invalid, network error, klik ganda, lampiran >5 MB, dan honeypot.
- [ ] Uji filter/pagination yang tersinkron URL.
- [ ] Uji Leaflet marker, fallback embed, gambar, sitemap, robots, dan JSON-LD.
- [ ] Jalankan Lighthouse mobile dan desktop.

## 21. SEO dan Performa

- Komponen `Seo` mengatur title, description, canonical, Open Graph, Twitter card, dan JSON-LD.
- JSON-LD yang digunakan: Organization/website pada halaman terkait, `Service`, `Article`, `FAQPage`, `LocalBusiness`/`GeneralContractor`, dan data konten before/after bila disediakan halaman.
- `server/src/modules/seo.js` membuat `sitemap.xml` dari halaman statis dan slug layanan, proyek, artikel yang terbit.
- `robots.txt` mengizinkan publik dan memblok `/admin` serta `/api`.
- `React.lazy` memecah bundle per halaman.
- OfficeMap dan Leaflet dimuat malas saat mendekati viewport.
- TanStack Query menyimpan cache request publik selama sesi aplikasi.
- Gambar Media admin dikompresi WebP dan memiliki thumbnail.

## 22. Deployment

### A. Docker Compose

`docker-compose.yml` tidak ditemukan di repositori. Status: **Belum tersedia / TODO**. Jangan memakai contoh compose generik tanpa menyesuaikan `DATABASE_URL`, volume upload, CORS, dan build client.

### B. VPS manual dengan Nginx, PM2, dan SSL

1. Pasang Node.js, npm, PostgreSQL, Nginx, dan PM2.
2. Clone repo dan jalankan `npm run install-all`.
3. Buat `server/.env` dan `client/.env` produksi.
4. Jalankan `npx prisma migrate deploy` dari `server/`.
5. Build client dengan `npm run build` dari `client/`.
6. Sajikan `client/dist` dari Nginx dan proxy `/api` serta `/uploads` ke Express.
7. Jalankan `npm start --prefix server` melalui PM2.
8. Pasang SSL Let's Encrypt dan redirect HTTP ke HTTPS.

Konfigurasi produksi wajib:

- `NODE_ENV=production` agar cookie secure.
- `CLIENT_URL` harus sama dengan origin frontend produksi.
- `SERVER_URL` harus menunjuk ke URL API publik.
- `SITE_URL` harus menunjuk ke domain publik.
- `JWT_SECRET` harus acak dan berbeda dari development.
- Pastikan Nginx meneruskan cookie dan header `Authorization`.

Backup PostgreSQL:

```bash
pg_dump "$DATABASE_URL" > backup.sql
psql "$DATABASE_URL" < backup.sql
```

Backup juga folder `server/uploads/` karena file tidak berada di database.

## 23. Keamanan

Yang sudah diterapkan:

- Helmet.
- CORS dengan allow-list `CLIENT_URL` dan preview origin.
- Rate limit global `/api` 300 request/15 menit/IP.
- Rate limit pesan dan lampiran publik 5 request/jam/IP.
- Validasi Zod pada body/query.
- JWT cookie httpOnly dengan bcrypt.
- Honeypot form kontak.
- Pembatasan MIME, jumlah file, dan ukuran file Multer.
- Nama upload acak UUID dan pencegahan path traversal saat delete Media.
- Password tidak dikembalikan pada respons user.

Sebelum produksi:

- Ganti `JWT_SECRET` dan `SEED_ADMIN_PASSWORD`.
- Gunakan HTTPS dan secure cookie.
- Batasi origin CORS ke domain resmi.
- Tambahkan backup otomatis dan monitoring.
- Audit dependency dan aktifkan lint/test/CI.
- Pindahkan upload ke object storage bila multi-instance.
- Hapus atau ganti data placeholder.

## 24. Pemecahan Masalah

| Masalah | Solusi |
| --- | --- |
| PostgreSQL connection refused | Periksa service PostgreSQL, `DATABASE_URL`, port, user, dan database. |
| Migration gagal atau drift | Jalankan `npx prisma migrate status`; backup lalu gunakan `migrate dev` hanya di development. Jangan reset production. |
| Cookie/CORS tidak terkirim | Samakan origin dengan `CLIENT_URL`, gunakan `withCredentials`, cek `sameSite`/HTTPS. |
| Port 4000/5173 bentrok | Hentikan proses lama atau ubah `PORT`/konfigurasi Vite dan sesuaikan `VITE_API_URL`. |
| Upload gagal | Pastikan field multipart bernama `files`, MIME dan ukuran sesuai batas. |
| Gambar tidak tampil | Cek `SERVER_URL`, path `/uploads`, file fisik, dan konfigurasi static Express. |
| Peta Leaflet blank | Pastikan koordinat numerik, koneksi tile OSM, CSS Leaflet, dan asset marker terbundel. |
| Marker Leaflet hilang | Pastikan `marker-icon.png`, `marker-icon-2x.png`, dan `marker-shadow.png` tetap di-import. |
| Filter/pagination tidak sinkron URL | Periksa query key `q`, `kategori`, `tag`, `halaman`, `page`, `limit` dan jangan menghapus parameter saat navigasi. |
| Seed gagal karena data ada | Seed menggunakan upsert; periksa constraint unik dan jalankan pada schema yang sudah migrated. |
| Login ditolak setelah seed | Pastikan `SEED_ADMIN_PASSWORD` diisi sebelum seed dan akun aktif. |
| Ikon ekstensi browser menimpa tombol WhatsApp | Uji incognito/extension off; jangan menyimpulkan masalah dari overlay ekstensi. |
| JSON-LD tidak terlihat di DOM awal | Periksa Helmet setelah data async selesai dan gunakan Rich Results Test. |
| Contact form rate-limited | Tunggu window rate limit atau restart hanya pada development; jangan menghapus limiter production. |

## 25. Roadmap

Fitur yang belum tersedia di kode saat dokumentasi ini dibuat:

- [ ] `docker-compose.yml` untuk PostgreSQL, server, dan client.
- [ ] Script `lint` dan `test` di package manifest.
- [ ] Test otomatis unit/integrasi/E2E.
- [ ] Pengiriman newsletter dari subscriber.
- [ ] Adapter upload S3/Cloudinary.
- [ ] Pembatasan role granular untuk modul selain Pengguna.
- [ ] File `LICENSE` resmi.
- [ ] CI/CD dan deployment manifest.

Modul CRUD yang diminta pada CMS sudah tersedia. Modul yang tidak ditemukan dan karena itu ditandai TODO: Docker Compose, newsletter campaign, storage cloud, granular role policy, automated test/lint, dan lisensi resmi.

## 26. Kontribusi

1. Buat branch fitur dari `main`, misalnya `feat/contact-faq`.
2. Ikuti Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
3. Jangan menyimpan `.env`, password, token, atau data pribadi.
4. Pertahankan komentar singkat berbahasa Indonesia dan nama route/model sesuai kode.
5. Jalankan build, syntax check, dan migration status yang relevan sebelum PR.
6. Untuk modul CRUD baru, ikuti pola `server/src/modules/categories/`: `route.js`, `controller.js`, `service.js`, `validation.js`, lalu mount di `server/src/app.js`.
7. Tambahkan halaman admin lazy-loaded, nav sidebar, invalidation query, dan dokumentasi API.

## 27. Changelog Ringkas

Riwayat git yang tersedia:

- `1d79213` — first commit dan fondasi proyek.
- `fe562ad` — pengayaan halaman beranda, layanan, blog, dan artikel.
- `33fa114` — pengayaan halaman kontak.

Tahap fitur yang telah selesai di working tree:

- Sistem: monorepo, Express, Prisma, PostgreSQL, auth JWT cookie, validasi, upload, seed.
- Admin: design system, layout, dashboard, CRUD konten, pesan, cabang, media, settings.
- Publik: beranda, Tentang, layanan, proyek, blog/artikel, kontak.
- Pengayaan: form konsultasi tiga langkah, OfficeMap, WhatNext, ContactFaq, ContactCta, JSON-LD.
- Finishing: Reveal, skeleton, responsive viewport QA, rate limit, status pesan, ekspor CSV.

## 28. Lisensi dan Kontak

Lisensi resmi **belum ditentukan**. Sampai file `LICENSE` ditambahkan, semua hak atas kode dan konten tetap pada pemilik proyek.

Kontak aplikasi mengambil nilai dari `SiteSetting` dan `Branch`. Untuk development seed, identitas kontak dapat dilihat di database setelah `npm run seed`; rahasia tidak ditulis di README.

### TODO, asumsi, dan keterbatasan dokumentasi

- `docker-compose.yml` tidak ditemukan.
- Tidak ada script lint/test otomatis.
- Tidak ada `LICENSE` resmi.
- Tidak ada CI/CD.
- `DATABASE_URL_POOLED` ada di contoh env tetapi tidak dipakai langsung oleh kode runtime.
- Sebagian JSON-LD bersifat kondisional setelah data async tersedia.
- Angka endpoint dihitung dari deklarasi route aktual; route dynamic seperti `/:id` dihitung satu endpoint pattern.
- `projectImage` tidak dibuat oleh seed saat ini; seed hanya membuat proyek utama.
