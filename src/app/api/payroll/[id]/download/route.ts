import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json(
        { success: false, error: "Slip gaji tidak ditemukan" },
        { status: 404 }
      );
    }

    // Proteksi Anti-IDOR:
    if (payroll.userId !== session.userId && session.role !== "ADMIN") {
      await createAuditLog({
        actorId: session.userId,
        action: "ACCESS_DENIED_IDOR_PDF_DOWNLOAD",
        details: { attemptedPayrollId: id },
      });

      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak berhak mengunduh slip gaji ini." },
        { status: 403 }
      );
    }

    // 1. Inisialisasi Dokumen PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const formatRupiah = (num: number) =>
      "Rp " + num.toLocaleString("id-ID");

    // 2. Header Institusi
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KARYAGUARD ENTERPRISE", 20, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Secure Human Resource & Payroll Management System", 20, 23);

    // Badge Confidential
    doc.setTextColor(239, 68, 68); // Red
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("RAHASIA / CONFIDENTIAL", 150, 16);

    // 3. Info Karyawan & Periode
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text("SLIP GAJI KARYAWAN", 20, 44);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const startY = 52;
    doc.text(`Nama Karyawan : ${payroll.user.fullName}`, 20, startY);
    doc.text(`NIK           : ${payroll.user.nik}`, 20, startY + 6);
    doc.text(`Departemen    : ${payroll.user.department?.name || "-"}`, 20, startY + 12);

    doc.text(`Periode Gaji  : Bulan ${payroll.month} / ${payroll.year}`, 120, startY);
    doc.text(`Status        : ${payroll.status}`, 120, startY + 6);
    doc.text(`Tanggal Cetak : ${new Date().toLocaleDateString("id-ID")}`, 120, startY + 12);

    // Garis Pemisah
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.line(20, startY + 18, 190, startY + 18);

    // 4. Tabel Rincian Gaji (Penerimaan vs Potongan)
    const tableY = startY + 28;

    // Kolom Kiri: Penerimaan
    doc.setFont("helvetica", "bold");
    doc.text("KOMPONEN PENERIMAAN", 20, tableY);
    doc.setFont("helvetica", "normal");

    doc.text("Gaji Pokok", 20, tableY + 8);
    doc.text(formatRupiah(Number(payroll.baseSalary)), 80, tableY + 8, { align: "right" });

    doc.text("Tunjangan Tetap", 20, tableY + 16);
    doc.text(formatRupiah(Number(payroll.allowances)), 80, tableY + 16, { align: "right" });

    doc.text("Upah Lembur Terverifikasi", 20, tableY + 24);
    doc.text(formatRupiah(Number(payroll.overtimePay)), 80, tableY + 24, { align: "right" });

    const totalIncome =
      Number(payroll.baseSalary) +
      Number(payroll.allowances) +
      Number(payroll.overtimePay);

    doc.setFont("helvetica", "bold");
    doc.text("Total Penerimaan Kotor", 20, tableY + 34);
    doc.text(formatRupiah(totalIncome), 80, tableY + 34, { align: "right" });

    // Kolom Kanan: Potongan
    doc.text("KOMPONEN POTONGAN", 120, tableY);
    doc.setFont("helvetica", "normal");

    doc.text("Denda Keterlambatan", 120, tableY + 8);
    doc.text(formatRupiah(Number(payroll.lateDeduction)), 185, tableY + 8, { align: "right" });

    doc.text("Iuran BPJS Kesehatan (2%)", 120, tableY + 16);
    doc.text(formatRupiah(Number(payroll.insuranceDeduction)), 185, tableY + 16, { align: "right" });

    doc.text("Estimasi Pajak PPh 21 (5%)", 120, tableY + 24);
    doc.text(formatRupiah(Number(payroll.taxDeduction)), 185, tableY + 24, { align: "right" });

    const totalDeduction =
      Number(payroll.lateDeduction) +
      Number(payroll.insuranceDeduction) +
      Number(payroll.taxDeduction);

    doc.setFont("helvetica", "bold");
    doc.text("Total Potongan", 120, tableY + 34);
    doc.text(formatRupiah(totalDeduction), 185, tableY + 34, { align: "right" });

    // Kotak Total Gaji Bersih (Take-Home Pay)
    const boxY = tableY + 45;
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(20, boxY, 170, 20, 2, 2, "F");

    doc.setFontSize(11);
    doc.text("GAJI BERSIH (TAKE-HOME PAY) :", 28, boxY + 12);
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129); // Green-600
    doc.text(formatRupiah(Number(payroll.netSalary)), 180, boxY + 12, { align: "right" });

    // 5. QR Code Verifikasi Keabsahan & Hash
    const qrDataUrl = await QRCode.toDataURL(
      `https://karyaguard.vercel.app/verify/payroll?id=${payroll.id}&hash=${payroll.integrityHash.slice(0, 16)}`
    );

    doc.addImage(qrDataUrl, "PNG", 20, boxY + 28, 28, 28);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Pindai QR Code untuk memvalidasi integritas dokumen.", 54, boxY + 36);
    doc.text(`Digital Signature (SHA-256):`, 54, boxY + 42);
    doc.setFont("courier", "normal");
    doc.text(`${payroll.integrityHash.slice(0, 48)}...`, 54, boxY + 47);

    doc.setFont("helvetica", "normal");
    doc.text("Dokumen ini dihasilkan secara otomatis oleh sistem KaryaGuard dan sah tanpa tanda tangan basah.", 54, boxY + 53);

    // 6. Output PDF ArrayBuffer
    const pdfArrayBuffer = doc.output("arraybuffer");

    await createAuditLog({
      actorId: session.userId,
      action: "PAYROLL_PDF_DOWNLOADED",
      details: { payrollId: payroll.id },
    });

    return new NextResponse(pdfArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Slip_Gaji_${payroll.user.nik}_${payroll.month}_${payroll.year}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Download API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat berkas PDF slip gaji" },
      { status: 500 }
    );
  }
}

