# Panduan Backend — Pola Modul Fitur

Setiap modul fitur mengikuti pola yang sama persis dengan modul `categories`
(`server/src/modules/categories/`). Gunakan pola ini untuk modul
`projects`, `services`, `posts`, `testimonials`, `teamMembers`, `heroSlides`,
`messages`, `siteSettings`, dan lainnya.

## Database dan migration

Proyek baru ini memakai PostgreSQL melalui Prisma. Riwayat migration saat ini
terdiri dari satu migration bernama `init` di `server/prisma/migrations/`.

Migration aktif adalah `20261103045625_init`. Bagian paling bawah
`migration.sql` berisi SQL manual berikut:

| Objek | Tujuan | Dampak bila hilang |
| --- | --- | --- |
| `branches_one_main_idx` | Unique partial index pada `branches("isMain")` dengan predikat `WHERE "isMain" = true`. | Database tidak lagi menjamin hanya satu kantor utama. |

SQL manual ditandai dengan komentar `-- Custom SQL`. Jangan menghapus atau
mengganti bagian tersebut ketika meninjau hasil Prisma.

```powershell
# Validasi schema dan status database
npx prisma validate
npx prisma migrate status

# Buat dan terapkan migration baru saat development
npx prisma migrate dev --name add_nama_perubahan

# Isi data awal setelah reset database development
npm run seed
```

Untuk perubahan setelah proyek berjalan di produksi, gunakan awalan kata kerja
yang jelas: `add_` untuk menambah, `rename_`, `drop_`, atau `alter_`. Selama
pengembangan awal sebelum rilis pertama, gabungkan perubahan schema ke `init`
dengan prosedur squash migration. Jangan menjalankan `db push` atau
`migrate reset` pada database produksi. `db push` tidak mengenal SQL manual,
sehingga partial index kantor utama dapat hilang.

### Squash sebelum rilis pertama

Jika schema berubah sebelum rilis pertama, backup migration lama, hapus semua
folder migration selain `migration_lock.toml`, reset database lokal, lalu:

```powershell
npx prisma migrate dev --create-only --name init
# Tambahkan kembali SQL manual di bagian bawah migration.sql.
npx prisma migrate dev
npx prisma migrate status
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url postgresql://USER:PASSWORD@localhost:5432/jayaabadi_shadow
```

Diff harus kosong. Setelah rilis, buat migration baru dan jangan mengubah
migration lama. Untuk database yang sudah memiliki schema yang sama, baseline
dapat dicatat dengan:

```powershell
npx prisma migrate resolve --applied 20261103045625_init
```

Perintah tersebut bukan pengganti verifikasi schema. `server/prisma/migrations_backup/`
dan `server/prisma/backup.sql` hanya cadangan lokal sementara, di-ignore Git,
tidak boleh dibagikan, dan dihapus setelah semuanya normal. `backup.sql` dapat
berisi data lokal.

## Struktur file

```
server/src/modules/<fitur>/
├── route.js        # Definisi endpoint + middleware (validate, requireAuth, requireRole)
├── controller.js   # Handler HTTP: terima req → panggil service → kirim respons
├── service.js      # Logika bisnis + akses Prisma + lempar ApiError
└── validation.js   # Schema Zod untuk body & query
```

## Konvensi endpoint

| Area   | Prefix                  | Auth                          |
| ------ | ----------------------- | ----------------------------- |
| Admin  | `/api/admin/<fitur>`    | `requireAuth` (+ `requireRole` bila perlu) |
| Publik | `/api/public/<fitur>`   | tanpa login                   |
| Sesi   | `/api/auth/*`           | publik / login                |

Endpoint admin standar: `GET /` (list, paginasi+search+filter), `GET /:id`,
`POST /`, `PUT /:id`, `DELETE /:id` (tolak `400` bila masih dipakai data lain).

## Penerimaan request

- **Body** → `validate(createSchema)` (parameter `validate(schema)`, default `req.body`).
- **Query** (filter/paginasi) → `validateQuery(listQuerySchema)`; key asing diabaikan Zod.
- Schema update selalu `.partial()` / semua field-nya optional, plus
  `refine` untuk menolak body kosong.
- ID route param dari `req.params.id`; ID tidak valid otomatis jadi `404`
  lewat `errorHandler` (Prisma `P2023`).

## Respons

- Sukses → `sendSuccess(res, { data, meta, status })` →
  `{ success: true, data, meta }` (meta = paginasi / info token).
- Error → `next(new ApiError(status, message, errors))` →
  `{ success: false, message, errors }`.
- Async handler selalu dibungkus `asyncHandler(...)`.

## Paginasi & pencarian

```js
const { page, limit, skip, where } = paginate(req.query, { searchFields: ["title", "summary"] });
// where.OR (search) bisa digabung filter lain: where.status = req.query.status
const [rows, total] = await prisma.$transaction([
  prisma.<model>.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
  prisma.<model>.count({ where }),
]);
meta = paginationMeta(total, page, limit); // → { total, page, limit, totalPages }
```

Query: `?page=1&limit=10&search=kata&type=PROJECT` (default 10, maks 50).

## Slug otomatis

Field `slug` unik dibuat dari nama/judul via helper util:

```js
import { slugifyUnique } from "../../utils/slugify.js";
const slug = await slugifyUnique({ model: "project", text: title, excludeId: undefined });
// saat update: kirim excludeId agar slug yang sama milik record ini tidak dihitung bentrok
```

Bentrok otomatis diberi suffix `-2`, `-3`, dst.

## Aturan penting

- Password/field sensitif tidak pernah masuk respons — pakai `select`/destructuring.
- Relasi wajib dijaga: sebelum delete, hitung pemakaian lewat
  `prisma.<relasi>.count({ where: ... })` dan tolak dengan `ApiError(400, ...)`
  bila masih dipakai.
- File upload mengikuti pola modul `media` (`uploadMedia` wrapper di atas multer,
  URL relatif `/uploads/...` di DB, URL absolut via `SERVER_URL` di respons).

## Checklist modul baru

1. Buat folder `modules/<fitur>/` dengan 4 file: `route.js`, `controller.js`, `service.js`, `validation.js`.
2. `route.js`: default export = router admin; `export const publicRouter` = router publik (jika ada).
3. Pasang di `app.js`: `api.use("/admin/<fitur>", router)` dan `api.use("/public/<fitur>", publicRouter)`.
4. Tampilkan bagian baru di `server/requests.http` (akan menjadi dokumentasi hidup).
5. Tes cepat: login → list (paginasi+search+filter) → detail → create (cek slug) → update (slug regenerasi) → delete yang masih dipakai → 400 → delete yang bebas → 200.
