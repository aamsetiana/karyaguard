import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses Ditolak" }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, auditLogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal mengambil audit log" }, { status: 500 });
  }
}

