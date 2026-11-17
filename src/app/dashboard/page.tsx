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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        user={{
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          department: user.department?.name,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-8 border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Trust Enterprise HRIS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Selamat Datang, {user.fullName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                NIK: <span className="font-mono text-slate-300">{user.nik}</span> • Departemen:{" "}
                <span className="text-slate-300">{user.department?.name || "Umum"}</span> • Penugasan:{" "}
                <span className="text-slate-300">{user.office?.name || "Kantor Pusat"}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/attendance"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition"
              >
                <Clock className="w-4 h-4" />
                <span>Presensi Selfie</span>
              </Link>
              <Link
                href="/leave"
                className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition"
              >
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Ajukan Cuti</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Status Presensi Hari Ini */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Presensi Hari Ini
                </span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Clock className="w-5 h-5" />
                </span>
              </div>
              <div className="text-xl font-bold text-white">
                {todayAttendance ? (
                  todayAttendance.checkInStatus === "ON_TIME" ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Tepat Waktu
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5" /> Terlambat ({todayAttendance.lateMinutes}m)
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">Belum Check-In</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {todayAttendance
                  ? `Masuk: ${new Date(todayAttendance.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • Jarak: ${Number(todayAttendance.checkInDistanceMeters).toFixed(0)}m`
                  : `Shift: ${user.shift?.startTime || "08:00"} - ${user.shift?.endTime || "17:00"}`}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/attendance"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-between group"
              >
                <span>Buka Kamera Presensi</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>

          {/* Card 2: Sisa Kuota Cuti */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sisa Kuota Cuti
                </span>
                <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Calendar className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {user.leaveBalance}{" "}
                <span className="text-sm font-normal text-slate-400">Hari</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Hak cuti tahunan yang dapat diajukan pada periode tahun berjalan.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/leave"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center justify-between group"
              >
                <span>Riwayat & Form Cuti</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>

          {/* Card 3: Slip Gaji Terbaru */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Slip Gaji Terbaru
                </span>
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="w-5 h-5" />
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {latestPayroll
                  ? `Rp ${Number(latestPayroll.netSalary).toLocaleString("id-ID")}`
                  : "Belum Diterbitkan"}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {latestPayroll
                  ? `Periode ${latestPayroll.month}/${latestPayroll.year} • Status: ${latestPayroll.status}`
                  : "Slip gaji bulan berjalan akan dikalkulasi oleh HR."}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/payroll"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-between group"
              >
                <span>Unduh Slip Resmi (PDF)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links Section & Recent History Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Riwayat Presensi Terakhir */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Riwayat Presensi Terbaru Anda</span>
              </h2>
              <Link href="/attendance" className="text-xs text-slate-400 hover:text-white transition">
                Lihat Semua
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jam Masuk</th>
                    <th className="py-3 px-4">Jarak Geofence</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {user.attendances.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Belum ada catatan presensi.
                      </td>
                    </tr>
                  ) : (
                    user.attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-medium text-white">
                          {new Date(att.date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {new Date(att.checkInTime).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                          {Number(att.checkInDistanceMeters).toFixed(1)} m
                        </td>
                        <td className="py-3.5 px-4">
                          {att.checkInStatus === "ON_TIME" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Tepat Waktu
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
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

          {/* Lokasi Kantor Terdaftar & Proteksi Keamanan */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-rose-400" />
                <span>Geofence Lokasi Kerja</span>
              </h2>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
                <div className="text-slate-200 font-semibold">{user.office?.name || "Kantor Pusat"}</div>
                <div className="text-slate-400">{user.office?.address || "Alamat kantor"}</div>
                <div className="pt-2 border-t border-slate-800/80 flex justify-between text-slate-400 font-mono">
                  <span>Radius Maksimal:</span>
                  <span className="text-emerald-400 font-bold">{user.office?.radiusMeters || 100} Meter</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Fitur Keamanan Terpasang</span>
              </h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Server-side Haversine Distance Validation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Anti-IDOR Strict Resource Ownership Guard</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Bcrypt Salt-12 & HttpOnly JWT Sesi</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Cryptographic SHA-256 Payroll Integrity</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

