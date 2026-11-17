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

