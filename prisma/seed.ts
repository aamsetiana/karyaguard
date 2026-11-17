import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database KaryaGuard...");

  // 1. Buat Kantor & Geofence
  const office = await prisma.office.upsert({
    where: { id: "office_jkt_central" },
    update: {},
    create: {
      id: "office_jkt_central",
      name: "Kantor Pusat Jakarta (Menara Karya)",
      latitude: -6.20000000,
      longitude: 106.81666667,
      radiusMeters: 100,
      address: "Jl. H.R. Rasuna Said Kav. 1-2, Setiabudi, Jakarta Selatan",
    },
  });

  // 2. Buat Shift Kerja
  const shift = await prisma.shift.upsert({
    where: { id: "shift_regular_morning" },
    update: {},
    create: {
      id: "shift_regular_morning",
      name: "Shift Reguler Pagi",
      startTime: "08:00",
      endTime: "17:00",
      gracePeriodMinutes: 15,
    },
  });

  // 3. Buat Departemen
  const deptIT = await prisma.department.upsert({
    where: { code: "IT-SEC" },
    update: {},
    create: {
      name: "Cyber Security & IT Infrastructure",
      code: "IT-SEC",
      description: "Divisi Keamanan Siber dan Operasional IT",
    },
  });

  const deptHR = await prisma.department.upsert({
    where: { code: "HR-OPS" },
    update: {},
    create: {
      name: "Human Resources & People Operations",
      code: "HR-OPS",
      description: "Divisi Manajemen SDM dan Personalia",
    },
  });

  // 4. Buat Akun Uji Coba Demo (Admin, Manager, Employee)
  const salt = await bcrypt.genSalt(12);
  const adminPasswordHash = await bcrypt.hash("AdminSecurePass123!", salt);
  const managerPasswordHash = await bcrypt.hash("ManagerPass123!", salt);
  const employeePasswordHash = await bcrypt.hash("EmployeePass123!", salt);

  // Admin Account
  const admin = await prisma.user.upsert({
    where: { email: "admin@karyaguard.com" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@karyaguard.com",
      passwordHash: adminPasswordHash,
      fullName: "Raditya Pratama, S.Kom (HR Admin)",
      nik: "KG-ADM-001",
      role: "ADMIN",
      phone: "081299990001",
      bankName: "BCA",
      bankAccountNo: "1234567890",
      baseSalary: 12000000,
      leaveBalance: 15,
      departmentId: deptHR.id,
      officeId: office.id,
      shiftId: shift.id,
    },
  });

  // Manager Account
  const manager = await prisma.user.upsert({
    where: { email: "manager@karyaguard.com" },
    update: { passwordHash: managerPasswordHash },
    create: {
      email: "manager@karyaguard.com",
      passwordHash: managerPasswordHash,
      fullName: "Budi Santoso, M.T (Engineering Lead)",
      nik: "KG-MGR-002",
      role: "MANAGER",
      phone: "081299990002",
      bankName: "Mandiri",
      bankAccountNo: "9876543210",
      baseSalary: 15000000,
      leaveBalance: 12,
      departmentId: deptIT.id,
      officeId: office.id,
      shiftId: shift.id,
    },
  });

  // Employee Account
  const employee = await prisma.user.upsert({
    where: { email: "user@karyaguard.com" },
    update: { passwordHash: employeePasswordHash },
    create: {
      email: "user@karyaguard.com",
      passwordHash: employeePasswordHash,
      fullName: "Ahmad Fauzi (Cyber Security Analyst)",
      nik: "KG-EMP-003",
      role: "EMPLOYEE",
      phone: "081299990003",
      bankName: "BRI",
      bankAccountNo: "5555666677",
      baseSalary: 8500000,
      leaveBalance: 12,
      departmentId: deptIT.id,
      officeId: office.id,
      shiftId: shift.id,
    },
  });

  // 5. Buat Sampel Presensi Hari Ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId: employee.id,
        date: today,
      },
    },
    update: {},
    create: {
      userId: employee.id,
      date: today,
      checkInTime: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 5 * 60 * 1000), // 08:05 (Tepat waktu)
      checkInLat: -6.20001000,
      checkInLng: 106.81665000,
      checkInDistanceMeters: 12.5,
      checkInStatus: "ON_TIME",
      lateMinutes: 0,
      notes: "Check-in selfie terverifikasi",
    },
  });

  // 6. Buat Sampel Slip Gaji Bulan Ini dengan Integritas Hash SHA-256
  const baseSalary = 8500000;
  const allowances = 1275000;
  const overtimePay = 240000;
  const lateDeduction = 0;
  const taxDeduction = 425000;
  const insuranceDeduction = 170000;
  const netSalary = baseSalary + allowances + overtimePay - lateDeduction - taxDeduction - insuranceDeduction;

  const canonicalString = [
    employee.id,
    11,
    2026,
    Number(netSalary).toFixed(2),
    Number(baseSalary).toFixed(2),
    process.env.PAYROLL_HASH_SALT || "karyaguard_payroll_salt_secret_2026_xyz",
  ].join("::");

  const integrityHash = crypto.createHash("sha256").update(canonicalString).digest("hex");

  await prisma.payroll.upsert({
    where: {
      userId_month_year: {
        userId: employee.id,
        month: 11,
        year: 2026,
      },
    },
    update: {},
    create: {
      userId: employee.id,
      month: 11,
      year: 2026,
      baseSalary,
      allowances,
      overtimePay,
      lateDeduction,
      taxDeduction,
      insuranceDeduction,
      netSalary,
      status: "PUBLISHED",
      integrityHash,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Seeding selesai! Akun uji coba siap digunakan:");
  console.log("  - Admin   : admin@karyaguard.com / AdminSecurePass123!");
  console.log("  - Manager : manager@karyaguard.com / ManagerPass123!");
  console.log("  - User    : user@karyaguard.com / EmployeePass123!");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

