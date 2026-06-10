// ============================================================
// VISION ERP - Reports Module Types & Validation
// modules/reports/reports.types.ts
// ============================================================

import { z } from "zod";

// ─── Shared date range ───────────────────────────────────────────────────────

const DateRangeBase = z.object({
  from: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid from date" }),
  to: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid to date" }),
  practiceId: z.string().optional(),
});

// ─── Revenue / Sales Report ──────────────────────────────────────────────────

export const RevenueReportQuerySchema = DateRangeBase.extend({
  groupBy: z.enum(["day", "week", "month"]).default("day"),
  paymentMethod: z.string().optional(),
});

// ─── Appointments Report ─────────────────────────────────────────────────────

export const AppointmentsReportQuerySchema = DateRangeBase.extend({
  optometristId: z.string().optional(),
  groupBy: z.enum(["day", "optometrist", "type", "status"]).default("day"),
});

// ─── Patient Demographics Report ─────────────────────────────────────────────

export const PatientDemographicsQuerySchema = z.object({
  practiceId: z.string().optional(),
});

// ─── Clinical Report ─────────────────────────────────────────────────────────

export const ClinicalReportQuerySchema = DateRangeBase.extend({
  optometristId: z.string().optional(),
});

// ─── Orders Report ───────────────────────────────────────────────────────────

export const OrdersReportQuerySchema = DateRangeBase.extend({
  status: z.string().optional(),
  type: z.string().optional(),
});

// ─── Inventory Report ────────────────────────────────────────────────────────

export const InventoryReportQuerySchema = z.object({
  practiceId: z.string().optional(),
  categoryId: z.string().optional(),
  lowStockOnly: z.coerce.boolean().default(false),
});

// ─── Staff Performance Report ────────────────────────────────────────────────

export const StaffPerformanceQuerySchema = DateRangeBase.extend({
  userId: z.string().optional(),
});

// ─── Recall Report ───────────────────────────────────────────────────────────

export const RecallReportQuerySchema = DateRangeBase.extend({
  type: z.string().optional(),
  status: z.string().optional(),
});

// ─── Debtor Report ───────────────────────────────────────────────────────────

export const DebtorReportQuerySchema = z.object({
  practiceId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type RevenueReportQuery = z.infer<typeof RevenueReportQuerySchema>;
export type AppointmentsReportQuery = z.infer<typeof AppointmentsReportQuerySchema>;
export type PatientDemographicsQuery = z.infer<typeof PatientDemographicsQuerySchema>;
export type ClinicalReportQuery = z.infer<typeof ClinicalReportQuerySchema>;
export type OrdersReportQuery = z.infer<typeof OrdersReportQuerySchema>;
export type InventoryReportQuery = z.infer<typeof InventoryReportQuerySchema>;
export type StaffPerformanceQuery = z.infer<typeof StaffPerformanceQuerySchema>;
export type RecallReportQuery = z.infer<typeof RecallReportQuerySchema>;
export type DebtorReportQuery = z.infer<typeof DebtorReportQuerySchema>;

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface RevenueSummary {
  totalRevenue: number;
  totalVat: number;
  totalDiscount: number;
  saleCount: number;
  cashTotal: number;
  cardTotal: number;
  otherTotal: number;
  breakdown: RevenueBreakdownEntry[];
}

export interface RevenueBreakdownEntry {
  period: string;
  revenue: number;
  vat: number;
  saleCount: number;
}

export interface AppointmentsSummary {
  total: number;
  completed: number;
  cancelled: number;
  missed: number;
  noShow: number;
  completionRate: number;
  breakdown: Record<string, number>;
}

export interface PatientDemographicsSummary {
  total: number;
  active: number;
  newThisMonth: number;
  newThisYear: number;
  bySex: Record<string, number>;
  byAgeGroup: Record<string, number>;
  keyPatients: number;
}

export interface OrdersSummary {
  total: number;
  pending: number;
  inLab: number;
  ready: number;
  dispensed: number;
  cancelled: number;
  totalValue: number;
  breakdown: Record<string, number>;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  items: InventoryItemReport[];
}

export interface InventoryItemReport {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  isLow: boolean;
  retailPrice: number;
  stockValue: number;
  category: string | null;
}