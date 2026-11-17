import crypto from "crypto";

const PAYROLL_SALT =
  process.env.PAYROLL_HASH_SALT || "karyaguard_payroll_salt_secret_2026_xyz";

/**
 * Menghasilkan tanda tangan hash SHA-256 kanonikal untuk record payroll
 * Mencegah manipulasi nominal langsung pada database
 */
export function generatePayrollHash(data: {
  userId: string;
  month: number;
  year: number;
  netSalary: number | string;
  baseSalary: number | string;
}): string {
  const canonicalString = [
    data.userId,
    data.month,
    data.year,
    Number(data.netSalary).toFixed(2),
    Number(data.baseSalary).toFixed(2),
    PAYROLL_SALT,
  ].join("::");

  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

/**
 * Memverifikasi keabsahan hash integritas slip gaji
 */
export function verifyPayrollHash(
  data: {
    userId: string;
    month: number;
    year: number;
    netSalary: number | string;
    baseSalary: number | string;
  },
  storedHash: string
): boolean {
  const expected = generatePayrollHash(data);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

