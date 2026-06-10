// ============================================================
// VISION ERP - Finance Module Types & Validation
// modules/finance/finance.types.ts
// ============================================================

import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

// ============================================================
// PETTY CASH
// ============================================================

export const PettyCashSchema = z.object({
  practiceId: z.string().min(1, "Practice is required"),
  description: z.string().min(1, "Description is required").max(300),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  isExpense: z.boolean().default(true),
  category: z.string().max(100).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  date: z.string().optional(),
});

export const PettyCashQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
  isExpense: z.coerce.boolean().optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// ============================================================
// CASH RECONCILIATION
// ============================================================

export const ReconciliationSchema = z.object({
  practiceId: z.string().min(1, "Practice is required"),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  openingBalance: z.number().default(0),
  cashSales: z.number().default(0),
  cardSales: z.number().default(0),
  otherSales: z.number().default(0),
  cashIn: z.number().default(0),
  cashOut: z.number().default(0),
  notes: z.string().max(500).optional().nullable(),
});

// ============================================================
// STANDING ORDERS / DIRECT DEBITS
// ============================================================

export const StandingOrderSchema = z.object({
  practiceId: z.string().min(1),
  patientId: z.string().optional().nullable(),
  type: z.enum(["SO", "DD"]),
  reference: z.string().min(1).max(100),
  amount: z.number().min(0.01),
  frequency: z.enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "ANNUALLY"]),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid start date",
  }),
  endDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const UpdateStandingOrderSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"]).optional(),
  endDate: z.string().optional().nullable(),
  nextDue: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ============================================================
// DEBTORS
// ============================================================

export const DebtorSchema = z.object({
  patientId: z.string().min(1),
  orderId: z.string().optional().nullable(),
  amount: z.number().min(0.01),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const DebtorPaymentSchema = z.object({
  debtorId: z.string().min(1),
  amount: z.number().min(0.01),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const UpdateDebtorSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  paid: z.number().min(0).optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ============================================================
// REPORT QUERY PARAMS
// ============================================================

export const DateRangeQuerySchema = z.object({
  practiceId: z.string().optional(),
  from: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid from date" }),
  to: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid to date" }),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const CashReportQuerySchema = z.object({
  practiceId: z.string().optional(),
  from: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid from date" }),
  to: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid to date" }),
});

export const VatReportQuerySchema = z.object({
  practiceId: z.string().optional(),
  from: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid from date" }),
  to: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid to date" }),
});

// ============================================================
// INFERRED TYPES
// ============================================================

export type PettyCashInput = z.infer<typeof PettyCashSchema>;
export type PettyCashQueryInput = z.infer<typeof PettyCashQuerySchema>;
export type ReconciliationInput = z.infer<typeof ReconciliationSchema>;
export type StandingOrderInput = z.infer<typeof StandingOrderSchema>;
export type UpdateStandingOrderInput = z.infer<typeof UpdateStandingOrderSchema>;
export type DebtorInput = z.infer<typeof DebtorSchema>;
export type DebtorPaymentInput = z.infer<typeof DebtorPaymentSchema>;
export type UpdateDebtorInput = z.infer<typeof UpdateDebtorSchema>;
export type DateRangeQueryInput = z.infer<typeof DateRangeQuerySchema>;
export type CashReportQueryInput = z.infer<typeof CashReportQuerySchema>;
export type VatReportQueryInput = z.infer<typeof VatReportQuerySchema>;

// ============================================================
// RESPONSE SHAPES (for service return types)
// ============================================================

export interface CashReportTotals {
  total: number;
  cash: number;
  card: number;
  other: number;
}

export interface VatBreakdownEntry {
  net: number;
  vat: number;
  gross: number;
}

export interface VatBreakdown {
  [rate: string]: VatBreakdownEntry;
}