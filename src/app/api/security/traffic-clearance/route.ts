import { NextResponse } from "next/server";
import { generateClearanceToken, CLEARANCE_COOKIE_NAME } from "@/lib/anti-ddos";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const token = await generateClearanceToken(clientIp);

    const response = NextResponse.json({
      success: true,
      message: "Verifikasi kriptografi selesai. Akses ke sistem diberikan.",
      clearanceGranted: true,
      shield: "KaryaGuard Enterprise Zero-Trust Traffic Gate",
    });

    response.cookies.set({
      name: CLEARANCE_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60, // Valid 12 jam
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses verifikasi trafik." },
      { status: 500 }
    );
  }
}

