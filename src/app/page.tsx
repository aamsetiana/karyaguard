import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Clock,
  FileText,
  Calendar,
  Database,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  CheckCircle2,
  Terminal,
  ExternalLink,
  ChevronRight,
  Fingerprint,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">
                Karya<span className="text-emerald-400">Guard</span>
              </span>
              <span className="ml-2 text-[10px] bg-white/[0.06] text-slate-300 px-2 py-0.5 rounded font-mono border border-white/[0.08]">
                v1.0-prod
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/aamsetiana/karyaguard"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.15] transition"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <Link
              href="/login"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-sm shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tugas Besar Pengembangan & Pengamanan Aplikasi Web</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Sistem HRIS & Presensi Geofence{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
              Zero-Trust Architecture
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-light max-w-2xl mx-auto">
            Solusi tata kelola personalia dan penggajian otomatis dengan validasi lokasi bola bumi (Haversine Formula), proteksi Anti-IDOR, dan penerbitan slip gaji PDF berintegritas tanda tangan SHA-256.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
            >
              <span>Akses Portal Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/aamsetiana/karyaguard"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-white/[0.08] flex items-center justify-center gap-2 transition"
            >
              <Terminal className="w-4 h-4 text-slate-400" />
              <span>Telusuri Source Code</span>
            </a>
          </div>
        </div>

        {/* Live Architecture Blueprint Panel (Not AI slop, real architectural terminal/card) */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 font-mono text-[11px] text-slate-500">karyaguard-security-pipeline.ts</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Security: PASSED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Geofencing Server</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">Formula Haversine</div>
              <p className="text-[11px] text-slate-500 font-light">
                Kalkulasi jarak spherical trigonometri server-side anti-Fake GPS.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px] uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Anti-IDOR Defense</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">Strict Ownership Guard</div>
              <p className="text-[11px] text-slate-500 font-light">
                Verifikasi kepemilikan resource gaji & presensi pada setiap endpoint API.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Integritas SHA-256</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">Cryptographic Seal</div>
              <p className="text-[11px] text-slate-500 font-light">
                Segel hash digital pada slip gaji untuk mendeteksi manipulasi database.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px] uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>Neon Cloud Serverless</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">PostgreSQL + Prisma</div>
              <p className="text-[11px] text-slate-500 font-light">
                Koneksi pooler terenkripsi SSL dengan parameterized queries kebal SQLi.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Core Roles Flow (Relatable, clear for lecturer) */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Tiga Tingkat Otorisasi Peran (RBAC)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Setiap peran memiliki kontrol akses dan batas kewenangan data yang terisolasi secara ketat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Employee Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-6 space-y-4 hover:border-emerald-500/30 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                  Role: EMPLOYEE
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h3 className="text-base font-bold text-white">Karyawan Biasa</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Presensi mandiri via kamera WebRTC & validasi radius kantor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Pengajuan cuti tahunan, izin sakit, dan klaim lembur.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Unduh slip gaji resmi pribadi dalam format PDF ber-QR Code.</span>
                </li>
              </ul>
            </div>

            {/* Manager Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-6 space-y-4 hover:border-amber-500/30 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                  Role: MANAGER
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              </div>
              <h3 className="text-base font-bold text-white">Supervisor / Atasan</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Alur persetujuan cuti tim (1-klik Approve atau Reject).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Pemotongan otomatis kuota cuti karyawan saat disetujui.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Monitoring rekap kehadiran departemen secara realtime.</span>
                </li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-6 space-y-4 hover:border-rose-500/30 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
                  Role: HR_ADMIN
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              </div>
              <h3 className="text-base font-bold text-white">Administrator & Finance</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>Eksekusi mesin kalkulasi payroll bulanan otomatis (denda, lembur, pajak).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>Penyegelan slip gaji dengan cryptographic hash SHA-256.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>Akses Security Audit Trail & Ekspor rekap presensi (CSV).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Akun Uji Coba Pengujian Dosen</h3>
              <p className="text-xs text-slate-400">
                Gunakan kredensial berikut untuk menguji masing-masing tingkat peran pada halaman login:
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <span>Langsung Buka Login</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-rose-400 font-semibold uppercase">Admin HR</span>
              <div className="text-slate-200">admin@karyaguard.com</div>
              <div className="text-slate-500 text-[11px]">AdminSecurePass123!</div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-amber-400 font-semibold uppercase">Manager</span>
              <div className="text-slate-200">manager@karyaguard.com</div>
              <div className="text-slate-500 text-[11px]">ManagerPass123!</div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Karyawan</span>
              <div className="text-slate-200">user@karyaguard.com</div>
              <div className="text-slate-500 text-[11px]">EmployeePass123!</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-slate-500 max-w-7xl mx-auto px-4 w-full">
        <p>
          KaryaGuard Enterprise HRIS • Tugas Besar Mata Kuliah Cyber Security • Next.js, Neon PostgreSQL & Docker
        </p>
      </footer>
    </div>
  );
}
