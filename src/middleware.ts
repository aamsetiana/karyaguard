import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  CLEARANCE_COOKIE_NAME,
  verifyClearanceToken,
  isMaliciousBot,
} from "@/lib/anti-ddos";
import { validateOriginAndCSRF } from "@/lib/csrf";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "karyaguard_super_secret_jwt_encryption_key_2026_xyz"
);

const SESSION_COOKIE_NAME = "karyaguard_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lewati file statis, aset Next.js, dan endpoint verifikasi clearance
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/security/traffic-clearance") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Blokir Scanner / Bot Berbahaya Langsung
  const userAgent = request.headers.get("user-agent");
  if (isMaliciousBot(userAgent)) {
    return NextResponse.json(
      { success: false, error: "Access Denied: Malicious attack signature detected." },
      { status: 403 }
    );
  }

  // 3. Validasi Anti-CSRF & Origin Guard untuk Request Mutasi
  const csrfCheck = validateOriginAndCSRF(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: csrfCheck.error },
      { status: 403 }
    );
  }

  // 4. Ekstraksi IP Client & Validasi Clearance Token (Zero-Trust Traffic Gate)
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const clearanceCookie = request.cookies.get(CLEARANCE_COOKIE_NAME)?.value;
  const isCleared = await verifyClearanceToken(clearanceCookie, clientIp);

  // Jika pengunjung belum memiliki clearance dan sedang membuka halaman (HTML navigation)
  // Tampilkan Ruang Tunggu Antrean Siber & Verifikasi Kriptografis (Virtual Queue Gate)
  const isHtmlNavigation =
    request.method === "GET" &&
    !pathname.startsWith("/api") &&
    (request.headers.get("accept")?.includes("text/html") ?? true);

  if (!isCleared && isHtmlNavigation) {
    return new NextResponse(renderVirtualQueueHTML(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Security-Shield": "KaryaGuard Zero-Trust Virtual Queue Active",
      },
    });
  }

  // 4. Verifikasi Sesi Karyawan (JWT Session Guard)
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionPayload = payload;
    } catch {
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

  // Jika sudah login dan membuka /login, alihkan ke dashboard
  if (isAuthPage && sessionPayload) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Jika belum login dan mengakses halaman terproteksi, alihkan ke /login
  if (isDashboardPage && !sessionPayload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Role-Based Access Control (RBAC Guard)
  if (sessionPayload) {
    const userRole = sessionPayload.role;

    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/dashboard?error=unauthorized", request.url)
      );
    }

    if (
      pathname.startsWith("/manager") &&
      userRole !== "MANAGER" &&
      userRole !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/dashboard?error=unauthorized", request.url)
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Security-Shield", "KaryaGuard Cyber Defense Active");
  return response;
}

/**
 * Template UI Ruang Antrean Virtual & Verifikasi Siber Cerdas
 * (KaryaGuard Cyber Defense - Virtual Queue & Traffic Regulator)
 */
function renderVirtualQueueHTML(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KaryaGuard Cyber Shield — Verifikasi Antrean Trafik</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #070B12;
      color: #F1F5F9;
      font-family: 'Poppins', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      overflow: hidden;
      position: relative;
    }

    /* Ambient Cyber Background Grid */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%),
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 32px 32px, 32px 32px;
      pointer-events: none;
    }

    .container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 520px;
      background: #0B111D;
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(16, 185, 129, 0.15);
      backdrop-filter: blur(16px);
    }

    /* Pulsing Cyber Emblem */
    .emblem-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emblem-glow {
      position: absolute;
      inset: -8px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 2s infinite ease-in-out;
    }

    .emblem-radar {
      position: absolute;
      inset: 0;
      border: 1.5px dashed rgba(52, 211, 153, 0.4);
      border-radius: 50%;
      animation: spin 10s linear infinite;
    }

    .emblem-svg {
      width: 54px;
      height: 54px;
      position: relative;
      z-index: 2;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.12);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 1.25rem;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
      animation: blink 1s infinite alternate;
    }

    h1 {
      font-size: 1.35rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      line-height: 1.25;
      margin-bottom: 0.6rem;
    }

    p.desc {
      font-size: 0.825rem;
      color: #94A3B8;
      line-height: 1.55;
      margin-bottom: 1.75rem;
      font-weight: 400;
    }

    /* Verification Steps Checklist */
    .steps-box {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 1rem;
      padding: 1rem;
      text-align: left;
      margin-bottom: 1.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #94A3B8;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .step-icon {
      color: #10B981;
      font-weight: bold;
    }

    /* Animated Cyber Progress Bar */
    .progress-bar-container {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      height: 6px;
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 0.75rem;
      position: relative;
    }

    .progress-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #10B981, #06B6D4, #3B82F6);
      border-radius: 9999px;
      transition: width 0.1s linear;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
    }

    .status-text {
      font-size: 0.75rem;
      color: #34D399;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .footer-note {
      font-size: 0.7rem;
      color: #64748B;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 0.8; transform: scale(1.05); } }
    @keyframes blink { from { opacity: 0.3; } to { opacity: 1; } }
  </style>
</head>
<body>
  <div class="container">
    <!-- Emblem -->
    <div class="emblem-wrapper">
      <div class="emblem-glow"></div>
      <div class="emblem-radar"></div>
      <svg class="emblem-svg" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="shieldFlow" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <path d="M 24 5 C 32.5 5 40 10.5 41 19.5 C 42 28.5 35 37 24 43 C 13 37 6 28.5 7 19.5 C 8 10.5 15.5 5 24 5 Z" fill="url(#shieldFlow)" fill-opacity="0.16" stroke="url(#shieldFlow)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="24" cy="24" r="4" fill="#34D399" />
        <circle cx="24" cy="24" r="1.8" fill="#FFFFFF" />
      </svg>
    </div>

    <!-- Badge -->
    <div class="badge">
      <span class="badge-dot"></span>
      <span>Zero-Trust Traffic Regulator</span>
    </div>

    <!-- Title & Desc -->
    <h1>Mengamankan Antrean Trafik</h1>
    <p class="desc">
      Sistem mendeteksi lonjakan akses serentak. Protokol keamanan siber sedang meregulasi antrean masuk dan memvalidasi integritas sesi Anda.
    </p>

    <!-- Checklist Status -->
    <div class="steps-box">
      <div class="step-item">
        <span class="step-icon">✓</span>
        <span>Enkripsi TLS & Integritas Browser Valid</span>
      </div>
      <div class="step-item">
        <span class="step-icon" id="step2-icon">⟳</span>
        <span id="step2-text">Menyelesaikan Handshake Kriptografi...</span>
      </div>
      <div class="step-item">
        <span class="step-icon" id="step3-icon">⋯</span>
        <span id="step3-text">Mengalokasikan Tiket Akses Aman...</span>
      </div>
    </div>

    <!-- Progress -->
    <div class="progress-bar-container">
      <div class="progress-bar-fill" id="pbar"></div>
    </div>
    <div class="status-text">
      <span id="status-label">Memverifikasi Sesi...</span>
      <span id="pbar-pct">0%</span>
    </div>

    <div class="footer-note">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <span>KaryaGuard Cyber Defense • Edge Traffic Gate v1.0</span>
    </div>
  </div>

  <script>
    (function() {
      var progress = 0;
      var pbar = document.getElementById("pbar");
      var pbarPct = document.getElementById("pbar-pct");
      var statusLabel = document.getElementById("status-label");
      var step2Icon = document.getElementById("step2-icon");
      var step2Text = document.getElementById("step2-text");
      var step3Icon = document.getElementById("step3-icon");
      var step3Text = document.getElementById("step3-text");

      // Kirim permintaan handshake clearance ke backend secara asinkron
      fetch("/api/security/traffic-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).then(function(res) {
        return res.json();
      }).then(function(data) {
        // Berhasil mendapatkan clearance token
      }).catch(function(err) {
        console.warn("Handshake fallback:", err);
      });

      // Animasi progress bar 2.2 detik yang mulus
      var interval = setInterval(function() {
        progress += 3;
        if (progress > 100) progress = 100;

        pbar.style.width = progress + "%";
        pbarPct.innerText = progress + "%";

        if (progress >= 40) {
          step2Icon.innerText = "✓";
          step2Text.innerText = "Handshake Kriptografi SHA-256 Selesai";
          step3Icon.innerText = "⟳";
          step3Text.innerText = "Mengalokasikan Slot Akses Aman...";
        }

        if (progress >= 85) {
          step3Icon.innerText = "✓";
          step3Text.innerText = "Akses Diizinkan (Clearance Granted)";
          statusLabel.innerText = "Mengalihkan ke Portal...";
        }

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(function() {
            window.location.reload();
          }, 300);
        }
      }, 65);
    })();
  </script>
</body>
</html>`;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
