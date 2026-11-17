/**
 * KaryaGuard Enterprise Anti-DDoS & HTTP Flood Protection Shield (Layer 7)
 * 
 * Fitur:
 * 1. Global Sliding-Window Rate Limiting per IP
 * 2. Instant Burst Flood Protection (mencegah concurrency hammer attack)
 * 3. Strict API Endpoint Throttling
 * 4. Botnet & Automated Attack Scanner Signature Detection
 * 5. Dynamic IP Jail / Temporary Blacklist (Auto-Banning)
 */

interface ClientTrafficRecord {
  // Sustained traffic window (60 detik)
  sustainedCount: number;
  sustainedResetAt: number;

  // Burst traffic window (5 detik)
  burstCount: number;
  burstResetAt: number;

  // Violations & Jail status
  violations: number;
  jailedUntil: number;
}

// In-Memory store untuk Edge/Serverless runtime
const trafficStore = new Map<string, ClientTrafficRecord>();

// Bersihkan record yang sudah expired secara berkala agar hemat memori
function pruneExpiredRecords(now: number) {
  if (trafficStore.size > 5000) {
    for (const [ip, rec] of trafficStore.entries()) {
      if (now > rec.sustainedResetAt && now > rec.jailedUntil) {
        trafficStore.delete(ip);
      }
    }
  }
}

export interface AntiDDoSCheckResult {
  allowed: boolean;
  statusCode?: number;
  reason?: string;
  retryAfterSeconds?: number;
  remaining?: number;
  limit?: number;
  isJailed?: boolean;
}

export interface AntiDDoSConfig {
  burstLimit?: number;       // Maks request dalam jendela burst (default: 35 req / 5 detik)
  burstWindowMs?: number;    // 5000 ms
  sustainedLimit?: number;   // Maks request dalam jendela sustain (default: 150 req / 60 detik)
  sustainedWindowMs?: number;// 60000 ms
  jailDurationMs?: number;   // Durasi pemblokiran sementara jika spam terus (default: 300000 ms / 5 menit)
}

const DEFAULT_CONFIG: Required<AntiDDoSConfig> = {
  burstLimit: 35,
  burstWindowMs: 5000,
  sustainedLimit: 150,
  sustainedWindowMs: 60000,
  jailDurationMs: 5 * 60 * 1000, // 5 menit
};

// Pola User-Agent alat scanner / flood yang mencurigakan
const MALICIOUS_BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /masscan/i,
  /zgrab/i,
  /nmap/i,
  /acunetix/i,
  /havij/i,
];

/**
 * Memvalidasi apakah request dari client IP diizinkan atau terindikasi DDoS
 */
export function checkAntiDDoS(
  clientIp: string,
  userAgent: string | null = null,
  isApiRoute: boolean = false,
  customConfig?: AntiDDoSConfig
): AntiDDoSCheckResult {
  const now = Date.now();
  pruneExpiredRecords(now);

  const config = {
    ...DEFAULT_CONFIG,
    ...(isApiRoute ? { burstLimit: 25, sustainedLimit: 90 } : {}),
    ...customConfig,
  };

  // 1. Filter Bot Scanner Berbahaya
  if (userAgent) {
    for (const pattern of MALICIOUS_BOT_PATTERNS) {
      if (pattern.test(userAgent)) {
        return {
          allowed: false,
          statusCode: 403,
          reason: "Access Denied: Malicious security scanner signature detected.",
          retryAfterSeconds: 3600,
        };
      }
    }
  }

  // 2. Ambil atau inisialisasi record lalu lintas IP
  let record = trafficStore.get(clientIp);

  if (!record) {
    record = {
      sustainedCount: 1,
      sustainedResetAt: now + config.sustainedWindowMs,
      burstCount: 1,
      burstResetAt: now + config.burstWindowMs,
      violations: 0,
      jailedUntil: 0,
    };
    trafficStore.set(clientIp, record);
    return {
      allowed: true,
      remaining: config.sustainedLimit - 1,
      limit: config.sustainedLimit,
    };
  }

  // 3. Cek Status IP Jail (Jika sebelumnya terkena auto-ban DDoS)
  if (now < record.jailedUntil) {
    const remainingJailSeconds = Math.ceil((record.jailedUntil - now) / 1000);
    return {
      allowed: false,
      statusCode: 429,
      reason: "IP Address Temporarily Jailed: High-volume DDoS flood attack detected.",
      retryAfterSeconds: remainingJailSeconds,
      isJailed: true,
    };
  }

  // 4. Evaluasi Jendela Burst (5 detik)
  if (now > record.burstResetAt) {
    record.burstCount = 1;
    record.burstResetAt = now + config.burstWindowMs;
  } else {
    record.burstCount += 1;
  }

  // 5. Evaluasi Jendela Sustained (60 detik)
  if (now > record.sustainedResetAt) {
    record.sustainedCount = 1;
    record.sustainedResetAt = now + config.sustainedWindowMs;
  } else {
    record.sustainedCount += 1;
  }

  // 6. Deteksi Pelanggaran Burst Limit
  if (record.burstCount > config.burstLimit) {
    record.violations += 1;
    if (record.violations >= 3) {
      record.jailedUntil = now + config.jailDurationMs;
    }
    const retryAfter = Math.ceil((record.burstResetAt - now) / 1000) || 1;
    return {
      allowed: false,
      statusCode: 429,
      reason: "Rate Limit Exceeded: Rapid traffic burst detected (Anti-DDoS Shield Active).",
      retryAfterSeconds: retryAfter,
    };
  }

  // 7. Deteksi Pelanggaran Sustained Limit
  if (record.sustainedCount > config.sustainedLimit) {
    record.violations += 1;
    if (record.violations >= 3) {
      record.jailedUntil = now + config.jailDurationMs;
    }
    const retryAfter = Math.ceil((record.sustainedResetAt - now) / 1000) || 5;
    return {
      allowed: false,
      statusCode: 429,
      reason: "Rate Limit Exceeded: Too many HTTP requests within 1 minute (Anti-DDoS Shield Active).",
      retryAfterSeconds: retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.sustainedLimit - record.sustainedCount),
    limit: config.sustainedLimit,
  };
}
