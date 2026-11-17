import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi" }, { status: 401 });
    }

    const offices = await prisma.office.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, offices });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal mengambil data kantor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses Ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const { name, latitude, longitude, radiusMeters, address } = body;

    const office = await prisma.office.create({
      data: {
        name,
        latitude,
        longitude,
        radiusMeters: Number(radiusMeters) || 50,
        address,
      },
    });

    return NextResponse.json({ success: true, office });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal menambahkan data kantor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const { officeId, name, latitude, longitude, radiusMeters, address } = body;

    // Cari target office
    let targetOfficeId = officeId;
    if (!targetOfficeId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { officeId: true },
      });
      targetOfficeId = user?.officeId;
    }

    if (!targetOfficeId) {
      const firstOffice = await prisma.office.findFirst();
      targetOfficeId = firstOffice?.id;
    }

    if (!targetOfficeId) {
      return NextResponse.json({ success: false, error: "Data kantor tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.office.update({
      where: { id: targetOfficeId },
      data: {
        ...(name && { name }),
        ...(latitude !== undefined && { latitude: Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
        ...(radiusMeters !== undefined && { radiusMeters: Number(radiusMeters) }),
        ...(address && { address }),
      },
    });

    // Pastikan user saat ini ditugaskan ke kantor ini
    await prisma.user.update({
      where: { id: session.userId },
      data: { officeId: updated.id },
    });

    return NextResponse.json({
      success: true,
      message: `Lokasi kantor "${updated.name}" berhasil diperbarui.`,
      office: updated,
    });
  } catch (error) {
    console.error("Update office error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui konfigurasi kantor" },
      { status: 500 }
    );
  }
}
