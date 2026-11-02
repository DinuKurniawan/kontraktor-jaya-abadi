# Kontribusi

## Alur kerja

1. Buat branch dari `main`: `feat/nama-fitur`, `fix/nama-bug`, atau `docs/nama-dokumen`.
2. Baca kode dan pola modul yang sudah ada sebelum mengubah file.
3. Kerjakan perubahan kecil yang dapat diverifikasi.
4. Jalankan `npm run build` dari `client/` dan check server yang relevan.
5. Buat commit dengan Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, atau `chore:`.
6. Buat pull request dengan ringkasan, file yang berubah, dan hasil verifikasi.

## Standar kode

- UI dan komentar mengikuti bahasa Indonesia yang sudah dipakai proyek.
- Jangan commit `.env`, secret, password, token, atau file upload pribadi.
- Pertahankan struktur frontend `components/public`, `components/admin`, dan `components/ui`.
- Modul backend baru mengikuti `server/src/modules/categories/`: `route.js`, `controller.js`, `service.js`, dan `validation.js`.
- Endpoint baru harus memakai format respons standar dan validasi Zod.
- Perubahan schema harus disertai migration Prisma.

## Catatan pemeriksaan

Manifest saat ini belum menyediakan script lint atau test otomatis. Jalankan build client, `node --check` untuk file server yang berubah, `npx prisma validate`, dan `git diff --check` sebelum mengirim PR.
