import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { checkAntiDDoS } from "@/lib/anti-ddos";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "karyaguard_super_secret_jwt_encryption_key_2026_xyz"
);

const COOKIE_NAME = "karyaguard_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, aset internal Next.js, dan favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // 1. Layer 7 Anti-DDoS & HTTP Flood Inspection
  // ---------------------------------------------------------------------------
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = request.headers.get("user-agent");
  const isApiRoute = pathname.startsWith("/api");

  const ddosCheck = checkAntiDDoS(clientIp, userAgent, isApiRoute);

  if (!ddosCheck.allowed) {
    const status = ddosCheck.statusCode || 429;
    const retryAfter = ddosCheck.retryAfterSeconds || 60;

    // Response JSON jika request berasal dari API / fetch
    if (isApiRoute || request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: ddosCheck.reason || "Lalu lintas terlalu padat. Perlindungan Anti-DDoS aktif.",
          retryAfterSeconds: retryAfter,
          isJailed: ddosCheck.isJailed || false,
        },
        {
          status,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(ddosCheck.limit || 150),
            "X-RateLimit-Remaining": "0",
            "X-Security-Shield": "KaryaGuard Enterprise Anti-DDoS",
          },
        }
      );
    }

    // Response HTML Anti-DDoS Challenge page jika navigasi browser
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>429 - Perlindungan Anti-DDoS Aktif | KaryaGuard</title>
  <style>
    body { background-color: #090D16; color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
    .card { background: #0C121E; border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 1.25rem; padding: 2.25rem; max-width: 480px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6); }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(244, 63, 94, 0.15); color: #FB7185; border: 1px solid rgba(244, 63, 94, 0.3); padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1.25rem; letter-spacing: 0.05em; }
    h1 { font-size: 1.35rem; font-weight: 800; margin: 0 0 0.75rem 0; color: #FFFFFF; }
    p { font-size: 0.875rem; color: #94A3B8; line-height: 1.6; margin: 0 0 1.5rem 0; }
    .timer { font-family: monospace; font-size: 1.1rem; font-weight: 700; color: #34D399; background: rgba(255, 255, 255, 0.03); padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 1.5rem; }
    .footer { font-size: 0.75rem; color: #64748B; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 1.25rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● KaryaGuard Anti-DDoS Shield Aktif</div>
    <h1>Lalu Lintas Permintaan Terlalu Padat</h1>
    <p>Sistem mendeteksi lonjakan permintaan yang tidak wajar (HTTP Flood) dari alamat IP Anda. Permintaan ditangguhkan sementara demi menjaga stabilitas layanan.</p>
    <div class="timer">Tunggu: ${retryAfter} detik lagi</div>
    <div class="footer">KaryaGuard Cyber Defense • Edge Traffic Inspector</div>
  </div>
</body>
</html>`,
      {
        status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Retry-After": String(retryAfter),
          "X-Security-Shield": "KaryaGuard Enterprise Anti-DDoS",
        },
      }
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Autentikasi Sesi & JWT Verifikasi
  // ---------------------------------------------------------------------------
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionPayload = payload;
    } catch {
      // Token tidak valid atau kedaluwarsa
      sessionPayload = null;
    }
  }

  const isAuthPage = pathname === "/login";
  const isDashboardPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/leave") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager");

  // Jika sudah login dan membuka halaman /login, redirect ke dashboard
  if (isAuthPage && sessionPayload) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Jika belum login dan mengakses halaman terproteksi, redirect ke /login
  if (isDashboardPage && !sessionPayload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ---------------------------------------------------------------------------
  // 3. Kontrol Akses Berbasis Peran (RBAC Guard)
  // ---------------------------------------------------------------------------
  if (sessionPayload) {
    const userRole = sessionPayload.role;

    // Hanya ADMIN yang boleh membuka rute /admin/*
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
    }

    // Hanya MANAGER atau ADMIN yang boleh membuka rute /manager/*
    if (pathname.startsWith("/manager") && userRole !== "MANAGER" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
    }
  }

  // Teruskan request dengan response headers anti-DDoS
  const response = NextResponse.next();
  response.headers.set("X-Security-Shield", "KaryaGuard Enterprise Anti-DDoS Active");
  if (ddosCheck.remaining !== undefined) {
    response.headers.set("X-RateLimit-Remaining", String(ddosCheck.remaining));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
