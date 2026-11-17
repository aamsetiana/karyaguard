# Software Requirements Specification (SRS) & Arsitektur Sistem
## KaryaGuard — Secure HRIS, Geofenced Attendance & Payroll System

> **Mata Kuliah**: Cyber Security  
> **Target Platform**: Web Application (Next.js 14/15, Neon PostgreSQL, Vercel, Docker)  
> **Status Dokumen**: Final Architecture Specification (v1.0)

---

## 1. Pendahuluan & Latar Belakang

### 1.1 Latar Belakang
Pengelolaan sumber daya manusia (SDM) pada institusi modern membutuhkan sistem pencatatan kehadiran (*attendance*) dan penggajian (*payroll*) yang akurat, otomatis, dan tahan terhadap manipulasi. Kebocoran data pribadi (UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi / UU PDP) dan manipulasi data absensi (penggunaan aplikasi *Fake GPS* / *location spoofing*) merupakan ancaman nyata terhadap integritas operasional organisasi.

**KaryaGuard** dirancang sebagai solusi *Enterprise Human Resource Information System* (HRIS) yang memadukan otomasi manajemen personalia dengan prinsip-prinsip *Secure Coding* dan *Zero-Trust Security*.

### 1.2 Tujuan Sistem
1. Menyediakan presensi digital berbasis *Geofencing* (validasi jarak titik kantor via kalkulasi server-side) dan swafoto (*selfie verification*) yang kebal terhadap manipulasi koordinat palsu.
2. Mengotomatisasi siklus pengajuan dan persetujuan izin/cuti (*multi-tier approval workflow*).
3. Melakukan kalkulasi penggajian (*payroll calculation engine*) secara otomatis dengan memperhitungkan komponen gaji pokok, tunjangan, lembur, serta penalti keterlambatan absensi.
4. Menerbitkan slip gaji digital terenkripsi dalam format PDF yang dilengkapi tanda tangan kriptografis dan QR Code verifikasi integritas.
5. Menjaga kerahasiaan data finansial dan identitas karyawan dari serangan siber umum seperti IDOR, SQL Injection, XSS, dan *privilege escalation*.

---

## 2. Aktor & Matriks Hak Akses (RBAC)

Sistem membagi pengguna ke dalam 3 tingkatan peran (*Role*):

| Hak Akses / Modul | Karyawan (`EMPLOYEE`) | Supervisor / Manager (`MANAGER`) | HR & Finance Admin (`ADMIN`) |
| :--- | :---: | :---: | :---: |
| **Login / Logout & Profil Diri** | ✅ | ✅ | ✅ |
| **Check-in / Check-out (Geofenced Presensi)** | ✅ | ✅ | ✅ |
| **Lihat Riwayat Presensi Sendiri** | ✅ | ✅ | ✅ |
| **Lihat Seluruh Presensi Tim/Departemen** | ❌ | ✅ | ✅ |
| **Pengajuan Cuti / Izin / Lembur** | ✅ | ✅ | ✅ |
| **Approve / Reject Cuti Bawahan** | ❌ | ✅ | ✅ |
| **Lihat & Download Slip Gaji Sendiri** | ✅ | ✅ | ✅ |
| **Akses Slip Gaji Karyawan Lain** | ❌ (Dilarang/Anti-IDOR) | ❌ (Dilarang/Anti-IDOR) | ✅ |
| **Kelola Master Data (Departemen, Lokasi, Shift)** | ❌ | ❌ | ✅ |
| **Kelola Akun Karyawan & Struktur Gaji** | ❌ | ❌ | ✅ |
| **Jalankan Mesin Kalkulasi Payroll Bulanan** | ❌ | ❌ | ✅ |
| **Akses Audit Trail / Log Aktivitas Keamanan** | ❌ | ❌ | ✅ |
| **Ekspor Laporan Rekapitulasi (PDF/CSV)** | ❌ | ❌ | ✅ |

---

## 3. Alur Bisnis Utama (Core Workflows)

### 3.1 Alur Presensi Geofencing & Anti-Fake GPS
```
[Karyawan di Lokasi]
        │
        ▼
Buka Halaman Presensi -> Browser meminta izin Kamera & Geolocation
        │
        ▼
Ambil Foto Selfie & Tangkap Koordinat (Latitude, Longitude, Accuracy)
        │
        ▼
POST /api/attendance/check-in (Payload: Lat, Lng, Accuracy, Image Base64)
        │
        ▼
[Backend Server Validation]
   ├── 1. Validasi Autentikasi Sesi (HttpOnly Cookie JWT)
   ├── 2. Ambil Geofence Kantor Karyawan dari Database (Office Lat, Lng, Radius Max)
   ├── 3. Validasi Akurasi GPS (Reject jika accuracy > 100 meter / terindikasi mock)
   ├── 4. Hitung Jarak Euclidean via Haversine Formula:
   │      d = 2r * arcsin(sqrt(sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlng/2)))
   ├── 5. Evaluasi Jarak:
   │      - Jika Jarak <= Radius Kantor (misal 50 meter) -> DITERIMA
   │      - Jika Jarak > Radius Kantor -> DITOLAK (Status: Out of Boundary)
   ├── 6. Evaluasi Jam Masuk terhadap Shift:
   │      - Jika Jam > Waktu Masuk + Toleransi -> Status: LATE (Catat menit telat)
   │      - Jika Jam <= Waktu Masuk + Toleransi -> Status: ON_TIME
   └── 7. Simpan Record ke Database + Catat Audit Log
```

