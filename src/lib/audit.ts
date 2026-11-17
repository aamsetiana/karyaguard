import { prisma } from "./prisma";
import { headers } from "next/headers";

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * Mencatat log aktivitas keamanan secara immutable ke dalam database
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    let clientIp = input.ipAddress;
    let clientUa = input.userAgent;

    if (!clientIp || !clientUa) {
      const headerList = await headers();
      clientIp =
        clientIp ||
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerList.get("x-real-ip") ||
        "127.0.0.1";
      clientUa = clientUa || headerList.get("user-agent") || "Unknown";
    }

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        action: input.action,
        ipAddress: clientIp,
        userAgent: clientUa,
        details: input.details ? (input.details as any) : undefined,
      },
    });
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
  }
}

