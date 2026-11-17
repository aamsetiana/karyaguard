import { z } from "zod";

/**
 * Validasi Skema Login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Format email tidak valid" })
    .max(100, { message: "Email maksimal 100 karakter" }),
  password: z
    .string()
    .min(6, { message: "Password minimal 6 karakter" })
    .max(100, { message: "Password maksimal 100 karakter" }),
});

/**
 * Validasi Skema Registrasi Karyawan Baru (Oleh Admin)
 */
export const registerUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Format email tidak valid" })
    .max(100),
  password: z
    .string()
    .min(8, { message: "Password minimal 8 karakter" })
    .regex(/[A-Z]/, { message: "Harus mengandung minimal 1 huruf besar" })
    .regex(/[0-9]/, { message: "Harus mengandung minimal 1 angka" }),
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Nama lengkap minimal 3 karakter" })
    .max(100),
  nik: z
    .string()
    .trim()
    .min(4, { message: "NIK minimal 4 karakter" })
    .max(20),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
  phone: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  bankAccountNo: z.string().trim().optional(),
  baseSalary: z.coerce.number().min(0, { message: "Gaji pokok minimal 0" }),
  departmentId: z.string().optional().nullable(),
  officeId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
});

/**
 * Validasi Skema Presensi Check-In
 */
export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(50000),
  photo: z.string().min(1, { message: "Foto selfie wajib dilampirkan" }),
  notes: z.string().trim().max(255).optional(),
});

/**
 * Validasi Skema Pengajuan Cuti / Izin
 */
export const leaveRequestSchema = z.object({
  leaveType: z.enum(["ANNUAL", "SICK", "EMERGENCY", "OVERTIME"]),
  startDate: z.string().min(10, { message: "Tanggal mulai wajib diisi" }),
  endDate: z.string().min(10, { message: "Tanggal selesai wajib diisi" }),
  reason: z
    .string()
    .trim()
    .min(5, { message: "Alasan cuti minimal 5 karakter" })
    .max(500, { message: "Alasan cuti maksimal 500 karakter" }),
  attachmentUrl: z.string().optional().nullable(),
});

/**
 * Validasi Skema Hitung Payroll Bulanan
 */
export const generatePayrollSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2050),
});

