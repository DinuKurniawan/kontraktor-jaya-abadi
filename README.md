# Jaya Abadi — Company Profile & CMS

Website company profile kontraktor Jaya Abadi beserta CMS admin untuk mengelola layanan, proyek, artikel, media, pesan konsultasi, cabang, dan konten pendukung.

> Status: aplikasi aktif dalam pengembangan. `LICENSE`, automated test suite, lint script, dan Docker Compose belum tersedia.

## Fitur

### Website publik

- Beranda: hero slider, statistik, layanan, keunggulan, alur kerja, before/after, testimoni, mitra, estimator biaya.
- Tentang: profil, sejarah, visi-misi, nilai, tim, sertifikat, dan galeri.
- Layanan: daftar, pencarian/filter, detail, scope, paket harga, FAQ, proses, dan proyek terkait.
- Proyek: filter, pencarian, pagination, tampilan grid/daftar/peta, statistik, galeri, dan detail proyek.
- Artikel: featured article, kategori/tag, pencarian, pagination, artikel populer, reading progress, daftar isi, share, dan SEO JSON-LD.
- Kontak: form konsultasi tiga langkah, validasi, honeypot, rate limit, upload lampiran, nomor tiket, WhatsApp, dan peta kantor.
- SEO: meta tag, canonical, Open Graph, Twitter Card, JSON-LD, `sitemap.xml`, dan `robots.txt`.
- UX: responsive layout, lazy loading, skeleton, toast, modal, pagination, dan aksesibilitas dasar.

### CMS admin

CMS berada di `/admin` dan memerlukan login. Modul tersedia:

- Dashboard dan notifikasi pesan real-time.
- Proyek, layanan, scope layanan, paket layanan.
- Kategori, artikel, tag, testimoni, tim.
- Hero slider, mitra, sertifikat, FAQ, keunggulan, process step.
- Before/after, harga estimasi, milestone, core value, galeri.
- Cabang, pesan masuk, subscriber, media, pengaturan situs.
- Pengguna CMS; akses modul pengguna dibatasi untuk `SUPER_ADMIN`.

CRUD admin lain saat ini memakai autentikasi login; pembatasan role granular belum diterapkan.

## Arsitektur

```text
Browser
  └─ React + Vite SPA
      └─ Axios / TanStack Query
          └─ Express REST API
              ├─ /api/public/*
              ├─ /api/auth/*
              ├─ /api/admin/*
              ├─ /api/users/*
              ├─ /api/media/*
              └─ /api/realtime/stream (SSE)
                  └─ Prisma
                      └─ PostgreSQL
```

Backend memakai pola:

```text
route.js → controller.js → service.js → validation.js → Prisma
```

Perubahan data admin/publik dipancarkan melalui Server-Sent Events. Client menerima event melalui `client/src/hooks/useRealtime.js`, lalu meng-invalidasi query TanStack Query terkait.

## Tech stack

| Area | Teknologi |
| --- | --- |
| Runtime | Node.js 20+ |
| Frontend | React 19, Vite 8, React Router 7 |
| Styling | Tailwind CSS 4 |
| Data | TanStack Query 5, Axios |
| Form | React Hook Form, Zod |
| Map | Leaflet, React Leaflet, OpenStreetMap |
| Backend | Express 5, ESM |
| Database | PostgreSQL, Prisma 6 |
| Auth | JWT cookie httpOnly, bcrypt |
| Upload | Multer, sharp, WebP thumbnail |
| Security | Helmet, CORS, express-rate-limit |
| Quality tools | Playwright, Lighthouse, axe-core |

Versi dependency lengkap berada di `package.json`, `client/package.json`, dan `server/package.json`.

## Struktur folder

```text
.
├── client/
│   ├── public/
│   └── src/
│       ├── components/       # UI, publik, dan admin
│       ├── context/          # AuthContext
│       ├── hooks/            # hook UI, query, realtime
│       ├── lib/              # Axios dan helper
│       ├── pages/public/     # halaman publik
│       ├── pages/admin/      # halaman CMS
│       ├── routes/           # ProtectedRoute, RoleRoute
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── prisma/               # schema, migration, seed
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/          # domain REST
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/
│   └── requests.http
├── docs/
├── scripts/                  # audit dan prerender publik
├── CONTRIBUTING.md
├── PRD.md
└── package.json
```

## Prasyarat

- Node.js 20 atau lebih baru.
- npm.
- PostgreSQL.
- Git.

Docker Compose belum disediakan.

## Instalasi lokal

### 1. Install dependency

```bash
npm run install-all
```

Setara dengan:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Siapkan environment

Buat `server/.env` dan `client/.env` secara manual. File `.env.example` belum tersedia.

