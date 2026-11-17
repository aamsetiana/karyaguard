import { NextResponse } from "next/server";
import { getCurrentSession, clearSessionCookie } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getCurrentSession();

    if (session) {
      await createAuditLog({
        actorId: session.userId,
        action: "AUTH_LOGOUT",
      });
    }

    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses logout" },
      { status: 500 }
    );
  }
}

