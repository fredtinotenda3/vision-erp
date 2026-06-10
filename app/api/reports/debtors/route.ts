// ============================================================
// VISION ERP - Reports Debtors API Route
// app/api/reports/debtors/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { reportsService } from "@/modules/reports/reports.service";
import { DebtorReportQuerySchema } from "@/modules/reports/reports.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "reports:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = DebtorReportQuerySchema.safeParse({
        status: sp.get("status"),
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const result = await reportsService.getDebtorReport(parsed.data, practiceId);
      return apiSuccess(result.debtors, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}