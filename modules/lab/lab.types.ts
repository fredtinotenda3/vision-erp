// ============================================================
// VISION ERP - Lab Module Types & Validation
// modules/lab/lab.types.ts
// ============================================================

import { z } from "zod";
import { LabOrderStatus } from "@prisma/client";

const RxSideSchema = z.object({
  sphere: z.number().optional().nullable(),
  cylinder: z.number().optional().nullable(),
  axis: z.number().int().optional().nullable(),
  add: z.number().optional().nullable(),
  prism: z.number().optional().nullable(),
  base: z.string().optional().nullable(),
  va: z.string().optional().nullable(),
  bvd: z.number().optional().nullable(),
}).optional().nullable();

export const CreateLabOrderSchema = z.object({
  practiceId: z.string().min(1, "Practice is required"),
  supplierId: z.string().optional().nullable(),
  rxRight: z.object({ right: RxSideSchema }).optional().nullable(),
  rxLeft: z.object({ left: RxSideSchema }).optional().nullable(),
  lensType: z.string().max(100).optional().nullable(),
  lensMaterial: z.string().max(100).optional().nullable(),
  lensCoating: z.string().max(100).optional().nullable(),
  lensTint: z.string().max(100).optional().nullable(),
  frameRef: z.string().max(100).optional().nullable(),
  frameSize: z.string().max(50).optional().nullable(),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).default("NORMAL"),
  specialInstructions: z.string().max(1000).optional().nullable(),
  estimatedReturn: z.string().optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const UpdateLabOrderSchema = z.object({
  supplierId: z.string().optional().nullable(),
  status: z.nativeEnum(LabOrderStatus).optional(),
  lensType: z.string().max(100).optional().nullable(),
  lensMaterial: z.string().max(100).optional().nullable(),
  lensCoating: z.string().max(100).optional().nullable(),
  lensTint: z.string().max(100).optional().nullable(),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).optional(),
  specialInstructions: z.string().max(1000).optional().nullable(),
  estimatedReturn: z.string().optional().nullable(),
  receivedAt: z.string().optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const LabOrderQuerySchema = z.object({
  status: z.nativeEnum(LabOrderStatus).optional(),
  supplierId: z.string().optional(),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const LabTrackingSchema = z.object({
  labOrderId: z.string().min(1),
  status: z.nativeEnum(LabOrderStatus),
  notes: z.string().max(500).optional().nullable(),
});

export const SupplierSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  contactName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
  accountNo: z.string().max(100).optional().nullable(),
  vatNo: z.string().max(50).optional().nullable(),
});

export type CreateLabOrderInput = z.infer<typeof CreateLabOrderSchema>;
export type UpdateLabOrderInput = z.infer<typeof UpdateLabOrderSchema>;
export type LabOrderQueryInput = z.infer<typeof LabOrderQuerySchema>;
export type LabTrackingInput = z.infer<typeof LabTrackingSchema>;
export type SupplierInput = z.infer<typeof SupplierSchema>;