import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "karyaguard_super_secret_jwt_encryption_key_2026_xyz"
);

export const COOKIE_NAME = "karyaguard_session";

export interface UserSessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId?: string | null;
  officeId?: string | null;
  shiftId?: string | null;
}

/**
 * Hashing password menggunakan bcryptjs dengan salt rounds 12
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verifikasi kecocokan plaintext password dengan bcrypt hash
 */
export async function verifyPassword(
  plainText: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

/**
 * Menandatangani JWT dengan masa berlaku 8 jam (standar shift kerja)
 */
export async function createSessionToken(
  payload: UserSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

/**
 * Verifikasi dan decode token JWT sesi
 */
export async function verifySessionToken(
  token: string
): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Mengambil sesi user aktif dari cookies (Server Component / Server Action / Route Handler)
 */
export async function getCurrentSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Menyimpan token sesi ke dalam Cookie yang aman (HttpOnly, Secure, SameSite=Lax)
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam
  });
}

/**
 * Menghapus cookie sesi saat user logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

