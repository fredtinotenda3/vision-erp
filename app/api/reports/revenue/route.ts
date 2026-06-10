// ============================================================
// VISION ERP - Reports Revenue API Route
// app/api/reports/revenue/route.ts
// ------------------------------------------------------------
// FIX: sp.get("paymentMethod") returned `null` for the absent
// optional param, failing RevenueReportQuerySchema's `.optional()`
// and producing a 400. Now normalised (null -> undefined).
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { reportsService } from "@/modules/reports/reports.service";
import { RevenueReportQuerySchema } from "@/modules/reports/reports.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";
import { param } from "@/lib/query-params";

export async function GET(req: NextRequest) {
  return withPermission(req, "reports:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = RevenueReportQuerySchema.safeParse({
        from: param(sp, "from"),
        to: param(sp, "to"),
        groupBy: param(sp, "groupBy"),
        paymentMethod: param(sp, "paymentMethod"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? param(sp, "practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const report = await reportsService.getRevenueReport(parsed.data, practiceId);
      return apiSuccess(report);
    } catch {
      return apiServerError();
    }
  });
}