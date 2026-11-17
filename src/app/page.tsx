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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">KaryaGuard</span>
              <span className="ml-2 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                v1.0 Secure HRIS
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5"
            >
              <span>Akses Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Proyek Cyber Security — Pra UTS (Next.js + Neon + Docker)</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Sistem HRIS & Presensi Geofencing <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Terproteksi Anti-Manipulasi
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400">
          KaryaGuard dirancang dengan arsitektur <em>Zero-Trust</em>, kalkulasi presensi jarak radius bola bumi (*Haversine*), proteksi anti-IDOR, dan penerbitan slip gaji digital berintegritas tanda tangan kriptografis SHA-256.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-950/50 flex items-center gap-2 transition"
          >
            <span>Buka Portal Pengguna</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl border border-slate-800 transition"
          >
            Dokumentasi Repositori
          </a>
        </div>

        {/* 4 Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Geofencing & Swafoto</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pencegahan lokasi palsu (<em>Fake GPS</em>) dengan validasi formula Haversine murni pada <em>server-side</em> dan swafoto realtime.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Zero-Trust & Anti-IDOR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Otorisasi ketat 3 peran (Karyawan, Manager, Admin). Setiap resource slip gaji dan absensi diverifikasi kepemilikannya sebelum disajikan.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Payroll Hash SHA-256</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ekspor slip gaji resmi dalam format PDF ber-watermark, kode QR verifikasi keabsahan, dan tanda tangan hash anti-tampering database.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>
          KaryaGuard Enterprise HRIS • Tugas Besar Mata Kuliah Cyber Security • Fullstack Next.js & Neon PostgreSQL
        </p>
      </footer>
    </div>
  );
}
