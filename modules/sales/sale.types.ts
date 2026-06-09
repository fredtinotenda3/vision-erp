// ============================================================
// VISION ERP - Sales Module Types
// modules/sales/sale.types.ts
// ============================================================

import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const SaleItemSchema = z.object({
  stockItemId: z.string().optional().nullable(),
  description: z.string().min(1).max(200),
  quantity: z.number().int().min(1).default(1),
  unitCost: z.number().min(0).default(0),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(20),
});

export const CreateSaleSchema = z.object({
  patientId: z.string().optional().nullable(),
  practiceId: z.string().min(1),
  type: z.enum(["COUNTER", "ORDER", "ONLINE"]).default("COUNTER"),
  items: z.array(SaleItemSchema).min(1),
  discount: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const SaleQuerySchema = z.object({
  patientId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
export type SaleQueryInput = z.infer<typeof SaleQuerySchema>;