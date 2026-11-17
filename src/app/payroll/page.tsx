"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  FileText,
  Download,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRight,
} from "lucide-react";

export default function PayrollPage() {
  const [user, setUser] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Month & Year selection for calculation (Admin)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [profileRes, payrollRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/payroll"),
      ]);

      const profileData = await profileRes.json();
      const payrollData = await payrollRes.json();

      if (profileData.success) setUser(profileData.user);
      if (payrollData.success) setPayrolls(payrollData.payrolls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async () => {
    setCalculating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengkalkulasi payroll");
      }

      setMessage({ type: "success", text: data.message });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setCalculating(false);
    }
  };

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              <span>Slip Gaji & Penggajian (Payroll)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
              Slip gaji digital resmi dilengkapi tanda tangan integritas SHA-256 dan kode QR verifikasi keabsahan.
            </p>
          </div>

          {user?.role === "ADMIN" && (
            <div className="flex flex-wrap items-center gap-2.5 bg-[#0C121E] p-2 rounded-xl border border-white/[0.08]">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-black/40 text-xs border border-white/[0.08] rounded-lg py-1.5 px-2.5 text-white focus:outline-none"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Bulan {i + 1}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-black/40 text-xs border border-white/[0.08] rounded-lg py-1.5 px-2.5 text-white focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>

              <button
                onClick={handleCalculatePayroll}
                disabled={calculating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{calculating ? "Menghitung..." : "Hitung Payroll"}</span>
              </button>
            </div>
          )}
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

        {/* Tabel Slip Gaji */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/[0.06] flex justify-between items-center text-xs">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {user?.role === "ADMIN"
                  ? "Seluruh Rekapitulasi Slip Gaji Karyawan"
                  : "Daftar Slip Gaji Resmi Anda"}
              </span>
            </h2>
            <span className="text-slate-400 font-mono text-[11px]">Total: {payrolls.length} Dokumen</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase tracking-wider bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                <tr>
                  {user?.role === "ADMIN" && <th className="py-3 px-3.5">Karyawan</th>}
                  <th className="py-3 px-3.5">Periode</th>
                  <th className="py-3 px-3.5">Gaji Pokok</th>
                  <th className="py-3 px-3.5">Tunjangan & Lembur</th>
                  <th className="py-3 px-3.5">Potongan</th>
                  <th className="py-3 px-3.5 font-bold text-emerald-400">Take-Home Pay</th>
                  <th className="py-3 px-3.5">Digital Hash</th>
                  <th className="py-3 px-3.5 text-center">Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === "ADMIN" ? 8 : 7} className="py-8 text-center text-slate-500 font-light">
                      Belum ada data slip gaji yang diterbitkan.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      {user?.role === "ADMIN" && (
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-white">{p.user?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.user?.nik}</div>
                        </td>
                      )}
                      <td className="py-3 px-3.5 font-mono text-slate-200 whitespace-nowrap">
                        Bulan {p.month}/{p.year}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-300">
                        {formatRupiah(Number(p.baseSalary))}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-emerald-400">
                        +{formatRupiah(Number(p.allowances) + Number(p.overtimePay))}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-rose-400">
                        -{formatRupiah(Number(p.lateDeduction) + Number(p.taxDeduction) + Number(p.insuranceDeduction))}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">
                        {formatRupiah(Number(p.netSalary))}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          title={`SHA-256: ${p.integrityHash}`}
                        >
                          <Hash className="w-3 h-3" />
                          <span>{p.integrityHash.slice(0, 8)}...</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <a
                          href={`/api/payroll/${p.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.04] hover:bg-amber-600 hover:text-white text-slate-200 text-[11px] font-semibold rounded-lg border border-white/[0.08] transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
