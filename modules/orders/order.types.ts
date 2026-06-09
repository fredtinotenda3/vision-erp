// ============================================================
// VISION ERP - Orders Module Types
// modules/orders/order.types.ts
// ============================================================

import { z } from "zod";
import { OrderType, OrderStatus, PaymentMethod } from "@prisma/client";

export const CreateOrderSchema = z.object({
  patientId: z.string().min(1),
  practiceId: z.string().min(1),
  prescriptionId: z.string().optional().nullable(),
  type: z.nativeEnum(OrderType).default(OrderType.SPECTACLES),
  frameBrand: z.string().max(100).optional().nullable(),
  frameModel: z.string().max(100).optional().nullable(),
  frameColor: z.string().max(100).optional().nullable(),
  frameSize: z.string().max(50).optional().nullable(),
  frameCost: z.number().min(0).default(0),
  frameRetail: z.number().min(0).default(0),
  lensType: z.string().max(100).optional().nullable(),
  lensMaterial: z.string().max(100).optional().nullable(),
  lensCoating: z.string().max(100).optional().nullable(),
  lensTint: z.string().max(100).optional().nullable(),
  lensCost: z.number().min(0).default(0),
  lensRetail: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  vatAmount: z.number().min(0).default(0),
  depositPaid: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  promisedDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
});

export const UpdateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  frameBrand: z.string().max(100).optional().nullable(),
  frameModel: z.string().max(100).optional().nullable(),
  frameColor: z.string().max(100).optional().nullable(),
  frameSize: z.string().max(50).optional().nullable(),
  frameCost: z.number().min(0).optional(),
  frameRetail: z.number().min(0).optional(),
  lensType: z.string().max(100).optional().nullable(),
  lensMaterial: z.string().max(100).optional().nullable(),
  lensCoating: z.string().max(100).optional().nullable(),
  lensTint: z.string().max(100).optional().nullable(),
  lensCost: z.number().min(0).optional(),
  lensRetail: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  vatAmount: z.number().min(0).optional(),
  depositPaid: z.number().min(0).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  promisedDate: z.string().optional().nullable(),
  dispensedDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
});

export const OrderQuerySchema = z.object({
  patientId: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  type: z.nativeEnum(OrderType).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;