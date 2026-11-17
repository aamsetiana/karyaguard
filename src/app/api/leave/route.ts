import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leaveRequestSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

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
    const filterStatus = searchParams.get("status") as any;

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        ...(session.role === "EMPLOYEE" ? { userId: session.userId } : {}),
        ...(session.role === "MANAGER" && session.departmentId
          ? { user: { departmentId: session.departmentId } }
          : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nik: true,
            leaveBalance: true,
            department: { select: { name: true } },
          },
        },
        approver: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error("Leave GET API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar cuti" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = leaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Data pengajuan tidak valid" },
        { status: 400 }
      );
    }

    const { leaveType, startDate, endDate, reason, attachmentUrl } = parsed.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { success: false, error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." },
        { status: 400 }
      );
    }

    // Hitung total hari cuti
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Cek sisa kuota cuti jika jenisnya ANNUAL (Cuti Tahunan)
    if (leaveType === "ANNUAL") {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { leaveBalance: true },
      });

      if (!user || user.leaveBalance < totalDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Sisa kuota cuti tahunan Anda tidak mencukupi (Tersisa: ${user?.leaveBalance || 0} hari, Diajukan: ${totalDays} hari).`,
          },
          { status: 400 }
        );
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: session.userId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        attachmentUrl: attachmentUrl || null,
        status: "PENDING",
      },
    });

    await createAuditLog({
      actorId: session.userId,
      action: "LEAVE_REQUEST_SUBMITTED",
      details: {
        leaveRequestId: leaveRequest.id,
        leaveType,
        totalDays,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan izin/cuti berhasil diajukan dan sedang menunggu persetujuan.",
      leaveRequest,
    });
  } catch (error) {
    console.error("Leave POST API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pengajuan cuti" },
      { status: 500 }
    );
  }
}

