import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInSchema } from "@/lib/validations";
import { validateGeofence } from "@/lib/geofence";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    // 1. Rate Limiting Check-in (Maksimal 3 request per menit per user)
    const limiter = rateLimit(`attendance:${session.userId}`, 3, 60);
    if (!limiter.success) {
      return NextResponse.json(
        { success: false, error: "Mohon tunggu beberapa detik sebelum mencoba check-in kembali." },
        { status: 429 }
      );
    }

    // 2. Validasi Input Payload
    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Data presensi tidak valid" },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy, photo, notes } = parsed.data;

    // 3. Ambil Data Karyawan beserta Konfigurasi Kantor & Shift
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { office: true, shift: true },
    });

    if (!user || !user.office) {
      return NextResponse.json(
        { success: false, error: "Lokasi kantor belum ditentukan untuk akun Anda. Hubungi HR Admin." },
        { status: 400 }
      );
    }

    // 4. Validasi Geofencing Server-Side (Haversine Formula)
    const officePos = {
      latitude: Number(user.office.latitude),
      longitude: Number(user.office.longitude),
    };

    const userPos = {
      latitude,
      longitude,
      accuracy,
    };

    const geofenceResult = validateGeofence(
      userPos,
      officePos,
      user.office.radiusMeters
    );

    if (!geofenceResult.isWithinBounds) {
      await createAuditLog({
        actorId: session.userId,
        action: "ATTENDANCE_CHECKIN_REJECTED_OUT_OF_BOUNDS",
        details: {
          distanceMeters: geofenceResult.distanceMeters,
          allowedRadius: user.office.radiusMeters,
          userCoords: { latitude, longitude },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: geofenceResult.error || "Anda berada di luar radius kantor yang diizinkan.",
        },
        { status: 400 }
      );
    }

    // 5. Cek apakah sudah check-in hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.userId,
        date: today,
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, error: "Anda sudah melakukan presensi check-in hari ini." },
        { status: 400 }
      );
    }

    // 6. Evaluasi Jam Masuk & Keterlambatan
    let checkInStatus: "ON_TIME" | "LATE" = "ON_TIME";
    let lateMinutes = 0;

    if (user.shift && user.shift.startTime) {
      const now = new Date();
      const [shiftHour, shiftMinute] = user.shift.startTime.split(":").map(Number);
      const shiftStartTime = new Date(now);
      shiftStartTime.setHours(shiftHour, shiftMinute, 0, 0);

      // Tambahkan batas toleransi keterlambatan (grace period)
      const allowedTime = new Date(
        shiftStartTime.getTime() + user.shift.gracePeriodMinutes * 60 * 1000
      );

      if (now > allowedTime) {
        checkInStatus = "LATE";
        lateMinutes = Math.floor(
          (now.getTime() - shiftStartTime.getTime()) / (1000 * 60)
        );
      }
    }

    // 7. Simpan Record Presensi ke Database
    const attendance = await prisma.attendance.create({
      data: {
        userId: session.userId,
        date: today,
        checkInTime: new Date(),
        checkInLat: latitude,
        checkInLng: longitude,
        checkInDistanceMeters: geofenceResult.distanceMeters,
        checkInPhotoUrl: photo,
        checkInStatus,
        lateMinutes,
        notes: notes || null,
      },
    });

    // 8. Catat Audit Log Keberhasilan
    await createAuditLog({
      actorId: session.userId,
      action: "ATTENDANCE_CHECKIN_SUCCESS",
      details: {
        attendanceId: attendance.id,
        status: checkInStatus,
        lateMinutes,
        distanceMeters: geofenceResult.distanceMeters,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        checkInStatus === "LATE"
          ? `Check-in berhasil tercatat (Terlambat ${lateMinutes} menit).`
          : "Check-in berhasil tercatat tepat waktu.",
      attendance: {
        id: attendance.id,
        checkInTime: attendance.checkInTime,
        status: attendance.checkInStatus,
        distanceMeters: attendance.checkInDistanceMeters,
      },
    });
  } catch (error) {
    console.error("Attendance Check-In API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses presensi kehadiran." },
      { status: 500 }
    );
  }
}

