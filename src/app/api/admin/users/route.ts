import { NextResponse } from "next/server";
import { getCurrentSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerUserSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses Ditolak" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        nik: true,
        role: true,
        phone: true,
        bankName: true,
        bankAccountNo: true,
        baseSalary: true,
        leaveBalance: true,
        isActive: true,
        department: { select: { id: true, name: true } },
        office: { select: { id: true, name: true, radiusMeters: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal mengambil daftar pengguna" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses Ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = registerUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Data pengguna tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Cek duplikasi email atau NIK
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { nik: data.nik }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email atau NIK sudah terdaftar dalam sistem." },
        { status: 400 }
      );
    }

    // Hash Password Menggunakan Bcrypt
    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        nik: data.nik,
        role: data.role,
        phone: data.phone || null,
        bankName: data.bankName || null,
        bankAccountNo: data.bankAccountNo || null,
        baseSalary: data.baseSalary,
        departmentId: data.departmentId || null,
        officeId: data.officeId || null,
        shiftId: data.shiftId || null,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      action: "ADMIN_CREATE_USER",
      details: { newUserId: newUser.id, email: newUser.email, role: newUser.role },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${newUser.fullName} (${newUser.role}) berhasil dibuat.`,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Create User API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambahkan pengguna" }, { status: 500 });
  }
}

