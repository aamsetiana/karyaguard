"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, AlertCircle, CheckCircle2, UserCheck, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          KaryaGuard Portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Secure HRIS, Geofenced Attendance & Payroll System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Autentikasi Gagal</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                Alamat Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@karyaguard.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 transition"
            >
              {loading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Pilihan Cepat Akun Uji Coba (Demo Dosen)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/5 transition text-xs group"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400 mb-1" />
                <span className="font-medium text-slate-200">HR Admin</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("manager")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition text-xs group"
              >
                <UserCheck className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-medium text-slate-200">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("user")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition text-xs group"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-medium text-slate-200">Karyawan</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Dilindungi enkripsi sandi bcrypt, token JWT HttpOnly, dan rate limiter brute-force.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

