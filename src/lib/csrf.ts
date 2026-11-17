/**
 * KaryaGuard Enterprise CSRF & Cross-Site Origin Validation Guard
 * 
 * Melindungi seluruh mutating endpoint (POST, PUT, PATCH, DELETE) dari:
 * 1. Cross-Site Request Forgery (CSRF)
 * 2. Cross-Origin API Abuse / Phishing Form Submissions
 * 3. Unauthorized Webhooks / Third-party Injections
 */

export function validateOriginAndCSRF(request: Request): {
  valid: boolean;
  error?: string;
} {
  const method = request.method.toUpperCase();

  // GET dan HEAD adalah safe methods (idempotent)
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { valid: true };
  }

  // 1. Periksa Sec-Fetch-Site (Standar Modern W3C Fetch Metadata)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite === "cross-site") {
    return {
      valid: false,
      error: "Akses Ditolak: Deteksi penyerangan Cross-Site Request Forgery (CSRF).",
    };
  }

  // 2. Periksa Origin / Referer Header
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.host;

      // Izinkan jika host sama (same-origin)
      if (originHost === host) {
        return { valid: true };
      }

      // Izinkan subdomain vercel.app resmi dan localhost
      const isAllowedVercel =
        originHost.endsWith(".vercel.app") ||
        originHost === "localhost:3000" ||
        originHost === "127.0.0.1:3000";

      if (!isAllowedVercel) {
        return {
          valid: false,
          error: `Akses Ditolak: Origin "${origin}" tidak memiliki izin melakukan transaksi data.`,
        };
      }
    } catch {
      return {
        valid: false,
        error: "Akses Ditolak: Format Origin Header tidak valid.",
      };
    }
  }

  return { valid: true };
}
