# Peta Jalan Pengembangan (Project Roadmap)
## KaryaGuard — Secure HRIS, Geofenced Attendance & Payroll System

> **Tujuan**: Panduan eksekusi bertahap (*step-by-step execution*) agar proses pengerjaan terstruktur, minim kendala (*zero blockers*), dan riwayat commit Git mencerminkan standar rekayasa perangkat lunak produksi.

---

## Tahap 1: Inisialisasi Proyek & Konfigurasi Basis
* [ ] Inisialisasi project Next.js dengan TypeScript & Tailwind CSS:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
* [ ] Instalasi dependensi inti:
  * Database & ORM: `prisma`, `@prisma/client`
  * Keamanan & Autentikasi: `bcryptjs` / `@node-rs/argon2`, `jose` (JWT), `zod` (validasi schema)
  * UI & Ikon: `lucide-react`, `clsx`, `tailwind-merge`, komponen UI (Radix/Shadcn)
  * PDF Generation: `@react-pdf/renderer` atau `jspdf` + `qrcode`
* [ ] Konfigurasi `.env` dan `.env.example` (memastikan tidak ada rahasia yang ter-commit ke Git).
* [ ] Hubungkan Prisma dengan Neon PostgreSQL dan jalankan migrasi awal (`npx prisma migrate dev`).

---

## Tahap 2: Autentikasi, RBAC & Security Middleware
* [ ] Implementasi fungsi hashing password (`hashPassword` & `verifyPassword`).
* [ ] Buat Route Handler `/api/auth/register` dan `/api/auth/login`.
* [ ] Implementasi penerbitan JWT di dalam cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
* [ ] Buat Next.js `middleware.ts`:
  * Proteksi rute `/dashboard/*` berdasarkan login.
  * Proteksi rute `/admin/*` khusus role `ADMIN`.
  * Proteksi rute `/manager/*` khusus role `MANAGER` dan `ADMIN`.
* [ ] Implementasi fungsi *Rate Limiter* berbasis IP untuk proteksi brute-force login.

---

## Tahap 3: Master Data Management (Admin)
* [ ] CRUD Departemen (Nama divisi, deskripsi).
* [ ] CRUD Kantor & Geofence (Nama kantor, Latitude, Longitude, Radius toleransi meter).
* [ ] CRUD Shift Kerja (Nama shift, jam masuk, jam pulang, toleransi telat menit).
* [ ] Manajemen Pengguna / Karyawan (Input profil, NIK, penugasan divisi & kantor, struktur gaji dasar).
* [ ] Seeding Database: Buat script `prisma/seed.ts` yang otomatis mengisikan akun demonstrasi sistem (`admin@karyaguard.com`, `manager@karyaguard.com`, `user@karyaguard.com`).

---

## Tahap 4: Presensi Geofencing & Anti-Fake GPS
* [ ] Buat halaman antarmuka presensi (`/attendance`):
  * Pengambilan foto selfie via kamera browser.
  * Penangkapan koordinat via `navigator.geolocation.getCurrentPosition`.
* [ ] Buat Route Handler `/api/attendance/check-in`:
  * Validasi akurasi GPS server-side.
  * Kalkulasi jarak Haversine ke koordinat kantor.
  * Evaluasi batas radius toleransi (Reject jika di luar radius).
  * Evaluasi keterlambatan terhadap jam shift.
* [ ] Pencatatan riwayat presensi harian karyawan.

---

## Tahap 5: Pengajuan Cuti & Approval Workflow
* [ ] Form pengajuan cuti bagi karyawan (Pilihan jenis cuti, rentang tanggal, upload dokumen bukti).
* [ ] Antarmuka persetujuan cuti bagi Manager (`/manager/leaves`):
  * Daftar pengajuan cuti bawahan berstatus `PENDING`.
  * Aksi Approve (kuota cuti otomatis terpotong) atau Reject (dengan catatan alasan).
* [ ] Proteksi State Machine: Mencegah manipulasi status cuti via API langsung tanpa hak akses approver.

---

## Tahap 6: Automated Payroll Engine & Ekspor PDF
* [ ] Modul kalkulasi penggajian bulanan (`/admin/payroll`):
  * Pengambilan data kehadiran, total menit terlambat, dan lembur terverifikasi.
  * Kalkulasi otomatis Take-Home Pay (THP).
  * Pembuatan cryptographic hash SHA-256 untuk menjaga integritas slip gaji.
* [ ] Generator Slip Gaji (PDF):
  * Layout profesional slip gaji, detail penerimaan dan potongan.
  * Penyematan QR Code validasi keaslian.
* [ ] Penguncian Anti-IDOR: Endpoint `/api/payroll/[id]/download` memastikan user hanya dapat mengunduh slip gajinya sendiri.

---

## Tahap 7: Dashboard Analitik & Laporan
* [ ] Dashboard Utama:
  * Widget statistik kehadiran hari ini.
  * Grafik perbandingan On-Time vs Keterlambatan mingguan.
  * Total pengeluaran penggajian bulanan perusahaan.
* [ ] Fitur Ekspor Laporan Rekapitulasi Presensi ke format CSV/PDF untuk HR Admin.
* [ ] Halaman Audit Trail Keamanan (`/admin/audit-logs`) untuk memantau log aktivitas.

---

## Tahap 8: Docker Containerization & Deployment Vercel
* [ ] Buat `Dockerfile` multi-stage dan `docker-compose.yml`.
* [ ] Uji jalankan container secara lokal (`docker compose up --build`).
* [ ] Push repositori ke GitHub dengan pesan commit bertahap (*incremental commits*).
* [ ] Hubungkan repositori ke Vercel dan pasang *environment variables* (Neon DB URL, JWT secret).
* [ ] Verifikasi domain publik Vercel dan pastikan sertifikat SSL/TLS (HTTPS) aktif.

---

## Tahap 9: Eksekusi Self-Testing Keamanan & Pengumpulan Bukti
* [ ] Jalankan Skenario 1 (SQLi & XSS test pada form).
* [ ] Jalankan Skenario 2 (IDOR testing pada endpoint slip gaji).
* [ ] Jalankan Skenario 3 (Geofence bypass testing dengan fake coordinates).
* [ ] Jalankan Skenario 4 (Brute-force login & rate-limiting verification).
* [ ] Jalankan Skenario 5 (SecurityHeaders scan & `npm audit`).
* [ ] Ambil tangkapan layar (*screenshots*) dari setiap pengujian dan hasilnya sebagai bukti laporan.

---

## Tahap 10: Penyusunan Dokumen Spesifikasi & Laporan Keamanan
* [ ] Susun berkas dokumentasi teknis: `KaryaGuard_Security_and_Architecture_Report.pdf`.
* [ ] Masukkan URL aplikasi Vercel aktif, URL repositori Git, dan kredensial demonstrasi.
* [ ] Lengkapi bab Analisis Keamanan Siber, Penjelasan Arsitektur Sistem, serta Transparansi AI Engineering.
* [ ] Validasi checklist kepatuhan standar keamanan sebelum peluncuran resmi.

