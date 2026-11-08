# Baseline Lighthouse — `/`

Tanggal: 8 November 2026  
Kondisi: production build lokal (`client/`), `vite preview` di `http://localhost:4173/`, API lokal `http://localhost:4000/api` dengan database proyek. Tidak ada kode aplikasi diubah.

Lighthouse CLI: `13.0.3` (`npx lighthouse`). JSON mentah disimpan di luar repo:

- `C:\Users\Pongo\AppData\Local\Temp\antigravity\lighthouse-mobile.json`
- `C:\Users\Pongo\AppData\Local\Temp\antigravity\lighthouse-desktop.json`

> API produksi `https://server-two-data-88.vercel.app` membalas HTTP 404 pada `/`, `/api/health`, dan endpoint publik yang diuji. Baseline memakai server lokal agar konten nyata termuat.

## Skor

| Profil | Performance | Accessibility | Best Practices | SEO | Agentic browsing |
| --- | ---: | ---: | ---: | ---: | --- |
| Mobile | 44 | 91 | 96 | 100 | Tidak tersedia |
| Desktop | 88 | 91 | 96 | 100 | Tidak tersedia |

Lighthouse CLI 13.0.3 hanya mengekspos kategori `performance`, `accessibility`, `best-practices`, dan `seo`; kategori/audit `agentic-browsing` tidak tersedia. Karena itu tidak ada skor maupun audit agentic-browsing untuk baseline ini.

## Metrik performa

| Profil | FCP | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 3.1 s | 6.5 s | 260 ms | 0.425 | 4.8 s |
| Desktop | 0.8 s | 1.1 s | 0 ms | 0.187 | 1.0 s |

## Best Practices — gagal/warning

### `errors-in-console` — gagal, skor 0

Sama pada mobile dan desktop.

- Penyebab: `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
- URL: `http://localhost:4000/api/auth/me`
- Elemen DOM: tidak ada; kegagalan request jaringan.

## Agentic browsing — gagal/warning

Tidak ada. Versi Lighthouse yang dipakai tidak mendukung kategori maupun audit tersebut.

## Elemen penyebab layout shift

### Mobile — total CLS insight: `0.4251816820114681`

| Skor shift | Elemen | Detail |
| ---: | --- | --- |
| 0.4251816820114681 | `section.relative > div.relative > div.grid > div.relative` | `<div class="relative mx-auto w-full max-w-lg">`; konten: `20+ tahun pengalaman`, `200+ proyek selesai` |

### Desktop — total CLS insight: `0.1867967099307793`

| Skor shift | Elemen | Detail/penyebab |
| ---: | --- | --- |
| 0.1711595101136131 | `div#root > div.min-h-screen > main.pt-16 > section.bg-ink` | `<section class="bg-ink">`; penyebab: web font `https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yygg_vb.woff2` |
| 0.01506536623626396 | `section.relative > div.relative > div.grid > div.relative` | `<div class="relative mx-auto w-full max-w-lg">`; konten: `20+ tahun pengalaman`, `200+ proyek selesai` |
| 0.00007760798643101813 | `div.mx-auto > div.grid > div.flex > p.font-jakarta` | `<p class="font-jakarta text-4xl font-extrabold text-brand sm:text-5xl">`; konten: `150+` |
| 0.00007760798643101813 | `div.mx-auto > div.grid > div.flex > p.font-jakarta` | Elemen `150+` yang sama, kejadian shift terpisah |
| 0.00004716716463970599 | `div.mx-auto > div.grid > div.flex > p.font-jakarta` | Elemen `150+` yang sama, kejadian shift terpisah |

## Catatan accessibility terukur

Bukan target daftar audit langkah ini, tetapi menjelaskan skor Accessibility 91:

- `aria-prohibited-attr`: `div.flex.gap-0.5[aria-label="Rata-rata 4.7 dari 5"]`.
- `color-contrast`: 50 elemen mobile, 52 desktop; pola utama `text-brand`, `text-ink-light`, tombol `bg-brand text-white`, tombol WhatsApp, dan opsi wizard.
- `target-size`: 6 elemen mobile, 5 desktop; indikator slide Hero serta indikator ulasan berukuran tinggi 8 px.

## Validasi build

`npm run build` di `client/`: sukses. Tidak ada error atau warning build baru.
