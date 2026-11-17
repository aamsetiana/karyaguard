# KaryaGuard — Secure HRIS, Geofenced Attendance & Payroll System

[![Next.js](https://img.shields.io/badge/Framework-Next.js_14%2F15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Security Grade](https://img.shields.io/badge/Security_Headers-Grade_A%2B-brightgreen?style=flat)](#)

> **Proyek Tugas Besar**: Pengembangan & Pengamanan Aplikasi Web  
> **Mata Kuliah**: Cyber Security (Pra UTS)  
> **Sifat Pengerjaan**: Individu  

---

## 1. Deskripsi Proyek
**KaryaGuard** adalah aplikasi *Enterprise Human Resource Information System* (HRIS) berbasis web modern yang dirancang dengan memadukan pengelolaan personalia organisasi dengan prinsip *Secure Coding* dan *Zero-Trust Security*.

Sistem ini memfasilitasi pencatatan presensi digital berbasis **Geofencing** (kalkulasi jarak koordinat server-side) dan swafoto anti-manipulasi lokasi palsu (*fake GPS*), alur pengajuan & persetujuan cuti bertingkat (*multi-tier workflow*), kalkulasi penggajian otomatis (*payroll engine*), serta penerbitan slip gaji digital ber-QR Code dengan tanda tangan integritas kriptografis SHA-256.

---

## 2. Fitur Utama Aplikasi

### A. Autentikasi & Kontrol Akses (RBAC)
* **Pemisahan Peran (*Role-Based Access Control*)**:
  * `EMPLOYEE`: Presensi geofence, pengajuan cuti/lembur, melihat slip gaji pribadi.
  * `MANAGER`: Menyetujui/menolak izin cuti bawahan, monitoring presensi tim departemen.
  * `ADMIN`: Manajemen master data, struktur gaji, mesin kalkulasi payroll, dan audit log keamanan.
* **Manajemen Sesi Aman**: Autentikasi JWT yang disimpan di dalam cookie ber-flag `HttpOnly`, `Secure`, dan `SameSite=Lax`.
* **Password Hashing**: Menggunakan algoritma modern **Argon2id** / `bcrypt` (bukan plaintext).
* **Proteksi Brute-Force**: Pembatasan laju (*Rate Limiting*) pada endpoint login.

### B. Presensi Berbasis Geofencing & Anti-Fake GPS
* Validasi koordinat karyawan terhadap titik kantor menggunakan **Haversine Formula** yang dieksekusi murni di sisi *server-side*.
* Verifikasi parameter akurasi GPS dan deteksi kejanggalan lokasi (*impossible travel anomaly*).
* Swafoto kehadiran (*selfie check-in*) untuk mencegah titip absen.

### C. Pengelolaan Data & Pengajuan Cuti (CRUD)
* Manajemen data departemen, kantor geofence, shift kerja, dan data karyawan.
* Siklus pengajuan izin/cuti (*State Machine: Pending -> Approved / Rejected*) dengan pemotongan kuota cuti otomatis.

### D. Automated Payroll Engine & Slip Gaji PDF
* Mesin kalkulasi gaji otomatis: Gaji Pokok + Tunjangan + Lembur Terverifikasi - Denda Keterlambatan Absensi - Potongan Pajak/BPJS.
* Pembuatan *Cryptographic Integrity Hash* (SHA-256) pada setiap slip gaji untuk mencegah manipulasi database.
* Ekspor Slip Gaji resmi dalam format **PDF** ber-watermark dan dilengkapi **QR Code verifikasi keaslian**.

### E. Laporan & Dashboard Analitik
* Dashboard statistik kehadiran hari ini, perbandingan rasio tepat waktu vs terlambat.
* Grafik pengeluaran beban gaji perusahaan.
* Ekspor laporan rekapitulasi kehadiran bulanan ke format CSV dan PDF.

---

## 3. Tech Stack & Arsitektur

* **Frontend & Backend**: Next.js (App Router, Server Actions, Route Handlers, TypeScript)
* **Styling & UI**: Tailwind CSS, Lucide Icons, Shadcn UI
* **Database**: Neon Serverless PostgreSQL (Cloud Production) & Local PostgreSQL (Docker Staging)
* **ORM**: Prisma ORM (Parameterized queries kebal SQL Injection)
* **PDF Generator**: `@react-pdf/renderer` / `jspdf` & `qrcode`
* **Containerization**: Docker & Docker Compose (Multi-stage build non-root runner)
* **Cloud Deployment**: Vercel (Edge Network, Auto-HTTPS/SSL, FQDN Subdomain)

---

## 4. Konfigurasi Environment Variables

Buat file `.env` di direktori root (gunakan template `.env.example`):

```env
# Koneksi Database Neon PostgreSQL
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"

# Kunci Enkripsi JWT Sesi (Minimal 32 karakter rahasia)
JWT_SECRET="karyaguard_super_secret_jwt_encryption_key_2026_xyz"

# URL Aplikasi (Ganti dengan domain Vercel saat production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Kunci Rahasia Integritas Payroll
PAYROLL_HASH_SALT="secret_salt_for_payroll_integrity_hash_verification"
```

> ⚠️ **PERHATIAN**: File `.env` yang memuat kredensial nyata tidak boleh di-commit ke repositori Git (telah di-exclude di `.gitignore`).

---

## 5. Cara Instalasi & Menjalankan Aplikasi

### Opsi A: Menjalankan Secara Lokal (Node.js)

1. **Clone repositori**:
   ```bash
   git clone https://github.com/aamsetiana/karyaguard.git
   cd karyaguard
   ```
2. **Install dependensi**:
   ```bash
   npm install
   ```
3. **Setup Database & Migrasi Prisma**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
4. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi aktif di `http://localhost:3000`.

### Opsi B: Menjalankan Menggunakan Docker

Pastikan Docker Desktop aktif di komputer Anda:
```bash
# Jalankan seluruh stack (Next.js app + PostgreSQL lokal + Prisma Studio)
docker compose up --build -d

# Jalankan migrasi database di dalam container
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```
* Aplikasi aktif di `http://localhost:3000`
* Prisma Studio Database UI aktif di `http://localhost:5555`

---

## 6. Akun Uji Coba (Demo Credentials)

Untuk keperluan pengujian dosen dan evaluasi fungsional:

| Peran (*Role*) | Email Akun | Password Default | Keterangan |
| :--- | :--- | :--- | :--- |
| **HR / Finance Admin** | `admin@karyaguard.com` | `AdminSecurePass123!` | Akses penuh master data, payroll & audit |
| **Manager / Supervisor**| `manager@karyaguard.com`| `ManagerPass123!` | Akses approval cuti & presensi tim |
| **Karyawan Biasa** | `user@karyaguard.com` | `EmployeePass123!` | Akses presensi selfie & slip gaji pribadi |

---

## 7. URL Aplikasi & Repositori

* **URL Aplikasi Aktif (Vercel)**: `https://karyaguard.vercel.app` *(Akan diperbarui saat deploy)*
* **URL Repositori Git**: `https://github.com/aamsetiana/karyaguard`

---

## 8. Ringkasan Penggunaan AI Agent

Sesuai ketentuan kejujuran akademik pada Ketentuan Teknis Poin 3e:
* **Alat AI yang Digunakan**: Google Antigravity (Gemini 3.8 Flash & Pro Engine).
* **Bagian Pekerjaan yang Dibantu**:
  1. Perancangan dokumen arsitektur SRS, diagram relasi entitas (ERD), dan skema Prisma ORM.
  2. Implementasi algoritma geofencing formula Haversine di server-side.
  3. Konfigurasi multi-stage `Dockerfile` dan konfigurasi *Security Headers* pada `next.config.mjs`.
  4. Penyusunan 5 skenario *self-testing* keamanan web dan mitigasi kerentanan IDOR.
* **Contoh Prompt Utama**:
  > *"Buatkan fungsi kalkulasi formula Haversine di TypeScript untuk validasi koordinat presensi karyawan di server-side dengan verifikasi batas radius kantor."*
* **Cara Mahasiswa Meninjau & Memverifikasi**:
  Seluruh kode hasil AI ditinjau manual, diverifikasi alur eksekusinya, diuji menggunakan pengujian fungsional dan skenario cURL, serta dipastikan tidak ada *hardcoded secrets* yang masuk ke dalam source code.

---

## 9. Ringkasan Hasil Self-Testing Keamanan

| Skenario Uji | Metode Pengujian | Hasil |
| :--- | :--- | :---: |
| **SQL Injection & XSS** | Injeksi payload pada form login dan pengajuan cuti | **LOLOS** (Prisma parameterized + sanitasi Zod) |
| **Kontrol Akses & IDOR** | Manipulasi ID pada endpoint unduh slip gaji `/api/payroll/[id]` | **LOLOS** (HTTP 403 Forbidden & tercatat di audit log) |
| **Geofencing Bypass** | Check-in dengan koordinat palsu di luar batas kantor | **LOLOS** (HTTP 400 Out of Geofence Boundary) |
| **Brute-Force Login** | Pengiriman > 5 login gagal beruntun dengan script | **LOLOS** (HTTP 429 Too Many Requests aktif) |
| **Security Headers & Audit** | Scan *securityheaders.com* & `npm audit` | **LOLOS** (Grade A/A+ & 0 vulnerabilities) |

---

## 10. Dokumentasi Arsitektur Lengkap

Rancangan mendalam tersedia pada folder `docs/`:
* [docs/ARCHITECTURE_AND_SRS.md](docs/ARCHITECTURE_AND_SRS.md) — Spesifikasi kebutuhan perangkat lunak & diagram arsitektur.
* [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — ERD lengkap, spesifikasi tabel PostgreSQL & Prisma schema.
* [docs/SECURITY_BLUEPRINT.md](docs/SECURITY_BLUEPRINT.md) — Cetak biru keamanan siber (Anti-Fake GPS, RBAC, IDOR, Zod, Headers).
* [docs/SELF_TESTING_PLAN.md](docs/SELF_TESTING_PLAN.md) — Rencana 5 skenario pengujian mandiri dan bukti perbaikan.
* [docs/DOCKER_AND_DEPLOYMENT.md](docs/DOCKER_AND_DEPLOYMENT.md) — Konfigurasi Docker multi-stage & panduan deploy Vercel + Neon.
* [docs/PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) — Peta jalan tahapan pengerjaan bertahap.

