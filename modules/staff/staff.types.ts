// ============================================================
// VISION ERP - Staff Module Types & Validation
// modules/staff/staff.types.ts
// ============================================================

import { z } from "zod";
import { Role } from "@prisma/client";

// ─── Create staff user ───────────────────────────────────────────────────────

export const CreateStaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
  role: z.nativeEnum(Role).default(Role.RECEPTIONIST),
  practiceId: z.string().min(1, "Practice is required"),
  mustChangePassword: z.boolean().default(true),
});

// ─── Update staff user ───────────────────────────────────────────────────────

export const UpdateStaffSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().toLowerCase().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

// ─── Change password ─────────────────────────────────────────────────────────

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
});

// ─── Reset password (admin) ──────────────────────────────────────────────────

export const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
  mustChangePassword: z.boolean().default(true),
});

// ─── Staff rota ──────────────────────────────────────────────────────────────

export const StaffRotaSchema = z.object({
  userId: z.string().min(1, "User is required"),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isAvailable: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export const StaffRotaQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  userId: z.string().optional(),
});

// ─── Staff query ─────────────────────────────────────────────────────────────

export const StaffQuerySchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// ─── Staff performance (manual entry) ───────────────────────────────────────

export const StaffPerformanceEntrySchema = z.object({
  userId: z.string().min(1),
  date: z.string().refine((v) => !isNaN(Date.parse(v))),
  examsCount: z.number().int().min(0).default(0),
  salesAmount: z.number().min(0).default(0),
  ordersCount: z.number().int().min(0).default(0),
  missedAppts: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type StaffRotaInput = z.infer<typeof StaffRotaSchema>;
export type StaffRotaQueryInput = z.infer<typeof StaffRotaQuerySchema>;
export type StaffQueryInput = z.infer<typeof StaffQuerySchema>;
export type StaffPerformanceEntryInput = z.infer<typeof StaffPerformanceEntrySchema>;