import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        nik: true,
        role: true,
        phone: true,
        bankName: true,
        bankAccountNo: true,
        baseSalary: true,
        leaveBalance: true,
        department: { select: { id: true, name: true, code: true } },
        office: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,
            address: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            gracePeriodMinutes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Masking data sensitif rekening jika bukan admin
    let maskedBankNo = user.bankAccountNo;
    if (maskedBankNo && session.role !== "ADMIN") {
      maskedBankNo =
        maskedBankNo.length > 4
          ? "*".repeat(maskedBankNo.length - 4) + maskedBankNo.slice(-4)
          : maskedBankNo;
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        bankAccountNo: maskedBankNo,
      },
    });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}

