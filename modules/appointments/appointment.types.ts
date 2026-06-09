// ============================================================
// VISION ERP - Appointment Module Types & Validation
// modules/appointments/appointment.types.ts
// ============================================================

import { z } from "zod";
import { AppointmentStatus, AppointmentType } from "@prisma/client";

export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1),
  practiceId: z.string().min(1),
  optometristId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  type: z.nativeEnum(AppointmentType).default(AppointmentType.EYE_EXAM),
  startTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid start time" }),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid end time" }),
  duration: z.number().int().min(5).max(240).default(30),
  notes: z.string().max(1000).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  isNew: z.boolean().default(false),
});

export const UpdateAppointmentSchema = z.object({
  optometristId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  type: z.nativeEnum(AppointmentType).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().int().min(5).max(240).optional(),
  notes: z.string().max(1000).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  cancelReason: z.string().max(500).optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
});

export const AppointmentQuerySchema = z.object({
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  optometristId: z.string().optional(),
  roomId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  type: z.nativeEnum(AppointmentType).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

export const StaffRotaSchema = z.object({
  userId: z.string().min(1),
  date: z.string().refine((v) => !isNaN(Date.parse(v))),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  isAvailable: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type AppointmentQueryInput = z.infer<typeof AppointmentQuerySchema>;
export type StaffRotaInput = z.infer<typeof StaffRotaSchema>;