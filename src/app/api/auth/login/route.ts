import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    // 1. Rate Limiting: Maksimal 5 percobaan login dalam 60 detik per IP
    const limiter = rateLimit(`login:${ip}`, 5, 60);
    if (!limiter.success) {
      await createAuditLog({
        action: "AUTH_RATE_LIMIT_EXCEEDED",
        ipAddress: ip,
        details: { resetInSeconds: limiter.resetInSeconds },
      });

      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan login. Silakan tunggu ${limiter.resetInSeconds} detik lagi.`,
        },
        { status: 429 }
      );
    }

    // 2. Validasi Input Payload
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 3. Cari User Berdasarkan Email (Prepared Query via Prisma)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true, office: true, shift: true },
    });

    if (!user || !user.isActive) {
      await createAuditLog({
        action: "AUTH_LOGIN_FAILED_UNKNOWN_USER",
        ipAddress: ip,
        details: { attemptedEmail: email },
      });

      return NextResponse.json(
        { success: false, error: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // 4. Verifikasi Password Hashing (bcrypt)
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await createAuditLog({
        actorId: user.id,
        action: "AUTH_LOGIN_FAILED_WRONG_PASSWORD",
        ipAddress: ip,
        details: { email: user.email },
      });

      return NextResponse.json(
        { success: false, error: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // 5. Buat Sesi Token JWT
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      officeId: user.officeId,
      shiftId: user.shiftId,
    });

    // 6. Pasang Secure HttpOnly Cookie
    await setSessionCookie(token);

    // 7. Catat Audit Log Keberhasilan
    await createAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN_SUCCESS",
      ipAddress: ip,
      details: { role: user.role },
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department?.name || null,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}

