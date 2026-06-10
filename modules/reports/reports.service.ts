// ============================================================
// VISION ERP - Reports Service
// modules/reports/reports.service.ts
// ============================================================

import { reportsRepository } from "./reports.repository";
import {
  RevenueReportQuery,
  AppointmentsReportQuery,
  PatientDemographicsQuery,
  ClinicalReportQuery,
  OrdersReportQuery,
  InventoryReportQuery,
  StaffPerformanceQuery,
  RecallReportQuery,
  DebtorReportQuery,
  RevenueSummary,
  AppointmentsSummary,
  PatientDemographicsSummary,
  OrdersSummary,
  InventorySummary,
  InventoryItemReport,
} from "./reports.types";
import { buildPaginationMeta } from "@/lib/utils";

// ─── Type-safe helpers ────────────────────────────────────────────────────────

/**
 * Prisma groupBy returns _count as `true | { [field]: number | undefined } | undefined`
 * depending on what was requested. This helper safely extracts a numeric field
 * (defaults to "id") from any of those shapes.
 */
function safeCount(
  row: { _count?: true | Record<string, number | undefined> | null | undefined } | null | undefined,
  field = "id"
): number {
  if (!row) return 0;
  const c = row._count;
  if (!c || c === true) return 0;
  return (c as Record<string, number | undefined>)[field] ?? 0;
}

/**
 * Safely extract a numeric field from a groupBy _sum aggregate.
 */
