// ============================================================
// VISION ERP - Dashboard data hooks (TanStack Query)
// hooks/use-dashboard.ts
// ============================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports.service";
import { toISODate } from "@/lib/format";
import type { RevenueGroupBy } from "@/types/dashboard";

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => reportsService.getDashboard(),
  });
}

export function useRevenueReport(rangeDays = 30, groupBy: RevenueGroupBy = "day") {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (rangeDays - 1));

  const fromStr = toISODate(from);
  const toStr = toISODate(to);

  return useQuery({
    queryKey: ["dashboard", "revenue", fromStr, toStr, groupBy],
    queryFn: () => reportsService.getRevenue({ from: fromStr, to: toStr, groupBy }),
  });
}