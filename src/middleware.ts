import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "karyaguard_super_secret_jwt_encryption_key_2026_xyz"
);

const COOKIE_NAME = "karyaguard_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, aset Next.js, dan favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

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

  // 1. Jika sudah login dan membuka halaman /login, redirect ke dashboard
  if (isAuthPage && sessionPayload) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Jika belum login dan mengakses halaman terproteksi, redirect ke /login
  if (isDashboardPage && !sessionPayload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Kontrol Akses Berbasis Peran (RBAC Guard)
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

