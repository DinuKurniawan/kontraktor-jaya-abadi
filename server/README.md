# Panduan Backend — Pola Modul Fitur

Setiap modul fitur mengikuti pola yang sama persis dengan modul `categories`
(`server/src/modules/categories/`). Gunakan pola ini untuk modul
`projects`, `services`, `posts`, `testimonials`, `teamMembers`, `heroSlides`,
`messages`, `siteSettings`, dan lainnya.

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
