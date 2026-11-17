"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-400" />
            <span>Manajemen Cuti & Izin Karyawan</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pengajuan izin, cuti tahunan, dan verifikasi lembur dengan sistem persetujuan bertingkat (*multi-tier workflow*).
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{message.type === "success" ? "Berhasil" : "Gagal"}</p>
              <p className="mt-0.5">{message.text}</p>
            </div>
          </div>
        )}

        {/* Manager/Admin Approval Section */}
        {(user?.role === "MANAGER" || user?.role === "ADMIN") && pendingApprovals.length > 0 && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-amber-500/30 shadow-lg shadow-amber-950/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Permohonan Cuti Tim Menunggu Persetujuan ({pendingApprovals.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Karyawan</th>
                    <th className="py-3 px-4">Tipe Cuti</th>
                    <th className="py-3 px-4">Rentang Tanggal</th>
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingApprovals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{item.user.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.user.nik}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {new Date(item.startDate).toLocaleDateString("id-ID")} s/d{" "}
                        {new Date(item.endDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-200">
                        {item.totalDays} Hari
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleAction(item.id, "APPROVE")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleAction(item.id, "REJECT")}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Pengajuan Cuti */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-400" />
              <span>Formulir Permohonan</span>
            </h2>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Sisa Kuota Cuti Tahunan:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {user?.leaveBalance ?? "-"} Hari
              </span>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Jenis Cuti / Izin</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ANNUAL">Cuti Tahunan (Annual Leave)</option>
                  <option value="SICK">Izin Sakit (Medical Leave)</option>
                  <option value="EMERGENCY">Izin Darurat (Emergency)</option>
                  <option value="OVERTIME">Klaim Jam Lembur (Overtime)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  placeholder="Jelaskan keperluan atau keterangan cuti Anda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold rounded-xl shadow-lg shadow-sky-950/40 transition"
              >
                {submitting ? "Memproses..." : "Kirim Pengajuan"}
              </button>
            </form>
          </div>

          {/* Riwayat Pengajuan Cuti Pribadi */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-sky-400" />
              <span>Riwayat Pengajuan Cuti Anda</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Hari</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaves.filter((l) => l.userId === user?.id).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                        Belum ada riwayat permohonan cuti.
                      </td>
                    </tr>
                  ) : (
                    leaves
                      .filter((l) => l.userId === user?.id)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-medium text-white">{item.leaveType}</td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-300">
                            {new Date(item.startDate).toLocaleDateString("id-ID")} -{" "}
                            {new Date(item.endDate).toLocaleDateString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-xs">{item.totalDays} Hari</td>
                          <td className="py-3 px-4">
                            {item.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                              </span>
                            ) : item.status === "REJECTED" ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3.5 h-3.5" /> Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" /> Menunggu
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
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

