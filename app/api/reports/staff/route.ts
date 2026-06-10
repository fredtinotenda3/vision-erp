// ============================================================
// VISION ERP - Reports Staff Performance API Route
// app/api/reports/staff/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { reportsService } from "@/modules/reports/reports.service";
import { StaffPerformanceQuerySchema } from "@/modules/reports/reports.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "reports:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = StaffPerformanceQuerySchema.safeParse({
        from: sp.get("from"),
        to: sp.get("to"),
        userId: sp.get("userId"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const report = await reportsService.getStaffPerformanceReport(parsed.data, practiceId);
      return apiSuccess(report);
    } catch {
      return apiServerError();
    }
  });
}