import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { verifyPayrollHash } from "@/lib/payroll-hash";

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
          select: {
            id: true,
            fullName: true,
            nik: true,
            email: true,
            bankName: true,
            bankAccountNo: true,
            department: { select: { name: true } },
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

    // =========================================================================
    // PERTAHANAN ANTI-IDOR (Insecure Direct Object Reference)
    // =========================================================================
    if (payroll.userId !== session.userId && session.role !== "ADMIN") {
      // Catat indikasi percobaan serangan IDOR ke dalam Audit Log
      await createAuditLog({
        actorId: session.userId,
        action: "ACCESS_DENIED_IDOR_ATTEMPT",
        details: {
          attemptedPayrollId: id,
          targetPayrollOwner: payroll.userId,
          requesterRole: session.role,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Akses Ditolak: Anda tidak memiliki otoritas untuk melihat slip gaji karyawan lain.",
        },
        { status: 403 }
      );
    }

    // Verifikasi Integritas Data Hash SHA-256
    const isIntegrityValid = verifyPayrollHash(
      {
        userId: payroll.userId,
        month: payroll.month,
        year: payroll.year,
        netSalary: Number(payroll.netSalary),
        baseSalary: Number(payroll.baseSalary),
      },
      payroll.integrityHash
    );

    // Masking nomor rekening jika non-admin
    let maskedBankNo = payroll.user.bankAccountNo;
    if (maskedBankNo && session.role !== "ADMIN") {
      maskedBankNo =
        maskedBankNo.length > 4
          ? "*".repeat(maskedBankNo.length - 4) + maskedBankNo.slice(-4)
          : maskedBankNo;
    }

    return NextResponse.json({
      success: true,
      payroll: {
        ...payroll,
        user: {
          ...payroll.user,
          bankAccountNo: maskedBankNo,
        },
      },
      integrityVerified: isIntegrityValid,
    });
  } catch (error) {
    console.error("Single Payroll GET API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data slip gaji" },
      { status: 500 }
    );
  }
}

