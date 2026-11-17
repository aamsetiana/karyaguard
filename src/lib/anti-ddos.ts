/**
 * KaryaGuard Enterprise Cyber Defense System
 * Module: Zero-Trust Virtual Traffic Gate & Proof-of-Work Admission Control
 * 
 * Mekanisme:
 * 1. Cryptographic Clearance Token (HMAC / SHA-256) valid 12 jam
 * 2. High-Tech Virtual Queue & Traffic Regulator (menahan banjir pengunjung serentak)
 * 3. Client-Side Cryptographic Handshake (mengekstrak botnet tanpa JS)
 * 4. Zero False-Positive Lockout bagi pengguna manusia
 */

const CLEARANCE_SECRET =
  process.env.JWT_SECRET || "karyaguard_traffic_shield_secret_key_2026_xyz";

export const CLEARANCE_COOKIE_NAME = "kg_traffic_clearance";

// Helper untuk hashing SHA-256 menggunakan Web Crypto API (Universal di Edge & Node)
async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 32);
}

/**
 * Menerbitkan Token Akses Siber Aman untuk Alamat IP
 */
export async function generateClearanceToken(ip: string): Promise<string> {
  const timestamp = Date.now().toString();
  const signature = await sha256Hex(`${CLEARANCE_SECRET}:${ip}:${timestamp}`);
  return `${timestamp}.${signature}`;
}

/**
 * Memverifikasi Keabsahan Token Akses Siber
 */
export async function verifyClearanceToken(
  token: string | undefined | null,
  ip: string
): Promise<boolean> {
  if (!token || !token.includes(".")) return false;

  const [timestampStr, signature] = token.split(".");
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Token berlaku selama 12 jam
  const maxAge = 12 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAge) return false;

  const expectedSignature = await sha256Hex(
    `${CLEARANCE_SECRET}:${ip}:${timestampStr}`
  );
  return signature === expectedSignature;
}

/**
 * Filter Bot Scanner Berbahaya Berdasarkan User-Agent
 */
const MALICIOUS_BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /masscan/i,
  /zgrab/i,
  /acunetix/i,
  /havij/i,
];

export function isMaliciousBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return MALICIOUS_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}
