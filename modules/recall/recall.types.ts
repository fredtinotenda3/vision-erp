// ============================================================
// VISION ERP - Recall Module Types & Validation
// modules/recall/recall.types.ts
// ============================================================

import { z } from "zod";
import { RecallType, RecallStatus, RecallMethod } from "@prisma/client";

export const CreateRecallSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  practiceId: z.string().min(1, "Practice is required"),
  type: z.nativeEnum(RecallType).default(RecallType.ROUTINE),
  method: z.nativeEnum(RecallMethod).default(RecallMethod.SMS),
  dueDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid due date" }),
  message: z.string().max(1000).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const UpdateRecallSchema = z.object({
  status: z.nativeEnum(RecallStatus).optional(),
  method: z.nativeEnum(RecallMethod).optional(),
  dueDate: z.string().optional(),
  response: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const RecallQuerySchema = z.object({
  patientId: z.string().optional(),
  type: z.nativeEnum(RecallType).optional(),
  status: z.nativeEnum(RecallStatus).optional(),
  method: z.nativeEnum(RecallMethod).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  overdue: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const SendRecallSchema = z.object({
  recallIds: z.array(z.string().min(1)).min(1, "At least one recall ID required"),
});

export const BulkCreateRecallSchema = z.object({
  practiceId: z.string().min(1),
  type: z.nativeEnum(RecallType).default(RecallType.ROUTINE),
  method: z.nativeEnum(RecallMethod).default(RecallMethod.SMS),
  intervalMonths: z.number().int().min(1).max(60).default(24),
  message: z.string().max(1000).optional().nullable(),
});

export const RecallConfigSchema = z.object({
  practiceId: z.string().optional().nullable(),
  type: z.nativeEnum(RecallType),
  intervalMonths: z.number().int().min(1).max(60).default(24),
  methods: z.array(z.nativeEnum(RecallMethod)).min(1),
  template: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CreateRecallInput = z.infer<typeof CreateRecallSchema>;
export type UpdateRecallInput = z.infer<typeof UpdateRecallSchema>;
export type RecallQueryInput = z.infer<typeof RecallQuerySchema>;
export type SendRecallInput = z.infer<typeof SendRecallSchema>;
export type BulkCreateRecallInput = z.infer<typeof BulkCreateRecallSchema>;
export type RecallConfigInput = z.infer<typeof RecallConfigSchema>;