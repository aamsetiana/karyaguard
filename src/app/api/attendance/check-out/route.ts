import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi telah berakhir." },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.userId,
        date: today,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Anda belum melakukan check-in hari ini." },
        { status: 400 }
      );
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        { success: false, error: "Anda sudah melakukan check-out hari ini." },
        { status: 400 }
      );
    }

    let lat = null;
    let lng = null;
    try {
      const body = await request.json();
      lat = body.latitude;
      lng = body.longitude;
    } catch {
      // Body opsional untuk check-out
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
        checkOutLat: lat ? Number(lat) : null,
        checkOutLng: lng ? Number(lng) : null,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      action: "ATTENDANCE_CHECKOUT_SUCCESS",
      details: { attendanceId: updated.id },
    });

    return NextResponse.json({
      success: true,
      message: "Check-out berhasil dicatat. Selamat beristirahat!",
      attendance: {
        id: updated.id,
        checkOutTime: updated.checkOutTime,
      },
    });
  } catch (error) {
    console.error("Attendance Check-Out API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses check-out." },
      { status: 500 }
    );
  }
}

