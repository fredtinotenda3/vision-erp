// ============================================================
// VISION ERP - Dashboard / reports response types
// types/dashboard.ts
// ------------------------------------------------------------
// Mirrors the shapes returned by:
//   reportsRepository.getDashboardKpis()  -> GET /api/reports
//   reportsService.getRevenueReport()     -> GET /api/reports/revenue
// ============================================================

export interface DashboardKpis {
  todayAppointments: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingOrders: number;
  overdueRecalls: number;
  totalDebt: number;
  lowStockItems: number;
  activePatients: number;
}

export interface RevenueBreakdownEntry {
  period: string;
  revenue: number;
  vat: number;
  saleCount: number;
}

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

export type RevenueGroupBy = "day" | "week" | "month";

export interface RevenueQuery {
  from: string;
  to: string;
  groupBy: RevenueGroupBy;
}