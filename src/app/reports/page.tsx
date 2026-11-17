"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/reports"),
      ]);

      const profileData = await profileRes.json();
      const statsData = await statsRes.json();

      if (profileData.success) setUser(profileData.user);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const disciplineRate =
    stats && stats.todayPresent > 0
      ? Math.round((stats.onTimeCount / stats.todayPresent) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <span>Laporan & Analitik Kedisiplinan</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
              Rekapitulasi rasio kehadiran karyawan, ketepatan waktu, dan ekspor data audit presensi.
            </p>
          </div>

          <a
            href="/api/admin/reports?format=csv"
            download="Rekap_Presensi_Karyawan.csv"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Rekapitulasi (CSV)</span>
          </a>
        </div>

        {/* 4 Cards Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Karyawan</span>
              <span className="w-8 h-8 rounded-lg bg-white/[0.04] text-slate-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{stats?.totalUsers || 0}</div>
            <p className="text-[11px] text-slate-400 font-light">Karyawan aktif terdaftar dalam sistem</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Hadir Tepat Waktu</span>
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">{stats?.onTimeCount || 0}</div>
            <p className="text-[11px] text-slate-400 font-light">Masuk sebelum batas toleransi shift</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Terlambat Masuk</span>
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{stats?.lateCount || 0}</div>
            <p className="text-[11px] text-slate-400 font-light">Dikenakan penalti potongan denda</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Tingkat Disiplin</span>
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">{disciplineRate}%</div>
            <p className="text-[11px] text-slate-400 font-light">Rasio kehadiran tepat waktu</p>
          </div>
        </div>

        {/* Visual Progress Bars */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-6">
          <h2 className="text-sm font-bold text-white">Distribusi Kehadiran Hari Ini</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Tepat Waktu (On-Time)</span>
                <span className="font-mono text-emerald-400">{stats?.onTimeCount || 0} Karyawan</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2.5 border border-white/[0.06] overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.totalUsers ? (stats.onTimeCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Terlambat (Late)</span>
                <span className="font-mono text-amber-400">{stats?.lateCount || 0} Karyawan</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2.5 border border-white/[0.06] overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.totalUsers ? (stats.lateCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Belum Presensi / Tidak Hadir</span>
                <span className="font-mono text-rose-400">{stats?.absentCount || 0} Karyawan</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2.5 border border-white/[0.06] overflow-hidden">
                <div
                  className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.totalUsers ? (stats.absentCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
