// ============================================================
// VISION ERP - Reports API Route (Dashboard KPIs)
// app/api/reports/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { reportsService } from "@/modules/reports/reports.service";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

/**
 * GET /api/reports
 * Returns dashboard KPIs for the authenticated practice.
 */
export async function GET(req: NextRequest) {
  return withPermission(req, "reports:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const kpis = await reportsService.getDashboard(practiceId);
      return apiSuccess(kpis);
    } catch {
      return apiServerError();
    }
  });
}