`server/.env` minimal:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/jayaabadi
JWT_SECRET=ganti-dengan-secret-acak-minimal-32-karakter
CLIENT_URL=http://localhost:5173
PORT=4000
SERVER_URL=http://localhost:4000
SITE_URL=http://localhost:5173
SEED_ADMIN_PASSWORD=ganti-dengan-password-kuat
NODE_ENV=development
```

`client/.env` minimal:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SITE_URL=http://localhost:5173
VITE_WA_NUMBER=6281234567890
```

`DATABASE_URL_POOLED` dapat ditambahkan untuk kebutuhan deployment, tetapi tidak dibaca langsung oleh runtime saat ini.

### 3. Buat database dan jalankan migration

```bash
createdb -U postgres jayaabadi
cd server
npx prisma validate
npx prisma migrate dev
npx prisma generate
npm run seed
cd ..
```

Seed bersifat idempoten. Akun awal memakai email `admin@jayaabadi.co.id`; password berasal dari `SEED_ADMIN_PASSWORD`.

### 4. Jalankan aplikasi

```bash
npm run dev
```

URL lokal:

| Area | URL |
| --- | --- |
| Publik | http://localhost:5173 |
| Login admin | http://localhost:5173/admin/login |
| API health | http://localhost:4000/api/health |
| Sitemap | http://localhost:4000/sitemap.xml |
| Robots | http://localhost:4000/robots.txt |

## Script

### Root

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan client dan server bersamaan |
| `npm run install-all` | Install dependency root, server, client |
| `npm run build` | Build client |
| `npm run audit:public` | Build lalu audit halaman publik |
| `npm run prerender:public` | Build lalu prerender halaman publik |

### Client

```bash
npm run dev
npm run build
npm run preview
```

### Server

```bash
npm run dev
npm start
npm run seed
npm run test:sanitize
npm run services:normalize-images
npm run db:prod:update
```

Prisma:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma migrate status
```

## Route frontend

### Publik

| Path | Halaman |
| --- | --- |
| `/` | Beranda |
| `/tentang` | Tentang |
| `/layanan` | Daftar layanan |
| `/layanan/:slug` | Detail layanan |
| `/proyek` | Daftar proyek |
| `/proyek/:slug` | Detail proyek |
| `/artikel` | Daftar artikel |
| `/artikel/:slug` | Detail artikel |
| `/kontak` | Kontak dan konsultasi |

### Admin

| Path | Fungsi |
| --- | --- |
| `/admin/login` | Login |
| `/admin` | Dashboard |
| `/admin/proyek` | Proyek |
| `/admin/layanan` | Layanan dan paket |
| `/admin/artikel`, `/admin/posts` | Artikel |
| `/admin/kategori`, `/admin/tags` | Kategori dan tag |
| `/admin/testimoni`, `/admin/tim` | Testimoni dan tim |
| `/admin/partners`, `/admin/certificates` | Mitra dan sertifikat |
| `/admin/faqs`, `/admin/features` | FAQ dan keunggulan |
| `/admin/process-steps`, `/admin/before-after` | Proses dan before/after |
| `/admin/estimate-prices` | Harga estimasi |
| `/admin/milestones`, `/admin/core-values`, `/admin/gallery` | Konten Tentang |
| `/admin/branches`, `/admin/pesan` | Cabang dan pesan |
| `/admin/subscribers`, `/admin/media`, `/admin/pengaturan` | Operasional |
| `/admin/pengguna`, `/admin/akun` | Pengguna dan akun |

## API utama

### Publik

```text
GET  /api/health
GET  /api/public/services[/:slug]
GET  /api/public/projects[/:slug]
GET  /api/public/projects/map
GET  /api/public/projects/stats
GET  /api/public/posts[/:slug]
GET  /api/public/posts/featured
GET  /api/public/posts/popular
GET  /api/public/categories
GET  /api/public/tags
GET  /api/public/testimonials
GET  /api/public/team
GET  /api/public/faqs
GET  /api/public/branches
GET  /api/public/settings
POST /api/public/subscribe
POST /api/public/messages
POST /api/public/messages/attachments
GET  /api/realtime/stream
```

### Auth dan operasional

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/change-password
GET/POST/PUT/PATCH/DELETE /api/users/*
GET/POST/DELETE /api/media/*
```

### Admin

Prefix utama: `/api/admin/`. Modul mencakup `dashboard`, `projects`, `services`, `service-scopes`, `service-packages`, `categories`, `posts`, `tags`, `testimonials`, `team`, `hero-slides`, `partners`, `certificates`, `faqs`, `features`, `process-steps`, `before-after`, `estimate-prices`, `milestones`, `core-values`, `gallery`, `branches`, `messages`, `subscribers`, dan `settings`.

Respons standar:

```json
{
  "success": true,
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

Error standar:

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": []
}
```

Detail endpoint dan contoh request tersedia di `server/requests.http` serta `server/README.md`.

## Database

Prisma schema berada di `server/prisma/schema.prisma`. Domain utama:

