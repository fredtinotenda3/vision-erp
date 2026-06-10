// ============================================================
// VISION ERP - Reports API service
// services/reports.service.ts
// ============================================================

import { apiClient } from "@/lib/api-client";
import type { DashboardKpis, RevenueSummary, RevenueQuery } from "@/types/dashboard";

export const reportsService = {
  async getDashboard(): Promise<DashboardKpis> {
    const { data } = await apiClient.get<DashboardKpis>("/api/reports");
    return data;
  },

  async getRevenue(query: RevenueQuery): Promise<RevenueSummary> {
    const { data } = await apiClient.get<RevenueSummary>("/api/reports/revenue", {
      from: query.from,
      to: query.to,
      groupBy: query.groupBy,
    });
    return data;
  },
};