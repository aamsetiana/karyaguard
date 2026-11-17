"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  Send,
  FileText,
} from "lucide-react";

export default function LeavePage() {
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [leaveType, setLeaveType] = useState<string>("ANNUAL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [profileRes, leaveRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/leave"),
      ]);

      const profileData = await profileRes.json();
      const leaveData = await leaveRes.json();

      if (profileData.success) setUser(profileData.user);
      if (leaveData.success) setLeaves(leaveData.leaveRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan permohonan cuti");
      }

      setMessage({ type: "success", text: data.message });
      setReason("");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch(`/api/leave/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses aksi");
      }

      setMessage({ type: "success", text: data.message });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const pendingApprovals = leaves.filter(
    (l) => l.status === "PENDING" && l.userId !== user?.id
  );

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
            <span>Manajemen Cuti & Izin Karyawan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
            Alur pengajuan cuti tahunan, izin sakit, dan klaim lembur dengan verifikasi bertingkat (*multi-tier workflow*).
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{message.type === "success" ? "Berhasil" : "Gagal"}</p>
              <p className="mt-0.5">{message.text}</p>
            </div>
          </div>
        )}

        {/* Manager/Admin Pending Approvals Section */}
        {(user?.role === "MANAGER" || user?.role === "ADMIN") && pendingApprovals.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#0C121E] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <UserCheck className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Permohonan Cuti Tim Menunggu Persetujuan ({pendingApprovals.length})
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] uppercase tracking-wider bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-3.5">Karyawan</th>
                    <th className="py-3 px-3.5">Tipe Cuti</th>
                    <th className="py-3 px-3.5">Rentang Tanggal</th>
                    <th className="py-3 px-3.5">Durasi</th>
                    <th className="py-3 px-3.5">Alasan</th>
                    <th className="py-3 px-3.5 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {pendingApprovals.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white">{item.user.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.user.nik}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                          {item.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                        {new Date(item.startDate).toLocaleDateString("id-ID")} -{" "}
                        {new Date(item.endDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-200">
                        {item.totalDays} Hari
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 max-w-xs truncate font-light">
                        {item.reason}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleAction(item.id, "APPROVE")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg shadow-sm transition"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleAction(item.id, "REJECT")}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded-lg shadow-sm transition"
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Permohonan Cuti */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Formulir Pengajuan</span>
            </h2>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-xs flex justify-between items-center">
              <span className="text-slate-400">Sisa Kuota Cuti Tahunan:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {user?.leaveBalance ?? "-"} Hari
              </span>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Jenis Permohonan</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-xs"
                >
                  <option value="ANNUAL">Cuti Tahunan (Annual Leave)</option>
                  <option value="SICK">Izin Sakit (Medical Leave)</option>
                  <option value="EMERGENCY">Izin Darurat (Emergency)</option>
                  <option value="OVERTIME">Klaim Jam Lembur (Overtime)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alasan Permohonan</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tuliskan keterangan permohonan izin Anda..."
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-xs font-light"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-950/40 transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Mengirim..." : "Kirim Pengajuan"}</span>
              </button>
            </form>
          </div>

          {/* Riwayat Pengajuan Cuti Pribadi */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Riwayat Pengajuan Cuti Anda</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] uppercase tracking-wider bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-3.5">Tipe</th>
                    <th className="py-3 px-3.5">Periode</th>
                    <th className="py-3 px-3.5">Durasi</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {leaves.filter((l) => l.userId === user?.id).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-light">
                        Belum ada riwayat permohonan cuti.
                      </td>
                    </tr>
                  ) : (
                    leaves
                      .filter((l) => l.userId === user?.id)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-3.5 font-semibold text-white">{item.leaveType}</td>
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            {new Date(item.startDate).toLocaleDateString("id-ID")} -{" "}
                            {new Date(item.endDate).toLocaleDateString("id-ID")}
                          </td>
                          <td className="py-3 px-3.5">{item.totalDays} Hari</td>
                          <td className="py-3 px-3.5">
                            {item.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Disetujui
                              </span>
                            ) : item.status === "REJECTED" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3" /> Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" /> Menunggu
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-slate-400 max-w-xs truncate font-light">
                            {item.rejectionReason || item.reason}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
