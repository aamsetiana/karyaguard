# Cetak Biru Keamanan Siber (Security Blueprint)
## KaryaGuard — Secure HRIS, Geofenced Attendance & Payroll System

> **Tujuan**: Memenuhi dan mengimplementasikan standar arsitektur keamanan siber enterprise (OWASP Top 10, Defense in Depth, Zero Trust Principles).

---

## 1. Autentikasi & Manajemen Sesi

### 1.1 Hashing Password (Argon2id / bcrypt)
* Password wajib di-hash menggunakan algoritma **Argon2id** (atau `bcrypt` dengan cost factor 12).
* Karakteristik kebijakan password (*Password Policy*):
  * Minimal 8 karakter.
  * Mengandung kombinasi huruf besar, huruf kecil, angka, dan karakter spesial (`!@#$%^&*`).
  * Divalidasi di sisi *frontend* dan *backend* via Zod schema.
* *Plaintext password* tidak pernah disimpan ke database atau dicatat ke log aplikasi.

### 1.2 Manajemen Sesi dengan Cookie Aman (*Secure Cookies*)
Sesi disimpan menggunakan **JSON Web Token (JWT)** terenkripsi di dalam cookie dengan spesifikasi:
```typescript
{
  httpOnly: true,        // Mencegah pencurian token via serangan XSS di browser
  secure: process.env.NODE_ENV === "production", // Wajib HTTPS di Vercel
  sameSite: "lax",       // Melindungi dari serangan Cross-Site Request Forgery (CSRF)
  path: "/",
  maxAge: 60 * 60 * 8,   // Kedaluwarsa dalam 8 jam (1 hari kerja)
}
```
* **Mekanisme Logout**: Cookie langsung dihapus (*cleared/expired* seketika) dan log audit mencatat waktu *session termination*.

---

## 2. Algoritma Geofencing & Proteksi Anti-Fake GPS

### 2.1 Formula Haversine (Server-Side Execution)
Validasi jarak posisi karyawan terhadap kantor **wajib dihitung di server-side**, bukan mempercayai kalkulasi browser.

```typescript
/**
 * Menghitung jarak antara dua koordinat bola bumi (Haversine Formula)
 * @returns Jarak dalam satuan Meter
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Hasil dalam meter
}
```

### 2.2 Lapisan Proteksi Manipulasi Lokasi (*Mock Location Detection*)
1. **Validasi Akurasi GPS**: Parameter `accuracy` dari HTML5 Geolocation API diverifikasi. Jika `accuracy > 100` meter, presensi ditolak karena sinyal terlalu lemah atau terindikasi emulator.
2. **Device & Network Header Verification**: Mencatat *IP Address* dan *User-Agent* saat check-in.
3. **Impossible Travel Speed Anomaly**: Jika karyawan check-in pada pukul 08:00 di Jakarta, lalu check-out pukul 08:15 dengan koordinat di Bandung, sistem menandai sebagai anomali (*Security Alert*).

---

## 3. Pencegahan Kerentanan Utama (OWASP Top 10)

### 3.1 Pencegahan SQL Injection (SQLi)
* **Arsitektur**: Menggunakan **Prisma ORM** yang secara otomatis mengonversi seluruh operasi database ke *parameterized queries* / *prepared statements*.
* Raw SQL queries (`$queryRawUnsafe`) dilarang keras di seluruh kode aplikasi.

### 3.2 Pencegahan Cross-Site Scripting (XSS)
* **React Auto-Escaping**: Secara default, Next.js JSX melakukan sanitasi otomatis terhadap karakter spesial HTML (`<`, `>`, `&`, `"`, `'`).
* **Input Sanitization**: Seluruh input teks (alasan cuti, catatan lembur) disanitasi menggunakan schema Zod sebelum diproses atau disimpan ke database.

### 3.3 Pencegahan Insecure Direct Object References (IDOR)
Celah IDOR terjadi ketika pengguna dapat mengakses data orang lain dengan memodifikasi ID di parameter URL (contoh: `/api/payroll/download?id=102`).

**Mekanisme Pertahanan (*Strict Ownership Check*)**:
```typescript
// Contoh middleware logic pada Server Action / Route Handler
export async function verifyResourceOwnership(
  currentUserId: string,
  currentUserRole: string,
  targetResourceId: string
) {
  const payroll = await prisma.payroll.findUnique({
    where: { id: targetResourceId },
  });

  if (!payroll) throw new Error("Data tidak ditemukan");

  // Hanya pemilik data atau HR Admin yang boleh mengakses
  if (payroll.userId !== currentUserId && currentUserRole !== "ADMIN") {
    // Catat upaya peretasan ke Audit Log
    await createAuditLog({
      action: "ACCESS_DENIED_IDOR_ATTEMPT",
      actorId: currentUserId,
      details: { targetResourceId },
    });
    throw new Error("Akses Ditolak: Anda tidak berhak melihat data ini.");
  }

  return payroll;
}
```

### 3.4 Rate Limiting & Proteksi Brute-Force
* Mengimplementasikan pembatasan laju (*Rate Limiting*) pada rute kritis:
  * `/api/auth/login`: Maksimal 5 percobaan gagal per IP/Email dalam rentang 15 menit. Setelah itu, akun terkunci sementara.
  * `/api/attendance/check-in`: Maksimal 3 kali percobaan submit dalam 1 menit (mencegah *race condition* atau *spamming request*).

---

## 4. Konfigurasi Header Keamanan (*Security Headers*)

Dikonfigurasikan langsung pada file `next.config.mjs` untuk memperoleh nilai skor **A+** pada pengujian *securityheaders.com*:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Mencegah serangan Clickjacking
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Mencegah MIME sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=()", // Hanya izinkan kamera & GPS dari origin sendiri
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // Paksa HTTPS
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 5. Audit Logging & Perlindungan Data Pribadi (UU PDP)

1. **Jejak Audit (*Tamper-Resistant Audit Trail*)**:
   Tabel `audit_logs` merekam seluruh aktivitas kritikal:
   * Percobaan login sukses dan gagal (*failed login attempts*).
   * Perubahan nominal struktur gaji karyawan.
   * Eksekusi penerbitan dan penguncian penggajian (*payroll locking*).
   * Persetujuan / penolakan cuti oleh manager.
   * Setiap upaya pelanggaran batas otorisasi (indikasi serangan IDOR).
2. **Kepatuhan Perlindungan Data Finansial**:
   * Nomor rekening dan NIK dimasking pada antarmuka biasa.
   * Data backup dan database cloud terenkripsi (*encryption at-rest* bawaan Neon PostgreSQL).