### 3.2 Alur Pengajuan Cuti / Lembur (State Machine)
1. **Draft / Pengajuan**: Karyawan memilih tanggal mulai, tanggal selesai, jenis izin (Tahunan, Sakit, Lembur), dan mengunggah dokumen bukti (misal: surat dokter).
2. **Review oleh Manager**: Manager departemen menerima notifikasi. Manager meninjau sisa kuota cuti tahunan karyawan.
3. **Persetujuan / Penolakan**:
   * Jika **Approved**: Status berubah menjadi `APPROVED`, kuota cuti tahunan dipotong secara otomatis.
   * Jika **Rejected**: Status berubah menjadi `REJECTED` dengan menyertakan alasan penolakan.
4. **Kunci Data**: Pengajuan yang sudah berstatus `APPROVED` atau `REJECTED` dikunci (tidak dapat diedit kembali oleh pemohon).

### 3.3 Alur Kalkulasi Penggajian (*Payroll Engine*)
```
[Admin HR/Finance] Membuka Menu Payroll -> Pilih Bulan & Tahun Periode
        │
        ▼
Klik "Hitung Payroll Periode Ini"
        │
        ▼
[Payroll Engine Loop untuk Setiap Karyawan Aktif]
   ├── Ambil Gaji Pokok & Tunjangan Tetap dari Master Karyawan
   ├── Hitung Total Keterlambatan Absensi pada Periode Berjalan:
   │      Denda Telat = Total Menit Terlambat * Tarif Denda Per Menit
   ├── Hitung Jam Lembur Terverifikasi (Status: APPROVED):
   │      Upah Lembur = Total Jam Lembur * Tarif Lembur Per Jam
   ├── Hitung Potongan Wajib:
   │      - Potongan BPJS Kesehatan / Ketenagakerjaan
   │      - Potongan PPh 21 Estimasi
   ├── Kalkulasi Gaji Bersih (Take-Home Pay):
   │      THP = (Gaji Pokok + Tunjangan + Upah Lembur) - (Denda Telat + Potongan BPJS + PPh21)
   ├── Generate Cryptographic Hash (SHA-256) dari Record Payroll
   └── Simpan Record Payroll dengan Status: GENERATED
        │
        ▼
[Admin Review & Locking]
Admin memverifikasi -> Klik "Terbitkan & Kunci Slip Gaji" (Status: LOCKED / PUBLISHED)
        │
        ▼
Karyawan dapat mengunduh Slip Gaji Resmi (PDF ber-QR Code)
```

---

## 4. Diagram Arsitektur Sistem

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  - Next.js Client Components (React 18/19, Tailwind CSS, Lucide Icons, Shadcn)  |
|  - HTML5 Geolocation API & MediaDevices (Camera for Selfie Attendance)          |
|  - PDF Viewer & QR Scanner                                                      |
+---------------------------------------------------------------------------------+
                                       │
                                       │ HTTPS (TLS 1.3)
                                       │ Next.js Route Handlers / Server Actions
                                       ▼
+---------------------------------------------------------------------------------+
|                             APPLICATION / SERVER TIER                           |
|  [Vercel Serverless / Docker Next.js Standalone Container]                     |
|                                                                                 |
|  +---------------------------+  +---------------------------------------------+ |
|  |     Security Middleware    |  |               Business Modules              | |
|  |  - Security Headers (CSP) |  |  - Auth Module (Argon2id / bcrypt)          | |
|  |  - Rate Limiter (Sliding) |  |  - Attendance & Geofence Validator Engine   | |
|  |  - JWT Session Verifier   |  |  - Leave & Overtime State Machine Engine    | |
|  |  - RBAC Route Guard       |  |  - Automated Payroll Engine                 | |
|  |  - Zod Request Validator  |  |  - PDF Generation Service (@react-pdf)      | |
|  +---------------------------+  +---------------------------------------------+ |
+---------------------------------------------------------------------------------+
                                       │
                                       │ Encrypted TLS Connection (Prisma ORM)
                                       ▼
+---------------------------------------------------------------------------------+
|                                  DATA TIER                                      |
|  [Neon PostgreSQL Serverless / Local PostgreSQL in Docker]                      |
|                                                                                 |
|  - Tables: users, departments, offices, shifts, attendances, leaves,            |
|            payrolls, audit_logs                                                 |
|  - Constraint: Foreign Keys, Indexes, Unique Constraints, Row Level Integrity    |
+---------------------------------------------------------------------------------+
```

---

## 5. Rencana Fitur Laporan & Visualisasi
1. **Dashboard Statistik**:
   * Persentase kehadiran harian (On-Time, Late, Absent).
   * Grafik tren keterlambatan per departemen.
   * Total pengeluaran beban gaji perusahaan per bulan.
2. **Ekspor Slip Gaji Karyawan (PDF)**:
   * Header logo institusi dan watermark *CONFIDENTIAL*.
   * Rincian penerimaan (gaji pokok, tunjangan, lembur) dan rincian potongan.
   * QR Code yang mengarah ke endpoint validasi keaslian slip gaji.
3. **Ekspor Rekap Kehadiran (CSV & PDF)**:
   * Format tabel presensi bulanan per divisi untuk keperluan audit manajemen.