- User, role, auth.
- Category, project, project image.
- Service, scope, package, process, FAQ.
- Post, tag, testimonial.
- Hero, feature, partner, certificate.
- Milestone, core value, team, gallery.
- Branch, message, subscriber, site setting.
- Estimate price, before/after, media.

Enum penting: `Role`, `CategoryType`, `ProjectStatus`, `MessageStatus`, `TeamDepartment`, `GalleryCategory`, dan `BuildingType`.

Migration produksi harus memakai:

```bash
cd server
npx prisma migrate deploy
```

Jangan menjalankan `prisma db push` atau `prisma migrate reset` pada database berisi data penting. Migration juga memiliki partial unique index `branches_one_main_idx` untuk memastikan hanya satu cabang menjadi kantor utama.

## Auth, upload, dan keamanan

- JWT berlaku 7 hari.
- Token disimpan pada cookie `httpOnly`; `secure` aktif saat `NODE_ENV=production`.
- Header `Authorization: Bearer` juga didukung.
- Password di-hash dengan bcrypt dan tidak dikirim dalam respons.
- CORS memakai `CLIENT_URL`.
- Helmet aktif.
- Rate limit global API: 300 request/15 menit/IP.
- Pesan dan lampiran publik: 5 request/jam/IP.
- Validasi body/query memakai Zod.
- Honeypot tersedia pada form kontak.
- Media admin: maksimal 10 file, 5 MB/file, JPG/PNG/WebP.
- Lampiran pesan: maksimal 3 file, 5 MB/file, JPG/PNG/WebP/PDF.
- Gambar media diproses sharp menjadi WebP dan thumbnail.
- File disimpan di `server/uploads/`; folder tersebut wajib dibackup atau dipindahkan ke object storage untuk deployment multi-instance.

## Deployment

Deployment yang didukung saat ini adalah VPS/manual:

1. Pasang Node.js, npm, PostgreSQL, Nginx, dan PM2.
2. Install dependency.
3. Isi environment produksi.
4. Jalankan `npx prisma migrate deploy` dari `server/`.
5. Jalankan `npm run build` dari `client/`.
6. Sajikan `client/dist` melalui Nginx.
7. Proxy `/api` dan `/uploads` ke Express.
8. Jalankan `npm start --prefix server` melalui PM2.
9. Aktifkan HTTPS.

Produksi wajib memakai `NODE_ENV=production`, `JWT_SECRET` baru, `CLIENT_URL` yang tepat, HTTPS, backup PostgreSQL, dan backup `server/uploads/`.

Contoh backup:

```bash
pg_dump "$DATABASE_URL" > backup.sql
psql "$DATABASE_URL" < backup.sql
```

## Verifikasi sebelum commit/deploy

```bash
npm run build
cd server
npx prisma validate
npx prisma migrate status
npm run test:sanitize
```

Checklist manual:

- Uji semua halaman publik dan route detail.
- Uji login, logout, perubahan password, dan role `SUPER_ADMIN`.
- Uji CRUD admin, upload, pagination, filter, dan status publish.
- Uji form kontak valid/invalid, rate limit, honeypot, dan lampiran.
- Uji SSE serta notifikasi pesan tanpa reload.
- Uji viewport 375, 768, 1024, dan 1440 px.
- Jalankan audit publik/Lighthouse.
- Periksa sitemap, robots, canonical, dan JSON-LD.

## Pengembangan modul backend

Buat empat file:

```text
server/src/modules/<feature>/
├── route.js
├── controller.js
├── service.js
└── validation.js
```

Lalu mount router di `server/src/app.js`, tambahkan contoh request di `server/requests.http`, dan pertahankan format respons/error yang sudah ada. Baca `server/README.md` sebelum menambah modul.

## Batasan dan roadmap

- [ ] Docker Compose.
- [ ] ESLint dan test runner menyeluruh.
- [ ] Unit, integration, dan E2E test.
- [ ] CI/CD.
- [ ] Campaign newsletter.
- [ ] Storage adapter S3/Cloudinary.
- [ ] Role permission granular di luar modul pengguna.
- [ ] License resmi.
- [ ] Penggantian seluruh gambar placeholder sebelum produksi.

## Kontribusi

1. Buat branch fitur dari `main`.
2. Gunakan Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
3. Jangan commit `.env`, password, token, backup, atau data pribadi.
4. Jalankan build, validasi Prisma, dan test yang relevan.
5. Ikuti panduan pada `CONTRIBUTING.md`.

## Referensi

- `PRD.md` — requirement proyek.
- `CONTRIBUTING.md` — aturan kontribusi.
- `server/README.md` — pola backend dan migration.
- `docs/performance-baseline.md` — baseline performa.
- `docs/screenshots/README.md` — dokumentasi screenshot.

## Lisensi

Lisensi resmi belum ditentukan. Sampai file `LICENSE` ditambahkan, kode dan konten tetap menjadi hak pemilik proyek.
