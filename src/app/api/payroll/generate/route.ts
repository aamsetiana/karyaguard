import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePayrollSchema } from "@/lib/validations";
import { generatePayrollHash } from "@/lib/payroll-hash";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya HR Admin yang dapat menjalankan mesin penggajian." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = generatePayrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Bulan dan tahun tidak valid" },
        { status: 400 }
      );
    }

    const { month, year } = parsed.data;

    // Ambil rentang tanggal untuk bulan yang dipilih
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Ambil seluruh karyawan aktif
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        attendances: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        leaveRequests: {
          where: {
            status: "APPROVED",
            leaveType: "OVERTIME",
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const generatedPayrolls = [];

    for (const user of activeUsers) {
      const baseSalaryNum = Number(user.baseSalary) || 0;

      // 1. Tunjangan Tetap (Misal: 15% dari gaji pokok)
      const allowancesNum = Math.round(baseSalaryNum * 0.15);

      // 2. Hitung Denda Keterlambatan Absensi (Rp 1.000 per menit terlambat)
      const totalLateMinutes = user.attendances.reduce(
        (sum, att) => sum + (att.lateMinutes || 0),
        0
      );
      const lateDeductionNum = totalLateMinutes * 1000;

      // 3. Hitung Upah Lembur (Rp 30.000 per jam lembur terverifikasi)
      const totalOvertimeHours = user.leaveRequests.reduce(
        (sum, req) => sum + (req.totalDays * 8), // Estimasi 8 jam per overtime record
        0
      );
      const overtimePayNum = totalOvertimeHours * 30000;

      // 4. Potongan Wajib: BPJS (2%) & Pajak PPh21 Estimasi (5%)
      const insuranceDeductionNum = Math.round(baseSalaryNum * 0.02);
      const taxDeductionNum = Math.round(baseSalaryNum * 0.05);

      // 5. Total Take-Home Pay (Gaji Bersih)
      const netSalaryNum = Math.max(
        0,
        baseSalaryNum +
          allowancesNum +
          overtimePayNum -
          lateDeductionNum -
          insuranceDeductionNum -
          taxDeductionNum
      );

      // 6. Buat Kriptografi Hash SHA-256 Integritas
      const integrityHash = generatePayrollHash({
        userId: user.id,
        month,
        year,
        netSalary: netSalaryNum,
        baseSalary: baseSalaryNum,
      });

      // 7. Simpan atau perbarui (upsert) slip gaji
      const payrollRecord = await prisma.payroll.upsert({
        where: {
          userId_month_year: {
            userId: user.id,
            month,
            year,
          },
        },
        update: {
          baseSalary: baseSalaryNum,
          allowances: allowancesNum,
          overtimePay: overtimePayNum,
          lateDeduction: lateDeductionNum,
          taxDeduction: taxDeductionNum,
          insuranceDeduction: insuranceDeductionNum,
          netSalary: netSalaryNum,
          status: "PUBLISHED",
          integrityHash,
          publishedAt: new Date(),
        },
        create: {
          userId: user.id,
          month,
          year,
          baseSalary: baseSalaryNum,
          allowances: allowancesNum,
          overtimePay: overtimePayNum,
          lateDeduction: lateDeductionNum,
          taxDeduction: taxDeductionNum,
          insuranceDeduction: insuranceDeductionNum,
          netSalary: netSalaryNum,
          status: "PUBLISHED",
          integrityHash,
          publishedAt: new Date(),
        },
      });

      generatedPayrolls.push(payrollRecord);
    }

    await createAuditLog({
      actorId: session.userId,
      action: "PAYROLL_GENERATED_AND_PUBLISHED",
      details: {
        month,
        year,
        totalEmployeesProcessed: generatedPayrolls.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengkalkulasi dan menerbitkan ${generatedPayrolls.length} slip gaji periode ${month}/${year}.`,
      count: generatedPayrolls.length,
    });
  } catch (error) {
    console.error("Generate Payroll API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses perhitungan payroll." },
      { status: 500 }
    );
  }
}

