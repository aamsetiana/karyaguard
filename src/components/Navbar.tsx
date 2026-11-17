"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {
  Shield,
  Clock,
  Calendar,
  FileText,
  BarChart3,
  Database,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface NavbarProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    department?: any;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: ShieldCheck, show: true },
    { href: "/attendance", label: "Presensi", icon: Clock, show: true },
    { href: "/leave", label: "Cuti & Izin", icon: Calendar, show: true },
    { href: "/payroll", label: "Slip Gaji", icon: FileText, show: true },
    {
      href: "/reports",
      label: "Laporan",
      icon: BarChart3,
      show: user?.role === "ADMIN" || user?.role === "MANAGER",
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Log",
      icon: Database,
      show: user?.role === "ADMIN",
    },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          dot: "bg-rose-400",
          label: "HR Admin",
        };
      case "MANAGER":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          dot: "bg-amber-400",
          label: "Manager",
        };
      default:
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-400",
          label: "Karyawan",
        };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;
  const departmentName =
    typeof user?.department === "object" && user?.department !== null
      ? user.department.name
      : user?.department;

  return (
    <nav className="sticky top-0 z-50 bg-[#090D16]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <BrandLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white leading-none">
                Karya<span className="text-emerald-400">Guard</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-medium mt-0.5">
                Enterprise HRIS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? "bg-white/[0.08] text-white shadow-inner font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-emerald-400" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Right Side: User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Profile Pill (Desktop) */}
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/[0.08]">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {departmentName || user.email}
                    </div>
                  </div>

                  {badge && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      <span>{badge.label}</span>
                    </span>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Keluar / Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition"
                  aria-label="Toggle Navigation"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 transition"
                >
                  Masuk Portal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {user && mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0B101B]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {/* User mini banner on mobile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">{user.fullName}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {user.email}
              </div>
            </div>
            {badge && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                <span>{badge.label}</span>
              </span>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20"
                        : "text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-emerald-400" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                );
              })}
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
