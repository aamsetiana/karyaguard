"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
} from "lucide-react";

export default function AuditLogsPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [profileRes, logsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/audit-logs"),
      ]);

      const profileData = await profileRes.json();
      const logsData = await logsRes.json();

      if (profileData.success) setUser(profileData.user);
      if (logsData.success) setLogs(logsData.auditLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-rose-400" />
              <span>Jejak Audit Keamanan (Security Audit Trail)</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Catatan log aktivitas kritis dan deteksi anomali yang disimpan secara *immutable* untuk keperluan audit forensik.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aksi, aktor, atau IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Tabel Audit Logs */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Menampilkan {filteredLogs.length} dari {logs.length} catatan aktivitas terbaru</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Tamper-Resistant Storage</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Aksi / Event</th>
                  <th className="py-3 px-4">Aktor / Pengguna</th>
                  <th className="py-3 px-4">Alamat IP</th>
                  <th className="py-3 px-4">Detail JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada catatan audit yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isAlert =
                      log.action.includes("DENIED") ||
                      log.action.includes("REJECTED") ||
                      log.action.includes("FAILED");

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isAlert
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isAlert ? (
                              <ShieldAlert className="w-3 h-3" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>{log.action}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {log.actor ? (
                            <div>
                              <div className="font-sans font-medium text-white">{log.actor.fullName}</div>
                              <div className="text-[10px] text-slate-400">{log.actor.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Sistem / Anonim</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{log.ipAddress || "127.0.0.1"}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

