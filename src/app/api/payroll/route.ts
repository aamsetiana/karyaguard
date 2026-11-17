import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

    // Proteksi Anti-IDOR: Non-admin hanya bisa melihat payroll miliknya sendiri
    const isRestrictedUser = session.role !== "ADMIN";

    const payrolls = await prisma.payroll.findMany({
      where: {
        ...(isRestrictedUser ? { userId: session.userId } : {}),
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nik: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({
      success: true,
      payrolls,
    });
  } catch (error) {
    console.error("Payroll GET API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data payroll" },
      { status: 500 }
    );
  }
}

