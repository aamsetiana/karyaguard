"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  BarChart3,
  Download,
  Users,
  CheckCircle2,
  Clock,
  UserX,
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <span>Laporan & Analitik Kedisiplinan</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Rekapitulasi rasio kehadiran karyawan, ketepatan waktu, dan ekspor data audit presensi.
            </p>
          </div>

          <a
            href="/api/admin/reports?format=csv"
            download="Rekap_Presensi_Karyawan.csv"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Rekapitulasi (CSV)</span>
          </a>
        </div>

        {/* 4 Cards Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-slate-400">Total Karyawan</span>
              <span className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Karyawan aktif terdaftar</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-slate-400">Hadir Tepat Waktu</span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{stats?.onTimeCount || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Masuk sebelum batas toleransi</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-slate-400">Terlambat Masuk</span>
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-amber-400">{stats?.lateCount || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Dikenakan denda keterlambatan</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-slate-400">Tingkat Disiplin</span>
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-purple-400">{disciplineRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Rasio On-Time / Hadir</p>
          </div>
        </div>

        {/* Visual Progress Bars */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white">Distribusi Kehadiran Hari Ini</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Tepat Waktu (On-Time)</span>
                <span className="font-mono text-emerald-400">{stats?.onTimeCount || 0} Orang</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.totalUsers ? (stats.onTimeCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Terlambat (Late)</span>
                <span className="font-mono text-amber-400">{stats?.lateCount || 0} Orang</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.totalUsers ? (stats.lateCount / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Belum Presensi / Tidak Hadir</span>
                <span className="font-mono text-rose-400">{stats?.absentCount || 0} Orang</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div
                  className="bg-rose-500 h-3 rounded-full transition-all duration-500"
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

