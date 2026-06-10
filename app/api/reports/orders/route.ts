// ============================================================
// VISION ERP - Reports Orders API Route
// app/api/reports/orders/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { reportsService } from "@/modules/reports/reports.service";
import { OrdersReportQuerySchema } from "@/modules/reports/reports.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "reports:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = OrdersReportQuerySchema.safeParse({
        from: sp.get("from"),
        to: sp.get("to"),
        status: sp.get("status"),
        type: sp.get("type"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const report = await reportsService.getOrdersReport(parsed.data, practiceId);
      return apiSuccess(report);
    } catch {
      return apiServerError();
    }
  });
}