// ============================================================
// VISION ERP - Reports Patients Demographics API Route
// app/api/reports/patients/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { reportsService } from "@/modules/reports/reports.service";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "reports:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const report = await reportsService.getPatientDemographics({}, practiceId);
      return apiSuccess(report);
    } catch {
      return apiServerError();
    }
  });
}