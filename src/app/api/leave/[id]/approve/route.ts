import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(
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

    if (session.role !== "MANAGER" && session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Manager atau HR Admin yang dapat menyetujui cuti." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action, rejectionReason } = body; // action: "APPROVE" | "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { success: false, error: "Aksi tidak valid. Pilih APPROVE atau REJECT." },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: "Data pengajuan cuti tidak ditemukan." },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Pengajuan ini sudah berstatus ${leaveRequest.status} dan tidak dapat diubah kembali.`,
        },
        { status: 400 }
      );
    }

    // Eksekusi transaksi database secara atomic
    const updated = await prisma.$transaction(async (tx) => {
      if (action === "APPROVE") {
        // Jika cuti tahunan, potong kuota cuti user
        if (leaveRequest.leaveType === "ANNUAL") {
          await tx.user.update({
            where: { id: leaveRequest.userId },
            data: {
              leaveBalance: {
                decrement: leaveRequest.totalDays,
              },
            },
          });
        }

        return tx.leaveRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedById: session.userId,
            processedAt: new Date(),
          },
        });
      } else {
        return tx.leaveRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            approvedById: session.userId,
            rejectionReason: rejectionReason || "Tidak disetujui oleh atasan.",
            processedAt: new Date(),
          },
        });
      }
    });

    await createAuditLog({
      actorId: session.userId,
      action: action === "APPROVE" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      details: {
        leaveRequestId: id,
        targetUserId: leaveRequest.userId,
        action,
        reason: rejectionReason || null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Pengajuan cuti berhasil disetujui."
          : "Pengajuan cuti ditolak.",
      leaveRequest: updated,
    });
  } catch (error) {
    console.error("Leave Approval API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses persetujuan cuti." },
      { status: 500 }
    );
  }
}

