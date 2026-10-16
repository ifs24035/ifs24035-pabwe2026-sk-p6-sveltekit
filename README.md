# ifs24035-pabwe2026-sk-p6-sveltekit — Delcom Courses

Aplikasi **Delcom Courses** (Praktikum 6 PABWE 2026 — SvelteKit + TypeScript). Pengguna dapat membuat kursus,
mengunggah sampul, menambah konten video YouTube, bergabung sebagai peserta, memberi rating, dan menandai
progres belajar. Data berasal dari <https://open-api.delcom.org/docs/1.0/api-courses>.

**Teknologi:** SvelteKit, Svelte 5, TypeScript, Tailwind CSS 4, `adapter-bun`, Vitest + Testing Library.

## Konfigurasi

Berkas `.env` (contoh ada di `.env.example`):

```env
VITE_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
APP_PORT=3005
```

## Menjalankan

```bash
bun install

# Pengembangan -> http://localhost:3005
bun run dev

# Produksi
bun run build
bun start

# Pengujian
bun run test
bun run test:coverage   # threshold 100% (lines, functions, branches, statements)
```

## Struktur `src/`

```
src/
├── helpers/            apiHelper, toolsHelper, youtubeHelper
├── hooks/              useInput
├── features/
│   ├── auth/           login, register, authStore, AuthSessionRedirect
│   ├── users/          daftar pengguna, profil, foto, kata sandi
│   ├── common/         NotFoundPage
│   └── courses/
│       ├── api/        courseApi.ts
│       ├── states/     coursesStore.ts
│       ├── layouts/    CourseLayout.svelte
│       ├── components/ NavbarComponent, SidebarComponent
│       ├── modals/     AddModal, ChangeModal, ChangeCoverModal, ContentModal
│       └── pages/      HomePage, DetailPage, ContentPage
└── routes/
    ├── +layout.svelte, +page.svelte, +error.svelte
    ├── auth/login, auth/register, users, profile
    └── courses/[courseId]  (+ /contents/[contentId])
```

## Aturan peran pada kursus

- **Pemilik**: pengguna yang `user_id` kursusnya sama dengan id profil.
- **Peserta**: pengguna yang id-nya ada di `students`.
- Jika keduanya terpenuhi, antarmuka **pemilik** ditampilkan lebih dulu.
