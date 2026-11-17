import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Clock,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      department: true,
      office: true,
      shift: true,
      attendances: {
        orderBy: { date: "desc" },
        take: 5,
      },
      payrolls: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendance = user.attendances.find(
    (a) => new Date(a.date).toDateString() === today.toDateString()
  );

  const latestPayroll = user.payrolls[0];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      <Navbar
        user={{
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          department: user.department?.name,
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
        {/* Profile & Welcome Banner */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Sesi Aktif Terenkripsi (HttpOnly)</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Selamat Datang, {user.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-light">
              NIK: <span className="font-mono text-slate-200 font-medium">{user.nik}</span> • Divisi:{" "}
              <span className="text-slate-200 font-medium">{user.department?.name || "Umum"}</span> • Penugasan:{" "}
              <span className="text-slate-200 font-medium">{user.office?.name || "Pusat"}</span>
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
            <Link
              href="/attendance"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition"
            >
              <Clock className="w-4 h-4" />
              <span>Presensi Kamera</span>
            </Link>
            <Link
              href="/leave"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-medium text-xs px-4 py-2.5 rounded-xl border border-white/[0.08] transition"
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Ajukan Izin</span>
            </Link>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Presensi Hari Ini */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Presensi Hari Ini
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </span>
              </div>

              <div className="text-lg sm:text-xl font-bold text-white">
                {todayAttendance ? (
                  todayAttendance.checkInStatus === "ON_TIME" ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>Hadir Tepat Waktu</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>Terlambat ({todayAttendance.lateMinutes}m)</span>
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 font-normal">Belum Presensi Masuk</span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                {todayAttendance
                  ? `Masuk: ${new Date(todayAttendance.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • Jarak: ${Number(todayAttendance.checkInDistanceMeters).toFixed(0)}m`
                  : `Jadwal Shift: ${user.shift?.startTime || "08:00"} - ${user.shift?.endTime || "17:00"}`}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <Link
                href="/attendance"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-between group"
              >
                <span>Buka Form Presensi</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Card 2: Sisa Kuota Cuti */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Sisa Kuota Cuti
                </span>
                <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {user.leaveBalance}{" "}
                <span className="text-xs font-normal text-slate-400">Hari Tersisa</span>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 font-light">
                Dapat digunakan untuk pengajuan cuti tahunan dengan persetujuan atasan.
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <Link
                href="/leave"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center justify-between group"
              >
                <span>Riwayat & Form Cuti</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Card 3: Slip Gaji Terbaru */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 flex flex-col justify-between space-y-4 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Slip Gaji Terbaru
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
              </div>

              <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                {latestPayroll
                  ? `Rp ${Number(latestPayroll.netSalary).toLocaleString("id-ID")}`
                  : "Belum Diterbitkan"}
              </div>

              <p className="text-[11px] text-slate-400 mt-2 font-light">
                {latestPayroll
                  ? `Periode Bulan ${latestPayroll.month}/${latestPayroll.year} • Status: ${latestPayroll.status}`
                  : "Gaji bulanan akan dihitung otomatis oleh HR Admin."}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <Link
                href="/payroll"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-between group"
              >
                <span>Unduh Slip Resmi (PDF)</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Content Section: Table & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table Riwayat Presensi Terbaru */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Riwayat Presensi Terbaru Anda</span>
              </h2>
              <Link
                href="/attendance"
                className="text-[11px] text-slate-400 hover:text-white transition"
              >
                Buka Kamera Presensi &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] uppercase tracking-wider bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-3.5">Tanggal</th>
                    <th className="py-3 px-3.5">Jam Masuk</th>
                    <th className="py-3 px-3.5">Jarak Kantor</th>
                    <th className="py-3 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {user.attendances.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-light">
                        Belum ada catatan presensi kehadiran.
                      </td>
                    </tr>
                  ) : (
                    user.attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-3.5 font-medium text-white whitespace-nowrap">
                          {new Date(att.date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3.5 font-mono">
                          {new Date(att.checkInTime).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-400">
                          {Number(att.checkInDistanceMeters).toFixed(0)} m
                        </td>
                        <td className="py-3 px-3.5">
                          {att.checkInStatus === "ON_TIME" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Tepat Waktu
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Terlambat ({att.lateMinutes}m)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Geofence Info & Security Safeguards */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Geofence Lokasi Kantor</span>
              </h2>

              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-xs space-y-2">
                <div className="font-semibold text-white">{user.office?.name || "Kantor Pusat"}</div>
                <div className="text-slate-400 text-[11px] font-light leading-relaxed">
                  {user.office?.address || "Alamat kantor"}
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Radius Toleransi:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {user.office?.radiusMeters || 100} Meter
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Pencegahan Keamanan Aktif
              </span>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Anti-IDOR Strict Resource Ownership</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Server-Side Haversine Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>SHA-256 Payroll Tamper-Proof Seal</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