function safeSum(
  row: { _sum?: Record<string, number | null | undefined> | null | undefined } | null | undefined,
  field: string
): number {
  if (!row?._sum) return 0;
  return row._sum[field] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────

export const reportsService = {
  // ─── Revenue / Sales ────────────────────────────────────────────────────────

  async getRevenueReport(params: RevenueReportQuery, practiceId: string): Promise<RevenueSummary> {
    const { aggregates, byMethod, sales } = await reportsRepository.getRevenueSummary(
      params,
      practiceId
    );

    const cashRow = byMethod.find((m) => m.paymentMethod === "CASH");
    const cardRow = byMethod.find((m) => m.paymentMethod === "CARD");

    const cashTotal = cashRow?._sum?.totalAmount ?? 0;
    const cardTotal = cardRow?._sum?.totalAmount ?? 0;
    const otherTotal = (aggregates._sum.totalAmount ?? 0) - cashTotal - cardTotal;

    // Build daily/weekly/monthly breakdown
    const breakdown = _buildBreakdown(sales, params.groupBy);

    return {
      totalRevenue: aggregates._sum.totalAmount ?? 0,
      totalVat: aggregates._sum.vatAmount ?? 0,
      totalDiscount: aggregates._sum.discount ?? 0,
      saleCount: aggregates._count.id ?? 0,
      cashTotal,
      cardTotal,
      otherTotal,
      breakdown,
    };
  },

  // ─── Appointments ────────────────────────────────────────────────────────────

  async getAppointmentsReport(
    params: AppointmentsReportQuery,
    practiceId: string
  ): Promise<AppointmentsSummary> {
    const { total, byStatus, byType, byOptometrist } =
      await reportsRepository.getAppointmentsSummary(params, practiceId);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, safeCount(s)])
    );

    const completed = statusMap["COMPLETED"] ?? 0;
    const cancelled = statusMap["CANCELLED"] ?? 0;
    const missed    = statusMap["MISSED"]    ?? 0;
    const noShow    = statusMap["NO_SHOW"]   ?? 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const breakdown: Record<string, number> =
      params.groupBy === "type"
        ? Object.fromEntries(byType.map((t) => [t.type, safeCount(t)]))
        : params.groupBy === "optometrist"
        ? Object.fromEntries(
            byOptometrist.map((o) => [o.optometristId ?? "unassigned", safeCount(o)])
          )
        : statusMap;

    return { total, completed, cancelled, missed, noShow, completionRate, breakdown };
  },

  // ─── Patient demographics ────────────────────────────────────────────────────

  async getPatientDemographics(
    params: PatientDemographicsQuery,
    practiceId: string
  ): Promise<PatientDemographicsSummary> {
    const { total, active, bySex, newThisMonth, newThisYear, keyPatients, patients } =
      await reportsRepository.getPatientDemographics(params, practiceId);

    const sexMap: Record<string, number> = Object.fromEntries(
      bySex.map((s) => [s.sex, safeCount(s)])
    );

    // Age group bucketing
    const ageGroups: Record<string, number> = {
      "0-17":  0,
      "18-30": 0,
      "31-45": 0,
      "46-60": 0,
      "61-75": 0,
      "76+":   0,
    };
    const now = new Date();
    for (const p of patients) {
      const age = now.getFullYear() - p.dob.getFullYear();
      if (age <= 17)      ageGroups["0-17"]++;
      else if (age <= 30) ageGroups["18-30"]++;
      else if (age <= 45) ageGroups["31-45"]++;
      else if (age <= 60) ageGroups["46-60"]++;
      else if (age <= 75) ageGroups["61-75"]++;
      else                ageGroups["76+"]++;
    }

    return {
      total,
      active,
      newThisMonth,
      newThisYear,
      bySex: sexMap,
      byAgeGroup: ageGroups,
      keyPatients,
    };
  },

  // ─── Clinical ────────────────────────────────────────────────────────────────

  async getClinicalReport(params: ClinicalReportQuery, practiceId: string) {
    const { total, byType, complete, prescriptionsCreated } =
      await reportsRepository.getClinicalSummary(params, practiceId);

    const typeBreakdown = Object.fromEntries(byType.map((t) => [t.type, safeCount(t)]));
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

    return {
      total,
      complete,
      completionRate,
      prescriptionsCreated,
      byType: typeBreakdown,
    };
  },

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async getOrdersReport(params: OrdersReportQuery, practiceId: string): Promise<OrdersSummary> {
    const { byStatus, byType, aggregate, orders } =
      await reportsRepository.getOrdersSummary(params, practiceId);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, safeCount(s)])
    );

    return {
      total:      aggregate._count.id        ?? 0,
      pending:    statusMap["PENDING"]        ?? 0,
      inLab:      statusMap["IN_LAB"]         ?? 0,
      ready:      statusMap["READY"]          ?? 0,
      dispensed:  statusMap["DISPENSED"]      ?? 0,
      cancelled:  statusMap["CANCELLED"]      ?? 0,
      totalValue: aggregate._sum.totalAmount  ?? 0,
      breakdown:  Object.fromEntries(byType.map((t) => [t.type, safeCount(t)])),
    };
  },

  // ─── Inventory ───────────────────────────────────────────────────────────────

  async getInventoryReport(
    params: InventoryReportQuery,
    practiceId: string
  ): Promise<InventorySummary> {
    const { items } = await reportsRepository.getInventorySummary(params, practiceId);

    const mapped: InventoryItemReport[] = items.map((item) => ({
      id:           item.id,
      sku:          item.sku,
      name:         item.name,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
      isLow:        item.currentStock <= item.reorderPoint,
      retailPrice:  item.retailPrice,
      stockValue:   item.currentStock * item.costPrice,
      category:     item.category?.name ?? null,
    }));

    const filtered      = params.lowStockOnly ? mapped.filter((i) => i.isLow) : mapped;
    const lowStockItems = mapped.filter((i) => i.isLow).length;
    const totalValue    = mapped.reduce((acc, i) => acc + i.stockValue, 0);

    return {
      totalItems: mapped.length,
      lowStockItems,
      totalValue,
      items: filtered,
    };
  },

  // ─── Staff performance ───────────────────────────────────────────────────────

  async getStaffPerformanceReport(params: StaffPerformanceQuery, practiceId: string) {
    const { users, exams, sales, orders, missedAppts } =
      await reportsRepository.getStaffPerformance(params, practiceId);

    const examMap = Object.fromEntries(
      exams.map((e) => [e.examinedById, safeCount(e)])
    );

    const salesMap = Object.fromEntries(
      sales.map((s) => [
        s.createdById,
        { amount: safeSum(s, "totalAmount"), count: safeCount(s) },
      ])
    );

    const ordersMap = Object.fromEntries(
      orders.map((o) => [o.createdById, safeCount(o)])
    );

    const missedMap = Object.fromEntries(
      missedAppts.map((a) => [a.optometristId, safeCount(a)])
    );

    return users.map((user) => ({
      userId:      user.id,
      name:        user.name,
      role:        user.role,
      examsCount:  examMap[user.id]        ?? 0,
      salesAmount: salesMap[user.id]?.amount ?? 0,
      salesCount:  salesMap[user.id]?.count  ?? 0,
      ordersCount: ordersMap[user.id]      ?? 0,
      missedAppts: missedMap[user.id]      ?? 0,
    }));
  },

  // ─── Recall ──────────────────────────────────────────────────────────────────

  async getRecallReport(params: RecallReportQuery, practiceId: string) {
    return reportsRepository.getRecallSummary(params, practiceId);
  },

  // ─── Debtors ─────────────────────────────────────────────────────────────────

  async getDebtorReport(params: DebtorReportQuery, practiceId: string) {
    const { total, debtors, aggregate } = await reportsRepository.getDebtorReport(
      params,
      practiceId
    );

    return {
      debtors,
      meta: buildPaginationMeta(params.page, params.pageSize, total),
      summary: {
        totalOwed:    aggregate._sum.amount  ?? 0,
        totalPaid:    aggregate._sum.paid    ?? 0,
        totalBalance: aggregate._sum.balance ?? 0,
        debtorCount:  aggregate._count.id   ?? 0,
      },
    };
  },

  // ─── Dashboard KPIs ──────────────────────────────────────────────────────────

  async getDashboard(practiceId: string) {
    return reportsRepository.getDashboardKpis(practiceId);
  },
};

// ─── Private helpers ─────────────────────────────────────────────────────────

function _buildBreakdown(
  sales: { totalAmount: number; vatAmount: number; createdAt: Date }[],
  groupBy: "day" | "week" | "month"
) {
  const map = new Map<string, { revenue: number; vat: number; saleCount: number }>();

  for (const sale of sales) {
    const key      = _periodKey(sale.createdAt, groupBy);
    const existing = map.get(key) ?? { revenue: 0, vat: 0, saleCount: 0 };
    map.set(key, {
      revenue:   existing.revenue   + sale.totalAmount,
      vat:       existing.vat       + sale.vatAmount,
      saleCount: existing.saleCount + 1,
    });
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({ period, ...data }));
}

function _periodKey(date: Date, groupBy: "day" | "week" | "month"): string {
  const d = new Date(date); // avoid mutating the original
  if (groupBy === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (groupBy === "week") {
    // ISO week: start on Monday
    const day  = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().split("T")[0];
  }
  return d.toISOString().split("T")[0];
}