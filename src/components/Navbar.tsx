"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, User, LogOut, FileText, Calendar, Clock, BarChart3, Database } from "lucide-react";

interface NavbarProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    department?: string | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  KaryaGuard
                </span>
                <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Secure HRIS
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Dashboard
              </Link>
              <Link
                href="/attendance"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Presensi</span>
              </Link>
              <Link
                href="/leave"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Cuti & Izin</span>
              </Link>
              <Link
                href="/payroll"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Slip Gaji</span>
              </Link>
              {(user.role === "ADMIN" || user.role === "MANAGER") && (
                <Link
                  href="/reports"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Laporan</span>
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <Database className="w-4 h-4 text-rose-400" />
                  <span>Audit Log</span>
                </Link>
              )}
            </div>
          )}

          {/* User Profile & Logout */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-200">{user.fullName}</div>
                <div className="text-xs text-slate-400 flex items-center justify-end space-x-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    user.role === "ADMIN" ? "bg-rose-500" : user.role === "MANAGER" ? "bg-amber-500" : "bg-emerald-500"
                  }`}></span>
                  <span className="font-semibold text-slate-300">{user.role}</span>
                  {user.department && <span>• {user.department}</span>}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Keluar / Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

