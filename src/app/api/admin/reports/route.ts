import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
      return NextResponse.json({ success: false, error: "Akses Ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "csv" | "json"

    // 1. Ambil Statistik Kehadiran
    const totalUsers = await prisma.user.count({ where: { isActive: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendances = await prisma.attendance.findMany({
      where: { date: today },
    });

    const onTimeCount = todayAttendances.filter((a) => a.checkInStatus === "ON_TIME").length;
    const lateCount = todayAttendances.filter((a) => a.checkInStatus === "LATE").length;
    const absentCount = Math.max(0, totalUsers - todayAttendances.length);

    // 2. Jika format CSV diminta untuk export rekap presensi
    if (format === "csv") {
      const allAttendances = await prisma.attendance.findMany({
        include: {
          user: {
            select: { fullName: true, nik: true, department: { select: { name: true } } },
          },
        },
        orderBy: { date: "desc" },
        take: 500,
      });

      const header = "Tanggal,NIK,Nama Karyawan,Departemen,Jam Masuk,Status,Terlambat (Menit),Jam Pulang\n";
      const rows = allAttendances
        .map((a) => {
          const dateStr = a.date.toISOString().split("T")[0];
          const checkIn = a.checkInTime.toLocaleTimeString("id-ID");
          const checkOut = a.checkOutTime ? a.checkOutTime.toLocaleTimeString("id-ID") : "-";
          return `"${dateStr}","${a.user.nik}","${a.user.fullName}","${a.user.department?.name || "-"}","${checkIn}","${a.checkInStatus}",${a.lateMinutes},"${checkOut}"`;
        })
        .join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="Rekap_Presensi_Karyawan.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        todayPresent: todayAttendances.length,
        onTimeCount,
        lateCount,
        absentCount,
      },
    });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data laporan" }, { status: 500 });
  }
}

