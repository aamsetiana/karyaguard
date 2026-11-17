"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan autentikasi");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: "admin" | "manager" | "user") => {
    setError(null);
    if (role === "admin") {
      setEmail("admin@karyaguard.com");
      setPassword("AdminSecurePass123!");
    } else if (role === "manager") {
      setEmail("manager@karyaguard.com");
      setPassword("ManagerPass123!");
    } else {
      setEmail("user@karyaguard.com");
      setPassword("EmployeePass123!");
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-center px-4 sm:px-6 lg:px-8 text-slate-100 py-12">
      {/* Back to Home Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <BrandLogo className="w-14 h-14 mx-auto mb-2" />
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Akses Portal KaryaGuard
        </h1>
        <p className="text-xs text-slate-400">
          Autentikasi terenkripsi bcrypt dengan perlindungan brute-force laju IP.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0C121E] py-8 px-6 sm:px-8 rounded-2xl border border-white/[0.08] shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Autentikasi Gagal</p>
                <p className="mt-0.5 text-rose-400/90">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@karyaguard.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition shadow-lg shadow-emerald-950/40"
            >
              <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Demo Quick Fill Buttons */}
          <div className="pt-5 border-t border-white/[0.08] space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Tombol Cepat Akun Demonstrasi (Quick Role Fill)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-rose-500/30 hover:bg-rose-500/5 transition flex flex-col items-center justify-center text-center group"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400 mb-1" />
                <span className="text-[11px] font-semibold text-slate-200">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("manager")}
                className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/5 transition flex flex-col items-center justify-center text-center group"
              >
                <UserCheck className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-[11px] font-semibold text-slate-200">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("user")}
                className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition flex flex-col items-center justify-center text-center group"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[11px] font-semibold text-slate-200">Karyawan</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Token JWT disimpan otomatis di Cookie dengan flag HttpOnly & SameSite=Lax.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
