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
    const requestedUserId = searchParams.get("userId");

    // Proteksi Anti-IDOR:
    // Jika EMPLOYEE mencoba mengintip data user lain, tolak!
    if (session.role === "EMPLOYEE" && requestedUserId && requestedUserId !== session.userId) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak diizinkan melihat presensi karyawan lain." },
        { status: 403 }
      );
    }

    const targetUserId = session.role === "EMPLOYEE" ? session.userId : (requestedUserId || undefined);

    const attendances = await prisma.attendance.findMany({
      where: {
        ...(targetUserId && { userId: targetUserId }),
        ...(session.role === "MANAGER" && !targetUserId && session.departmentId
          ? { user: { departmentId: session.departmentId } }
          : {}),
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
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      attendances,
    });
  } catch (error) {
    console.error("Attendance History API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data riwayat presensi" },
      { status: 500 }
    );
  }
}

